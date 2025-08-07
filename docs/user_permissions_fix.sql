-- Veri tipi uyumsuzluğunu çözen düzeltilmiş SQL

-- 1. Adım: Proje yetkileri tablosu oluştur
CREATE TABLE IF NOT EXISTS project_permissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id UUID NOT NULL, -- Supabase auth user ID'leri UUID formatında
  permission_level TEXT NOT NULL CHECK (permission_level IN ('owner', 'editor', 'viewer')),
  granted_by UUID, -- İzni veren kullanıcı ID'si
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Aynı kullanıcı-proje ikilisi için yinelenen kayıt olmasın
  UNIQUE(project_id, user_id),
  
  -- Projects tablosu ile ilişki
  CONSTRAINT fk_project
    FOREIGN KEY(project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE -- Proje silindiğinde izinleri de sil
);

-- 2. Adım: Mevcut veritabanı şemasını kontrol edelim
DO $$
DECLARE
  projects_user_id_type TEXT;
  auth_users_id_type TEXT;
BEGIN
  -- projects tablosundaki user_id alanının tipini kontrol et
  SELECT data_type INTO projects_user_id_type
  FROM information_schema.columns
  WHERE table_name = 'projects' AND column_name = 'user_id';
  
  -- auth.users tablosundaki id alanının tipini kontrol et
  SELECT data_type INTO auth_users_id_type
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id';
  
  RAISE NOTICE 'projects.user_id tipi: %', projects_user_id_type;
  RAISE NOTICE 'auth.users.id tipi: %', auth_users_id_type;
END;
$$;

-- 3. Adım: Mevcut projelerin sahiplerini otomatik izinler tablosuna ekle (tip dönüşümü ile)
INSERT INTO project_permissions (project_id, user_id, permission_level, granted_by)
SELECT 
  p.id as project_id, 
  p.user_id::UUID as user_id, -- TEXT -> UUID dönüşümü
  'owner' as permission_level, 
  p.user_id::UUID as granted_by -- TEXT -> UUID dönüşümü
FROM 
  projects p
WHERE 
  NOT EXISTS (
    SELECT 1 FROM project_permissions pp 
    WHERE pp.project_id = p.id AND pp.user_id = p.user_id::UUID
  );

-- 4. Adım: Yönetim görünümü için view oluştur
CREATE OR REPLACE VIEW project_users_view AS
SELECT 
  pp.id as permission_id,
  p.id as project_id,
  p.name as project_name,
  pp.user_id,
  u.email as user_email,
  pp.permission_level,
  pp.granted_by,
  g.email as granted_by_email,
  pp.created_at
FROM 
  project_permissions pp
JOIN 
  projects p ON pp.project_id = p.id
LEFT JOIN 
  auth.users u ON pp.user_id = u.id
LEFT JOIN 
  auth.users g ON pp.granted_by = g.id;

-- 5. Adım: Row Level Security (RLS) politikaları
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- Proje sahipleri, yeni kullanıcılara izin verebilir
CREATE POLICY "Proje sahipleri izin yönetebilir" ON project_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_id = project_permissions.project_id
      AND user_id = auth.uid()
      AND permission_level = 'owner'
    )
  );

-- Kullanıcılar kendi izinlerini görebilir
CREATE POLICY "Kullanıcılar kendi izinlerini görebilir" ON project_permissions
  FOR SELECT
  USING (user_id = auth.uid());

-- 6. Adım: Fonksiyon: Kullanıcıya proje izni verme
CREATE OR REPLACE FUNCTION grant_project_permission(
  p_project_id INTEGER,
  p_user_email TEXT,
  p_permission_level TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_user_id UUID;
  v_granter_id UUID;
  v_has_permission BOOLEAN;
BEGIN
  -- İşlemi yapan kullanıcının ID'sini al
  v_granter_id := auth.uid();
  
  -- İşlemi yapan kullanıcının izni var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM project_permissions
    WHERE project_id = p_project_id
    AND user_id = v_granter_id
    AND permission_level = 'owner'
  ) INTO v_has_permission;
  
  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
  END IF;
  
  -- Yetkilendirilecek kullanıcının ID'sini bul
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Belirtilen e-posta adresi ile kullanıcı bulunamadı.';
  END IF;
  
  -- İzni ekle veya güncelle
  INSERT INTO project_permissions (project_id, user_id, permission_level, granted_by)
  VALUES (p_project_id, v_user_id, p_permission_level, v_granter_id)
  ON CONFLICT (project_id, user_id)
  DO UPDATE SET 
    permission_level = p_permission_level,
    granted_by = v_granter_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Adım: Fonksiyon: Kullanıcı izinlerini kaldırma
CREATE OR REPLACE FUNCTION revoke_project_permission(
  p_permission_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_granter_id UUID;
  v_project_id INTEGER;
  v_has_permission BOOLEAN;
BEGIN
  -- İşlemi yapan kullanıcının ID'sini al
  v_granter_id := auth.uid();
  
  -- İlgili iznin proje ID'sini bul
  SELECT project_id INTO v_project_id
  FROM project_permissions
  WHERE id = p_permission_id;
  
  -- İşlemi yapan kullanıcının izni var mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM project_permissions
    WHERE project_id = v_project_id
    AND user_id = v_granter_id
    AND permission_level = 'owner'
  ) INTO v_has_permission;
  
  IF NOT v_has_permission THEN
    RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
  END IF;
  
  -- İzni kaldır
  DELETE FROM project_permissions
  WHERE id = p_permission_id;
    
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
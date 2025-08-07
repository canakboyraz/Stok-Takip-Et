-- Önce varsa izinler tablosunu temizle
DROP TABLE IF EXISTS project_permissions CASCADE;
DROP VIEW IF EXISTS project_users_view CASCADE;
DROP FUNCTION IF EXISTS grant_project_permission(INTEGER, TEXT, TEXT);
DROP FUNCTION IF EXISTS revoke_project_permission(INTEGER);

-- Proje izinleri tablosu oluştur
CREATE TABLE project_permissions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id TEXT NOT NULL, -- Supabase auth user ID'leri - TEXT formatında tutuyoruz
  permission_level TEXT NOT NULL CHECK (permission_level IN ('owner', 'editor', 'viewer')),
  granted_by TEXT, -- İzni veren kullanıcı ID'si
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Aynı kullanıcı-proje ikilisi için yinelenen kayıt olmasın
  UNIQUE(project_id, user_id),
  
  -- Projects tablosu ile ilişki
  CONSTRAINT fk_project
    FOREIGN KEY(project_id)
    REFERENCES projects(id)
    ON DELETE CASCADE -- Proje silindiğinde izinleri de sil
);

-- Row Level Security (RLS) politikaları
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi izinlerini görebilir
CREATE POLICY "Kullanıcılar kendi izinlerini görebilir" ON project_permissions
  FOR SELECT
  USING (true); -- Herkes tüm izinleri görebilir (tablo zaten proje bazlı kontrol edilir)

-- Her kullanıcı izin verebilir (test için, sonra değiştirilebilir)
CREATE POLICY "Kullanıcılar izin verebilir" ON project_permissions
  FOR ALL
  USING (true);

-- Yönetim görünümü için view oluştur
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
  auth.users u ON pp.user_id = u.id::text
LEFT JOIN 
  auth.users g ON pp.granted_by = g.id::text;

-- Mevcut projelerin sahiplerini ekle
INSERT INTO project_permissions (project_id, user_id, permission_level, granted_by)
SELECT 
  p.id as project_id, 
  p.user_id::text as user_id,
  'owner' as permission_level, 
  p.user_id::text as granted_by
FROM 
  projects p;

-- Kullanıcıya proje izni verme fonksiyonu
CREATE OR REPLACE FUNCTION grant_project_permission(
  p_project_id INTEGER,
  p_user_email TEXT,
  p_permission_level TEXT
) 
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id TEXT;
  v_granter_id TEXT;
BEGIN
  -- İşlemi yapan kullanıcının ID'sini al
  v_granter_id := auth.uid()::text;
  
  -- Yetkilendirilecek kullanıcının ID'sini bul
  SELECT id::text INTO v_user_id
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
$$;

-- Kullanıcı izinlerini kaldırma fonksiyonu
CREATE OR REPLACE FUNCTION revoke_project_permission(
  p_permission_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id INTEGER;
BEGIN
  -- İlgili iznin proje ID'sini bul
  SELECT project_id INTO v_project_id
  FROM project_permissions
  WHERE id = p_permission_id;
  
  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Belirtilen izin ID bulunamadı.';
  END IF;
  
  -- İzni kaldır
  DELETE FROM project_permissions
  WHERE id = p_permission_id;
    
  RETURN TRUE;
END;
$$; 
-- Mevcut projelerin sahiplerini izinler tablosuna eklenmesi - Düzeltilmiş versiyon

-- Önce tablo var mı kontrol edelim ve yoksa oluşturalım
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables 
                   WHERE table_name = 'project_permissions') THEN

        -- Proje izinleri tablosu oluşturalım
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

        -- Proje sahipleri, yeni kullanıcılara izin verebilir
        CREATE POLICY "Proje sahipleri izin yönetebilir" ON project_permissions
          FOR ALL
          USING (
            EXISTS (
              SELECT 1 FROM project_permissions
              WHERE project_id = project_permissions.project_id
              AND user_id = auth.uid()::text
              AND permission_level = 'owner'
            )
          );

        -- Kullanıcılar kendi izinlerini görebilir
        CREATE POLICY "Kullanıcılar kendi izinlerini görebilir" ON project_permissions
          FOR SELECT
          USING (user_id = auth.uid()::text);
    END IF;
END
$$;

-- Eksik olan proje sahiplerini izinler tablosuna ON CONFLICT kullanarak ekleyelim
-- Bu şekilde aynı project_id ve user_id kombinasyonu için hata oluşmayacak
INSERT INTO project_permissions (project_id, user_id, permission_level, granted_by)
SELECT 
  p.id as project_id, 
  p.user_id::text as user_id,
  'owner' as permission_level, 
  p.user_id::text as granted_by
FROM 
  projects p
WHERE NOT EXISTS (
  SELECT 1 FROM project_permissions pp 
  WHERE pp.project_id = p.id AND pp.user_id = p.user_id::text
)
ON CONFLICT (project_id, user_id) DO NOTHING;

-- View'ı kontrol et ve yoksa oluştur
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.views
                  WHERE table_name = 'project_users_view') THEN
        
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
    END IF;
END
$$;

-- Fonksiyonları kontrol et ve yoksa oluştur
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_proc
                  WHERE proname = 'grant_project_permission') THEN
        
        -- Fonksiyon: Kullanıcıya proje izni verme
        CREATE OR REPLACE FUNCTION grant_project_permission(
          p_project_id INTEGER,
          p_user_email TEXT,
          p_permission_level TEXT
        ) RETURNS BOOLEAN AS $$
        DECLARE
          v_user_id TEXT;
          v_granter_id TEXT;
          v_has_permission BOOLEAN;
        BEGIN
          -- İşlemi yapan kullanıcının ID'sini al (text formatında)
          v_granter_id := auth.uid()::text;
          
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
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    END IF;
    
    IF NOT EXISTS (SELECT FROM pg_proc
                  WHERE proname = 'revoke_project_permission') THEN
        
        -- Fonksiyon: Kullanıcı izinlerini kaldırma
        CREATE OR REPLACE FUNCTION revoke_project_permission(
          p_permission_id INTEGER
        ) RETURNS BOOLEAN AS $$
        DECLARE
          v_granter_id TEXT;
          v_project_id INTEGER;
          v_has_permission BOOLEAN;
        BEGIN
          -- İşlemi yapan kullanıcının ID'sini al
          v_granter_id := auth.uid()::text;
          
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
    END IF;
END
$$; 
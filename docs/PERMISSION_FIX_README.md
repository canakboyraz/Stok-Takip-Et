# Proje İzinleri Sorunu Çözümü

Bu dokümanda, proje paylaşım izinlerindeki sorunun çözümü adım adım anlatılmaktadır.

## Sorun Nedir?

Proje izinleri ile ilgili aşağıdaki sorunlar tespit edilmiştir:

1. Duplicate (tekrarlanan) RLS politikası hatası: `ERROR: 42710: policy "Kullanıcılar kendi izinlerini görebilir" for table "project_permissions" already exists`
2. Paylaşılan projeler karşı tarafta görüntülenemiyor
3. İzinler kaydediliyor fakat etkili olmuyor

## Çözüm

Aşağıdaki SQL komutları bu sorunları çözecektir. Bu komutları Supabase SQL editöründe çalıştırın:

1. Supabase kontrol paneline giriş yapın
2. Sol menüden "SQL Editor" seçeneğine tıklayın
3. Aşağıdaki SQL kodunu kopyalayıp yapıştırın ve çalıştırın

```sql
-- Mevcut politikaları sil
DROP POLICY IF EXISTS "Kullanıcılar kendi izinlerini görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar izin verebilir" ON project_permissions;
DROP POLICY IF EXISTS "Proje sahipleri izin yönetebilir" ON project_permissions;

-- Doğru politikaları oluştur
-- Tüm kullanıcıların tüm izinleri görmesine izin ver (paylaşılan proje listesinin çalışması için gerekli)
CREATE POLICY "Kullanıcılar tüm izinleri görebilir" ON project_permissions
    FOR SELECT
    USING (true);

-- Kullanıcıların yalnızca proje sahipleri ise ekleme/güncelleme/silme yapmasına izin ver
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

-- View'ı güncelle
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

-- İzin verme fonksiyonunu güncelle
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
    v_has_permission BOOLEAN;
BEGIN
    -- İzin veren kişinin ID'sini al
    v_granter_id := auth.uid()::text;
    
    -- İzin verenin owner yetkisi var mı kontrol et
    SELECT EXISTS (
        SELECT 1 FROM project_permissions
        WHERE project_id = p_project_id
        AND user_id = v_granter_id
        AND permission_level = 'owner'
    ) INTO v_has_permission;
    
    IF NOT v_has_permission THEN
        RAISE EXCEPTION 'Bu işlem için yetkiniz yok.';
    END IF;
    
    -- E-posta ile kullanıcı ID'sini bul
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

-- İzin kaldırma fonksiyonunu güncelle
CREATE OR REPLACE FUNCTION revoke_project_permission(
    p_permission_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_granter_id TEXT;
    v_project_id INTEGER;
    v_has_permission BOOLEAN;
BEGIN
    -- İzni kaldıran kişinin ID'sini al
    v_granter_id := auth.uid()::text;
    
    -- Bu izin için proje ID'sini bul
    SELECT project_id INTO v_project_id
    FROM project_permissions
    WHERE id = p_permission_id;
    
    IF v_project_id IS NULL THEN
        RAISE EXCEPTION 'Belirtilen izin ID bulunamadı.';
    END IF;
    
    -- Kullanıcının bu proje için owner yetkisi var mı kontrol et
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
$$;
```

## Kontrol Etme

Bu SQL kodunu çalıştırdıktan sonra:

1. Uygulamada bir proje seçin
2. "İzinler" butonuna tıklayın
3. Başka bir kullanıcının e-posta adresini girin ve izin seviyesini seçin (örneğin: "Görüntüleyici")
4. "Ekle" butonuna tıklayın
5. Diğer kullanıcı hesabıyla giriş yapın ve paylaşılan projenin görüntülenip görüntülenmediğini kontrol edin

## Hata Ayıklama

Eğer sorun devam ederse:

1. Tarayıcı konsolunda hata mesajlarını kontrol edin
2. Supabase logs panelinde hataları kontrol edin
3. Aşağıdaki sorguyu Supabase SQL Editor'da çalıştırarak izinlerin doğru kaydedilip kaydedilmediğini kontrol edin:

```sql
SELECT * FROM project_permissions;
SELECT * FROM project_users_view;
``` 
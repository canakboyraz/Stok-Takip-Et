-- ====================================================================
-- KRİTİK TABLO İSİM UYUMSUZLUĞI DÜZELTMESİ
-- project_users vs project_permissions sorunu
-- ====================================================================

-- 1. Mevcut durumu kontrol et
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('project_users', 'project_permissions')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 2. Eğer project_users tablosu yoksa, project_permissions'dan view oluştur
CREATE OR REPLACE VIEW project_users AS
SELECT 
    id,
    project_id,
    user_id,
    permission_level as permission_level,
    granted_by,
    created_at
FROM project_permissions;

-- 3. Alternatif: project_users tablosunu project_permissions'a yönlendir
-- Bu sayede frontend kodları değiştirilmeden çalışır

-- 4. View için RLS politikası (gerekirse)
-- Views otomatik olarak altta yatan tablonun RLS politikalarını kullanır

-- 5. Kontrol sorgusu
SELECT 
    'project_users' as table_type,
    COUNT(*) as record_count
FROM project_users
UNION ALL
SELECT 
    'project_permissions' as table_type,
    COUNT(*) as record_count
FROM project_permissions;

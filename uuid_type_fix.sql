-- ====================================================================
-- UUID TİP UYUMSUZLUĞI DÜZELTMESİ
-- Bu SQL sadece tip uyumsuzluğu sorunlarını çözer
-- ====================================================================

-- Önce hangi tablolarda user_id UUID tipinde olduğunu kontrol edelim
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE column_name = 'user_id' 
AND table_schema = 'public'
ORDER BY table_name;

-- Activities tablosu için özel kontrol
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'activities' 
AND column_name = 'user_id'
AND table_schema = 'public';

-- Projects tablosu için özel kontrol  
SELECT 
    table_name,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'user_id'
AND table_schema = 'public';

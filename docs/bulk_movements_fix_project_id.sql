-- bulk_movements tablosuna project_id sütununu ekleme

-- Önce project_id sütununun varlığını kontrol et
DO $$
BEGIN
    -- project_id sütunu var mı kontrol et
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'project_id'
    ) THEN
        -- Eğer project_id sütunu yoksa, ekleyin
        ALTER TABLE bulk_movements ADD COLUMN project_id INTEGER;
        RAISE NOTICE 'project_id sütunu eklendi';
    ELSE 
        RAISE NOTICE 'project_id sütunu zaten var';
    END IF;
END
$$;

-- Tablo sütunlarını kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bulk_movements'
ORDER BY ordinal_position;

-- bulk_movements tablosundaki tüm kayıtları görüntüle
SELECT * FROM bulk_movements; 
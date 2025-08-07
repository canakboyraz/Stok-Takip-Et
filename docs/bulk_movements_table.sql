-- bulk_movements tablosunu oluşturma veya güncelleme SQL scripti

-- 1. Adım: bulk_movements tablosunun varlığını kontrol et
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements'
    ) THEN
        -- Tablo yoksa oluştur
        CREATE TABLE bulk_movements (
            id BIGINT PRIMARY KEY,
            date TIMESTAMP WITH TIME ZONE NOT NULL,
            notes TEXT,  -- Not sütunu
            type TEXT NOT NULL CHECK (type IN ('in', 'out')),
            project_id INTEGER NOT NULL
        );
        
        RAISE NOTICE 'bulk_movements tablosu oluşturuldu';
    ELSE
        RAISE NOTICE 'bulk_movements tablosu zaten var';
    END IF;
END
$$;

-- 2. Adım: Eğer tablo varsa notes alanının varlığını kontrol et
DO $$
BEGIN
    -- notes sütunu var mı kontrol et
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'notes'
    ) THEN
        -- Eğer notes sütunu yoksa, ekleyin
        ALTER TABLE bulk_movements ADD COLUMN notes TEXT;
        RAISE NOTICE 'notes sütunu eklendi';
    ELSE 
        RAISE NOTICE 'notes sütunu zaten var';
    END IF;
    
    -- note sütunu var mı kontrol et (yanlış yazılmış olabilir)
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'note'
    ) THEN
        -- note sütunu varsa, içeriğini notes sütununa taşı
        UPDATE bulk_movements SET notes = note WHERE notes IS NULL AND note IS NOT NULL;
        
        -- Eski sütunu kaldır
        ALTER TABLE bulk_movements DROP COLUMN note;
        RAISE NOTICE 'note sütunu notes olarak değiştirildi ve veri aktarıldı';
    END IF;
END
$$;

-- 3. Adım: Kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bulk_movements'
ORDER BY ordinal_position; 
-- Önce stock_movements tablosunda is_bulk ve bulk_id sütunlarının varlığını kontrol et
-- Eğer yoksa ekle
DO $$
BEGIN
    -- is_bulk sütununu kontrol et ve yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'is_bulk') THEN
        ALTER TABLE stock_movements ADD COLUMN is_bulk BOOLEAN DEFAULT FALSE;
    END IF;

    -- bulk_id sütununu kontrol et ve yoksa ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'stock_movements' AND column_name = 'bulk_id') THEN
        ALTER TABLE stock_movements ADD COLUMN bulk_id BIGINT DEFAULT NULL;
    END IF;
END
$$;

-- Eğer products tablosunda unit_price yoksa ekle
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'products' AND column_name = 'unit_price') THEN
        ALTER TABLE products ADD COLUMN unit_price NUMERIC DEFAULT NULL;
        
        -- unit_price değerlerini price değerlerinden kopyala
        UPDATE products SET unit_price = price WHERE unit_price IS NULL;
    END IF;
END
$$;

-- Tüm unit_price değerlerinin doğru şekilde ayarlandığından emin ol
UPDATE products SET unit_price = price WHERE unit_price IS NULL OR unit_price = 0;

-- Veritabanı değişikliklerini kontrol et
SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'stock_movements' 
ORDER BY 
    ordinal_position;

SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'products' 
ORDER BY 
    ordinal_position; 
-- bulk_movements tablosunu baştan oluşturma

-- Önce mevcut tabloyu yedekle (varsa)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements'
    ) THEN
        CREATE TABLE IF NOT EXISTS bulk_movements_backup AS SELECT * FROM bulk_movements;
        RAISE NOTICE 'bulk_movements tablosu yedeklendi';
    END IF;
END
$$;

-- Mevcut tabloyu kaldır
DROP TABLE IF EXISTS bulk_movements;

-- Tabloyu yeniden oluştur
CREATE TABLE bulk_movements (
    id BIGINT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,  -- Not sütunu
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    project_id INTEGER NOT NULL
);

-- Yedekteki verileri geri yükle (eğer yedek varsa)
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements_backup'
    ) THEN
        -- Eski verilerden sadece uyumlu olanları geri yükle
        INSERT INTO bulk_movements (id, date, notes, type, project_id)
        SELECT 
            id, 
            date, 
            COALESCE(notes, note, 'Otomatik geçiş') as notes, -- note veya notes sütunundan al
            type, 
            COALESCE(project_id, 1) as project_id -- project_id yoksa 1 yap (dikkat: varsayılan projeye göre değiştirin)
        FROM bulk_movements_backup;
        
        RAISE NOTICE 'Veriler geri yüklendi';
    END IF;
END
$$;

-- Tabloyu kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bulk_movements'
ORDER BY ordinal_position;

-- İlk birkaç satırı görüntüle
SELECT * FROM bulk_movements LIMIT 5; 
-- bulk_movements tablosunu tamamen sıfırdan oluşturma

-- 1. Adım: Tabloyu kontrol et ve tamamen yeniden oluştur
DROP TABLE IF EXISTS bulk_movements;

-- 2. Adım: Tabloyu doğru şekilde oluştur
CREATE TABLE bulk_movements (
    id BIGINT PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- 'note' değil 'notes' olmalı
    type VARCHAR(10) CHECK (type IN ('in', 'out')), -- type sütunu
    project_id INTEGER
);

-- 3. Adım: Örnek kayıt ekle (test için)
INSERT INTO bulk_movements (id, date, notes, type, project_id)
VALUES (
    EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::bigint, -- Unix timestamp olarak benzersiz ID oluştur
    CURRENT_TIMESTAMP, -- Şu anki tarih/saat
    'Test kaydı', -- Test notu
    'out', -- Çıkış tipi
    1 -- Varsayılan proje ID (değiştirilebilir)
);

-- 4. Adım: Tabloyu kontrol et
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bulk_movements'
ORDER BY ordinal_position;

-- 5. Adım: Veriyi kontrol et
SELECT * FROM bulk_movements; 
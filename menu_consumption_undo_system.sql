-- Menü Tüketim Geri Alma Sistemi için Database Güncellemeleri

-- 1. bulk_movements tablosuna geri alma alanları ekle
DO $$
BEGIN
    -- is_reversed alanı - işlem geri alındı mı?
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'is_reversed'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN is_reversed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'is_reversed sütunu eklendi';
    END IF;

    -- reversed_at alanı - ne zaman geri alındı?
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'reversed_at'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN reversed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'reversed_at sütunu eklendi';
    END IF;

    -- reversed_by alanı - kim geri aldı?
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'reversed_by'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN reversed_by UUID;
        RAISE NOTICE 'reversed_by sütunu eklendi';
    END IF;

    -- reversal_reason alanı - geri alma nedeni
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'reversal_reason'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN reversal_reason TEXT;
        RAISE NOTICE 'reversal_reason sütunu eklendi';
    END IF;

    -- operation_type alanı - işlem türü (menu_consumption, bulk_out, vb.)
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'operation_type'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN operation_type TEXT DEFAULT 'bulk_out';
        RAISE NOTICE 'operation_type sütunu eklendi';
    END IF;

    -- user_id alanı - işlemi yapan kullanıcı
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN user_id UUID;
        RAISE NOTICE 'user_id sütunu eklendi';
    END IF;

    -- can_be_reversed alanı - geri alınabilir mi?
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'bulk_movements' 
        AND column_name = 'can_be_reversed'
    ) THEN
        ALTER TABLE bulk_movements ADD COLUMN can_be_reversed BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'can_be_reversed sütunu eklendi';
    END IF;
END
$$;

-- 2. stock_movements tablosuna geri alma alanları ekle
DO $$
BEGIN
    -- is_reversed alanı
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements' 
        AND column_name = 'is_reversed'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN is_reversed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'stock_movements.is_reversed sütunu eklendi';
    END IF;

    -- reversed_at alanı
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements' 
        AND column_name = 'reversed_at'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN reversed_at TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'stock_movements.reversed_at sütunu eklendi';
    END IF;

    -- reversed_by alanı
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'stock_movements' 
        AND column_name = 'reversed_by'
    ) THEN
        ALTER TABLE stock_movements ADD COLUMN reversed_by UUID;
        RAISE NOTICE 'stock_movements.reversed_by sütunu eklendi';
    END IF;
END
$$;

-- 3. Geri alınabilir işlemler için view oluştur
CREATE OR REPLACE VIEW reversible_operations AS
SELECT 
    bm.id as bulk_id,
    bm.date,
    bm.notes,
    bm.type,
    bm.project_id,
    bm.user_id,
    bm.operation_type,
    bm.is_reversed,
    bm.reversed_at,
    bm.reversed_by,
    bm.reversal_reason,
    bm.can_be_reversed,
    -- Son 24 saat içinde mi?
    (bm.date > NOW() - INTERVAL '24 hours') as is_within_24h,
    -- Toplam ürün sayısı
    COUNT(sm.id) as total_items,
    -- Toplam maliyet (yaklaşık)
    SUM(sm.quantity * COALESCE(p.price, 0)) as estimated_cost
FROM bulk_movements bm
LEFT JOIN stock_movements sm ON sm.bulk_id::text = bm.id::text 
    AND sm.is_reversed = FALSE
LEFT JOIN products p ON p.id = sm.product_id
WHERE bm.is_reversed = FALSE 
    AND bm.can_be_reversed = TRUE
    AND bm.operation_type IN ('menu_consumption', 'bulk_out')
GROUP BY 
    bm.id, bm.date, bm.notes, bm.type, bm.project_id, 
    bm.user_id, bm.operation_type, bm.is_reversed, 
    bm.reversed_at, bm.reversed_by, bm.reversal_reason, bm.can_be_reversed
ORDER BY bm.date DESC;

-- 4. RLS politikaları güncelle
DROP POLICY IF EXISTS "Kullanıcılar kendi proje bulk_movements kayıtlarını görüntüleyebilir" ON bulk_movements;
CREATE POLICY "Kullanıcılar kendi proje bulk_movements kayıtlarını görüntüleyebilir" ON bulk_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id::text = bulk_movements.project_id::text
      AND project_permissions.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Kullanıcılar kendi proje bulk_movements kayıtları ekleyebilir" ON bulk_movements;
CREATE POLICY "Kullanıcılar kendi proje bulk_movements kayıtları ekleyebilir" ON bulk_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id::text = bulk_movements.project_id::text
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

DROP POLICY IF EXISTS "Kullanıcılar kendi proje bulk_movements kayıtlarını güncelleyebilir" ON bulk_movements;
CREATE POLICY "Kullanıcılar kendi proje bulk_movements kayıtlarını güncelleyebilir" ON bulk_movements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id::text = bulk_movements.project_id::text
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- 5. Kontrol sorguları
SELECT 'bulk_movements tablosu' as tablo, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'bulk_movements'
AND column_name IN ('is_reversed', 'reversed_at', 'reversed_by', 'reversal_reason', 'operation_type', 'user_id', 'can_be_reversed')

UNION ALL

SELECT 'stock_movements tablosu' as tablo, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'stock_movements'
AND column_name IN ('is_reversed', 'reversed_at', 'reversed_by')

ORDER BY tablo, column_name;

-- 6. Test verisi oluştur (isteğe bağlı)
/*
INSERT INTO bulk_movements (id, date, notes, type, project_id, user_id, operation_type, can_be_reversed)
VALUES (
    EXTRACT(EPOCH FROM NOW())::bigint,
    NOW(),
    'Test menü tüketimi - 50 kişi',
    'out',
    1,
    auth.uid(),
    'menu_consumption',
    TRUE
);
*/

RAISE NOTICE '✅ Menü tüketim geri alma sistemi database güncellemeleri tamamlandı!';

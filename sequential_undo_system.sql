-- Sıralı Geri Alma Sistemi - LIFO Mantığı
-- Sadece en son işlem geri alınabilir

-- 1. Mevcut view'u güncelle
DROP VIEW IF EXISTS reversible_operations;

CREATE OR REPLACE VIEW reversible_operations AS
WITH ranked_operations AS (
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
    -- Toplam ürün sayısı
    COUNT(sm.id) as total_items,
    -- Toplam maliyet (yaklaşık)
    SUM(sm.quantity * COALESCE(p.price, 0)) as estimated_cost,
    -- Her proje için işlem sırasını belirle (en yeni = 1)
    ROW_NUMBER() OVER (
      PARTITION BY bm.project_id 
      ORDER BY bm.date DESC, bm.id DESC
    ) as operation_rank
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
)
SELECT 
  bulk_id,
  date,
  notes,
  type,
  project_id,
  user_id,
  operation_type,
  is_reversed,
  reversed_at,
  reversed_by,
  reversal_reason,
  can_be_reversed,
  total_items,
  estimated_cost,
  operation_rank,
  -- Sadece en son işlem (rank = 1) geri alınabilir
  CASE 
    WHEN operation_rank = 1 THEN TRUE 
    ELSE FALSE 
  END as can_undo_now,
  -- Durum açıklaması
  CASE 
    WHEN operation_rank = 1 THEN 'Geri Alınabilir'
    ELSE 'Sırada Bekliyor (Önce #' || (operation_rank - 1) || ' geri alınmalı)'
  END as undo_status
FROM ranked_operations
ORDER BY project_id, date DESC;

-- 2. Test sorgusu
-- Her projedeki geri alınabilir işlemleri göster
SELECT 
  project_id,
  bulk_id,
  notes,
  date,
  operation_rank,
  can_undo_now,
  undo_status
FROM reversible_operations
ORDER BY project_id, operation_rank;

-- 3. Kontrol fonksiyonu - bir işlemin geri alınıp alınamayacağını kontrol eder
CREATE OR REPLACE FUNCTION can_reverse_operation(
  p_bulk_id BIGINT,
  p_project_id INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  can_reverse BOOLEAN := FALSE;
BEGIN
  -- İşlemin geri alınabilir olup olmadığını kontrol et
  SELECT can_undo_now INTO can_reverse
  FROM reversible_operations
  WHERE bulk_id = p_bulk_id 
    AND project_id = p_project_id
    AND is_reversed = FALSE;
  
  RETURN COALESCE(can_reverse, FALSE);
END;
$$;

-- 4. RLS politikalarını güncelle (gerekirse)
-- View zaten mevcut RLS politikalarını kullanacak

-- 5. Test verileri oluştur (isteğe bağlı)
/*
-- Test için birkaç bulk operation ekle
INSERT INTO bulk_movements (id, date, notes, type, project_id, user_id, operation_type, can_be_reversed)
VALUES 
  (1001, NOW() - INTERVAL '3 hours', 'Test menü tüketimi 1 - 30 kişi', 'out', 1, auth.uid(), 'menu_consumption', TRUE),
  (1002, NOW() - INTERVAL '2 hours', 'Test menü tüketimi 2 - 50 kişi', 'out', 1, auth.uid(), 'menu_consumption', TRUE),
  (1003, NOW() - INTERVAL '1 hour', 'Test menü tüketimi 3 - 25 kişi', 'out', 1, auth.uid(), 'menu_consumption', TRUE);
*/

-- Son kontrol mesajı
DO $$
BEGIN
    RAISE NOTICE '✅ Sıralı geri alma sistemi (LIFO) başarıyla güncellendi!';
    RAISE NOTICE '📋 Sadece en son işlem geri alınabilir';
    RAISE NOTICE '🔄 Zaman sınırı kaldırıldı';
    RAISE NOTICE '⚡ Güvenli sıralı işlem mantığı aktif';
END
$$;

-- Tarif maliyetlerini güncelleme SQL betiği
-- Bu betik, tariflerdeki malzemelerin fiyatlarını güncelleyerek toplam tarif maliyetini yeniden hesaplar

-- Adım 1: Her bir tarif için tekrar porsiyon başına maliyet hesaplaması yapalım
CREATE OR REPLACE FUNCTION update_recipe_costs() RETURNS void AS $$
DECLARE
    rec RECORD;
    recipe_total_cost NUMERIC;
    recipe_serving_size INTEGER;
BEGIN
    -- Tüm tarifleri döngüyle işleyelim
    FOR rec IN 
        SELECT id FROM recipes
    LOOP
        -- Tarif malzemelerinin toplam maliyetini hesapla
        SELECT 
            COALESCE(SUM(ri.quantity * p.price), 0) AS cost,
            r.serving_size
        INTO recipe_total_cost, recipe_serving_size
        FROM recipe_ingredients ri
        JOIN products p ON ri.product_id = p.id
        JOIN recipes r ON ri.recipe_id = r.id
        WHERE ri.recipe_id = rec.id
        GROUP BY r.serving_size;
        
        -- Porsiyon başına maliyeti hesapla (0'a bölme hatasını engelle)
        IF recipe_serving_size IS NULL OR recipe_serving_size = 0 THEN
            recipe_serving_size := 1;  -- Varsayılan porsiyon sayısı 1 olsun
        END IF;
        
        -- Tarif maliyetini güncelle (updated_at alanı olmadığı için kaldırıldı)
        UPDATE recipes
        SET cost_per_serving = recipe_total_cost / recipe_serving_size
        WHERE id = rec.id;
        
        RAISE NOTICE 'Tarif ID: %, Yeni maliyet: %', rec.id, (recipe_total_cost / recipe_serving_size);
    END LOOP;
    
    RAISE NOTICE 'Tüm tarif maliyetleri güncellendi.';
END;
$$ LANGUAGE plpgsql;

-- Fonksiyonu çalıştır
SELECT update_recipe_costs();

-- NOT: Bu SQL betiğini Supabase SQL editöründe çalıştırın.
-- Betik, tariflerin maliyetlerini güncel ürün fiyatlarına göre tekrar hesaplayacaktır. 
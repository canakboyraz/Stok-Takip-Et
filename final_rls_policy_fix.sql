-- ====================================================================
-- FİNAL RLS POLİTİKA DÜZELTMESİ
-- Tüm tespit edilen sorunların kesin çözümü
-- ====================================================================

-- ====================================================================
-- PHASE 1: TÜM MEVCUT POLİTİKALARI TEMİZLE
-- ====================================================================

-- Project permissions politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi izinlerini görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar izin verebilir" ON project_permissions;
DROP POLICY IF EXISTS "Proje sahipleri izin yönetebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar tüm izinleri görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Herkes tüm izinleri görüntüleyebilir" ON project_permissions;
DROP POLICY IF EXISTS "Proje sahipleri izin ekleyebilir ve yönetebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar kendi sahiplik kaydını silemez" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar ilgili oldukları izinleri görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Sadece proje sahipleri izin verebilir" ON project_permissions;
DROP POLICY IF EXISTS "Sadece proje sahipleri izin güncelleyebilir" ON project_permissions;
DROP POLICY IF EXISTS "Sadece proje sahipleri izin silebilir" ON project_permissions;

-- Projects politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini görüntüleyebilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini oluşturabilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini güncelleyebilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini silebilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar erişimli projelerini görüntüleyebilir" ON projects;
DROP POLICY IF EXISTS "Proje sahipleri projelerini güncelleyebilir" ON projects;
DROP POLICY IF EXISTS "Sadece proje sahipleri projelerini silebilir" ON projects;

-- Products politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki ürünleri görüntüleyebilir" ON products;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine ürün ekleyebilir" ON products;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki ürünleri güncelleyebilir" ON products;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki ürünleri silebilir" ON products;

-- Categories politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki kategorileri görüntüleyebilir" ON categories;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine kategori ekleyebilir" ON categories;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki kategorileri güncelleyebilir" ON categories;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki kategorileri silebilir" ON categories;

-- Stock movements politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki stok hareketlerini görüntüleyebilir" ON stock_movements;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine stok hareketi ekleyebilir" ON stock_movements;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki stok hareketlerini güncelleyebilir" ON stock_movements;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki stok hareketlerini silebilir" ON stock_movements;

-- Activities politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki etkinlikleri görebilir" ON activities;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine etkinlik ekleyebilir" ON activities;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki etkinlikleri görüntüleyebilir" ON activities;

-- Recipes politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarifleri görüntüleyebilir" ON recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine tarif ekleyebilir" ON recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarifleri güncelleyebilir" ON recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarifleri silebilir" ON recipes;

-- Recipe ingredients politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarif malzemelerini görüntüleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerine malzeme ekleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerindeki malzemeleri güncelleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerindeki malzemeleri silebilir" ON recipe_ingredients;

-- Menus politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri görüntüleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine menü ekleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri güncelleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri silebilir" ON menus;

-- Menu recipes politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menü tariflerini görüntüleyebilir" ON menu_recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerine tarif ekleyebilir" ON menu_recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerindeki tarifleri güncelleyebilir" ON menu_recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerindeki tarifleri silebilir" ON menu_recipes;

-- Expenses politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki giderleri görüntüleyebilir" ON expenses;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine gider ekleyebilir" ON expenses;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki giderleri güncelleyebilir" ON expenses;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki giderleri silebilir" ON expenses;

-- Personnel politikalarını temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki personeli görüntüleyebilir" ON personnel;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine personel ekleyebilir" ON personnel;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki personeli güncelleyebilir" ON personnel;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki personeli silebilir" ON personnel;

-- ====================================================================
-- PHASE 2: RLS'Yİ AKTİFLEŞTİR
-- ====================================================================

ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Sadece varsa menu_recipes için
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'menu_recipes') THEN
        ALTER TABLE menu_recipes ENABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- ====================================================================
-- PHASE 3: PROJECT_PERMISSIONS - SONSUZ DÖNGÜ SORUNU ÇÖZÜLMESİ
-- ====================================================================

-- Güvenli SELECT politikası - herkes tüm izinleri görebilir (paylaşım için gerekli)
CREATE POLICY "project_permissions_select_policy" ON project_permissions
  FOR SELECT USING (true);

-- INSERT politikası - sadece proje sahipleri
CREATE POLICY "project_permissions_insert_policy" ON project_permissions
  FOR INSERT WITH CHECK (
    -- Projenin sahibi mi kontrol et (sonsuz döngü yok)
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_permissions.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

-- UPDATE politikası - sadece proje sahipleri
CREATE POLICY "project_permissions_update_policy" ON project_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_permissions.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
  );

-- DELETE politikası - sadece proje sahipleri (kendi owner kaydını silemez)
CREATE POLICY "project_permissions_delete_policy" ON project_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_permissions.project_id 
      AND projects.user_id::text = auth.uid()::text
    )
    AND NOT (
      project_permissions.user_id = auth.uid()::text 
      AND project_permissions.permission_level = 'owner'
    )
  );

-- ====================================================================
-- PHASE 4: PROJECTS TABLOSU - UUID/TEXT UYUMLU
-- ====================================================================

CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT USING (
    -- Kendi projeleri veya izin verilmiş projeler
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = projects.id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text
  );

CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = projects.id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level = 'owner'
    )
  );

CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE USING (
    user_id::text = auth.uid()::text
  );

-- ====================================================================
-- PHASE 5: PRODUCTS TABLOSU
-- ====================================================================

CREATE POLICY "products_select_policy" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "products_insert_policy" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "products_update_policy" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "products_delete_policy" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 6: CATEGORIES TABLOSU
-- ====================================================================

CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 7: STOCK_MOVEMENTS TABLOSU
-- ====================================================================

CREATE POLICY "stock_movements_select_policy" ON stock_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "stock_movements_insert_policy" ON stock_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "stock_movements_update_policy" ON stock_movements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "stock_movements_delete_policy" ON stock_movements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 8: ACTIVITIES TABLOSU - UUID SORUNLU DÜZELTME
-- ====================================================================

CREATE POLICY "activities_select_policy" ON activities
  FOR SELECT USING (
    user_id = auth.uid() OR  -- Kendi etkinlikleri (activities.user_id UUID)
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = activities.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "activities_insert_policy" ON activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR  -- Kendi etkinliği
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = activities.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 9: RECIPES TABLOSU - UUID SORUNLU DÜZELTME
-- ====================================================================

CREATE POLICY "recipes_select_policy" ON recipes
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = recipes.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "recipes_insert_policy" ON recipes
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text
  );

CREATE POLICY "recipes_update_policy" ON recipes
  FOR UPDATE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = recipes.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "recipes_delete_policy" ON recipes
  FOR DELETE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = recipes.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 10: RECIPE_INGREDIENTS TABLOSU - DÜZELTME
-- ====================================================================

CREATE POLICY "recipe_ingredients_select_policy" ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (
        recipes.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = recipes.project_id
          AND project_permissions.user_id = auth.uid()::text
        )
      )
    )
  );

CREATE POLICY "recipe_ingredients_insert_policy" ON recipe_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (
        recipes.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = recipes.project_id
          AND project_permissions.user_id = auth.uid()::text
          AND project_permissions.permission_level IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "recipe_ingredients_update_policy" ON recipe_ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (
        recipes.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = recipes.project_id
          AND project_permissions.user_id = auth.uid()::text
          AND project_permissions.permission_level IN ('owner', 'editor')
        )
      )
    )
  );

CREATE POLICY "recipe_ingredients_delete_policy" ON recipe_ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND (
        recipes.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = recipes.project_id
          AND project_permissions.user_id = auth.uid()::text
          AND project_permissions.permission_level IN ('owner', 'editor')
        )
      )
    )
  );

-- ====================================================================
-- PHASE 11: MENUS TABLOSU - UUID SORUNLU DÜZELTME
-- ====================================================================

CREATE POLICY "menus_select_policy" ON menus
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "menus_insert_policy" ON menus
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "menus_update_policy" ON menus
  FOR UPDATE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "menus_delete_policy" ON menus
  FOR DELETE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 12: EXPENSES TABLOSU - UUID SORUNLU DÜZELTME
-- ====================================================================

CREATE POLICY "expenses_select_policy" ON expenses
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "expenses_insert_policy" ON expenses
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "expenses_update_policy" ON expenses
  FOR UPDATE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "expenses_delete_policy" ON expenses
  FOR DELETE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 13: PERSONNEL TABLOSU - UUID SORUNLU DÜZELTME
-- ====================================================================

CREATE POLICY "personnel_select_policy" ON personnel
  FOR SELECT USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "personnel_insert_policy" ON personnel
  FOR INSERT WITH CHECK (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "personnel_update_policy" ON personnel
  FOR UPDATE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "personnel_delete_policy" ON personnel
  FOR DELETE USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- PHASE 14: MENU_RECIPES TABLOSU (EĞER VARSA)
-- ====================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'menu_recipes') THEN
        
        CREATE POLICY "menu_recipes_select_policy" ON menu_recipes
          FOR SELECT USING (
            EXISTS (
              SELECT 1 FROM menus
              WHERE menus.id = menu_recipes.menu_id
              AND (
                menus.user_id::text = auth.uid()::text OR
                EXISTS (
                  SELECT 1 FROM project_permissions
                  WHERE project_permissions.project_id = menus.project_id
                  AND project_permissions.user_id = auth.uid()::text
                )
              )
            )
          );

        CREATE POLICY "menu_recipes_insert_policy" ON menu_recipes
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM menus
              WHERE menus.id = menu_recipes.menu_id
              AND (
                menus.user_id::text = auth.uid()::text OR
                EXISTS (
                  SELECT 1 FROM project_permissions
                  WHERE project_permissions.project_id = menus.project_id
                  AND project_permissions.user_id = auth.uid()::text
                  AND project_permissions.permission_level IN ('owner', 'editor')
                )
              )
            )
          );

        CREATE POLICY "menu_recipes_update_policy" ON menu_recipes
          FOR UPDATE USING (
            EXISTS (
              SELECT 1 FROM menus
              WHERE menus.id = menu_recipes.menu_id
              AND (
                menus.user_id::text = auth.uid()::text OR
                EXISTS (
                  SELECT 1 FROM project_permissions
                  WHERE project_permissions.project_id = menus.project_id
                  AND project_permissions.user_id = auth.uid()::text
                  AND project_permissions.permission_level IN ('owner', 'editor')
                )
              )
            )
          );

        CREATE POLICY "menu_recipes_delete_policy" ON menu_recipes
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM menus
              WHERE menus.id = menu_recipes.menu_id
              AND (
                menus.user_id::text = auth.uid()::text OR
                EXISTS (
                  SELECT 1 FROM project_permissions
                  WHERE project_permissions.project_id = menus.project_id
                  AND project_permissions.user_id = auth.uid()::text
                  AND project_permissions.permission_level IN ('owner', 'editor')
                )
              )
            )
          );
    END IF;
END
$$;

-- ====================================================================
-- PHASE 15: KONTROL VE DOĞRULAMA SORGUSU
-- ====================================================================

-- Tüm RLS politikalarını listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
      WHEN LENGTH(qual) > 50 THEN LEFT(qual, 50) || '...' 
      ELSE qual 
    END as qual_preview
FROM pg_policies 
WHERE tablename IN (
    'project_permissions', 'projects', 'products', 'categories', 
    'stock_movements', 'activities', 'recipes', 'recipe_ingredients',
    'menus', 'menu_recipes', 'expenses', 'personnel'
)
ORDER BY tablename, policyname;

-- RLS etkin tabloları kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename IN (
    'project_permissions', 'projects', 'products', 'categories', 
    'stock_movements', 'activities', 'recipes', 'recipe_ingredients',
    'menus', 'menu_recipes', 'expenses', 'personnel'
)
AND rowsecurity = true
ORDER BY tablename;

-- Politika sayılarını kontrol et
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN (
    'project_permissions', 'projects', 'products', 'categories', 
    'stock_movements', 'activities', 'recipes', 'recipe_ingredients',
    'menus', 'menu_recipes', 'expenses', 'personnel'
)
GROUP BY tablename
ORDER BY tablename;

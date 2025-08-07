-- Recipe Ingredients RLS Politika Düzeltmesi
-- Bu SQL dosyası recipe_ingredients tablosundaki RLS politika sorununu çözer

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarif malzemelerini görüntüleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerine malzeme ekleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerindeki malzemeleri güncelleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerindeki malzemeleri silebilir" ON recipe_ingredients;

-- RLS'yi etkinleştir (eğer henüz etkinleştirilmediyse)
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- SELECT politikası - tarif malzemelerini görüntüleme
CREATE POLICY "Kullanıcılar kendi projelerindeki tarif malzemelerini görüntüleyebilir" ON recipe_ingredients
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

-- INSERT politikası - tarif malzemesi ekleme (DÜZELTME: FOR INSERT WITH CHECK eklendi)
CREATE POLICY "Kullanıcılar kendi tariflerine malzeme ekleyebilir" ON recipe_ingredients
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

-- UPDATE politikası - tarif malzemesi güncelleme
CREATE POLICY "Kullanıcılar kendi tariflerindeki malzemeleri güncelleyebilir" ON recipe_ingredients
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

-- DELETE politikası - tarif malzemesi silme
CREATE POLICY "Kullanıcılar kendi tariflerindeki malzemeleri silebilir" ON recipe_ingredients
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

-- Kontrol sorgusu - politikaların doğru oluşturulduğunu kontrol et
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'recipe_ingredients'
ORDER BY policyname;

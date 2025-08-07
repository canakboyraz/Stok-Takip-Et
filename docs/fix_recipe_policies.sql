-- Tarif tablolarının RLS politikalarını düzeltelim

-- Mevcut politikaları silelim (if exists)
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarifleri görüntüleyebilir" ON recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine tarif ekleyebilir" ON recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarifleri güncelleyebilir" ON recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarifleri silebilir" ON recipes;

-- recipes için doğru politikaları oluşturalım
CREATE POLICY "Kullanıcılar kendi projelerindeki tarifleri görüntüleyebilir" ON recipes
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = recipes.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine tarif ekleyebilir" ON recipes
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki tarifleri güncelleyebilir" ON recipes
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = recipes.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki tarifleri silebilir" ON recipes
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = recipes.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Tarif malzemeleri için de aynı değişiklikleri yapalım
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki tarif malzemelerini görüntüleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerine malzeme ekleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerindeki malzemeleri güncelleyebilir" ON recipe_ingredients;
DROP POLICY IF EXISTS "Kullanıcılar kendi tariflerindeki malzemeleri silebilir" ON recipe_ingredients;

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

-- Menüler için politikaları düzeltelim
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri görüntüleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine menü ekleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri güncelleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri silebilir" ON menus;

-- Menü politikalarını project_permissions ile oluşturalım
CREATE POLICY "Kullanıcılar kendi projelerindeki menüleri görüntüleyebilir" ON menus
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine menü ekleyebilir" ON menus
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki menüleri güncelleyebilir" ON menus
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki menüleri silebilir" ON menus
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Menü tarifleri için politikaları düzeltelim
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menü tariflerini görüntüleyebilir" ON menu_recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerine tarif ekleyebilir" ON menu_recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerindeki tarifleri güncelleyebilir" ON menu_recipes;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerindeki tarifleri silebilir" ON menu_recipes;

-- Menü tarifleri politikalarını oluşturalım
CREATE POLICY "Kullanıcılar kendi projelerindeki menü tariflerini görüntüleyebilir" ON menu_recipes
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

CREATE POLICY "Kullanıcılar kendi menülerine tarif ekleyebilir" ON menu_recipes
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

CREATE POLICY "Kullanıcılar kendi menülerindeki tarifleri güncelleyebilir" ON menu_recipes
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

CREATE POLICY "Kullanıcılar kendi menülerindeki tarifleri silebilir" ON menu_recipes
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
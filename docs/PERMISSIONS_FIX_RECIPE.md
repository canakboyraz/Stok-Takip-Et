# Tarif ve Menü Erişim İzinleri Sorunu Çözümü

Bu belgede, paylaşılan projelerdeki tariflere ve menülere erişim sorunu için çözüm adımları açıklanmaktadır.

## Sorun Nedir?

Proje izin sistemi düzgün çalışıyor, ancak paylaşılan projede bulunan tarifler ve menüler görüntülenmiyor. Bunun sebebi, tarif ve menü tablolarındaki RLS (Row Level Security) politikalarının eski `project_users` tablosunu referans alması, ancak şu anda izinlerin `project_permissions` tablosunda yönetiliyor olmasıdır.

## Çözüm

Aşağıdaki SQL komutlarını Supabase SQL Editöründe çalıştırmanız gerekiyor:

1. Supabase kontrol paneline giriş yapın
2. Sol menüden "SQL Editor" seçeneğine tıklayın 
3. Aşağıdaki SQL kodunu kopyalayıp yapıştırın ve çalıştırın

```sql
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

-- Menü öğeleri için politikaları düzeltelim
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menü öğelerini görüntüleyebilir" ON menu_items;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerine öğe ekleyebilir" ON menu_items;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerindeki öğeleri güncelleyebilir" ON menu_items;
DROP POLICY IF EXISTS "Kullanıcılar kendi menülerindeki öğeleri silebilir" ON menu_items;

-- Menü öğeleri politikalarını oluşturalım
CREATE POLICY "Kullanıcılar kendi projelerindeki menü öğelerini görüntüleyebilir" ON menu_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM menus
      WHERE menus.id = menu_items.menu_id
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

CREATE POLICY "Kullanıcılar kendi menülerine öğe ekleyebilir" ON menu_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM menus
      WHERE menus.id = menu_items.menu_id
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

CREATE POLICY "Kullanıcılar kendi menülerindeki öğeleri güncelleyebilir" ON menu_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM menus
      WHERE menus.id = menu_items.menu_id
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

CREATE POLICY "Kullanıcılar kendi menülerindeki öğeleri silebilir" ON menu_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM menus
      WHERE menus.id = menu_items.menu_id
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
```

## Değişikliklerin Test Edilmesi

Bu SQL kodunu çalıştırdıktan sonra:

1. Uygulamada projelerinizden birinde tarif ve menüler oluşturun veya mevcut olduğundan emin olun
2. Başka bir kullanıcıya bu projeyi paylaşın (İzinler > Kullanıcı Ekle > [e-posta] > Görüntüleyici)
3. Diğer kullanıcıyla giriş yapın ve paylaşılan projede tariflerin ve menülerin görünüp görünmediğini kontrol edin

## Sorunun Açıklaması

Bu sorun, proje izin sisteminde yapılan bir değişiklikten kaynaklanmaktadır. Önceden, `project_users` adlı bir tablo kullanılıyordu, ancak şimdi bu tablo `project_permissions` olarak değiştirildi. Tarif ve menü tablolarındaki RLS politikaları, eski tablo adını referans aldığı için paylaşım düzgün çalışmıyordu.

Bu düzeltme, tüm ilgili tabloların RLS politikalarını günceller:

1. `recipes` - Tarifler
2. `recipe_ingredients` - Tarif malzemeleri
3. `menus` - Menüler
4. `menu_items` - Menü öğeleri

Yeni RLS politikaları, izinleri `project_permissions` tablosundan kontrol eder ve kullanıcının izin seviyesine göre erişim sağlar. Bu sayede:

- Görüntüleyici (viewer) izni olan kullanıcılar tüm verileri görüntüleyebilir
- Düzenleyici (editor) izni olan kullanıcılar veri ekleyebilir, güncelleyebilir ve silebilir
- Sahip (owner) izni olan kullanıcılar tam erişime sahiptir

## Hata Giderme

Eğer sorun devam ederse:

1. Tarayıcı konsolunda hata mesajlarını kontrol edin
2. Supabase logs panelinde hataları kontrol edin
3. Aşağıdaki sorguları kullanarak veri erişimini test edin:

```sql
-- Tarifleri kontrol et
SELECT * FROM recipes WHERE project_id = [PROJE_ID];

-- İzinleri kontrol et
SELECT * FROM project_permissions WHERE project_id = [PROJE_ID];
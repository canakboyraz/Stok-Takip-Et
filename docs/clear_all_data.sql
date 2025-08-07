-- UYARI: Bu SQL betiği veritabanındaki TÜM verileri SİLECEKTİR!
-- Gerçekleştirmeden önce bir yedek almanız önerilir
-- Bu işlem geri alınamaz ve tüm verileriniz kalıcı olarak silinecektir

-- İşlem sırasında yabancı anahtar kısıtlamalarını devre dışı bırak
ALTER TABLE IF EXISTS "menu_recipes" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "stock_movements" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "recipe_ingredients" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "recipes" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "products" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "menus" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "categories" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "product_templates" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "expenses" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "personnel" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "project_permissions" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "projects" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "companies" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "profiles" DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "auth.users" DISABLE TRIGGER ALL;

-- Tüm tabloları temizle (ilişkisel hiyerarşiyi takip ederek)
DELETE FROM "menu_recipes";
DELETE FROM "stock_movements";
DELETE FROM "recipe_ingredients";
DELETE FROM "recipes";
DELETE FROM "products";
DELETE FROM "menus";
DELETE FROM "categories";
DELETE FROM "product_templates";
DELETE FROM "expenses";
DELETE FROM "personnel";
DELETE FROM "project_permissions";
DELETE FROM "projects";
DELETE FROM "companies";
DELETE FROM "profiles";

-- Auth.users tablosundaki kullanıcıları temizle
-- NOT: Eğer su admin, hizmet hesapları gibi özel kullanıcıları tutmak isterseniz burada WHERE koşulu ekleyin
DELETE FROM "auth"."users";

-- Silme işlemi sırasında sequence'lerin sıfırlanması
-- Bu, ID'lerin 1'den başlamasını sağlayacaktır
ALTER SEQUENCE IF EXISTS menu_recipes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stock_movements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recipe_ingredients_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS recipes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS menus_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS categories_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS product_templates_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS personnel_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS project_permissions_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS projects_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS companies_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;

-- Yabancı anahtar kısıtlamalarını tekrar etkinleştir
ALTER TABLE IF EXISTS "menu_recipes" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "stock_movements" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "recipe_ingredients" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "recipes" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "products" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "menus" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "categories" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "product_templates" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "expenses" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "personnel" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "project_permissions" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "projects" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "companies" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "profiles" ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS "auth.users" ENABLE TRIGGER ALL; 
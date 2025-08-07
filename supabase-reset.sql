-- Bu SQL komutlarını Supabase SQL Editöründe çalıştırabilirsiniz
-- UYARI: Bu işlem tüm verileri siler ve geri alınamaz!

-- Stock movements temizle (FK bağımlılıkları nedeniyle önce alt tablolar temizlenir)
TRUNCATE TABLE stock_movements CASCADE;

-- Personel verileri temizle
TRUNCATE TABLE timesheet CASCADE;
TRUNCATE TABLE personnel CASCADE;

-- Giderleri temizle
TRUNCATE TABLE expenses CASCADE;

-- Tarif içeriklerini temizle
TRUNCATE TABLE recipe_ingredients CASCADE;
TRUNCATE TABLE recipes CASCADE;

-- Menü verilerini temizle
TRUNCATE TABLE menu_recipes CASCADE;
TRUNCATE TABLE menus CASCADE;

-- İzinleri temizle
TRUNCATE TABLE project_permissions CASCADE;

-- Ürün ve kategorileri temizle
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE categories CASCADE;

-- Projeleri en son temizle
TRUNCATE TABLE projects CASCADE;

-- Aktiviteleri temizle
TRUNCATE TABLE activities CASCADE;

-- ÖNEMLİ: Bu komut kullanıcıları siler (isteğe bağlı)
-- Tüm kullanıcılar silinir, siz dahil. Yeni kullanıcı açmanız gerekecek.
-- DELETE FROM auth.users WHERE true;

-- Aşağıdaki sorgu, uygulamanızdaki tüm tabloları listeler
-- Bu listeyi kullanarak eksik kalan tablolar varsa onları da temizleyebilirsiniz
SELECT tablename FROM pg_catalog.pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 
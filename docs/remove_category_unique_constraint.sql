-- Kategoriler tablosundaki unique constraint'i kaldırma script'i

-- 1. Adım: Constraint adını bulma
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'categories'::regclass
  AND contype = 'u';
  
-- 2. Adım: Constraint'i kaldırma
-- Aşağıdaki komutu çalıştırın, ancak "categories_name_key" veya benzeri bir isim görürseniz, 
-- o ismi aşağıdaki komutta yerine koyarak çalıştırın:
ALTER TABLE categories DROP CONSTRAINT categories_name_key;

-- 3. Adım: Alternatif olarak, aynı ad ve proje için bir unique constraint ekleyebilirsiniz (opsiyonel)
-- Bu, proje içinde aynı adlı kategorileri engeller ancak farklı projelerde aynı adlı kategorilere izin verir
ALTER TABLE categories 
DROP CONSTRAINT IF EXISTS categories_name_project_id_key;

-- Eğer istenirse, proje içinde aynı adlı kategorileri engellemek için,
-- hem name hem de project_id üzerinde bir unique constraint eklenebilir:
-- ALTER TABLE categories 
-- ADD CONSTRAINT categories_name_project_id_key UNIQUE (name, project_id);

-- 4. Adım: Kontrolleri yapma
-- Constraint'in kaldırıldığını doğrulama
SELECT conname, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'categories'::regclass
  AND contype = 'u'; 
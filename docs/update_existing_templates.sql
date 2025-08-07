-- Mevcut ürün şablonlarını belirli bir projeye atama
-- Bu betik çalıştırılmadan önce [PROJE_ID] değerini güncelleyin

-- Örnek kullanım:
-- 1. Proje ID'nizi bulun (örn. localStorage.getItem('currentProjectId') ile)
-- 2. Aşağıdaki sorguyu düzenleyin, [PROJE_ID] kısmını kendi projenizin ID'si ile değiştirin
-- 3. SQL'i çalıştırın

-- UYARI: Tüm şablonlar bu proje ile ilişkilendirilecek
UPDATE "product_templates"
SET "project_id" = [PROJE_ID]
WHERE "project_id" IS NULL;

-- İsteğe bağlı: Özel bir kategori için güncelleme yapmak isterseniz
-- UPDATE "product_templates"
-- SET "project_id" = [PROJE_ID]
-- WHERE "project_id" IS NULL AND "category" = 'sebze';

-- NOT: Bu işlemi uyguladıktan sonra, 
-- product_templates tablosundaki project_id alanını zorunlu yapmak istiyorsanız
-- aşağıdaki komutu çalıştırabilirsiniz:
-- ALTER TABLE "product_templates" ALTER COLUMN "project_id" SET NOT NULL; 
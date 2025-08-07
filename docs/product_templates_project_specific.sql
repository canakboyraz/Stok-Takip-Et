-- Ürün şablonlarını projeye özel hale getirme
-- Bu betik, product_templates tablosunu projeye özel hale getirir

-- 1. Önce tabloyu güncelle ve project_id ekle
ALTER TABLE IF EXISTS "product_templates" 
ADD COLUMN IF NOT EXISTS "project_id" INTEGER REFERENCES "projects"("id");

-- 2. Mevcut şablonlar için varsayılan proje atama
-- NOT: Bu adımı, uygulamada aktif bir proje ile çalıştırın
-- Şu anda mevcut bir proje ID'niz varsa, aşağıdaki satırı düzenleyebilirsiniz
-- UPDATE "product_templates" SET "project_id" = [SİZİN_PROJE_ID'NIZ] WHERE "project_id" IS NULL;

-- 3. project_id alanını zorunlu yap 
-- NOT: Önce tüm kayıtlara project_id değeri atandığından emin olun
-- ALTER TABLE "product_templates" ALTER COLUMN "project_id" SET NOT NULL;

-- 4. Row Level Security (RLS) ayarla
-- Önce RLS'yi etkinleştir
ALTER TABLE "product_templates" ENABLE ROW LEVEL SECURITY;

-- Eski politikaları kaldır (eğer varsa)
DROP POLICY IF EXISTS "product_templates_select_policy" ON "product_templates";
DROP POLICY IF EXISTS "product_templates_insert_policy" ON "product_templates";
DROP POLICY IF EXISTS "product_templates_update_policy" ON "product_templates";
DROP POLICY IF EXISTS "product_templates_delete_policy" ON "product_templates";

-- Görüntüleme politikası: Kullanıcılar sadece kendi projeleriyle ilişkili şablonları görebilir
CREATE POLICY "product_templates_select_policy" ON "product_templates"
FOR SELECT
USING (
    project_id IN (
        SELECT project_id FROM project_permissions 
        WHERE user_id = auth.uid() 
        AND (permission = 'owner' OR permission = 'editor' OR permission = 'viewer')
    )
);

-- Ekleme politikası: Sadece proje sahipleri ve editörler şablon ekleyebilir
CREATE POLICY "product_templates_insert_policy" ON "product_templates"
FOR INSERT
WITH CHECK (
    project_id IN (
        SELECT project_id FROM project_permissions 
        WHERE user_id = auth.uid() 
        AND (permission = 'owner' OR permission = 'editor')
    )
);

-- Güncelleme politikası: Sadece proje sahipleri ve editörler şablonları güncelleyebilir
CREATE POLICY "product_templates_update_policy" ON "product_templates"
FOR UPDATE
USING (
    project_id IN (
        SELECT project_id FROM project_permissions 
        WHERE user_id = auth.uid() 
        AND (permission = 'owner' OR permission = 'editor')
    )
);

-- Silme politikası: Sadece proje sahipleri şablonları silebilir
CREATE POLICY "product_templates_delete_policy" ON "product_templates"
FOR DELETE
USING (
    project_id IN (
        SELECT project_id FROM project_permissions 
        WHERE user_id = auth.uid() 
        AND permission = 'owner'
    )
); 
-- Önce tüm mevcut politikaları kaldır
DROP POLICY IF EXISTS "Herkes ürün şablonlarını görebilir" ON product_templates;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki şablonları görebilir" ON product_templates;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine şablonları ekleyebilir" ON product_templates;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki şablonları güncelleyebilir" ON product_templates;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki şablonları silebilir" ON product_templates;

-- Şablon ürünlerinin projeye göre filtrelenmesi için RLS politikası ekle
CREATE POLICY "Kullanıcılar kendi projelerindeki şablonları görebilir" ON product_templates
FOR SELECT USING (project_id IS NULL OR project_id IN (
  SELECT p.id FROM projects p
  INNER JOIN project_permissions pp ON p.id = pp.project_id
  WHERE pp.user_id::uuid = auth.uid()
));

-- Ekleme politikası: Kullanıcılar sadece kendi projelerine şablon ekleyebilir
CREATE POLICY "Kullanıcılar kendi projelerine şablonları ekleyebilir" ON product_templates
FOR INSERT WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN project_permissions pp ON p.id = pp.project_id
    WHERE pp.user_id::uuid = auth.uid()
  )
);

-- Güncelleme politikası: Kullanıcılar sadece kendi projelerindeki şablonları güncelleyebilir
CREATE POLICY "Kullanıcılar kendi projelerindeki şablonları güncelleyebilir" ON product_templates
FOR UPDATE USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN project_permissions pp ON p.id = pp.project_id
    WHERE pp.user_id::uuid = auth.uid()
  )
);

-- Silme politikası: Kullanıcılar sadece kendi projelerindeki şablonları silebilir
CREATE POLICY "Kullanıcılar kendi projelerindeki şablonları silebilir" ON product_templates
FOR DELETE USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN project_permissions pp ON p.id = pp.project_id
    WHERE pp.user_id::uuid = auth.uid()
  )
);

-- Şablon ürünleri getiren fonksiyonu güncelle
DROP FUNCTION IF EXISTS get_product_templates(INTEGER);
CREATE OR REPLACE FUNCTION get_product_templates(p_project_id INTEGER)
RETURNS TABLE (
  id INT,
  name VARCHAR,
  category VARCHAR,
  description TEXT,
  unit VARCHAR,
  created_at TIMESTAMPTZ,
  project_id INTEGER
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM product_templates 
  WHERE project_id IS NULL OR project_id = p_project_id;
$$; 
-- Ürün şablonları için tablo oluştur
CREATE TABLE IF NOT EXISTS product_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  description TEXT,
  unit VARCHAR(50) NOT NULL DEFAULT 'kg',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabloyu herkes için görünür yap
ALTER TABLE product_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Herkes ürün şablonlarını görebilir" ON product_templates FOR SELECT USING (true);

-- Şablon ürünleri getiren fonksiyon
CREATE OR REPLACE FUNCTION get_product_templates()
RETURNS TABLE (
  id INT,
  name VARCHAR,
  category VARCHAR,
  description TEXT,
  unit VARCHAR,
  created_at TIMESTAMPTZ
) 
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT * FROM product_templates;
$$; 
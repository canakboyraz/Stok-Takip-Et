-- Activities tablosu için RLS Güvenlik Politikaları

-- Önce eski politikaları temizleyelim (eğer varsa)
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki etkinlikleri görüntüleyebilir" ON activities;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine etkinlik ekleyebilir" ON activities;

-- RLS etkinleştir
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Görüntüleme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki etkinlikleri görüntüleyebilir" 
ON activities
FOR SELECT
USING (
  project_id IN (
    SELECT project_id FROM project_users
    WHERE user_id = auth.uid()
  )
);

-- Ekleme politikası
CREATE POLICY "Kullanıcılar kendi projelerine etkinlik ekleyebilir" 
ON activities
FOR INSERT
WITH CHECK (
  project_id IN (
    SELECT project_id FROM project_users
    WHERE user_id = auth.uid()
  )
); 
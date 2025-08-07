-- Etkinlik kaydı için activities tablosu
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  project_id INTEGER REFERENCES projects(id),
  action_type VARCHAR NOT NULL,
  action_description TEXT NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_email VARCHAR,
  ip_address VARCHAR
);

-- Etkinlik kaydı tablosu için indeks
CREATE INDEX IF NOT EXISTS idx_activities_project_id ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_entity_type ON activities(entity_type);

-- RLS politikalarını etkinleştir
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi projelerindeki kayıtları görebilir
CREATE POLICY "Kullanıcılar kendi projelerindeki etkinlikleri görebilir" 
ON activities FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN project_permissions pp ON p.id = pp.project_id
    WHERE pp.user_id::uuid = auth.uid()
  )
);

-- Kullanıcılar kendi projelerindeki etkinlikleri ekleyebilir
CREATE POLICY "Kullanıcılar kendi projelerine etkinlik ekleyebilir" 
ON activities FOR INSERT WITH CHECK (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN project_permissions pp ON p.id = pp.project_id
    WHERE pp.user_id::uuid = auth.uid()
  )
);

-- Etkinlik eklemek için bir fonksiyon
CREATE OR REPLACE FUNCTION log_activity(
  p_user_id UUID,
  p_project_id INTEGER,
  p_action_type VARCHAR,
  p_action_description TEXT,
  p_entity_type VARCHAR,
  p_entity_id INTEGER,
  p_user_email VARCHAR,
  p_ip_address VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  activity_id INTEGER;
BEGIN
  INSERT INTO activities(
    user_id, 
    project_id, 
    action_type, 
    action_description, 
    entity_type, 
    entity_id, 
    user_email, 
    ip_address
  ) VALUES (
    p_user_id, 
    p_project_id, 
    p_action_type, 
    p_action_description, 
    p_entity_type, 
    p_entity_id, 
    p_user_email, 
    p_ip_address
  ) RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Etkinlik sayfalarına gönderilecek view oluştur
CREATE OR REPLACE VIEW activities_view AS
SELECT 
  a.id,
  a.project_id,
  a.action_type,
  a.action_description,
  a.entity_type,
  a.entity_id,
  a.created_at,
  a.user_email,
  a.ip_address
FROM activities a;

-- View için erişim politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki etkinlikleri görüntüleyebilir"
ON activities_view FOR SELECT USING (
  project_id IN (
    SELECT p.id FROM projects p
    INNER JOIN project_permissions pp ON p.id = pp.project_id
    WHERE pp.user_id::uuid = auth.uid()
  )
); 
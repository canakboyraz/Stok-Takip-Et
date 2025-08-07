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

-- Var olan politikaları temizle
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki etkinlikleri görebilir" ON activities;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine etkinlik ekleyebilir" ON activities;

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
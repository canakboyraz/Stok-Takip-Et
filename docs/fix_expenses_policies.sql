-- Expenses tablosu için RLS politikalarını düzenleme

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki giderleri görüntüleyebilir" ON expenses;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine gider ekleyebilir" ON expenses;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki giderleri güncelleyebilir" ON expenses;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki giderleri silebilir" ON expenses;

-- Expenses tablosu için RLS etkinleştirme (eğer henüz etkinleştirilmediyse)
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Görüntüleme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki giderleri görüntüleyebilir" ON expenses
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

-- Ekleme politikası
CREATE POLICY "Kullanıcılar kendi projelerine gider ekleyebilir" ON expenses
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Güncelleme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki giderleri güncelleyebilir" ON expenses
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Silme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki giderleri silebilir" ON expenses
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = expenses.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  ); 
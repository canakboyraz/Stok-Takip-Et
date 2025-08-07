-- Personnel tablosu için RLS politikalarını düzenleme

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki personeli görüntüleyebilir" ON personnel;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine personel ekleyebilir" ON personnel;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki personeli güncelleyebilir" ON personnel;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki personeli silebilir" ON personnel;

-- Personnel tablosu için RLS etkinleştirme (eğer henüz etkinleştirilmediyse)
ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

-- Görüntüleme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki personeli görüntüleyebilir" ON personnel
  FOR SELECT USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

-- Ekleme politikası
CREATE POLICY "Kullanıcılar kendi projelerine personel ekleyebilir" ON personnel
  FOR INSERT WITH CHECK (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Güncelleme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki personeli güncelleyebilir" ON personnel
  FOR UPDATE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Silme politikası
CREATE POLICY "Kullanıcılar kendi projelerindeki personeli silebilir" ON personnel
  FOR DELETE USING (
    auth.uid()::text = user_id::text OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = personnel.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- Personel zaman çizelgesi (timesheet) için politikaları güncelleyelim
DROP POLICY IF EXISTS "Kullanıcılar personel zaman çizelgelerini görüntüleyebilir" ON timesheet;
DROP POLICY IF EXISTS "Kullanıcılar zaman çizelgesi ekleyebilir" ON timesheet;
DROP POLICY IF EXISTS "Kullanıcılar zaman çizelgelerini güncelleyebilir" ON timesheet;
DROP POLICY IF EXISTS "Kullanıcılar zaman çizelgelerini silebilir" ON timesheet;

-- Timesheet tablosu için RLS etkinleştirme (eğer henüz etkinleştirilmediyse)
ALTER TABLE timesheet ENABLE ROW LEVEL SECURITY;

-- Görüntüleme politikası - timesheet
CREATE POLICY "Kullanıcılar personel zaman çizelgelerini görüntüleyebilir" ON timesheet
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM personnel p
      WHERE p.id = timesheet.personnel_id
      AND (
        p.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions pp
          WHERE pp.project_id = p.project_id
          AND pp.user_id = auth.uid()::text
        )
      )
    )
  );

-- Ekleme politikası - timesheet
CREATE POLICY "Kullanıcılar zaman çizelgesi ekleyebilir" ON timesheet
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM personnel p
      WHERE p.id = timesheet.personnel_id
      AND (
        p.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions pp
          WHERE pp.project_id = p.project_id
          AND pp.user_id = auth.uid()::text
          AND pp.permission_level IN ('owner', 'editor')
        )
      )
    )
  );

-- Güncelleme politikası - timesheet
CREATE POLICY "Kullanıcılar zaman çizelgelerini güncelleyebilir" ON timesheet
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM personnel p
      WHERE p.id = timesheet.personnel_id
      AND (
        p.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions pp
          WHERE pp.project_id = p.project_id
          AND pp.user_id = auth.uid()::text
          AND pp.permission_level IN ('owner', 'editor')
        )
      )
    )
  );

-- Silme politikası - timesheet
CREATE POLICY "Kullanıcılar zaman çizelgelerini silebilir" ON timesheet
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM personnel p
      WHERE p.id = timesheet.personnel_id
      AND (
        p.user_id::text = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM project_permissions pp
          WHERE pp.project_id = p.project_id
          AND pp.user_id = auth.uid()::text
          AND pp.permission_level IN ('owner', 'editor')
        )
      )
    )
  ); 
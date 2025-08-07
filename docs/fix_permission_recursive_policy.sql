-- project_permissions tablosundaki sonsuz döngü sorununu çözen SQL

-- Önce mevcut tüm politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar tüm izinleri görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Proje sahipleri izin yönetebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar kendi izinlerini görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar izin verebilir" ON project_permissions;

-- Temel bakış yetkisi - sonsuz döngüye neden olmayan bir politika
CREATE POLICY "Herkes tüm izinleri görüntüleyebilir" ON project_permissions
  FOR SELECT
  USING (true);

-- Proje sahipleri için izin yönetim politikası - projenin sahibi olup olmadığını doğrudan sormadan
-- Burada sonsuz döngüye neden olan, bir izin varken o izni kontrol etmek için yine izin tablosuna soru sormak
CREATE POLICY "Proje sahipleri izin ekleyebilir ve yönetebilir" ON project_permissions
  FOR ALL
  USING (
    -- Kendi projeleri için sahip olduklarını doğrudan projeler tablosundan kontrol et
    EXISTS (
      SELECT 1
      FROM projects p
      WHERE p.id = project_permissions.project_id
      AND p.user_id::text = auth.uid()::text
    )
    OR 
    -- Bu kullanıcı için owner kaydı var mı diye sadece ID eşleşmesi ile kontrol et, recursive olarak permission sorgulama
    (project_permissions.user_id = auth.uid()::text AND project_permissions.permission_level = 'owner')
  );

-- Kullanıcının zaten sahip olduğu izni silmesini engelle - sadece kendi sahiplik kaydını değiştiremesin
CREATE POLICY "Kullanıcılar kendi sahiplik kaydını silemez" ON project_permissions
  FOR DELETE
  USING (
    NOT (project_permissions.user_id = auth.uid()::text AND project_permissions.permission_level = 'owner')
  ); 
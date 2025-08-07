-- ====================================================================
-- KAPSAMLI RLS POLİTİKA DÜZELTMESİ V2
-- UUID/TEXT tip uyumsuzlukları düzeltilmiş versiyon
-- ====================================================================

-- ====================================================================
-- 1. PROJECT_PERMISSIONS TABLOSU - GÜVENLİK AÇIĞI DÜZELTMESİ
-- ====================================================================

-- Mevcut güvensiz politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi izinlerini görebilir" ON project_permissions;
DROP POLICY IF EXISTS "Kullanıcılar izin verebilir" ON project_permissions;
DROP POLICY IF EXISTS "Proje sahipleri izin yönetebilir" ON project_permissions;

-- RLS'yi etkinleştir
ALTER TABLE project_permissions ENABLE ROW LEVEL SECURITY;

-- Güvenli politikalar oluştur
CREATE POLICY "Kullanıcılar ilgili oldukları izinleri görebilir" ON project_permissions
  FOR SELECT USING (
    user_id = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM project_permissions pp2
      WHERE pp2.project_id = project_permissions.project_id
      AND pp2.user_id = auth.uid()::text
      AND pp2.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Sadece proje sahipleri izin verebilir" ON project_permissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions pp
      WHERE pp.project_id = project_permissions.project_id
      AND pp.user_id = auth.uid()::text
      AND pp.permission_level = 'owner'
    )
  );

CREATE POLICY "Sadece proje sahipleri izin güncelleyebilir" ON project_permissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions pp
      WHERE pp.project_id = project_permissions.project_id
      AND pp.user_id = auth.uid()::text
      AND pp.permission_level = 'owner'
    )
  );

CREATE POLICY "Sadece proje sahipleri izin silebilir" ON project_permissions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions pp
      WHERE pp.project_id = project_permissions.project_id
      AND pp.user_id = auth.uid()::text
      AND pp.permission_level = 'owner'
    )
  );

-- ====================================================================
-- 2. PROJECTS TABLOSU - UUID/TEXT UYUMSUZLUĞU DÜZELTİLMİŞ
-- ====================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini görüntüleyebilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini oluşturabilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini güncelleyebilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerini silebilir" ON projects;
DROP POLICY IF EXISTS "Kullanıcılar erişimli projelerini görüntüleyebilir" ON projects;
DROP POLICY IF EXISTS "Proje sahipleri projelerini güncelleyebilir" ON projects;
DROP POLICY IF EXISTS "Sadece proje sahipleri projelerini silebilir" ON projects;

-- RLS'yi etkinleştir
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Politikalar oluştur (user_id tipine göre otomatik uyum)
CREATE POLICY "Kullanıcılar erişimli projelerini görüntüleyebilir" ON projects
  FOR SELECT USING (
    (CASE 
      WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
      ELSE user_id::text = auth.uid()::text
    END) OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = projects.id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerini oluşturabilir" ON projects
  FOR INSERT WITH CHECK (
    CASE 
      WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
      ELSE user_id::text = auth.uid()::text
    END
  );

CREATE POLICY "Proje sahipleri projelerini güncelleyebilir" ON projects
  FOR UPDATE USING (
    (CASE 
      WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
      ELSE user_id::text = auth.uid()::text
    END) OR
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = projects.id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level = 'owner'
    )
  );

CREATE POLICY "Sadece proje sahipleri projelerini silebilir" ON projects
  FOR DELETE USING (
    CASE 
      WHEN pg_typeof(user_id) = 'uuid'::regtype THEN user_id = auth.uid()
      ELSE user_id::text = auth.uid()::text
    END
  );

-- ====================================================================
-- 3. PRODUCTS TABLOSU - EKSİK POLİTİKALAR
-- ====================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki ürünleri görüntüleyebilir" ON products;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine ürün ekleyebilir" ON products;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki ürünleri güncelleyebilir" ON products;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki ürünleri silebilir" ON products;

-- RLS'yi etkinleştir
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Politikalar oluştur
CREATE POLICY "Kullanıcılar kendi projelerindeki ürünleri görüntüleyebilir" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine ürün ekleyebilir" ON products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki ürünleri güncelleyebilir" ON products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki ürünleri silebilir" ON products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = products.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- 4. CATEGORIES TABLOSU - EKSİK POLİTİKALAR
-- ====================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki kategorileri görüntüleyebilir" ON categories;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine kategori ekleyebilir" ON categories;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki kategorileri güncelleyebilir" ON categories;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki kategorileri silebilir" ON categories;

-- RLS'yi etkinleştir
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Politikalar oluştur
CREATE POLICY "Kullanıcılar kendi projelerindeki kategorileri görüntüleyebilir" ON categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine kategori ekleyebilir" ON categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki kategorileri güncelleyebilir" ON categories
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki kategorileri silebilir" ON categories
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = categories.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- 5. STOCK_MOVEMENTS TABLOSU - EKSİK POLİTİKALAR
-- ====================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki stok hareketlerini görüntüleyebilir" ON stock_movements;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine stok hareketi ekleyebilir" ON stock_movements;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki stok hareketlerini güncelleyebilir" ON stock_movements;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki stok hareketlerini silebilir" ON stock_movements;

-- RLS'yi etkinleştir
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Politikalar oluştur
CREATE POLICY "Kullanıcılar kendi projelerindeki stok hareketlerini görüntüleyebilir" ON stock_movements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine stok hareketi ekleyebilir" ON stock_movements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki stok hareketlerini güncelleyebilir" ON stock_movements
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki stok hareketlerini silebilir" ON stock_movements
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = stock_movements.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- 6. ACTIVITIES TABLOSU - UUID SORUNU DÜZELTMESİ
-- ====================================================================

-- Mevcut hatalı politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki etkinlikleri görebilir" ON activities;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine etkinlik ekleyebilir" ON activities;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki etkinlikleri görüntüleyebilir" ON activities;

-- RLS'yi etkinleştir
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Düzeltilmiş politikalar oluştur (activities.user_id genellikle UUID'dir)
CREATE POLICY "Kullanıcılar kendi projelerindeki etkinlikleri görebilir" ON activities
  FOR SELECT USING (
    user_id = auth.uid() OR  -- activities.user_id UUID olduğu için direkt karşılaştırma
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN project_permissions pp ON p.id = pp.project_id
      WHERE pp.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine etkinlik ekleyebilir" ON activities
  FOR INSERT WITH CHECK (
    user_id = auth.uid() OR  -- activities.user_id UUID olduğu için direkt karşılaştırma
    project_id IN (
      SELECT p.id FROM projects p
      INNER JOIN project_permissions pp ON p.id = pp.project_id
      WHERE pp.user_id = auth.uid()::text
      AND pp.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- 7. MENUS TABLOSU - EKSİK POLİTİKALAR
-- ====================================================================

-- Mevcut politikaları kaldır
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri görüntüleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine menü ekleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri güncelleyebilir" ON menus;
DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki menüleri silebilir" ON menus;

-- RLS'yi etkinleştir
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- Politikalar oluştur
CREATE POLICY "Kullanıcılar kendi projelerindeki menüleri görüntüleyebilir" ON menus
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerine menü ekleyebilir" ON menus
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki menüleri güncelleyebilir" ON menus
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

CREATE POLICY "Kullanıcılar kendi projelerindeki menüleri silebilir" ON menus
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_permissions
      WHERE project_permissions.project_id = menus.project_id
      AND project_permissions.user_id = auth.uid()::text
      AND project_permissions.permission_level IN ('owner', 'editor')
    )
  );

-- ====================================================================
-- 8. TIMESHEET TABLOSU - EKSİK POLİTİKALAR (EĞER VARSA)
-- ====================================================================

-- Sadece tablo varsa çalıştır
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'timesheet') THEN
    -- Mevcut politikaları kaldır
    DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki puantajları görüntüleyebilir" ON timesheet;
    DROP POLICY IF EXISTS "Kullanıcılar kendi projelerine puantaj ekleyebilir" ON timesheet;
    DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki puantajları güncelleyebilir" ON timesheet;
    DROP POLICY IF EXISTS "Kullanıcılar kendi projelerindeki puantajları silebilir" ON timesheet;

    -- RLS'yi etkinleştir
    ALTER TABLE timesheet ENABLE ROW LEVEL SECURITY;

    -- Politikalar oluştur
    CREATE POLICY "Kullanıcılar kendi projelerindeki puantajları görüntüleyebilir" ON timesheet
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = timesheet.project_id
          AND project_permissions.user_id = auth.uid()::text
        )
      );

    CREATE POLICY "Kullanıcılar kendi projelerine puantaj ekleyebilir" ON timesheet
      FOR INSERT WITH CHECK (
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = timesheet.project_id
          AND project_permissions.user_id = auth.uid()::text
          AND project_permissions.permission_level IN ('owner', 'editor')
        )
      );

    CREATE POLICY "Kullanıcılar kendi projelerindeki puantajları güncelleyebilir" ON timesheet
      FOR UPDATE USING (
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = timesheet.project_id
          AND project_permissions.user_id = auth.uid()::text
          AND project_permissions.permission_level IN ('owner', 'editor')
        )
      );

    CREATE POLICY "Kullanıcılar kendi projelerindeki puantajları silebilir" ON timesheet
      FOR DELETE USING (
        EXISTS (
          SELECT 1 FROM project_permissions
          WHERE project_permissions.project_id = timesheet.project_id
          AND project_permissions.user_id = auth.uid()::text
          AND project_permissions.permission_level IN ('owner', 'editor')
        )
      );
  END IF;
END
$$;

-- ====================================================================
-- 9. KONTROL SORGUSU - OLUŞTURULAN POLİTİKALARI KONTROL ET
-- ====================================================================

-- Tüm RLS politikalarını listele
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE 
      WHEN LENGTH(qual) > 50 THEN LEFT(qual, 50) || '...' 
      ELSE qual 
    END as qual_preview,
    CASE 
      WHEN LENGTH(with_check) > 50 THEN LEFT(with_check, 50) || '...' 
      ELSE with_check 
    END as with_check_preview
FROM pg_policies 
WHERE tablename IN (
    'project_permissions', 'projects', 'products', 'categories', 
    'stock_movements', 'activities', 'menus', 'timesheet',
    'expenses', 'personnel', 'recipes', 'recipe_ingredients'
)
ORDER BY tablename, policyname;

-- RLS etkin tabloları kontrol et
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename IN (
    'project_permissions', 'projects', 'products', 'categories', 
    'stock_movements', 'activities', 'menus', 'timesheet',
    'expenses', 'personnel', 'recipes', 'recipe_ingredients'
)
ORDER BY tablename;

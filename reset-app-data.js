// Tarayıcı local storage temizleme işlemi
localStorage.clear();
console.log('✅ LocalStorage temizlendi');

// Tüm oturum bilgilerini temizle
sessionStorage.clear();
console.log('✅ SessionStorage temizlendi');

// Cookies temizle
document.cookie.split(";").forEach(function(c) {
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
});
console.log('✅ Çerezler temizlendi');

// Uygulama sıfırlama bilgileri
console.log('\n===== UYGULAMA TAMAMEN SIFIRLANDI =====');
console.log('Şimdi tarayıcınızı kapatıp tekrar açın');
console.log('Ardından giriş sayfasında yeni bir hesap oluşturun');
console.log('\nSUPABASE VERİLERİ SIFIRLAMA YÖNERGELER:');
console.log('1. Supabase kontrol paneline giriş yapın: https://supabase.com/dashboard/');
console.log('2. Projenizi seçin');
console.log('3. "Authentication" -> "Users" bölümüne gidin');
console.log('4. Kullanıcıları temizleyin (isteğe bağlı, yeni hesap açmak için gerekli değil)');
console.log('5. "Table Editor" bölümüne gidin');
console.log('6. Her tablo için "Truncate" işlemini uygulayın (DELETE yapmak yerine TRUNCATE yapın)');
console.log('   Sıralama önemli! Önce ilişkili (foreign key) tabloları temizleyin:');
console.log('   - stock_movements, timesheet, expenses, personnel, recipe_ingredients, project_permissions');
console.log('   - recipes, menus, menu_recipes');
console.log('   - products, categories');
console.log('   - projects (en son)');
console.log('7. Tüm veriler temizlendikten sonra, uygulamaya giriş yaparak yeni bir hesap oluşturabilirsiniz');

// Supabase veritabanı sıfırlama (ileri düzey yöntem - doğrudan tarayıcı konsolunda kullanmayın)
/* 
// Aşağıdaki kodları doğrudan Supabase SQL Editor'de çalıştırın (Tablo sıralaması önemli!)

-- Stock movements temizle
TRUNCATE TABLE stock_movements;

-- Personel verileri temizle
TRUNCATE TABLE timesheet;
TRUNCATE TABLE personnel;

-- Giderleri temizle
TRUNCATE TABLE expenses;

-- Tarif içeriklerini temizle
TRUNCATE TABLE recipe_ingredients;
TRUNCATE TABLE recipes;

-- Menü verilerini temizle
TRUNCATE TABLE menu_recipes;
TRUNCATE TABLE menus;

-- İzinleri temizle
TRUNCATE TABLE project_permissions;

-- Ürün ve kategorileri temizle
TRUNCATE TABLE products;
TRUNCATE TABLE categories;

-- Projeleri en son temizle
TRUNCATE TABLE projects;

*/ 
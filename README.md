<div align="center">
  <img src="https://raw.githubusercontent.com/supabase/supabase/master/apps/docs/public/img/supabase-logo.svg" width="120" alt="Supabase Logo" />
  
  <h1>📦 Stok Takip Sistemi</h1>
  <p>Supabase + React ile modern, güvenli ve hızlı stok yönetimi</p>
  <br/>
  <img src="docs/screenshots/dashboard.png" width="80%" alt="Dashboard Screenshot"/>
  <br/>
  <i>Görsel: Uygulama ana ekranı (örnek)</i>
</div>

---

## 🚀 Proje Hakkında

**Stok Takip Sistemi**, işletmelerin ürün, stok ve hareketlerini kolayca yönetebilmesi için geliştirilmiş, bulut tabanlı ve kullanıcı dostu bir web uygulamasıdır. Supabase altyapısı sayesinde gerçek zamanlı veri, güvenli kimlik doğrulama ve hızlı geliştirme imkanı sunar.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** React, TypeScript, Material UI
- **Backend:** [Supabase](https://supabase.com) (BaaS)
- **Veritabanı:** PostgreSQL (Supabase ile yönetilen)
- **Kimlik Doğrulama:** Supabase Auth

---

## 🎯 Temel Özellikler

- 🔐 **Kullanıcı Girişi & Rol Yönetimi**
- 📦 **Ürün ve Kategori Yönetimi**
- 📊 **Stok Girişi/Çıkışı & Hareket Takibi**
- ⚠️ **Kritik Stok ve Son Kullanım Tarihi Uyarıları**
- 📈 **Dashboard & Raporlama**
- 🔎 **Filtreleme, Arama ve Detaylı Listeleme**
- 📝 **Kolay Kurulum & Açık Kaynak Kod**

---

## 🖥️ Ekran Görüntüleri

> 📸 **Not:** Kendi ekran görüntülerinizi `docs/screenshots/` klasörüne ekleyin ve aşağıdaki alanı güncelleyin.

| Dashboard | Ürün Listesi | Stok Hareketleri |
|-----------|--------------|------------------|
| ![](docs/screenshots/dashboard.png) | ![](docs/screenshots/products.png) | ![](docs/screenshots/stock-movements.png) |

---

## ⚡️ Hızlı Başlangıç

```bash
# 1. Repoyu klonlayın
$ git clone https://github.com/canakboyraz/Stok-Takip-Et.git
$ cd Stok-Takip-Et

# 2. Bağımlılıkları yükleyin
$ npm install

# 3. Ortam değişkenlerini ayarlayın
$ cp .env.example .env
# .env dosyasını Supabase bilgilerinize göre doldurun

# 4. Uygulamayı başlatın
$ npm start
```

---

## 🔗 Supabase Entegrasyonu

### Kimlik Doğrulama
```ts
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});
```

### Ürün Sorgulama
```ts
const { data, error } = await supabase
  .from('products')
  .select('*')
  .order('created_at', { ascending: false });
```

### RLS Politikası (Örnek)
```sql
create policy "Products are viewable by authenticated users"
  on products for select
  to authenticated
  using (true);
```

---

## 📚 Kurulum Detayları

1. **Supabase Projesi Oluşturun**
2. **Tabloları ve RLS Politikalarını Ekleyin** (örnek SQL yukarıda)
3. **.env dosyasını doldurun**
4. **npm install & npm start**

---

## 💡 Supabase Avantajları

- Gerçek zamanlı veri
- Otomatik API ve Auth
- PostgreSQL gücü
- Row Level Security
- Hızlı prototipleme

---

## 🔒 Güvenlik

Bu proje güvenlik en iyi uygulamalarını takip eder:

- ✅ **Row Level Security (RLS)** tüm tablolarda aktif
- ✅ **Güvenlik açıkları düzeltildi** (auth_users_exposed, security_definer_view)
- ✅ **Kapsamlı test coverage** (~725+ test case)
- ✅ **Automated security scanning** (GitHub Actions)
- ✅ **Güvenlik dokümantasyonu** (SECURITY.md)

### Güvenlik Sorunlarını Bildirme

Güvenlik açığı bulduysanız lütfen:
1. **Public issue AÇMAYIN**
2. GitHub Security Advisory oluşturun
3. Veya doğrudan geliştiriciye ulaşın

Detaylı bilgi için: [SECURITY.md](./SECURITY.md)

---

## 🧪 Test Coverage

Proje kapsamlı test altyapısına sahiptir:

- **725+ Test Case** (Unit, Integration, Component, E2E)
- **%50+ Code Coverage** hedefi
- **Automated CI/CD** with GitHub Actions
- **Test Dokümantasyonu:** [TESTING.md](./TESTING.md)

```bash
# Testleri çalıştır
npm test

# Coverage raporu
npm run test:coverage
```

---

## 👤 Geliştirici & Lisans

- Geliştirici: [canakboyraz](https://github.com/canakboyraz)
- Lisans: MIT

<div align="center">
  <sub>Supabase ile geliştirilmiştir ❤️</sub>
</div> 
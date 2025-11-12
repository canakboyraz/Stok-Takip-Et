# 🚀 Vercel Deployment Rehberi

Bu rehber, Stok Takip Sistemi projesini Vercel üzerinde canlıya almanız için adım adım talimatlar içerir.

---

## 📋 Ön Gereksinimler

- [x] GitHub hesabı
- [x] Vercel hesabı (GitHub ile giriş yapılabilir)
- [x] Domain (stoktakipet.com)
- [x] Supabase projesi hazır olmalı

---

## 🎯 Adım 1: Vercel'e Giriş ve Proje İmport

### 1.1 Vercel'e Giriş Yapın
1. https://vercel.com adresine gidin
2. **Sign Up** veya **Login** yapın (GitHub ile giriş önerilir)

### 1.2 Projeyi Import Edin
1. Vercel Dashboard'da **"Add New"** → **"Project"** butonuna tıklayın
2. GitHub reponuzu seçin: `canakboyraz/Stok-Takip-Et`
3. Repository'yi import edin

---

## ⚙️ Adım 2: Environment Variables Ayarları

Vercel'de projeyi import ettikten sonra **Environment Variables** bölümüne aşağıdaki değerleri ekleyin:

### 2.1 Gerekli Environment Variables

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url_here
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NODE_ENV=production
```

### 2.2 Supabase Bilgilerinizi Bulma

1. https://app.supabase.com adresine gidin
2. Projenizi seçin
3. **Settings** → **API** bölümüne gidin
4. Şu bilgileri kopyalayın:
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon/public key** → `REACT_APP_SUPABASE_ANON_KEY`

### 2.3 Vercel'de Environment Variables Ekleme

1. Vercel Dashboard → Projeniz → **Settings** → **Environment Variables**
2. Her bir değişkeni ekleyin:
   - **Name:** REACT_APP_SUPABASE_URL
   - **Value:** [Supabase URL'iniz]
   - **Environment:** Production (✓), Preview (✓), Development (✓)
3. **Save** butonuna tıklayın

---

## 🌐 Adım 3: Custom Domain (stoktakipet.com) Bağlama

### 3.1 Vercel'de Domain Ekleme

1. Vercel Dashboard → Projeniz → **Settings** → **Domains**
2. Domain adınızı girin: `stoktakipet.com`
3. **Add** butonuna tıklayın

### 3.2 DNS Kayıtlarını Güncelleme

Vercel size DNS kayıtlarını gösterecek. Domain sağlayıcınıza (Natro, Turhost, GoDaddy vb.) giderek şu kayıtları ekleyin:

#### A Record (Root Domain için):
```
Type: A
Name: @
Value: 76.76.21.21
TTL: Auto
```

#### CNAME Record (www için):
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto
```

### 3.3 DNS Propagation

- DNS değişikliklerinin yayılması **5 dakika - 48 saat** arası sürebilir
- Genellikle 10-15 dakika içinde aktif olur
- Kontrol etmek için: https://dnschecker.org

---

## 🏗️ Adım 4: Build ve Deploy

### 4.1 Otomatik Deployment

Vercel otomatik olarak:
- ✅ `npm install` çalıştırır
- ✅ `npm run build` ile production build alır
- ✅ Build dosyalarını deploy eder
- ✅ SSL sertifikası oluşturur (otomatik, ücretsiz)
- ✅ CDN'e dağıtır

### 4.2 Deploy İzleme

1. Vercel Dashboard → Projeniz → **Deployments**
2. Son deployment'ın durumunu görün:
   - **Building:** Build alınıyor
   - **Ready:** Canlıda!
   - **Error:** Hata var (loglara bakın)

---

## ✅ Adım 5: Production Test

### 5.1 Temel Testler

Deployment tamamlandıktan sonra:

1. **Ana sayfa testi:**
   - https://stoktakipet.com
   - Sayfa yükleniyor mu?

2. **Login testi:**
   - Giriş yapabiliyorsunuz mu?
   - Supabase bağlantısı çalışıyor mu?

3. **CRUD işlemleri:**
   - Ürün ekleme/güncelleme
   - Stok hareketleri
   - Raporlar

### 5.2 SSL Kontrolü

- https://www.ssllabs.com/ssltest/
- https://stoktakipet.com adresinizi test edin
- A+ rating almalısınız

---

## 🔄 Adım 6: Otomatik Deployment (Git Push)

### 6.1 Git Branch Yapılandırması

Vercel otomatik olarak:
- **main** branch → Production deployment (`stoktakipet.com`)
- Diğer branchler → Preview deployments

### 6.2 Her Commit → Otomatik Deploy

```bash
git add .
git commit -m "feat: yeni özellik eklendi"
git push origin main
```

Vercel otomatik olarak:
1. Yeni commit'i algılar
2. Build alır
3. Deploy eder
4. Size email gönderir

---

## 📊 Monitoring ve Analytics

### 7.1 Vercel Analytics

1. Vercel Dashboard → Projeniz → **Analytics**
2. Şunları görüntüleyebilirsiniz:
   - Ziyaretçi sayısı
   - Sayfa yüklenme süreleri
   - Web Vitals (Core Web Vitals)

### 7.2 Real-time Logs

1. Vercel Dashboard → Projeniz → **Logs**
2. Canlı logları izleyin (hatalar, requestler vb.)

---

## 🔧 Troubleshooting (Sorun Giderme)

### Build Hatası Alıyorsam?

1. **Loglara bakın:**
   - Vercel Dashboard → Deployments → Failed deployment → View Logs

2. **Yaygın hatalar:**
   ```bash
   # TypeScript hatası
   → package.json'da "build" script'ini kontrol edin

   # Environment variable eksik
   → Settings → Environment Variables → Tekrar kontrol edin

   # Node version uyuşmazlığı
   → package.json'a ekleyin:
   {
     "engines": {
       "node": "18.x"
     }
   }
   ```

### Domain Bağlanmadıysa?

1. DNS kayıtlarını kontrol edin:
   ```bash
   nslookup stoktakipet.com
   dig stoktakipet.com
   ```

2. Vercel'de domain status kontrolü:
   - Settings → Domains → stoktakipet.com → "Valid Configuration" yazmalı

3. DNS propagation'u bekleyin (max 48 saat)

### Supabase Bağlantı Hatası?

1. Environment variables doğru mu?
   ```bash
   # Browser console'da kontrol edin:
   console.log(process.env.REACT_APP_SUPABASE_URL)
   ```

2. Supabase RLS policies kontrol edin:
   - Supabase Dashboard → Authentication → Policies
   - Authenticated users için policies aktif olmalı

3. CORS ayarları:
   - Supabase otomatik CORS destekler
   - Eğer hata varsa → Settings → API → CORS → Domain ekleyin

---

## 🎉 Deployment Tamamlandı!

Artık projeniz canlıda!

### Sonraki Adımlar:

- [ ] SSL sertifikası aktif mi? (otomatik olmalı)
- [ ] Domain doğru çalışıyor mu?
- [ ] Tüm CRUD işlemleri test edildi mi?
- [ ] Monitoring aktif mi?
- [ ] Backup planı var mı? (Supabase otomatik backup yapar)

### Faydalı Linkler:

- **Production:** https://stoktakipet.com
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Vercel Docs:** https://vercel.com/docs

---

## 📞 Destek

Sorun yaşarsanız:
1. Vercel Community: https://github.com/vercel/vercel/discussions
2. Supabase Discord: https://discord.supabase.com
3. Proje GitHub Issues: https://github.com/canakboyraz/Stok-Takip-Et/issues

---

<div align="center">
  <sub>🚀 Vercel ile deploy edildi</sub>
</div>

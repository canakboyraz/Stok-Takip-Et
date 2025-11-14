# Sport Buddy - Spor Arkadaşı Bulma Uygulaması

Modern ve kullanıcı dostu bir mobil uygulama ile spor yapmak istediğiniz arkadaşları bulun!

## 🎯 Özellikler

- ✅ Kullanıcı kayıt ve giriş sistemi (Supabase Auth)
- ✅ Spor seansı oluşturma (tenis, futbol, basketbol vb.)
- ✅ Konum bazlı filtreleme
- ✅ Spor türüne göre filtreleme
- ✅ Katılım isteği gönderme ve onaylama
- ✅ Gerçek zamanlı chat özelliği
- ✅ Profil yönetimi
- ✅ Modern ve şık UI (React Native Paper)

## 🛠️ Teknolojiler

- **React Native** - Mobil uygulama framework
- **Expo** - Hızlı geliştirme ve deployment
- **TypeScript** - Tip güvenliği
- **Supabase** - Backend (Auth, Database, Realtime)
- **React Navigation** - Ekran navigasyonu
- **React Native Paper** - UI component kütüphanesi

## 📋 Gereksinimler

- Node.js 20.x veya üzeri
- npm veya yarn
- Expo CLI
- Supabase hesabı

## 🚀 Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
cd sport-buddy-app
npm install
```

### 2. Supabase Projesini Oluşturun

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. SQL Editor'de `supabase-schema.sql` dosyasındaki SQL komutlarını çalıştırın

### 3. Environment Variables

`.env` dosyası oluşturun ve Supabase bilgilerinizi ekleyin:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Uygulamayı Çalıştırın

```bash
npm start
```

Sonra:
- `i` tuşuna basarak iOS simulator'da
- `a` tuşuna basarak Android emulator'da
- Expo Go uygulamasıyla telefonunuzda QR kodu okutarak çalıştırabilirsiniz

## 📱 Kullanım

### Kayıt Olma
1. Uygulamayı açın
2. "Kayıt Ol" butonuna tıklayın
3. Ad, e-posta ve şifrenizi girin
4. Kayıt olun

### Seans Oluşturma
1. Ana ekranda "+" butonuna tıklayın
2. Spor türünü seçin
3. Başlık, açıklama, konum ve tarih bilgilerini girin
4. Maksimum katılımcı sayısını belirleyin
5. Seviye seçin (Başlangıç, Orta, İleri, Herkes)
6. "Seans Oluştur" butonuna tıklayın

### Seansa Katılma
1. Ana ekranda ilginizi çeken seansı seçin
2. Seans detaylarını inceleyin
3. "Katılım İsteği Gönder" butonuna tıklayın
4. Organizatör isteğinizi onayladığında chat'e erişim sağlayabilirsiniz

### Chat Kullanımı
1. Onaylanan seansların detay sayfasından "Sohbete Git" butonuna tıklayın
2. Diğer katılımcılarla gerçek zamanlı mesajlaşın
3. Buluşma detaylarını konuşun

## 📂 Proje Yapısı

```
sport-buddy-app/
├── src/
│   ├── screens/
│   │   ├── Auth/           # Giriş ve kayıt ekranları
│   │   ├── Home/           # Ana sayfa ve seans listesi
│   │   ├── CreateSession/  # Seans oluşturma
│   │   ├── SessionDetail/  # Seans detayları
│   │   ├── Chat/           # Sohbet ekranı
│   │   └── Profile/        # Profil sayfası
│   ├── components/         # Yeniden kullanılabilir componentler
│   ├── services/           # Supabase yapılandırması
│   ├── types/              # TypeScript tipleri
│   ├── navigation/         # Navigation yapısı
│   ├── hooks/              # Custom hooks
│   └── utils/              # Yardımcı fonksiyonlar
├── supabase-schema.sql     # Veritabanı şeması
└── App.tsx                 # Ana uygulama dosyası
```

## 🗄️ Veritabanı Şeması

### Tablolar
- `profiles` - Kullanıcı profilleri
- `sports` - Spor türleri
- `sport_sessions` - Spor seansları
- `session_participants` - Seans katılımcıları
- `messages` - Chat mesajları

### Güvenlik
- Row Level Security (RLS) aktif
- Kullanıcılar sadece kendi verilerini düzenleyebilir
- Chat sadece onaylanmış katılımcılara açık

## 🔒 Güvenlik Özellikleri

- Supabase Authentication ile güvenli giriş
- Row Level Security ile veri koruması
- Şifreler Supabase tarafından güvenli şekilde saklanır
- API anahtarları environment variables'da

## 🚢 Deployment

### iOS App Store

```bash
expo build:ios
```

### Google Play Store

```bash
expo build:android
```

Detaylı bilgi için [Expo Documentation](https://docs.expo.dev/distribution/introduction/)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Yapılacaklar

- [ ] Profil düzenleme özelliği
- [ ] Push notification
- [ ] Fotoğraf yükleme
- [ ] Harita entegrasyonu
- [ ] Kullanıcı rating sistemi
- [ ] Filtre kaydetme
- [ ] Geçmiş seanslar
- [ ] Favori kullanıcılar

## 📄 Lisans

MIT

## 👤 İletişim

Sorularınız için issue açabilirsiniz.

---

**Sport Buddy** ile spor yapmanın keyfini arkadaşlarınızla çıkarın! 🏃‍♂️🎾⚽🏀

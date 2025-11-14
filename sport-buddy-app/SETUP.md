# Sport Buddy - Detaylı Kurulum Rehberi

Bu rehber, Sport Buddy uygulamasını sıfırdan kurmak için gereken tüm adımları içerir.

## 📋 Ön Hazırlık

### Gerekli Araçlar

1. **Node.js** (v20.18.0 veya üzeri)
   - [Node.js İndir](https://nodejs.org/)
   - Kurulum sonrası terminal/cmd'de `node --version` ile kontrol edin

2. **npm** veya **yarn**
   - Node.js ile birlikte gelir
   - `npm --version` ile kontrol edin

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **Expo Go Uygulaması** (Gerçek cihazda test için)
   - [iOS için App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android için Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

5. **Android Studio** (Android emulator için - opsiyonel)
   - [Android Studio İndir](https://developer.android.com/studio)

6. **Xcode** (iOS simulator için - sadece Mac - opsiyonel)
   - App Store'dan indirin

## 🗄️ Supabase Kurulumu

### 1. Hesap Oluşturma

1. [Supabase.com](https://supabase.com)'a gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın veya e-posta ile kayıt olun

### 2. Yeni Proje Oluşturma

1. Dashboard'da "New Project" butonuna tıklayın
2. Proje bilgilerini doldurun:
   - **Name**: sport-buddy
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: Size en yakın bölge (Europe West - London öneriyoruz)
   - **Pricing Plan**: Free tier yeterli
3. "Create new project" butonuna tıklayın
4. Proje oluşturulmasını bekleyin (1-2 dakika)

### 3. Veritabanı Şemasını Kurma

1. Sol menüden "SQL Editor" sekmesine gidin
2. "New query" butonuna tıklayın
3. `supabase-schema.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. Sağ alt köşedeki "Run" butonuna tıklayın
6. "Success. No rows returned" mesajını görmelisiniz

### 4. API Anahtarlarını Alma

1. Sol menüden "Project Settings" (dişli ikonu) sekmesine gidin
2. "API" sekmesine tıklayın
3. Şu bilgileri not edin:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` (uzun bir string)

## 💻 Uygulama Kurulumu

### 1. Projeyi Klonlama veya İndirme

```bash
cd sport-buddy-app
```

### 2. Bağımlılıkları Yükleme

```bash
npm install
```

Bu işlem birkaç dakika sürebilir.

### 3. Environment Variables Ayarlama

1. Proje klasöründe `.env` dosyası oluşturun
2. Aşağıdaki içeriği yapıştırın ve Supabase bilgilerinizle doldurun:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Önemli**:
- `.env` dosyası `.gitignore`'da olduğu için Git'e yüklenmeyecek
- Supabase URL ve Key'i doğru kopyaladığınızdan emin olun
- Hiçbir boşluk veya tırnak işareti eklemeyin

## 🚀 Uygulamayı Çalıştırma

### Development Mode

```bash
npm start
```

Bu komut Expo Dev Server'ı başlatır. Terminal'de bir QR kod göreceksiniz.

### Farklı Platformlarda Çalıştırma

#### 1. Android Emulator (Android Studio gerekli)

```bash
npm run android
```

veya Expo Dev Server'da `a` tuşuna basın.

#### 2. iOS Simulator (Sadece Mac, Xcode gerekli)

```bash
npm run ios
```

veya Expo Dev Server'da `i` tuşuna basın.

#### 3. Web Browser

```bash
npm run web
```

veya Expo Dev Server'da `w` tuşuna basın.

#### 4. Gerçek Cihaz (Expo Go ile)

1. Telefonunuzda Expo Go uygulamasını açın
2. QR kodu tarayın:
   - **iOS**: iPhone kamerasıyla QR kodu okutun
   - **Android**: Expo Go uygulamasında "Scan QR Code" butonuna tıklayın

## 🧪 Test Kullanıcısı Oluşturma

1. Uygulamayı başlatın
2. "Kayıt Ol" ekranına gidin
3. Test bilgileri girin:
   - **Ad Soyad**: Test Kullanıcı
   - **E-posta**: test@example.com
   - **Şifre**: Test123456
4. "Kayıt Ol" butonuna tıklayın
5. Otomatik olarak giriş yapacaksınız

## 🐛 Sorun Giderme

### Hata: "Could not connect to development server"

**Çözüm**:
- Bilgisayar ve telefon aynı WiFi ağında olmalı
- Firewall ayarlarını kontrol edin
- `npm start` komutunu yeniden çalıştırın

### Hata: "Supabase client error"

**Çözüm**:
- `.env` dosyasındaki URL ve Key'i kontrol edin
- Supabase projesinin aktif olduğundan emin olun
- Uygulamayı yeniden başlatın (`npm start`)

### Hata: "Module not found"

**Çözüm**:
```bash
# Cache'i temizle ve yeniden yükle
rm -rf node_modules
npm install
npm start --clear
```

### Android Emulator başlamıyor

**Çözüm**:
- Android Studio'da bir AVD (Android Virtual Device) oluşturun
- AVD Manager'dan emulator'u manuel olarak başlatın
- `npm run android` komutunu yeniden çalıştırın

### iOS Simulator başlamıyor

**Çözüm**:
- Xcode'un en son sürümünü kullandığınızdan emin olun
- Xcode command line tools'u yükleyin:
  ```bash
  xcode-select --install
  ```
- `sudo xcodebuild -license accept` komutunu çalıştırın

## 📱 İlk Kullanım Senaryosu

Uygulamayı test etmek için:

1. **Kayıt Olun**
   - E-posta ve şifre ile kayıt yapın
   - Profil sayfasını inceleyin

2. **Seans Oluşturun**
   - "+" butonuna tıklayın
   - Tenis seçin
   - Başlık: "Tenis Maçı"
   - Konum izni verin
   - Tarih ve saat seçin
   - "Seans Oluştur"

3. **İkinci Kullanıcı** (başka cihaz/tarayıcı)
   - Farklı e-posta ile kayıt yapın
   - Ana sayfada oluşturduğunuz seansı görün
   - Katılım isteği gönderin

4. **İsteği Onaylayın** (ilk kullanıcı)
   - Seans detayına gidin
   - Katılım isteğini onaylayın

5. **Chat Yapın**
   - Her iki kullanıcı da "Sohbete Git" butonuna tıklasın
   - Gerçek zamanlı mesajlaşın

## 🎨 Özelleştirme

### Renk Teması Değiştirme

`src/navigation/AppNavigator.tsx` dosyasında:

```typescript
tabBarActiveTintColor: '#6200ee', // Bu rengi değiştirin
```

### Spor Türleri Ekleme

Supabase SQL Editor'de:

```sql
INSERT INTO sports (name, icon) VALUES
    ('Yeni Spor', 'icon-name');
```

Icon isimleri: [Material Community Icons](https://materialdesignicons.com/)

## 📦 Production Build

### Android APK Oluşturma

```bash
# Development build
expo build:android

# Production build
eas build --platform android
```

### iOS IPA Oluşturma

```bash
# Mac gerekli
expo build:ios

# veya EAS Build
eas build --platform ios
```

## 🔒 Güvenlik Önerileri

1. **Production'da**:
   - `.env` dosyasını asla commit etmeyin
   - Strong password kullanın
   - Supabase RLS politikalarını gözden geçirin

2. **API Keys**:
   - Anon key public olabilir (frontend için)
   - Service role key'i asla frontend'de kullanmayın

3. **Supabase Dashboard**:
   - Two-factor authentication aktif edin
   - API rate limiting ayarlayın

## 📚 Ek Kaynaklar

- [Expo Documentation](https://docs.expo.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)

## 🆘 Yardım Almak

Sorun yaşıyorsanız:

1. README.md dosyasını okuyun
2. GitHub Issues'da arama yapın
3. Yeni issue açın (detaylı açıklama ile)

---

Başarılar! 🎉

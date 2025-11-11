# 🧪 Test Dokümantasyonu

## Test Altyapısı

Bu proje, modern test altyapısı ile donatılmıştır:

- **Test Framework:** Jest
- **React Testing:** React Testing Library
- **Coverage Reporting:** Istanbul/NYC
- **CI/CD:** GitHub Actions

## Test Komutları

```bash
# Tüm testleri çalıştır (watch mode)
npm test

# Testleri coverage raporu ile çalıştır
npm run test:coverage

# Testleri watch mode'da çalıştır
npm run test:watch
```

## Test Yapısı

```
src/
├── utils/
│   ├── validation.ts
│   ├── validation.test.ts           # Utility testleri
│   ├── errorHandler.ts
│   └── errorHandler.test.ts         # Error handling testleri
├── lib/
│   ├── activityLogger.ts
│   ├── activityLogger.test.ts       # Library testleri
│   ├── formatHelpers.ts
│   └── formatHelpers.test.ts        # Format helper testleri
├── hooks/
│   ├── useLocalStorage.ts
│   └── useLocalStorage.test.ts      # Custom hook testleri
├── pages/
│   └── __tests__/
│       ├── Login.test.tsx           # Login page testleri
│       └── Categories.test.tsx      # Categories page testleri
├── components/
│   └── __tests__/
│       └── example.component.test.tsx  # Component test şablonu
├── __tests__/
│   └── integration/
│       └── auth-flow.integration.test.tsx  # Integration testleri
└── setupTests.ts                     # Test konfigürasyonu
```

## Yazılmış Testler

### ✅ Utility Testler

#### 1. **validation.test.ts** (~150 test case)
Tüm validation fonksiyonlarını test eder:
- ✅ Email validation
- ✅ Telefon numarası validation (Türkiye formatı)
- ✅ Şifre validation
- ✅ Fiyat validation
- ✅ Stok validation
- ✅ Tarih validation
- ✅ Ürün kodu validation
- ✅ Genel field validation (required, min/max length)

#### 2. **errorHandler.test.ts** (~40 test case)
Error handling sistemini test eder:
- ✅ AppError class
- ✅ Supabase error handling
- ✅ Network error handling
- ✅ Generic error handling
- ✅ Error message extraction

#### 3. **formatHelpers.test.ts** (~25 test case)
Formatlama fonksiyonlarını test eder:
- ✅ Capitalize fonksiyonu
- ✅ Tarih formatlama (Türkçe locale)
- ✅ Para birimi formatlama (₺)

### ✅ Library Testler

#### 4. **activityLogger.test.ts** (~60 test case)
Activity logging sistemini test eder:
- ✅ logActivity fonksiyonu
- ✅ User authentication kontrolü
- ✅ Project context kontrolü
- ✅ Database insert işlemleri
- ✅ Error handling
- ✅ Activity type labels
- ✅ Entity type labels

### ✅ Custom Hooks Testler

#### 5. **useLocalStorage.test.ts** (~80 test case)
LocalStorage hook'unu test eder:
- ✅ Initial value handling
- ✅ Different data types (string, number, object, array)
- ✅ setValue function (direct and function updater)
- ✅ removeValue function
- ✅ Error handling (quota exceeded, etc.)
- ✅ Multiple hook instances
- ✅ Edge cases (empty strings, zero, false)
- ✅ TypeScript type safety

### ✅ Page Component Testler

#### 6. **Login.test.tsx** (~100 test case)
Login sayfası testleri:
- ✅ Form rendering ve validation
- ✅ Session check on mount
- ✅ Form input handling
- ✅ Successful login flow
- ✅ Login error handling
- ✅ Loading states
- ✅ Sign up functionality
- ✅ Network error recovery
- ✅ Accessibility

#### 7. **Categories.test.tsx** (~60 test case)
Categories sayfası testleri:
- ✅ Data fetching and display
- ✅ Loading states
- ✅ Add category dialog
- ✅ Add category functionality
- ✅ Edit category
- ✅ Delete category
- ✅ Error handling
- ✅ Input validation (empty names)
- ✅ Name formatting (capitalize)
- ✅ Accessibility

### ✅ Integration Testler

#### 8. **auth-flow.integration.test.tsx** (~30 test case)
Authentication flow integration testleri:
- ✅ Complete login journey
- ✅ Login failure and retry
- ✅ Complete sign up flow
- ✅ Session persistence
- ✅ Error recovery
- ✅ Auto-login with existing session

### 📚 Component Test Şablonu

#### 9. **example.component.test.tsx**
Component testleri için örnek şablon:
- ✅ Button interaction testleri
- ✅ Form handling testleri
- ✅ Async operations testleri
- ✅ Best practices ve örnekler

## 📊 Test İstatistikleri

**Toplam Test Case: ~545+**
- Utility Tests: ~215
- Library Tests: ~60
- Custom Hooks: ~80
- Page Components: ~160
- Integration Tests: ~30

## Coverage Hedefleri

| Metrik | Mevcut Hedef | Uzun Vadeli Hedef |
|--------|--------------|-------------------|
| Branches | 50% | 80% |
| Functions | 50% | 80% |
| Lines | 50% | 80% |
| Statements | 50% | 80% |

## Test Yazma Kılavuzu

### 1. Unit Test Örneği

```typescript
import { isValidEmail } from './validation';

describe('Email Validation', () => {
  it('should return true for valid email', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
  });

  it('should return false for invalid email', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });
});
```

### 2. Component Test Örneği

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('should render with correct text', () => {
    render(<MyButton label="Click Me" />);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<MyButton onClick={handleClick} label="Click" />);

    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 3. Async Test Örneği

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { DataComponent } from './DataComponent';

describe('DataComponent', () => {
  it('should load and display data', async () => {
    render(<DataComponent />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Data Loaded')).toBeInTheDocument();
    });
  });
});
```

## Mock Kullanımı

### Supabase Mock

```typescript
jest.mock('./lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));
```

### LocalStorage Mock

```typescript
beforeEach(() => {
  Storage.prototype.getItem = jest.fn((key) => {
    if (key === 'currentProjectId') return '1';
    return null;
  });
});
```

## CI/CD Pipeline

### GitHub Actions

Her push ve pull request'te otomatik olarak:
1. ✅ Bağımlılıklar yüklenir
2. ✅ Testler çalıştırılır
3. ✅ Coverage raporu oluşturulur
4. ✅ Build yapılır
5. ✅ Raporlar artifact olarak saklanır

Workflow dosyası: `.github/workflows/test.yml`

## Test Best Practices

### ✅ Yapılması Gerekenler

1. **Her fonksiyon için test yazın**
   - Happy path (başarılı senaryo)
   - Error cases (hata senaryoları)
   - Edge cases (sınır durumları)

2. **Test isimleri açıklayıcı olsun**
   ```typescript
   // ✅ İyi
   it('should return false when email is empty', () => {})

   // ❌ Kötü
   it('test 1', () => {})
   ```

3. **AAA Pattern kullanın**
   - **Arrange:** Test verilerini hazırla
   - **Act:** Test edilecek fonksiyonu çalıştır
   - **Assert:** Sonucu doğrula

4. **Her test bağımsız olmalı**
   - Testler birbirini etkilememeli
   - Her testte gerekli setup'ı yapın

5. **Mock'ları temizleyin**
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

### ❌ Yapılmaması Gerekenler

1. **Implementation details test etmeyin**
   - State'in nasıl değiştiğini değil, sonucu test edin

2. **Snapshot test'i fazla kullanmayın**
   - Sadece UI değişikliklerini yakalamak için

3. **Tüm kodu mock'lamayın**
   - Sadece external dependencies'i mock'layın

4. **Test'leri skip etmeyin**
   ```typescript
   // ❌ Kötü
   it.skip('should do something', () => {})
   ```

## Gelecek Adımlar

### Kısa Vadeli (1-2 Hafta)
- [ ] Page component testleri (Products, Categories, etc.)
- [ ] Custom hooks testleri
- [ ] Integration testleri

### Orta Vadeli (1 Ay)
- [ ] E2E testler (Cypress/Playwright)
- [ ] Visual regression testleri
- [ ] Performance testleri

### Uzun Vadeli (2-3 Ay)
- [ ] %80+ code coverage
- [ ] Mutation testing
- [ ] Load testing
- [ ] Security testing

## Coverage Raporu Görüntüleme

Test coverage raporunu görmek için:

```bash
# Testleri coverage ile çalıştır
npm run test:coverage

# HTML raporunu aç (tarayıcıda)
open coverage/lcov-report/index.html

# Linux/WSL
xdg-open coverage/lcov-report/index.html
```

## Sorun Giderme

### Problem: Testler çalışmıyor

**Çözüm:**
```bash
# Cache'i temizle
npm test -- --clearCache

# Node modules'i yeniden yükle
rm -rf node_modules
npm install
```

### Problem: Mock çalışmıyor

**Çözüm:**
```typescript
// Mock'u test dosyasının en üstüne koy
jest.mock('./module');

// Her testten önce temizle
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Problem: Async test timeout

**Çözüm:**
```typescript
// Timeout'u artır
it('should work', async () => {
  // test code
}, 10000); // 10 saniye
```

## Kaynaklar

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Coverage Thresholds](https://jestjs.io/docs/configuration#coveragethreshold-object)

---

<div align="center">
  <sub>Test coverage ile daha güvenli kod! 🧪✅</sub>
</div>

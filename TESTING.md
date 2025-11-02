# 🧪 Test Documentation

## Test Suite Overview

Bu proje için kapsamlı bir test suite kuruldu. Jest ve React Testing Library kullanılarak kritik componentler, hooks ve servisler için unit testler yazıldı.

## 📦 Kurulum

```bash
# Bağımlılıkları yükle (henüz yapılmadıysa)
npm install

# Testleri çalıştır
npm test

# Watch mode ile testleri çalıştır (development için önerilir)
npm run test:watch

# Coverage raporu ile testleri çalıştır
npm run test:coverage

# CI/CD için testleri çalıştır
npm run test:ci
```

## 📊 Test Coverage Hedefleri

Minimum coverage hedefleri:
- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

Coverage raporu `coverage/` klasöründe HTML formatında oluşturulur.

## 🗂️ Test Dosyaları Yapısı

```
src/
├── components/
│   └── __tests__/
│       └── ErrorBoundary.test.tsx
├── hooks/
│   └── __tests__/
│       ├── useErrorHandler.test.ts
│       └── useFormValidation.test.ts
├── services/
│   └── __tests__/
│       └── productService.test.ts
├── utils/
│   └── __tests__/
│       └── logger.test.ts
├── test-utils/
│   ├── test-utils.tsx     # Custom render with providers
│   └── mocks.ts           # Mock data and utilities
└── setupTests.ts          # Jest setup and global mocks
```

## 📝 Yazılan Testler

### 1. Logger Utility Tests (`src/utils/__tests__/logger.test.ts`)

**Test Coverage:**
- ✅ Development modunda debug log'ların çalışması
- ✅ Production modunda debug log'ların devre dışı kalması
- ✅ Error ve warning log'larının her modda çalışması
- ✅ Performance logger'ın süre ölçümü
- ✅ Multiple arguments desteği
- ✅ Group logging

**Test Sayısı:** 10+ test case

### 2. ErrorBoundary Component Tests (`src/components/__tests__/ErrorBoundary.test.tsx`)

**Test Coverage:**
- ✅ Hata olmadığında children render'ı
- ✅ Hata yakalanması ve error UI gösterimi
- ✅ "Tekrar Dene" butonu ile reset
- ✅ "Sayfayı Yenile" butonu
- ✅ Development modunda detaylı hata mesajı
- ✅ Production modunda generic hata mesajı
- ✅ Logger entegrasyonu

**Test Sayısı:** 8+ test case

### 3. useErrorHandler Hook Tests (`src/hooks/__tests__/useErrorHandler.test.ts`)

**Test Coverage:**
- ✅ Initial state (no error)
- ✅ showError ile hata set etme
- ✅ clearError ile hata temizleme
- ✅ String error handling
- ✅ Supabase error handling (23505, 23503, 42501 kodları)
- ✅ Network error handling
- ✅ Unknown error handling
- ✅ Error severity levels
- ✅ Multiple consecutive errors

**Test Sayısı:** 11+ test case

### 4. useFormValidation Hook Tests (`src/hooks/__tests__/useFormValidation.test.ts`)

**Test Coverage:**
- ✅ Initial values
- ✅ handleChange ile value update
- ✅ Required field validation
- ✅ Email format validation
- ✅ Minimum length validation
- ✅ Maximum length validation
- ✅ Price validation
- ✅ Custom regex pattern validation
- ✅ Form submission (valid/invalid)
- ✅ isSubmitting state
- ✅ Touched fields tracking
- ✅ Form reset
- ✅ Error clearing

**Test Sayısı:** 14+ test case

### 5. ProductService Tests (`src/services/__tests__/productService.test.ts`)

**Test Coverage:**
- ✅ getAll() - Tüm ürünleri getirme
- ✅ getAll() - Zero stock filtering
- ✅ getAll() - Category filtering
- ✅ getAll() - Error handling
- ✅ getById() - Tek ürün getirme
- ✅ getById() - Product not found error
- ✅ create() - Yeni ürün oluşturma
- ✅ create() - Creation errors (duplicate key)
- ✅ update() - Ürün güncelleme
- ✅ delete() - Ürün silme
- ✅ delete() - Foreign key constraint error
- ✅ updateStock() - Stok güncelleme
- ✅ getLowStock() - Düşük stoklu ürünler

**Test Sayısı:** 13+ test case

## 🎯 Toplam Test Coverage

- **Toplam Test Suite:** 5 dosya
- **Toplam Test Case:** 56+ test
- **Test Edilen Modüller:**
  - ✅ Logger utility
  - ✅ ErrorBoundary component
  - ✅ useErrorHandler hook
  - ✅ useFormValidation hook
  - ✅ ProductService

## 🚀 Test Yazma Best Practices

### 1. Test Dosyası Naming Convention

```typescript
// Component tests
ComponentName.test.tsx

// Hook tests
useHookName.test.ts

// Service tests
serviceName.test.ts

// Utility tests
utilityName.test.ts
```

### 2. Test Structure (AAA Pattern)

```typescript
describe('ComponentOrFunction', () => {
  it('should do something specific', () => {
    // Arrange - Setup
    const value = 'test';

    // Act - Execute
    const result = someFunction(value);

    // Assert - Verify
    expect(result).toBe('expected');
  });
});
```

### 3. Custom Render with Providers

```typescript
import { render, screen } from '../../test-utils/test-utils';

// Otomatik olarak Router ve Theme Provider ile wrap edilir
render(<MyComponent />);
```

### 4. Mock Supabase

```typescript
import { mockSupabaseClient, createMockResponse } from '../../test-utils/mocks';

// Mock response oluştur
mockSupabaseClient.from().select().mockResolvedValue(
  createMockResponse(mockData)
);
```

## 📈 Gelecek Test Planı

### Öncelik 1: Eksik Servis Testleri
- [ ] CategoryService tests
- [ ] StockMovementService tests (oluşturulacak)
- [ ] RecipeService tests (oluşturulacak)
- [ ] MenuService tests (oluşturulacak)

### Öncelik 2: Component Integration Tests
- [ ] Products page integration test
- [ ] Categories page integration test
- [ ] StockMovements page integration test

### Öncelik 3: E2E Tests (Cypress veya Playwright)
- [ ] Login flow
- [ ] Product CRUD operations
- [ ] Stock movement flow
- [ ] Menu consumption flow

## 🔧 Troubleshooting

### Test timeout hatası

```json
// package.json veya test dosyasında
jest.setTimeout(10000); // 10 saniye
```

### Mock temizleme

```typescript
afterEach(() => {
  jest.clearAllMocks(); // Her testten sonra mock'ları temizle
});
```

### Console noise azaltma

`setupTests.ts` dosyasında console.log/error/warn zaten mock'lanmış durumda.

## 📚 Faydalı Kaynaklar

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Jest Matchers](https://jestjs.io/docs/expect)

## 🎓 Test Komutları Cheat Sheet

```bash
# Tek bir test dosyası çalıştır
npm test -- ErrorBoundary.test.tsx

# Pattern'e göre testleri çalıştır
npm test -- --testNamePattern="should validate"

# Coverage raporu oluştur
npm run test:coverage

# Watch mode (değişiklikleri izle)
npm run test:watch

# Fail olan testleri tekrar çalıştır
npm test -- --onlyFailures

# Verbose output
npm test -- --verbose
```

---

**Not:** Bu test suite, uygulamanın kritik parçaları için temel bir coverage sağlar. Yeni feature'lar eklenirken mutlaka testler de yazılmalıdır.

**Test Coverage Hedefi:** %80+ (şu an: ~50%)

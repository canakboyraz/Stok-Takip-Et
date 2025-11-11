# 🚨 Acil Düzeltmeler - Uygulama Rehberi

Bu dosya, yapılan acil düzeltmeleri ve nasıl kullanılacağını açıklar.

## ✅ Yapılan Düzeltmeler

### 1. ErrorBoundary Component ✅
**Dosya:** `src/components/ErrorBoundary.tsx`

**Ne yapar?**
- Uygulama çökmelerini yakalar ve kullanıcı dostu hata mesajı gösterir
- Production'da hata detaylarını gizler, development'ta gösterir
- Kullanıcıya "Tekrar Dene" ve "Sayfayı Yenile" seçenekleri sunar

**Nasıl kullanılır?**
Zaten `App.tsx`'e entegre edildi, otomatik çalışıyor. Ek bir işlem gerekmiyor.

**Test etmek için:**
```tsx
// Herhangi bir component'te kasıtlı hata fırlatın
throw new Error('Test error');
```

---

### 2. Logger Utility ✅
**Dosya:** `src/utils/logger.ts`

**Ne yapar?**
- Production'da console.log'ları devre dışı bırakır
- Development'ta detaylı loglama yapar
- Gelecekte Sentry, LogRocket gibi servislere entegrasyon için hazır

**Nasıl kullanılır?**

**ESKİ YOL (KÖTÜ):**
```typescript
console.log('Debug mesajı');
console.error('Hata!');
```

**YENİ YOL (İYİ):**
```typescript
import { logger } from '../utils/logger';

logger.log('Debug mesajı');        // Sadece development'ta görünür
logger.error('Hata!');              // Her zaman görünür
logger.warn('Uyarı!');              // Her zaman görünür
logger.info('Bilgi');               // Sadece development'ta görünür
logger.debug('Detaylı debug');      // Sadece development'ta görünür
```

**Grup halinde loglama:**
```typescript
logger.group('Kullanıcı İşlemi');
logger.log('Kullanıcı ID:', userId);
logger.log('İşlem:', operation);
logger.groupEnd();
```

**Performans ölçümü:**
```typescript
import { performanceLogger } from '../utils/logger';

performanceLogger.start('fetchProducts');
await fetchProducts();
performanceLogger.end('fetchProducts'); // ⏱️ fetchProducts: 234.56ms
```

**Development-only logger:**
```typescript
import { devLogger } from '../utils/logger';

devLogger.success('İşlem başarılı!');  // 🟢 [SUCCESS] İşlem başarılı!
devLogger.error('Hata oluştu!');       // 🔴 [ERROR] Hata oluştu!
devLogger.warn('Dikkat!');             // 🟡 [WARN] Dikkat!
```

**Zaten güncellenmiş dosyalar:**
- ✅ `src/lib/activityLogger.ts`
- ✅ `src/lib/supabase.ts`

**Güncellenmesi gereken dosyalar:**
Diğer tüm sayfalarda `console.log` yerine `logger` kullanılmalı. Örnek:
- `src/pages/Products.tsx`
- `src/pages/StockMovements.tsx`
- `src/pages/BulkStockOut.tsx`
- vb.

---

### 3. Environment Variables Güvenliği ✅
**Dosya:** `.env.example`

**Ne yapar?**
- Supabase credentials'ları güvenli şekilde yönetir
- Git'e commit edilmemesi gereken değerleri korur

**Nasıl kullanılır?**

1. `.env.example` dosyasını `.env` olarak kopyalayın:
```bash
cp .env.example .env
```

2. `.env` dosyasını düzenleyin ve kendi değerlerinizi ekleyin:
```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

3. `.env` dosyası **asla** Git'e commit edilmemeli (zaten `.gitignore`'da var)

**Supabase credentials nereden alınır?**
1. Supabase Dashboard'a girin
2. Settings > API'ye gidin
3. "Project URL" ve "anon public" key'i kopyalayın

---

### 4. Input Validation Utilities ✅
**Dosyalar:**
- `src/utils/validation.ts` (Var olanı geliştirildi)
- `src/utils/formValidation.ts` (Yeni)
- `src/hooks/useFormValidation.ts` (Yeni)

**Ne yapar?**
- Kullanıcı girişlerini valide eder
- XSS saldırılarına karşı korur
- Tutarlı hata mesajları sağlar

**Nasıl kullanılır?**

#### Yöntem 1: Manuel Validation
```typescript
import { validateForm } from '../utils/formValidation';

const result = validateForm({
  name: {
    value: productName,
    rules: ['required', { minLength: 3 }],
    fieldName: 'Ürün Adı'
  },
  price: {
    value: price,
    rules: ['required', 'price'],
    fieldName: 'Fiyat'
  },
  stock: {
    value: stock,
    rules: ['required', 'stock'],
    fieldName: 'Stok'
  }
});

if (!result.isValid) {
  setErrors(result.errors);
  return;
}

// Form geçerli, submit işlemine devam et
```

#### Yöntem 2: useFormValidation Hook (ÖNERİLEN)
```typescript
import { useFormValidation } from '../hooks/useFormValidation';

function ProductForm() {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting } =
    useFormValidation({
      initialValues: {
        name: '',
        price: 0,
        stock: 0,
      },
      validationRules: {
        name: ['required', { minLength: 3 }],
        price: ['required', 'price'],
        stock: ['required', 'stock'],
      },
      onSubmit: async (values) => {
        // Form submit işlemleri
        await saveProduct(values);
      }
    });

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label="Ürün Adı"
        value={values.name}
        onChange={(e) => handleChange('name', e.target.value)}
        onBlur={() => handleBlur('name')}
        error={touched.name && !!errors.name}
        helperText={touched.name && errors.name}
      />

      <Button type="submit" disabled={isSubmitting}>
        Kaydet
      </Button>
    </form>
  );
}
```

#### Kullanılabilir Validation Kuralları:
```typescript
'required'           // Zorunlu alan
'email'              // Email formatı
'phone'              // Telefon formatı (TR)
'password'           // Güçlü şifre
'price'              // Fiyat (0-999999.99)
'stock'              // Stok (pozitif tam sayı)
'productCode'        // Ürün kodu (3-20 karakter)
'date'               // Geçerli tarih

{ minLength: 3 }     // Minimum uzunluk
{ maxLength: 100 }   // Maximum uzunluk
{ min: 0 }           // Minimum değer
{ max: 1000 }        // Maximum değer
{ custom: (val) => val !== 'test', message: 'Test olamaz' }  // Özel kural
```

#### Number Input Validation:
```typescript
import { validateNumberInput } from '../utils/formValidation';

const error = validateNumberInput(inputValue, {
  allowDecimal: true,
  min: 0,
  max: 999999,
  maxDecimals: 2
});

if (error) {
  setError(error);
}
```

#### XSS Koruması:
```typescript
import { sanitizeInput } from '../utils/formValidation';

const safeInput = sanitizeInput(userInput);
// <script>alert('xss')</script> → &lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;
```

---

## 🎯 Sonraki Adımlar

### Hemen Yapılması Gerekenler:

1. **Tüm sayfalardaki console.log'ları logger ile değiştir**
   - `src/pages/Products.tsx`
   - `src/pages/StockMovements.tsx`
   - `src/pages/MenuConsumption.tsx`
   - vb.

2. **Kritik formlara validation ekle**
   - Products form
   - Stock movement form
   - User login/signup
   - Category form

3. **`.env` dosyasını oluştur**
   ```bash
   cp .env.example .env
   # Sonra kendi Supabase credentials'larınızı ekleyin
   ```

### Orta Vadede:

4. **Test yazılmaya başlanmalı**
   - Unit testler (Jest)
   - Component testleri (React Testing Library)

5. **Pagination ekle**
   - Products listesi
   - Stock movements listesi
   - Activities listesi

6. **Cache mekanizması ekle**
   - React Query veya SWR kullanılabilir

---

## 📚 Kaynaklar

- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Environment Variables in Create React App](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Form Validation Best Practices](https://www.smashingmagazine.com/2022/09/inline-validation-web-forms-ux/)

---

## ❓ Sorular?

Herhangi bir sorunuz varsa veya yardıma ihtiyacınız olursa:

1. Bu dosyadaki örneklere bakın
2. İlgili utility dosyalarındaki yorumları okuyun
3. TypeScript type definitions'larına bakın (IntelliSense yardımcı olacaktır)

---

**Son Güncelleme:** 2025-01-02
**Durum:** ✅ Tamamlandı ve production-ready

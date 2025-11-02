# 📋 İş Planı - Öncelikli Görevler

**Tarih:** 2025-01-02
**Branch:** `claude/analyze-app-issues-011CUiuCYRqH8DHJbZNmGm9r`
**Son Commit:** `e85cdd3` (Test Suite)

---

## 🎯 Genel Hedefler

1. ✅ Logger utility ile console.log temizliği (TAMAMLANDI)
2. ✅ Test suite kurulumu (TAMAMLANDI)
3. 🔄 Service Layer yaygınlaştırma (DEVAM EDİYOR)
4. ⏳ Error Handling yaygınlaştırma
5. ⏳ Form Validation uygulama
6. ⏳ TypeScript 'any' temizliği
7. ⏳ Performance optimizations

---

## 📊 Öncelik 1: Service Layer Migration (YÜKSEK ÖNCELİK)

### Hedef
Tüm API çağrılarını service layer'a taşımak, kod tekrarını azaltmak, test edilebilirliği artırmak.

### Yapılacaklar

#### 1.1. CategoryService Oluşturma
- [ ] `src/services/categoryService.ts` (ZATEn var, test eklenecek)
- [ ] CategoryService testleri yaz
- [ ] Categories.tsx sayfasını migrate et

**Etki:** Categories.tsx, ProductAdd/Edit formları

#### 1.2. StockMovementService Oluşturma
- [ ] `src/services/stockMovementService.ts` oluştur
  - getAll(filters)
  - getById(id)
  - create(movement)
  - getBulkMovements(projectId)
  - reverseBulkMovement(bulkId)
- [ ] StockMovementService testleri yaz
- [ ] StockMovements.tsx sayfasını migrate et

**Etki:** StockMovements.tsx, BulkStockOut.tsx

#### 1.3. RecipeService Oluşturma
- [ ] `src/services/recipeService.ts` oluştur
  - getAll(filters)
  - getById(id)
  - create(recipe, ingredients)
  - update(id, recipe, ingredients)
  - delete(id)
  - getIngredients(recipeId)
- [ ] RecipeService testleri yaz
- [ ] Recipes.tsx ve RecipeAdd.tsx'i migrate et

**Etki:** Recipes.tsx, RecipeAdd.tsx

#### 1.4. MenuService Oluşturma
- [ ] `src/services/menuService.ts` oluştur
  - getAll(filters)
  - getById(id)
  - create(menu, items)
  - update(id, menu, items)
  - delete(id)
  - getMenuItems(menuId)
  - calculateConsumption(menuId, guestCount)
- [ ] MenuService testleri yaz
- [ ] Menus.tsx, MenuAdd.tsx, MenuConsumption.tsx'i migrate et

**Etki:** Menus.tsx, MenuAdd.tsx, MenuConsumption.tsx

#### 1.5. ExpenseService Oluşturma
- [ ] `src/services/expenseService.ts` oluştur
  - getAll(filters)
  - getById(id)
  - create(expense)
  - update(id, expense)
  - delete(id)
  - getByDateRange(startDate, endDate)
  - getTotalByCategory(projectId)
- [ ] ExpenseService testleri yaz
- [ ] ExpenseList.tsx, ExpenseAdd.tsx'i migrate et

**Etki:** ExpenseList.tsx, ExpenseAdd.tsx

#### 1.6. PersonnelService Oluşturma
- [ ] `src/services/personnelService.ts` oluştur
  - getAll(filters)
  - getById(id)
  - create(personnel)
  - update(id, personnel)
  - delete(id)
  - getTimesheet(personnelId, dateRange)
- [ ] PersonnelService testleri yaz
- [ ] PersonnelList.tsx, PersonnelAdd.tsx, PersonnelTimesheet.tsx'i migrate et

**Etki:** PersonnelList.tsx, PersonnelAdd.tsx, PersonnelTimesheet.tsx

### Tahmini Süre: 4-6 saat
### Öncelik: 🔴 YÜKSEK

---

## 📊 Öncelik 2: Error Handling Yaygınlaştırma (YÜKSEK ÖNCELİK)

### Hedef
Tüm sayfalarda `useErrorHandler` hook kullanımı, tutarlı hata yönetimi.

### Yapılacaklar

#### 2.1. Service Layer ile Birlikte Entegrasyon
Her service migration'ında:
- [ ] useErrorHandler hook ekle
- [ ] try-catch blokları standardize et
- [ ] Kullanıcı dostu hata mesajları

#### 2.2. Sayfalar (Service migration olmayan)
- [ ] Dashboard.tsx
- [ ] Activities.tsx
- [ ] ProjectSelection.tsx
- [ ] Login.tsx
- [ ] Signup.tsx

### Tahmini Süre: 2-3 saat
### Öncelik: 🔴 YÜKSEK

---

## 📊 Öncelik 3: Form Validation Uygulama (ORTA ÖNCELİK)

### Hedef
Tüm formlarda `useFormValidation` hook kullanımı, XSS koruması.

### Yapılacaklar

#### 3.1. Product Forms
- [ ] Products.tsx - Add/Edit dialog
  - Required: name, category, unit, price
  - Min/Max: name (3-100 chars), price (>0)

#### 3.2. Category Forms
- [ ] Categories.tsx - Add/Edit dialog
  - Required: name
  - Min/Max: name (2-50 chars)
  - XSS sanitization

#### 3.3. Recipe Forms
- [ ] RecipeAdd.tsx
  - Required: name, category, serving_size
  - Min/Max: name (3-100), preparation_time (>0)
  - Ingredients validation (at least 1)

#### 3.4. Menu Forms
- [ ] MenuAdd.tsx
  - Required: name, date
  - Min/Max: name (3-100)
  - Recipes validation (at least 1)

#### 3.5. Expense Forms
- [ ] ExpenseAdd.tsx
  - Required: amount, category, date
  - Price validation: amount (>0)

#### 3.6. Personnel Forms
- [ ] PersonnelAdd.tsx
  - Required: name, position, salary
  - Email validation (if provided)
  - Price validation: salary (>0)

### Tahmini Süre: 3-4 saat
### Öncelik: 🟡 ORTA

---

## 📊 Öncelik 4: TypeScript 'any' Temizliği (ORTA ÖNCELİK)

### Hedef
Tip güvenliğini artırmak, 'any' kullanımını minimize etmek.

### Yapılacaklar

#### 4.1. High Priority Files (20+ dosya)
- [ ] src/pages/*.tsx - Error handler parametreleri
  - `catch (error: any)` → `catch (error: unknown)`
  - `handleError(error: any)` → `handleError(error: unknown)`

#### 4.2. Event Handlers
- [ ] Form event handlers
  - `onChange={(e: any)}` → `onChange={(e: React.ChangeEvent<HTMLInputElement>)}`
  - `onSubmit={(e: any)}` → `onSubmit={(e: React.FormEvent<HTMLFormElement>)}`

#### 4.3. Supabase Response Types
- [ ] API response type definitions
- [ ] Custom type guards oluştur

### Tahmini Süre: 2-3 saat
### Öncelik: 🟡 ORTA

---

## 📊 Öncelik 5: Performance Optimizations (DÜŞÜK ÖNCELİK)

### Hedef
Gereksiz re-render'ları önlemek, app performansını artırmak.

### Yapılacaklar

#### 5.1. React.memo Optimizations
- [ ] ProductCard component
- [ ] CategoryItem component
- [ ] RecipeCard component
- [ ] Pagination component

#### 5.2. useMemo Optimizations
- [ ] Filtered lists (products, recipes, etc.)
- [ ] Expensive calculations (total price, stock calculations)
- [ ] Sorted data arrays

#### 5.3. useCallback Optimizations
- [ ] Event handlers in lists
- [ ] Parent-to-child callback props
- [ ] API call functions

#### 5.4. Code Splitting
- [ ] React.lazy for heavy pages
- [ ] Suspense boundaries
- [ ] Dynamic imports for modals/dialogs

### Tahmini Süre: 3-4 saat
### Öncelik: 🟢 DÜŞÜK

---

## 📊 Öncelik 6: Additional Tests (DÜŞÜK ÖNCELİK)

### Yapılacaklar

- [ ] CategoryService tests
- [ ] StockMovementService tests
- [ ] RecipeService tests
- [ ] MenuService tests
- [ ] ExpenseService tests
- [ ] PersonnelService tests
- [ ] Integration tests (Products page)
- [ ] Integration tests (StockMovements page)

### Tahmini Süre: 4-5 saat
### Öncelik: 🟢 DÜŞÜK

---

## 📅 Çalışma Sırası (Önerilen)

### Faz 1: Service Layer (Gün 1-2)
1. ✅ CategoryService + Tests (1 saat)
2. ✅ StockMovementService + Tests (1.5 saat)
3. ✅ RecipeService + Tests (1.5 saat)
4. ✅ MenuService + Tests (2 saat)
5. ✅ ExpenseService + Tests (1 saat)
6. ✅ PersonnelService + Tests (1 saat)

**Total: 8 saat**

### Faz 2: Migration + Error Handling (Gün 2-3)
1. Categories.tsx migration (30 min)
2. StockMovements.tsx migration (1 saat)
3. Recipes.tsx + RecipeAdd.tsx migration (1.5 saat)
4. Menus.tsx + MenuAdd.tsx + MenuConsumption.tsx migration (2 saat)
5. Expenses sayfaları migration (1 saat)
6. Personnel sayfaları migration (1 saat)
7. Diğer sayfalara error handling (1 saat)

**Total: 8 saat**

### Faz 3: Form Validation (Gün 3-4)
1. Product forms validation (1 saat)
2. Category forms validation (30 min)
3. Recipe forms validation (1 saat)
4. Menu forms validation (1 saat)
5. Expense forms validation (30 min)
6. Personnel forms validation (30 min)

**Total: 4.5 saat**

### Faz 4: TypeScript + Performance (Gün 4-5)
1. TypeScript 'any' temizliği (2.5 saat)
2. React.memo optimizations (1 saat)
3. useMemo/useCallback optimizations (1.5 saat)
4. Code splitting (1 saat)

**Total: 6 saat**

---

## 📊 Toplam Tahmini Süre

- **Faz 1:** 8 saat
- **Faz 2:** 8 saat
- **Faz 3:** 4.5 saat
- **Faz 4:** 6 saat

**TOPLAM: ~26.5 saat** (yaklaşık 3-4 gün yoğun çalışma)

---

## 🎯 Başarı Kriterleri

### Service Layer
- ✅ Her model için service class
- ✅ Tüm API çağrıları service'lerde
- ✅ Her service için testler
- ✅ %80+ service test coverage

### Error Handling
- ✅ Tüm sayfalarda useErrorHandler
- ✅ Kullanıcı dostu Türkçe mesajlar
- ✅ Supabase error mapping

### Form Validation
- ✅ Tüm formlarda useFormValidation
- ✅ XSS koruması aktif
- ✅ Client-side validation

### TypeScript
- ✅ 'any' kullanımı %90 azaltıldı
- ✅ Explicit type definitions
- ✅ Type guards kullanımı

### Performance
- ✅ React.memo critical components
- ✅ Expensive calculations memoized
- ✅ Code splitting major routes

---

## 📝 Notlar

- Her faz sonunda commit + push
- Her service oluşturulduğunda test yaz
- Migration sırasında mevcut fonksiyonaliteyi koruyun
- Breaking changes'ten kaçının

**SON GÜNCELLEME:** 2025-01-02

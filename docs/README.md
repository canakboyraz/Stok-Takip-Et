# Stok Takip Sistemi - Teknik Bilgiler

Bu belge, Stok Takip uygulaması için teknik bilgileri ve problemlerin çözümlerini içerir.

## Kategori Aynı İsim Sorunu

Supabase veritabanında, `categories` tablosunda varsayılan olarak kategori isimlerinde bir unique constraint (benzersiz kısıt) bulunmaktadır. Bu kısıt, aynı isimli kategorilerin oluşturulmasını engellemektedir.

### Sorunu Çözmek İçin

1. Supabase kontrol paneline giriş yapın.
2. Sol menüden "SQL Editor" seçeneğine tıklayın.
3. `remove_category_unique_constraint.sql` dosyasındaki SQL komutlarını kopyalayın ve editöre yapıştırın.
4. Komutları çalıştırın. İlk sorgu mevcut kısıtlamaları gösterecektir.
5. Sonrasında, listedeki kısıtlama(lar)ı kaldırmak için ikinci komutu çalıştırın.

### Yapılan Değişiklikler

1. Aynı isimli kategorilerin eklenebilmesi için unique constraint kaldırıldı.
2. Kategori listesinde aynı isimli kategorileri ayırt etmek için ID'leri gösterildi.
3. Kategori ekleme/düzenleme formunda validasyon iyileştirildi.

## Proje Bazlı Veri İzolasyonu

Her kullanıcı sadece kendi projelerini görür ve yönetir. Bir kullanıcı farklı bir mail ile giriş yaptığında, sadece o mail ile oluşturduğu projeleri görecektir.

### Veri Güvenliği

- Tüm veri erişimleri kullanıcı kimliğine göre filtrelenir
- Proje ID'leri localStorage'da saklanır
- Her sayfa yüklendiğinde doğru projeye ait veriler gösterilir

## SQL Komutları Kılavuzu

Veritabanı üzerinde manuel işlemler yapmak için kullanabileceğiniz bazı faydalı SQL komutları:

```sql
-- Projeleri listeleme
SELECT * FROM projects ORDER BY created_at DESC;

-- Kategorileri listeleme
SELECT * FROM categories WHERE project_id = [PROJE_ID] ORDER BY name;

-- Ürünleri listeleme
SELECT * FROM products WHERE project_id = [PROJE_ID] ORDER BY name;

-- Stok hareketlerini listeleme
SELECT * FROM stock_movements WHERE project_id = [PROJE_ID] ORDER BY date DESC;
```

Bu komutları kullanırken `[PROJE_ID]` kısmını gerçek proje ID'niz ile değiştirin. 
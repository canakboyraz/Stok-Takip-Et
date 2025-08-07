# Çoklu Kullanıcı Sistemindeki Veri Tipi Uyumsuzluğu Sorunu ve Çözümü

Stok Takip uygulaması için hazırlanan çoklu kullanıcı sisteminde karşılaşılan veri tipi uyumsuzluğu sorununu ve çözümünü açıklayan bu belge, sistemin doğru çalışmasını sağlamak için gerekli adımları içerir.

## Sorun Açıklaması

Supabase ve uygulamamız içindeki veritabanı tablolarda, kullanıcı ID'leri farklı veri tiplerinde tutulabilmektedir:

- `auth.users` tablosunda kullanıcı ID'leri genellikle `UUID` tipindedir.
- `projects` tablosunda kullanıcı ID'leri `TEXT` veya `VARCHAR` tipinde olabilir.

Çoklu kullanıcı izinleri sisteminde, bu iki tablo arasında ilişki kurarken veri tipi uyumsuzluğu hatası oluşmaktadır:

```
ERROR: 42883: operator does not exist: text = uuid
```

Bu hata, farklı veri tipindeki sütunları doğrudan karşılaştırmaya çalıştığımızda ortaya çıkar.

## Çözüm Yaklaşımı

Hazırladığımız çözüm, şu prensiplere dayanmaktadır:

1. **Tutarlı Veri Tipi Kullanımı**: Tüm kullanıcı ID'lerini `TEXT` formatında saklayarak veri tipi uyumsuzluğunu ortadan kaldırıyoruz.

2. **Tip Dönüşümleri**: Supabase'in `auth.uid()` fonksiyonu UUID döndürdüğünde, bunu `::text` ile text'e dönüştürüyoruz.

3. **Mevcut Tabloların Korunması**: Mevcut `projects` tablosunun yapısında değişiklik yapmadan, yeni oluşturulan `project_permissions` tablosunun uyumlu olmasını sağlıyoruz.

## Uygulama Adımları

1. Öncelikle `user_permissions_fix2.sql` dosyası çalıştırılmalıdır. Bu dosya:

   - Varsa mevcut `project_permissions` tablosunu temizler
   - Kullanıcı ID'lerini TEXT formatında tutan yeni bir tablo oluşturur
   - Dönüşüm yaparak mevcut projelerin sahiplerini izinler tablosuna ekler
   - Uyumlu view ve SQL fonksiyonlarını oluşturur

2. SQL dosyasını çalıştırmak için:
   - Supabase kontrol paneline giriş yapın
   - Sol menüden "SQL Editor" seçeneğine tıklayın
   - `user_permissions_fix2.sql` dosyasındaki kodu editöre yapıştırın
   - "Run" düğmesine tıklayın

3. Uygulama kodunuzda bir değişiklik yapmanız gerekmiyor, çünkü SQL tarafındaki dönüşümler otomatik olarak gerçekleştirilecektir.

## Dikkat Edilmesi Gerekenler

- SQL dosyasını çalıştırdıktan sonra, veritabanı şeması ve görünümlerinde bir sorun olmadığından emin olun.
- Uygulamayı yeniden başlatarak izinler sistemini test edin.
- İlk denemede herhangi bir kullanıcı izni ekleyemezseniz, doğru proje sahibi izni oluşturulmamış olabilir. Bu durumda, SQL dosyasındaki 3. adımı tekrar çalıştırın.

## Olası Hatalar ve Çözümleri

1. **Veri Tipi Hataları**: Farklı bir veri tipi hatası alırsanız, `project_permissions` tablosunun sütun tiplerini kontrol edin ve gerekirse güncelleyin.

2. **İzin Verme Hataları**: İzin verirken "Bu işlem için yetkiniz yok" hatası alırsanız, öncelikle kendinizi `project_permissions` tablosuna proje sahibi olarak manuel ekleyin:

```sql
INSERT INTO project_permissions (project_id, user_id, permission_level, granted_by)
VALUES (
  [PROJE_ID], 
  [SİZİN_KULLANICI_ID_NİZ], 
  'owner', 
  [SİZİN_KULLANICI_ID_NİZ]
);
```

3. **Kullanıcı Bulunamadı Hataları**: Supabase'deki auth.users tablosunda kullanıcı e-postası bulunduğundan emin olun. Kullanıcıların önce sisteme kaydolması gerektiğini unutmayın. 
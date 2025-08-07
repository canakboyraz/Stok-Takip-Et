# Stok Takip Sistemi - Çoklu Kullanıcı Rehberi

Bu belge, Stok Takip uygulamasında birden fazla kullanıcının aynı projelere erişim sağlayabilmesi için yapılan değişiklikleri açıklamaktadır.

## Yeni Özellikler

1. **Proje İzinleri Sistemi**: Artık projelerinize başka kullanıcıları davet edebilir ve onlara farklı yetki seviyeleri atayabilirsiniz.
2. **Paylaşılan Projeler**: Diğer kullanıcıların sizinle paylaştığı projelere erişebilirsiniz.
3. **Yetki Seviyeleri**: Üç farklı yetki seviyesi bulunmaktadır:
   - **Sahip (owner)**: Tam yetki, proje silebilir ve kullanıcıları yönetebilir.
   - **Düzenleyici (editor)**: Stok hareketleri ve ürünleri ekleyip düzenleyebilir.
   - **Görüntüleyici (viewer)**: Sadece projeyi ve verileri görüntüleyebilir, değişiklik yapamaz.

## Nasıl Kullanılır

### Yeni Kullanıcı Ekleme

1. Proje seçim ekranında, bir projenin kartındaki "İzinler" butonuna tıklayın.
2. Açılan diyalogda "Kullanıcı Ekle" bölümünü kullanın.
3. Eklemek istediğiniz kullanıcının e-posta adresini girin.
4. Yetki seviyesini seçin: Görüntüleyici, Düzenleyici veya Sahip.
5. "Ekle" butonuna tıklayın.

### Kullanıcı İzinlerini Yönetme

1. "İzinler" diyaloğunda mevcut tüm kullanıcıları görebilirsiniz.
2. Sadece proje sahipleri başka kullanıcıları ekleyip kaldırabilir.
3. Bir kullanıcının iznini kaldırmak için listedeki çöp kutusu simgesine tıklayın.

### Paylaşılan Projelere Erişim

1. Proje seçim ekranında, size ait projelerin altında "Sizinle Paylaşılan Projeler" bölümünü göreceksiniz.
2. Bu listedeki projelere tıklayarak erişebilirsiniz.
3. Yetki seviyenize göre işlemler yapabilirsiniz.

## Teknik Bilgiler

Çoklu kullanıcı sistemi, veritabanında aşağıdaki yapılarla çalışır:

1. **project_permissions tablosu**: Proje-kullanıcı ilişkilerini ve yetki seviyelerini saklar.
2. **Row Level Security (RLS)**: Kullanıcıların sadece yetkili oldukları projelerin verilerine erişmesini sağlar.
3. **SQL Functions**: İzin ekleme ve kaldırma işlemleri güvenli SQL fonksiyonları aracılığıyla yapılır.

## Önemli Notlar

- Bir kullanıcı sisteme davet edildikten sonra, davet edilen kullanıcının sistemde zaten bir hesabı olması gerekmektedir.
- Eğer davet edilen e-posta adresine sahip bir kullanıcı yoksa, bu kişiye önce kayıt olmasını söylemelisiniz.
- Bir projenin en az bir sahibi olmalıdır. Son sahip kullanıcı silinemez.
- Proje sahibi bile olsanız, projenin asıl oluşturucusu değilseniz, projeyi tamamen silme yetkiniz olmayabilir.

## Veritabanı Kurulumu

Çoklu kullanıcı sistemini aktifleştirmek için veritabanında `user_permissions.sql` scriptini çalıştırmanız gerekiyor. Bu script:

1. Gerekli tabloları oluşturur
2. RLS politikalarını ayarlar
3. Yetkilendirme fonksiyonlarını tanımlar
4. Mevcut proje sahiplerini otomatik olarak yeni sisteme aktarır

Eğer bir hata ile karşılaşırsanız, veritabanı loglarını kontrol edin ve gerekirse teknik desteğe başvurun. 
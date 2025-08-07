/**
 * Verilen metnin ilk harfini büyük, geri kalanını küçük harf yapar
 * @param text Formatlanacak metin
 * @returns Formatlanmış metin
 */
export const capitalizeFirstLetter = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Verilen tarih değerini gün.ay.yıl formatında döndürür
 * @param dateString Tarih string'i
 * @returns Formatlanmış tarih string'i veya "-" (tarih yoksa)
 */
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR');
};

/**
 * Verilen sayıyı para birimi formatında gösterir
 * @param value Formatlanacak sayı
 * @returns TL formatında para değeri
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(value);
}; 
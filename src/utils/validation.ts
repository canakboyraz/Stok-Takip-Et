// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Turkish format)
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Password validation
export const isValidPassword = (password: string): boolean => {
  // En az 8 karakter, bir büyük harf, bir küçük harf, bir rakam
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// Price validation
export const isValidPrice = (price: number): boolean => {
  return price > 0 && price <= 999999.99;
};

// Stock quantity validation
export const isValidStock = (stock: number): boolean => {
  return Number.isInteger(stock) && stock >= 0;
};

// Required field validation
export const isRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined && value !== '';
};

// Min length validation
export const minLength = (value: string, min: number): boolean => {
  return value.trim().length >= min;
};

// Max length validation
export const maxLength = (value: string, max: number): boolean => {
  return value.trim().length <= max;
};

// Date validation
export const isValidDate = (date: string): boolean => {
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

// Future date validation
export const isFutureDate = (date: string): boolean => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

// Product code validation
export const isValidProductCode = (code: string): boolean => {
  // Sadece harf, rakam ve tire içerebilir, en az 3 karakter
  const codeRegex = /^[a-zA-Z0-9-]{3,20}$/;
  return codeRegex.test(code);
};

// Validation error messages
export const ValidationMessages = {
  REQUIRED: 'Bu alan zorunludur',
  INVALID_EMAIL: 'Geçerli bir email adresi giriniz',
  INVALID_PHONE: 'Geçerli bir telefon numarası giriniz (05XX XXX XX XX)',
  INVALID_PASSWORD: 'Şifre en az 8 karakter olmalı ve büyük harf, küçük harf, rakam içermeli',
  INVALID_PRICE: 'Geçerli bir fiyat giriniz (0-999999.99)',
  INVALID_STOCK: 'Geçerli bir stok miktarı giriniz (pozitif tam sayı)',
  MIN_LENGTH: (min: number) => `En az ${min} karakter olmalıdır`,
  MAX_LENGTH: (max: number) => `En fazla ${max} karakter olmalıdır`,
  INVALID_DATE: 'Geçerli bir tarih giriniz',
  FUTURE_DATE_REQUIRED: 'Gelecek bir tarih giriniz',
  INVALID_PRODUCT_CODE: 'Ürün kodu 3-20 karakter arası olmalı ve sadece harf, rakam, tire içermeli'
} as const; 
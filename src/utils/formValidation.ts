/**
 * Form Validation Utility
 *
 * Bu utility, form validasyonlarını kolayca yapmak için helper fonksiyonlar sağlar.
 * Mevcut validation.ts'deki fonksiyonları kullanır ve form validasyonu için
 * daha kullanıcı dostu bir interface sağlar.
 */

import {
  isRequired,
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidPrice,
  isValidStock,
  isValidProductCode,
  isValidDate,
  minLength,
  maxLength,
  ValidationMessages,
} from './validation';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FieldValidation {
  value: unknown;
  rules: ValidationRule[];
  fieldName?: string;
}

export type ValidationRule =
  | 'required'
  | 'email'
  | 'phone'
  | 'password'
  | 'price'
  | 'stock'
  | 'productCode'
  | 'date'
  | { minLength: number }
  | { maxLength: number }
  | { min: number }
  | { max: number }
  | { custom: (value: unknown) => boolean; message: string };

/**
 * Tek bir alanı valide eder
 */
export const validateField = (
  value: unknown,
  rules: ValidationRule[],
  fieldName: string = 'Alan'
): string | null => {
  for (const rule of rules) {
    if (rule === 'required') {
      if (!isRequired(value)) {
        return ValidationMessages.REQUIRED;
      }
    } else if (rule === 'email') {
      if (value && !isValidEmail(value)) {
        return ValidationMessages.INVALID_EMAIL;
      }
    } else if (rule === 'phone') {
      if (value && !isValidPhone(value)) {
        return ValidationMessages.INVALID_PHONE;
      }
    } else if (rule === 'password') {
      if (value && !isValidPassword(value)) {
        return ValidationMessages.INVALID_PASSWORD;
      }
    } else if (rule === 'price') {
      if (value !== null && value !== undefined && !isValidPrice(Number(value))) {
        return ValidationMessages.INVALID_PRICE;
      }
    } else if (rule === 'stock') {
      if (value !== null && value !== undefined && !isValidStock(Number(value))) {
        return ValidationMessages.INVALID_STOCK;
      }
    } else if (rule === 'productCode') {
      if (value && !isValidProductCode(value)) {
        return ValidationMessages.INVALID_PRODUCT_CODE;
      }
    } else if (rule === 'date') {
      if (value && !isValidDate(value)) {
        return ValidationMessages.INVALID_DATE;
      }
    } else if (typeof rule === 'object') {
      if ('minLength' in rule) {
        if (value && !minLength(value, rule.minLength)) {
          return ValidationMessages.MIN_LENGTH(rule.minLength);
        }
      } else if ('maxLength' in rule) {
        if (value && !maxLength(value, rule.maxLength)) {
          return ValidationMessages.MAX_LENGTH(rule.maxLength);
        }
      } else if ('min' in rule) {
        if (value !== null && value !== undefined && Number(value) < rule.min) {
          return `${fieldName} en az ${rule.min} olmalıdır`;
        }
      } else if ('max' in rule) {
        if (value !== null && value !== undefined && Number(value) > rule.max) {
          return `${fieldName} en fazla ${rule.max} olmalıdır`;
        }
      } else if ('custom' in rule) {
        if (!rule.custom(value)) {
          return rule.message;
        }
      }
    }
  }

  return null;
};

/**
 * Birden fazla alanı valide eder
 */
export const validateForm = (
  fields: Record<string, FieldValidation>
): ValidationResult => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldKey, field] of Object.entries(fields)) {
    const error = validateField(
      field.value,
      field.rules,
      field.fieldName || fieldKey
    );

    if (error) {
      errors[fieldKey] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
};

/**
 * Number input validasyonu (quantity, price vb.)
 */
export const validateNumberInput = (
  value: string,
  options: {
    allowDecimal?: boolean;
    min?: number;
    max?: number;
    maxDecimals?: number;
  } = {}
): string | null => {
  const { allowDecimal = false, min, max, maxDecimals = 2 } = options;

  // Boş değer kontrolü
  if (!value || value.trim() === '') {
    return null;
  }

  // Virgülü noktaya çevir
  const normalizedValue = value.replace(',', '.');

  // Geçerli sayı formatı kontrolü
  const decimalRegex = allowDecimal
    ? new RegExp(`^\\d*\\.?\\d{0,${maxDecimals}}$`)
    : /^\d+$/;

  if (!decimalRegex.test(normalizedValue)) {
    return allowDecimal
      ? `Geçerli bir sayı giriniz (en fazla ${maxDecimals} ondalık basamak)`
      : 'Sadece tam sayı giriniz';
  }

  const numValue = parseFloat(normalizedValue);

  // NaN kontrolü
  if (isNaN(numValue)) {
    return 'Geçerli bir sayı giriniz';
  }

  // Min-max kontrolü
  if (min !== undefined && numValue < min) {
    return `Değer en az ${min} olmalıdır`;
  }

  if (max !== undefined && numValue > max) {
    return `Değer en fazla ${max} olmalıdır`;
  }

  return null;
};

/**
 * Sanitize input - XSS koruması için
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Trim all string fields in an object
 */
export const trimObjectStrings = <T extends Record<string, unknown>>(obj: T): T => {
  const trimmed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      trimmed[key] = value.trim();
    } else {
      trimmed[key] = value;
    }
  }

  return trimmed as T;
};

/**
 * Remove empty fields from object
 */
export const removeEmptyFields = <T extends Record<string, unknown>>(
  obj: T
): Partial<T> => {
  const cleaned: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      cleaned[key] = value;
    }
  }

  return cleaned as Partial<T>;
};

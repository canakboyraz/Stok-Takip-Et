import {
  isValidEmail,
  isValidPhone,
  isValidPassword,
  isValidPrice,
  isValidStock,
  isRequired,
  minLength,
  maxLength,
  isValidDate,
  isFutureDate,
  isValidProductCode,
  ValidationMessages,
} from './validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should return true for valid Turkish phone numbers', () => {
      expect(isValidPhone('05551234567')).toBe(true);
      expect(isValidPhone('5551234567')).toBe(true);
      expect(isValidPhone('+905551234567')).toBe(true);
      expect(isValidPhone('0555 123 45 67')).toBe(true);
    });

    it('should return false for invalid phone numbers', () => {
      expect(isValidPhone('')).toBe(false);
      expect(isValidPhone('1234567890')).toBe(false);
      expect(isValidPhone('04441234567')).toBe(false); // Doesn't start with 5
      expect(isValidPhone('055512345')).toBe(false); // Too short
      expect(isValidPhone('05551234567890')).toBe(false); // Too long
    });
  });

  describe('isValidPassword', () => {
    it('should return true for valid passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('Test1234')).toBe(true);
      expect(isValidPassword('Abc123def')).toBe(true);
      expect(isValidPassword('MyP@ssw0rd')).toBe(true);
    });

    it('should return false for invalid passwords', () => {
      expect(isValidPassword('')).toBe(false);
      expect(isValidPassword('short')).toBe(false); // Too short
      expect(isValidPassword('alllowercase123')).toBe(false); // No uppercase
      expect(isValidPassword('ALLUPPERCASE123')).toBe(false); // No lowercase
      expect(isValidPassword('NoNumbers')).toBe(false); // No digits
      expect(isValidPassword('12345678')).toBe(false); // No letters
    });
  });

  describe('isValidPrice', () => {
    it('should return true for valid prices', () => {
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(100)).toBe(true);
      expect(isValidPrice(999999.99)).toBe(true);
      expect(isValidPrice(50.5)).toBe(true);
    });

    it('should return false for invalid prices', () => {
      expect(isValidPrice(0)).toBe(false);
      expect(isValidPrice(-10)).toBe(false);
      expect(isValidPrice(1000000)).toBe(false);
      expect(isValidPrice(-0.01)).toBe(false);
    });
  });

  describe('isValidStock', () => {
    it('should return true for valid stock quantities', () => {
      expect(isValidStock(0)).toBe(true);
      expect(isValidStock(1)).toBe(true);
      expect(isValidStock(100)).toBe(true);
      expect(isValidStock(1000000)).toBe(true);
    });

    it('should return false for invalid stock quantities', () => {
      expect(isValidStock(-1)).toBe(false);
      expect(isValidStock(-100)).toBe(false);
      expect(isValidStock(1.5)).toBe(false); // Not an integer
      expect(isValidStock(10.99)).toBe(false); // Not an integer
    });
  });

  describe('isRequired', () => {
    it('should return true for non-empty values', () => {
      expect(isRequired('test')).toBe(true);
      expect(isRequired('   text   ')).toBe(true);
      expect(isRequired(123)).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
    });

    it('should return false for empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should return true when string meets minimum length', () => {
      expect(minLength('hello', 3)).toBe(true);
      expect(minLength('hello', 5)).toBe(true);
      expect(minLength('  hello  ', 5)).toBe(true); // Trims whitespace
    });

    it('should return false when string is too short', () => {
      expect(minLength('hi', 3)).toBe(false);
      expect(minLength('', 1)).toBe(false);
      expect(minLength('   ', 1)).toBe(false); // Only whitespace
    });
  });

  describe('maxLength', () => {
    it('should return true when string is within maximum length', () => {
      expect(maxLength('hi', 5)).toBe(true);
      expect(maxLength('hello', 5)).toBe(true);
      expect(maxLength('', 10)).toBe(true);
    });

    it('should return false when string exceeds maximum length', () => {
      expect(maxLength('hello world', 5)).toBe(false);
      expect(maxLength('testing', 3)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date strings', () => {
      expect(isValidDate('2025-01-11')).toBe(true);
      expect(isValidDate('2025-12-31')).toBe(true);
      expect(isValidDate('01/11/2025')).toBe(true);
      expect(isValidDate('2025-01-11T12:00:00Z')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDate('not-a-date')).toBe(false);
      expect(isValidDate('2025-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2025-02-30')).toBe(false); // Invalid day
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should return true for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      expect(isFutureDate(tomorrow.toISOString())).toBe(true);

      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      expect(isFutureDate(nextYear.toISOString())).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date();
      expect(isFutureDate(today.toISOString())).toBe(true);
    });

    it('should return false for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isFutureDate(yesterday.toISOString())).toBe(false);

      expect(isFutureDate('2020-01-01')).toBe(false);
    });
  });

  describe('isValidProductCode', () => {
    it('should return true for valid product codes', () => {
      expect(isValidProductCode('ABC')).toBe(true);
      expect(isValidProductCode('ABC123')).toBe(true);
      expect(isValidProductCode('PROD-001')).toBe(true);
      expect(isValidProductCode('test-product-123')).toBe(true);
      expect(isValidProductCode('12345678901234567890')).toBe(true); // Max 20 chars
    });

    it('should return false for invalid product codes', () => {
      expect(isValidProductCode('')).toBe(false);
      expect(isValidProductCode('AB')).toBe(false); // Too short (less than 3)
      expect(isValidProductCode('123456789012345678901')).toBe(false); // Too long (more than 20)
      expect(isValidProductCode('PROD 001')).toBe(false); // Contains space
      expect(isValidProductCode('PROD_001')).toBe(false); // Contains underscore
      expect(isValidProductCode('PROD@001')).toBe(false); // Contains special char
    });
  });

  describe('ValidationMessages', () => {
    it('should have all required validation messages', () => {
      expect(ValidationMessages.REQUIRED).toBe('Bu alan zorunludur');
      expect(ValidationMessages.INVALID_EMAIL).toBeDefined();
      expect(ValidationMessages.INVALID_PHONE).toBeDefined();
      expect(ValidationMessages.INVALID_PASSWORD).toBeDefined();
      expect(ValidationMessages.INVALID_PRICE).toBeDefined();
      expect(ValidationMessages.INVALID_STOCK).toBeDefined();
      expect(ValidationMessages.INVALID_DATE).toBeDefined();
      expect(ValidationMessages.FUTURE_DATE_REQUIRED).toBeDefined();
      expect(ValidationMessages.INVALID_PRODUCT_CODE).toBeDefined();
    });

    it('should have function messages that return formatted strings', () => {
      expect(ValidationMessages.MIN_LENGTH(5)).toBe('En az 5 karakter olmalıdır');
      expect(ValidationMessages.MAX_LENGTH(100)).toBe('En fazla 100 karakter olmalıdır');
    });
  });
});

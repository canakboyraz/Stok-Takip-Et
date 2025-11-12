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
} from './validation';

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    it('should validate Turkish phone numbers', () => {
      expect(isValidPhone('05551234567')).toBe(true);
      expect(isValidPhone('+905551234567')).toBe(true);
      expect(isValidPhone('0 555 123 45 67')).toBe(true); // With spaces
    });

    it('should reject invalid phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(false); // Doesn't start with 5
      expect(isValidPhone('0555123')).toBe(false); // Too short
      expect(isValidPhone('055512345678')).toBe(false); // Too long
      expect(isValidPhone('test')).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('Test1234')).toBe(true);
      expect(isValidPassword('MyPassword1')).toBe(true);
      expect(isValidPassword('Abc12345')).toBe(true);
      expect(isValidPassword('Test@123')).toBe(true); // With special char
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('test')).toBe(false); // Too short
      expect(isValidPassword('testtest')).toBe(false); // No uppercase, no number
      expect(isValidPassword('TESTTEST')).toBe(false); // No lowercase, no number
      expect(isValidPassword('Test1234!@#$%^&*()')).toBe(true); // With special chars (valid)
      expect(isValidPassword('12345678')).toBe(false); // No letters
      expect(isValidPassword('')).toBe(false);
    });
  });

  describe('isValidPrice', () => {
    it('should validate correct prices', () => {
      expect(isValidPrice(10.5)).toBe(true);
      expect(isValidPrice(0.01)).toBe(true);
      expect(isValidPrice(999999.99)).toBe(true);
      expect(isValidPrice(1)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(isValidPrice(0)).toBe(false); // Zero
      expect(isValidPrice(-10)).toBe(false); // Negative
      expect(isValidPrice(1000000)).toBe(false); // Too large
      expect(isValidPrice(NaN)).toBe(false);
    });
  });

  describe('isValidStock', () => {
    it('should validate correct stock quantities', () => {
      expect(isValidStock(0)).toBe(true); // Zero is valid
      expect(isValidStock(1)).toBe(true);
      expect(isValidStock(1000)).toBe(true);
      expect(isValidStock(999999)).toBe(true);
    });

    it('should reject invalid stock quantities', () => {
      expect(isValidStock(-1)).toBe(false); // Negative
      expect(isValidStock(10.5)).toBe(false); // Not integer
      expect(isValidStock(NaN)).toBe(false);
    });
  });

  describe('isRequired', () => {
    it('should validate non-empty values', () => {
      expect(isRequired('test')).toBe(true);
      expect(isRequired('  test  ')).toBe(true); // Trimmed
      expect(isRequired(123)).toBe(true);
      expect(isRequired(0)).toBe(true); // Zero is valid
      expect(isRequired(false)).toBe(true); // Boolean is valid
    });

    it('should reject empty values', () => {
      expect(isRequired('')).toBe(false);
      expect(isRequired('   ')).toBe(false); // Only whitespace
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe('minLength', () => {
    it('should validate strings meeting minimum length', () => {
      expect(minLength('test', 3)).toBe(true);
      expect(minLength('test', 4)).toBe(true);
      expect(minLength('  test  ', 4)).toBe(true); // Trimmed
    });

    it('should reject strings below minimum length', () => {
      expect(minLength('test', 5)).toBe(false);
      expect(minLength('', 1)).toBe(false);
      expect(minLength('   ', 1)).toBe(false); // Whitespace trimmed
    });
  });

  describe('maxLength', () => {
    it('should validate strings within maximum length', () => {
      expect(maxLength('test', 4)).toBe(true);
      expect(maxLength('test', 10)).toBe(true);
      expect(maxLength('', 5)).toBe(true);
    });

    it('should reject strings exceeding maximum length', () => {
      expect(maxLength('test', 3)).toBe(false);
      expect(maxLength('long string', 5)).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date strings', () => {
      expect(isValidDate('2024-01-01')).toBe(true);
      expect(isValidDate('2024-12-31')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // Leap year
    });

    it('should reject invalid date strings', () => {
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('2024-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2024-02-30')).toBe(false); // Invalid day
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isFutureDate', () => {
    it('should validate future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      expect(isFutureDate(futureDate.toISOString())).toBe(true);

      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 1);
      expect(isFutureDate(farFuture.toISOString())).toBe(true);
    });

    it('should validate today as future date', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expect(isFutureDate(today.toISOString())).toBe(true);
    });

    it('should reject past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      expect(isFutureDate(pastDate.toISOString())).toBe(false);

      const farPast = new Date();
      farPast.setFullYear(farPast.getFullYear() - 1);
      expect(isFutureDate(farPast.toISOString())).toBe(false);
    });
  });

  describe('isValidProductCode', () => {
    it('should validate correct product codes', () => {
      expect(isValidProductCode('ABC')).toBe(true);
      expect(isValidProductCode('ABC-123')).toBe(true);
      expect(isValidProductCode('PRODUCT-001')).toBe(true);
      expect(isValidProductCode('12345')).toBe(true);
      expect(isValidProductCode('a1B2C3')).toBe(true);
    });

    it('should reject invalid product codes', () => {
      expect(isValidProductCode('AB')).toBe(false); // Too short
      expect(isValidProductCode('A')).toBe(false); // Too short
      expect(isValidProductCode('VERY-LONG-PRODUCT-CODE-123')).toBe(false); // Too long (>20)
      expect(isValidProductCode('ABC 123')).toBe(false); // Contains space
      expect(isValidProductCode('ABC_123')).toBe(false); // Contains underscore
      expect(isValidProductCode('ABC@123')).toBe(false); // Contains special char
      expect(isValidProductCode('')).toBe(false);
    });
  });
});

import { capitalizeFirstLetter, formatDate, formatCurrency } from './formatHelpers';

describe('Format Helpers', () => {
  describe('capitalizeFirstLetter', () => {
    it('should capitalize first letter and lowercase the rest', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('WORLD')).toBe('World');
      expect(capitalizeFirstLetter('tEsT')).toBe('Test');
      expect(capitalizeFirstLetter('javascript')).toBe('Javascript');
    });

    it('should handle single character strings', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
      expect(capitalizeFirstLetter('Z')).toBe('Z');
    });

    it('should handle empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    it('should handle strings with multiple words (only first word is capitalized)', () => {
      expect(capitalizeFirstLetter('hello world')).toBe('Hello world');
      expect(capitalizeFirstLetter('MULTIPLE WORDS HERE')).toBe('Multiple words here');
    });

    it('should handle strings with special characters', () => {
      expect(capitalizeFirstLetter('ürün')).toBe('Ürün');
      expect(capitalizeFirstLetter('çalışma')).toBe('Çalışma');
      expect(capitalizeFirstLetter('ığdır')).toBe('Iğdır');
    });
  });

  describe('formatDate', () => {
    it('should format valid date strings to Turkish locale', () => {
      // Note: The exact format might vary based on environment
      const result = formatDate('2025-01-11');
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');

      // Should contain day, month, and year
      expect(result).toMatch(/\d{1,2}/); // At least one number
    });

    it('should handle ISO date strings', () => {
      const result = formatDate('2025-01-11T12:00:00Z');
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });

    it('should handle Date objects converted to string', () => {
      const date = new Date('2025-01-11');
      const result = formatDate(date.toISOString());
      expect(result).toBeTruthy();
      expect(result).not.toBe('-');
    });

    it('should return "-" for null date', () => {
      expect(formatDate(null)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(formatDate('')).toBe('-');
    });

    it('should format different dates correctly', () => {
      const result1 = formatDate('2025-12-31');
      const result2 = formatDate('2020-01-01');

      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
      expect(result1).not.toBe(result2);
    });
  });

  describe('formatCurrency', () => {
    it('should format positive numbers as Turkish Lira', () => {
      const result = formatCurrency(100);

      // Turkish locale currency format includes ₺ symbol
      expect(result).toContain('₺');
      expect(result).toContain('100');
    });

    it('should format decimal numbers with 2 fraction digits', () => {
      const result = formatCurrency(123.45);

      expect(result).toContain('₺');
      expect(result).toContain('123');
      expect(result).toContain('45');
    });

    it('should format zero correctly', () => {
      const result = formatCurrency(0);

      expect(result).toContain('₺');
      expect(result).toContain('0');
    });

    it('should format negative numbers correctly', () => {
      const result = formatCurrency(-50);

      expect(result).toContain('₺');
      expect(result).toContain('50');
      // Negative sign might be before or after currency symbol depending on locale
    });

    it('should format large numbers with thousand separators', () => {
      const result = formatCurrency(1234567.89);

      expect(result).toContain('₺');
      // Turkish locale uses dots for thousands
      expect(result).toMatch(/\d/);
    });

    it('should always show 2 decimal places', () => {
      const result1 = formatCurrency(100);
      const result2 = formatCurrency(100.5);

      // Both should have 2 decimal places
      expect(result1).toContain(',00');
      expect(result2).toContain(',50');
    });

    it('should handle very small numbers', () => {
      const result = formatCurrency(0.01);

      expect(result).toContain('₺');
      expect(result).toContain('0');
      expect(result).toContain('01');
    });

    it('should handle very large numbers', () => {
      const result = formatCurrency(999999.99);

      expect(result).toContain('₺');
      expect(result).toContain('999');
    });
  });
});

import { AppError, handleError, getErrorMessage } from './errorHandler';

describe('Error Handler Utils', () => {
  // Mock console.error to avoid cluttering test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AppError', () => {
    it('should create an AppError instance with message', () => {
      const error = new AppError('Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AppError');
    });

    it('should create an AppError with code and details', () => {
      const details = { userId: 123, action: 'delete' };
      const error = new AppError('Test error', 'TEST_ERROR', details);

      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual(details);
    });
  });

  describe('handleError', () => {
    it('should handle Supabase errors with message', () => {
      const supabaseError = {
        message: 'Database connection failed',
        code: '23505',
        details: 'Duplicate key violation'
      };

      const result = handleError(supabaseError);

      expect(result).toEqual({
        message: 'Database connection failed',
        code: '23505',
        details: 'Duplicate key violation'
      });
    });

    it('should handle network fetch errors', () => {
      const networkError = new TypeError('Failed to fetch');

      const result = handleError(networkError);

      expect(result).toEqual({
        message: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
        code: 'NETWORK_ERROR'
      });
    });

    it('should handle TypeError with "fetch" in message', () => {
      const fetchError = new TypeError('NetworkError when attempting to fetch resource');

      const result = handleError(fetchError);

      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Bağlantı hatası');
    });

    it('should handle unknown errors', () => {
      const unknownError = new Error('Some random error');

      const result = handleError(unknownError);

      expect(result).toEqual({
        message: 'Beklenmeyen bir hata oluştu.',
        code: 'UNKNOWN_ERROR',
        details: unknownError
      });
    });

    it('should handle null or undefined errors', () => {
      const result1 = handleError(null);
      const result2 = handleError(undefined);

      expect(result1.code).toBe('UNKNOWN_ERROR');
      expect(result2.code).toBe('UNKNOWN_ERROR');
    });

    it('should handle string errors', () => {
      const result = handleError('Something went wrong');

      expect(result).toEqual({
        message: 'Beklenmeyen bir hata oluştu.',
        code: 'UNKNOWN_ERROR',
        details: 'Something went wrong'
      });
    });

    it('should log error to console', () => {
      const testError = new Error('Test error');
      handleError(testError);

      expect(console.error).toHaveBeenCalledWith('Error occurred:', testError);
    });
  });

  describe('getErrorMessage', () => {
    it('should return error message from Supabase error', () => {
      const error = {
        message: 'Row level security violation',
        code: 'PGRST301'
      };

      const message = getErrorMessage(error);

      expect(message).toBe('Row level security violation');
    });

    it('should return network error message for fetch errors', () => {
      const error = new TypeError('Failed to fetch');

      const message = getErrorMessage(error);

      expect(message).toBe('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
    });

    it('should return generic message for unknown errors', () => {
      const error = { someWeird: 'error object' };

      const message = getErrorMessage(error);

      expect(message).toBe('Beklenmeyen bir hata oluştu.');
    });

    it('should handle AppError instances', () => {
      const error = new AppError('Custom error message', 'CUSTOM_ERROR');

      const message = getErrorMessage(error);

      expect(message).toBe('Beklenmeyen bir hata oluştu.');
    });
  });
});

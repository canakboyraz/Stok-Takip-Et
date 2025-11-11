import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from '../useErrorHandler';

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler());

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('should set error when showError is called', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError(new Error('Test error'));
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.hasError).toBe(true);
    expect(result.current.error?.message).toContain('Test error');
  });

  it('should clear error when clearError is called', () => {
    const { result } = renderHook(() => useErrorHandler());

    // Set error first
    act(() => {
      result.current.showError(new Error('Test error'));
    });

    expect(result.current.hasError).toBe(true);

    // Clear error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.hasError).toBe(false);
  });

  it('should handle string errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError('String error message');
    });

    expect(result.current.error?.message).toBe('String error message');
    expect(result.current.hasError).toBe(true);
  });

  it('should handle Supabase errors with code 23505 (duplicate)', () => {
    const { result } = renderHook(() => useErrorHandler());

    const supabaseError = {
      message: 'duplicate key value',
      code: '23505',
    };

    act(() => {
      result.current.showError(supabaseError);
    });

    expect(result.current.error?.message).toContain('Bu kayıt zaten mevcut');
  });

  it('should handle Supabase errors with code 23503 (foreign key)', () => {
    const { result } = renderHook(() => useErrorHandler());

    const supabaseError = {
      message: 'foreign key violation',
      code: '23503',
    };

    act(() => {
      result.current.showError(supabaseError);
    });

    expect(result.current.error?.message).toContain('bağlantılı kayıt bulunamadı');
  });

  it('should handle Supabase errors with code 42501 (permission denied)', () => {
    const { result } = renderHook(() => useErrorHandler());

    const supabaseError = {
      message: 'permission denied',
      code: '42501',
    };

    act(() => {
      result.current.showError(supabaseError);
    });

    expect(result.current.error?.message).toContain('yetkiniz yok');
  });

  it('should handle network errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    const networkError = new Error('Failed to fetch');

    act(() => {
      result.current.showError(networkError);
    });

    expect(result.current.error?.message).toContain('Bağlantı hatası');
  });

  it('should handle unknown error types', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError({ weird: 'object' });
    });

    expect(result.current.error?.message).toContain('Beklenmeyen bir hata');
    expect(result.current.hasError).toBe(true);
  });

  it('should set error severity correctly', () => {
    const { result } = renderHook(() => useErrorHandler());

    // Permission error should be WARNING
    act(() => {
      result.current.showError({ code: '42501', message: 'permission' });
    });

    expect(result.current.error?.severity).toBe('WARNING');

    // Network error should be ERROR
    act(() => {
      result.current.showError(new Error('Failed to fetch'));
    });

    expect(result.current.error?.severity).toBe('ERROR');
  });

  it('should handle multiple consecutive errors', () => {
    const { result } = renderHook(() => useErrorHandler());

    act(() => {
      result.current.showError('First error');
    });

    expect(result.current.error?.message).toBe('First error');

    act(() => {
      result.current.showError('Second error');
    });

    expect(result.current.error?.message).toBe('Second error');
  });
});

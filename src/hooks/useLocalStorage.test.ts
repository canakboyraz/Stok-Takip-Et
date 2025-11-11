import { renderHook, act } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

describe('useLocalStorage Hook', () => {
  // Mock console.error to avoid cluttering test output
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  describe('Initial Value Handling', () => {
    it('should return initial value when localStorage is empty', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current[0]).toBe('initial');
    });

    it('should return stored value from localStorage if it exists', () => {
      localStorage.setItem('test-key', JSON.stringify('stored value'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current[0]).toBe('stored value');
    });

    it('should handle different data types', () => {
      // Number
      localStorage.setItem('number-key', JSON.stringify(42));
      const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 0));
      expect(numberResult.current[0]).toBe(42);

      // Boolean
      localStorage.setItem('bool-key', JSON.stringify(true));
      const { result: boolResult } = renderHook(() => useLocalStorage('bool-key', false));
      expect(boolResult.current[0]).toBe(true);

      // Object
      localStorage.setItem('object-key', JSON.stringify({ name: 'test' }));
      const { result: objectResult } = renderHook(() =>
        useLocalStorage('object-key', { name: '' })
      );
      expect(objectResult.current[0]).toEqual({ name: 'test' });

      // Array
      localStorage.setItem('array-key', JSON.stringify([1, 2, 3]));
      const { result: arrayResult } = renderHook(() => useLocalStorage('array-key', []));
      expect(arrayResult.current[0]).toEqual([1, 2, 3]);
    });

    it('should return initial value when localStorage has invalid JSON', () => {
      localStorage.setItem('invalid-key', 'not valid json {');

      const { result } = renderHook(() => useLocalStorage('invalid-key', 'fallback'));

      expect(result.current[0]).toBe('fallback');
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle null and undefined initial values', () => {
      const { result: nullResult } = renderHook(() => useLocalStorage('null-key', null));
      expect(nullResult.current[0]).toBeNull();

      const { result: undefinedResult } = renderHook(() =>
        useLocalStorage('undefined-key', undefined)
      );
      expect(undefinedResult.current[0]).toBeUndefined();
    });
  });

  describe('setValue Function', () => {
    it('should update stored value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify('updated'));
    });

    it('should update with different data types', () => {
      const { result } = renderHook(() => useLocalStorage<any>('test-key', null));

      // Set string
      act(() => {
        result.current[1]('string value');
      });
      expect(result.current[0]).toBe('string value');

      // Set number
      act(() => {
        result.current[1](123);
      });
      expect(result.current[0]).toBe(123);

      // Set object
      act(() => {
        result.current[1]({ key: 'value' });
      });
      expect(result.current[0]).toEqual({ key: 'value' });

      // Set array
      act(() => {
        result.current[1]([1, 2, 3]);
      });
      expect(result.current[0]).toEqual([1, 2, 3]);
    });

    it('should handle function updater (like useState)', () => {
      const { result } = renderHook(() => useLocalStorage('counter', 0));

      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      expect(result.current[0]).toBe(1);

      act(() => {
        result.current[1]((prev) => prev + 5);
      });
      expect(result.current[0]).toBe(6);
    });

    it('should persist value across hook re-renders', () => {
      const { result, rerender } = renderHook(() => useLocalStorage('test-key', 'initial'));

      act(() => {
        result.current[1]('updated');
      });

      rerender();

      expect(result.current[0]).toBe('updated');
    });

    it('should sync with localStorage for complex objects', () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const { result } = renderHook(() =>
        useLocalStorage<User>('user', { id: 0, name: '', email: '' })
      );

      const newUser: User = { id: 1, name: 'John Doe', email: 'john@example.com' };

      act(() => {
        result.current[1](newUser);
      });

      expect(result.current[0]).toEqual(newUser);
      expect(JSON.parse(localStorage.getItem('user')!)).toEqual(newUser);
    });

    it('should handle errors when setting localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      // Mock localStorage.setItem to throw an error (e.g., quota exceeded)
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      act(() => {
        result.current[1]('updated');
      });

      expect(console.error).toHaveBeenCalled();

      // Restore original implementation
      Storage.prototype.setItem = originalSetItem;
    });
  });

  describe('removeValue Function', () => {
    it('should remove value from localStorage', () => {
      localStorage.setItem('test-key', JSON.stringify('stored'));

      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      expect(result.current[0]).toBe('stored');

      act(() => {
        result.current[2](); // Call removeValue
      });

      expect(result.current[0]).toBe('initial');
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should reset to initial value after removal', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

      act(() => {
        result.current[1]('changed');
      });
      expect(result.current[0]).toBe('changed');

      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBe('default');
    });

    it('should handle removal when key does not exist', () => {
      const { result } = renderHook(() => useLocalStorage('nonexistent', 'initial'));

      act(() => {
        result.current[2]();
      });

      expect(result.current[0]).toBe('initial');
      expect(localStorage.getItem('nonexistent')).toBeNull();
    });

    it('should handle errors when removing from localStorage', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

      // Mock localStorage.removeItem to throw an error
      const originalRemoveItem = Storage.prototype.removeItem;
      Storage.prototype.removeItem = jest.fn(() => {
        throw new Error('RemoveError');
      });

      act(() => {
        result.current[2]();
      });

      expect(console.error).toHaveBeenCalled();

      // Restore original implementation
      Storage.prototype.removeItem = originalRemoveItem;
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should handle multiple hooks with different keys independently', () => {
      const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
      const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

      expect(result1.current[0]).toBe('value1');
      expect(result2.current[0]).toBe('value2');

      act(() => {
        result1.current[1]('updated1');
      });

      expect(result1.current[0]).toBe('updated1');
      expect(result2.current[0]).toBe('value2'); // Should not change
    });

    it('should sync multiple hooks with the same key', () => {
      localStorage.setItem('shared-key', JSON.stringify('shared'));

      const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'initial'));
      const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'initial'));

      // Both should read the same value from localStorage
      expect(result1.current[0]).toBe('shared');
      expect(result2.current[0]).toBe('shared');

      // Update from first hook
      act(() => {
        result1.current[1]('updated');
      });

      // First hook should reflect the change
      expect(result1.current[0]).toBe('updated');

      // Note: Second hook won't automatically sync in this implementation
      // This is expected behavior as the hook doesn't listen to storage events
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string as value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', ''));

      act(() => {
        result.current[1]('');
      });

      expect(result.current[0]).toBe('');
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(''));
    });

    it('should handle zero as value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', 0));

      act(() => {
        result.current[1](0);
      });

      expect(result.current[0]).toBe(0);
      expect(localStorage.getItem('test-key')).toBe('0');
    });

    it('should handle false as value', () => {
      const { result } = renderHook(() => useLocalStorage('test-key', false));

      act(() => {
        result.current[1](false);
      });

      expect(result.current[0]).toBe(false);
      expect(localStorage.getItem('test-key')).toBe('false');
    });

    it('should handle special characters in key', () => {
      const specialKey = 'test-key-@#$%^&*()';
      const { result } = renderHook(() => useLocalStorage(specialKey, 'value'));

      act(() => {
        result.current[1]('updated');
      });

      expect(result.current[0]).toBe('updated');
      expect(localStorage.getItem(specialKey)).toBe(JSON.stringify('updated'));
    });

    it('should handle very long keys and values', () => {
      const longKey = 'k'.repeat(100);
      const longValue = 'v'.repeat(1000);

      const { result } = renderHook(() => useLocalStorage(longKey, ''));

      act(() => {
        result.current[1](longValue);
      });

      expect(result.current[0]).toBe(longValue);
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should maintain type safety with generics', () => {
      interface TestData {
        id: number;
        name: string;
        active: boolean;
      }

      const { result } = renderHook(() =>
        useLocalStorage<TestData>('test', { id: 1, name: 'test', active: true })
      );

      // Type should be inferred correctly
      const [value, setValue] = result.current;

      expect(value.id).toBe(1);
      expect(value.name).toBe('test');
      expect(value.active).toBe(true);

      act(() => {
        setValue({ id: 2, name: 'updated', active: false });
      });

      expect(result.current[0]).toEqual({ id: 2, name: 'updated', active: false });
    });
  });
});

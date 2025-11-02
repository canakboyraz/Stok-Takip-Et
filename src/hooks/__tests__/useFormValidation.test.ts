import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

describe('useFormValidation', () => {
  const mockOnSubmit = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with provided initial values', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: 'Test', email: 'test@example.com' },
        validationRules: {},
        onSubmit: mockOnSubmit,
      })
    );

    expect(result.current.values).toEqual({
      name: 'Test',
      email: 'test@example.com',
    });
  });

  it('should update values when handleChange is called', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: '' },
        validationRules: {},
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'New Name' },
      } as any);
    });

    expect(result.current.values.name).toBe('New Name');
  });

  it('should validate required fields', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: '' },
        validationRules: {
          name: ['required'],
        },
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({ target: { name: 'name' } } as any);
    });

    expect(result.current.errors.name).toBeTruthy();
    expect(result.current.errors.name).toContain('zorunlu');
  });

  it('should validate email format', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { email: 'invalid-email' },
        validationRules: {
          email: ['email'],
        },
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({ target: { name: 'email' } } as any);
    });

    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.errors.email).toContain('geçerli bir e-posta');
  });

  it('should validate minimum length', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { password: '12' },
        validationRules: {
          password: [{ minLength: 6 }],
        },
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({ target: { name: 'password' } } as any);
    });

    expect(result.current.errors.password).toBeTruthy();
    expect(result.current.errors.password).toContain('en az 6 karakter');
  });

  it('should validate maximum length', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { username: 'verylongusername' },
        validationRules: {
          username: [{ maxLength: 10 }],
        },
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({ target: { name: 'username' } } as any);
    });

    expect(result.current.errors.username).toBeTruthy();
    expect(result.current.errors.username).toContain('en fazla 10 karakter');
  });

  it('should validate price format', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { price: -5 },
        validationRules: {
          price: ['price'],
        },
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({ target: { name: 'price' } } as any);
    });

    expect(result.current.errors.price).toBeTruthy();
  });

  it('should validate custom regex pattern', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { phone: 'abc123' },
        validationRules: {
          phone: [{ pattern: /^\d+$/ }],
        },
        onSubmit: mockOnSubmit,
      })
    );

    act(() => {
      result.current.handleBlur({ target: { name: 'phone' } } as any);
    });

    expect(result.current.errors.phone).toBeTruthy();
  });

  it('should call onSubmit with values when form is valid', async () => {
    mockOnSubmit.mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: 'Valid Name' },
        validationRules: {
          name: ['required'],
        },
        onSubmit: mockOnSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(mockOnSubmit).toHaveBeenCalledWith({ name: 'Valid Name' });
  });

  it('should not call onSubmit when form is invalid', async () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: '' },
        validationRules: {
          name: ['required'],
        },
        onSubmit: mockOnSubmit,
      })
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should set isSubmitting during submission', async () => {
    let resolveSubmit: () => void;
    const delayedSubmit = jest.fn(() => new Promise((resolve) => {
      resolveSubmit = resolve as () => void;
    }));

    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: 'Test' },
        validationRules: {},
        onSubmit: delayedSubmit,
      })
    );

    expect(result.current.isSubmitting).toBe(false);

    // Start submission
    act(() => {
      result.current.handleSubmit({ preventDefault: jest.fn() } as any);
    });

    // Should be submitting
    expect(result.current.isSubmitting).toBe(true);

    // Complete submission
    await act(async () => {
      resolveSubmit!();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isSubmitting).toBe(false);
  });

  it('should track touched fields', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: '', email: '' },
        validationRules: {},
        onSubmit: mockOnSubmit,
      })
    );

    expect(result.current.touched.name).toBeFalsy();

    act(() => {
      result.current.handleBlur({ target: { name: 'name' } } as any);
    });

    expect(result.current.touched.name).toBe(true);
    expect(result.current.touched.email).toBeFalsy();
  });

  it('should reset form when resetForm is called', () => {
    const initialValues = { name: 'Initial', email: 'initial@test.com' };

    const { result } = renderHook(() =>
      useFormValidation({
        initialValues,
        validationRules: {},
        onSubmit: mockOnSubmit,
      })
    );

    // Change values
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'Changed' },
      } as any);
    });

    expect(result.current.values.name).toBe('Changed');

    // Reset form
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should clear errors when field becomes valid', () => {
    const { result } = renderHook(() =>
      useFormValidation({
        initialValues: { name: '' },
        validationRules: {
          name: ['required'],
        },
        onSubmit: mockOnSubmit,
      })
    );

    // Trigger error
    act(() => {
      result.current.handleBlur({ target: { name: 'name' } } as any);
    });

    expect(result.current.errors.name).toBeTruthy();

    // Fix the error
    act(() => {
      result.current.handleChange({
        target: { name: 'name', value: 'Valid Name' },
      } as any);
    });

    // Validate again
    act(() => {
      result.current.handleBlur({ target: { name: 'name' } } as any);
    });

    expect(result.current.errors.name).toBeFalsy();
  });
});

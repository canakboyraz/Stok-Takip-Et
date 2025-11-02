/**
 * Form Validation Hook
 *
 * Form validasyonunu kolayca yapmak için custom hook
 *
 * Kullanım:
 * const { values, errors, handleChange, handleSubmit, isValid } = useFormValidation({
 *   initialValues: { name: '', email: '' },
 *   validationRules: {
 *     name: ['required', { minLength: 3 }],
 *     email: ['required', 'email']
 *   },
 *   onSubmit: async (values) => { ... }
 * });
 */

import { useState, useCallback } from 'react';
import { validateField, ValidationRule, trimObjectStrings } from '../utils/formValidation';

interface UseFormValidationProps<T> {
  initialValues: T;
  validationRules: Record<keyof T, ValidationRule[]>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
}

interface UseFormValidationReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T, value: any) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  resetForm: () => void;
  validateForm: () => boolean;
}

export function useFormValidation<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
  validateOnChange = false,
}: UseFormValidationProps<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Tek bir alanı valide et
   */
  const validateSingleField = useCallback(
    (field: keyof T, value: any): string | null => {
      const rules = validationRules[field];
      if (!rules) return null;

      return validateField(value, rules, String(field));
    },
    [validationRules]
  );

  /**
   * Tüm formu valide et
   */
  const validateFormFields = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    for (const field in validationRules) {
      const error = validateSingleField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    }

    setErrors(newErrors as Record<keyof T, string>);
    return isValid;
  }, [values, validationRules, validateSingleField]);

  /**
   * Alan değerini değiştir
   */
  const handleChange = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Validate on change if enabled
      if (validateOnChange || touched[field]) {
        const error = validateSingleField(field, value);
        setErrors((prev) => ({
          ...prev,
          [field]: error || '',
        }));
      }
    },
    [validateOnChange, touched, validateSingleField]
  );

  /**
   * Alan blur olduğunda
   */
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      // Validate on blur
      const error = validateSingleField(field, values[field]);
      setErrors((prev) => ({
        ...prev,
        [field]: error || '',
      }));
    },
    [values, validateSingleField]
  );

  /**
   * Manuel olarak alan değerini set et
   */
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Manuel olarak alan hatası set et
   */
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  /**
   * Formu reset et
   */
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string>);
    setTouched({} as Record<keyof T, boolean>);
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Form submit
   */
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched = Object.keys(validationRules).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Record<keyof T, boolean>
      );
      setTouched(allTouched);

      // Validate all fields
      const isValid = validateFormFields();

      if (!isValid) {
        return;
      }

      setIsSubmitting(true);

      try {
        // Trim all string values
        const trimmedValues = trimObjectStrings(values);
        await onSubmit(trimmedValues);
      } catch (error) {
        // Error handling yapılabilir
        throw error;
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validationRules, validateFormFields, onSubmit]
  );

  /**
   * Form geçerli mi?
   */
  const isValid = Object.keys(errors).length === 0 && Object.values(errors).every((e) => !e);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    resetForm,
    validateForm: validateFormFields,
  };
}

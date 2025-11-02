/**
 * useErrorHandler Hook
 *
 * Tutarlı error handling için custom hook
 *
 * Kullanım:
 * const { showError, clearError } = useErrorHandler();
 *
 * try {
 *   await someOperation();
 * } catch (error) {
 *   showError(error);
 * }
 */

import { useState, useCallback } from 'react';
import { handleError, getErrorMessage, AppErrorDetails, ErrorSeverity } from '../utils/errorHandler';

interface UseErrorHandlerReturn {
  error: AppErrorDetails | null;
  hasError: boolean;
  showError: (error: unknown) => void;
  clearError: () => void;
  getErrorMessage: (error: unknown) => string;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<AppErrorDetails | null>(null);

  const showError = useCallback((err: unknown) => {
    const handled = handleError(err);
    setError(handled);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getErrorMessageCallback = useCallback((err: unknown): string => {
    return getErrorMessage(err);
  }, []);

  return {
    error,
    hasError: error !== null,
    showError,
    clearError,
    getErrorMessage: getErrorMessageCallback,
  };
};

/**
 * Map error severity to MUI Alert severity
 */
export const getAlertSeverity = (
  severity: ErrorSeverity
): 'error' | 'warning' | 'info' | 'success' => {
  switch (severity) {
    case ErrorSeverity.CRITICAL:
    case ErrorSeverity.ERROR:
      return 'error';
    case ErrorSeverity.WARNING:
      return 'warning';
    case ErrorSeverity.INFO:
      return 'info';
    default:
      return 'error';
  }
};

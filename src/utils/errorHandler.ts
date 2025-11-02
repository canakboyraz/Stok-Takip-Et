import { logger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Standardized error interface
 */
export interface AppErrorDetails {
  message: string;
  code: string;
  severity: ErrorSeverity;
  userMessage: string;
  details?: unknown;
  timestamp: Date;
}

/**
 * Custom Application Error Class
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly details?: unknown;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    userMessage?: string,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = severity;
    this.userMessage = userMessage || message;
    this.details = details;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Supabase specific error codes mapping
 */
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'Bu kayıt zaten mevcut. Lütfen farklı bir değer deneyin.',
  '23503': 'Bu işlem için gerekli bağlantılı kayıt bulunamadı.',
  '23502': 'Zorunlu alan eksik. Lütfen tüm alanları doldurun.',
  '42501': 'Bu işlem için yetkiniz yok.',
  '42P01': 'Veritabanı tablosu bulunamadı. Lütfen sistem yöneticisine başvurun.',
  'PGRST116': 'Satır bulunamadı veya güncelleme yapılamadı.',
  '22P02': 'Geçersiz veri formatı. Lütfen girdiğiniz değerleri kontrol edin.',
};

/**
 * Parse Supabase errors
 */
const parseSupabaseError = (error: any): AppErrorDetails => {
  const code = error.code || 'SUPABASE_ERROR';
  const message = error.message || 'Veritabanı hatası';
  const userMessage = SUPABASE_ERROR_MESSAGES[code] || 'Bir veritabanı hatası oluştu.';

  let severity = ErrorSeverity.ERROR;

  // Determine severity based on error code
  if (code.startsWith('42')) {
    severity = ErrorSeverity.CRITICAL; // Permission or schema errors
  } else if (code.startsWith('23')) {
    severity = ErrorSeverity.WARNING; // Constraint violations
  }

  return {
    message,
    code,
    severity,
    userMessage,
    details: error.details || error.hint,
    timestamp: new Date(),
  };
};

/**
 * Parse network errors
 */
const parseNetworkError = (error: Error): AppErrorDetails => {
  return {
    message: error.message,
    code: 'NETWORK_ERROR',
    severity: ErrorSeverity.ERROR,
    userMessage: 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.',
    timestamp: new Date(),
  };
};

/**
 * Parse authentication errors
 */
const parseAuthError = (error: any): AppErrorDetails => {
  const authErrors: Record<string, string> = {
    'invalid_credentials': 'Email veya şifre hatalı.',
    'user_not_found': 'Kullanıcı bulunamadı.',
    'invalid_grant': 'Oturum süresi doldu. Lütfen tekrar giriş yapın.',
    'email_not_confirmed': 'Email adresinizi doğrulamanız gerekiyor.',
    'weak_password': 'Şifre çok zayıf. Daha güçlü bir şifre seçin.',
  };

  const code = error.status || error.code || 'AUTH_ERROR';
  const message = error.message || 'Kimlik doğrulama hatası';
  const userMessage = authErrors[code] || 'Giriş yapılamadı. Lütfen tekrar deneyin.';

  return {
    message,
    code: `AUTH_${code}`,
    severity: ErrorSeverity.WARNING,
    userMessage,
    timestamp: new Date(),
  };
};

/**
 * Main error handler - handles all types of errors
 */
export const handleError = (error: unknown): AppErrorDetails => {
  // Log error
  logger.error('Error occurred:', error);

  // Already processed AppError
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      severity: error.severity,
      userMessage: error.userMessage,
      details: error.details,
      timestamp: error.timestamp,
    };
  }

  // Supabase errors
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return parseSupabaseError(error);
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return parseNetworkError(error);
  }

  // Auth errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as any).status;
    if (status === 401 || status === 403) {
      return parseAuthError(error);
    }
  }

  // Standard Error object
  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'ERROR',
      severity: ErrorSeverity.ERROR,
      userMessage: 'Bir hata oluştu. Lütfen tekrar deneyin.',
      timestamp: new Date(),
    };
  }

  // Unknown error
  return {
    message: String(error),
    code: 'UNKNOWN_ERROR',
    severity: ErrorSeverity.ERROR,
    userMessage: 'Beklenmeyen bir hata oluştu.',
    details: error,
    timestamp: new Date(),
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const handled = handleError(error);
  return handled.userMessage;
};

/**
 * Get error code
 */
export const getErrorCode = (error: unknown): string => {
  const handled = handleError(error);
  return handled.code;
};

/**
 * Check if error is critical
 */
export const isCriticalError = (error: unknown): boolean => {
  const handled = handleError(error);
  return handled.severity === ErrorSeverity.CRITICAL;
};

/**
 * Format error for display
 */
export const formatErrorForDisplay = (error: unknown): {
  title: string;
  message: string;
  severity: ErrorSeverity;
} => {
  const handled = handleError(error);

  const titles: Record<ErrorSeverity, string> = {
    [ErrorSeverity.INFO]: 'Bilgi',
    [ErrorSeverity.WARNING]: 'Uyarı',
    [ErrorSeverity.ERROR]: 'Hata',
    [ErrorSeverity.CRITICAL]: 'Kritik Hata',
  };

  return {
    title: titles[handled.severity],
    message: handled.userMessage,
    severity: handled.severity,
  };
}; 
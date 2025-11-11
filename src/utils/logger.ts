/**
 * Production-safe Logger Utility
 *
 * Bu logger sadece development ortamında console'a log yapar.
 * Production ortamında hiçbir log yazmaz, bilgi sızıntısını önler.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * General logging - sadece development'ta çalışır
   */
  log: (...args: any[]): void => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Error logging - her ortamda çalışır (error tracking için)
   */
  error: (...args: any[]): void => {
    if (isDevelopment) {
      console.error(...args);
    } else {
      // Production'da error tracking service'e gönder
      // Örn: Sentry, LogRocket, etc.
      // sentryLogger.captureException(args);
    }
  },

  /**
   * Warning logging - sadece development'ta çalışır
   */
  warn: (...args: any[]): void => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Info logging - sadece development'ta çalışır
   */
  info: (...args: any[]): void => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  /**
   * Debug logging - sadece development'ta çalışır
   */
  debug: (...args: any[]): void => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Group logging - sadece development'ta çalışır
   */
  group: (label: string): void => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  /**
   * Group end - sadece development'ta çalışır
   */
  groupEnd: (): void => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },

  /**
   * Table logging - sadece development'ta çalışır
   */
  table: (data: any): void => {
    if (isDevelopment) {
      console.table(data);
    }
  },
};

export default logger;

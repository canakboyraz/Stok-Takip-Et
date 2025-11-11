/**
 * Environment-based logging utility
 *
 * Bu logger, production ortamında console.log'ları devre dışı bırakır
 * ve sadece geliştirme ortamında detaylı loglama yapar.
 *
 * Kullanım:
 * import { logger } from './utils/logger';
 * logger.log('Debug mesajı');
 * logger.error('Hata mesajı');
 * logger.warn('Uyarı mesajı');
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
}

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

/**
 * Production ortamında hataları bir servise gönder
 * (Gelecekte Sentry, LogRocket vb. entegrasyonu için)
 */
const logToService = (level: LogLevel, args: any[]) => {
  if (process.env.NODE_ENV === 'production') {
    // TODO: Burada Sentry, LogRocket vb. servislerine log gönderebilirsiniz
    // Örnek: Sentry.captureMessage(args.join(' '), level);
  }
};

/**
 * Environment-aware logger
 */
export const logger: Logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment || !isTest) {
      console.warn(...args);
    }
    logToService('warn', args);
  },

  error: (...args: any[]) => {
    // Error'ları her zaman logla (production dahil)
    console.error(...args);
    logToService('error', args);
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },

  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  },
};

/**
 * Development-only logger
 * Sadece development ortamında çalışır
 */
export const devLogger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log('🔍 [DEV]', ...args);
    }
  },

  success: (...args: any[]) => {
    if (isDevelopment) {
      console.log('✅ [SUCCESS]', ...args);
    }
  },

  error: (...args: any[]) => {
    if (isDevelopment) {
      console.error('❌ [ERROR]', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn('⚠️  [WARN]', ...args);
    }
  },

  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('ℹ️  [INFO]', ...args);
    }
  },
};

/**
 * Performance measurement utility
 */
export const performanceLogger = {
  start: (label: string) => {
    if (isDevelopment) {
      performance.mark(`${label}-start`);
    }
  },

  end: (label: string) => {
    if (isDevelopment) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`⏱️  ${label}: ${measure.duration.toFixed(2)}ms`);
      performance.clearMarks(`${label}-start`);
      performance.clearMarks(`${label}-end`);
      performance.clearMeasures(label);
    }
  },
};

export default logger;

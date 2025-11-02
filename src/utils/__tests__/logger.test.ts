import { logger, performanceLogger } from '../logger';

describe('Logger Utility', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleInfoSpy: jest.SpyInstance;
  let originalEnv: string | undefined;

  beforeEach(() => {
    // Save original environment
    originalEnv = process.env.NODE_ENV;

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;

    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleInfoSpy.mockRestore();
  });

  describe('in development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should log debug messages in development', () => {
      logger.log('Test message');
      expect(consoleLogSpy).toHaveBeenCalledWith('Test message');
    });

    it('should log info messages in development', () => {
      logger.info('Info message');
      expect(consoleInfoSpy).toHaveBeenCalledWith('Info message');
    });
  });

  describe('in production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should NOT log debug messages in production', () => {
      logger.log('Test message');
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should log error messages in production', () => {
      logger.error('Error message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error message');
    });

    it('should log warning messages in production', () => {
      logger.warn('Warning message');
      expect(consoleWarnSpy).toHaveBeenCalledWith('Warning message');
    });
  });

  describe('logger methods', () => {
    it('should support multiple arguments', () => {
      logger.log('Message', { data: 'test' }, 123);
      expect(consoleLogSpy).toHaveBeenCalledWith('Message', { data: 'test' }, 123);
    });

    it('should handle group logging', () => {
      const groupSpy = jest.spyOn(console, 'group').mockImplementation();
      const groupEndSpy = jest.spyOn(console, 'groupEnd').mockImplementation();

      logger.group('Test Group');
      logger.groupEnd();

      expect(groupSpy).toHaveBeenCalledWith('Test Group');
      expect(groupEndSpy).toHaveBeenCalled();

      groupSpy.mockRestore();
      groupEndSpy.mockRestore();
    });
  });

  describe('Performance Logger', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should measure performance time', () => {
      performanceLogger.start('test-operation');

      // Simulate time passing
      jest.advanceTimersByTime(100);

      performanceLogger.end('test-operation');

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏱️ test-operation:')
      );
    });

    it('should handle multiple concurrent timers', () => {
      performanceLogger.start('operation1');
      performanceLogger.start('operation2');

      jest.advanceTimersByTime(50);
      performanceLogger.end('operation1');

      jest.advanceTimersByTime(50);
      performanceLogger.end('operation2');

      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle ending non-existent timer gracefully', () => {
      expect(() => {
        performanceLogger.end('non-existent');
      }).not.toThrow();
    });
  });
});

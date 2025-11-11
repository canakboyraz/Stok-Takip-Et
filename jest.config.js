module.exports = {
  // React scripts ile gelen default config'i extend et
  preset: 'react-scripts',

  // Coverage ayarları
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],

  // Coverage thresholds (Hedefler)
  coverageThresholds: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json',
  ],

  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

  // Module paths
  modulePaths: ['<rootDir>/src'],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/react-scripts/config/jest/babelTransform.js',
    '^.+\\.css$': '<rootDir>/node_modules/react-scripts/config/jest/cssTransform.js',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '<rootDir>/node_modules/react-scripts/config/jest/fileTransform.js',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
  ],

  // Watch ignore patterns
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/coverage/',
  ],

  // Verbose output
  verbose: true,
};

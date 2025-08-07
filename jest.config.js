/**
 * Jest Configuration for TreinosApp
 * Comprehensive testing setup for React Native with Expo and Supabase
 */

module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/setupTests.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/dist/',
  ],
  collectCoverageFrom: [
    'services/**/*.{js,ts}',
    'components/**/*.{js,ts,tsx}',
    'screens/**/*.{js,ts,tsx}',
    'hooks/**/*.{js,ts}',
    'utils/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Service-specific thresholds (higher for critical services)
    'services/database/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@components/(.*)$': '<rootDir>/components/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@screens/(.*)$': '<rootDir>/screens/$1',
    '^@hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@types/(.*)$': '<rootDir>/types/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).{js,ts,tsx}',
    '**/*.(test|spec).{js,ts,tsx}',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 30000, // 30 seconds for integration tests with Supabase
  maxWorkers: '50%', // Limit workers to prevent Supabase connection issues
  
  // Test environment variables
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  
  // Performance and memory settings
  maxConcurrency: 5,
  workerIdleMemoryLimit: '512MB',
  
  // Verbose output for debugging
  verbose: true,
  
  // Custom reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './test-results',
      filename: 'test-report.html',
      expand: true,
    }],
  ],
};
/**
 * Test Helpers and Utilities
 * Common testing functions and assertions
 */

import { act, waitFor } from '@testing-library/react-native';
import MockDataFactory, { MockUser, MockWorkout, MockExercise } from './MockDataFactory';

/**
 * Wait for async operations with timeout
 */
export const waitForAsync = async (
  fn: () => Promise<any>, 
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Async operation timed out after ${timeout}ms`));
    }, timeout);

    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
};

/**
 * Mock navigation helpers
 */
export const createMockNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  isFocused: jest.fn(() => true),
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

export const createMockRoute = (params: any = {}) => ({
  params,
  key: 'test-route',
  name: 'TestScreen',
});

/**
 * Authentication test helpers
 */
export const createAuthenticatedUser = (): MockUser => {
  return MockDataFactory.createUser({
    id: 'authenticated-user-id',
    email: 'authenticated@test.com',
    name: 'Authenticated User',
  });
};

export const mockAuthState = (user: MockUser | null = null) => {
  const mockAuthContext = {
    user,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    isAuthenticated: !!user,
    userType: user?.user_type || null,
  };

  return mockAuthContext;
};

/**
 * Storage test helpers
 */
export const clearAsyncStorage = async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await AsyncStorage.clear();
};

export const setStorageItem = async (key: string, value: any) => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  await AsyncStorage.setItem(key, JSON.stringify(value));
};

export const getStorageItem = async (key: string) => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  const value = await AsyncStorage.getItem(key);
  return value ? JSON.parse(value) : null;
};

/**
 * Database test helpers
 */
export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Error' : 'OK',
});

export const mockSupabaseQuery = (mockClient: any, table: string, response: any) => {
  mockClient.from.mockImplementation((tableName: string) => {
    if (tableName === table) {
      return {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        single: jest.fn(() => Promise.resolve(response)),
        maybeSingle: jest.fn(() => Promise.resolve(response)),
      };
    }
    return mockClient.from(tableName);
  });
};

/**
 * Performance testing helpers
 */
export const measureExecutionTime = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> => {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  const duration = end - start;
  
  return { result, duration };
};

export const expectPerformanceWithin = (duration: number, maxTime: number) => {
  expect(duration).toBeLessThanOrEqual(maxTime);
};

/**
 * Validation helpers
 */
export const validateWorkoutStructure = (workout: MockWorkout) => {
  expect(workout).toHaveProperty('id');
  expect(workout).toHaveProperty('name');
  expect(workout).toHaveProperty('trainer_id');
  expect(workout).toHaveProperty('exercises');
  expect(Array.isArray(workout.exercises)).toBe(true);
  expect(workout.exercises.length).toBeGreaterThan(0);
  
  workout.exercises.forEach(exercise => {
    validateExerciseStructure(exercise);
  });
};

export const validateExerciseStructure = (exercise: MockExercise) => {
  expect(exercise).toHaveProperty('id');
  expect(exercise).toHaveProperty('name');
  expect(exercise).toHaveProperty('muscle_groups');
  expect(Array.isArray(exercise.muscle_groups)).toBe(true);
  expect(exercise.muscle_groups.length).toBeGreaterThan(0);
};

export const validateUserStructure = (user: MockUser) => {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('email');
  expect(user).toHaveProperty('name');
  expect(user).toHaveProperty('user_type');
  expect(['personal_trainer', 'student']).toContain(user.user_type);
};

/**
 * Real-time testing helpers
 */
export const mockRealtimeSubscription = () => {
  const listeners: Array<(payload: any) => void> = [];
  
  return {
    on: jest.fn((event: string, callback: (payload: any) => void) => {
      listeners.push(callback);
      return {
        subscribe: jest.fn(() => Promise.resolve()),
        unsubscribe: jest.fn(() => Promise.resolve()),
      };
    }),
    trigger: (payload: any) => {
      listeners.forEach(listener => listener(payload));
    },
    listeners,
  };
};

/**
 * Error testing helpers
 */
export const expectAsyncError = async (
  fn: () => Promise<any>,
  expectedError?: string | RegExp
) => {
  await expect(fn()).rejects.toThrow(expectedError);
};

export const simulateNetworkError = () => ({
  data: null,
  error: {
    message: 'Network error',
    details: 'Connection failed',
    hint: 'Check your internet connection',
    code: 'NETWORK_ERROR',
  },
});

/**
 * Load testing helpers
 */
export const generateLoadTestData = (count: number) => {
  return MockDataFactory.generateBulkData({
    trainers: Math.ceil(count * 0.1),
    students: Math.ceil(count * 0.4),
    workouts: Math.ceil(count * 0.3),
    exercises: Math.ceil(count * 0.2),
  });
};

export const simulateConcurrentOperations = async <T>(
  operations: Array<() => Promise<T>>,
  concurrency: number = 5
): Promise<T[]> => {
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += concurrency) {
    const batch = operations.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
};

/**
 * Memory testing helpers
 */
export const measureMemoryUsage = (): number => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage().heapUsed;
  }
  return 0;
};

export const detectMemoryLeaks = async (
  fn: () => Promise<void>,
  iterations: number = 100
): Promise<{ leaked: boolean; usage: number[] }> => {
  const usage: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    await fn();
    usage.push(measureMemoryUsage());
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
  
  // Simple leak detection: memory should not grow consistently
  const trend = usage.slice(-10).reduce((sum, val, idx) => 
    sum + (idx > 0 ? (val > usage[usage.length - 10 + idx - 1] ? 1 : -1) : 0), 0
  );
  
  return {
    leaked: trend > 7, // More than 70% of last 10 samples show growth
    usage,
  };
};

/**
 * Component testing helpers
 */
export const renderWithProviders = (
  component: React.ReactElement,
  options: {
    user?: MockUser | null;
    navigation?: any;
    route?: any;
  } = {}
) => {
  const mockNavigation = options.navigation || createMockNavigation();
  const mockRoute = options.route || createMockRoute();
  const authContext = mockAuthState(options.user);

  // This would typically wrap with providers, but for now just return mock setup
  return {
    mockNavigation,
    mockRoute,
    authContext,
    component,
  };
};

export default {
  waitForAsync,
  createMockNavigation,
  createMockRoute,
  createAuthenticatedUser,
  mockAuthState,
  clearAsyncStorage,
  setStorageItem,
  getStorageItem,
  mockSupabaseResponse,
  mockSupabaseQuery,
  measureExecutionTime,
  expectPerformanceWithin,
  validateWorkoutStructure,
  validateExerciseStructure,
  validateUserStructure,
  mockRealtimeSubscription,
  expectAsyncError,
  simulateNetworkError,
  generateLoadTestData,
  simulateConcurrentOperations,
  measureMemoryUsage,
  detectMemoryLeaks,
  renderWithProviders,
};
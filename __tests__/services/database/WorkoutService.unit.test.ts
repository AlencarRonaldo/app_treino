/**
 * WorkoutService Unit Tests
 * Comprehensive test suite for workout management with Supabase
 */

import { workoutService } from '../../../treinosapp-mobile/services/database/WorkoutService';
import MockDataFactory, { MockWorkout, MockExercise } from '../../../test-utils/MockDataFactory';
import TestHelpers from '../../../test-utils/TestHelpers';
import { CreateWorkoutRequest, WorkoutFilters } from '../../../treinosapp-mobile/services/database/WorkoutService';

// Mock Supabase
const mockSupabase = global.mockSupabaseClient;

// Mock ExerciseDB Service
jest.mock('../../../treinosapp-mobile/services/ExerciseDBService', () => ({
  exerciseDBService: {
    getExerciseById: jest.fn().mockImplementation((id: string) => 
      Promise.resolve(MockDataFactory.createExercise(undefined, { id }))
    ),
  },
}));

describe('WorkoutService Unit Tests', () => {
  let mockUser: any;
  let mockWorkout: MockWorkout;
  let mockExercise: MockExercise;

  beforeAll(() => {
    // Setup mock user
    mockUser = TestHelpers.createAuthenticatedUser();
    
    // Mock auth.getUser
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset service state
    await workoutService.cleanup();
    
    // Create fresh mock data
    mockWorkout = MockDataFactory.createWorkout(mockUser.id);
    mockExercise = MockDataFactory.createExercise(mockUser.id);

    // Setup default Supabase responses
    TestHelpers.mockSupabaseResponse(mockSupabase, 'workouts', {
      data: [mockWorkout],
      error: null,
    });
  });

  afterEach(async () => {
    await workoutService.cleanup();
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      // Mock successful connection test
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await expect(workoutService.initialize()).resolves.not.toThrow();
    });

    it('should handle initialization errors', async () => {
      // Mock connection failure
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed', code: 'CONNECTION_ERROR' },
          }),
        }),
      });

      await expect(workoutService.initialize()).rejects.toThrow('Database connection failed');
    });

    it('should setup real-time subscription', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue(true),
      };

      mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
      
      await workoutService.initialize();

      expect(mockSupabase.channel).toHaveBeenCalledWith('workout-changes');
      expect(mockChannel.on).toHaveBeenCalledTimes(2); // Two subscriptions
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('CRUD Operations', () => {
    describe('createWorkout', () => {
      it('should create workout successfully', async () => {
        const createRequest: CreateWorkoutRequest = {
          name: 'Test Workout',
          description: 'Test description',
          category: 'STRENGTH',
          exercises: [
            {
              exerciseId: mockExercise.id,
              order: 1,
              sets: 3,
              reps: '10',
              weight: 50,
              restTime: 60,
            },
          ],
          estimatedDuration: 45,
          isTemplate: false,
          isPublic: false,
        };

        // Mock successful workout creation
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockWorkout, ...createRequest },
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'workout_exercises') {
            return {
              insert: jest.fn().mockResolvedValue({ data: [], error: null }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWorkout, workout_exercises: [] },
              error: null,
            }),
          };
        });

        const result = await workoutService.createWorkout(createRequest);

        expect(result).toBeDefined();
        expect(result.name).toBe(createRequest.name);
        expect(result.category).toBe(createRequest.category);
      });

      it('should validate exercise data during creation', async () => {
        const createRequest: CreateWorkoutRequest = {
          name: 'Test Workout',
          exercises: [
            {
              exerciseId: 'invalid-exercise-id',
              order: 1,
              sets: 3,
              reps: '10',
              restTime: 60,
            },
          ],
        };

        // Mock exercise validation failure
        const exerciseDBService = require('../../../treinosapp-mobile/services/ExerciseDBService').exerciseDBService;
        exerciseDBService.getExerciseById.mockResolvedValue(null);

        // Should handle invalid exercise gracefully
        mockSupabase.from.mockImplementation(() => ({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockWorkout,
                error: null,
              }),
            }),
          }),
        }));

        const result = await workoutService.createWorkout(createRequest);
        expect(result).toBeDefined();
      });

      it('should handle creation errors', async () => {
        const createRequest: CreateWorkoutRequest = {
          name: 'Test Workout',
          exercises: [],
        };

        // Mock database error
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        });

        await expect(workoutService.createWorkout(createRequest)).rejects.toThrow('Insert failed');
      });

      it('should require authentication', async () => {
        // Mock unauthenticated user
        mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const createRequest: CreateWorkoutRequest = {
          name: 'Test Workout',
          exercises: [],
        };

        await expect(workoutService.createWorkout(createRequest)).rejects.toThrow('User not authenticated');
      });
    });

    describe('getWorkouts', () => {
      it('should fetch workouts successfully', async () => {
        const mockWorkouts = [
          MockDataFactory.createWorkout(mockUser.id),
          MockDataFactory.createWorkout(mockUser.id),
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockWorkouts,
              error: null,
            }),
          }),
        });

        const result = await workoutService.getWorkouts();

        expect(result).toHaveLength(2);
        expect(mockSupabase.from).toHaveBeenCalledWith('workouts');
      });

      it('should apply filters correctly', async () => {
        const filters: WorkoutFilters = {
          category: 'STRENGTH',
          difficulty: 'INTERMEDIATE',
          search: 'test',
          sortBy: 'name',
          sortOrder: 'asc',
        };

        const mockQuery = {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: [], error: null }),
        };

        mockSupabase.from.mockReturnValue(mockQuery);

        await workoutService.getWorkouts(filters);

        expect(mockQuery.eq).toHaveBeenCalledWith('category', 'STRENGTH');
        expect(mockQuery.eq).toHaveBeenCalledWith('difficulty', 'INTERMEDIATE');
        expect(mockQuery.ilike).toHaveBeenCalledWith('name', '%test%');
        expect(mockQuery.order).toHaveBeenCalledWith('name', { ascending: true });
      });

      it('should use cache when available', async () => {
        const mockWorkouts = [MockDataFactory.createWorkout(mockUser.id)];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockWorkouts,
              error: null,
            }),
          }),
        });

        // First call
        const result1 = await workoutService.getWorkouts();
        
        // Second call should use cache
        const result2 = await workoutService.getWorkouts();

        expect(result1).toEqual(result2);
        // Should only make one database call
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });

      it('should handle database errors gracefully', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        });

        const result = await workoutService.getWorkouts();
        expect(result).toEqual([]);
      });
    });

    describe('getWorkoutById', () => {
      it('should fetch single workout successfully', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockWorkout,
                error: null,
              }),
            }),
          }),
        });

        const result = await workoutService.getWorkoutById(mockWorkout.id);

        expect(result).toBeDefined();
        expect(result?.id).toBe(mockWorkout.id);
      });

      it('should return null for non-existent workout', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        });

        const result = await workoutService.getWorkoutById('non-existent-id');
        expect(result).toBeNull();
      });

      it('should cache single workout results', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockWorkout,
                error: null,
              }),
            }),
          }),
        });

        // First call
        await workoutService.getWorkoutById(mockWorkout.id);
        
        // Second call should use cache
        const result2 = await workoutService.getWorkoutById(mockWorkout.id);

        expect(result2).toBeDefined();
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
      });
    });

    describe('updateWorkout', () => {
      it('should update workout successfully', async () => {
        const updates = {
          name: 'Updated Workout Name',
          description: 'Updated description',
        };

        // Mock existing workout fetch
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockWorkout, user_id: mockUser.id },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWorkout, ...updates },
              error: null,
            }),
          };
        });

        const result = await workoutService.updateWorkout(mockWorkout.id, updates);

        expect(result).toBeDefined();
        expect(result?.name).toBe(updates.name);
      });

      it('should verify ownership before update', async () => {
        // Mock workout owned by different user
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockWorkout, user_id: 'different-user-id' },
                error: null,
              }),
            }),
          }),
        });

        const updates = { name: 'Updated Name' };

        await expect(workoutService.updateWorkout(mockWorkout.id, updates))
          .rejects.toThrow('Workout not found or access denied');
      });

      it('should update exercises when provided', async () => {
        const updates = {
          exercises: [
            {
              exerciseId: mockExercise.id,
              order: 1,
              sets: 4,
              reps: '12',
              restTime: 90,
            },
          ],
        };

        const mockDelete = jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        });

        const mockInsert = jest.fn().mockResolvedValue({ error: null });

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockWorkout, user_id: mockUser.id },
                    error: null,
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            };
          }
          if (table === 'workout_exercises') {
            return {
              delete: mockDelete,
              insert: mockInsert,
            };
          }
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWorkout, workout_exercises: [] },
              error: null,
            }),
          };
        });

        await workoutService.updateWorkout(mockWorkout.id, updates);

        expect(mockDelete).toHaveBeenCalled();
        expect(mockInsert).toHaveBeenCalled();
      });
    });

    describe('deleteWorkout', () => {
      it('should delete workout successfully', async () => {
        // Mock ownership verification
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts' && mockSupabase.from.mock.calls.length === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockWorkout, user_id: mockUser.id },
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Delete operation
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }),
          };
        });

        const result = await workoutService.deleteWorkout(mockWorkout.id);
        expect(result).toBe(true);
      });

      it('should verify ownership before deletion', async () => {
        // Mock workout owned by different user
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockWorkout, user_id: 'different-user-id' },
                error: null,
              }),
            }),
          }),
        });

        await expect(workoutService.deleteWorkout(mockWorkout.id))
          .rejects.toThrow('Workout not found or access denied');
      });

      it('should handle deletion errors', async () => {
        // Mock ownership verification success
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts' && mockSupabase.from.mock.calls.length === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { ...mockWorkout, user_id: mockUser.id },
                    error: null,
                  }),
                }),
              }),
            };
          }
          // Delete operation failure
          return {
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
              }),
            }),
          };
        });

        const result = await workoutService.deleteWorkout(mockWorkout.id);
        expect(result).toBe(false);
      });
    });

    describe('duplicateWorkout', () => {
      it('should duplicate workout successfully', async () => {
        const mockOriginalWorkout = {
          ...mockWorkout,
          workout_exercises: [
            {
              exercise_id: mockExercise.id,
              order_index: 1,
              sets: 3,
              reps: '10',
              weight: 50,
              rest_time: 60,
            },
          ],
        };

        // Mock getWorkoutById for original
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockOriginalWorkout,
                error: null,
              }),
            }),
          }),
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockOriginalWorkout, id: 'new-id' },
                error: null,
              }),
            }),
          }),
        });

        const result = await workoutService.duplicateWorkout(mockWorkout.id, 'Duplicated Workout');

        expect(result).toBeDefined();
        expect(result?.name).toBe('Duplicated Workout');
      });

      it('should handle non-existent original workout', async () => {
        // Mock non-existent workout
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
            }),
          }),
        });

        const result = await workoutService.duplicateWorkout('non-existent-id');
        expect(result).toBeNull();
      });
    });
  });

  describe('Workout Sessions', () => {
    describe('startWorkoutSession', () => {
      it('should start session successfully', async () => {
        const mockSession = {
          id: 'session-id',
          workout_id: mockWorkout.id,
          user_id: mockUser.id,
          start_time: new Date().toISOString(),
          completed: false,
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockWorkout,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'workout_sessions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [], // No active sessions
                    error: null,
                  }),
                }),
              }),
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockSession,
                    error: null,
                  }),
                }),
              }),
            };
          }
        });

        const result = await workoutService.startWorkoutSession(mockWorkout.id);

        expect(result).toBeDefined();
        expect(result?.workout_id).toBe(mockWorkout.id);
        expect(result?.completed).toBe(false);
      });

      it('should prevent multiple active sessions', async () => {
        const activeSession = {
          id: 'active-session-id',
          workout_id: 'other-workout-id',
          user_id: mockUser.id,
          completed: false,
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockWorkout,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'workout_sessions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    data: [activeSession], // Active session exists
                    error: null,
                  }),
                }),
              }),
            };
          }
        });

        await expect(workoutService.startWorkoutSession(mockWorkout.id))
          .rejects.toThrow('You already have an active workout session');
      });
    });

    describe('completeWorkoutSession', () => {
      it('should complete session successfully', async () => {
        const mockSession = {
          id: 'session-id',
          workout_id: mockWorkout.id,
          user_id: mockUser.id,
          start_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          completed: false,
        };

        const completedSession = {
          ...mockSession,
          end_time: new Date().toISOString(),
          duration: 60,
          completed: true,
          rating: 5,
          notes: 'Great workout!',
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workout_sessions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockSession,
                      error: null,
                    }),
                  }),
                }),
              }),
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: completedSession,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'workouts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockWorkout,
                    error: null,
                  }),
                }),
              }),
            };
          }
        });

        const result = await workoutService.completeWorkoutSession(
          mockSession.id,
          5,
          'Great workout!'
        );

        expect(result).toBeDefined();
        expect(result?.completed).toBe(true);
        expect(result?.rating).toBe(5);
        expect(result?.notes).toBe('Great workout!');
        expect(result?.duration).toBeGreaterThan(0);
      });

      it('should prevent completing already completed session', async () => {
        const completedSession = {
          id: 'session-id',
          workout_id: mockWorkout.id,
          user_id: mockUser.id,
          completed: true,
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: completedSession,
                  error: null,
                }),
              }),
            }),
          }),
        });

        await expect(workoutService.completeWorkoutSession(completedSession.id))
          .rejects.toThrow('Session already completed');
      });
    });

    describe('getActiveSession', () => {
      it('should return active session when exists', async () => {
        const activeSession = {
          id: 'session-id',
          workout_id: mockWorkout.id,
          user_id: mockUser.id,
          completed: false,
        };

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workout_sessions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockReturnValue({
                      limit: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({
                          data: activeSession,
                          error: null,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'workouts') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: mockWorkout,
                    error: null,
                  }),
                }),
              }),
            };
          }
        });

        const result = await workoutService.getActiveSession();

        expect(result).toBeDefined();
        expect(result?.completed).toBe(false);
        expect(result?.workout).toBeDefined();
      });

      it('should return null when no active session', async () => {
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: null,
                      error: { message: 'No active session' },
                    }),
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await workoutService.getActiveSession();
        expect(result).toBeNull();
      });
    });
  });

  describe('Statistics and Analytics', () => {
    describe('getWorkoutStats', () => {
      it('should calculate stats correctly', async () => {
        const mockSessions = [
          {
            duration: 60,
            start_time: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            workouts: { category: 'STRENGTH' },
          },
          {
            duration: 45,
            start_time: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            workouts: { category: 'STRENGTH' },
          },
          {
            duration: 30,
            start_time: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            workouts: { category: 'CARDIO' },
          },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workout_sessions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      data: mockSessions,
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'workouts') {
            return {
              select: jest.fn().mockResolvedValue({
                count: 5,
              }),
            };
          }
        });

        const stats = await workoutService.getWorkoutStats('month');

        expect(stats.totalSessions).toBe(3);
        expect(stats.totalDuration).toBe(135); // 60 + 45 + 30
        expect(stats.averageDuration).toBe(45); // 135 / 3
        expect(stats.favoriteCategory).toBe('STRENGTH');
        expect(stats.totalWorkouts).toBe(5);
      });

      it('should handle empty stats', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workout_sessions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    gte: jest.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          if (table === 'workouts') {
            return {
              select: jest.fn().mockResolvedValue({
                count: 0,
              }),
            };
          }
        });

        const stats = await workoutService.getWorkoutStats();

        expect(stats.totalSessions).toBe(0);
        expect(stats.totalDuration).toBe(0);
        expect(stats.averageDuration).toBe(0);
        expect(stats.completionRate).toBe(0);
      });
    });
  });

  describe('Template System', () => {
    describe('getPublicTemplates', () => {
      it('should fetch public templates', async () => {
        const mockTemplates = [
          MockDataFactory.createWorkout(mockUser.id, undefined, {
            is_template: true,
            is_public: true,
          }),
        ];

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest.fn().mockResolvedValue({
                    data: mockTemplates,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        });

        const result = await workoutService.getPublicTemplates(10);

        expect(result).toHaveLength(1);
        expect(result[0].is_template).toBe(true);
        expect(result[0].is_public).toBe(true);
      });
    });

    describe('createFromTemplate', () => {
      it('should create workout from template', async () => {
        const mockTemplate = {
          ...mockWorkout,
          is_template: true,
          workout_exercises: [
            {
              exercise_id: mockExercise.id,
              order_index: 1,
              sets: 3,
              reps: '10',
              weight: 50,
              rest_time: 60,
            },
          ],
        };

        // Mock template fetch and workout creation
        mockSupabase.from.mockImplementation((table: string) => {
          if (table === 'workouts') {
            if (mockSupabase.from.mock.calls.length === 1) {
              // First call - get template
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: mockTemplate,
                      error: null,
                    }),
                  }),
                }),
              };
            } else {
              // Second call - create new workout
              return {
                insert: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: { ...mockTemplate, id: 'new-workout-id' },
                      error: null,
                    }),
                  }),
                }),
              };
            }
          }
          if (table === 'workout_exercises') {
            return {
              insert: jest.fn().mockResolvedValue({ error: null }),
            };
          }
        });

        const result = await workoutService.createFromTemplate(
          mockTemplate.id,
          'Custom From Template'
        );

        expect(result).toBeDefined();
        expect(result?.name).toBe('Custom From Template');
      });

      it('should handle non-template workout', async () => {
        const nonTemplate = {
          ...mockWorkout,
          is_template: false,
        };

        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: nonTemplate,
                error: null,
              }),
            }),
          }),
        });

        await expect(workoutService.createFromTemplate(nonTemplate.id))
          .rejects.toThrow('Template not found');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle high-frequency requests', async () => {
      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        const promises = Array.from({ length: 100 }, () => 
          workoutService.getWorkouts()
        );
        await Promise.all(promises);
      });

      TestHelpers.expectPerformanceWithin(duration, 5000); // 5 seconds max
    });

    it('should detect memory leaks', async () => {
      const { leaked } = await TestHelpers.detectMemoryLeaks(async () => {
        await workoutService.getWorkouts();
        await workoutService.cleanup();
      }, 50);

      expect(leaked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Network error')),
      });

      const result = await workoutService.getWorkouts();
      expect(result).toEqual([]);
    });

    it('should handle invalid data gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null, // Invalid response
            error: null,
          }),
        }),
      });

      const result = await workoutService.getWorkouts();
      expect(result).toEqual([]);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache after mutations', async () => {
      // Setup successful responses
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [mockWorkout],
            error: null,
          }),
        }),
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      // First call populates cache
      await workoutService.getWorkouts();
      
      // Delete should clear cache
      await workoutService.deleteWorkout(mockWorkout.id);
      
      // Next call should hit database again
      await workoutService.getWorkouts();

      // Should have made multiple database calls due to cache clearing
      expect(mockSupabase.from).toHaveBeenCalledTimes(4); // get, get, delete, get
    });
  });
});
/**
 * ProgressService Unit Tests
 * Comprehensive test suite for progress tracking with Supabase
 */

import MockDataFactory, { MockProgress, MockWorkout } from '../../../test-utils/MockDataFactory';
import TestHelpers from '../../../test-utils/TestHelpers';

// Mock the ProgressService
const mockProgressService = {
  initialize: jest.fn(),
  cleanup: jest.fn(),
  recordWorkoutProgress: jest.fn(),
  getProgressHistory: jest.fn(),
  getProgressSummary: jest.fn(),
  calculateAchievements: jest.fn(),
  getPerformanceMetrics: jest.fn(),
  getProgressChartData: jest.fn(),
  setProgressGoals: jest.fn(),
  checkGoalProgress: jest.fn(),
  getWeeklyProgress: jest.fn(),
  getMonthlyProgress: jest.fn(),
  compareProgress: jest.fn(),
  exportProgressData: jest.fn(),
  getProgressInsights: jest.fn(),
  calculatePersonalRecords: jest.fn(),
  getStreakData: jest.fn(),
  getBodyMeasurements: jest.fn(),
  recordBodyMeasurement: jest.fn(),
  updateProgressNote: jest.fn(),
};

// Mock Supabase
const mockSupabase = global.mockSupabaseClient;

describe('ProgressService Unit Tests', () => {
  let mockUser: any;
  let mockWorkout: MockWorkout;
  let mockProgress: MockProgress;

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
    
    // Create fresh mock data
    mockWorkout = MockDataFactory.createWorkout(mockUser.id);
    mockProgress = MockDataFactory.createProgress(mockUser.id, mockWorkout.id);

    // Reset mock service
    Object.keys(mockProgressService).forEach(key => {
      mockProgressService[key as keyof typeof mockProgressService].mockReset();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      mockProgressService.initialize.mockResolvedValue(true);
      
      await expect(mockProgressService.initialize()).resolves.not.toThrow();
      expect(mockProgressService.initialize).toHaveBeenCalled();
    });
  });

  describe('Progress Recording', () => {
    describe('recordWorkoutProgress', () => {
      it('should record workout progress successfully', async () => {
        const progressData = {
          workout_id: mockWorkout.id,
          exercises_completed: 8,
          total_exercises: 10,
          duration: 3600, // 1 hour in seconds
          calories_burned: 350,
          average_heart_rate: 140,
          max_heart_rate: 165,
          fatigue_level: 7,
          notes: 'Ótimo treino hoje, senti bem os músculos trabalhando',
          performance_data: {
            exercise_prs: [
              { exercise_id: 'ex-1', weight: 80, reps: 10 },
              { exercise_id: 'ex-2', weight: 120, reps: 8 },
            ],
            rest_times: [60, 90, 60],
            technique_rating: 8.5,
          },
        };

        const recordedProgress = {
          id: 'progress-id',
          student_id: mockUser.id,
          ...progressData,
          completed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        };

        mockProgressService.recordWorkoutProgress.mockResolvedValue(recordedProgress);

        const result = await mockProgressService.recordWorkoutProgress(progressData);

        expect(result).toBeDefined();
        expect(result.workout_id).toBe(progressData.workout_id);
        expect(result.exercises_completed).toBe(progressData.exercises_completed);
        expect(result.duration).toBe(progressData.duration);
        expect(result.performance_data).toEqual(progressData.performance_data);
      });

      it('should validate required fields', async () => {
        const incompleteData = {
          workout_id: mockWorkout.id,
          // Missing required fields like exercises_completed
        };

        mockProgressService.recordWorkoutProgress.mockRejectedValue(
          new Error('exercises_completed is required')
        );

        await expect(mockProgressService.recordWorkoutProgress(incompleteData))
          .rejects.toThrow('exercises_completed is required');
      });

      it('should calculate additional metrics automatically', async () => {
        const basicData = {
          workout_id: mockWorkout.id,
          exercises_completed: 10,
          total_exercises: 10,
          duration: 3600,
        };

        const enhancedProgress = {
          ...basicData,
          id: 'progress-id',
          student_id: mockUser.id,
          completion_rate: 100, // Automatically calculated
          intensity_score: 8.2, // Calculated from performance data
          calorie_burn_rate: 5.8, // Calculated per minute
          created_at: new Date().toISOString(),
        };

        mockProgressService.recordWorkoutProgress.mockResolvedValue(enhancedProgress);

        const result = await mockProgressService.recordWorkoutProgress(basicData);

        expect(result.completion_rate).toBe(100);
        expect(result.intensity_score).toBeDefined();
        expect(result.calorie_burn_rate).toBeDefined();
      });
    });
  });

  describe('Progress History', () => {
    describe('getProgressHistory', () => {
      it('should fetch progress history with pagination', async () => {
        const progressHistory = Array.from({ length: 15 }, (_, index) => ({
          ...MockDataFactory.createProgress(mockUser.id, mockWorkout.id),
          completed_at: new Date(Date.now() - index * 86400000).toISOString(), // One per day
        }));

        mockProgressService.getProgressHistory.mockImplementation(async (userId, options) => {
          const limit = options?.limit || 10;
          const offset = options?.offset || 0;
          return progressHistory.slice(offset, offset + limit);
        });

        // First page
        const firstPage = await mockProgressService.getProgressHistory(mockUser.id, {
          limit: 10,
          offset: 0,
        });
        expect(firstPage).toHaveLength(10);

        // Second page
        const secondPage = await mockProgressService.getProgressHistory(mockUser.id, {
          limit: 10,
          offset: 10,
        });
        expect(secondPage).toHaveLength(5);
      });

      it('should filter progress by date range', async () => {
        const thisWeekProgress = [
          MockDataFactory.createProgress(mockUser.id, mockWorkout.id),
        ];

        mockProgressService.getProgressHistory.mockImplementation(async (userId, options) => {
          if (options?.startDate && options?.endDate) {
            return thisWeekProgress;
          }
          return [];
        });

        const startDate = new Date(Date.now() - 7 * 86400000).toISOString();
        const endDate = new Date().toISOString();

        const result = await mockProgressService.getProgressHistory(mockUser.id, {
          startDate,
          endDate,
        });

        expect(result).toHaveLength(1);
      });

      it('should filter progress by workout type', async () => {
        const strengthProgress = [
          MockDataFactory.createProgress(mockUser.id, mockWorkout.id),
        ];

        mockProgressService.getProgressHistory.mockImplementation(async (userId, options) => {
          if (options?.workoutType === 'STRENGTH') {
            return strengthProgress;
          }
          return [];
        });

        const result = await mockProgressService.getProgressHistory(mockUser.id, {
          workoutType: 'STRENGTH',
        });

        expect(result).toHaveLength(1);
      });
    });
  });

  describe('Progress Analytics', () => {
    describe('getProgressSummary', () => {
      it('should calculate comprehensive progress summary', async () => {
        const summary = {
          total_workouts: 45,
          total_sessions: 45,
          total_duration: 2700, // 45 hours in minutes
          average_duration: 60,
          calories_burned: 15750,
          completion_rate: 92.5,
          consistency_score: 8.7,
          current_streak: 12,
          longest_streak: 18,
          favorite_workout_type: 'STRENGTH',
          most_improved_metric: 'strength',
          recent_performance_trend: 'improving',
          goals_achieved: 3,
          total_goals: 5,
          personal_records: 12,
        };

        mockProgressService.getProgressSummary.mockResolvedValue(summary);

        const result = await mockProgressService.getProgressSummary(mockUser.id);

        expect(result.total_workouts).toBe(45);
        expect(result.completion_rate).toBe(92.5);
        expect(result.current_streak).toBe(12);
        expect(result.recent_performance_trend).toBe('improving');
      });

      it('should calculate summary for specific period', async () => {
        const monthlySummary = {
          total_workouts: 12,
          total_sessions: 12,
          period: 'month',
          completion_rate: 95.0,
          improvement_rate: 15.2,
        };

        mockProgressService.getProgressSummary.mockImplementation(async (userId, period) => {
          if (period === 'month') {
            return monthlySummary;
          }
          return { total_workouts: 45, period: 'all_time' };
        });

        const result = await mockProgressService.getProgressSummary(mockUser.id, 'month');
        expect(result.period).toBe('month');
        expect(result.total_workouts).toBe(12);
      });
    });

    describe('getPerformanceMetrics', () => {
      it('should calculate detailed performance metrics', async () => {
        const metrics = {
          strength_score: 85.6,
          endurance_score: 78.3,
          flexibility_score: 72.1,
          overall_fitness_score: 79.8,
          power_output: 450, // watts
          vo2_max_estimate: 52.3,
          body_fat_percentage: 12.5,
          muscle_mass_percentage: 45.2,
          metabolic_age: 28,
          fitness_age: 26,
          performance_trends: {
            strength: 'improving',
            endurance: 'stable',
            flexibility: 'declining',
          },
        };

        mockProgressService.getPerformanceMetrics.mockResolvedValue(metrics);

        const result = await mockProgressService.getPerformanceMetrics(mockUser.id);

        expect(result.overall_fitness_score).toBe(79.8);
        expect(result.strength_score).toBeGreaterThan(result.flexibility_score);
        expect(result.performance_trends.strength).toBe('improving');
      });
    });

    describe('getProgressChartData', () => {
      it('should format data for charts', async () => {
        const chartData = {
          weight_progression: [
            { date: '2024-01-01', value: 70 },
            { date: '2024-01-08', value: 72.5 },
            { date: '2024-01-15', value: 75 },
            { date: '2024-01-22', value: 77.5 },
          ],
          volume_progression: [
            { date: '2024-01-01', value: 12500 },
            { date: '2024-01-08', value: 13200 },
            { date: '2024-01-15', value: 13800 },
            { date: '2024-01-22', value: 14500 },
          ],
          duration_trends: [
            { week: 1, average: 58 },
            { week: 2, average: 62 },
            { week: 3, average: 65 },
            { week: 4, average: 63 },
          ],
        };

        mockProgressService.getProgressChartData.mockResolvedValue(chartData);

        const result = await mockProgressService.getProgressChartData(mockUser.id, 'month');

        expect(result.weight_progression).toHaveLength(4);
        expect(result.volume_progression[3].value).toBeGreaterThan(result.volume_progression[0].value);
        expect(result.duration_trends).toBeDefined();
      });

      it('should support different chart types', async () => {
        const strengthChart = {
          bench_press: [
            { date: '2024-01-01', weight: 80, reps: 8 },
            { date: '2024-01-08', weight: 82.5, reps: 8 },
            { date: '2024-01-15', weight: 85, reps: 8 },
          ],
        };

        mockProgressService.getProgressChartData.mockImplementation(async (userId, period, chartType) => {
          if (chartType === 'strength') {
            return strengthChart;
          }
          return { default: [] };
        });

        const result = await mockProgressService.getProgressChartData(
          mockUser.id,
          'month',
          'strength'
        );

        expect(result.bench_press).toBeDefined();
        expect(result.bench_press).toHaveLength(3);
      });
    });
  });

  describe('Achievements and Goals', () => {
    describe('calculateAchievements', () => {
      it('should identify earned achievements', async () => {
        const achievements = [
          {
            id: 'first_workout',
            name: 'Primeiro Treino',
            description: 'Completou o primeiro treino',
            earned_at: new Date().toISOString(),
            category: 'milestone',
            rarity: 'common',
          },
          {
            id: 'week_streak',
            name: 'Semana Consistente',
            description: 'Treinou por 7 dias consecutivos',
            earned_at: new Date().toISOString(),
            category: 'consistency',
            rarity: 'uncommon',
          },
          {
            id: 'strength_gain',
            name: 'Força em Alta',
            description: 'Aumentou 20% na carga do supino',
            earned_at: new Date().toISOString(),
            category: 'performance',
            rarity: 'rare',
            progress_data: { previous_weight: 80, current_weight: 96 },
          },
        ];

        mockProgressService.calculateAchievements.mockResolvedValue(achievements);

        const result = await mockProgressService.calculateAchievements(mockUser.id);

        expect(result).toHaveLength(3);
        expect(result[0].category).toBe('milestone');
        expect(result[2].progress_data).toBeDefined();
      });

      it('should track achievement progress', async () => {
        const progressTowards = [
          {
            id: 'hundred_workouts',
            name: '100 Treinos',
            description: 'Complete 100 treinos',
            progress: 45,
            target: 100,
            percentage: 45,
            category: 'milestone',
            estimated_completion: '2024-06-15',
          },
        ];

        mockProgressService.calculateAchievements.mockImplementation(async (userId, includeProgress) => {
          if (includeProgress) {
            return progressTowards;
          }
          return [];
        });

        const result = await mockProgressService.calculateAchievements(mockUser.id, true);
        expect(result[0].progress).toBe(45);
        expect(result[0].percentage).toBe(45);
      });
    });

    describe('setProgressGoals', () => {
      it('should set user progress goals', async () => {
        const goals = [
          {
            type: 'weight_loss',
            target_value: 75, // kg
            current_value: 80,
            target_date: '2024-06-01',
            description: 'Perder 5kg até junho',
          },
          {
            type: 'strength_gain',
            exercise: 'bench_press',
            target_value: 100, // kg
            current_value: 85,
            target_date: '2024-05-01',
            description: 'Supino de 100kg',
          },
        ];

        mockProgressService.setProgressGoals.mockResolvedValue(goals);

        const result = await mockProgressService.setProgressGoals(mockUser.id, goals);

        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('weight_loss');
        expect(result[1].exercise).toBe('bench_press');
      });
    });

    describe('checkGoalProgress', () => {
      it('should check progress towards goals', async () => {
        const goalProgress = [
          {
            goal_id: 'goal-1',
            type: 'weight_loss',
            progress_percentage: 60, // 60% complete
            current_value: 77,
            target_value: 75,
            days_remaining: 45,
            on_track: true,
            projected_completion: '2024-05-15',
          },
          {
            goal_id: 'goal-2',
            type: 'strength_gain',
            progress_percentage: 75,
            current_value: 95,
            target_value: 100,
            days_remaining: 30,
            on_track: true,
            projected_completion: '2024-04-20',
          },
        ];

        mockProgressService.checkGoalProgress.mockResolvedValue(goalProgress);

        const result = await mockProgressService.checkGoalProgress(mockUser.id);

        expect(result).toHaveLength(2);
        expect(result[0].progress_percentage).toBe(60);
        expect(result[1].on_track).toBe(true);
      });
    });
  });

  describe('Body Measurements', () => {
    describe('recordBodyMeasurement', () => {
      it('should record body measurements', async () => {
        const measurements = {
          weight: 77.5,
          body_fat_percentage: 12.3,
          muscle_mass: 65.2,
          chest: 102,
          waist: 82,
          hips: 95,
          bicep: 35,
          thigh: 58,
        };

        const recordedMeasurement = {
          id: 'measurement-id',
          student_id: mockUser.id,
          measured_at: new Date().toISOString(),
          ...measurements,
        };

        mockProgressService.recordBodyMeasurement.mockResolvedValue(recordedMeasurement);

        const result = await mockProgressService.recordBodyMeasurement(measurements);

        expect(result.weight).toBe(measurements.weight);
        expect(result.body_fat_percentage).toBe(measurements.body_fat_percentage);
        expect(result.muscle_mass).toBe(measurements.muscle_mass);
      });
    });

    describe('getBodyMeasurements', () => {
      it('should fetch body measurement history', async () => {
        const measurements = [
          { measured_at: '2024-01-01', weight: 80, body_fat_percentage: 15 },
          { measured_at: '2024-01-15', weight: 78.5, body_fat_percentage: 14.2 },
          { measured_at: '2024-02-01', weight: 77, body_fat_percentage: 13.5 },
        ];

        mockProgressService.getBodyMeasurements.mockResolvedValue(measurements);

        const result = await mockProgressService.getBodyMeasurements(mockUser.id);

        expect(result).toHaveLength(3);
        expect(result[0].weight).toBeGreaterThan(result[2].weight); // Weight decreasing
      });
    });
  });

  describe('Advanced Analytics', () => {
    describe('compareProgress', () => {
      it('should compare progress between periods', async () => {
        const comparison = {
          current_period: {
            workouts: 12,
            duration: 720, // minutes
            avg_completion: 95,
            strength_gain: 8.5,
          },
          previous_period: {
            workouts: 10,
            duration: 600,
            avg_completion: 87,
            strength_gain: 5.2,
          },
          improvements: {
            workouts: '+2 (+20%)',
            duration: '+120 min (+20%)',
            avg_completion: '+8% (+9%)',
            strength_gain: '+3.3 (+63%)',
          },
          overall_trend: 'improving',
        };

        mockProgressService.compareProgress.mockResolvedValue(comparison);

        const result = await mockProgressService.compareProgress(
          mockUser.id,
          'this_month',
          'last_month'
        );

        expect(result.overall_trend).toBe('improving');
        expect(result.improvements.workouts).toContain('+20%');
      });
    });

    describe('getProgressInsights', () => {
      it('should generate AI-powered insights', async () => {
        const insights = [
          {
            type: 'performance',
            title: 'Força em Alta',
            message: 'Seu supino melhorou 15% nas últimas 4 semanas. Continue focando na técnica!',
            priority: 'high',
            action: 'Continue o programa atual',
          },
          {
            type: 'consistency',
            title: 'Padrão de Treino',
            message: 'Você treina melhor às terças e quintas. Considere manter essa rotina.',
            priority: 'medium',
            action: 'Otimize agenda para dias de maior performance',
          },
          {
            type: 'recovery',
            title: 'Tempo de Descanso',
            message: 'Seus tempos de descanso estão muito longos. Tente reduzir para 60-90s.',
            priority: 'low',
            action: 'Use timer durante treinos',
          },
        ];

        mockProgressService.getProgressInsights.mockResolvedValue(insights);

        const result = await mockProgressService.getProgressInsights(mockUser.id);

        expect(result).toHaveLength(3);
        expect(result[0].priority).toBe('high');
        expect(result[0].action).toBeDefined();
      });
    });

    describe('calculatePersonalRecords', () => {
      it('should identify and track personal records', async () => {
        const personalRecords = [
          {
            exercise: 'bench_press',
            exercise_name: 'Supino Reto',
            record_type: 'max_weight',
            value: 95,
            unit: 'kg',
            achieved_at: '2024-01-20',
            previous_record: 90,
            improvement: 5,
          },
          {
            exercise: 'squat',
            exercise_name: 'Agachamento',
            record_type: 'max_reps',
            value: 15,
            unit: 'reps',
            weight: 80,
            achieved_at: '2024-01-18',
            previous_record: 12,
            improvement: 3,
          },
        ];

        mockProgressService.calculatePersonalRecords.mockResolvedValue(personalRecords);

        const result = await mockProgressService.calculatePersonalRecords(mockUser.id);

        expect(result).toHaveLength(2);
        expect(result[0].record_type).toBe('max_weight');
        expect(result[1].record_type).toBe('max_reps');
        expect(result[0].improvement).toBe(5);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large progress datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, () => 
        MockDataFactory.createProgress(mockUser.id, mockWorkout.id)
      );

      mockProgressService.getProgressHistory.mockResolvedValue(largeDataset);

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        await mockProgressService.getProgressHistory(mockUser.id);
      });

      TestHelpers.expectPerformanceWithin(duration, 2000); // 2 seconds max
    });

    it('should detect memory leaks', async () => {
      const { leaked } = await TestHelpers.detectMemoryLeaks(async () => {
        await mockProgressService.getProgressSummary(mockUser.id);
      }, 50);

      expect(leaked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid progress data', async () => {
      const invalidData = {
        workout_id: null,
        exercises_completed: -1, // Invalid negative value
      };

      mockProgressService.recordWorkoutProgress.mockRejectedValue(
        new Error('Invalid progress data')
      );

      await expect(mockProgressService.recordWorkoutProgress(invalidData))
        .rejects.toThrow('Invalid progress data');
    });

    it('should handle database errors gracefully', async () => {
      mockProgressService.getProgressHistory.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(mockProgressService.getProgressHistory(mockUser.id))
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Data Export', () => {
    describe('exportProgressData', () => {
      it('should export progress data in multiple formats', async () => {
        const exportData = {
          format: 'json',
          data: {
            progress_history: [mockProgress],
            achievements: [],
            body_measurements: [],
            personal_records: [],
          },
          exported_at: new Date().toISOString(),
          total_records: 1,
        };

        mockProgressService.exportProgressData.mockResolvedValue(exportData);

        const result = await mockProgressService.exportProgressData(
          mockUser.id,
          'json',
          { includeAchievements: true }
        );

        expect(result.format).toBe('json');
        expect(result.data.progress_history).toHaveLength(1);
        expect(result.total_records).toBe(1);
      });

      it('should support CSV export', async () => {
        const csvData = {
          format: 'csv',
          data: 'date,workout,duration,completion_rate\n2024-01-20,Strength,60,100',
          exported_at: new Date().toISOString(),
        };

        mockProgressService.exportProgressData.mockImplementation(async (userId, format) => {
          if (format === 'csv') {
            return csvData;
          }
          return { format: 'json', data: {} };
        });

        const result = await mockProgressService.exportProgressData(mockUser.id, 'csv');
        expect(result.format).toBe('csv');
        expect(result.data).toContain('date,workout,duration,completion_rate');
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      mockProgressService.cleanup.mockResolvedValue(true);

      await mockProgressService.cleanup();
      expect(mockProgressService.cleanup).toHaveBeenCalled();
    });
  });
});
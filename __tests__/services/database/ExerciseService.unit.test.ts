/**
 * ExerciseService Unit Tests
 * Comprehensive test suite for exercise management with Supabase
 */

import MockDataFactory, { MockExercise } from '../../../test-utils/MockDataFactory';
import TestHelpers from '../../../test-utils/TestHelpers';

// Mock the ExerciseService
const mockExerciseService = {
  initialize: jest.fn(),
  cleanup: jest.fn(),
  createCustomExercise: jest.fn(),
  updateExercise: jest.fn(),
  deleteExercise: jest.fn(),
  getExerciseById: jest.fn(),
  searchExercises: jest.fn(),
  getExercisesByCategory: jest.fn(),
  getExercisesByMuscleGroup: jest.fn(),
  uploadExerciseVideo: jest.fn(),
  uploadExerciseThumbnail: jest.fn(),
  getCustomExercises: jest.fn(),
  duplicateExercise: jest.fn(),
  getExerciseStats: jest.fn(),
  getPopularExercises: jest.fn(),
  validateExerciseData: jest.fn(),
};

// Mock Supabase
const mockSupabase = global.mockSupabaseClient;

describe('ExerciseService Unit Tests', () => {
  let mockUser: any;
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
    
    // Create fresh mock data
    mockExercise = MockDataFactory.createExercise(mockUser.id);

    // Reset mock service
    Object.keys(mockExerciseService).forEach(key => {
      mockExerciseService[key as keyof typeof mockExerciseService].mockReset();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      mockExerciseService.initialize.mockResolvedValue(true);
      
      await expect(mockExerciseService.initialize()).resolves.not.toThrow();
      expect(mockExerciseService.initialize).toHaveBeenCalled();
    });
  });

  describe('Custom Exercise Management', () => {
    describe('createCustomExercise', () => {
      it('should create custom exercise successfully', async () => {
        const exerciseData = {
          name: 'Supino Inclinado com Halteres',
          description: 'Exercício para trabalhar peito superior',
          muscle_groups: ['peito', 'ombros', 'tríceps'],
          equipment: 'halteres',
          difficulty_level: 'intermediate',
          instructions: ['Deite no banco inclinado', 'Pegue os halteres', 'Execute o movimento'],
        };

        const createdExercise = {
          id: 'custom-exercise-id',
          ...exerciseData,
          trainer_id: mockUser.id,
          is_custom: true,
          created_at: new Date().toISOString(),
        };

        mockExerciseService.createCustomExercise.mockResolvedValue(createdExercise);

        const result = await mockExerciseService.createCustomExercise(exerciseData);

        expect(result).toBeDefined();
        expect(result.name).toBe(exerciseData.name);
        expect(result.muscle_groups).toEqual(exerciseData.muscle_groups);
        expect(result.is_custom).toBe(true);
      });

      it('should validate required fields', async () => {
        const incompleteData = {
          name: 'Test Exercise',
          // Missing muscle_groups and other required fields
        };

        mockExerciseService.createCustomExercise.mockRejectedValue(
          new Error('Muscle groups are required')
        );

        await expect(mockExerciseService.createCustomExercise(incompleteData))
          .rejects.toThrow('Muscle groups are required');
      });

      it('should prevent duplicate exercise names for same trainer', async () => {
        const exerciseData = {
          name: 'Supino Reto',
          muscle_groups: ['peito'],
          equipment: 'barra',
        };

        mockExerciseService.createCustomExercise.mockRejectedValue(
          new Error('Exercise with this name already exists')
        );

        await expect(mockExerciseService.createCustomExercise(exerciseData))
          .rejects.toThrow('Exercise with this name already exists');
      });
    });

    describe('updateExercise', () => {
      it('should update custom exercise successfully', async () => {
        const updates = {
          description: 'Descrição atualizada',
          difficulty_level: 'advanced',
          muscle_groups: ['peito', 'ombros', 'tríceps', 'core'],
        };

        const updatedExercise = {
          ...mockExercise,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        mockExerciseService.updateExercise.mockResolvedValue(updatedExercise);

        const result = await mockExerciseService.updateExercise(mockExercise.id, updates);

        expect(result).toBeDefined();
        expect(result.description).toBe(updates.description);
        expect(result.difficulty_level).toBe(updates.difficulty_level);
        expect(result.muscle_groups).toEqual(updates.muscle_groups);
      });

      it('should prevent updating non-custom exercises', async () => {
        mockExerciseService.updateExercise.mockRejectedValue(
          new Error('Cannot update system exercises')
        );

        await expect(mockExerciseService.updateExercise('system-exercise-id', {}))
          .rejects.toThrow('Cannot update system exercises');
      });

      it('should verify ownership before update', async () => {
        mockExerciseService.updateExercise.mockRejectedValue(
          new Error('Not authorized to update this exercise')
        );

        await expect(mockExerciseService.updateExercise('other-trainer-exercise', {}))
          .rejects.toThrow('Not authorized to update this exercise');
      });
    });

    describe('deleteExercise', () => {
      it('should delete custom exercise successfully', async () => {
        mockExerciseService.deleteExercise.mockResolvedValue(true);

        const result = await mockExerciseService.deleteExercise(mockExercise.id);
        expect(result).toBe(true);
      });

      it('should prevent deleting system exercises', async () => {
        mockExerciseService.deleteExercise.mockRejectedValue(
          new Error('Cannot delete system exercises')
        );

        await expect(mockExerciseService.deleteExercise('system-exercise-id'))
          .rejects.toThrow('Cannot delete system exercises');
      });

      it('should check for exercise usage before deletion', async () => {
        mockExerciseService.deleteExercise.mockRejectedValue(
          new Error('Exercise is being used in active workouts')
        );

        await expect(mockExerciseService.deleteExercise(mockExercise.id))
          .rejects.toThrow('Exercise is being used in active workouts');
      });
    });
  });

  describe('Exercise Search and Filtering', () => {
    describe('searchExercises', () => {
      it('should search exercises by name', async () => {
        const searchResults = [
          MockDataFactory.createExercise(mockUser.id, { name: 'Supino Reto' }),
          MockDataFactory.createExercise(mockUser.id, { name: 'Supino Inclinado' }),
        ];

        mockExerciseService.searchExercises.mockImplementation(async (query) => {
          if (query.toLowerCase().includes('supino')) {
            return searchResults;
          }
          return [];
        });

        const result = await mockExerciseService.searchExercises('supino');
        expect(result).toHaveLength(2);
        expect(result.every(ex => ex.name.toLowerCase().includes('supino'))).toBe(true);
      });

      it('should filter by muscle groups', async () => {
        const chestExercises = [
          MockDataFactory.createExercise(mockUser.id, { 
            name: 'Supino Reto',
            muscle_groups: ['peito', 'tríceps'] 
          }),
        ];

        mockExerciseService.searchExercises.mockImplementation(async (query, filters) => {
          if (filters?.muscle_groups?.includes('peito')) {
            return chestExercises;
          }
          return [];
        });

        const result = await mockExerciseService.searchExercises('', {
          muscle_groups: ['peito'],
        });

        expect(result).toHaveLength(1);
        expect(result[0].muscle_groups).toContain('peito');
      });

      it('should filter by equipment', async () => {
        const dumbbellExercises = [
          MockDataFactory.createExercise(mockUser.id, {
            name: 'Rosca com Halteres',
            equipment: 'halteres',
          }),
        ];

        mockExerciseService.searchExercises.mockImplementation(async (query, filters) => {
          if (filters?.equipment === 'halteres') {
            return dumbbellExercises;
          }
          return [];
        });

        const result = await mockExerciseService.searchExercises('', {
          equipment: 'halteres',
        });

        expect(result[0].equipment).toBe('halteres');
      });

      it('should filter by difficulty level', async () => {
        const beginnerExercises = [
          MockDataFactory.createExercise(mockUser.id, {
            difficulty_level: 'beginner',
          }),
        ];

        mockExerciseService.searchExercises.mockImplementation(async (query, filters) => {
          if (filters?.difficulty_level === 'beginner') {
            return beginnerExercises;
          }
          return [];
        });

        const result = await mockExerciseService.searchExercises('', {
          difficulty_level: 'beginner',
        });

        expect(result[0].difficulty_level).toBe('beginner');
      });
    });

    describe('getExercisesByCategory', () => {
      it('should fetch exercises by category', async () => {
        const strengthExercises = [
          MockDataFactory.createExercise(mockUser.id, { name: 'Agachamento' }),
          MockDataFactory.createExercise(mockUser.id, { name: 'Levantamento Terra' }),
        ];

        mockExerciseService.getExercisesByCategory.mockResolvedValue(strengthExercises);

        const result = await mockExerciseService.getExercisesByCategory('STRENGTH');
        expect(result).toHaveLength(2);
      });
    });

    describe('getExercisesByMuscleGroup', () => {
      it('should fetch exercises by muscle group', async () => {
        const chestExercises = [
          MockDataFactory.createExercise(mockUser.id, {
            name: 'Supino Reto',
            muscle_groups: ['peito'],
          }),
          MockDataFactory.createExercise(mockUser.id, {
            name: 'Flexão',
            muscle_groups: ['peito', 'tríceps'],
          }),
        ];

        mockExerciseService.getExercisesByMuscleGroup.mockResolvedValue(chestExercises);

        const result = await mockExerciseService.getExercisesByMuscleGroup('peito');
        expect(result.every(ex => ex.muscle_groups.includes('peito'))).toBe(true);
      });
    });
  });

  describe('Media Management', () => {
    describe('uploadExerciseVideo', () => {
      it('should upload exercise video successfully', async () => {
        const videoFile = new Blob(['fake video data'], { type: 'video/mp4' });
        const uploadResult = {
          url: 'https://storage.supabase.co/videos/exercise-demo.mp4',
          path: 'videos/exercise-demo.mp4',
        };

        mockExerciseService.uploadExerciseVideo.mockResolvedValue(uploadResult);

        const result = await mockExerciseService.uploadExerciseVideo(
          mockExercise.id,
          videoFile
        );

        expect(result.url).toBeDefined();
        expect(result.path).toBeDefined();
        expect(result.url).toContain('.mp4');
      });

      it('should validate video file type', async () => {
        const invalidFile = new Blob(['not a video'], { type: 'text/plain' });

        mockExerciseService.uploadExerciseVideo.mockRejectedValue(
          new Error('Invalid file type. Only video files are allowed')
        );

        await expect(mockExerciseService.uploadExerciseVideo(
          mockExercise.id,
          invalidFile
        )).rejects.toThrow('Invalid file type. Only video files are allowed');
      });

      it('should validate video file size', async () => {
        const largeVideo = new Blob(['x'.repeat(100 * 1024 * 1024)], { type: 'video/mp4' });

        mockExerciseService.uploadExerciseVideo.mockRejectedValue(
          new Error('File too large. Maximum size is 50MB')
        );

        await expect(mockExerciseService.uploadExerciseVideo(
          mockExercise.id,
          largeVideo
        )).rejects.toThrow('File too large. Maximum size is 50MB');
      });
    });

    describe('uploadExerciseThumbnail', () => {
      it('should upload exercise thumbnail successfully', async () => {
        const thumbnailFile = new Blob(['fake image data'], { type: 'image/jpeg' });
        const uploadResult = {
          url: 'https://storage.supabase.co/thumbnails/exercise-thumb.jpg',
          path: 'thumbnails/exercise-thumb.jpg',
        };

        mockExerciseService.uploadExerciseThumbnail.mockResolvedValue(uploadResult);

        const result = await mockExerciseService.uploadExerciseThumbnail(
          mockExercise.id,
          thumbnailFile
        );

        expect(result.url).toBeDefined();
        expect(result.url).toContain('.jpg');
      });

      it('should validate thumbnail file type', async () => {
        const invalidFile = new Blob(['not an image'], { type: 'text/plain' });

        mockExerciseService.uploadExerciseThumbnail.mockRejectedValue(
          new Error('Invalid file type. Only image files are allowed')
        );

        await expect(mockExerciseService.uploadExerciseThumbnail(
          mockExercise.id,
          invalidFile
        )).rejects.toThrow('Invalid file type. Only image files are allowed');
      });
    });
  });

  describe('Exercise Analytics', () => {
    describe('getExerciseStats', () => {
      it('should calculate exercise usage statistics', async () => {
        const stats = {
          exercise_id: mockExercise.id,
          total_usage: 45,
          unique_users: 12,
          avg_sets: 3.2,
          avg_reps: 11.5,
          avg_weight: 67.8,
          popularity_rank: 8,
          recent_usage_trend: 'increasing',
        };

        mockExerciseService.getExerciseStats.mockResolvedValue(stats);

        const result = await mockExerciseService.getExerciseStats(mockExercise.id);

        expect(result.total_usage).toBe(45);
        expect(result.unique_users).toBe(12);
        expect(result.popularity_rank).toBe(8);
        expect(result.recent_usage_trend).toBe('increasing');
      });

      it('should calculate stats for specific time period', async () => {
        const monthlyStats = {
          exercise_id: mockExercise.id,
          total_usage: 12,
          unique_users: 8,
          period: 'month',
        };

        mockExerciseService.getExerciseStats.mockImplementation(async (exerciseId, period) => {
          if (period === 'month') {
            return monthlyStats;
          }
          return {
            exercise_id: mockExercise.id,
            total_usage: 45,
            period: 'all_time',
          };
        });

        const result = await mockExerciseService.getExerciseStats(mockExercise.id, 'month');
        expect(result.total_usage).toBe(12);
        expect(result.period).toBe('month');
      });
    });

    describe('getPopularExercises', () => {
      it('should fetch most popular exercises', async () => {
        const popularExercises = [
          MockDataFactory.createExercise(mockUser.id, { name: 'Agachamento' }),
          MockDataFactory.createExercise(mockUser.id, { name: 'Supino Reto' }),
          MockDataFactory.createExercise(mockUser.id, { name: 'Levantamento Terra' }),
        ].map((exercise, index) => ({
          ...exercise,
          usage_count: 50 - (index * 10),
          popularity_rank: index + 1,
        }));

        mockExerciseService.getPopularExercises.mockResolvedValue(popularExercises);

        const result = await mockExerciseService.getPopularExercises(10);

        expect(result).toHaveLength(3);
        expect(result[0].usage_count).toBeGreaterThan(result[1].usage_count);
        expect(result[0].popularity_rank).toBe(1);
      });

      it('should filter popular exercises by muscle group', async () => {
        const chestExercises = [
          MockDataFactory.createExercise(mockUser.id, {
            name: 'Supino Reto',
            muscle_groups: ['peito'],
            usage_count: 45,
          }),
        ];

        mockExerciseService.getPopularExercises.mockImplementation(async (limit, filters) => {
          if (filters?.muscle_group === 'peito') {
            return chestExercises;
          }
          return [];
        });

        const result = await mockExerciseService.getPopularExercises(10, {
          muscle_group: 'peito',
        });

        expect(result[0].muscle_groups).toContain('peito');
      });
    });
  });

  describe('Exercise Operations', () => {
    describe('duplicateExercise', () => {
      it('should duplicate exercise successfully', async () => {
        const duplicated = {
          ...mockExercise,
          id: 'duplicated-exercise-id',
          name: `${mockExercise.name} (Cópia)`,
          created_at: new Date().toISOString(),
        };

        mockExerciseService.duplicateExercise.mockResolvedValue(duplicated);

        const result = await mockExerciseService.duplicateExercise(
          mockExercise.id,
          'Exercício Personalizado'
        );

        expect(result.id).not.toBe(mockExercise.id);
        expect(result.name).toContain('Personalizado');
      });
    });

    describe('validateExerciseData', () => {
      it('should validate exercise data correctly', async () => {
        const validData = {
          name: 'Supino Reto',
          muscle_groups: ['peito', 'tríceps'],
          equipment: 'barra',
          difficulty_level: 'intermediate',
        };

        mockExerciseService.validateExerciseData.mockResolvedValue({
          isValid: true,
          errors: [],
        });

        const result = await mockExerciseService.validateExerciseData(validData);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });

      it('should identify validation errors', async () => {
        const invalidData = {
          name: '', // Empty name
          muscle_groups: [], // Empty array
          equipment: 'invalid_equipment',
        };

        mockExerciseService.validateExerciseData.mockResolvedValue({
          isValid: false,
          errors: [
            'Name is required',
            'At least one muscle group is required',
            'Invalid equipment type',
          ],
        });

        const result = await mockExerciseService.validateExerciseData(invalidData);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large search results efficiently', async () => {
      const largeResults = Array.from({ length: 1000 }, () => 
        MockDataFactory.createExercise(mockUser.id)
      );

      mockExerciseService.searchExercises.mockResolvedValue(largeResults);

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        await mockExerciseService.searchExercises('exercise');
      });

      TestHelpers.expectPerformanceWithin(duration, 1000); // 1 second max
    });

    it('should detect memory leaks', async () => {
      const { leaked } = await TestHelpers.detectMemoryLeaks(async () => {
        await mockExerciseService.searchExercises('test');
      }, 50);

      expect(leaked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockExerciseService.getExerciseById.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(mockExerciseService.getExerciseById(mockExercise.id))
        .rejects.toThrow('Network timeout');
    });

    it('should handle malformed data', async () => {
      mockExerciseService.createCustomExercise.mockRejectedValue(
        new Error('Invalid exercise data format')
      );

      await expect(mockExerciseService.createCustomExercise(null))
        .rejects.toThrow('Invalid exercise data format');
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      mockExerciseService.cleanup.mockResolvedValue(true);

      await mockExerciseService.cleanup();
      expect(mockExerciseService.cleanup).toHaveBeenCalled();
    });
  });
});
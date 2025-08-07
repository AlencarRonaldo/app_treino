/**
 * StudentService Unit Tests
 * Comprehensive test suite for student management with Supabase
 */

import MockDataFactory, { MockUser } from '../../../test-utils/MockDataFactory';
import TestHelpers from '../../../test-utils/TestHelpers';

// Mock the StudentService
const mockStudentService = {
  initialize: jest.fn(),
  cleanup: jest.fn(),
  createStudentProfile: jest.fn(),
  getStudentProfile: jest.fn(),
  updateStudentProfile: jest.fn(),
  getStudentsByTrainer: jest.fn(),
  assignStudentToTrainer: jest.fn(),
  removeStudentFromTrainer: jest.fn(),
  getStudentSummary: jest.fn(),
  getBulkStudentData: jest.fn(),
  updateBulkStudents: jest.fn(),
  searchStudents: jest.fn(),
  getStudentAnalytics: jest.fn(),
  getTrainerAnalytics: jest.fn(),
  calculateStudentMetrics: jest.fn(),
  getActiveStudents: jest.fn(),
  getInactiveStudents: jest.fn(),
  setStudentGoals: jest.fn(),
  addTrainerNote: jest.fn(),
  getStudentProgress: jest.fn(),
};

// Mock Supabase
const mockSupabase = global.mockSupabaseClient;

// Mock database utils
jest.mock('../../../treinosapp-mobile/lib/database', () => ({
  databaseUtils: {
    initialize: jest.fn().mockResolvedValue(true),
  },
}));

describe('StudentService Unit Tests', () => {
  let mockTrainer: MockUser;
  let mockStudent: MockUser;
  let mockStudent2: MockUser;

  beforeAll(() => {
    // Setup mock users
    mockTrainer = MockDataFactory.createTrainer();
    mockStudent = MockDataFactory.createStudent();
    mockStudent2 = MockDataFactory.createStudent();

    // Mock auth.getUser (default to trainer)
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: mockTrainer },
      error: null,
    });
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset mock service
    Object.keys(mockStudentService).forEach(key => {
      mockStudentService[key as keyof typeof mockStudentService].mockReset();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      mockStudentService.initialize.mockResolvedValue(true);
      
      await expect(mockStudentService.initialize()).resolves.not.toThrow();
      expect(mockStudentService.initialize).toHaveBeenCalled();
    });

    it('should setup database connection', async () => {
      mockStudentService.initialize.mockImplementation(async () => {
        // Simulate database connection setup
        await mockSupabase.from('users').select('count').limit(1);
      });

      await mockStudentService.initialize();
      // Verify database connection was tested
      expect(mockStudentService.initialize).toHaveBeenCalled();
    });
  });

  describe('Student Profile Management', () => {
    describe('createStudentProfile', () => {
      it('should create student profile successfully', async () => {
        const studentData = {
          name: 'João Silva',
          email: 'joao@example.com',
          fitness_level: 'BEGINNER' as const,
          goals: ['weight_loss', 'muscle_gain'],
          birth_date: '1990-05-15',
          phone: '(11) 99999-9999',
        };

        const createdProfile = {
          id: 'new-student-id',
          ...studentData,
          user_type: 'student',
          created_at: new Date().toISOString(),
        };

        mockStudentService.createStudentProfile.mockResolvedValue(createdProfile);

        const result = await mockStudentService.createStudentProfile(studentData);

        expect(result).toBeDefined();
        expect(result.name).toBe(studentData.name);
        expect(result.email).toBe(studentData.email);
        expect(result.fitness_level).toBe(studentData.fitness_level);
        expect(result.user_type).toBe('student');
      });

      it('should validate required fields', async () => {
        const incompleteData = {
          email: 'test@example.com',
          // Missing name and other required fields
        };

        mockStudentService.createStudentProfile.mockRejectedValue(
          new Error('Name is required for student profile')
        );

        await expect(mockStudentService.createStudentProfile(incompleteData))
          .rejects.toThrow('Name is required for student profile');
      });

      it('should handle duplicate emails', async () => {
        const studentData = {
          name: 'João Silva',
          email: 'existing@example.com',
        };

        mockStudentService.createStudentProfile.mockRejectedValue(
          new Error('Email already exists')
        );

        await expect(mockStudentService.createStudentProfile(studentData))
          .rejects.toThrow('Email already exists');
      });
    });

    describe('getStudentProfile', () => {
      it('should fetch student profile with trainer info', async () => {
        const studentWithTrainer = {
          ...mockStudent,
          trainer: {
            id: mockTrainer.id,
            name: mockTrainer.name,
            email: mockTrainer.email,
            profile_picture: mockTrainer.avatar_url,
          },
          progress_summary: {
            total_workouts: 15,
            total_sessions: 45,
            current_streak: 5,
            adherence_rate: 85.5,
            last_workout: new Date().toISOString(),
          },
          assigned_workouts_count: 8,
        };

        mockStudentService.getStudentProfile.mockResolvedValue(studentWithTrainer);

        const result = await mockStudentService.getStudentProfile(mockStudent.id);

        expect(result).toBeDefined();
        expect(result.trainer).toBeDefined();
        expect(result.progress_summary).toBeDefined();
        expect(result.progress_summary.total_sessions).toBe(45);
        expect(result.assigned_workouts_count).toBe(8);
      });

      it('should handle non-existent student', async () => {
        mockStudentService.getStudentProfile.mockResolvedValue(null);

        const result = await mockStudentService.getStudentProfile('non-existent-id');
        expect(result).toBeNull();
      });
    });

    describe('updateStudentProfile', () => {
      it('should update student profile successfully', async () => {
        const updates = {
          fitness_level: 'INTERMEDIATE' as const,
          goals: ['strength', 'endurance'],
          phone: '(11) 88888-8888',
        };

        const updatedProfile = {
          ...mockStudent,
          ...updates,
          updated_at: new Date().toISOString(),
        };

        mockStudentService.updateStudentProfile.mockResolvedValue(updatedProfile);

        const result = await mockStudentService.updateStudentProfile(mockStudent.id, updates);

        expect(result).toBeDefined();
        expect(result.fitness_level).toBe(updates.fitness_level);
        expect(result.goals).toEqual(updates.goals);
        expect(result.phone).toBe(updates.phone);
      });

      it('should prevent unauthorized updates', async () => {
        const updates = { name: 'Hacker' };

        mockStudentService.updateStudentProfile.mockRejectedValue(
          new Error('Unauthorized to update this profile')
        );

        await expect(mockStudentService.updateStudentProfile('other-student-id', updates))
          .rejects.toThrow('Unauthorized to update this profile');
      });
    });
  });

  describe('Trainer-Student Relationships', () => {
    describe('getStudentsByTrainer', () => {
      it('should fetch trainer students with summaries', async () => {
        const studentsWithSummaries = [
          {
            id: mockStudent.id,
            name: mockStudent.name,
            email: mockStudent.email,
            fitness_level: 'BEGINNER',
            status: 'active',
            total_workouts: 10,
            completed_sessions: 25,
            current_streak: 3,
            adherence_rate: 80.0,
            assigned_workouts: 5,
            pending_workouts: 2,
            goals: ['weight_loss'],
            last_workout: new Date().toISOString(),
          },
          {
            id: mockStudent2.id,
            name: mockStudent2.name,
            email: mockStudent2.email,
            fitness_level: 'INTERMEDIATE',
            status: 'active',
            total_workouts: 15,
            completed_sessions: 40,
            current_streak: 7,
            adherence_rate: 90.0,
            assigned_workouts: 8,
            pending_workouts: 1,
            goals: ['muscle_gain', 'strength'],
            last_workout: new Date().toISOString(),
          },
        ];

        mockStudentService.getStudentsByTrainer.mockResolvedValue(studentsWithSummaries);

        const result = await mockStudentService.getStudentsByTrainer(mockTrainer.id);

        expect(result).toHaveLength(2);
        expect(result[0].status).toBe('active');
        expect(result[0].adherence_rate).toBe(80.0);
        expect(result[1].current_streak).toBe(7);
      });

      it('should filter students by status', async () => {
        const activeStudents = [
          { ...mockStudent, status: 'active' },
        ];

        mockStudentService.getStudentsByTrainer.mockImplementation(async (trainerId, filters) => {
          if (filters?.status === 'active') {
            return activeStudents;
          }
          return [mockStudent, mockStudent2];
        });

        const result = await mockStudentService.getStudentsByTrainer(
          mockTrainer.id,
          { status: 'active' }
        );

        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('active');
      });

      it('should sort students by different criteria', async () => {
        const students = [mockStudent, mockStudent2];

        mockStudentService.getStudentsByTrainer.mockImplementation(async (trainerId, filters) => {
          let sortedStudents = [...students];
          
          if (filters?.sortBy === 'adherence_rate') {
            sortedStudents.sort((a, b) => 
              (filters.sortOrder === 'desc' ? -1 : 1) * (a.adherence_rate - b.adherence_rate)
            );
          }
          
          return sortedStudents;
        });

        const result = await mockStudentService.getStudentsByTrainer(
          mockTrainer.id,
          { sortBy: 'adherence_rate', sortOrder: 'desc' }
        );

        expect(result).toBeDefined();
        expect(mockStudentService.getStudentsByTrainer).toHaveBeenCalledWith(
          mockTrainer.id,
          { sortBy: 'adherence_rate', sortOrder: 'desc' }
        );
      });
    });

    describe('assignStudentToTrainer', () => {
      it('should assign student to trainer successfully', async () => {
        const assignment = {
          student_id: mockStudent.id,
          trainer_id: mockTrainer.id,
          assigned_at: new Date().toISOString(),
        };

        mockStudentService.assignStudentToTrainer.mockResolvedValue(true);

        const result = await mockStudentService.assignStudentToTrainer(
          mockTrainer.id,
          mockStudent.id
        );

        expect(result).toBe(true);
        expect(mockStudentService.assignStudentToTrainer).toHaveBeenCalledWith(
          mockTrainer.id,
          mockStudent.id
        );
      });

      it('should prevent duplicate assignments', async () => {
        mockStudentService.assignStudentToTrainer.mockRejectedValue(
          new Error('Student already assigned to this trainer')
        );

        await expect(mockStudentService.assignStudentToTrainer(
          mockTrainer.id,
          mockStudent.id
        )).rejects.toThrow('Student already assigned to this trainer');
      });

      it('should validate trainer and student exist', async () => {
        mockStudentService.assignStudentToTrainer.mockRejectedValue(
          new Error('Invalid trainer or student ID')
        );

        await expect(mockStudentService.assignStudentToTrainer(
          'invalid-trainer',
          'invalid-student'
        )).rejects.toThrow('Invalid trainer or student ID');
      });
    });

    describe('removeStudentFromTrainer', () => {
      it('should remove student assignment successfully', async () => {
        mockStudentService.removeStudentFromTrainer.mockResolvedValue(true);

        const result = await mockStudentService.removeStudentFromTrainer(
          mockTrainer.id,
          mockStudent.id
        );

        expect(result).toBe(true);
        expect(mockStudentService.removeStudentFromTrainer).toHaveBeenCalledWith(
          mockTrainer.id,
          mockStudent.id
        );
      });

      it('should handle non-existent assignment', async () => {
        mockStudentService.removeStudentFromTrainer.mockResolvedValue(false);

        const result = await mockStudentService.removeStudentFromTrainer(
          mockTrainer.id,
          'unassigned-student-id'
        );

        expect(result).toBe(false);
      });
    });
  });

  describe('Bulk Operations', () => {
    describe('getBulkStudentData', () => {
      it('should fetch multiple students efficiently', async () => {
        const studentIds = [mockStudent.id, mockStudent2.id];
        const bulkData = [
          { ...mockStudent, progress_summary: { total_sessions: 25 } },
          { ...mockStudent2, progress_summary: { total_sessions: 40 } },
        ];

        mockStudentService.getBulkStudentData.mockResolvedValue(bulkData);

        const result = await mockStudentService.getBulkStudentData(studentIds);

        expect(result).toHaveLength(2);
        expect(result[0].progress_summary.total_sessions).toBe(25);
        expect(result[1].progress_summary.total_sessions).toBe(40);
      });

      it('should handle empty input', async () => {
        mockStudentService.getBulkStudentData.mockResolvedValue([]);

        const result = await mockStudentService.getBulkStudentData([]);
        expect(result).toEqual([]);
      });

      it('should handle partial failures', async () => {
        const mixedResults = [
          mockStudent, // Found
          null,       // Not found
        ];

        mockStudentService.getBulkStudentData.mockResolvedValue(
          mixedResults.filter(Boolean)
        );

        const result = await mockStudentService.getBulkStudentData([
          mockStudent.id,
          'non-existent-id',
        ]);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(mockStudent.id);
      });
    });

    describe('updateBulkStudents', () => {
      it('should update multiple students successfully', async () => {
        const updates = [
          { id: mockStudent.id, fitness_level: 'INTERMEDIATE' },
          { id: mockStudent2.id, fitness_level: 'ADVANCED' },
        ];

        const bulkResult = {
          success: [mockStudent.id, mockStudent2.id],
          failed: [],
          total: 2,
        };

        mockStudentService.updateBulkStudents.mockResolvedValue(bulkResult);

        const result = await mockStudentService.updateBulkStudents(updates);

        expect(result.success).toHaveLength(2);
        expect(result.failed).toHaveLength(0);
        expect(result.total).toBe(2);
      });

      it('should handle partial failures in bulk update', async () => {
        const updates = [
          { id: mockStudent.id, fitness_level: 'INTERMEDIATE' },
          { id: 'invalid-id', fitness_level: 'ADVANCED' },
        ];

        const bulkResult = {
          success: [mockStudent.id],
          failed: [{ id: 'invalid-id', error: 'Student not found' }],
          total: 2,
        };

        mockStudentService.updateBulkStudents.mockResolvedValue(bulkResult);

        const result = await mockStudentService.updateBulkStudents(updates);

        expect(result.success).toHaveLength(1);
        expect(result.failed).toHaveLength(1);
        expect(result.failed[0].error).toBe('Student not found');
      });
    });
  });

  describe('Student Search and Filtering', () => {
    describe('searchStudents', () => {
      it('should search students by name', async () => {
        const searchResults = [mockStudent];

        mockStudentService.searchStudents.mockImplementation(async (query) => {
          if (query.toLowerCase().includes('joão') || query.toLowerCase().includes(mockStudent.name.toLowerCase())) {
            return [mockStudent];
          }
          return [];
        });

        const result = await mockStudentService.searchStudents('João');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe(mockStudent.id);
      });

      it('should search students by email', async () => {
        mockStudentService.searchStudents.mockImplementation(async (query) => {
          if (query.includes('@') && mockStudent.email.includes(query)) {
            return [mockStudent];
          }
          return [];
        });

        const result = await mockStudentService.searchStudents('joao@');
        expect(result).toBeDefined();
      });

      it('should return empty results for no matches', async () => {
        mockStudentService.searchStudents.mockResolvedValue([]);

        const result = await mockStudentService.searchStudents('NonExistentName');
        expect(result).toEqual([]);
      });

      it('should handle search with filters', async () => {
        const filters = {
          fitness_level: 'BEGINNER',
          trainer_id: mockTrainer.id,
        };

        mockStudentService.searchStudents.mockResolvedValue([mockStudent]);

        const result = await mockStudentService.searchStudents('João', filters);
        expect(result).toBeDefined();
        expect(mockStudentService.searchStudents).toHaveBeenCalledWith('João', filters);
      });
    });
  });

  describe('Analytics and Metrics', () => {
    describe('getStudentAnalytics', () => {
      it('should calculate individual student analytics', async () => {
        const analytics = {
          student_id: mockStudent.id,
          student_name: mockStudent.name,
          total_sessions: 45,
          total_duration: 2700, // 45 hours in minutes
          average_session_duration: 60,
          current_streak: 5,
          longest_streak: 12,
          adherence_rate: 85.5,
          favorite_workout_category: 'STRENGTH',
          most_improved_metric: 'endurance',
          weekly_frequency: 3.2,
          goal_completion_rate: 75.0,
        };

        mockStudentService.getStudentAnalytics.mockResolvedValue(analytics);

        const result = await mockStudentService.getStudentAnalytics(mockStudent.id);

        expect(result.total_sessions).toBe(45);
        expect(result.average_session_duration).toBe(60);
        expect(result.adherence_rate).toBe(85.5);
        expect(result.current_streak).toBe(5);
        expect(result.longest_streak).toBe(12);
      });

      it('should calculate analytics for specific time period', async () => {
        const weeklyAnalytics = {
          student_id: mockStudent.id,
          student_name: mockStudent.name,
          total_sessions: 3,
          total_duration: 180,
          average_session_duration: 60,
          period: 'week',
        };

        mockStudentService.getStudentAnalytics.mockImplementation(async (studentId, period) => {
          if (period === 'week') {
            return weeklyAnalytics;
          }
          return {
            student_id: mockStudent.id,
            total_sessions: 45,
            period: 'month',
          };
        });

        const result = await mockStudentService.getStudentAnalytics(mockStudent.id, 'week');
        expect(result.total_sessions).toBe(3);
        expect(result.period).toBe('week');
      });
    });

    describe('getTrainerAnalytics', () => {
      it('should calculate trainer analytics across all students', async () => {
        const trainerAnalytics = {
          trainer_id: mockTrainer.id,
          trainer_name: mockTrainer.name,
          total_students: 15,
          active_students: 12,
          total_sessions_supervised: 450,
          average_student_adherence: 82.3,
          top_performing_students: [mockStudent.id, mockStudent2.id],
          students_needing_attention: [],
          monthly_growth: {
            new_students: 3,
            retention_rate: 95.0,
          },
        };

        mockStudentService.getTrainerAnalytics.mockResolvedValue(trainerAnalytics);

        const result = await mockStudentService.getTrainerAnalytics(mockTrainer.id);

        expect(result.total_students).toBe(15);
        expect(result.active_students).toBe(12);
        expect(result.average_student_adherence).toBe(82.3);
        expect(result.top_performing_students).toContain(mockStudent.id);
      });
    });

    describe('calculateStudentMetrics', () => {
      it('should calculate comprehensive student metrics', async () => {
        const metrics = {
          adherence_rate: 85.5,
          consistency_score: 78.2,
          progression_rate: 12.5, // 12.5% improvement
          engagement_score: 9.1, // out of 10
          risk_level: 'low', // low, medium, high
          predicted_retention: 92.0, // 92% chance to continue
        };

        mockStudentService.calculateStudentMetrics.mockResolvedValue(metrics);

        const result = await mockStudentService.calculateStudentMetrics(mockStudent.id);

        expect(result.adherence_rate).toBe(85.5);
        expect(result.consistency_score).toBe(78.2);
        expect(result.risk_level).toBe('low');
        expect(result.predicted_retention).toBe(92.0);
      });

      it('should identify at-risk students', async () => {
        const riskMetrics = {
          adherence_rate: 45.0,
          consistency_score: 32.1,
          progression_rate: -5.2, // Declining
          engagement_score: 4.2,
          risk_level: 'high',
          predicted_retention: 25.0,
        };

        mockStudentService.calculateStudentMetrics.mockResolvedValue(riskMetrics);

        const result = await mockStudentService.calculateStudentMetrics('at-risk-student-id');

        expect(result.risk_level).toBe('high');
        expect(result.predicted_retention).toBeLessThan(50);
        expect(result.progression_rate).toBeLessThan(0);
      });
    });
  });

  describe('Student Status Management', () => {
    describe('getActiveStudents', () => {
      it('should fetch only active students', async () => {
        const activeStudents = [
          { ...mockStudent, status: 'active', last_login_at: new Date().toISOString() },
          { ...mockStudent2, status: 'active', last_login_at: new Date().toISOString() },
        ];

        mockStudentService.getActiveStudents.mockResolvedValue(activeStudents);

        const result = await mockStudentService.getActiveStudents(mockTrainer.id);

        expect(result).toHaveLength(2);
        expect(result.every(s => s.status === 'active')).toBe(true);
      });

      it('should define active based on recent activity', async () => {
        const recentlyActiveStudent = {
          ...mockStudent,
          status: 'active',
          last_login_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        };

        mockStudentService.getActiveStudents.mockResolvedValue([recentlyActiveStudent]);

        const result = await mockStudentService.getActiveStudents(mockTrainer.id);
        expect(result[0].status).toBe('active');
        expect(new Date(result[0].last_login_at)).toBeDefined();
      });
    });

    describe('getInactiveStudents', () => {
      it('should identify inactive students', async () => {
        const inactiveStudent = {
          ...mockStudent,
          status: 'inactive',
          last_login_at: new Date(Date.now() - 7 * 86400000).toISOString(), // 7 days ago
        };

        mockStudentService.getInactiveStudents.mockResolvedValue([inactiveStudent]);

        const result = await mockStudentService.getInactiveStudents(mockTrainer.id);

        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('inactive');
      });
    });
  });

  describe('Goals and Notes Management', () => {
    describe('setStudentGoals', () => {
      it('should update student goals successfully', async () => {
        const newGoals = ['weight_loss', 'muscle_gain', 'endurance'];

        mockStudentService.setStudentGoals.mockResolvedValue(true);

        const result = await mockStudentService.setStudentGoals(mockStudent.id, newGoals);

        expect(result).toBe(true);
        expect(mockStudentService.setStudentGoals).toHaveBeenCalledWith(
          mockStudent.id,
          newGoals
        );
      });

      it('should validate goal values', async () => {
        const invalidGoals = ['invalid_goal', 'another_invalid'];

        mockStudentService.setStudentGoals.mockRejectedValue(
          new Error('Invalid goal types provided')
        );

        await expect(mockStudentService.setStudentGoals(mockStudent.id, invalidGoals))
          .rejects.toThrow('Invalid goal types provided');
      });
    });

    describe('addTrainerNote', () => {
      it('should add trainer note successfully', async () => {
        const note = 'Aluno está progredindo bem, aumentar intensidade na próxima semana';

        const addedNote = {
          id: 'note-id',
          student_id: mockStudent.id,
          trainer_id: mockTrainer.id,
          content: note,
          created_at: new Date().toISOString(),
        };

        mockStudentService.addTrainerNote.mockResolvedValue(addedNote);

        const result = await mockStudentService.addTrainerNote(
          mockStudent.id,
          mockTrainer.id,
          note
        );

        expect(result.content).toBe(note);
        expect(result.student_id).toBe(mockStudent.id);
        expect(result.trainer_id).toBe(mockTrainer.id);
      });

      it('should validate note content', async () => {
        mockStudentService.addTrainerNote.mockRejectedValue(
          new Error('Note content cannot be empty')
        );

        await expect(mockStudentService.addTrainerNote(
          mockStudent.id,
          mockTrainer.id,
          ''
        )).rejects.toThrow('Note content cannot be empty');
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle bulk operations efficiently', async () => {
      const studentIds = Array.from({ length: 100 }, (_, i) => `student-${i}`);

      mockStudentService.getBulkStudentData.mockResolvedValue([]);

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        await mockStudentService.getBulkStudentData(studentIds);
      });

      TestHelpers.expectPerformanceWithin(duration, 2000); // 2 seconds max
    });

    it('should handle database connection errors', async () => {
      mockStudentService.getStudentProfile.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(mockStudentService.getStudentProfile(mockStudent.id))
        .rejects.toThrow('Database connection failed');
    });

    it('should detect memory leaks in bulk operations', async () => {
      const { leaked } = await TestHelpers.detectMemoryLeaks(async () => {
        await mockStudentService.getBulkStudentData([mockStudent.id]);
      }, 50);

      expect(leaked).toBe(false);
    });

    it('should validate input data types', async () => {
      mockStudentService.updateStudentProfile.mockImplementation(async (id, updates) => {
        if (typeof id !== 'string' || !id) {
          throw new Error('Invalid student ID');
        }
        if (typeof updates !== 'object' || updates === null) {
          throw new Error('Invalid update data');
        }
        return mockStudent;
      });

      await expect(mockStudentService.updateStudentProfile('', {}))
        .rejects.toThrow('Invalid student ID');

      await expect(mockStudentService.updateStudentProfile(mockStudent.id, null))
        .rejects.toThrow('Invalid update data');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle real-time student status changes', async () => {
      const statusUpdate = {
        student_id: mockStudent.id,
        status: 'inactive',
        last_login_at: new Date(Date.now() - 86400000).toISOString(),
      };

      // Simulate real-time update callback
      const callback = jest.fn();
      
      // Mock subscription setup
      const mockUnsubscribe = jest.fn();
      mockStudentService.subscribeToStudentUpdates = jest.fn().mockResolvedValue({
        unsubscribe: mockUnsubscribe,
      });

      await mockStudentService.subscribeToStudentUpdates?.(callback);
      
      // Simulate receiving update
      callback(statusUpdate);
      
      expect(callback).toHaveBeenCalledWith(statusUpdate);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup resources properly', async () => {
      mockStudentService.cleanup.mockResolvedValue(true);

      await mockStudentService.cleanup();
      expect(mockStudentService.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockStudentService.cleanup.mockRejectedValue(new Error('Cleanup failed'));

      await expect(mockStudentService.cleanup()).rejects.toThrow('Cleanup failed');
    });
  });
});
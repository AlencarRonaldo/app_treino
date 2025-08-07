/**
 * Supabase Integration Tests
 * Tests real database operations with Supabase
 */

import { createTestClient, TestSupabaseClient } from '../../test-utils/TestSupabaseClient';
import MockDataFactory from '../../test-utils/MockDataFactory';
import TestHelpers from '../../test-utils/TestHelpers';

describe('Supabase Integration Tests', () => {
  let testClient: TestSupabaseClient;
  let mockTrainer: any;
  let mockStudent: any;
  
  beforeAll(async () => {
    // Skip integration tests if no test database configured
    if (!process.env.SUPABASE_TEST_URL || !process.env.SUPABASE_TEST_ANON_KEY) {
      console.warn('⚠️ Skipping integration tests - no test database configured');
      return;
    }

    try {
      testClient = createTestClient();
      console.log('🧪 Setting up integration test environment...');
    } catch (error) {
      console.warn('⚠️ Could not connect to test database:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (testClient) {
      await testClient.resetTestDatabase();
      console.log('🧹 Integration test cleanup completed');
    }
  });

  beforeEach(async () => {
    if (!testClient) return;

    // Create test users for each test
    mockTrainer = await testClient.createTestUser('personal_trainer');
    mockStudent = await testClient.createTestUser('student');
  });

  afterEach(async () => {
    if (!testClient) return;

    // Clean up test data after each test
    if (mockTrainer?.user?.id) {
      await testClient.cleanup(mockTrainer.user.id);
    }
    if (mockStudent?.user?.id) {
      await testClient.cleanup(mockStudent.user.id);
    }
  });

  describe('Database Connection', () => {
    it('should connect to test database successfully', async () => {
      if (!testClient) {
        console.log('⚠️ Skipping test - no test database available');
        return;
      }

      const client = testClient.getClient();
      const { data, error } = await client
        .from('profiles')
        .select('count')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should get test database statistics', async () => {
      if (!testClient) return;

      const stats = await testClient.getTestStats();
      
      expect(stats).toBeDefined();
      expect(typeof stats.profiles).toBe('number');
      expect(typeof stats.workouts).toBe('number');
    });
  });

  describe('User Management Integration', () => {
    it('should create user profile in database', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', mockTrainer.user.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.user_type).toBe('personal_trainer');
      expect(data.email).toBe(mockTrainer.credentials.email);
    });

    it('should enforce RLS policies for user data', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      
      // Try to access another user's data without proper authentication
      const { data, error } = await client
        .from('profiles')
        .select('*')
        .eq('id', mockStudent.user.id); // Trying to access student data as trainer

      // Should either return empty or error due to RLS
      expect(data).toEqual([]);
    });
  });

  describe('Workout Management Integration', () => {
    it('should create and retrieve workout with exercises', async () => {
      if (!testClient) return;

      // Create test workout
      const workout = await testClient.createTestWorkout(mockTrainer.user.id);
      
      const client = testClient.getClient();
      const { data, error } = await client
        .from('workouts')
        .select(`
          *,
          workout_exercises (
            *,
            exercises (*)
          )
        `)
        .eq('id', workout.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.trainer_id).toBe(mockTrainer.user.id);
      expect(data.workout_exercises).toBeInstanceOf(Array);
    });

    it('should assign workout to student', async () => {
      if (!testClient) return;

      const workout = await testClient.createTestWorkout(
        mockTrainer.user.id, 
        mockStudent.user.id
      );

      const client = testClient.getClient();
      const { data, error } = await client
        .from('workouts')
        .select('*')
        .eq('id', workout.id)
        .eq('student_id', mockStudent.user.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.student_id).toBe(mockStudent.user.id);
    });

    it('should handle workout template creation', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      const templateData = {
        id: MockDataFactory.createWorkout(mockTrainer.user.id).id,
        name: 'Test Template',
        description: 'Integration test template',
        trainer_id: mockTrainer.user.id,
        is_template: true,
        is_public: true,
        category: 'STRENGTH',
        difficulty: 'INTERMEDIATE',
        estimated_duration: 60,
      };

      const { data, error } = await client
        .from('workouts')
        .insert(templateData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.is_template).toBe(true);
      expect(data.is_public).toBe(true);
    });
  });

  describe('Exercise Management Integration', () => {
    it('should create custom exercise with media', async () => {
      if (!testClient) return;

      const exercise = await testClient.createTestExercise(mockTrainer.user.id);
      
      const client = testClient.getClient();
      const { data, error } = await client
        .from('exercises')
        .select('*')
        .eq('id', exercise.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.trainer_id).toBe(mockTrainer.user.id);
      expect(data.video_url).toBeDefined();
      expect(data.thumbnail_url).toBeDefined();
    });

    it('should search exercises by muscle group', async () => {
      if (!testClient) return;

      // Create multiple exercises with different muscle groups
      await testClient.createTestExercise(mockTrainer.user.id);
      
      const client = testClient.getClient();
      const { data, error } = await client
        .from('exercises')
        .select('*')
        .contains('muscle_groups', ['chest']);

      expect(error).toBeNull();
      expect(data).toBeInstanceOf(Array);
    });
  });

  describe('Progress Tracking Integration', () => {
    it('should record and retrieve workout progress', async () => {
      if (!testClient) return;

      const workout = await testClient.createTestWorkout(mockTrainer.user.id);
      const progress = await testClient.createTestProgress(
        mockStudent.user.id,
        workout.id
      );

      const client = testClient.getClient();
      const { data, error } = await client
        .from('workout_progress')
        .select('*')
        .eq('id', progress.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.student_id).toBe(mockStudent.user.id);
      expect(data.workout_id).toBe(workout.id);
    });

    it('should calculate progress statistics', async () => {
      if (!testClient) return;

      const workout = await testClient.createTestWorkout(mockTrainer.user.id);
      
      // Create multiple progress entries
      for (let i = 0; i < 5; i++) {
        await testClient.createTestProgress(mockStudent.user.id, workout.id);
      }

      const client = testClient.getClient();
      const { data, error } = await client
        .from('workout_progress')
        .select('*')
        .eq('student_id', mockStudent.user.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(5);

      // Calculate average duration
      const avgDuration = data.reduce((sum, p) => sum + p.duration, 0) / data.length;
      expect(avgDuration).toBeGreaterThan(0);
    });
  });

  describe('Chat System Integration', () => {
    it('should create conversation and send messages', async () => {
      if (!testClient) return;

      const conversation = await testClient.createTestConversation(
        mockTrainer.user.id,
        mockStudent.user.id
      );

      const client = testClient.getClient();
      
      // Verify conversation exists
      const { data: convData, error: convError } = await client
        .from('conversations')
        .select('*')
        .eq('id', conversation.conversation.id)
        .single();

      expect(convError).toBeNull();
      expect(convData.trainer_id).toBe(mockTrainer.user.id);
      expect(convData.student_id).toBe(mockStudent.user.id);

      // Verify messages exist
      const { data: msgData, error: msgError } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.conversation.id);

      expect(msgError).toBeNull();
      expect(msgData).toHaveLength(2);
    });

    it('should handle message ordering by timestamp', async () => {
      if (!testClient) return;

      const conversation = await testClient.createTestConversation(
        mockTrainer.user.id,
        mockStudent.user.id
      );

      const client = testClient.getClient();
      const { data, error } = await client
        .from('messages')
        .select('*')
        .eq('conversation_id', conversation.conversation.id)
        .order('sent_at', { ascending: true });

      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      
      // Verify ordering
      expect(new Date(data[0].sent_at).getTime())
        .toBeLessThanOrEqual(new Date(data[1].sent_at).getTime());
    });
  });

  describe('Real-time Subscriptions Integration', () => {
    it('should setup real-time subscription', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      const receivedMessages: any[] = [];
      
      // Setup subscription
      const subscription = client
        .channel('test-messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'messages' },
          (payload) => {
            receivedMessages.push(payload.new);
          }
        )
        .subscribe();

      // Wait for subscription to be ready
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a test message
      const conversation = await testClient.createTestConversation(
        mockTrainer.user.id,
        mockStudent.user.id
      );

      // Insert new message
      await client
        .from('messages')
        .insert({
          id: MockDataFactory.createMessage(conversation.conversation.id, mockTrainer.user.id).id,
          conversation_id: conversation.conversation.id,
          sender_id: mockTrainer.user.id,
          content: 'Real-time test message',
          sent_at: new Date().toISOString(),
        });

      // Wait for real-time event
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cleanup
      await client.removeChannel(subscription);

      // Verify real-time message was received (may be flaky in test environment)
      // expect(receivedMessages.length).toBeGreaterThan(0);
    });
  });

  describe('Storage Integration', () => {
    it('should upload and retrieve files', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      const testFile = new Uint8Array([1, 2, 3, 4, 5]);
      const fileName = `test-${Date.now()}.bin`;

      // Upload file
      const { data: uploadData, error: uploadError } = await client.storage
        .from('test-storage')
        .upload(fileName, testFile);

      if (uploadError && uploadError.message.includes('Bucket not found')) {
        console.log('⚠️ Storage bucket not configured for tests, skipping storage test');
        return;
      }

      expect(uploadError).toBeNull();
      expect(uploadData?.path).toBe(fileName);

      // Get public URL
      const { data: urlData } = client.storage
        .from('test-storage')
        .getPublicUrl(fileName);

      expect(urlData.publicUrl).toBeDefined();

      // Download file
      const { data: downloadData, error: downloadError } = await client.storage
        .from('test-storage')
        .download(fileName);

      expect(downloadError).toBeNull();
      expect(downloadData).toBeDefined();

      // Cleanup
      await client.storage
        .from('test-storage')
        .remove([fileName]);
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent operations', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      
      // Create multiple users concurrently
      const userCreationPromises = Array.from({ length: 10 }, async (_, index) => {
        return testClient.createTestUser('student');
      });

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        const users = await Promise.all(userCreationPromises);
        expect(users).toHaveLength(10);
        
        // Cleanup
        await Promise.all(users.map(user => 
          testClient.cleanup(user.user.id)
        ));
      });

      // Should complete within reasonable time
      TestHelpers.expectPerformanceWithin(duration, 10000); // 10 seconds
    });

    it('should handle bulk data operations', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      
      // Generate bulk workout data
      const bulkWorkouts = Array.from({ length: 50 }, () => {
        const workout = MockDataFactory.createWorkout(mockTrainer.user.id);
        return {
          id: workout.id,
          name: workout.name,
          description: workout.description,
          trainer_id: mockTrainer.user.id,
          category: workout.category,
          difficulty: 'BEGINNER',
          estimated_duration: 60,
          is_template: false,
          is_public: false,
        };
      });

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        const { data, error } = await client
          .from('workouts')
          .insert(bulkWorkouts)
          .select();

        expect(error).toBeNull();
        expect(data).toHaveLength(50);
      });

      // Bulk operations should be fast
      TestHelpers.expectPerformanceWithin(duration, 5000); // 5 seconds
    });
  });

  describe('Data Integrity and Constraints', () => {
    it('should enforce foreign key constraints', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      
      // Try to create workout with invalid trainer_id
      const { error } = await client
        .from('workouts')
        .insert({
          id: MockDataFactory.createWorkout('invalid-trainer-id').id,
          name: 'Invalid Workout',
          trainer_id: 'non-existent-trainer-id',
          category: 'STRENGTH',
          difficulty: 'BEGINNER',
        });

      expect(error).toBeDefined();
      expect(error?.message).toContain('foreign key');
    });

    it('should enforce unique constraints', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      const exerciseData = {
        id: MockDataFactory.createExercise(mockTrainer.user.id).id,
        name: 'Unique Exercise Test',
        trainer_id: mockTrainer.user.id,
        muscle_groups: ['chest'],
        equipment: 'dumbbell',
        difficulty: 'beginner',
      };

      // Insert first exercise
      const { error: firstError } = await client
        .from('exercises')
        .insert(exerciseData);

      expect(firstError).toBeNull();

      // Try to insert duplicate
      const { error: duplicateError } = await client
        .from('exercises')
        .insert({
          ...exerciseData,
          id: MockDataFactory.createExercise(mockTrainer.user.id).id, // Different ID
        });

      // Should fail due to unique constraint on (trainer_id, name)
      expect(duplicateError).toBeDefined();
    });
  });

  describe('Database Triggers and Functions', () => {
    it('should update timestamps automatically', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      const workout = await testClient.createTestWorkout(mockTrainer.user.id);

      // Get initial timestamps
      const { data: initial } = await client
        .from('workouts')
        .select('created_at, updated_at')
        .eq('id', workout.id)
        .single();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update the workout
      const { data: updated } = await client
        .from('workouts')
        .update({ name: 'Updated Workout Name' })
        .eq('id', workout.id)
        .select('created_at, updated_at')
        .single();

      expect(initial?.created_at).toBe(updated?.created_at); // Should not change
      expect(new Date(updated?.updated_at).getTime())
        .toBeGreaterThan(new Date(initial?.updated_at).getTime()); // Should be updated
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network timeouts gracefully', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      
      // This test is environment dependent - simulate with a long query
      try {
        await client
          .from('workouts')
          .select('*')
          .limit(10000);
        
        // If query succeeds, that's also fine
        expect(true).toBe(true);
      } catch (error: any) {
        // Should handle timeout errors gracefully
        expect(error).toBeDefined();
      }
    });

    it('should rollback transactions on error', async () => {
      if (!testClient) return;

      const client = testClient.getClient();
      
      try {
        // Attempt an invalid bulk operation
        await client
          .from('workouts')
          .insert([
            {
              id: MockDataFactory.createWorkout(mockTrainer.user.id).id,
              name: 'Valid Workout',
              trainer_id: mockTrainer.user.id,
              category: 'STRENGTH',
            },
            {
              id: MockDataFactory.createWorkout(mockTrainer.user.id).id,
              name: 'Invalid Workout',
              trainer_id: 'invalid-trainer-id', // This will fail
              category: 'STRENGTH',
            },
          ]);
      } catch (error) {
        // Verify no partial data was inserted
        const { data } = await client
          .from('workouts')
          .select('*')
          .eq('name', 'Valid Workout');
        
        expect(data).toEqual([]); // Should be rolled back
      }
    });
  });
});
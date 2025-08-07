/**
 * Database Load and Performance Tests
 * Tests system behavior under various load conditions
 */

import { TestSupabaseClient } from '../../test-utils/TestSupabaseClient';
import { PerformanceProfiler } from '../../test-utils/PerformanceProfiler';
import MockDataFactory from '../../test-utils/MockDataFactory';

describe('Database Performance Tests', () => {
  let testClient: TestSupabaseClient;
  let profiler: PerformanceProfiler;
  let testUsers: any[] = [];

  beforeAll(async () => {
    testClient = new TestSupabaseClient({
      url: process.env.SUPABASE_TEST_URL || 'https://localhost:54321',
      key: process.env.SUPABASE_TEST_ANON_KEY || 'test-key',
    });
    
    profiler = new PerformanceProfiler();

    // Create test users for load testing
    for (let i = 0; i < 10; i++) {
      const user = await testClient.createTestUser(i % 2 === 0 ? 'personal_trainer' : 'student');
      testUsers.push(user);
    }
  });

  afterAll(async () => {
    for (const user of testUsers) {
      await testClient.cleanup(user.user?.id);
    }
  });

  describe('Query Performance', () => {
    it('should handle large dataset queries efficiently', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Create large dataset
      const workouts = [];
      for (let i = 0; i < 1000; i++) {
        workouts.push({
          id: MockDataFactory.generateId(),
          name: `Workout ${i}`,
          trainer_id: trainer.user?.id,
          category: ['STRENGTH', 'CARDIO', 'FLEXIBILITY'][i % 3],
          difficulty: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'][i % 3],
          estimated_duration: 30 + (i % 90),
        });
      }

      // Batch insert
      const insertStart = profiler.mark('batch_insert_start');
      const { error: insertError } = await testClient
        .getClient()
        .from('workouts')
        .insert(workouts);
      
      const insertDuration = profiler.measure('batch_insert', insertStart);
      
      expect(insertError).toBeNull();
      expect(insertDuration).toBeLessThan(10000); // 10 seconds max

      // Query with filters
      const queryStart = profiler.mark('filtered_query_start');
      const { data, error } = await testClient
        .getClient()
        .from('workouts')
        .select('*')
        .eq('trainer_id', trainer.user?.id)
        .eq('category', 'STRENGTH')
        .gte('estimated_duration', 60)
        .order('name')
        .limit(50);

      const queryDuration = profiler.measure('filtered_query', queryStart);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(1000); // 1 second max
    });

    it('should handle complex joins efficiently', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      const student = testUsers.find(u => u.profile.user_type === 'student');
      
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Create test data with relationships
      const workout = await testClient.createTestWorkout(trainer.user?.id, student.user?.id);
      const exercise = await testClient.createTestExercise(trainer.user?.id);

      // Add exercises to workout
      await testClient.getClient().from('workout_exercises').insert({
        workout_id: workout.id,
        exercise_id: exercise.id,
        order_index: 1,
        sets: 3,
        reps: '12',
        rest_time: 60,
      });

      // Complex query with multiple joins
      const queryStart = profiler.mark('complex_join_start');
      const { data, error } = await testClient
        .getClient()
        .from('workouts')
        .select(`
          *,
          workout_exercises(
            *,
            exercises(*)
          ),
          profiles!trainer_id(name),
          profiles!student_id(name)
        `)
        .eq('trainer_id', trainer.user?.id)
        .limit(10);

      const queryDuration = profiler.measure('complex_join', queryStart);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThan(0);
      expect(queryDuration).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle aggregation queries efficiently', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Create workout sessions for statistics
      const sessions = [];
      for (let i = 0; i < 100; i++) {
        sessions.push({
          id: MockDataFactory.generateId(),
          student_id: testUsers[1].user?.id, // Use second user as student
          workout_id: MockDataFactory.generateId(),
          start_time: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          duration: 3600 + (i % 1800), // 1-1.5 hours
          status: 'completed',
          rating: 3 + (i % 3),
        });
      }

      await testClient.getClient().from('workout_sessions').insert(sessions);

      // Aggregation query
      const queryStart = profiler.mark('aggregation_start');
      
      // Calculate monthly statistics
      const { data, error } = await testClient
        .getClient()
        .from('workout_sessions')
        .select(`
          extract(month from start_time) as month,
          count(*) as session_count,
          avg(duration) as avg_duration,
          avg(rating) as avg_rating
        `)
        .eq('student_id', testUsers[1].user?.id)
        .gte('start_time', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
        .order('month');

      const queryDuration = profiler.measure('aggregation', queryStart);

      expect(error).toBeNull();
      expect(queryDuration).toBeLessThan(3000); // 3 seconds max
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent reads efficiently', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');

      // Create multiple concurrent read operations
      const concurrentReads = Array.from({ length: 50 }, () => {
        return testClient.getClient().auth.signInWithPassword(trainer.credentials)
          .then(() => testClient.getClient()
            .from('workouts')
            .select('*')
            .eq('trainer_id', trainer.user?.id)
            .limit(10)
          );
      });

      const startTime = profiler.mark('concurrent_reads_start');
      const results = await Promise.all(concurrentReads);
      const duration = profiler.measure('concurrent_reads', startTime);

      // All reads should succeed
      results.forEach(({ error }) => {
        expect(error).toBeNull();
      });

      expect(duration).toBeLessThan(15000); // 15 seconds max for 50 concurrent reads
    });

    it('should handle concurrent writes with proper isolation', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Create concurrent write operations
      const concurrentWrites = Array.from({ length: 20 }, (_, i) => {
        const workoutData = {
          id: MockDataFactory.generateId(),
          name: `Concurrent Workout ${i}`,
          trainer_id: trainer.user?.id,
          category: 'STRENGTH',
          estimated_duration: 45,
        };

        return testClient.getClient()
          .from('workouts')
          .insert(workoutData)
          .select()
          .single();
      });

      const startTime = profiler.mark('concurrent_writes_start');
      const results = await Promise.allSettled(concurrentWrites);
      const duration = profiler.measure('concurrent_writes', startTime);

      // Count successful writes
      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(15); // At least 75% success rate
      expect(duration).toBeLessThan(10000); // 10 seconds max
    });

    it('should handle mixed read/write operations', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Mix of read and write operations
      const operations = [];

      // Add 30 read operations
      for (let i = 0; i < 30; i++) {
        operations.push(
          testClient.getClient()
            .from('workouts')
            .select('*')
            .eq('trainer_id', trainer.user?.id)
            .limit(5)
        );
      }

      // Add 10 write operations
      for (let i = 0; i < 10; i++) {
        const workoutData = {
          id: MockDataFactory.generateId(),
          name: `Mixed Operation Workout ${i}`,
          trainer_id: trainer.user?.id,
          category: 'CARDIO',
        };

        operations.push(
          testClient.getClient()
            .from('workouts')
            .insert(workoutData)
        );
      }

      // Shuffle operations to simulate real-world usage
      const shuffledOps = operations.sort(() => Math.random() - 0.5);

      const startTime = profiler.mark('mixed_ops_start');
      const results = await Promise.allSettled(shuffledOps);
      const duration = profiler.measure('mixed_ops', startTime);

      const successful = results.filter(r => r.status === 'fulfilled').length;
      
      expect(successful).toBeGreaterThan(35); // At least 87% success rate
      expect(duration).toBeLessThan(12000); // 12 seconds max
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should not create memory leaks during repeated operations', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      for (let batch = 0; batch < 10; batch++) {
        const operations = Array.from({ length: 100 }, () =>
          testClient.getClient()
            .from('workouts')
            .select('id, name')
            .eq('trainer_id', trainer.user?.id)
            .limit(1)
        );

        await Promise.all(operations);

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle large result sets efficiently', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Query large result set with streaming
      const startTime = profiler.mark('large_result_start');
      
      let totalRecords = 0;
      let page = 0;
      const pageSize = 100;

      do {
        const { data, error } = await testClient
          .getClient()
          .from('workouts')
          .select('*')
          .eq('trainer_id', trainer.user?.id)
          .range(page * pageSize, (page + 1) * pageSize - 1);

        expect(error).toBeNull();
        
        if (data && data.length > 0) {
          totalRecords += data.length;
          page++;
        } else {
          break;
        }
      } while (totalRecords < 1000); // Process up to 1000 records

      const duration = profiler.measure('large_result', startTime);
      
      expect(duration).toBeLessThan(20000); // 20 seconds max
      expect(totalRecords).toBeGreaterThan(0);
    });
  });

  describe('Network Performance', () => {
    it('should handle network latency gracefully', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');

      // Simulate network delays with timeout
      const slowOperation = async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        try {
          await testClient.getClient().auth.signInWithPassword(trainer.credentials);
          
          const { data, error } = await testClient
            .getClient()
            .from('workouts')
            .select('*')
            .eq('trainer_id', trainer.user?.id)
            .limit(10)
            .abortSignal(controller.signal);

          clearTimeout(timeoutId);
          return { data, error };
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      const startTime = profiler.mark('network_latency_start');
      
      let successCount = 0;
      const operations = Array.from({ length: 10 }, () =>
        slowOperation().then(result => {
          successCount++;
          return result;
        }).catch(error => {
          console.warn('Network operation failed:', error.message);
          return { data: null, error };
        })
      );

      await Promise.all(operations);
      const duration = profiler.measure('network_latency', startTime);

      // Should handle at least 70% of operations successfully
      expect(successCount).toBeGreaterThanOrEqual(7);
      expect(duration).toBeLessThan(60000); // 1 minute max
    });
  });

  describe('Real-time Performance', () => {
    it('should handle multiple concurrent subscriptions', async () => {
      const trainer = testUsers.find(u => u.profile.user_type === 'personal_trainer');
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      const subscriptions = [];
      const messagesCounts = Array.from({ length: 10 }, () => 0);

      // Create 10 concurrent subscriptions
      for (let i = 0; i < 10; i++) {
        const channel = testClient.getClient().channel(`test-channel-${i}`);
        
        channel
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'workouts',
          }, () => {
            messagesCounts[i]++;
          })
          .subscribe();

        subscriptions.push(channel);
      }

      // Simulate data changes
      const startTime = profiler.mark('realtime_subs_start');
      
      for (let i = 0; i < 5; i++) {
        await testClient.getClient()
          .from('workouts')
          .insert({
            id: MockDataFactory.generateId(),
            name: `Realtime Test Workout ${i}`,
            trainer_id: trainer.user?.id,
          });

        // Small delay between inserts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Wait for real-time events to propagate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const duration = profiler.measure('realtime_subs', startTime);

      // Cleanup subscriptions
      for (const channel of subscriptions) {
        await channel.unsubscribe();
      }

      expect(duration).toBeLessThan(10000); // 10 seconds max
      
      // At least some subscriptions should receive messages
      const totalMessages = messagesCounts.reduce((sum, count) => sum + count, 0);
      expect(totalMessages).toBeGreaterThan(0);
    });
  });
});
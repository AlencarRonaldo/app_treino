/**
 * Test Supabase Client
 * Provides dedicated test database client and utilities
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export interface TestSupabaseConfig {
  url: string;
  key: string;
  schema?: string;
}

export class TestSupabaseClient {
  private client: SupabaseClient;
  private testSchema: string;

  constructor(config: TestSupabaseConfig) {
    this.client = createClient(config.url, config.key);
    this.testSchema = config.schema || 'test';
  }

  /**
   * Get the Supabase client instance
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Create a test user with random credentials
   */
  async createTestUser(userType: 'personal_trainer' | 'student' = 'student') {
    const testId = uuidv4();
    const email = `test+${testId}@treinosapp.com`;
    const password = 'TestPassword123!';

    const { data: authData, error: authError } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_type: userType,
          name: `Test User ${testId.slice(0, 8)}`,
        },
      },
    });

    if (authError) throw authError;

    // Create profile
    const { data: profileData, error: profileError } = await this.client
      .from('profiles')
      .insert({
        id: authData.user?.id,
        email,
        name: `Test User ${testId.slice(0, 8)}`,
        user_type: userType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) throw profileError;

    return {
      user: authData.user,
      profile: profileData,
      credentials: { email, password },
    };
  }

  /**
   * Create test workout data
   */
  async createTestWorkout(trainerId: string, studentId?: string) {
    const workoutId = uuidv4();
    
    const workoutData = {
      id: workoutId,
      name: `Test Workout ${workoutId.slice(0, 8)}`,
      description: 'Test workout description',
      trainer_id: trainerId,
      student_id: studentId,
      exercises: [
        {
          id: uuidv4(),
          name: 'Test Exercise 1',
          sets: 3,
          reps: 10,
          weight: 50,
          rest_time: 60,
        },
        {
          id: uuidv4(),
          name: 'Test Exercise 2',
          sets: 3,
          reps: 12,
          weight: 30,
          rest_time: 45,
        },
      ],
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('workouts')
      .insert(workoutData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create test exercise data
   */
  async createTestExercise(trainerId: string) {
    const exerciseId = uuidv4();
    
    const exerciseData = {
      id: exerciseId,
      name: `Test Exercise ${exerciseId.slice(0, 8)}`,
      description: 'Test exercise description',
      muscle_groups: ['chest', 'triceps'],
      equipment: 'dumbbell',
      difficulty_level: 'beginner',
      trainer_id: trainerId,
      video_url: 'https://example.com/video.mp4',
      thumbnail_url: 'https://example.com/thumb.jpg',
      created_at: new Date().toISOString(),
    };

    const { data, error } = await this.client
      .from('exercises')
      .insert(exerciseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create test progress data
   */
  async createTestProgress(studentId: string, workoutId: string) {
    const progressData = {
      id: uuidv4(),
      student_id: studentId,
      workout_id: workoutId,
      completed_at: new Date().toISOString(),
      duration: 3600, // 1 hour
      exercises_completed: 2,
      total_exercises: 2,
      notes: 'Test workout completed successfully',
    };

    const { data, error } = await this.client
      .from('workout_progress')
      .insert(progressData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create test chat conversation
   */
  async createTestConversation(trainerId: string, studentId: string) {
    const conversationId = uuidv4();
    
    const conversationData = {
      id: conversationId,
      trainer_id: trainerId,
      student_id: studentId,
      created_at: new Date().toISOString(),
    };

    const { data: conversation, error: convError } = await this.client
      .from('conversations')
      .insert(conversationData)
      .select()
      .single();

    if (convError) throw convError;

    // Add test messages
    const messages = [
      {
        id: uuidv4(),
        conversation_id: conversationId,
        sender_id: trainerId,
        content: 'Hello! How was your workout today?',
        sent_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        conversation_id: conversationId,
        sender_id: studentId,
        content: 'Great! Completed all exercises.',
        sent_at: new Date(Date.now() + 60000).toISOString(),
      },
    ];

    const { data: messageData, error: msgError } = await this.client
      .from('messages')
      .insert(messages)
      .select();

    if (msgError) throw msgError;

    return { conversation, messages: messageData };
  }

  /**
   * Clean up test data
   */
  async cleanup(userId?: string) {
    const tables = [
      'workout_progress',
      'messages',
      'conversations',
      'exercises',
      'workouts',
      'profiles',
    ];

    for (const table of tables) {
      if (userId) {
        // Clean specific user's data
        const userFields = {
          profiles: 'id',
          workouts: 'trainer_id',
          exercises: 'trainer_id',
          workout_progress: 'student_id',
          conversations: 'trainer_id',
          messages: 'sender_id',
        };

        const field = userFields[table as keyof typeof userFields];
        if (field) {
          await this.client.from(table).delete().eq(field, userId);
        }
      } else {
        // Clean all test data (be careful!)
        await this.client
          .from(table)
          .delete()
          .like('name', 'Test %');
      }
    }

    // Clean auth users if needed
    if (userId) {
      await this.client.auth.admin.deleteUser(userId);
    }
  }

  /**
   * Get test database statistics
   */
  async getTestStats() {
    const stats: Record<string, number> = {};
    const tables = ['profiles', 'workouts', 'exercises', 'workout_progress', 'conversations', 'messages'];

    for (const table of tables) {
      const { count } = await this.client
        .from(table)
        .select('*', { count: 'exact', head: true });
      stats[table] = count || 0;
    }

    return stats;
  }

  /**
   * Reset test database to clean state
   */
  async resetTestDatabase() {
    await this.cleanup();
    console.log('Test database reset completed');
  }
}

// Default test client factory
export const createTestClient = (config?: Partial<TestSupabaseConfig>): TestSupabaseClient => {
  const defaultConfig: TestSupabaseConfig = {
    url: process.env.SUPABASE_TEST_URL || 'https://localhost:54321',
    key: process.env.SUPABASE_TEST_ANON_KEY || 'test-key',
    schema: 'test',
  };

  return new TestSupabaseClient({ ...defaultConfig, ...config });
};

export default TestSupabaseClient;
/**
 * Row Level Security (RLS) Policy Tests
 * Validates data isolation and access control
 */

import { TestSupabaseClient } from '../../test-utils/TestSupabaseClient';
import MockDataFactory from '../../test-utils/MockDataFactory';

describe('RLS Security Policies', () => {
  let testClient: TestSupabaseClient;
  let trainer1: any;
  let trainer2: any;
  let student1: any;
  let student2: any;

  beforeAll(async () => {
    testClient = new TestSupabaseClient({
      url: process.env.SUPABASE_TEST_URL || 'https://localhost:54321',
      key: process.env.SUPABASE_TEST_ANON_KEY || 'test-key',
    });

    // Create test users
    trainer1 = await testClient.createTestUser('personal_trainer');
    trainer2 = await testClient.createTestUser('personal_trainer');
    student1 = await testClient.createTestUser('student');
    student2 = await testClient.createTestUser('student');

    // Connect students to trainers
    await testClient.getClient().from('trainer_students').insert([
      { trainer_id: trainer1.user?.id, student_id: student1.user?.id, status: 'approved' },
      { trainer_id: trainer2.user?.id, student_id: student2.user?.id, status: 'approved' },
    ]);
  });

  afterAll(async () => {
    await testClient.cleanup(trainer1.user?.id);
    await testClient.cleanup(trainer2.user?.id);
    await testClient.cleanup(student1.user?.id);
    await testClient.cleanup(student2.user?.id);
  });

  describe('Profile Access Control', () => {
    it('should prevent users from accessing other users profiles', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Try to access trainer2's profile
      const { data, error } = await testClient
        .getClient()
        .from('profiles')
        .select('*')
        .eq('id', trainer2.user?.id);

      // Should either return empty array or specific error
      expect(data).toEqual([]);
    });

    it('should allow users to access their own profile', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Access own profile
      const { data, error } = await testClient
        .getClient()
        .from('profiles')
        .select('*')
        .eq('id', trainer1.user?.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(trainer1.user?.id);
    });

    it('should allow trainers to access their students profiles', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Access student1's profile (connected student)
      const { data, error } = await testClient
        .getClient()
        .from('profiles')
        .select(`
          *,
          trainer_students!student_id(trainer_id)
        `)
        .eq('id', student1.user?.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  describe('Workout Access Control', () => {
    it('should prevent unauthorized workout access', async () => {
      // Create workout as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);
      const workout = await testClient.createTestWorkout(trainer1.user?.id);

      // Sign in as trainer2
      await testClient.getClient().auth.signInWithPassword(trainer2.credentials);

      // Try to access trainer1's workout
      const { data, error } = await testClient
        .getClient()
        .from('workouts')
        .select('*')
        .eq('id', workout.id);

      expect(data).toEqual([]);
    });

    it('should allow trainers to access their own workouts', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Access own workouts
      const { data, error } = await testClient
        .getClient()
        .from('workouts')
        .select('*')
        .eq('trainer_id', trainer1.user?.id);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(0);
    });

    it('should allow students to access assigned workouts', async () => {
      // Create and assign workout as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);
      const workout = await testClient.createTestWorkout(trainer1.user?.id, student1.user?.id);

      // Sign in as student1
      await testClient.getClient().auth.signInWithPassword(student1.credentials);

      // Access assigned workout
      const { data, error } = await testClient
        .getClient()
        .from('workouts')
        .select('*')
        .eq('id', workout.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(workout.id);
    });
  });

  describe('Exercise Access Control', () => {
    it('should prevent unauthorized exercise modification', async () => {
      // Create exercise as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);
      const exercise = await testClient.createTestExercise(trainer1.user?.id);

      // Sign in as trainer2
      await testClient.getClient().auth.signInWithPassword(trainer2.credentials);

      // Try to modify trainer1's exercise
      const { data, error } = await testClient
        .getClient()
        .from('exercises')
        .update({ name: 'Hacked Exercise' })
        .eq('id', exercise.id);

      expect(error).toBeTruthy();
    });

    it('should allow public exercise access', async () => {
      // Create public exercise as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);
      
      const publicExercise = {
        id: MockDataFactory.generateId(),
        name: 'Public Exercise',
        trainer_id: trainer1.user?.id,
        is_public: true,
      };

      await testClient.getClient().from('exercises').insert(publicExercise);

      // Sign in as trainer2
      await testClient.getClient().auth.signInWithPassword(trainer2.credentials);

      // Access public exercise
      const { data, error } = await testClient
        .getClient()
        .from('exercises')
        .select('*')
        .eq('id', publicExercise.id)
        .eq('is_public', true);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  describe('Progress Tracking Access Control', () => {
    it('should prevent cross-student progress access', async () => {
      // Create progress for student1
      await testClient.getClient().auth.signInWithPassword(student1.credentials);
      const workout = await testClient.createTestWorkout(trainer1.user?.id, student1.user?.id);
      const progress = await testClient.createTestProgress(student1.user?.id, workout.id);

      // Sign in as student2
      await testClient.getClient().auth.signInWithPassword(student2.credentials);

      // Try to access student1's progress
      const { data, error } = await testClient
        .getClient()
        .from('workout_progress')
        .select('*')
        .eq('id', progress.id);

      expect(data).toEqual([]);
    });

    it('should allow trainers to access their students progress', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Access student1's progress
      const { data, error } = await testClient
        .getClient()
        .from('workout_progress')
        .select(`
          *,
          profiles!student_id(*)
        `)
        .eq('student_id', student1.user?.id);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Chat Security', () => {
    it('should prevent unauthorized chat access', async () => {
      // Create conversation between trainer1 and student1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);
      const conversation = await testClient.createTestConversation(trainer1.user?.id, student1.user?.id);

      // Sign in as trainer2
      await testClient.getClient().auth.signInWithPassword(trainer2.credentials);

      // Try to access conversation
      const { data, error } = await testClient
        .getClient()
        .from('conversations')
        .select('*')
        .eq('id', conversation.conversation.id);

      expect(data).toEqual([]);
    });

    it('should allow participants to access their conversations', async () => {
      // Sign in as student1
      await testClient.getClient().auth.signInWithPassword(student1.credentials);

      // Access conversations where student1 is participant
      const { data, error } = await testClient
        .getClient()
        .from('conversations')
        .select('*')
        .eq('student_id', student1.user?.id);

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(0);
    });

    it('should prevent message modification by non-senders', async () => {
      // Create conversation and message
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);
      const conversation = await testClient.createTestConversation(trainer1.user?.id, student1.user?.id);
      const messageId = conversation.messages[0].id;

      // Sign in as student1
      await testClient.getClient().auth.signInWithPassword(student1.credentials);

      // Try to modify trainer's message
      const { data, error } = await testClient
        .getClient()
        .from('messages')
        .update({ content: 'Hacked message' })
        .eq('id', messageId);

      expect(error).toBeTruthy();
    });
  });

  describe('Admin Level Security', () => {
    it('should prevent privilege escalation', async () => {
      // Sign in as student
      await testClient.getClient().auth.signInWithPassword(student1.credentials);

      // Try to access system tables (should fail)
      const systemTables = ['auth.users', 'auth.sessions', 'storage.objects'];

      for (const table of systemTables) {
        try {
          const { data, error } = await testClient
            .getClient()
            .from(table)
            .select('*')
            .limit(1);

          // Should either error or return empty
          expect(error || data?.length === 0).toBeTruthy();
        } catch (e) {
          // Expected to fail
          expect(e).toBeTruthy();
        }
      }
    });

    it('should prevent SQL injection attempts', async () => {
      // Sign in as student
      await testClient.getClient().auth.signInWithPassword(student1.credentials);

      // Try various SQL injection patterns
      const maliciousInputs = [
        "'; DROP TABLE profiles; --",
        "1' OR '1'='1",
        "admin'/**/OR/**/1=1#",
        "' UNION SELECT * FROM auth.users --",
      ];

      for (const input of maliciousInputs) {
        const { data, error } = await testClient
          .getClient()
          .from('profiles')
          .select('*')
          .eq('name', input);

        // Should not return unauthorized data
        expect(data).toEqual([]);
      }
    });
  });

  describe('Storage Security', () => {
    it('should prevent unauthorized file access', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Try to access storage without proper authentication
      const { data, error } = await testClient
        .getClient()
        .storage
        .from('exercise-videos')
        .list('private/trainer2', { limit: 100 });

      // Should not be able to list other trainer's private files
      expect(error || data?.length === 0).toBeTruthy();
    });

    it('should allow access to own storage bucket', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Access own storage
      const { data, error } = await testClient
        .getClient()
        .storage
        .from('exercise-videos')
        .list(`private/${trainer1.user?.id}`, { limit: 100 });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should prevent file overwrite attacks', async () => {
      // Sign in as trainer1
      await testClient.getClient().auth.signInWithPassword(trainer1.credentials);

      // Try to upload to another user's directory
      const fakeFile = new Blob(['malicious content'], { type: 'text/plain' });
      
      const { data, error } = await testClient
        .getClient()
        .storage
        .from('exercise-videos')
        .upload(`private/${trainer2.user?.id}/hacked.txt`, fakeFile);

      expect(error).toBeTruthy();
    });
  });
});
/**
 * End-to-End Workout Flow Tests
 * Tests complete workout management workflows
 */

import { TestSupabaseClient } from '../../test-utils/TestSupabaseClient';
import MockDataFactory from '../../test-utils/MockDataFactory';
import TestHelpers from '../../test-utils/TestHelpers';

describe('Workout Management E2E Flow', () => {
  let testClient: TestSupabaseClient;
  let trainer: any;
  let student: any;

  beforeAll(async () => {
    testClient = new TestSupabaseClient({
      url: process.env.SUPABASE_TEST_URL || 'https://localhost:54321',
      key: process.env.SUPABASE_TEST_ANON_KEY || 'test-key',
    });

    // Create test users
    trainer = await testClient.createTestUser('personal_trainer');
    student = await testClient.createTestUser('student');

    // Connect trainer and student
    await testClient.getClient().from('trainer_students').insert({
      trainer_id: trainer.user?.id,
      student_id: student.user?.id,
      status: 'approved',
    });
  });

  afterAll(async () => {
    if (trainer) await testClient.cleanup(trainer.user?.id);
    if (student) await testClient.cleanup(student.user?.id);
  });

  describe('Personal Trainer Workflow', () => {
    it('should complete full workout creation and assignment workflow', async () => {
      // Sign in as trainer
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Step 1: Create custom exercise
      const exerciseData = {
        id: MockDataFactory.generateId(),
        name: 'Supino Reto com Halteres',
        description: 'Exercício para peitoral maior e tríceps',
        muscle_groups: ['chest', 'triceps'],
        equipment: 'dumbbells',
        difficulty_level: 'intermediate',
        trainer_id: trainer.user?.id,
        video_url: 'https://example.com/supino-video.mp4',
        thumbnail_url: 'https://example.com/supino-thumb.jpg',
      };

      const { data: exerciseResult, error: exerciseError } = await testClient
        .getClient()
        .from('exercises')
        .insert(exerciseData)
        .select()
        .single();

      expect(exerciseError).toBeNull();
      expect(exerciseResult.name).toBe('Supino Reto com Halteres');

      // Step 2: Create workout plan
      const workoutData = {
        id: MockDataFactory.generateId(),
        name: 'Treino de Peito - Iniciante',
        description: 'Treino focado no desenvolvimento do peitoral',
        category: 'STRENGTH',
        difficulty: 'BEGINNER',
        estimated_duration: 45,
        trainer_id: trainer.user?.id,
        is_template: true,
        is_public: false,
      };

      const { data: workoutResult, error: workoutError } = await testClient
        .getClient()
        .from('workouts')
        .insert(workoutData)
        .select()
        .single();

      expect(workoutError).toBeNull();
      expect(workoutResult.name).toBe('Treino de Peito - Iniciante');

      // Step 3: Add exercises to workout
      const workoutExercises = [
        {
          workout_id: workoutResult.id,
          exercise_id: exerciseResult.id,
          order_index: 1,
          sets: 3,
          reps: '12-15',
          weight: null,
          rest_time: 90,
          notes: 'Manter controle total do movimento',
        },
      ];

      const { data: exerciseAssignments, error: assignmentError } = await testClient
        .getClient()
        .from('workout_exercises')
        .insert(workoutExercises)
        .select();

      expect(assignmentError).toBeNull();
      expect(exerciseAssignments).toHaveLength(1);

      // Step 4: Assign workout to student
      const assignmentData = {
        workout_id: workoutResult.id,
        student_id: student.user?.id,
        trainer_id: trainer.user?.id,
        assigned_date: new Date().toISOString(),
        target_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week
        status: 'assigned',
        notes: 'Foque na execução correta antes de aumentar a carga',
      };

      const { data: assignment, error: assignError } = await testClient
        .getClient()
        .from('workout_assignments')
        .insert(assignmentData)
        .select()
        .single();

      expect(assignError).toBeNull();
      expect(assignment.status).toBe('assigned');

      // Step 5: Verify trainer can view student assignments
      const { data: assignments, error: viewError } = await testClient
        .getClient()
        .from('workout_assignments')
        .select(`
          *,
          workouts(*),
          profiles!student_id(name)
        `)
        .eq('trainer_id', trainer.user?.id);

      expect(viewError).toBeNull();
      expect(assignments).toHaveLength(1);
      expect(assignments![0].workouts.name).toBe('Treino de Peito - Iniciante');
    });
  });

  describe('Student Workflow', () => {
    it('should complete full workout execution workflow', async () => {
      // Sign in as student
      await testClient.getClient().auth.signInWithPassword(student.credentials);

      // Step 1: View assigned workouts
      const { data: assignments, error: viewError } = await testClient
        .getClient()
        .from('workout_assignments')
        .select(`
          *,
          workouts(*, workout_exercises(*))
        `)
        .eq('student_id', student.user?.id)
        .eq('status', 'assigned');

      expect(viewError).toBeNull();
      expect(assignments).toHaveLength(1);

      const workoutAssignment = assignments![0];
      const workout = workoutAssignment.workouts;

      // Step 2: Start workout session
      const sessionData = {
        id: MockDataFactory.generateId(),
        workout_id: workout.id,
        student_id: student.user?.id,
        start_time: new Date().toISOString(),
        status: 'in_progress',
      };

      const { data: sessionResult, error: sessionError } = await testClient
        .getClient()
        .from('workout_sessions')
        .insert(sessionData)
        .select()
        .single();

      expect(sessionError).toBeNull();
      expect(sessionResult.status).toBe('in_progress');

      // Step 3: Record exercise performance
      const exercisePerformance = {
        session_id: sessionResult.id,
        exercise_id: workout.workout_exercises[0].exercise_id,
        set_number: 1,
        reps: 12,
        weight: 20,
        rest_time: 90,
        completed_at: new Date().toISOString(),
      };

      const { data: performanceResult, error: performanceError } = await testClient
        .getClient()
        .from('exercise_performance')
        .insert(exercisePerformance)
        .select()
        .single();

      expect(performanceError).toBeNull();
      expect(performanceResult.reps).toBe(12);

      // Step 4: Complete workout session
      const endTime = new Date();
      const startTime = new Date(sessionResult.start_time);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const { data: completedSession, error: completeError } = await testClient
        .getClient()
        .from('workout_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration,
          status: 'completed',
          rating: 4,
          notes: 'Treino executado com sucesso!',
        })
        .eq('id', sessionResult.id)
        .select()
        .single();

      expect(completeError).toBeNull();
      expect(completedSession.status).toBe('completed');
      expect(completedSession.rating).toBe(4);

      // Step 5: Update workout assignment status
      const { data: updatedAssignment, error: updateError } = await testClient
        .getClient()
        .from('workout_assignments')
        .update({
          status: 'completed',
          completed_date: endTime.toISOString(),
        })
        .eq('id', workoutAssignment.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedAssignment.status).toBe('completed');

      // Step 6: Verify progress tracking
      const { data: progressData, error: progressError } = await testClient
        .getClient()
        .from('progress_tracking')
        .insert({
          student_id: student.user?.id,
          date: new Date().toISOString().split('T')[0],
          workout_sessions: 1,
          total_exercises: 1,
          total_duration: duration,
          avg_rating: 4,
        })
        .select()
        .single();

      expect(progressError).toBeNull();
      expect(progressData.workout_sessions).toBe(1);
    });

    it('should handle workout modifications and feedback', async () => {
      // Sign in as student
      await testClient.getClient().auth.signInWithPassword(student.credentials);

      // Create a workout session first
      const workout = await testClient.createTestWorkout(trainer.user?.id, student.user?.id);
      
      const sessionData = {
        id: MockDataFactory.generateId(),
        workout_id: workout.id,
        student_id: student.user?.id,
        start_time: new Date().toISOString(),
        status: 'completed',
        end_time: new Date().toISOString(),
        duration: 2700, // 45 minutes
        rating: 3,
        notes: 'Exercício difícil, preciso reduzir a carga',
      };

      const { data: session, error: sessionError } = await testClient
        .getClient()
        .from('workout_sessions')
        .insert(sessionData)
        .select()
        .single();

      expect(sessionError).toBeNull();

      // Student provides feedback
      const feedbackData = {
        session_id: session.id,
        student_id: student.user?.id,
        trainer_id: trainer.user?.id,
        feedback_type: 'difficulty',
        message: 'O peso estava muito alto para mim. Consegui fazer apenas 8 repetições em vez de 12.',
        rating: 2,
      };

      const { data: feedback, error: feedbackError } = await testClient
        .getClient()
        .from('workout_feedback')
        .insert(feedbackData)
        .select()
        .single();

      expect(feedbackError).toBeNull();
      expect(feedback.feedback_type).toBe('difficulty');

      // Trainer can view and respond to feedback
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      const { data: feedbackList, error: viewFeedbackError } = await testClient
        .getClient()
        .from('workout_feedback')
        .select(`
          *,
          profiles!student_id(name)
        `)
        .eq('trainer_id', trainer.user?.id);

      expect(viewFeedbackError).toBeNull();
      expect(feedbackList).toHaveLength(1);
    });
  });

  describe('Real-time Workout Sync', () => {
    it('should sync workout updates in real-time', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue('OK'),
        unsubscribe: jest.fn().mockResolvedValue('OK'),
      };

      // Mock real-time subscription
      testClient.getClient().channel = jest.fn().mockReturnValue(mockChannel);

      // Sign in as trainer
      await testClient.getClient().auth.signInWithPassword(trainer.credentials);

      // Subscribe to workout changes
      const channel = testClient.getClient().channel('workout-changes');
      
      let receivedUpdate: any = null;
      channel
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'workouts',
        }, (payload) => {
          receivedUpdate = payload;
        })
        .subscribe();

      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();

      // Simulate real-time update
      const mockPayload = {
        eventType: 'UPDATE',
        new: { id: 'workout-123', name: 'Updated Workout' },
        old: { id: 'workout-123', name: 'Original Workout' },
      };

      // Trigger callback manually (in real app, this comes from Supabase)
      const callback = mockChannel.on.mock.calls[0][1];
      callback(mockPayload);

      expect(receivedUpdate).toEqual(mockPayload);
    });
  });

  describe('Performance Analytics', () => {
    it('should generate workout analytics', async () => {
      // Sign in as student
      await testClient.getClient().auth.signInWithPassword(student.credentials);

      // Create multiple workout sessions for analytics
      const sessions = [];
      for (let i = 0; i < 5; i++) {
        const workout = await testClient.createTestWorkout(trainer.user?.id, student.user?.id);
        
        const sessionData = {
          id: MockDataFactory.generateId(),
          workout_id: workout.id,
          student_id: student.user?.id,
          start_time: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          end_time: new Date(Date.now() - (i * 24 * 60 * 60 * 1000) + 3600000).toISOString(),
          duration: 3600 + (i * 300), // Varying durations
          status: 'completed',
          rating: 3 + (i % 3), // Ratings 3-5
        };

        const { data: session, error } = await testClient
          .getClient()
          .from('workout_sessions')
          .insert(sessionData)
          .select()
          .single();

        expect(error).toBeNull();
        sessions.push(session);
      }

      // Generate analytics
      const { data: analytics, error: analyticsError } = await testClient
        .getClient()
        .from('workout_sessions')
        .select('duration, rating, start_time')
        .eq('student_id', student.user?.id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false });

      expect(analyticsError).toBeNull();
      expect(analytics).toHaveLength(5);

      // Calculate stats
      const totalDuration = analytics!.reduce((sum, session) => sum + session.duration, 0);
      const avgRating = analytics!.reduce((sum, session) => sum + session.rating, 0) / analytics!.length;

      expect(totalDuration).toBeGreaterThan(18000); // At least 5 hours total
      expect(avgRating).toBeGreaterThanOrEqual(3);
      expect(avgRating).toBeLessThanOrEqual(5);
    });
  });
});
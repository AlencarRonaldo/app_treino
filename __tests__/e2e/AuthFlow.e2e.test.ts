/**
 * End-to-End Authentication Flow Tests
 * Tests complete user authentication workflows
 */

import { TestSupabaseClient } from '../../test-utils/TestSupabaseClient';
import MockDataFactory from '../../test-utils/MockDataFactory';
import TestHelpers from '../../test-utils/TestHelpers';

describe('Authentication E2E Flow', () => {
  let testClient: TestSupabaseClient;
  let testUser: any;

  beforeAll(async () => {
    testClient = new TestSupabaseClient({
      url: process.env.SUPABASE_TEST_URL || 'https://localhost:54321',
      key: process.env.SUPABASE_TEST_ANON_KEY || 'test-key',
    });
  });

  afterAll(async () => {
    if (testUser) {
      await testClient.cleanup(testUser.user.id);
    }
  });

  describe('Personal Trainer Registration Flow', () => {
    it('should complete full PT registration workflow', async () => {
      const email = `pt+${Date.now()}@treinosapp.com`;
      const password = 'SecurePassword123!';
      const name = 'João Silva';

      // Step 1: User signup
      const { data: signUpData, error: signUpError } = await testClient
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: 'personal_trainer',
              name,
            },
          },
        });

      expect(signUpError).toBeNull();
      expect(signUpData.user).toBeTruthy();
      expect(signUpData.user?.email).toBe(email);

      testUser = signUpData;

      // Step 2: Profile creation
      const { data: profileData, error: profileError } = await testClient
        .getClient()
        .from('profiles')
        .insert({
          id: signUpData.user?.id,
          email,
          name,
          user_type: 'personal_trainer',
          phone: '+5511999999999',
          bio: 'Personal Trainer experiente',
          certification: 'CREF 123456',
        })
        .select()
        .single();

      expect(profileError).toBeNull();
      expect(profileData.user_type).toBe('personal_trainer');
      expect(profileData.certification).toBe('CREF 123456');

      // Step 3: Login verification
      const { data: signInData, error: signInError } = await testClient
        .getClient()
        .auth.signInWithPassword({
          email,
          password,
        });

      expect(signInError).toBeNull();
      expect(signInData.user?.id).toBe(signUpData.user?.id);

      // Step 4: Session verification
      const { data: sessionData, error: sessionError } = await testClient
        .getClient()
        .auth.getSession();

      expect(sessionError).toBeNull();
      expect(sessionData.session?.user.id).toBe(signUpData.user?.id);

      // Step 5: Profile completion
      const { data: updatedProfile, error: updateError } = await testClient
        .getClient()
        .from('profiles')
        .update({
          completed_at: new Date().toISOString(),
          onboarding_completed: true,
        })
        .eq('id', signUpData.user?.id)
        .select()
        .single();

      expect(updateError).toBeNull();
      expect(updatedProfile.onboarding_completed).toBe(true);
    });
  });

  describe('Student Registration Flow', () => {
    it('should complete full student registration workflow', async () => {
      const email = `student+${Date.now()}@treinosapp.com`;
      const password = 'SecurePassword123!';
      const name = 'Maria Santos';

      // Step 1: Student signup
      const { data: signUpData, error: signUpError } = await testClient
        .getClient()
        .auth.signUp({
          email,
          password,
          options: {
            data: {
              user_type: 'student',
              name,
            },
          },
        });

      expect(signUpError).toBeNull();
      expect(signUpData.user).toBeTruthy();

      // Step 2: Profile creation with fitness goals
      const { data: profileData, error: profileError } = await testClient
        .getClient()
        .from('profiles')
        .insert({
          id: signUpData.user?.id,
          email,
          name,
          user_type: 'student',
          age: 25,
          height: 165,
          weight: 60,
          fitness_goals: ['weight_loss', 'muscle_gain'],
          activity_level: 'moderate',
        })
        .select()
        .single();

      expect(profileError).toBeNull();
      expect(profileData.user_type).toBe('student');
      expect(profileData.fitness_goals).toContain('weight_loss');

      // Step 3: Connect to trainer
      const trainerResult = await testClient.createTestUser('personal_trainer');
      
      const { data: connectionData, error: connectionError } = await testClient
        .getClient()
        .from('trainer_students')
        .insert({
          trainer_id: trainerResult.user?.id,
          student_id: signUpData.user?.id,
          status: 'pending',
        })
        .select()
        .single();

      expect(connectionError).toBeNull();
      expect(connectionData.status).toBe('pending');

      // Cleanup trainer
      await testClient.cleanup(trainerResult.user?.id);
    });
  });

  describe('Google OAuth Flow', () => {
    it('should handle Google OAuth signup', async () => {
      // Mock Google OAuth response
      const mockGoogleUser = {
        id: 'google-user-123',
        email: `google+${Date.now()}@gmail.com`,
        name: 'Google User',
        picture: 'https://example.com/photo.jpg',
      };

      // This would be handled by the OAuth provider in real implementation
      const { data: oauthData, error: oauthError } = await testClient
        .getClient()
        .auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'exp://localhost:8081',
          },
        });

      // Since we can't test actual OAuth flow, we verify the structure
      expect(oauthError).toBeNull();
      expect(oauthData.url).toBeTruthy();
    });
  });

  describe('Password Reset Flow', () => {
    it('should complete password reset workflow', async () => {
      // Create a user first
      const testUser = await testClient.createTestUser('student');
      const email = testUser.credentials.email;

      // Step 1: Request password reset
      const { data: resetData, error: resetError } = await testClient
        .getClient()
        .auth.resetPasswordForEmail(email, {
          redirectTo: 'exp://localhost:8081/reset-password',
        });

      expect(resetError).toBeNull();

      // Step 2: Verify reset request (in real app, user would click email link)
      // For testing, we simulate the verification process
      
      // Step 3: Update password (would happen after email verification)
      const newPassword = 'NewSecurePassword123!';
      
      // First sign in to get session
      await testClient.getClient().auth.signInWithPassword({
        email,
        password: testUser.credentials.password,
      });

      const { data: updateData, error: updateError } = await testClient
        .getClient()
        .auth.updateUser({ password: newPassword });

      expect(updateError).toBeNull();
      expect(updateData.user).toBeTruthy();

      // Step 4: Verify login with new password
      await testClient.getClient().auth.signOut();
      
      const { data: signInData, error: signInError } = await testClient
        .getClient()
        .auth.signInWithPassword({
          email,
          password: newPassword,
        });

      expect(signInError).toBeNull();
      expect(signInData.user?.email).toBe(email);

      // Cleanup
      await testClient.cleanup(testUser.user?.id);
    });
  });

  describe('Session Management', () => {
    it('should handle session expiration and refresh', async () => {
      const testUser = await testClient.createTestUser('student');
      
      // Sign in
      const { data: signInData, error: signInError } = await testClient
        .getClient()
        .auth.signInWithPassword(testUser.credentials);

      expect(signInError).toBeNull();
      expect(signInData.session?.access_token).toBeTruthy();
      expect(signInData.session?.refresh_token).toBeTruthy();

      const originalSession = signInData.session;

      // Simulate session refresh
      const { data: refreshData, error: refreshError } = await testClient
        .getClient()
        .auth.refreshSession({ refresh_token: originalSession!.refresh_token });

      expect(refreshError).toBeNull();
      expect(refreshData.session?.access_token).toBeTruthy();
      expect(refreshData.session?.access_token).not.toBe(originalSession?.access_token);

      // Cleanup
      await testClient.cleanup(testUser.user?.id);
    });

    it('should handle logout correctly', async () => {
      const testUser = await testClient.createTestUser('student');
      
      // Sign in
      await testClient.getClient().auth.signInWithPassword(testUser.credentials);
      
      // Verify session exists
      const { data: sessionBefore } = await testClient.getClient().auth.getSession();
      expect(sessionBefore.session).toBeTruthy();

      // Sign out
      const { error: signOutError } = await testClient.getClient().auth.signOut();
      expect(signOutError).toBeNull();

      // Verify session is cleared
      const { data: sessionAfter } = await testClient.getClient().auth.getSession();
      expect(sessionAfter.session).toBeNull();

      // Cleanup
      await testClient.cleanup(testUser.user?.id);
    });
  });
});
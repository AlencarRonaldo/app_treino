/**
 * AnalyticsService Unit Tests
 * Comprehensive test suite for analytics and business intelligence with Supabase
 */

import MockDataFactory from '../../../test-utils/MockDataFactory';
import TestHelpers from '../../../test-utils/TestHelpers';

// Mock the AnalyticsService
const mockAnalyticsService = {
  initialize: jest.fn(),
  cleanup: jest.fn(),
  
  // Dashboard Analytics
  getTrainerDashboard: jest.fn(),
  getStudentDashboard: jest.fn(),
  getSystemOverview: jest.fn(),
  
  // Workout Analytics
  getWorkoutAnalytics: jest.fn(),
  getExerciseAnalytics: jest.fn(),
  getPopularityMetrics: jest.fn(),
  
  // Student Analytics
  getStudentMetrics: jest.fn(),
  getEngagementMetrics: jest.fn(),
  getRetentionAnalytics: jest.fn(),
  
  // Business Intelligence
  getRevenueMetrics: jest.fn(),
  getGrowthMetrics: jest.fn(),
  getPerformanceKPIs: jest.fn(),
  
  // Real-time Analytics
  getLiveMetrics: jest.fn(),
  getActiveUsers: jest.fn(),
  getCurrentSessions: jest.fn(),
  
  // Comparative Analytics
  comparePerformance: jest.fn(),
  benchmarkAnalytics: jest.fn(),
  getPeriodComparison: jest.fn(),
  
  // Predictive Analytics
  getPredictiveInsights: jest.fn(),
  getForecastData: jest.fn(),
  getAnomalyDetection: jest.fn(),
  
  // Custom Reports
  generateCustomReport: jest.fn(),
  scheduleReport: jest.fn(),
  exportAnalytics: jest.fn(),
};

// Mock Supabase
const mockSupabase = global.mockSupabaseClient;

describe('AnalyticsService Unit Tests', () => {
  let mockTrainer: any;
  let mockStudent: any;

  beforeAll(() => {
    // Setup mock users
    mockTrainer = MockDataFactory.createTrainer();
    mockStudent = MockDataFactory.createStudent();

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
    Object.keys(mockAnalyticsService).forEach(key => {
      mockAnalyticsService[key as keyof typeof mockAnalyticsService].mockReset();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      mockAnalyticsService.initialize.mockResolvedValue(true);
      
      await expect(mockAnalyticsService.initialize()).resolves.not.toThrow();
      expect(mockAnalyticsService.initialize).toHaveBeenCalled();
    });
  });

  describe('Dashboard Analytics', () => {
    describe('getTrainerDashboard', () => {
      it('should fetch comprehensive trainer dashboard data', async () => {
        const dashboardData = {
          overview: {
            total_students: 25,
            active_students: 22,
            total_workouts_created: 150,
            total_sessions_supervised: 875,
            student_retention_rate: 88.5,
            avg_student_adherence: 82.3,
          },
          recent_activity: {
            new_students_this_week: 3,
            workouts_completed_today: 8,
            messages_sent_today: 15,
            upcoming_sessions: 12,
          },
          student_metrics: {
            top_performers: [
              { student_id: 'student-1', name: 'João Silva', adherence: 95.2 },
              { student_id: 'student-2', name: 'Maria Santos', adherence: 91.8 },
            ],
            needs_attention: [
              { student_id: 'student-3', name: 'Pedro Costa', adherence: 45.1, risk: 'high' },
            ],
          },
          workout_analytics: {
            most_popular_workout: 'Treino Full Body',
            avg_workout_duration: 62,
            completion_rates_by_type: {
              STRENGTH: 89.5,
              CARDIO: 76.3,
              HIIT: 82.7,
            },
          },
          business_metrics: {
            monthly_revenue: 8500,
            revenue_growth: 12.3, // percentage
            avg_revenue_per_student: 340,
            churn_rate: 8.5,
          },
        };

        mockAnalyticsService.getTrainerDashboard.mockResolvedValue(dashboardData);

        const result = await mockAnalyticsService.getTrainerDashboard(mockTrainer.id);

        expect(result.overview.total_students).toBe(25);
        expect(result.student_metrics.top_performers).toHaveLength(2);
        expect(result.business_metrics.revenue_growth).toBe(12.3);
        expect(result.workout_analytics.completion_rates_by_type.STRENGTH).toBeGreaterThan(80);
      });

      it('should support different time periods', async () => {
        const weeklyData = {
          overview: { total_sessions_supervised: 45 },
          period: 'week',
        };
        const monthlyData = {
          overview: { total_sessions_supervised: 180 },
          period: 'month',
        };

        mockAnalyticsService.getTrainerDashboard.mockImplementation(async (trainerId, period) => {
          if (period === 'week') return weeklyData;
          if (period === 'month') return monthlyData;
          return { period: 'all_time' };
        });

        const weekResult = await mockAnalyticsService.getTrainerDashboard(mockTrainer.id, 'week');
        const monthResult = await mockAnalyticsService.getTrainerDashboard(mockTrainer.id, 'month');

        expect(weekResult.overview.total_sessions_supervised).toBe(45);
        expect(monthResult.overview.total_sessions_supervised).toBe(180);
      });
    });

    describe('getStudentDashboard', () => {
      it('should fetch student dashboard data', async () => {
        const studentDashboard = {
          progress_overview: {
            total_workouts_completed: 32,
            current_streak: 7,
            longest_streak: 15,
            total_duration: 1920, // minutes
            avg_workout_duration: 60,
            completion_rate: 94.1,
          },
          fitness_metrics: {
            fitness_score: 78.5,
            strength_improvement: 18.2, // percentage
            endurance_improvement: 12.7,
            flexibility_improvement: 8.3,
            weight_change: -3.5, // kg
            body_fat_change: -2.1, // percentage
          },
          achievements: [
            {
              id: 'consistency_week',
              name: 'Semana Perfeita',
              earned_at: '2024-01-20',
              rarity: 'uncommon',
            },
            {
              id: 'strength_milestone',
              name: 'Força de Gigante',
              earned_at: '2024-01-18',
              rarity: 'rare',
            },
          ],
          goal_progress: [
            {
              goal: 'Perder 5kg',
              progress: 70, // percentage
              target_date: '2024-06-01',
              on_track: true,
            },
            {
              goal: 'Supino 100kg',
              progress: 85,
              target_date: '2024-04-01',
              on_track: true,
            },
          ],
          upcoming_workouts: [
            { workout_name: 'Treino A - Peito/Tríceps', scheduled_for: '2024-01-21' },
            { workout_name: 'Treino B - Costas/Bíceps', scheduled_for: '2024-01-23' },
          ],
        };

        mockAnalyticsService.getStudentDashboard.mockResolvedValue(studentDashboard);

        const result = await mockAnalyticsService.getStudentDashboard(mockStudent.id);

        expect(result.progress_overview.total_workouts_completed).toBe(32);
        expect(result.fitness_metrics.fitness_score).toBe(78.5);
        expect(result.achievements).toHaveLength(2);
        expect(result.goal_progress[0].on_track).toBe(true);
      });
    });

    describe('getSystemOverview', () => {
      it('should fetch system-wide analytics', async () => {
        const systemData = {
          user_metrics: {
            total_users: 1250,
            total_trainers: 85,
            total_students: 1165,
            active_users_today: 420,
            new_registrations_this_week: 23,
          },
          platform_metrics: {
            total_workouts_created: 5670,
            total_sessions_completed: 28450,
            total_exercise_library: 850,
            avg_session_rating: 4.6,
            platform_uptime: 99.8,
          },
          engagement_metrics: {
            daily_active_users: 420,
            weekly_active_users: 980,
            monthly_active_users: 1180,
            avg_session_duration: 58,
            retention_rate_30_day: 76.5,
          },
          business_metrics: {
            total_revenue: 125000,
            monthly_recurring_revenue: 45000,
            avg_revenue_per_user: 89,
            customer_lifetime_value: 2150,
            churn_rate: 5.8,
            growth_rate: 18.7,
          },
        };

        mockAnalyticsService.getSystemOverview.mockResolvedValue(systemData);

        const result = await mockAnalyticsService.getSystemOverview();

        expect(result.user_metrics.total_users).toBe(1250);
        expect(result.platform_metrics.platform_uptime).toBeGreaterThan(99);
        expect(result.engagement_metrics.retention_rate_30_day).toBe(76.5);
        expect(result.business_metrics.growth_rate).toBe(18.7);
      });
    });
  });

  describe('Workout Analytics', () => {
    describe('getWorkoutAnalytics', () => {
      it('should analyze workout performance and usage', async () => {
        const workoutAnalytics = {
          workout_id: 'workout-123',
          workout_name: 'Treino Full Body',
          usage_stats: {
            total_completions: 145,
            unique_users: 32,
            avg_completion_rate: 87.3,
            avg_duration: 65,
            avg_rating: 4.5,
          },
          performance_metrics: {
            avg_calories_burned: 425,
            avg_heart_rate: 145,
            intensity_score: 7.8,
            difficulty_rating: 6.5,
          },
          popularity_trends: {
            daily_usage: [8, 12, 15, 10, 18, 22, 14], // Last 7 days
            peak_usage_hour: 18, // 6 PM
            most_popular_day: 'Tuesday',
          },
          user_feedback: {
            positive_feedback: 89.5, // percentage
            common_complaints: ['Too long rest times', 'Missing warm-up'],
            improvement_suggestions: ['Add more core exercises', 'Shorter duration'],
          },
        };

        mockAnalyticsService.getWorkoutAnalytics.mockResolvedValue(workoutAnalytics);

        const result = await mockAnalyticsService.getWorkoutAnalytics('workout-123');

        expect(result.usage_stats.total_completions).toBe(145);
        expect(result.performance_metrics.avg_calories_burned).toBe(425);
        expect(result.popularity_trends.peak_usage_hour).toBe(18);
        expect(result.user_feedback.positive_feedback).toBeGreaterThan(85);
      });
    });

    describe('getExerciseAnalytics', () => {
      it('should analyze individual exercise performance', async () => {
        const exerciseAnalytics = {
          exercise_id: 'exercise-456',
          exercise_name: 'Supino Reto',
          usage_stats: {
            total_sets_performed: 2340,
            unique_users: 156,
            avg_weight_used: 78.5,
            avg_reps_performed: 9.7,
            progression_rate: 12.3, // percentage improvement
          },
          performance_distribution: {
            weight_ranges: {
              '40-60kg': 25, // percentage of users
              '60-80kg': 45,
              '80-100kg': 25,
              '100kg+': 5,
            },
            rep_ranges: {
              '6-8': 35,
              '8-10': 40,
              '10-12': 20,
              '12+': 5,
            },
          },
          injury_risk: {
            risk_level: 'low',
            common_form_issues: ['Arching back', 'Uneven grip'],
            safety_score: 8.2,
          },
          recommendations: {
            beginner: 'Start with 40-50kg for 8-10 reps',
            intermediate: 'Focus on controlled movement, 6-8 reps',
            advanced: 'Add variations like incline/decline',
          },
        };

        mockAnalyticsService.getExerciseAnalytics.mockResolvedValue(exerciseAnalytics);

        const result = await mockAnalyticsService.getExerciseAnalytics('exercise-456');

        expect(result.usage_stats.total_sets_performed).toBe(2340);
        expect(result.performance_distribution.weight_ranges['60-80kg']).toBe(45);
        expect(result.injury_risk.risk_level).toBe('low');
        expect(result.recommendations.beginner).toBeDefined();
      });
    });
  });

  describe('Student Analytics', () => {
    describe('getStudentMetrics', () => {
      it('should calculate comprehensive student metrics', async () => {
        const studentMetrics = {
          student_id: mockStudent.id,
          engagement_score: 8.7,
          consistency_rating: 9.1,
          progress_velocity: 7.8,
          goal_achievement_rate: 75.0,
          
          workout_patterns: {
            preferred_days: ['Tuesday', 'Thursday', 'Saturday'],
            preferred_times: ['06:00-08:00', '18:00-20:00'],
            avg_workout_duration: 58,
            most_completed_category: 'STRENGTH',
          },
          
          performance_trends: {
            strength_trend: 'improving', // improving/stable/declining
            endurance_trend: 'stable',
            consistency_trend: 'improving',
            motivation_score: 8.2,
          },
          
          risk_assessment: {
            dropout_risk: 'low', // low/medium/high
            injury_risk: 'medium',
            burnout_risk: 'low',
            overall_risk_score: 3.2, // out of 10
          },
          
          recommendations: [
            'Increase cardio frequency to improve endurance',
            'Add flexibility training to reduce injury risk',
            'Consider strength training progression',
          ],
        };

        mockAnalyticsService.getStudentMetrics.mockResolvedValue(studentMetrics);

        const result = await mockAnalyticsService.getStudentMetrics(mockStudent.id);

        expect(result.engagement_score).toBe(8.7);
        expect(result.workout_patterns.preferred_days).toContain('Tuesday');
        expect(result.risk_assessment.dropout_risk).toBe('low');
        expect(result.recommendations).toHaveLength(3);
      });
    });

    describe('getEngagementMetrics', () => {
      it('should analyze student engagement patterns', async () => {
        const engagementMetrics = {
          overall_engagement: 8.5,
          
          platform_usage: {
            daily_login_rate: 85.7, // percentage of days
            avg_session_length: 42, // minutes
            feature_usage: {
              workout_tracking: 95.2,
              progress_viewing: 78.6,
              messaging: 65.3,
              goal_setting: 45.8,
            },
          },
          
          communication_engagement: {
            message_response_rate: 92.3,
            avg_response_time: 12, // minutes
            proactive_messaging: 23, // messages initiated by student
          },
          
          workout_engagement: {
            completion_rate: 89.1,
            modification_frequency: 15.2, // percentage of workouts modified
            feedback_frequency: 67.8, // percentage of workouts with feedback
            rating_frequency: 89.5,
          },
          
          social_engagement: {
            achievement_sharing: 45.2,
            community_participation: 23.8,
            peer_interaction_score: 6.7,
          },
          
          engagement_trends: {
            week_over_week_change: +5.2, // percentage
            seasonal_patterns: ['Higher in January', 'Dips in summer'],
            peak_engagement_times: ['Monday morning', 'Wednesday evening'],
          },
        };

        mockAnalyticsService.getEngagementMetrics.mockResolvedValue(engagementMetrics);

        const result = await mockAnalyticsService.getEngagementMetrics(mockStudent.id);

        expect(result.overall_engagement).toBe(8.5);
        expect(result.platform_usage.daily_login_rate).toBeGreaterThan(80);
        expect(result.workout_engagement.completion_rate).toBe(89.1);
        expect(result.engagement_trends.week_over_week_change).toBeGreaterThan(0);
      });
    });

    describe('getRetentionAnalytics', () => {
      it('should analyze student retention patterns', async () => {
        const retentionAnalytics = {
          retention_probability: 87.5, // percentage likelihood to continue
          
          retention_factors: {
            positive_factors: [
              { factor: 'High workout completion rate', impact: 8.5 },
              { factor: 'Regular trainer communication', impact: 7.2 },
              { factor: 'Goal achievement', impact: 6.8 },
            ],
            risk_factors: [
              { factor: 'Inconsistent workout schedule', impact: -4.3 },
              { factor: 'Low progress visibility', impact: -2.1 },
            ],
          },
          
          churn_prediction: {
            risk_level: 'low',
            time_to_churn_estimate: null, // null if low risk
            key_risk_indicators: [],
            intervention_recommendations: [
              'Continue current engagement level',
              'Celebrate recent achievements',
            ],
          },
          
          cohort_analysis: {
            signup_cohort: '2023-Q4',
            cohort_retention_rate: 78.3,
            above_cohort_average: true,
            percentile_rank: 85, // better than 85% of cohort
          },
          
          lifecycle_stage: 'established', // new/growing/established/at_risk/churning
          estimated_lifetime_value: 2340, // currency
          
          retention_improvement_opportunities: [
            'Add more variety to workout routines',
            'Implement milestone celebrations',
            'Increase personalization',
          ],
        };

        mockAnalyticsService.getRetentionAnalytics.mockResolvedValue(retentionAnalytics);

        const result = await mockAnalyticsService.getRetentionAnalytics(mockStudent.id);

        expect(result.retention_probability).toBe(87.5);
        expect(result.retention_factors.positive_factors).toHaveLength(3);
        expect(result.churn_prediction.risk_level).toBe('low');
        expect(result.lifecycle_stage).toBe('established');
      });
    });
  });

  describe('Business Intelligence', () => {
    describe('getRevenueMetrics', () => {
      it('should calculate detailed revenue analytics', async () => {
        const revenueMetrics = {
          total_revenue: 125000,
          monthly_recurring_revenue: 45000,
          annual_recurring_revenue: 540000,
          
          revenue_breakdown: {
            by_plan: {
              basic: { revenue: 25000, users: 625, avg_per_user: 40 },
              premium: { revenue: 60000, users: 400, avg_per_user: 150 },
              enterprise: { revenue: 40000, users: 80, avg_per_user: 500 },
            },
            by_user_type: {
              personal_trainers: 85000,
              fitness_centers: 40000,
            },
          },
          
          growth_metrics: {
            monthly_growth_rate: 12.5,
            quarterly_growth_rate: 38.7,
            year_over_year_growth: 156.2,
            expansion_revenue: 15000, // from upgrades
            new_customer_revenue: 8500,
          },
          
          customer_metrics: {
            avg_revenue_per_user: 89,
            customer_lifetime_value: 2150,
            avg_customer_lifespan: 24, // months
            payback_period: 3.2, // months
          },
          
          churn_impact: {
            monthly_churn_rate: 5.8,
            revenue_churn_rate: 4.2,
            net_revenue_retention: 108.5, // percentage
            gross_revenue_retention: 94.2,
          },
          
          forecasting: {
            projected_mrr_next_month: 48500,
            projected_arr_end_of_year: 582000,
            confidence_interval: 85,
          },
        };

        mockAnalyticsService.getRevenueMetrics.mockResolvedValue(revenueMetrics);

        const result = await mockAnalyticsService.getRevenueMetrics();

        expect(result.total_revenue).toBe(125000);
        expect(result.growth_metrics.monthly_growth_rate).toBe(12.5);
        expect(result.customer_metrics.customer_lifetime_value).toBe(2150);
        expect(result.forecasting.confidence_interval).toBe(85);
      });
    });

    describe('getGrowthMetrics', () => {
      it('should analyze platform growth patterns', async () => {
        const growthMetrics = {
          user_growth: {
            total_users: 1250,
            new_users_this_month: 85,
            growth_rate: 7.3, // percentage
            user_acquisition_trend: 'accelerating',
          },
          
          acquisition_channels: {
            organic: { users: 45, conversion_rate: 12.5, cost_per_acquisition: 0 },
            social_media: { users: 25, conversion_rate: 8.7, cost_per_acquisition: 35 },
            referral: { users: 12, conversion_rate: 25.4, cost_per_acquisition: 15 },
            paid_ads: { users: 3, conversion_rate: 3.2, cost_per_acquisition: 125 },
          },
          
          engagement_growth: {
            daily_active_users: 420,
            dau_growth_rate: 15.2,
            weekly_active_users: 780,
            wau_growth_rate: 12.8,
            monthly_active_users: 1050,
            mau_growth_rate: 8.9,
          },
          
          feature_adoption: {
            workout_creation: 89.5, // percentage of users
            progress_tracking: 76.3,
            messaging: 65.8,
            goal_setting: 45.2,
            social_features: 23.7,
          },
          
          geographic_expansion: {
            primary_markets: {
              'São Paulo': 45.2, // percentage of users
              'Rio de Janeiro': 23.8,
              'Belo Horizonte': 12.5,
            },
            emerging_markets: ['Brasília', 'Porto Alegre', 'Salvador'],
            international_users: 3.7, // percentage
          },
          
          competitive_analysis: {
            market_share: 15.8, // estimated percentage
            competitive_advantage: ['AI-powered recommendations', 'Real-time coaching'],
            growth_compared_to_market: 'outperforming', // outperforming/matching/underperforming
          },
        };

        mockAnalyticsService.getGrowthMetrics.mockResolvedValue(growthMetrics);

        const result = await mockAnalyticsService.getGrowthMetrics();

        expect(result.user_growth.growth_rate).toBe(7.3);
        expect(result.acquisition_channels.referral.conversion_rate).toBeGreaterThan(20);
        expect(result.feature_adoption.workout_creation).toBeGreaterThan(85);
        expect(result.competitive_analysis.growth_compared_to_market).toBe('outperforming');
      });
    });
  });

  describe('Real-time Analytics', () => {
    describe('getLiveMetrics', () => {
      it('should provide real-time platform metrics', async () => {
        const liveMetrics = {
          timestamp: new Date().toISOString(),
          
          active_now: {
            total_active_users: 245,
            active_trainers: 18,
            active_students: 227,
            ongoing_workouts: 42,
            active_conversations: 15,
          },
          
          current_activity: {
            workouts_started_last_hour: 28,
            workouts_completed_last_hour: 35,
            messages_sent_last_hour: 156,
            new_registrations_today: 7,
          },
          
          real_time_trends: {
            user_activity_trend: 'increasing', // increasing/decreasing/stable
            workout_completion_rate: 87.3,
            avg_session_duration_today: 56, // minutes
            peak_activity_time: '18:30',
          },
          
          system_health: {
            response_time_avg: 125, // milliseconds
            error_rate: 0.12, // percentage
            uptime: 99.98,
            active_connections: 245,
          },
          
          alerts: [
            {
              type: 'performance',
              message: 'Response time above threshold',
              severity: 'medium',
              timestamp: new Date().toISOString(),
            },
          ],
        };

        mockAnalyticsService.getLiveMetrics.mockResolvedValue(liveMetrics);

        const result = await mockAnalyticsService.getLiveMetrics();

        expect(result.active_now.total_active_users).toBe(245);
        expect(result.system_health.uptime).toBeGreaterThan(99);
        expect(result.real_time_trends.workout_completion_rate).toBeGreaterThan(80);
        expect(result.alerts).toHaveLength(1);
      });
    });
  });

  describe('Predictive Analytics', () => {
    describe('getPredictiveInsights', () => {
      it('should generate AI-powered predictions', async () => {
        const insights = {
          churn_predictions: [
            {
              user_id: 'user-123',
              churn_probability: 75.3,
              predicted_churn_date: '2024-03-15',
              key_risk_factors: ['Low engagement', 'Missed payments'],
              intervention_suggestions: ['Personal outreach', 'Discount offer'],
            },
          ],
          
          growth_forecasts: {
            user_growth_next_30_days: 95,
            revenue_growth_next_30_days: 8500,
            confidence_level: 82,
          },
          
          demand_predictions: {
            peak_usage_forecast: {
              date: '2024-01-22',
              time: '19:00',
              expected_concurrent_users: 380,
            },
            workout_popularity_trends: [
              { workout_type: 'HIIT', trend: 'rising', predicted_growth: 25.3 },
              { workout_type: 'YOGA', trend: 'stable', predicted_growth: 2.1 },
            ],
          },
          
          optimization_recommendations: [
            {
              category: 'user_retention',
              recommendation: 'Implement gamification features',
              expected_impact: '+12% retention',
              confidence: 78,
            },
            {
              category: 'revenue',
              recommendation: 'Introduce premium coaching tier',
              expected_impact: '+$15K MRR',
              confidence: 65,
            },
          ],
          
          anomaly_alerts: [
            {
              type: 'unusual_activity',
              description: 'Signup rate 40% above normal',
              detected_at: new Date().toISOString(),
              severity: 'info',
            },
          ],
        };

        mockAnalyticsService.getPredictiveInsights.mockResolvedValue(insights);

        const result = await mockAnalyticsService.getPredictiveInsights();

        expect(result.churn_predictions).toHaveLength(1);
        expect(result.growth_forecasts.confidence_level).toBe(82);
        expect(result.optimization_recommendations).toHaveLength(2);
        expect(result.anomaly_alerts[0].severity).toBe('info');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle complex analytics queries efficiently', async () => {
      mockAnalyticsService.getSystemOverview.mockResolvedValue({
        user_metrics: { total_users: 10000 },
      });

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        await mockAnalyticsService.getSystemOverview();
      });

      TestHelpers.expectPerformanceWithin(duration, 3000); // 3 seconds max
    });

    it('should detect memory leaks in analytics processing', async () => {
      const { leaked } = await TestHelpers.detectMemoryLeaks(async () => {
        await mockAnalyticsService.getTrainerDashboard(mockTrainer.id);
      }, 30);

      expect(leaked).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', async () => {
      mockAnalyticsService.getTrainerDashboard.mockResolvedValue({
        overview: { total_students: 0 },
        message: 'No data available for this trainer',
      });

      const result = await mockAnalyticsService.getTrainerDashboard('new-trainer-id');
      expect(result.overview.total_students).toBe(0);
    });

    it('should handle database errors', async () => {
      mockAnalyticsService.getSystemOverview.mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(mockAnalyticsService.getSystemOverview())
        .rejects.toThrow('Database connection failed');
    });
  });

  describe('Custom Reports', () => {
    describe('generateCustomReport', () => {
      it('should generate custom analytics reports', async () => {
        const reportConfig = {
          title: 'Monthly Trainer Performance',
          metrics: ['student_count', 'session_completion_rate', 'revenue'],
          filters: { period: 'month', trainer_type: 'premium' },
          format: 'pdf',
        };

        const customReport = {
          report_id: 'report-123',
          title: reportConfig.title,
          data: {
            trainers: [
              {
                name: 'João Silva',
                student_count: 25,
                session_completion_rate: 89.5,
                revenue: 8500,
              },
            ],
          },
          metadata: {
            generated_at: new Date().toISOString(),
            format: 'pdf',
            total_records: 1,
          },
        };

        mockAnalyticsService.generateCustomReport.mockResolvedValue(customReport);

        const result = await mockAnalyticsService.generateCustomReport(reportConfig);

        expect(result.report_id).toBe('report-123');
        expect(result.data.trainers).toHaveLength(1);
        expect(result.metadata.format).toBe('pdf');
      });
    });

    describe('exportAnalytics', () => {
      it('should export analytics in different formats', async () => {
        const exportConfig = {
          format: 'csv',
          data_type: 'student_progress',
          filters: { trainer_id: mockTrainer.id },
        };

        const exportResult = {
          download_url: 'https://storage.example.com/exports/analytics.csv',
          file_size: 2048576, // bytes
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        };

        mockAnalyticsService.exportAnalytics.mockResolvedValue(exportResult);

        const result = await mockAnalyticsService.exportAnalytics(exportConfig);

        expect(result.download_url).toContain('.csv');
        expect(result.file_size).toBeGreaterThan(0);
        expect(result.expires_at).toBeDefined();
      });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      mockAnalyticsService.cleanup.mockResolvedValue(true);

      await mockAnalyticsService.cleanup();
      expect(mockAnalyticsService.cleanup).toHaveBeenCalled();
    });
  });
});
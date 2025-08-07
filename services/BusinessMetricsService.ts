import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from './AnalyticsService';

// Business Metrics Service - KPIs de negócio para PTs
export class BusinessMetricsService {
  // Revenue calculations
  static async calculateRevenue(timeRange: 'week' | 'month' | 'year' = 'month') {
    const payments = await this.getPaymentHistory();
    const aggregated = await AnalyticsService.aggregateData(payments, 'month', timeRange);
    
    const revenue = aggregated.reduce((sum, group) => sum + group.value, 0);
    const trend = AnalyticsService.calculateTrend(
      payments.map(p => ({ value: p.amount, date: p.date }))
    );

    return {
      total: revenue,
      trend: trend.percentage,
      direction: trend.direction,
      breakdown: aggregated
    };
  }

  // Student lifecycle metrics
  static async calculateStudentMetrics() {
    const students = await this.getStudentData();
    const activeStudents = students.filter(s => s.status === 'active').length;
    const totalStudents = students.length;
    const newStudents = students.filter(s => {
      const joinDate = new Date(s.joinDate);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return joinDate >= monthAgo;
    }).length;

    // Churn calculation
    const churnedStudents = students.filter(s => {
      if (s.status !== 'inactive') return false;
      const lastActive = new Date(s.lastActiveDate);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return lastActive >= monthAgo;
    }).length;

    const churnRate = activeStudents > 0 ? (churnedStudents / activeStudents) * 100 : 0;

    // Customer Lifetime Value (CLV)
    const avgMonthlyRevenue = await this.calculateAverageMonthlyRevenue();
    const avgCustomerLifespan = await this.calculateAverageCustomerLifespan();
    const clv = avgMonthlyRevenue * avgCustomerLifespan;

    return {
      active: activeStudents,
      total: totalStudents,
      new: newStudents,
      churnRate: Math.round(churnRate * 100) / 100,
      clv: Math.round(clv * 100) / 100,
      acquisitionCost: await this.calculateCustomerAcquisitionCost(),
      retentionRate: Math.round((1 - churnRate / 100) * 10000) / 100
    };
  }

  // Workout effectiveness metrics
  static async calculateWorkoutAnalytics() {
    const workouts = await this.getWorkoutData();
    const workoutSessions = await this.getWorkoutSessionData();

    // Most popular workouts
    const workoutPopularity = workouts.map(workout => {
      const sessions = workoutSessions.filter(s => s.workoutId === workout.id);
      return {
        ...workout,
        sessionCount: sessions.length,
        avgRating: sessions.reduce((sum, s) => sum + (s.rating || 0), 0) / sessions.length || 0,
        completionRate: sessions.filter(s => s.completed).length / sessions.length || 0
      };
    }).sort((a, b) => b.sessionCount - a.sessionCount);

    // Workout effectiveness by muscle group
    const muscleGroupEffectiveness = await this.calculateMuscleGroupEffectiveness(workoutSessions);

    // Best performing time slots
    const timeSlotPerformance = this.analyzeTimeSlotPerformance(workoutSessions);

    return {
      mostPopular: workoutPopularity.slice(0, 10),
      muscleGroupEffectiveness,
      timeSlotPerformance,
      avgSessionDuration: this.calculateAverageSessionDuration(workoutSessions),
      completionRates: this.calculateCompletionRatesByType(workouts, workoutSessions)
    };
  }

  // Communication analytics
  static async calculateCommunicationMetrics() {
    const messages = await this.getMessageHistory();
    const responseTime = this.calculateAverageResponseTime(messages);
    const engagementRate = this.calculateEngagementRate(messages);
    const communicationVolume = await AnalyticsService.aggregateData(
      messages, 'day', 'month'
    );

    return {
      avgResponseTime: responseTime,
      engagementRate: Math.round(engagementRate * 100) / 100,
      dailyVolume: communicationVolume,
      peakHours: this.findPeakCommunicationHours(messages),
      studentSatisfaction: await this.calculateStudentSatisfactionScore()
    };
  }

  // Market intelligence simulation
  static async getMarketInsights() {
    // Simulated market data for demo purposes
    return {
      industryGrowth: 12.5, // % per year
      competitorAnalysis: {
        pricingAdvantage: 15, // % above/below average
        serviceAdvantage: 8.5,
        clientRetention: 85 // industry average %
      },
      marketTrends: [
        { trend: 'Funcional Training', growth: 25, opportunity: 'high' },
        { trend: 'Online Coaching', growth: 45, opportunity: 'very-high' },
        { trend: 'Grupo Classes', growth: 8, opportunity: 'medium' },
        { trend: 'Nutrition Coaching', growth: 35, opportunity: 'high' }
      ],
      demographics: {
        primaryAge: '25-35',
        genderSplit: { male: 45, female: 55 },
        incomeLevel: 'middle-upper',
        fitnessLevel: 'beginner-intermediate'
      }
    };
  }

  // Predictive analytics
  static async generateBusinessPredictions() {
    const revenueHistory = await this.getPaymentHistory();
    const studentHistory = await this.getStudentGrowthHistory();

    const revenuePrediction = AnalyticsService.predictValue(
      revenueHistory.map(p => ({ value: p.amount, date: p.date })),
      30 // 30 days ahead
    );

    const studentGrowthPrediction = AnalyticsService.predictValue(
      studentHistory.map(s => ({ value: s.count, date: s.date })),
      30
    );

    return {
      revenue: {
        nextMonth: revenuePrediction?.predicted || 0,
        confidence: revenuePrediction?.confidence || 0,
        trend: revenuePrediction?.trend || 'stable'
      },
      studentGrowth: {
        nextMonth: Math.round(studentGrowthPrediction?.predicted || 0),
        confidence: studentGrowthPrediction?.confidence || 0,
        trend: studentGrowthPrediction?.trend || 'stable'
      }
    };
  }

  // Mock data generators for demo
  private static async getPaymentHistory() {
    const stored = await AsyncStorage.getItem('business_payment_history');
    if (stored) return JSON.parse(stored);

    // Generate mock payment data
    const payments = [];
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      // Simulate varying monthly revenue
      const baseRevenue = 8000 + (Math.random() * 4000);
      const seasonality = 1 + 0.3 * Math.sin((i * Math.PI) / 6); // Seasonal variation
      const amount = baseRevenue * seasonality;

      payments.push({
        id: `payment_${i}`,
        amount: Math.round(amount),
        date: date.toISOString(),
        month: date.toISOString().substring(0, 7)
      });
    }

    await AsyncStorage.setItem('business_payment_history', JSON.stringify(payments.reverse()));
    return payments;
  }

  private static async getStudentData() {
    const stored = await AsyncStorage.getItem('business_student_data');
    if (stored) return JSON.parse(stored);

    // Generate mock student data
    const students = [];
    const now = new Date();

    for (let i = 0; i < 45; i++) {
      const joinDate = new Date(now);
      joinDate.setDate(now.getDate() - (Math.random() * 365));

      const isActive = Math.random() > 0.15; // 85% retention rate
      const lastActiveDate = isActive ? now : new Date(joinDate.getTime() + Math.random() * (now.getTime() - joinDate.getTime()));

      students.push({
        id: `student_${i}`,
        name: `Aluno ${i + 1}`,
        joinDate: joinDate.toISOString(),
        status: isActive ? 'active' : 'inactive',
        lastActiveDate: lastActiveDate.toISOString(),
        monthlyFee: 150 + Math.random() * 100
      });
    }

    await AsyncStorage.setItem('business_student_data', JSON.stringify(students));
    return students;
  }

  private static async getWorkoutData() {
    // Mock workout templates data
    return [
      { id: 1, name: 'Push Day', category: 'strength', difficulty: 'intermediate' },
      { id: 2, name: 'Pull Day', category: 'strength', difficulty: 'intermediate' },
      { id: 3, name: 'Leg Day', category: 'strength', difficulty: 'advanced' },
      { id: 4, name: 'HIIT Cardio', category: 'cardio', difficulty: 'beginner' },
      { id: 5, name: 'Funcional', category: 'functional', difficulty: 'intermediate' }
    ];
  }

  private static async getWorkoutSessionData() {
    const stored = await AsyncStorage.getItem('workout_sessions_data');
    if (stored) return JSON.parse(stored);

    // Generate mock session data
    const sessions = [];
    const now = new Date();

    for (let i = 0; i < 200; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - Math.random() * 90);

      sessions.push({
        id: `session_${i}`,
        workoutId: Math.ceil(Math.random() * 5),
        studentId: `student_${Math.floor(Math.random() * 45)}`,
        date: date.toISOString(),
        duration: 45 + Math.random() * 30, // 45-75 minutes
        completed: Math.random() > 0.1, // 90% completion rate
        rating: Math.random() > 0.2 ? 3 + Math.random() * 2 : null, // 80% rate sessions
        hour: date.getHours()
      });
    }

    await AsyncStorage.setItem('workout_sessions_data', JSON.stringify(sessions));
    return sessions;
  }

  private static async getMessageHistory() {
    // Mock communication data
    const messages = [];
    const now = new Date();

    for (let i = 0; i < 100; i++) {
      const sentDate = new Date(now);
      sentDate.setDate(now.getDate() - Math.random() * 30);
      
      const responseDate = new Date(sentDate);
      responseDate.setMinutes(sentDate.getMinutes() + Math.random() * 240); // 0-4 hours response

      messages.push({
        id: `msg_${i}`,
        sentDate: sentDate.toISOString(),
        responseDate: responseDate.toISOString(),
        studentId: `student_${Math.floor(Math.random() * 45)}`,
        responded: Math.random() > 0.05 // 95% response rate
      });
    }

    return messages;
  }

  private static async getStudentGrowthHistory() {
    const students = await this.getStudentData();
    const monthly: { [key: string]: number } = {};

    students.forEach(student => {
      const month = student.joinDate.substring(0, 7);
      monthly[month] = (monthly[month] || 0) + 1;
    });

    return Object.entries(monthly)
      .map(([month, count]) => ({ date: `${month}-01`, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Helper methods
  private static async calculateAverageMonthlyRevenue(): Promise<number> {
    const payments = await this.getPaymentHistory();
    const recentPayments = payments.slice(-6); // Last 6 months
    return recentPayments.reduce((sum, p) => sum + p.amount, 0) / recentPayments.length;
  }

  private static async calculateAverageCustomerLifespan(): Promise<number> {
    const students = await this.getStudentData();
    const inactiveStudents = students.filter(s => s.status === 'inactive');
    
    if (inactiveStudents.length === 0) return 12; // Default 12 months

    const lifespans = inactiveStudents.map(student => {
      const join = new Date(student.joinDate);
      const lastActive = new Date(student.lastActiveDate);
      return (lastActive.getTime() - join.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
    });

    return lifespans.reduce((sum, lifespan) => sum + lifespan, 0) / lifespans.length;
  }

  private static async calculateCustomerAcquisitionCost(): Promise<number> {
    // Simulated marketing cost / new customers
    const avgMarketingCost = 2000; // Monthly marketing budget
    const avgNewCustomers = 8; // New customers per month
    return avgMarketingCost / avgNewCustomers;
  }

  private static async calculateMuscleGroupEffectiveness(sessions: any[]) {
    // Mock muscle group effectiveness calculation
    return [
      { muscleGroup: 'Peito', effectiveness: 85, sessions: 45 },
      { muscleGroup: 'Costas', effectiveness: 88, sessions: 42 },
      { muscleGroup: 'Pernas', effectiveness: 92, sessions: 38 },
      { muscleGroup: 'Ombros', effectiveness: 78, sessions: 35 },
      { muscleGroup: 'Braços', effectiveness: 82, sessions: 40 }
    ];
  }

  private static analyzeTimeSlotPerformance(sessions: any[]) {
    const hourlyStats: { [hour: number]: { count: number; avgRating: number; completionRate: number } } = {};

    sessions.forEach(session => {
      const hour = session.hour;
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { count: 0, avgRating: 0, completionRate: 0 };
      }
      
      hourlyStats[hour].count++;
      hourlyStats[hour].avgRating += session.rating || 0;
      if (session.completed) hourlyStats[hour].completionRate++;
    });

    return Object.entries(hourlyStats).map(([hour, stats]) => ({
      hour: parseInt(hour),
      timeSlot: this.formatTimeSlot(parseInt(hour)),
      sessions: stats.count,
      avgRating: stats.count > 0 ? stats.avgRating / stats.count : 0,
      completionRate: stats.count > 0 ? (stats.completionRate / stats.count) * 100 : 0
    })).sort((a, b) => b.sessions - a.sessions);
  }

  private static formatTimeSlot(hour: number): string {
    if (hour >= 5 && hour < 12) return 'Manhã';
    if (hour >= 12 && hour < 18) return 'Tarde';
    if (hour >= 18 && hour < 22) return 'Noite';
    return 'Madrugada';
  }

  private static calculateAverageSessionDuration(sessions: any[]): number {
    const durations = sessions.map(s => s.duration).filter(d => d);
    return durations.length > 0 ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  private static calculateCompletionRatesByType(workouts: any[], sessions: any[]) {
    return workouts.map(workout => {
      const workoutSessions = sessions.filter(s => s.workoutId === workout.id);
      const completed = workoutSessions.filter(s => s.completed).length;
      
      return {
        workoutType: workout.category,
        completionRate: workoutSessions.length > 0 ? (completed / workoutSessions.length) * 100 : 0,
        totalSessions: workoutSessions.length
      };
    });
  }

  private static calculateAverageResponseTime(messages: any[]): number {
    const responseTimes = messages
      .filter(m => m.responded)
      .map(m => new Date(m.responseDate).getTime() - new Date(m.sentDate).getTime());
    
    const avgMs = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    return Math.round(avgMs / (1000 * 60)); // Convert to minutes
  }

  private static calculateEngagementRate(messages: any[]): number {
    return (messages.filter(m => m.responded).length / messages.length) * 100;
  }

  private static findPeakCommunicationHours(messages: any[]) {
    const hourlyCount: { [hour: number]: number } = {};
    
    messages.forEach(message => {
      const hour = new Date(message.sentDate).getHours();
      hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });

    return Object.entries(hourlyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));
  }

  private static async calculateStudentSatisfactionScore(): Promise<number> {
    // Simulated satisfaction based on ratings
    return 4.2; // Out of 5
  }
}
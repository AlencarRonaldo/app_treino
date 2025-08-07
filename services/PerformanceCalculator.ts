import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsService } from './AnalyticsService';

// Performance Calculator - Cálculos específicos de performance fitness
export class PerformanceCalculator {
  // Volume de treino calculations
  static calculateTrainingVolume(exercises: any[]) {
    return exercises.reduce((total, exercise) => {
      const sets = exercise.sets || [];
      const volume = sets.reduce((setTotal: number, set: any) => {
        return setTotal + (set.weight || 0) * (set.reps || 0);
      }, 0);
      return total + volume;
    }, 0);
  }

  // Intensidade calculation (1RM percentage)
  static calculateIntensity(weight: number, reps: number, oneRM?: number): number {
    // Using Epley formula for 1RM estimation if not provided
    const estimatedOneRM = oneRM || weight * (1 + reps / 30);
    return (weight / estimatedOneRM) * 100;
  }

  // Progress calculation between workouts
  static calculateProgressBetweenSessions(oldSession: any, newSession: any) {
    const oldVolume = this.calculateTrainingVolume(oldSession.exercises || []);
    const newVolume = this.calculateTrainingVolume(newSession.exercises || []);
    
    const volumeChange = ((newVolume - oldVolume) / oldVolume) * 100;
    
    // Calculate exercise-specific progress
    const exerciseProgress = this.calculateExerciseProgress(
      oldSession.exercises || [], 
      newSession.exercises || []
    );

    return {
      volumeChange: Math.round(volumeChange * 100) / 100,
      totalVolume: {
        old: oldVolume,
        new: newVolume,
        change: newVolume - oldVolume
      },
      exerciseProgress,
      overallImprovement: this.calculateOverallImprovement(exerciseProgress)
    };
  }

  // Body composition calculations
  static calculateBodyComposition(measurements: any[]) {
    if (measurements.length === 0) return null;

    const latest = measurements[measurements.length - 1];
    const previous = measurements.length > 1 ? measurements[measurements.length - 2] : null;

    const changes = previous ? {
      weight: latest.weight - previous.weight,
      bodyFat: latest.bodyFat ? (latest.bodyFat - (previous.bodyFat || 0)) : null,
      muscleMass: latest.muscleMass ? (latest.muscleMass - (previous.muscleMass || 0)) : null
    } : null;

    return {
      current: latest,
      changes,
      bmi: this.calculateBMI(latest.weight, latest.height),
      trend: measurements.length > 2 ? this.calculateBodyTrend(measurements) : null
    };
  }

  // Strength improvement calculations
  static calculateStrengthImprovement(exercises: { name: string; records: any[] }[]) {
    return exercises.map(exercise => {
      const records = exercise.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      if (records.length < 2) return { 
        exercise: exercise.name, 
        improvement: 0, 
        trend: 'insufficient_data' 
      };

      const first = records[0];
      const last = records[records.length - 1];
      
      const firstMax = Math.max(...first.sets.map((s: any) => s.weight || 0));
      const lastMax = Math.max(...last.sets.map((s: any) => s.weight || 0));
      
      const improvement = ((lastMax - firstMax) / firstMax) * 100;
      const trend = this.calculateStrengthTrend(records);

      return {
        exercise: exercise.name,
        improvement: Math.round(improvement * 100) / 100,
        trend,
        firstMax,
        lastMax,
        timeSpan: this.calculateTimeSpan(first.date, last.date)
      };
    });
  }

  // Cardio improvement calculations
  static calculateCardioImprovement(cardioSessions: any[]) {
    const sessions = cardioSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (sessions.length < 2) return { improvement: 0, trend: 'insufficient_data' };

    // Calculate improvement in different metrics
    const distanceImprovement = this.calculateMetricImprovement(sessions, 'distance');
    const durationImprovement = this.calculateMetricImprovement(sessions, 'duration');
    const caloriesImprovement = this.calculateMetricImprovement(sessions, 'calories');
    const paceImprovement = this.calculatePaceImprovement(sessions);

    return {
      distance: distanceImprovement,
      duration: durationImprovement,
      calories: caloriesImprovement,
      pace: paceImprovement,
      overallImprovement: (distanceImprovement + durationImprovement + caloriesImprovement) / 3
    };
  }

  // Injury risk assessment
  static calculateInjuryRisk(workoutData: any[], bodyMetrics: any[]) {
    let riskScore = 0;
    const riskFactors = [];

    // Volume progression risk
    if (workoutData.length >= 4) {
      const recentVolumes = workoutData.slice(-4).map(w => this.calculateTrainingVolume(w.exercises));
      const volumeIncrease = this.calculateAverageIncrease(recentVolumes);
      
      if (volumeIncrease > 10) { // More than 10% weekly increase
        riskScore += 30;
        riskFactors.push('Progressão de volume muito rápida');
      }
    }

    // Frequency risk
    const recentFrequency = this.calculateWeeklyFrequency(workoutData.slice(-14)); // Last 2 weeks
    if (recentFrequency > 6) {
      riskScore += 20;
      riskFactors.push('Frequência muito alta');
    }

    // Recovery time risk
    const avgRestDays = this.calculateAverageRestDays(workoutData.slice(-10));
    if (avgRestDays < 1) {
      riskScore += 25;
      riskFactors.push('Tempo de recuperação insuficiente');
    }

    // Muscle imbalance risk
    const muscleBalance = this.calculateMuscleGroupBalance(workoutData.slice(-8));
    if (muscleBalance.imbalanceScore > 30) {
      riskScore += 15;
      riskFactors.push('Desequilíbrio muscular detectado');
    }

    // Body metrics risk (if available)
    if (bodyMetrics.length > 0) {
      const latestBMI = this.calculateBMI(bodyMetrics[0].weight, bodyMetrics[0].height);
      if (latestBMI > 30 || latestBMI < 18.5) {
        riskScore += 10;
        riskFactors.push('IMC fora da faixa ideal');
      }
    }

    return {
      riskScore: Math.min(riskScore, 100), // Cap at 100%
      riskLevel: this.getRiskLevel(riskScore),
      factors: riskFactors,
      recommendations: this.getInjuryPreventionRecommendations(riskScore, riskFactors)
    };
  }

  // Performance predictions
  static predictPerformance(exerciseHistory: any[], daysAhead: number = 30) {
    return exerciseHistory.map(exercise => {
      const records = exercise.records || [];
      if (records.length < 3) return null;

      const maxWeights = records.map((record: any) => ({
        date: record.date,
        value: Math.max(...record.sets.map((s: any) => s.weight || 0))
      }));

      const prediction = AnalyticsService.predictValue(maxWeights, daysAhead);
      
      return {
        exercise: exercise.name,
        currentMax: maxWeights[maxWeights.length - 1].value,
        predictedMax: prediction?.predicted || 0,
        confidence: prediction?.confidence || 0,
        trend: prediction?.trend || 'stable',
        potentialGain: (prediction?.predicted || 0) - maxWeights[maxWeights.length - 1].value
      };
    }).filter(Boolean);
  }

  // Mock data generators for student progress
  static async generateMockProgressData() {
    const stored = await AsyncStorage.getItem('student_progress_data');
    if (stored) return JSON.parse(stored);

    const now = new Date();
    const data = {
      bodyMetrics: this.generateMockBodyMetrics(now),
      workoutSessions: this.generateMockWorkoutSessions(now),
      personalRecords: this.generateMockPersonalRecords(now),
      goals: this.generateMockGoals(),
      achievements: this.generateMockAchievements()
    };

    await AsyncStorage.setItem('student_progress_data', JSON.stringify(data));
    return data;
  }

  // Helper methods
  private static calculateExerciseProgress(oldExercises: any[], newExercises: any[]) {
    const progress: any[] = [];

    oldExercises.forEach(oldEx => {
      const newEx = newExercises.find(ex => ex.name === oldEx.name);
      if (!newEx) return;

      const oldMax = Math.max(...oldEx.sets.map((s: any) => s.weight || 0));
      const newMax = Math.max(...newEx.sets.map((s: any) => s.weight || 0));
      const improvement = oldMax > 0 ? ((newMax - oldMax) / oldMax) * 100 : 0;

      progress.push({
        exercise: oldEx.name,
        oldMax,
        newMax,
        improvement: Math.round(improvement * 100) / 100,
        sets: {
          old: oldEx.sets.length,
          new: newEx.sets.length
        }
      });
    });

    return progress;
  }

  private static calculateOverallImprovement(exerciseProgress: any[]): number {
    if (exerciseProgress.length === 0) return 0;
    
    const totalImprovement = exerciseProgress.reduce((sum, ex) => sum + ex.improvement, 0);
    return Math.round((totalImprovement / exerciseProgress.length) * 100) / 100;
  }

  private static calculateBMI(weight: number, height: number): number {
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 100) / 100;
  }

  private static calculateBodyTrend(measurements: any[]) {
    const weights = measurements.map(m => ({ date: m.date, value: m.weight }));
    return AnalyticsService.calculateTrend(weights);
  }

  private static calculateStrengthTrend(records: any[]) {
    if (records.length < 3) return 'insufficient_data';

    const maxWeights = records.map(r => Math.max(...r.sets.map((s: any) => s.weight || 0)));
    const recentAvg = maxWeights.slice(-3).reduce((sum, w) => sum + w, 0) / 3;
    const earlierAvg = maxWeights.slice(0, 3).reduce((sum, w) => sum + w, 0) / 3;

    const improvement = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (improvement > 5) return 'increasing';
    if (improvement < -5) return 'decreasing';
    return 'stable';
  }

  private static calculateTimeSpan(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private static calculateMetricImprovement(sessions: any[], metric: string): number {
    if (sessions.length < 2) return 0;

    const values = sessions.map(s => s[metric]).filter(v => v);
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];
    
    return ((last - first) / first) * 100;
  }

  private static calculatePaceImprovement(sessions: any[]): number {
    const paces = sessions
      .filter(s => s.distance && s.duration)
      .map(s => s.duration / s.distance); // time per unit distance

    if (paces.length < 2) return 0;

    const first = paces[0];
    const last = paces[paces.length - 1];
    
    // Lower pace is better, so improvement is negative change
    return ((first - last) / first) * 100;
  }

  private static calculateAverageIncrease(values: number[]): number {
    if (values.length < 2) return 0;
    
    let totalIncrease = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i - 1] > 0) {
        totalIncrease += ((values[i] - values[i - 1]) / values[i - 1]) * 100;
      }
    }
    
    return totalIncrease / (values.length - 1);
  }

  private static calculateWeeklyFrequency(workouts: any[]): number {
    if (workouts.length === 0) return 0;
    
    const days = workouts.length;
    const weeks = Math.max(1, days / 7);
    return days / weeks;
  }

  private static calculateAverageRestDays(workouts: any[]): number {
    if (workouts.length < 2) return 0;
    
    const sortedWorkouts = workouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let totalRestDays = 0;
    
    for (let i = 1; i < sortedWorkouts.length; i++) {
      const prevDate = new Date(sortedWorkouts[i - 1].date);
      const currentDate = new Date(sortedWorkouts[i].date);
      const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24) - 1;
      totalRestDays += Math.max(0, diffDays);
    }
    
    return totalRestDays / (sortedWorkouts.length - 1);
  }

  private static calculateMuscleGroupBalance(workouts: any[]) {
    const muscleGroups = ['push', 'pull', 'legs', 'core'];
    const groupCounts: { [key: string]: number } = {};
    
    muscleGroups.forEach(group => groupCounts[group] = 0);
    
    workouts.forEach(workout => {
      workout.exercises?.forEach((exercise: any) => {
        // Simplified muscle group assignment based on exercise name
        const exerciseName = exercise.name.toLowerCase();
        if (exerciseName.includes('bench') || exerciseName.includes('press') || exerciseName.includes('push')) {
          groupCounts.push++;
        } else if (exerciseName.includes('pull') || exerciseName.includes('row') || exerciseName.includes('lat')) {
          groupCounts.pull++;
        } else if (exerciseName.includes('squat') || exerciseName.includes('leg') || exerciseName.includes('deadlift')) {
          groupCounts.legs++;
        } else if (exerciseName.includes('abs') || exerciseName.includes('core') || exerciseName.includes('plank')) {
          groupCounts.core++;
        }
      });
    });
    
    const values = Object.values(groupCounts);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const imbalanceScore = max > 0 ? ((max - min) / max) * 100 : 0;
    
    return { groupCounts, imbalanceScore };
  }

  private static getRiskLevel(score: number): string {
    if (score < 25) return 'low';
    if (score < 50) return 'moderate';
    if (score < 75) return 'high';
    return 'very_high';
  }

  private static getInjuryPreventionRecommendations(score: number, factors: string[]): string[] {
    const recommendations = [];
    
    if (score > 50) {
      recommendations.push('Reduza a intensidade dos treinos por 1-2 semanas');
    }
    
    if (factors.includes('Progressão de volume muito rápida')) {
      recommendations.push('Aumente o volume de treino em no máximo 10% por semana');
    }
    
    if (factors.includes('Frequência muito alta')) {
      recommendations.push('Inclua pelo menos 1-2 dias de descanso completo por semana');
    }
    
    if (factors.includes('Tempo de recuperação insuficiente')) {
      recommendations.push('Aumente o intervalo entre treinos do mesmo grupo muscular');
    }
    
    if (factors.includes('Desequilíbrio muscular detectado')) {
      recommendations.push('Foque em exercícios para grupos musculares menos trabalhados');
    }
    
    recommendations.push('Mantenha uma rotina de alongamento e aquecimento');
    recommendations.push('Monitore sinais de fadiga excessiva ou dor');
    
    return recommendations;
  }

  // Mock data generators
  private static generateMockBodyMetrics(now: Date) {
    const metrics = [];
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Simulate gradual weight change
      const baseWeight = 75 + Math.sin(i * 0.1) * 2 + (Math.random() - 0.5) * 0.5;
      
      metrics.push({
        date: date.toISOString().split('T')[0],
        weight: Math.round(baseWeight * 10) / 10,
        height: 175,
        bodyFat: 15 + Math.random() * 2,
        muscleMass: 35 + Math.random() * 1
      });
    }
    
    return metrics.reverse();
  }

  private static generateMockWorkoutSessions(now: Date) {
    const sessions = [];
    
    for (let i = 0; i < 50; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i * 2);
      
      sessions.push({
        id: `session_${i}`,
        date: date.toISOString(),
        exercises: [
          {
            name: 'Supino Reto',
            sets: [
              { weight: 60 + Math.random() * 20, reps: 10 + Math.random() * 2 },
              { weight: 65 + Math.random() * 20, reps: 8 + Math.random() * 2 },
              { weight: 70 + Math.random() * 20, reps: 6 + Math.random() * 2 }
            ]
          },
          {
            name: 'Agachamento',
            sets: [
              { weight: 80 + Math.random() * 30, reps: 12 + Math.random() * 3 },
              { weight: 90 + Math.random() * 30, reps: 10 + Math.random() * 2 },
              { weight: 100 + Math.random() * 30, reps: 8 + Math.random() * 2 }
            ]
          }
        ],
        duration: 60 + Math.random() * 30,
        rating: Math.random() > 0.2 ? 3 + Math.random() * 2 : null
      });
    }
    
    return sessions.reverse();
  }

  private static generateMockPersonalRecords(now: Date) {
    return [
      { exercise: 'Supino Reto', weight: 85, reps: 1, date: now.toISOString() },
      { exercise: 'Agachamento', weight: 120, reps: 1, date: now.toISOString() },
      { exercise: 'Terra', weight: 140, reps: 1, date: now.toISOString() },
      { exercise: 'Desenvolvimento', weight: 60, reps: 1, date: now.toISOString() }
    ];
  }

  private static generateMockGoals() {
    return [
      { id: 1, title: 'Perder 5kg', target: 5, current: 2.3, unit: 'kg', deadline: '2024-06-01', category: 'weight' },
      { id: 2, title: 'Supino 100kg', target: 100, current: 85, unit: 'kg', deadline: '2024-05-01', category: 'strength' },
      { id: 3, title: 'Treinar 4x/semana', target: 4, current: 3.2, unit: 'vezes', deadline: '2024-12-31', category: 'frequency' }
    ];
  }

  private static generateMockAchievements() {
    return [
      { id: 1, title: 'Primeira Semana', description: 'Complete 7 treinos consecutivos', earned: true, earnedDate: '2024-01-15' },
      { id: 2, title: 'PR Master', description: 'Quebrou 5 recordes pessoais', earned: true, earnedDate: '2024-02-10' },
      { id: 3, title: 'Consistência de Ferro', description: '30 dias de treino seguidos', earned: false },
      { id: 4, title: 'Volume King', description: '20 toneladas movimentadas em uma semana', earned: true, earnedDate: '2024-03-01' }
    ];
  }
}
/**
 * AI Types
 * Tipos relacionados à integração com IA e geração de treinos
 */

import { 
  WorkoutCategory, 
  Difficulty, 
  MuscleGroup, 
  Equipment,
  ActivityLevel 
} from '@prisma/client';

// Request interfaces - AI Workout Generation
export interface GenerateWorkoutRequest {
  // Parâmetros do usuário
  goals: string[]; // ex: ["ganhar massa", "perder peso", "aumentar força"]
  fitnessLevel: Difficulty;
  activityLevel: ActivityLevel;
  availableTime: number; // em minutos
  availableEquipment: Equipment[];
  targetMuscleGroups?: MuscleGroup[];
  
  // Preferências do treino
  workoutType: WorkoutCategory;
  intensity: 'low' | 'moderate' | 'high';
  focusAreas?: MuscleGroup[]; // músculos que o usuário quer focar mais
  avoidExercises?: string[]; // exercícios que o usuário quer evitar
  
  // Limitações e restrições
  injuries?: string[];
  limitations?: string[];
  preferences?: {
    maxSetsPerExercise?: number;
    preferredRepRange?: string; // ex: "8-12", "12-15"
    restTimePreference?: 'short' | 'medium' | 'long';
    includeWarmup?: boolean;
    includeCooldown?: boolean;
  };
  
  // Contexto adicional
  previousWorkouts?: string[]; // IDs dos últimos treinos para evitar repetição
  personalNotes?: string; // observações do usuário ou personal trainer
}

// Response interfaces - AI Workout
export interface GeneratedWorkoutResponse {
  workout: {
    name: string;
    description: string;
    category: WorkoutCategory;
    difficulty: Difficulty;
    estimatedDuration: number;
    restBetweenSets: number;
    restBetweenExercises: number;
    targetMuscleGroups: MuscleGroup[];
    equipment: Equipment[];
    exercises: GeneratedExercise[];
  };
  aiInsights: {
    reasoning: string; // Por que esse treino foi criado
    tips: string[]; // Dicas para execução
    alternatives: string[]; // Alternativas ou modificações
    progression: string; // Como progredir no futuro
    warnings?: string[]; // Avisos importantes
  };
  confidence: number; // 0-1, quão confiante a IA está na resposta
  tokensUsed: number;
  generatedAt: string;
}

export interface GeneratedExercise {
  name: string;
  description: string;
  instructions: string[];
  category: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  order: number;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  alternatives?: string[]; // Exercícios alternativos
  videoUrl?: string;
  images?: string[];
}

// Request interfaces - AI Analysis
export interface AnalyzeProgressRequest {
  userId: string;
  timeframe: 'week' | 'month' | '3months' | '6months' | 'year';
  focusAreas?: ('strength' | 'endurance' | 'flexibility' | 'weight' | 'body_composition')[];
}

export interface AnalyzeWorkoutRequest {
  workoutId: string;
  userId: string;
  includeComparison?: boolean; // Comparar com outros usuários similares
}

// Response interfaces - AI Analysis
export interface ProgressAnalysisResponse {
  summary: {
    overallProgress: 'excellent' | 'good' | 'fair' | 'needs_improvement';
    keyAchievements: string[];
    areasForImprovement: string[];
    confidenceScore: number;
  };
  insights: {
    strengthProgress: ProgressInsight;
    enduranceProgress: ProgressInsight;
    consistencyAnalysis: ConsistencyInsight;
    bodyCompositionTrends?: BodyCompositionInsight;
  };
  recommendations: {
    immediate: Recommendation[];
    shortTerm: Recommendation[]; // próximas 2-4 semanas
    longTerm: Recommendation[]; // próximos 2-3 meses
  };
  predictiveModeling?: {
    projectedGoalAchievement: string;
    estimatedTimeToGoal: number; // em semanas
    probabilityOfSuccess: number; // 0-1
  };
  tokensUsed: number;
  analyzedAt: string;
}

export interface ProgressInsight {
  trend: 'improving' | 'stable' | 'declining';
  rate: number; // taxa de melhoria/piora
  highlights: string[];
  concerns?: string[];
  comparison?: string; // Comparação com usuários similares
}

export interface ConsistencyInsight {
  adherenceRate: number; // 0-1
  missedWorkouts: number;
  streakAnalysis: {
    current: number;
    longest: number;
    average: number;
  };
  patterns: string[]; // Padrões identificados
}

export interface BodyCompositionInsight {
  weightTrend: 'gaining' | 'losing' | 'maintaining';
  bodyFatTrend?: 'decreasing' | 'increasing' | 'stable';
  muscleMassTrend?: 'gaining' | 'losing' | 'stable';
  recommendations: string[];
}

export interface Recommendation {
  type: 'workout' | 'nutrition' | 'recovery' | 'lifestyle';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionItems: string[];
  expectedOutcome: string;
  timeframe: string;
}

// Request interfaces - AI Feedback
export interface RateWorkoutRequest {
  workoutId: string;
  rating: number; // 1-5
  difficulty: number; // 1-5
  enjoyment: number; // 1-5
  effectiveness: number; // 1-5
  feedback: string;
  completionTime?: number;
  fatigue?: number; // 1-5
  soreness?: number; // 1-5
  modifications?: string[];
}

export interface WorkoutFeedbackResponse {
  processed: boolean;
  insights: string[];
  futureRecommendations: string[];
  adjustmentsSuggested: boolean;
  tokensUsed: number;
}

// AI Usage and Quota interfaces
export interface AIQuotaResponse {
  user: {
    id: string;
    plan: 'free' | 'premium' | 'pro';
  };
  quota: {
    monthly: {
      limit: number;
      used: number;
      remaining: number;
      resetDate: string;
    };
    daily: {
      limit: number;
      used: number;
      remaining: number;
    };
  };
  usage: {
    workoutGeneration: number;
    progressAnalysis: number;
    workoutFeedback: number;
    total: number;
  };
  costs: {
    thisMonth: number;
    lastMonth: number;
    currency: string;
  };
}

export interface AIUsageEntry {
  id: string;
  type: 'workout_generation' | 'progress_analysis' | 'workout_feedback';
  tokensUsed: number;
  cost: number;
  usedAt: string;
  details?: {
    workoutId?: string;
    success: boolean;
    duration: number; // tempo de processamento em ms
  };
}

// Configuration interfaces
export interface AIModelConfig {
  provider: 'openai' | 'anthropic' | 'local';
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number; // em segundos
}

export interface AIPromptTemplate {
  type: 'workout_generation' | 'progress_analysis' | 'workout_feedback';
  template: string;
  variables: string[];
  version: string;
  language: string;
}

// Error interfaces
export interface AIError {
  code: 'QUOTA_EXCEEDED' | 'MODEL_UNAVAILABLE' | 'INVALID_REQUEST' | 'PROCESSING_ERROR';
  message: string;
  details?: any;
  retryAfter?: number; // segundos até poder tentar novamente
  upgradeRequired?: boolean;
}
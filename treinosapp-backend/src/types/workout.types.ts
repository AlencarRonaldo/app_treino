/**
 * Workout Types
 * Tipos relacionados a treinos e exercícios
 */

import { 
  WorkoutCategory, 
  Difficulty, 
  MuscleGroup, 
  Equipment,
  ExerciseCategory
} from '@prisma/client';

// Request interfaces - Workout
export interface CreateWorkoutRequest {
  name: string;
  description?: string;
  category: WorkoutCategory;
  difficulty: Difficulty;
  estimatedDuration: number;
  restBetweenSets?: number;
  restBetweenExercises?: number;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
  targetMuscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  exercises: CreateWorkoutExerciseRequest[];
}

export interface UpdateWorkoutRequest {
  name?: string;
  description?: string;
  category?: WorkoutCategory;
  difficulty?: Difficulty;
  estimatedDuration?: number;
  restBetweenSets?: number;
  restBetweenExercises?: number;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
  targetMuscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  exercises?: UpdateWorkoutExerciseRequest[];
}

export interface CreateWorkoutExerciseRequest {
  exerciseId: string;
  order: number;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

export interface UpdateWorkoutExerciseRequest {
  id?: string;
  exerciseId?: string;
  order?: number;
  sets?: number;
  reps?: string;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
}

export interface DuplicateWorkoutRequest {
  name: string;
  isPublic?: boolean;
}

export interface ShareWorkoutRequest {
  userIds: string[];
}

// Request interfaces - Exercise
export interface CreateExerciseRequest {
  name: string;
  nameEn?: string;
  description: string;
  instructions: string[];
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  images?: string[];
  videoUrl?: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateExerciseRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  instructions?: string[];
  category?: ExerciseCategory;
  muscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  difficulty?: Difficulty;
  images?: string[];
  videoUrl?: string;
  isPublic?: boolean;
  tags?: string[];
}

// Response interfaces - Workout
export interface WorkoutResponse {
  id: string;
  name: string;
  description?: string;
  category: WorkoutCategory;
  difficulty: Difficulty;
  estimatedDuration: number;
  restBetweenSets: number;
  restBetweenExercises: number;
  isTemplate: boolean;
  isPublic: boolean;
  tags: string[];
  targetMuscleGroups: MuscleGroup[];
  equipment: Equipment[];
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  exercises: WorkoutExerciseResponse[];
  _count?: {
    workoutLogs: number;
    shares: number;
  };
}

export interface WorkoutExerciseResponse {
  id: string;
  order: number;
  sets: number;
  reps: string;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  exercise: ExerciseResponse;
}

export interface ExerciseResponse {
  id: string;
  name: string;
  nameEn?: string;
  description: string;
  instructions: string[];
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  difficulty: Difficulty;
  images: string[];
  videoUrl?: string;
  isPublic: boolean;
  isOfficial: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    name: string;
  };
}

// Response interfaces - Workout Execution
export interface WorkoutLogResponse {
  id: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  notes?: string;
  rating?: number;
  createdAt: string;
  workout: {
    id: string;
    name: string;
    category: WorkoutCategory;
    difficulty: Difficulty;
  };
  exerciseLogs: ExerciseLogResponse[];
}

export interface ExerciseLogResponse {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  completed: boolean;
  createdAt: string;
  exercise: {
    id: string;
    name: string;
    category: ExerciseCategory;
  };
}

// Request interfaces - Workout Execution
export interface StartWorkoutRequest {
  workoutId: string;
  notes?: string;
}

export interface LogExerciseRequest {
  exerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  completed?: boolean;
}

export interface CompleteWorkoutRequest {
  notes?: string;
  rating?: number;
  exerciseLogs: LogExerciseRequest[];
}

// Query interfaces
export interface WorkoutQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: WorkoutCategory;
  difficulty?: Difficulty;
  muscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  tags?: string[];
  isTemplate?: boolean;
  isPublic?: boolean;
  creatorId?: string;
  sortBy?: 'name' | 'createdAt' | 'difficulty' | 'duration';
  sortOrder?: 'asc' | 'desc';
}

export interface ExerciseQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: ExerciseCategory;
  muscleGroups?: MuscleGroup[];
  equipment?: Equipment[];
  difficulty?: Difficulty;
  tags?: string[];
  isPublic?: boolean;
  isOfficial?: boolean;
  sortBy?: 'name' | 'createdAt' | 'difficulty';
  sortOrder?: 'asc' | 'desc';
}

// Statistics interfaces
export interface WorkoutStats {
  totalWorkouts: number;
  totalDuration: number; // em minutos
  averageDuration: number;
  completionRate: number; // percentual
  favoriteCategory: WorkoutCategory;
  mostUsedEquipment: Equipment[];
  weeklyFrequency: number;
  currentStreak: number;
  longestStreak: number;
  recentActivity: {
    date: string;
    workoutsCompleted: number;
    totalDuration: number;
  }[];
}

export interface ExerciseStats {
  exerciseId: string;
  exerciseName: string;
  totalSets: number;
  totalReps: number;
  averageWeight: number;
  maxWeight: number;
  personalRecord: {
    weight: number;
    reps: number;
    date: string;
  };
  progressData: {
    date: string;
    weight: number;
    reps: number;
  }[];
}
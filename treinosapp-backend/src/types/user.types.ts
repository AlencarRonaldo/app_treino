/**
 * User Types
 * Tipos relacionados a usuários e perfis
 */

import { 
  UserType, 
  Gender, 
  ActivityLevel,
  ProgressType 
} from '@prisma/client';

// Request interfaces - User Profile
export interface UpdateProfileRequest {
  name?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  gender?: Gender;
  height?: number; // em cm
  weight?: number; // em kg
  activityLevel?: ActivityLevel;
  goals?: string[];
  preferredLanguage?: string;
  timezone?: string;
  notifications?: NotificationSettings;
}

export interface NotificationSettings {
  workout: boolean;
  progress: boolean;
  social: boolean;
  email?: boolean;
  push?: boolean;
}

// Request interfaces - Student Management
export interface AddStudentRequest {
  studentEmail: string;
  personalMessage?: string;
}

export interface RemoveStudentRequest {
  studentId: string;
}

export interface StudentInviteRequest {
  email: string;
  name: string;
  personalMessage?: string;
}

// Response interfaces - User
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  userType: UserType;
  isEmailVerified: boolean;
  dateOfBirth?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  goals: string[];
  preferredLanguage: string;
  timezone: string;
  notifications: NotificationSettings;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface ProfileResponse extends UserResponse {
  personalTrainer?: {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  students?: StudentResponse[];
  stats?: UserStats;
}

export interface StudentResponse {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  dateOfBirth?: string;
  gender?: Gender;
  height?: number;
  weight?: number;
  activityLevel?: ActivityLevel;
  goals: string[];
  createdAt: string;
  lastLoginAt?: string;
  stats?: {
    totalWorkouts: number;
    totalDuration: number;
    averageRating: number;
    currentStreak: number;
    lastWorkout?: string;
  };
}

// Request interfaces - Progress
export interface CreateProgressEntryRequest {
  type: ProgressType;
  value: number;
  unit: string;
  notes?: string;
  recordedAt?: string;
}

export interface UpdateProgressEntryRequest {
  value?: number;
  unit?: string;
  notes?: string;
  recordedAt?: string;
}

// Response interfaces - Progress
export interface ProgressEntryResponse {
  id: string;
  type: ProgressType;
  value: number;
  unit: string;
  notes?: string;
  recordedAt: string;
  createdAt: string;
}

export interface ProgressResponse {
  type: ProgressType;
  entries: ProgressEntryResponse[];
  summary: {
    current: number;
    previous: number;
    change: number;
    changePercentage: number;
    trend: 'up' | 'down' | 'stable';
    unit: string;
  };
  chartData: {
    date: string;
    value: number;
  }[];
}

// Statistics interfaces
export interface UserStats {
  totalWorkouts: number;
  totalDuration: number; // em minutos
  averageWorkoutDuration: number;
  workoutFrequency: number; // treinos por semana
  completionRate: number; // percentual
  currentStreak: number;
  longestStreak: number;
  averageRating: number;
  favoriteWorkoutCategory: string;
  mostUsedEquipment: string[];
  personalRecords: PersonalRecord[];
  recentActivity: ActivitySummary[];
  progressSummary: ProgressSummary[];
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'duration';
  value: number;
  unit: string;
  achievedAt: string;
}

export interface ActivitySummary {
  date: string;
  workoutsCompleted: number;
  totalDuration: number;
  caloriesBurned?: number;
  averageRating?: number;
}

export interface ProgressSummary {
  type: ProgressType;
  current: number;
  previous: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  lastUpdated: string;
}

// Query interfaces
export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  userType?: UserType;
  isEmailVerified?: boolean;
  activityLevel?: ActivityLevel;
  sortBy?: 'name' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

export interface StudentQuery extends UserQuery {
  personalTrainerId?: string;
  hasRecentActivity?: boolean;
  minWorkouts?: number;
}

export interface ProgressQuery {
  type?: ProgressType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  sortBy?: 'recordedAt' | 'value';
  sortOrder?: 'asc' | 'desc';
}

// Dashboard interfaces
export interface DashboardData {
  user: ProfileResponse;
  stats: UserStats;
  recentWorkouts: {
    id: string;
    name: string;
    completedAt: string;
    duration: number;
    rating?: number;
  }[];
  upcomingWorkouts: {
    id: string;
    name: string;
    scheduledFor?: string;
    estimatedDuration: number;
  }[];
  progressHighlights: ProgressSummary[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  achievedAt: string;
  category: 'workout' | 'progress' | 'streak' | 'social';
}

// Settings interfaces
export interface UpdateSettingsRequest {
  preferredLanguage?: string;
  timezone?: string;
  notifications?: NotificationSettings;
  privacy?: PrivacySettings;
}

export interface PrivacySettings {
  showProfile: boolean;
  showWorkouts: boolean;
  showProgress: boolean;
  allowStudentRequests: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  units: 'metric' | 'imperial';
  startOfWeek: 'monday' | 'sunday';
  timeFormat: '12h' | '24h';
  defaultRestTime: number;
  autoStartTimer: boolean;
  playRestAlerts: boolean;
}
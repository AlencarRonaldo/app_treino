/**
 * Authentication Types
 * Tipos relacionados à autenticação e autorização
 */

import { UserType } from '@prisma/client';

// Request interfaces
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  dateOfBirth?: string;
  gender?: string;
  height?: number;
  weight?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
  userType: UserType;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Response interfaces
export interface AuthResponse {
  user: AuthUser;
  tokens: TokenPair;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  userType: UserType;
  isEmailVerified: boolean;
  preferredLanguage: string;
  timezone: string;
  notifications: NotificationSettings;
  personalTrainerId?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface NotificationSettings {
  workout: boolean;
  progress: boolean;
  social: boolean;
}

// JWT Payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  userType: UserType;
  iat: number;
  exp: number;
}

// Middleware interfaces
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export interface ApiError {
  message: string;
  code: string;
  field?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
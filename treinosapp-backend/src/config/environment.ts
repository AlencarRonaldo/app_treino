/**
 * Environment Configuration
 * Configuração centralizada de variáveis de ambiente
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  // Server
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;

  // Database
  DATABASE_URL: string;
  DATABASE_URL_TEST: string;

  // Authentication
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;

  // Google OAuth
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;

  // Email
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  FROM_EMAIL: string;
  FROM_NAME: string;

  // External APIs
  RAPIDAPI_KEY: string;

  // File Upload
  MAX_FILE_SIZE: number;
  UPLOAD_PATH: string;

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;

  // CORS
  CORS_ORIGIN: string;

  // Security
  HELMET_CSP_DIRECTIVES: string;

  // Monitoring
  LOG_LEVEL: string;
  LOG_FILE: string;

  // Redis (optional)
  REDIS_URL?: string;

  // AWS S3 (optional)
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  AWS_S3_BUCKET?: string;
}

const config: Config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  API_VERSION: process.env.API_VERSION || 'v1',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./prisma/dev.db',
  DATABASE_URL_TEST: process.env.DATABASE_URL_TEST || 'file:./prisma/test.db',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',

  // Email
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@treinosapp.com',
  FROM_NAME: process.env.FROM_NAME || 'TreinosApp',

  // External APIs
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '',

  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  UPLOAD_PATH: process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:19006,http://localhost:8081,http://localhost:8082',

  // Security
  HELMET_CSP_DIRECTIVES: process.env.HELMET_CSP_DIRECTIVES || "default-src 'self'",

  // Monitoring
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FILE: process.env.LOG_FILE || path.join(process.cwd(), 'logs', 'app.log'),

  // Redis (optional)
  REDIS_URL: process.env.REDIS_URL,

  // AWS S3 (optional)
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
};

// Validation
function validateConfig() {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET'
  ];

  const missingVars = requiredVars.filter(varName => !config[varName as keyof Config]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Warn about important missing variables
  const warningVars = [
    { key: 'RAPIDAPI_KEY', message: 'AI workout generation will not work' },
    { key: 'GOOGLE_CLIENT_ID', message: 'Google OAuth will not work' },
    { key: 'SMTP_USER', message: 'Email notifications will not work' }
  ];

  warningVars.forEach(({ key, message }) => {
    if (!config[key as keyof Config]) {
      console.warn(`⚠️  Missing ${key}: ${message}`);
    }
  });

  // Validate JWT secret strength
  if (config.JWT_SECRET === 'fallback-secret-change-in-production' && config.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be changed in production environment');
  }

  if (config.JWT_SECRET.length < 32) {
    console.warn('⚠️  JWT_SECRET should be at least 32 characters long');
  }
}

// Run validation
if (config.NODE_ENV !== 'test') {
  validateConfig();
}

export { config };
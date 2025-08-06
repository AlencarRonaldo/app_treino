/**
 * TreinosApp Backend Server
 * Servidor principal da API do aplicativo de fitness brasileiro
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { config } from './config/environment';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { authMiddleware } from './middleware/authMiddleware';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import workoutRoutes from './routes/workout.routes';
import exerciseRoutes from './routes/exercise.routes';
import progressRoutes from './routes/progress.routes';
import aiRoutes from './routes/ai.routes';

class Server {
  public app: express.Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = config.PORT;
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Trust proxy (para deployment atrás de reverse proxy)
    this.app.set('trust proxy', 1);

    // Security middlewares
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: (origin, callback) => {
        // Em desenvolvimento, permitir qualquer localhost
        if (config.NODE_ENV === 'development') {
          if (!origin || origin.match(/^https?:\/\/localhost(:\d+)?$/)) {
            return callback(null, true);
          }
        }
        
        // Em produção, usar lista específica
        const allowedOrigins = config.CORS_ORIGIN.split(',');
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        return callback(new Error('Não permitido pelo CORS'), false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'x-api-key', 
        'x-app-version', 
        'x-platform', 
        'x-request-id'
      ],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Muitas requisições feitas. Tente novamente em alguns minutos.',
        code: 'RATE_LIMIT_EXCEEDED'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing & compression
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(compression());

    // Logging
    if (config.NODE_ENV !== 'test') {
      this.app.use(morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      }));
    }

    // Health check endpoint (antes da autenticação)
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: config.NODE_ENV,
        version: '1.0.0'
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'TreinosApp API',
        version: '1.0.0',
        description: 'API para aplicativo de fitness brasileiro',
        endpoints: {
          auth: '/api/v1/auth',
          users: '/api/v1/users',
          workouts: '/api/v1/workouts',
          exercises: '/api/v1/exercises',
          progress: '/api/v1/progress',
          ai: '/api/v1/ai'
        },
        documentation: '/api/docs',
        health: '/health'
      });
    });
  }

  private initializeRoutes(): void {
    const apiRouter = express.Router();

    // Public routes (não precisam de autenticação)
    apiRouter.use('/auth', authRoutes);

    // Protected routes (precisam de autenticação)
    apiRouter.use('/users', authMiddleware, userRoutes);
    apiRouter.use('/workouts', authMiddleware, workoutRoutes);
    apiRouter.use('/exercises', authMiddleware, exerciseRoutes);
    apiRouter.use('/progress', authMiddleware, progressRoutes);
    apiRouter.use('/ai', authMiddleware, aiRoutes);

    // Mount API routes
    this.app.use(`/api/${config.API_VERSION}`, apiRouter);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      logger.info(`🚀 TreinosApp API rodando na porta ${this.port}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
      logger.info(`📍 Health check: http://localhost:${this.port}/health`);
      logger.info(`📚 API info: http://localhost:${this.port}/api`);
      
      if (config.NODE_ENV === 'development') {
        logger.info(`🎯 API Base URL: http://localhost:${this.port}/api/${config.API_VERSION}`);
      }
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Initialize and start server
const server = new Server();

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server only if not in test environment
if (config.NODE_ENV !== 'test') {
  server.listen();
}

export default server;
/**
 * Global Error Handler Middleware
 * Tratamento centralizado de erros para a API
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config/environment';

// Error types
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    
    if (field) {
      this.message = `Validation error in field '${field}': ${message}`;
    }
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Token de autenticação inválido ou expirado') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Você não tem permissão para acessar este recurso') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} não encontrado`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Muitas requisições. Tente novamente em alguns minutos.') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    timestamp: string;
    path: string;
    method: string;
    details?: any;
    stack?: string;
  };
}

// Database error handler
function handleDatabaseError(error: any): AppError {
  // Prisma errors
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'campo';
    return new ConflictError(`Este ${field} já está em uso`);
  }

  if (error.code === 'P2025') {
    return new NotFoundError('Registro');
  }

  if (error.code === 'P2003') {
    return new ValidationError('Referência inválida para registro relacionado');
  }

  // PostgreSQL errors
  if (error.code === '23505') {
    return new ConflictError('Valor duplicado encontrado');
  }

  if (error.code === '23503') {
    return new ValidationError('Referência inválida para registro relacionado');
  }

  if (error.code === '23502') {
    return new ValidationError('Campo obrigatório não pode estar vazio');
  }

  // Generic database error
  return new AppError('Erro interno do banco de dados', 500, 'DATABASE_ERROR');
}

// JWT error handler
function handleJWTError(error: any): AppError {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Token de autenticação inválido');
  }

  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token de autenticação expirado');
  }

  if (error.name === 'NotBeforeError') {
    return new AuthenticationError('Token de autenticação ainda não é válido');
  }

  return new AuthenticationError();
}

// Validation error handler (Joi)
function handleValidationError(error: any): AppError {
  const messages = error.details?.map((detail: any) => {
    const field = detail.path?.join('.') || 'campo';
    return `${field}: ${detail.message}`;
  }).join(', ');

  return new ValidationError(messages || error.message);
}

// Main error handler middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Handle known error types
  if (error instanceof AppError) {
    appError = error;
  } else if (error.code && error.code.startsWith('P')) {
    // Prisma errors
    appError = handleDatabaseError(error);
  } else if (error.name && error.name.includes('JWT')) {
    // JWT errors
    appError = handleJWTError(error);
  } else if (error.name === 'ValidationError' && error.details) {
    // Joi validation errors
    appError = handleValidationError(error);
  } else if (error.name === 'MulterError') {
    // File upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      appError = new ValidationError('Arquivo muito grande. Tamanho máximo: 5MB');
    } else {
      appError = new ValidationError(`Erro no upload: ${error.message}`);
    }
  } else {
    // Unknown errors
    appError = new AppError(
      config.NODE_ENV === 'production' 
        ? 'Erro interno do servidor' 
        : error.message || 'Erro interno do servidor',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // Log error
  logger.error('API Error', {
    message: appError.message,
    code: appError.code,
    statusCode: appError.statusCode,
    stack: appError.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Prepare error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // Add stack trace in development
  if (config.NODE_ENV === 'development') {
    errorResponse.error.stack = appError.stack;
    errorResponse.error.details = {
      originalError: error.name,
      body: req.body,
      params: req.params,
      query: req.query
    };
  }

  // Send error response
  res.status(appError.statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
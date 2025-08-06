/**
 * Authentication Middleware
 * Middleware para autenticação JWT
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { AuthenticationError, AuthorizationError } from './errorHandler';
import { logger } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        tipo: 'personal' | 'student';
        iat?: number;
        exp?: number;
      };
    }
  }
}

interface JWTPayload {
  id: string;
  email: string;
  tipo: 'personal' | 'student';
  iat?: number;
  exp?: number;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AuthenticationError('Token de autenticação não fornecido');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Formato de token inválido. Use: Bearer <token>');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AuthenticationError('Token de autenticação não fornecido');
    }

    try {
      // Verify and decode token
      const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

      // Validate token payload
      if (!decoded.id || !decoded.email || !decoded.tipo) {
        throw new AuthenticationError('Token de autenticação inválido');
      }

      // Check if token is expired (additional check)
      if (decoded.exp && decoded.exp < Date.now() / 1000) {
        throw new AuthenticationError('Token de autenticação expirado');
      }

      // Attach user to request
      req.user = {
        id: decoded.id,
        email: decoded.email,
        tipo: decoded.tipo,
        iat: decoded.iat,
        exp: decoded.exp
      };

      // Log successful authentication
      logger.auth('Token validated', decoded.id, req.ip, req.get('User-Agent'));

      next();

    } catch (jwtError: any) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token de autenticação expirado');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Token de autenticação inválido');
      } else if (jwtError.name === 'NotBeforeError') {
        throw new AuthenticationError('Token de autenticação ainda não é válido');
      } else {
        throw new AuthenticationError('Erro ao validar token de autenticação');
      }
    }

  } catch (error) {
    // Log authentication failure
    logger.security('Authentication failed', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.path,
      error: error.message
    });

    next(error);
  }
};

// Middleware para verificar tipo de usuário
export const requireUserType = (allowedTypes: ('personal' | 'student')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AuthenticationError());
    }

    if (!allowedTypes.includes(req.user.tipo)) {
      logger.security('Authorization failed - insufficient privileges', {
        userId: req.user.id,
        userType: req.user.tipo,
        requiredTypes: allowedTypes,
        endpoint: req.path,
        ip: req.ip
      });

      return next(new AuthorizationError(
        `Acesso negado. Esta funcionalidade está disponível apenas para: ${allowedTypes.join(', ')}`
      ));
    }

    next();
  };
};

// Middleware para verificar se é Personal Trainer
export const requirePersonalTrainer = requireUserType(['personal']);

// Middleware para verificar se é Student
export const requireStudent = requireUserType(['student']);

// Middleware opcional de autenticação (não falha se não houver token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without user
  }

  const token = authHeader.substring(7);
  
  if (!token) {
    return next(); // Continue without user
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    
    if (decoded.id && decoded.email && decoded.tipo) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        tipo: decoded.tipo,
        iat: decoded.iat,
        exp: decoded.exp
      };
    }
  } catch (error) {
    // Ignore JWT errors in optional auth
    logger.debug('Optional auth failed', { error: error.message });
  }

  next();
};

// Utility function to extract user ID from request
export const getUserIdFromRequest = (req: Request): string => {
  if (!req.user?.id) {
    throw new AuthenticationError('Usuário não autenticado');
  }
  return req.user.id;
};

// Utility function to check if user owns resource
export const checkResourceOwnership = (
  resourceUserId: string,
  requestUserId: string,
  userType: 'personal' | 'student'
): boolean => {
  // User always owns their own resources
  if (resourceUserId === requestUserId) {
    return true;
  }

  // Personal trainers can access their students' resources
  // This would need additional logic to check trainer-student relationship
  // For now, only allow access to own resources
  return false;
};
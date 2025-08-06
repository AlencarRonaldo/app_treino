/**
 * 404 Not Found Handler
 * Handler para rotas não encontradas
 */

import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response): void => {
  const message = `Rota ${req.method} ${req.path} não encontrada`;
  
  // Log da tentativa de acesso a rota inexistente
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  res.status(404).json({
    success: false,
    error: {
      message,
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      availableEndpoints: {
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        workouts: '/api/v1/workouts',
        exercises: '/api/v1/exercises',
        progress: '/api/v1/progress',
        ai: '/api/v1/ai',
        health: '/health',
        info: '/api'
      }
    }
  });
};
/**
 * Request Validation Middleware
 * Middleware para validação de requisições usando Joi
 */

import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { logger } from '../utils/logger';

/**
 * Middleware para validar requisições usando esquemas Joi
 */
export const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Retorna todos os erros
      stripUnknown: true, // Remove campos não definidos no schema
      convert: true, // Converte tipos automaticamente
      errors: {
        wrap: {
          label: false // Remove aspas dos nomes dos campos
        }
      }
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Erro de validação:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        body: req.body
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Dados inválidos na requisição',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        }
      });
      return;
    }

    // Substitui o body pela versão validada e sanitizada
    req.body = value;
    next();
  };
};

/**
 * Middleware para validar query parameters
 */
export const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      errors: {
        wrap: {
          label: false
        }
      }
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Erro de validação de query:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        query: req.query
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Parâmetros de consulta inválidos',
          code: 'QUERY_VALIDATION_ERROR',
          details: validationErrors
        }
      });
      return;
    }

    req.query = value;
    next();
  };
};

/**
 * Middleware para validar parâmetros da URL
 */
export const validateParams = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
      errors: {
        wrap: {
          label: false
        }
      }
    });

    if (error) {
      const validationErrors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Erro de validação de parâmetros:', {
        path: req.path,
        method: req.method,
        errors: validationErrors,
        params: req.params
      });

      res.status(400).json({
        success: false,
        error: {
          message: 'Parâmetros da URL inválidos',
          code: 'PARAMS_VALIDATION_ERROR',
          details: validationErrors
        }
      });
      return;
    }

    req.params = value;
    next();
  };
};

/**
 * Middleware para validar arquivos enviados
 */
export const validateFile = (
  field: string,
  options: {
    required?: boolean;
    maxSize?: number; // em bytes
    allowedTypes?: string[];
  } = {}
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const file = req.file;
    const files = req.files;

    // Verificar se arquivo é obrigatório
    if (options.required && !file && (!files || Object.keys(files).length === 0)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Arquivo é obrigatório',
          code: 'FILE_REQUIRED',
          field
        }
      });
      return;
    }

    // Se não há arquivo e não é obrigatório, continua
    if (!file && (!files || Object.keys(files).length === 0)) {
      next();
      return;
    }

    const fileToValidate = file || (Array.isArray(files) ? files[0] : Object.values(files || {})[0]);

    if (Array.isArray(fileToValidate)) {
      res.status(400).json({
        success: false,
        error: {
          message: 'Múltiplos arquivos não permitidos',
          code: 'MULTIPLE_FILES_NOT_ALLOWED',
          field
        }
      });
      return;
    }

    // Validar tamanho
    if (options.maxSize && fileToValidate.size > options.maxSize) {
      res.status(400).json({
        success: false,
        error: {
          message: `Arquivo muito grande. Tamanho máximo: ${Math.round(options.maxSize / 1024 / 1024)}MB`,
          code: 'FILE_TOO_LARGE',
          field
        }
      });
      return;
    }

    // Validar tipo
    if (options.allowedTypes && !options.allowedTypes.includes(fileToValidate.mimetype)) {
      res.status(400).json({
        success: false,
        error: {
          message: `Tipo de arquivo não permitido. Tipos aceitos: ${options.allowedTypes.join(', ')}`,
          code: 'INVALID_FILE_TYPE',
          field
        }
      });
      return;
    }

    next();
  };
};
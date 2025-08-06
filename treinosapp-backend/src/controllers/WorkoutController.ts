/**
 * Workout Controller
 * Controlador para gerenciamento de treinos
 */

import { Response } from 'express';
import { WorkoutService } from '../services/WorkoutService';
import { 
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  DuplicateWorkoutRequest,
  ShareWorkoutRequest,
  StartWorkoutRequest,
  CompleteWorkoutRequest,
  AuthenticatedRequest,
  WorkoutQuery
} from '../types';
import { logger } from '../utils/logger';

export class WorkoutController {
  private workoutService: WorkoutService;

  constructor() {
    this.workoutService = new WorkoutService();
  }

  /**
   * Listar treinos do usuário
   */
  getWorkouts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const query = req.query as any;

      const workoutQuery: WorkoutQuery = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        search: query.search as string,
        category: query.category as any,
        difficulty: query.difficulty as any,
        muscleGroups: query.muscleGroups ? (Array.isArray(query.muscleGroups) ? query.muscleGroups : [query.muscleGroups]) : undefined,
        equipment: query.equipment ? (Array.isArray(query.equipment) ? query.equipment : [query.equipment]) : undefined,
        tags: query.tags ? (Array.isArray(query.tags) ? query.tags : [query.tags]) : undefined,
        isTemplate: query.isTemplate === 'true' ? true : query.isTemplate === 'false' ? false : undefined,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any
      };

      const result = await this.workoutService.getWorkouts(userId, workoutQuery);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Erro ao listar treinos:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Listar templates de treinos públicos
   */
  getWorkoutTemplates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const query = req.query as any;

      const workoutQuery: WorkoutQuery = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        search: query.search as string,
        category: query.category as any,
        difficulty: query.difficulty as any,
        muscleGroups: query.muscleGroups ? (Array.isArray(query.muscleGroups) ? query.muscleGroups : [query.muscleGroups]) : undefined,
        equipment: query.equipment ? (Array.isArray(query.equipment) ? query.equipment : [query.equipment]) : undefined,
        isTemplate: true,
        isPublic: true,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any
      };

      const result = await this.workoutService.getPublicTemplates(workoutQuery);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Erro ao listar templates:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Obter treino por ID
   */
  getWorkoutById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      
      const workout = await this.workoutService.getWorkoutById(userId, workoutId);
      
      res.json({
        success: true,
        data: workout
      });
    } catch (error: any) {
      logger.error('Erro ao obter treino:', error);
      
      if (error.code === 'WORKOUT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Treino não encontrado',
            code: 'WORKOUT_NOT_FOUND'
          }
        });
        return;
      }

      if (error.code === 'ACCESS_DENIED') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado a este treino',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Criar novo treino
   */
  createWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const workoutData: CreateWorkoutRequest = req.body;
      
      logger.info(`Criando treino para usuário: ${userId}`);
      
      const workout = await this.workoutService.createWorkout(userId, workoutData);
      
      res.status(201).json({
        success: true,
        message: 'Treino criado com sucesso',
        data: workout
      });
    } catch (error: any) {
      logger.error('Erro ao criar treino:', error);
      
      if (error.code === 'EXERCISE_NOT_FOUND') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Um ou mais exercícios não foram encontrados',
            code: 'EXERCISE_NOT_FOUND',
            details: error.details
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Atualizar treino
   */
  updateWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const updateData: UpdateWorkoutRequest = req.body;
      
      logger.info(`Atualizando treino ${workoutId} para usuário: ${userId}`);
      
      const workout = await this.workoutService.updateWorkout(userId, workoutId, updateData);
      
      res.json({
        success: true,
        message: 'Treino atualizado com sucesso',
        data: workout
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar treino:', error);
      
      if (error.code === 'WORKOUT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Treino não encontrado',
            code: 'WORKOUT_NOT_FOUND'
          }
        });
        return;
      }

      if (error.code === 'ACCESS_DENIED') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Você não pode editar este treino',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Deletar treino
   */
  deleteWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      
      logger.info(`Deletando treino ${workoutId} para usuário: ${userId}`);
      
      await this.workoutService.deleteWorkout(userId, workoutId);
      
      res.json({
        success: true,
        message: 'Treino deletado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao deletar treino:', error);
      
      if (error.code === 'WORKOUT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Treino não encontrado',
            code: 'WORKOUT_NOT_FOUND'
          }
        });
        return;
      }

      if (error.code === 'ACCESS_DENIED') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Você não pode deletar este treino',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Duplicar treino
   */
  duplicateWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const duplicateData: DuplicateWorkoutRequest = req.body;
      
      logger.info(`Duplicando treino ${workoutId} para usuário: ${userId}`);
      
      const workout = await this.workoutService.duplicateWorkout(userId, workoutId, duplicateData);
      
      res.status(201).json({
        success: true,
        message: 'Treino duplicado com sucesso',
        data: workout
      });
    } catch (error: any) {
      logger.error('Erro ao duplicar treino:', error);
      
      if (error.code === 'WORKOUT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Treino não encontrado',
            code: 'WORKOUT_NOT_FOUND'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Compartilhar treino
   */
  shareWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const shareData: ShareWorkoutRequest = req.body;
      
      logger.info(`Compartilhando treino ${workoutId} com ${shareData.userIds.length} usuários`);
      
      await this.workoutService.shareWorkout(userId, workoutId, shareData.userIds);
      
      res.json({
        success: true,
        message: 'Treino compartilhado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao compartilhar treino:', error);
      
      if (error.code === 'WORKOUT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Treino não encontrado',
            code: 'WORKOUT_NOT_FOUND'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Listar usuários com quem o treino foi compartilhado
   */
  getSharedWith = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      
      const sharedWith = await this.workoutService.getSharedWith(userId, workoutId);
      
      res.json({
        success: true,
        data: sharedWith
      });
    } catch (error: any) {
      logger.error('Erro ao obter compartilhamentos:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Remover compartilhamento
   */
  removeShare = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId, userId: targetUserId } = req.params;
      
      logger.info(`Removendo compartilhamento do treino ${workoutId} com usuário ${targetUserId}`);
      
      await this.workoutService.removeShare(userId, workoutId, targetUserId);
      
      res.json({
        success: true,
        message: 'Compartilhamento removido com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao remover compartilhamento:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Iniciar execução de treino
   */
  startWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const { notes } = req.body;
      
      logger.info(`Iniciando treino ${workoutId} para usuário: ${userId}`);
      
      const workoutLog = await this.workoutService.startWorkout(userId, workoutId, notes);
      
      res.status(201).json({
        success: true,
        message: 'Treino iniciado com sucesso',
        data: workoutLog
      });
    } catch (error: any) {
      logger.error('Erro ao iniciar treino:', error);
      
      if (error.code === 'WORKOUT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Treino não encontrado',
            code: 'WORKOUT_NOT_FOUND'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Completar execução de treino
   */
  completeWorkout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const completeData: CompleteWorkoutRequest = req.body;
      
      logger.info(`Completando treino ${workoutId} para usuário: ${userId}`);
      
      const workoutLog = await this.workoutService.completeWorkout(userId, completeData);
      
      res.json({
        success: true,
        message: 'Treino completado com sucesso',
        data: workoutLog
      });
    } catch (error: any) {
      logger.error('Erro ao completar treino:', error);
      
      if (error.code === 'WORKOUT_LOG_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Log de treino não encontrado',
            code: 'WORKOUT_LOG_NOT_FOUND'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Obter histórico de execuções do treino
   */
  getWorkoutLogs = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      const query = req.query as any;

      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;

      const result = await this.workoutService.getWorkoutLogs(userId, workoutId, { page, limit });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Erro ao obter logs de treino:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Obter detalhes de uma execução de treino
   */
  getWorkoutLogById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { logId } = req.params;
      
      const workoutLog = await this.workoutService.getWorkoutLogById(userId, logId);
      
      res.json({
        success: true,
        data: workoutLog
      });
    } catch (error: any) {
      logger.error('Erro ao obter log de treino:', error);
      
      if (error.code === 'WORKOUT_LOG_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Log de treino não encontrado',
            code: 'WORKOUT_LOG_NOT_FOUND'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Deletar log de treino
   */
  deleteWorkoutLog = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { logId } = req.params;
      
      logger.info(`Deletando log de treino ${logId} para usuário: ${userId}`);
      
      await this.workoutService.deleteWorkoutLog(userId, logId);
      
      res.json({
        success: true,
        message: 'Log de treino deletado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao deletar log de treino:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Obter estatísticas do treino
   */
  getWorkoutStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { workoutId } = req.params;
      
      const stats = await this.workoutService.getWorkoutStats(userId, workoutId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Erro ao obter estatísticas do treino:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };
}
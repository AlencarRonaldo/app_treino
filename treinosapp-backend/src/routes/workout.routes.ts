/**
 * Workout Routes
 * Rotas para gerenciamento de treinos
 */

import { Router } from 'express';
import Joi from 'joi';
import { WorkoutController } from '../controllers/WorkoutController';
import { validateRequest, validateQuery, validateParams } from '../middleware/validateRequest';
import { workoutValidation, queryValidation, idValidation } from '../utils/validation';

const router = Router();
const workoutController = new WorkoutController();

/**
 * @route   GET /api/v1/workouts
 * @desc    Listar treinos do usuário
 * @access  Private
 */
router.get(
  '/',
  validateQuery(queryValidation.pagination.concat(queryValidation.search)),
  workoutController.getWorkouts
);

/**
 * @route   GET /api/v1/workouts/templates
 * @desc    Listar templates de treinos públicos
 * @access  Private
 */
router.get(
  '/templates',
  validateQuery(queryValidation.pagination.concat(queryValidation.search)),
  workoutController.getWorkoutTemplates
);

/**
 * @route   GET /api/v1/workouts/:workoutId
 * @desc    Obter treino por ID
 * @access  Private
 */
router.get(
  '/:workoutId',
  validateParams(Joi.object({ workoutId: idValidation })),
  workoutController.getWorkoutById
);

/**
 * @route   POST /api/v1/workouts
 * @desc    Criar novo treino
 * @access  Private
 */
router.post(
  '/',
  validateRequest(workoutValidation.createWorkout),
  workoutController.createWorkout
);

/**
 * @route   PUT /api/v1/workouts/:workoutId
 * @desc    Atualizar treino
 * @access  Private
 */
router.put(
  '/:workoutId',
  validateParams(Joi.object({ workoutId: idValidation })),
  validateRequest(workoutValidation.updateWorkout),
  workoutController.updateWorkout
);

/**
 * @route   DELETE /api/v1/workouts/:workoutId
 * @desc    Deletar treino
 * @access  Private
 */
router.delete(
  '/:workoutId',
  validateParams(Joi.object({ workoutId: idValidation })),
  workoutController.deleteWorkout
);

/**
 * @route   POST /api/v1/workouts/:workoutId/duplicate
 * @desc    Duplicar treino
 * @access  Private
 */
router.post(
  '/:workoutId/duplicate',
  validateParams(Joi.object({ workoutId: idValidation })),
  validateRequest(workoutValidation.duplicateWorkout),
  workoutController.duplicateWorkout
);

/**
 * @route   POST /api/v1/workouts/:workoutId/share
 * @desc    Compartilhar treino
 * @access  Private
 */
router.post(
  '/:workoutId/share',
  validateParams(Joi.object({ workoutId: idValidation })),
  validateRequest(workoutValidation.shareWorkout),
  workoutController.shareWorkout
);

/**
 * @route   GET /api/v1/workouts/:workoutId/shared-with
 * @desc    Listar usuários com quem o treino foi compartilhado
 * @access  Private
 */
router.get(
  '/:workoutId/shared-with',
  validateParams(Joi.object({ workoutId: idValidation })),
  workoutController.getSharedWith
);

/**
 * @route   DELETE /api/v1/workouts/:workoutId/share/:userId
 * @desc    Remover compartilhamento
 * @access  Private
 */
router.delete(
  '/:workoutId/share/:userId',
  validateParams(Joi.object({ 
    workoutId: idValidation,
    userId: idValidation
  })),
  workoutController.removeShare
);

// Rotas para execução de treinos
/**
 * @route   POST /api/v1/workouts/:workoutId/start
 * @desc    Iniciar execução de treino
 * @access  Private
 */
router.post(
  '/:workoutId/start',
  validateParams(Joi.object({ workoutId: idValidation })),
  validateRequest(Joi.object({
    notes: Joi.string().max(1000).optional()
  })),
  workoutController.startWorkout
);

/**
 * @route   POST /api/v1/workouts/:workoutId/complete
 * @desc    Completar execução de treino
 * @access  Private
 */
router.post(
  '/:workoutId/complete',
  validateParams(Joi.object({ workoutId: idValidation })),
  validateRequest(Joi.object({
    workoutLogId: idValidation,
    notes: Joi.string().max(1000).optional(),
    rating: Joi.number().min(1).max(5).optional(),
    exerciseLogs: Joi.array().items(Joi.object({
      exerciseId: idValidation,
      setNumber: Joi.number().min(1).required(),
      reps: Joi.number().min(0).optional(),
      weight: Joi.number().min(0).optional(),
      duration: Joi.number().min(0).optional(),
      restTime: Joi.number().min(0).optional(),
      notes: Joi.string().max(500).optional(),
      completed: Joi.boolean().optional().default(true)
    })).required()
  })),
  workoutController.completeWorkout
);

/**
 * @route   GET /api/v1/workouts/:workoutId/logs
 * @desc    Obter histórico de execuções do treino
 * @access  Private
 */
router.get(
  '/:workoutId/logs',
  validateParams(Joi.object({ workoutId: idValidation })),
  validateQuery(queryValidation.pagination),
  workoutController.getWorkoutLogs
);

/**
 * @route   GET /api/v1/workouts/logs/:logId
 * @desc    Obter detalhes de uma execução de treino
 * @access  Private
 */
router.get(
  '/logs/:logId',
  validateParams(Joi.object({ logId: idValidation })),
  workoutController.getWorkoutLogById
);

/**
 * @route   DELETE /api/v1/workouts/logs/:logId
 * @desc    Deletar log de treino
 * @access  Private
 */
router.delete(
  '/logs/:logId',
  validateParams(Joi.object({ logId: idValidation })),
  workoutController.deleteWorkoutLog
);

/**
 * @route   GET /api/v1/workouts/:workoutId/stats
 * @desc    Obter estatísticas do treino
 * @access  Private
 */
router.get(
  '/:workoutId/stats',
  validateParams(Joi.object({ workoutId: idValidation })),
  workoutController.getWorkoutStats
);

export default router;
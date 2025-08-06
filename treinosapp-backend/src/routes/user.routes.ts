/**
 * User Routes
 * Rotas para gerenciamento de usuários e perfis
 */

import { Router } from 'express';
import Joi from 'joi';
import { UserController } from '../controllers/UserController';
import { validateRequest, validateQuery, validateParams } from '../middleware/validateRequest';
import { userValidation, queryValidation, idValidation } from '../utils/validation';

const router = Router();
const userController = new UserController();

/**
 * @route   GET /api/v1/users/profile
 * @desc    Obter perfil do usuário logado
 * @access  Private
 */
router.get(
  '/profile',
  userController.getProfile
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Atualizar perfil do usuário logado
 * @access  Private
 */
router.put(
  '/profile',
  validateRequest(userValidation.updateProfile),
  userController.updateProfile
);

/**
 * @route   GET /api/v1/users/dashboard
 * @desc    Obter dados do dashboard do usuário
 * @access  Private
 */
router.get(
  '/dashboard',
  userController.getDashboard
);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Obter estatísticas do usuário
 * @access  Private
 */
router.get(
  '/stats',
  userController.getStats
);

/**
 * @route   DELETE /api/v1/users/account
 * @desc    Deletar conta do usuário
 * @access  Private
 */
router.delete(
  '/account',
  userController.deleteAccount
);

// Rotas específicas para Personal Trainers
/**
 * @route   GET /api/v1/users/students
 * @desc    Listar alunos do personal trainer
 * @access  Private (Personal Trainer only)
 */
router.get(
  '/students',
  validateQuery(queryValidation.pagination.concat(queryValidation.search)),
  userController.getStudents
);

/**
 * @route   POST /api/v1/users/students/add
 * @desc    Adicionar aluno existente
 * @access  Private (Personal Trainer only)
 */
router.post(
  '/students/add',
  validateRequest(userValidation.addStudent),
  userController.addStudent
);

/**
 * @route   POST /api/v1/users/students/invite
 * @desc    Convidar novo aluno
 * @access  Private (Personal Trainer only)
 */
router.post(
  '/students/invite',
  validateRequest(userValidation.studentInvite),
  userController.inviteStudent
);

/**
 * @route   DELETE /api/v1/users/students/:studentId
 * @desc    Remover aluno
 * @access  Private (Personal Trainer only)
 */
router.delete(
  '/students/:studentId',
  validateParams(Joi.object({ studentId: idValidation })),
  userController.removeStudent
);

/**
 * @route   GET /api/v1/users/students/:studentId
 * @desc    Obter detalhes de um aluno
 * @access  Private (Personal Trainer only)
 */
router.get(
  '/students/:studentId',
  validateParams(Joi.object({ studentId: idValidation })),
  userController.getStudentDetails
);

/**
 * @route   GET /api/v1/users/students/:studentId/stats
 * @desc    Obter estatísticas de um aluno
 * @access  Private (Personal Trainer only)
 */
router.get(
  '/students/:studentId/stats',
  validateParams(Joi.object({ studentId: idValidation })),
  userController.getStudentStats
);

// Rotas específicas para Estudantes
/**
 * @route   GET /api/v1/users/trainer
 * @desc    Obter informações do personal trainer
 * @access  Private (Student only)
 */
router.get(
  '/trainer',
  userController.getPersonalTrainer
);

/**
 * @route   POST /api/v1/users/trainer/leave
 * @desc    Sair do personal trainer atual
 * @access  Private (Student only)
 */
router.post(
  '/trainer/leave',
  userController.leavePersonalTrainer
);

// Rotas administrativas
/**
 * @route   GET /api/v1/users
 * @desc    Listar usuários (Admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/',
  validateQuery(queryValidation.pagination.concat(queryValidation.search)),
  userController.getUsers
);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Obter usuário por ID (Admin only)
 * @access  Private (Admin only)
 */
router.get(
  '/:userId',
  validateParams(Joi.object({ userId: idValidation })),
  userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:userId/status
 * @desc    Atualizar status do usuário (Admin only)
 * @access  Private (Admin only)
 */
router.put(
  '/:userId/status',
  validateParams(Joi.object({ userId: idValidation })),
  validateRequest(Joi.object({
    isActive: Joi.boolean().required(),
    reason: Joi.string().max(500).optional()
  })),
  userController.updateUserStatus
);

export default router;
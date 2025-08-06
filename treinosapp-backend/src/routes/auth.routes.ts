/**
 * Authentication Routes
 * Rotas de autenticação e autorização
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest } from '../middleware/validateRequest';
import { authValidation } from '../utils/validation';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registrar novo usuário
 * @access  Public
 */
router.post(
  '/register',
  validateRequest(authValidation.register),
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login de usuário
 * @access  Public
 */
router.post(
  '/login',
  validateRequest(authValidation.login),
  authController.login
);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Autenticação com Google OAuth
 * @access  Public
 */
router.post(
  '/google',
  validateRequest(authValidation.googleAuth),
  authController.googleAuth
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Renovar token de acesso
 * @access  Public
 */
router.post(
  '/refresh',
  validateRequest(authValidation.refreshToken),
  authController.refreshToken
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout do usuário
 * @access  Private
 */
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Solicitar redefinição de senha
 * @access  Public
 */
router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPassword),
  authController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Redefinir senha com token
 * @access  Public
 */
router.post(
  '/reset-password',
  validateRequest(authValidation.resetPassword),
  authController.resetPassword
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Alterar senha (usuário logado)
 * @access  Private
 */
router.post(
  '/change-password',
  authMiddleware,
  validateRequest(authValidation.changePassword),
  authController.changePassword
);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verificar email do usuário
 * @access  Public
 */
router.post(
  '/verify-email/:token',
  authController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Reenviar email de verificação
 * @access  Private
 */
router.post(
  '/resend-verification',
  authMiddleware,
  authController.resendVerification
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Obter dados do usuário logado
 * @access  Private
 */
router.get(
  '/me',
  authMiddleware,
  authController.getCurrentUser
);

/**
 * @route   POST /api/v1/auth/check-email
 * @desc    Verificar se email já está em uso
 * @access  Public
 */
router.post(
  '/check-email',
  validateRequest(authValidation.forgotPassword), // Reusa validação de email
  authController.checkEmailAvailability
);

export default router;
/**
 * Auth Controller
 * Controlador de autenticação e autorização
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { 
  RegisterRequest, 
  LoginRequest, 
  GoogleAuthRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  AuthenticatedRequest
} from '../types';
import { logger } from '../utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Registrar novo usuário
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterRequest = req.body;
      
      logger.info(`Tentativa de registro para email: ${registerData.email}`);
      
      const result = await this.authService.register(registerData);
      
      logger.info(`Usuário registrado com sucesso: ${result.user.id}`);
      
      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso. Verifique seu email para ativar a conta.',
        data: result
      });
    } catch (error: any) {
      logger.error('Erro no registro:', error);
      
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          success: false,
          error: {
            message: 'Este email já está cadastrado',
            code: 'EMAIL_ALREADY_EXISTS',
            field: 'email'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Login de usuário
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const loginData: LoginRequest = req.body;
      
      logger.info(`Tentativa de login para email: ${loginData.email}`);
      
      const result = await this.authService.login(loginData);
      
      logger.info(`Login realizado com sucesso: ${result.user.id}`);
      
      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        data: result
      });
    } catch (error: any) {
      logger.error('Erro no login:', error);
      
      if (error.message === 'INVALID_CREDENTIALS') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Email ou senha incorretos',
            code: 'INVALID_CREDENTIALS'
          }
        });
        return;
      }
      
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Email não verificado. Verifique sua caixa de entrada.',
            code: 'EMAIL_NOT_VERIFIED'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Autenticação com Google OAuth
   */
  googleAuth = async (req: Request, res: Response): Promise<void> => {
    try {
      const googleData: GoogleAuthRequest = req.body;
      
      logger.info('Tentativa de autenticação Google OAuth');
      
      const result = await this.authService.googleAuth(googleData);
      
      logger.info(`Google OAuth realizado com sucesso: ${result.user.id}`);
      
      res.json({
        success: true,
        message: 'Autenticação Google realizada com sucesso',
        data: result
      });
    } catch (error: any) {
      logger.error('Erro na autenticação Google:', error);
      
      if (error.message === 'INVALID_GOOGLE_TOKEN') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Token do Google inválido',
            code: 'INVALID_GOOGLE_TOKEN'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Renovar token de acesso
   */
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken }: RefreshTokenRequest = req.body;
      
      logger.info('Tentativa de renovação de token');
      
      const result = await this.authService.refreshToken(refreshToken);
      
      logger.info(`Token renovado com sucesso: ${result.user.id}`);
      
      res.json({
        success: true,
        message: 'Token renovado com sucesso',
        data: result
      });
    } catch (error: any) {
      logger.error('Erro na renovação de token:', error);
      
      if (error.message === 'INVALID_REFRESH_TOKEN') {
        res.status(401).json({
          success: false,
          error: {
            message: 'Token de renovação inválido',
            code: 'INVALID_REFRESH_TOKEN'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Logout do usuário
   */
  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.userId;
      
      logger.info(`Logout do usuário: ${userId}`);
      
      await this.authService.logout(userId);
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro no logout:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Solicitar redefinição de senha
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email }: ForgotPasswordRequest = req.body;
      
      logger.info(`Solicitação de redefinição de senha para: ${email}`);
      
      await this.authService.forgotPassword(email);
      
      res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
      });
    } catch (error: any) {
      logger.error('Erro na solicitação de redefinição de senha:', error);
      
      // Sempre retorna sucesso por segurança
      res.json({
        success: true,
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
      });
    }
  };

  /**
   * Redefinir senha com token
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const resetData: ResetPasswordRequest = req.body;
      
      logger.info('Tentativa de redefinição de senha');
      
      await this.authService.resetPassword(resetData);
      
      res.json({
        success: true,
        message: 'Senha redefinida com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro na redefinição de senha:', error);
      
      if (error.message === 'INVALID_RESET_TOKEN') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Token de redefinição inválido ou expirado',
            code: 'INVALID_RESET_TOKEN'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Alterar senha (usuário logado)
   */
  changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.userId;
      const changeData: ChangePasswordRequest = req.body;
      
      logger.info(`Alteração de senha para usuário: ${userId}`);
      
      await this.authService.changePassword(userId, changeData);
      
      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro na alteração de senha:', error);
      
      if (error.message === 'INVALID_CURRENT_PASSWORD') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Senha atual incorreta',
            code: 'INVALID_CURRENT_PASSWORD',
            field: 'currentPassword'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Verificar email do usuário
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;
      
      logger.info('Tentativa de verificação de email');
      
      await this.authService.verifyEmail(token);
      
      res.json({
        success: true,
        message: 'Email verificado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro na verificação de email:', error);
      
      if (error.message === 'INVALID_VERIFY_TOKEN') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Token de verificação inválido ou expirado',
            code: 'INVALID_VERIFY_TOKEN'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Reenviar email de verificação
   */
  resendVerification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.userId;
      const userEmail = req.user.email;
      
      logger.info(`Reenvio de verificação de email para: ${userEmail}`);
      
      await this.authService.resendVerification(userId);
      
      res.json({
        success: true,
        message: 'Email de verificação reenviado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro no reenvio de verificação:', error);
      
      if (error.message === 'EMAIL_ALREADY_VERIFIED') {
        res.status(400).json({
          success: false,
          error: {
            message: 'Email já está verificado',
            code: 'EMAIL_ALREADY_VERIFIED'
          }
        });
        return;
      }
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Obter dados do usuário logado
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.userId;
      
      const user = await this.authService.getCurrentUser(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      logger.error('Erro ao obter usuário atual:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };

  /**
   * Verificar se email já está em uso
   */
  checkEmailAvailability = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      
      const isAvailable = await this.authService.checkEmailAvailability(email);
      
      res.json({
        success: true,
        data: {
          email,
          available: isAvailable
        }
      });
    } catch (error: any) {
      logger.error('Erro ao verificar disponibilidade de email:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.message || 'INTERNAL_ERROR'
        }
      });
    }
  };
}
/**
 * Auth Service
 * Serviço de autenticação e autorização
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient, User, UserType } from '@prisma/client';
import { 
  RegisterRequest, 
  LoginRequest, 
  GoogleAuthRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  TokenPair,
  AuthUser,
  JWTPayload
} from '../types';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { EmailService } from './EmailService';

export class AuthService {
  private prisma: PrismaClient;
  private emailService: EmailService;
  private googleClient: OAuth2Client;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
    this.googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);
  }

  /**
   * Registrar novo usuário
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      // Verificar se email já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(data.password, config.BCRYPT_ROUNDS);

      // Gerar token de verificação de email
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');

      // Criar usuário
      const user = await this.prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          name: data.name,
          userType: data.userType,
          birthDate: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender,
          height: data.height,
          weight: data.weight,
          emailVerifyToken,
          goals: JSON.stringify([]),
          notifications: JSON.stringify({
            workout: true,
            progress: true,
            social: true
          })
        }
      });

      // Gerar tokens
      const tokens = this.generateTokens(user);

      // Enviar email de verificação
      await this.emailService.sendVerificationEmail(user.email, user.name, emailVerifyToken);

      // Mapear para AuthUser
      const authUser = this.mapToAuthUser(user);

      logger.info(`Usuário registrado: ${user.id} - ${user.email}`);

      return {
        user: authUser,
        tokens
      };
    } catch (error: any) {
      logger.error('Erro no registro:', error);
      throw new Error(error.message === 'EMAIL_ALREADY_EXISTS' ? 'EMAIL_ALREADY_EXISTS' : 'REGISTRATION_FAILED');
    }
  }

  /**
   * Login de usuário
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (!user || !user.password) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Verificar se email foi verificado
      if (!user.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      // Atualizar último login
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Gerar tokens
      const tokens = this.generateTokens(user);

      // Mapear para AuthUser
      const authUser = this.mapToAuthUser(user);

      logger.info(`Login realizado: ${user.id} - ${user.email}`);

      return {
        user: authUser,
        tokens
      };
    } catch (error: any) {
      logger.error('Erro no login:', error);
      throw error;
    }
  }

  /**
   * Autenticação com Google OAuth
   */
  async googleAuth(data: GoogleAuthRequest): Promise<AuthResponse> {
    try {
      // Verificar token do Google
      const ticket = await this.googleClient.verifyIdToken({
        idToken: data.idToken,
        audience: config.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('INVALID_GOOGLE_TOKEN');
      }

      const { email, name, picture, sub: googleId } = payload;

      if (!email) {
        throw new Error('INVALID_GOOGLE_TOKEN');
      }

      // Buscar usuário existente
      let user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { googleId }
          ]
        }
      });

      if (user) {
        // Usuário existe - atualizar dados do Google se necessário
        if (!user.profilePicture) {
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: {
              profilePicture: picture,
              emailVerified: true,
              lastLogin: new Date()
            }
          });
        } else {
          // Atualizar último login
          user = await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
          });
        }
      } else {
        // Criar novo usuário
        user = await this.prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: name || 'Usuário Google',
            profilePicture: picture,
            userType: data.userType,
            emailVerified: true,
            isEmailVerified: true,
            googleId,
            goals: JSON.stringify([]),
            notifications: JSON.stringify({
              workout: true,
              progress: true,
              social: true
            })
          }
        });
      }

      // Gerar tokens
      const tokens = this.generateTokens(user);

      // Mapear para AuthUser
      const authUser = this.mapToAuthUser(user);

      logger.info(`Google OAuth realizado: ${user.id} - ${user.email}`);

      return {
        user: authUser,
        tokens
      };
    } catch (error: any) {
      logger.error('Erro na autenticação Google:', error);
      throw new Error('INVALID_GOOGLE_TOKEN');
    }
  }

  /**
   * Renovar token de acesso
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // Verificar token
      const decoded = jwt.verify(refreshToken, config.JWT_SECRET) as JWTPayload;

      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId }
      });

      if (!user) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      // Gerar novos tokens
      const tokens = this.generateTokens(user);

      // Mapear para AuthUser
      const authUser = this.mapToAuthUser(user);

      logger.info(`Token renovado: ${user.id}`);

      return {
        user: authUser,
        tokens
      };
    } catch (error: any) {
      logger.error('Erro na renovação de token:', error);
      throw new Error('INVALID_REFRESH_TOKEN');
    }
  }

  /**
   * Logout do usuário
   */
  async logout(userId: string): Promise<void> {
    try {
      // Pode implementar blacklist de tokens aqui se necessário
      // Por enquanto apenas registra o logout
      logger.info(`Logout realizado: ${userId}`);
    } catch (error: any) {
      logger.error('Erro no logout:', error);
      throw error;
    }
  }

  /**
   * Solicitar redefinição de senha
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Por segurança, não revelamos se o email existe
        return;
      }

      // Gerar token de reset
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      // Salvar token no banco
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: resetExpires
        }
      });

      // Enviar email
      await this.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);

      logger.info(`Reset de senha solicitado: ${user.email}`);
    } catch (error: any) {
      logger.error('Erro na solicitação de reset de senha:', error);
      // Não propaga o erro por segurança
    }
  }

  /**
   * Redefinir senha com token
   */
  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    try {
      // Buscar usuário com token válido
      const user = await this.prisma.user.findFirst({
        where: {
          resetPasswordToken: data.token,
          resetPasswordExpires: {
            gt: new Date()
          }
        }
      });

      if (!user) {
        throw new Error('INVALID_RESET_TOKEN');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(data.newPassword, config.BCRYPT_ROUNDS);

      // Atualizar senha e limpar tokens
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });

      logger.info(`Senha redefinida: ${user.id}`);
    } catch (error: any) {
      logger.error('Erro na redefinição de senha:', error);
      throw error;
    }
  }

  /**
   * Alterar senha (usuário logado)
   */
  async changePassword(userId: string, data: ChangePasswordRequest): Promise<void> {
    try {
      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user || !user.password) {
        throw new Error('USER_NOT_FOUND');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('INVALID_CURRENT_PASSWORD');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(data.newPassword, config.BCRYPT_ROUNDS);

      // Atualizar senha
      await this.prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      logger.info(`Senha alterada: ${userId}`);
    } catch (error: any) {
      logger.error('Erro na alteração de senha:', error);
      throw error;
    }
  }

  /**
   * Verificar email do usuário
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      // Buscar usuário com token
      const user = await this.prisma.user.findFirst({
        where: { emailVerifyToken: token }
      });

      if (!user) {
        throw new Error('INVALID_VERIFY_TOKEN');
      }

      // Marcar email como verificado
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isEmailVerified: true,
          emailVerifyToken: null
        }
      });

      logger.info(`Email verificado: ${user.id}`);
    } catch (error: any) {
      logger.error('Erro na verificação de email:', error);
      throw error;
    }
  }

  /**
   * Reenviar email de verificação
   */
  async resendVerification(userId: string): Promise<void> {
    try {
      // Buscar usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.isEmailVerified) {
        throw new Error('EMAIL_ALREADY_VERIFIED');
      }

      // Gerar novo token
      const emailVerifyToken = crypto.randomBytes(32).toString('hex');

      // Atualizar token no banco
      await this.prisma.user.update({
        where: { id: userId },
        data: { emailVerifyToken }
      });

      // Enviar email
      await this.emailService.sendVerificationEmail(user.email, user.name, emailVerifyToken);

      logger.info(`Verificação reenviada: ${user.email}`);
    } catch (error: any) {
      logger.error('Erro no reenvio de verificação:', error);
      throw error;
    }
  }

  /**
   * Obter dados do usuário logado
   */
  async getCurrentUser(userId: string): Promise<AuthUser> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return this.mapToAuthUser(user);
    } catch (error: any) {
      logger.error('Erro ao obter usuário atual:', error);
      throw error;
    }
  }

  /**
   * Verificar se email já está em uso
   */
  async checkEmailAvailability(email: string): Promise<boolean> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      return !existingUser;
    } catch (error: any) {
      logger.error('Erro ao verificar disponibilidade de email:', error);
      throw error;
    }
  }

  /**
   * Gerar tokens JWT
   */
  private generateTokens(user: User): TokenPair {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      userType: user.userType
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN
    });

    const refreshToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN
    });

    // Calcular tempo de expiração (7 dias por padrão)
    const expiresIn = 7 * 24 * 60 * 60; // 7 dias em segundos

    return {
      accessToken,
      refreshToken,
      expiresIn,
      tokenType: 'Bearer'
    };
  }

  /**
   * Mapear User do Prisma para AuthUser
   */
  private mapToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified || user.emailVerified,
      preferredLanguage: user.preferredLanguage || 'pt-BR',
      timezone: user.timezone || 'America/Sao_Paulo',
      notifications: user.notifications ? JSON.parse(user.notifications) : {
        workout: true,
        progress: true,
        social: true
      },
      personalTrainerId: user.trainerId,
      createdAt: user.createdAt?.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() || user.lastLogin?.toISOString()
    };
  }
}
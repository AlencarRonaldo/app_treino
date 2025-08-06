/**
 * User Controller
 * Controlador para gerenciamento de usuários e perfis
 */

import { Response } from 'express';
import { UserService } from '../services/UserService';
import { 
  UpdateProfileRequest,
  AuthenticatedRequest,
  AddStudentRequest,
  StudentInviteRequest,
  UserQuery
} from '../types';
import { logger } from '../utils/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Obter perfil do usuário logado
   */
  getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      
      const profile = await this.userService.getProfile(userId);
      
      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      logger.error('Erro ao obter perfil:', error);
      
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
   * Atualizar perfil do usuário logado
   */
  updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const updateData: UpdateProfileRequest = req.body;
      
      logger.info(`Atualizando perfil do usuário: ${userId}`);
      
      const updatedProfile = await this.userService.updateProfile(userId, updateData);
      
      res.json({
        success: true,
        message: 'Perfil atualizado com sucesso',
        data: updatedProfile
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar perfil:', error);
      
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
   * Obter dados do dashboard do usuário
   */
  getDashboard = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;
      
      const dashboardData = await this.userService.getDashboard(userId, userType);
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error: any) {
      logger.error('Erro ao obter dashboard:', error);
      
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
   * Obter estatísticas do usuário
   */
  getStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      
      const stats = await this.userService.getStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Erro ao obter estatísticas:', error);
      
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
   * Deletar conta do usuário
   */
  deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      
      logger.info(`Deletando conta do usuário: ${userId}`);
      
      await this.userService.deleteAccount(userId);
      
      res.json({
        success: true,
        message: 'Conta deletada com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao deletar conta:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  // Métodos para Personal Trainers
  /**
   * Listar alunos do personal trainer
   */
  getStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const personalTrainerId = req.user.id;
      
      // Verificar se é personal trainer
      if (req.user.userType !== 'PERSONAL_TRAINER') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Apenas personal trainers podem acessar esta funcionalidade.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const query = req.query as any;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 20;
      const search = query.search as string;

      const result = await this.userService.getStudents(personalTrainerId, {
        page,
        limit,
        search
      });
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Erro ao listar alunos:', error);
      
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
   * Adicionar aluno existente
   */
  addStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const personalTrainerId = req.user.id;
      const { studentEmail }: AddStudentRequest = req.body;
      
      // Verificar se é personal trainer
      if (req.user.userType !== 'PERSONAL_TRAINER') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Apenas personal trainers podem adicionar alunos.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      logger.info(`Personal trainer ${personalTrainerId} adicionando aluno: ${studentEmail}`);
      
      const student = await this.userService.addStudent(personalTrainerId, studentEmail);
      
      res.json({
        success: true,
        message: 'Aluno adicionado com sucesso',
        data: student
      });
    } catch (error: any) {
      logger.error('Erro ao adicionar aluno:', error);
      
      if (error.code === 'STUDENT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Usuário não encontrado ou não é um aluno',
            code: 'STUDENT_NOT_FOUND'
          }
        });
        return;
      }

      if (error.code === 'STUDENT_ALREADY_ASSIGNED') {
        res.status(409).json({
          success: false,
          error: {
            message: 'Este aluno já possui um personal trainer',
            code: 'STUDENT_ALREADY_ASSIGNED'
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
   * Convidar novo aluno
   */
  inviteStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const personalTrainerId = req.user.id;
      const inviteData: StudentInviteRequest = req.body;
      
      // Verificar se é personal trainer
      if (req.user.userType !== 'PERSONAL_TRAINER') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Apenas personal trainers podem convidar alunos.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      logger.info(`Personal trainer ${personalTrainerId} convidando: ${inviteData.email}`);
      
      await this.userService.inviteStudent(personalTrainerId, inviteData);
      
      res.json({
        success: true,
        message: 'Convite enviado com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao convidar aluno:', error);
      
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        res.status(409).json({
          success: false,
          error: {
            message: 'Este email já está cadastrado. Use a opção "Adicionar Aluno Existente".',
            code: 'EMAIL_ALREADY_EXISTS'
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
   * Remover aluno
   */
  removeStudent = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const personalTrainerId = req.user.id;
      const { studentId } = req.params;
      
      // Verificar se é personal trainer
      if (req.user.userType !== 'PERSONAL_TRAINER') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Apenas personal trainers podem remover alunos.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      logger.info(`Personal trainer ${personalTrainerId} removendo aluno: ${studentId}`);
      
      await this.userService.removeStudent(personalTrainerId, studentId);
      
      res.json({
        success: true,
        message: 'Aluno removido com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao remover aluno:', error);
      
      if (error.code === 'STUDENT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Aluno não encontrado',
            code: 'STUDENT_NOT_FOUND'
          }
        });
        return;
      }

      if (error.code === 'NOT_YOUR_STUDENT') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Você não pode remover um aluno que não é seu',
            code: 'NOT_YOUR_STUDENT'
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
   * Obter detalhes de um aluno
   */
  getStudentDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const personalTrainerId = req.user.id;
      const { studentId } = req.params;
      
      // Verificar se é personal trainer
      if (req.user.userType !== 'PERSONAL_TRAINER') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const studentDetails = await this.userService.getStudentDetails(personalTrainerId, studentId);
      
      res.json({
        success: true,
        data: studentDetails
      });
    } catch (error: any) {
      logger.error('Erro ao obter detalhes do aluno:', error);
      
      if (error.code === 'STUDENT_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Aluno não encontrado',
            code: 'STUDENT_NOT_FOUND'
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
   * Obter estatísticas de um aluno
   */
  getStudentStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const personalTrainerId = req.user.id;
      const { studentId } = req.params;
      
      // Verificar se é personal trainer
      if (req.user.userType !== 'PERSONAL_TRAINER') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const studentStats = await this.userService.getStudentStats(personalTrainerId, studentId);
      
      res.json({
        success: true,
        data: studentStats
      });
    } catch (error: any) {
      logger.error('Erro ao obter estatísticas do aluno:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  // Métodos para Estudantes
  /**
   * Obter informações do personal trainer
   */
  getPersonalTrainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.user.id;
      
      // Verificar se é estudante
      if (req.user.userType !== 'STUDENT') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Apenas alunos podem acessar esta funcionalidade.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const personalTrainer = await this.userService.getPersonalTrainer(studentId);
      
      res.json({
        success: true,
        data: personalTrainer
      });
    } catch (error: any) {
      logger.error('Erro ao obter personal trainer:', error);
      
      if (error.code === 'NO_PERSONAL_TRAINER') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Você não possui um personal trainer ainda',
            code: 'NO_PERSONAL_TRAINER'
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
   * Sair do personal trainer atual
   */
  leavePersonalTrainer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const studentId = req.user.id;
      
      // Verificar se é estudante
      if (req.user.userType !== 'STUDENT') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      logger.info(`Aluno ${studentId} saindo do personal trainer`);
      
      await this.userService.leavePersonalTrainer(studentId);
      
      res.json({
        success: true,
        message: 'Você saiu do seu personal trainer com sucesso'
      });
    } catch (error: any) {
      logger.error('Erro ao sair do personal trainer:', error);
      
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Erro interno do servidor',
          code: error.code || 'INTERNAL_ERROR'
        }
      });
    }
  };

  // Métodos administrativos
  /**
   * Listar usuários (Admin only)
   */
  getUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Verificar se é admin
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado. Apenas administradores podem acessar esta funcionalidade.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const query = req.query as any;
      const userQuery: UserQuery = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 20,
        search: query.search as string,
        userType: query.userType as any,
        sortBy: query.sortBy as any,
        sortOrder: query.sortOrder as any
      };

      const result = await this.userService.getUsers(userQuery);
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Erro ao listar usuários:', error);
      
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
   * Obter usuário por ID (Admin only)
   */
  getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Verificar se é admin
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const { userId } = req.params;
      
      const user = await this.userService.getUserById(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error: any) {
      logger.error('Erro ao obter usuário:', error);
      
      if (error.code === 'USER_NOT_FOUND') {
        res.status(404).json({
          success: false,
          error: {
            message: 'Usuário não encontrado',
            code: 'USER_NOT_FOUND'
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
   * Atualizar status do usuário (Admin only)
   */
  updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Verificar se é admin
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            message: 'Acesso negado.',
            code: 'ACCESS_DENIED'
          }
        });
        return;
      }

      const { userId } = req.params;
      const { isActive, reason } = req.body;
      
      logger.info(`Admin ${req.user.id} atualizando status do usuário ${userId}: ${isActive ? 'ativo' : 'inativo'}`);
      
      await this.userService.updateUserStatus(userId, isActive, reason);
      
      res.json({
        success: true,
        message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`
      });
    } catch (error: any) {
      logger.error('Erro ao atualizar status do usuário:', error);
      
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
/**
 * User Service
 * Serviço para gerenciamento de usuários e perfis
 */

import { PrismaClient, UserType } from '@prisma/client';
import { 
  UpdateProfileRequest,
  ProfileResponse,
  DashboardData,
  UserStats,
  StudentResponse,
  AddStudentRequest,
  StudentInviteRequest,
  UserQuery,
  UserResponse,
  PaginatedResponse
} from '../types';
import { logger } from '../utils/logger';
import { EmailService } from './EmailService';
import crypto from 'crypto';

export class UserService {
  private prisma: PrismaClient;
  private emailService: EmailService;

  constructor() {
    this.prisma = new PrismaClient();
    this.emailService = new EmailService();
  }

  /**
   * Obter perfil completo do usuário
   */
  async getProfile(userId: string): Promise<ProfileResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          personalTrainer: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          },
          students: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              dateOfBirth: true,
              gender: true,
              height: true,
              weight: true,
              activityLevel: true,
              goals: true,
              createdAt: true,
              lastLoginAt: true
            },
            where: {
              userType: 'STUDENT'
            }
          }
        }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Obter estatísticas do usuário
      const stats = await this.getStats(userId);

      const profile: ProfileResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profilePicture,
        userType: user.userType,
        isEmailVerified: user.isEmailVerified,
        dateOfBirth: user.dateOfBirth?.toISOString(),
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        activityLevel: user.activityLevel,
        goals: user.goals,
        preferredLanguage: user.preferredLanguage,
        timezone: user.timezone,
        notifications: user.notifications as any,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
        personalTrainer: user.personalTrainer,
        students: user.students.map(this.mapToStudentResponse),
        stats
      };

      return profile;
    } catch (error: any) {
      logger.error('Erro ao obter perfil:', error);
      throw error;
    }
  }

  /**
   * Atualizar perfil do usuário
   */
  async updateProfile(userId: string, data: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          profilePicture: data.profilePicture,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
          gender: data.gender,
          height: data.height,
          weight: data.weight,
          activityLevel: data.activityLevel,
          goals: data.goals,
          preferredLanguage: data.preferredLanguage,
          timezone: data.timezone,
          notifications: data.notifications as any
        },
        include: {
          personalTrainer: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          }
        }
      });

      logger.info(`Perfil atualizado: ${userId}`);

      return this.mapToProfileResponse(updatedUser);
    } catch (error: any) {
      logger.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  /**
   * Obter dados do dashboard
   */
  async getDashboard(userId: string, userType: UserType): Promise<DashboardData> {
    try {
      const user = await this.getProfile(userId);
      const stats = await this.getStats(userId);

      // Obter treinos recentes
      const recentWorkouts = await this.prisma.workoutLog.findMany({
        where: { userId },
        include: {
          workout: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      });

      // Obter treinos próximos (se aplicável)
      const upcomingWorkouts: any[] = []; // TODO: Implementar agendamento

      // Obter highlights de progresso
      const progressHighlights = await this.getProgressHighlights(userId);

      // Obter conquistas recentes
      const achievements = await this.getRecentAchievements(userId);

      const dashboardData: DashboardData = {
        user,
        stats,
        recentWorkouts: recentWorkouts.map(log => ({
          id: log.workout.id,
          name: log.workout.name,
          completedAt: log.completedAt?.toISOString() || log.startedAt.toISOString(),
          duration: log.duration || 0,
          rating: log.rating
        })),
        upcomingWorkouts,
        progressHighlights,
        achievements
      };

      return dashboardData;
    } catch (error: any) {
      logger.error('Erro ao obter dashboard:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do usuário
   */
  async getStats(userId: string): Promise<UserStats> {
    try {
      // Obter totais básicos
      const [totalWorkouts, totalDuration, workoutLogs] = await Promise.all([
        this.prisma.workoutLog.count({
          where: { userId, completedAt: { not: null } }
        }),
        this.prisma.workoutLog.aggregate({
          where: { userId, completedAt: { not: null } },
          _sum: { duration: true }
        }),
        this.prisma.workoutLog.findMany({
          where: { userId, completedAt: { not: null } },
          include: {
            workout: {
              select: {
                category: true,
                equipment: true
              }
            }
          },
          orderBy: { completedAt: 'desc' }
        })
      ]);

      const totalDurationMinutes = totalDuration._sum.duration || 0;
      const averageWorkoutDuration = totalWorkouts > 0 ? totalDurationMinutes / totalWorkouts : 0;

      // Calcular frequência semanal (últimas 4 semanas)
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
      
      const recentWorkouts = workoutLogs.filter(log => 
        log.completedAt && log.completedAt >= fourWeeksAgo
      );
      
      const workoutFrequency = recentWorkouts.length / 4; // por semana

      // Calcular taxa de conclusão (últimas 50 tentativas)
      const recentAttempts = await this.prisma.workoutLog.findMany({
        where: { userId },
        orderBy: { startedAt: 'desc' },
        take: 50
      });

      const completedAttempts = recentAttempts.filter(log => log.completedAt).length;
      const completionRate = recentAttempts.length > 0 ? (completedAttempts / recentAttempts.length) * 100 : 0;

      // Calcular streaks
      const { currentStreak, longestStreak } = await this.calculateStreaks(userId);

      // Calcular avaliação média
      const ratingsAggregate = await this.prisma.workoutLog.aggregate({
        where: { userId, rating: { not: null } },
        _avg: { rating: true }
      });
      
      const averageRating = ratingsAggregate._avg.rating || 0;

      // Encontrar categoria favorita
      const categoryCount: Record<string, number> = {};
      workoutLogs.forEach(log => {
        const category = log.workout.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });
      
      const favoriteWorkoutCategory = Object.keys(categoryCount).reduce((a, b) => 
        categoryCount[a] > categoryCount[b] ? a : b
      , 'STRENGTH_TRAINING');

      // Encontrar equipamentos mais usados
      const equipmentCount: Record<string, number> = {};
      workoutLogs.forEach(log => {
        log.workout.equipment.forEach(eq => {
          equipmentCount[eq] = (equipmentCount[eq] || 0) + 1;
        });
      });
      
      const mostUsedEquipment = Object.keys(equipmentCount)
        .sort((a, b) => equipmentCount[b] - equipmentCount[a])
        .slice(0, 5);

      // Obter recordes pessoais
      const personalRecords = await this.getPersonalRecords(userId);

      // Atividade recente (últimos 30 dias)
      const recentActivity = await this.getRecentActivity(userId);

      // Resumo de progresso
      const progressSummary = await this.getProgressSummary(userId);

      const stats: UserStats = {
        totalWorkouts,
        totalDuration: totalDurationMinutes,
        averageWorkoutDuration,
        workoutFrequency,
        completionRate,
        currentStreak,
        longestStreak,
        averageRating,
        favoriteWorkoutCategory,
        mostUsedEquipment,
        personalRecords,
        recentActivity,
        progressSummary
      };

      return stats;
    } catch (error: any) {
      logger.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Deletar conta do usuário
   */
  async deleteAccount(userId: string): Promise<void> {
    try {
      // Soft delete - apenas marcar como inativo
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.com`,
          name: 'Conta Deletada',
          isEmailVerified: false,
          profilePicture: null,
          // Manter outros dados para integridade referencial
        }
      });

      logger.info(`Conta deletada: ${userId}`);
    } catch (error: any) {
      logger.error('Erro ao deletar conta:', error);
      throw error;
    }
  }

  // Métodos para Personal Trainers
  /**
   * Listar alunos do personal trainer
   */
  async getStudents(personalTrainerId: string, query: {
    page: number;
    limit: number;
    search?: string;
  }): Promise<PaginatedResponse<StudentResponse>> {
    try {
      const { page, limit, search } = query;
      const skip = (page - 1) * limit;

      const where: any = {
        personalTrainerId,
        userType: 'STUDENT'
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [students, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: 'asc' }
        }),
        this.prisma.user.count({ where })
      ]);

      const data = students.map(this.mapToStudentResponse);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      logger.error('Erro ao listar alunos:', error);
      throw error;
    }
  }

  /**
   * Adicionar aluno existente
   */
  async addStudent(personalTrainerId: string, studentEmail: string): Promise<StudentResponse> {
    try {
      // Buscar o estudante
      const student = await this.prisma.user.findUnique({
        where: { email: studentEmail.toLowerCase() }
      });

      if (!student || student.userType !== 'STUDENT') {
        throw new Error('STUDENT_NOT_FOUND');
      }

      if (student.personalTrainerId) {
        throw new Error('STUDENT_ALREADY_ASSIGNED');
      }

      // Atribuir o personal trainer
      const updatedStudent = await this.prisma.user.update({
        where: { id: student.id },
        data: { personalTrainerId }
      });

      logger.info(`Aluno ${student.id} adicionado ao personal trainer ${personalTrainerId}`);

      return this.mapToStudentResponse(updatedStudent);
    } catch (error: any) {
      logger.error('Erro ao adicionar aluno:', error);
      throw error;
    }
  }

  /**
   * Convidar novo aluno
   */
  async inviteStudent(personalTrainerId: string, inviteData: StudentInviteRequest): Promise<void> {
    try {
      // Verificar se email já existe
      const existingUser = await this.prisma.user.findUnique({
        where: { email: inviteData.email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      // Buscar dados do personal trainer
      const personalTrainer = await this.prisma.user.findUnique({
        where: { id: personalTrainerId },
        select: { name: true }
      });

      if (!personalTrainer) {
        throw new Error('PERSONAL_TRAINER_NOT_FOUND');
      }

      // Gerar token de convite
      const inviteToken = crypto.randomBytes(32).toString('hex');

      // Enviar email de convite
      await this.emailService.sendStudentInviteEmail(
        inviteData.email,
        inviteData.name,
        personalTrainer.name,
        inviteToken,
        inviteData.personalMessage
      );

      // TODO: Salvar convite no banco para processar depois
      
      logger.info(`Convite enviado para ${inviteData.email} pelo personal trainer ${personalTrainerId}`);
    } catch (error: any) {
      logger.error('Erro ao convidar aluno:', error);
      throw error;
    }
  }

  /**
   * Remover aluno
   */
  async removeStudent(personalTrainerId: string, studentId: string): Promise<void> {
    try {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId }
      });

      if (!student || student.userType !== 'STUDENT') {
        throw new Error('STUDENT_NOT_FOUND');
      }

      if (student.personalTrainerId !== personalTrainerId) {
        throw new Error('NOT_YOUR_STUDENT');
      }

      // Remover associação
      await this.prisma.user.update({
        where: { id: studentId },
        data: { personalTrainerId: null }
      });

      logger.info(`Aluno ${studentId} removido do personal trainer ${personalTrainerId}`);
    } catch (error: any) {
      logger.error('Erro ao remover aluno:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de um aluno
   */
  async getStudentDetails(personalTrainerId: string, studentId: string): Promise<ProfileResponse> {
    try {
      const student = await this.prisma.user.findUnique({
        where: { 
          id: studentId,
          personalTrainerId,
          userType: 'STUDENT'
        }
      });

      if (!student) {
        throw new Error('STUDENT_NOT_FOUND');
      }

      return this.getProfile(studentId);
    } catch (error: any) {
      logger.error('Erro ao obter detalhes do aluno:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas de um aluno
   */
  async getStudentStats(personalTrainerId: string, studentId: string): Promise<UserStats> {
    try {
      const student = await this.prisma.user.findUnique({
        where: { 
          id: studentId,
          personalTrainerId,
          userType: 'STUDENT'
        }
      });

      if (!student) {
        throw new Error('STUDENT_NOT_FOUND');
      }

      return this.getStats(studentId);
    } catch (error: any) {
      logger.error('Erro ao obter estatísticas do aluno:', error);
      throw error;
    }
  }

  // Métodos para Estudantes
  /**
   * Obter informações do personal trainer
   */
  async getPersonalTrainer(studentId: string): Promise<any> {
    try {
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
        include: {
          personalTrainer: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              createdAt: true
            }
          }
        }
      });

      if (!student?.personalTrainer) {
        throw new Error('NO_PERSONAL_TRAINER');
      }

      return student.personalTrainer;
    } catch (error: any) {
      logger.error('Erro ao obter personal trainer:', error);
      throw error;
    }
  }

  /**
   * Sair do personal trainer atual
   */
  async leavePersonalTrainer(studentId: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: studentId },
        data: { personalTrainerId: null }
      });

      logger.info(`Aluno ${studentId} saiu do personal trainer`);
    } catch (error: any) {
      logger.error('Erro ao sair do personal trainer:', error);
      throw error;
    }
  }

  // Métodos administrativos
  /**
   * Listar usuários (Admin)
   */
  async getUsers(query: UserQuery): Promise<PaginatedResponse<UserResponse>> {
    try {
      const { page = 1, limit = 20, search, userType, sortBy = 'createdAt', sortOrder = 'desc' } = query;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }

      if (userType) {
        where.userType = userType;
      }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder }
        }),
        this.prisma.user.count({ where })
      ]);

      const data = users.map(this.mapToUserResponse);
      const totalPages = Math.ceil(total / limit);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error: any) {
      logger.error('Erro ao listar usuários:', error);
      throw error;
    }
  }

  /**
   * Obter usuário por ID (Admin)
   */
  async getUserById(userId: string): Promise<UserResponse> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return this.mapToUserResponse(user);
    } catch (error: any) {
      logger.error('Erro ao obter usuário:', error);
      throw error;
    }
  }

  /**
   * Atualizar status do usuário (Admin)
   */
  async updateUserStatus(userId: string, isActive: boolean, reason?: string): Promise<void> {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          // TODO: Adicionar campo isActive no schema se necessário
          // isActive,
          // statusReason: reason
        }
      });

      logger.info(`Status do usuário ${userId} atualizado: ${isActive ? 'ativo' : 'inativo'}`);
    } catch (error: any) {
      logger.error('Erro ao atualizar status do usuário:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  private async calculateStreaks(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    // TODO: Implementar cálculo de streaks
    return { currentStreak: 0, longestStreak: 0 };
  }

  private async getPersonalRecords(userId: string): Promise<any[]> {
    // TODO: Implementar busca de recordes pessoais
    return [];
  }

  private async getRecentActivity(userId: string): Promise<any[]> {
    // TODO: Implementar atividade recente
    return [];
  }

  private async getProgressSummary(userId: string): Promise<any[]> {
    // TODO: Implementar resumo de progresso
    return [];
  }

  private async getProgressHighlights(userId: string): Promise<any[]> {
    // TODO: Implementar highlights de progresso
    return [];
  }

  private async getRecentAchievements(userId: string): Promise<any[]> {
    // TODO: Implementar conquistas
    return [];
  }

  private mapToProfileResponse(user: any): ProfileResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      goals: user.goals,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      notifications: user.notifications as any,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      personalTrainer: user.personalTrainer
    };
  }

  private mapToStudentResponse(user: any): StudentResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      goals: user.goals,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString()
    };
  }

  private mapToUserResponse(user: any): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      dateOfBirth: user.dateOfBirth?.toISOString(),
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel,
      goals: user.goals,
      preferredLanguage: user.preferredLanguage,
      timezone: user.timezone,
      notifications: user.notifications as any,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString()
    };
  }
}
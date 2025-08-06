/**
 * Workout Service
 * Serviço para gerenciamento de treinos
 */

import { PrismaClient } from '@prisma/client';
import { 
  CreateWorkoutRequest,
  UpdateWorkoutRequest,
  DuplicateWorkoutRequest,
  WorkoutResponse,
  WorkoutQuery,
  PaginatedResponse,
  WorkoutLogResponse,
  CompleteWorkoutRequest,
  LogExerciseRequest
} from '../types';
import { logger } from '../utils/logger';

export class WorkoutService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Listar treinos do usuário
   */
  async getWorkouts(userId: string, query: WorkoutQuery): Promise<PaginatedResponse<WorkoutResponse>> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        category, 
        difficulty,
        muscleGroups,
        equipment,
        tags,
        isTemplate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = query;

      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          { creatorId: userId },
          { 
            shares: {
              some: { sharedWithId: userId }
            }
          },
          { 
            AND: [
              { isPublic: true },
              { isTemplate: true }
            ]
          }
        ]
      };

      if (search) {
        where.AND = where.AND || [];
        where.AND.push({
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search] } }
          ]
        });
      }

      if (category) {
        where.category = category;
      }

      if (difficulty) {
        where.difficulty = difficulty;
      }

      if (muscleGroups && muscleGroups.length > 0) {
        where.targetMuscleGroups = { hasSome: muscleGroups };
      }

      if (equipment && equipment.length > 0) {
        where.equipment = { hasSome: equipment };
      }

      if (tags && tags.length > 0) {
        where.tags = { hasSome: tags };
      }

      if (typeof isTemplate === 'boolean') {
        where.isTemplate = isTemplate;
      }

      const [workouts, total] = await Promise.all([
        this.prisma.workout.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                profilePicture: true
              }
            },
            exercises: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    nameEn: true,
                    description: true,
                    instructions: true,
                    category: true,
                    muscleGroups: true,
                    equipment: true,
                    difficulty: true,
                    images: true,
                    videoUrl: true,
                    isPublic: true,
                    isOfficial: true,
                    tags: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                workoutLogs: {
                  where: { completedAt: { not: null } }
                },
                shares: true
              }
            }
          }
        }),
        this.prisma.workout.count({ where })
      ]);

      const data = workouts.map(this.mapToWorkoutResponse);
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
      logger.error('Erro ao listar treinos:', error);
      throw error;
    }
  }

  /**
   * Listar templates públicos
   */
  async getPublicTemplates(query: WorkoutQuery): Promise<PaginatedResponse<WorkoutResponse>> {
    try {
      const modifiedQuery = { ...query, isTemplate: true, isPublic: true };
      
      // Usar qualquer userId fictício já que queremos apenas templates públicos
      const result = await this.getWorkouts('', modifiedQuery);
      
      return result;
    } catch (error: any) {
      logger.error('Erro ao listar templates públicos:', error);
      throw error;
    }
  }

  /**
   * Obter treino por ID
   */
  async getWorkoutById(userId: string, workoutId: string): Promise<WorkoutResponse> {
    try {
      const workout = await this.prisma.workout.findUnique({
        where: { id: workoutId },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profilePicture: true
            }
          },
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  description: true,
                  instructions: true,
                  category: true,
                  muscleGroups: true,
                  equipment: true,
                  difficulty: true,
                  images: true,
                  videoUrl: true,
                  isPublic: true,
                  isOfficial: true,
                  tags: true
                }
              }
            },
            orderBy: { order: 'asc' }
          },
          shares: {
            where: { sharedWithId: userId },
            select: { id: true }
          },
          _count: {
            select: {
              workoutLogs: {
                where: { completedAt: { not: null } }
              },
              shares: true
            }
          }
        }
      });

      if (!workout) {
        throw new Error('WORKOUT_NOT_FOUND');
      }

      // Verificar permissão de acesso
      const hasAccess = 
        workout.creatorId === userId || // É o criador
        workout.shares.length > 0 || // Foi compartilhado com o usuário
        (workout.isPublic && workout.isTemplate); // É template público

      if (!hasAccess) {
        throw new Error('ACCESS_DENIED');
      }

      return this.mapToWorkoutResponse(workout);
    } catch (error: any) {
      logger.error('Erro ao obter treino:', error);
      throw error;
    }
  }

  /**
   * Criar novo treino
   */
  async createWorkout(userId: string, data: CreateWorkoutRequest): Promise<WorkoutResponse> {
    try {
      // Verificar se todos os exercícios existem
      const exerciseIds = data.exercises.map(ex => ex.exerciseId);
      const exercises = await this.prisma.exercise.findMany({
        where: { id: { in: exerciseIds } }
      });

      if (exercises.length !== exerciseIds.length) {
        const foundIds = exercises.map(ex => ex.id);
        const missingIds = exerciseIds.filter(id => !foundIds.includes(id));
        throw { 
          code: 'EXERCISE_NOT_FOUND', 
          message: 'Exercícios não encontrados',
          details: { missingIds }
        };
      }

      // Criar treino
      const workout = await this.prisma.workout.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          estimatedDuration: data.estimatedDuration,
          restBetweenSets: data.restBetweenSets || 60,
          restBetweenExercises: data.restBetweenExercises || 120,
          isTemplate: data.isTemplate || false,
          isPublic: data.isPublic || false,
          tags: data.tags || [],
          targetMuscleGroups: data.targetMuscleGroups || [],
          equipment: data.equipment || [],
          creatorId: userId,
          exercises: {
            create: data.exercises.map(ex => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              duration: ex.duration,
              restTime: ex.restTime,
              notes: ex.notes
            }))
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profilePicture: true
            }
          },
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  description: true,
                  instructions: true,
                  category: true,
                  muscleGroups: true,
                  equipment: true,
                  difficulty: true,
                  images: true,
                  videoUrl: true,
                  isPublic: true,
                  isOfficial: true,
                  tags: true
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      logger.info(`Treino criado: ${workout.id} pelo usuário ${userId}`);

      return this.mapToWorkoutResponse(workout);
    } catch (error: any) {
      logger.error('Erro ao criar treino:', error);
      throw error;
    }
  }

  /**
   * Atualizar treino
   */
  async updateWorkout(userId: string, workoutId: string, data: UpdateWorkoutRequest): Promise<WorkoutResponse> {
    try {
      // Verificar se o treino existe e o usuário tem permissão
      const existingWorkout = await this.prisma.workout.findUnique({
        where: { id: workoutId }
      });

      if (!existingWorkout) {
        throw new Error('WORKOUT_NOT_FOUND');
      }

      if (existingWorkout.creatorId !== userId) {
        throw new Error('ACCESS_DENIED');
      }

      // Se há exercícios para atualizar, verificar se existem
      if (data.exercises) {
        const exerciseIds = data.exercises
          .filter(ex => ex.exerciseId)
          .map(ex => ex.exerciseId!);
        
        if (exerciseIds.length > 0) {
          const exercises = await this.prisma.exercise.findMany({
            where: { id: { in: exerciseIds } }
          });

          if (exercises.length !== exerciseIds.length) {
            const foundIds = exercises.map(ex => ex.id);
            const missingIds = exerciseIds.filter(id => !foundIds.includes(id));
            throw { 
              code: 'EXERCISE_NOT_FOUND', 
              message: 'Exercícios não encontrados',
              details: { missingIds }
            };
          }
        }

        // Deletar exercícios existentes e criar novos
        await this.prisma.workoutExercise.deleteMany({
          where: { workoutId }
        });
      }

      // Atualizar treino
      const workout = await this.prisma.workout.update({
        where: { id: workoutId },
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          difficulty: data.difficulty,
          estimatedDuration: data.estimatedDuration,
          restBetweenSets: data.restBetweenSets,
          restBetweenExercises: data.restBetweenExercises,
          isTemplate: data.isTemplate,
          isPublic: data.isPublic,
          tags: data.tags,
          targetMuscleGroups: data.targetMuscleGroups,
          equipment: data.equipment,
          exercises: data.exercises ? {
            create: data.exercises.map(ex => ({
              exerciseId: ex.exerciseId!,
              order: ex.order!,
              sets: ex.sets!,
              reps: ex.reps!,
              weight: ex.weight,
              duration: ex.duration,
              restTime: ex.restTime,
              notes: ex.notes
            }))
          } : undefined
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profilePicture: true
            }
          },
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  description: true,
                  instructions: true,
                  category: true,
                  muscleGroups: true,
                  equipment: true,
                  difficulty: true,
                  images: true,
                  videoUrl: true,
                  isPublic: true,
                  isOfficial: true,
                  tags: true
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      logger.info(`Treino atualizado: ${workoutId} pelo usuário ${userId}`);

      return this.mapToWorkoutResponse(workout);
    } catch (error: any) {
      logger.error('Erro ao atualizar treino:', error);
      throw error;
    }
  }

  /**
   * Deletar treino
   */
  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    try {
      const workout = await this.prisma.workout.findUnique({
        where: { id: workoutId }
      });

      if (!workout) {
        throw new Error('WORKOUT_NOT_FOUND');
      }

      if (workout.creatorId !== userId) {
        throw new Error('ACCESS_DENIED');
      }

      // Deletar treino (cascata deletará exercícios, logs, etc.)
      await this.prisma.workout.delete({
        where: { id: workoutId }
      });

      logger.info(`Treino deletado: ${workoutId} pelo usuário ${userId}`);
    } catch (error: any) {
      logger.error('Erro ao deletar treino:', error);
      throw error;
    }
  }

  /**
   * Duplicar treino
   */
  async duplicateWorkout(userId: string, workoutId: string, data: DuplicateWorkoutRequest): Promise<WorkoutResponse> {
    try {
      const originalWorkout = await this.prisma.workout.findUnique({
        where: { id: workoutId },
        include: {
          exercises: {
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!originalWorkout) {
        throw new Error('WORKOUT_NOT_FOUND');
      }

      // Verificar permissão de acesso
      const hasAccess = 
        originalWorkout.creatorId === userId ||
        (originalWorkout.isPublic && originalWorkout.isTemplate);

      if (!hasAccess) {
        // Verificar se foi compartilhado
        const share = await this.prisma.workoutShare.findFirst({
          where: {
            workoutId,
            sharedWithId: userId
          }
        });

        if (!share) {
          throw new Error('ACCESS_DENIED');
        }
      }

      // Criar cópia do treino
      const duplicatedWorkout = await this.prisma.workout.create({
        data: {
          name: data.name,
          description: originalWorkout.description,
          category: originalWorkout.category,
          difficulty: originalWorkout.difficulty,
          estimatedDuration: originalWorkout.estimatedDuration,
          restBetweenSets: originalWorkout.restBetweenSets,
          restBetweenExercises: originalWorkout.restBetweenExercises,
          isTemplate: false, // Cópias não são templates por padrão
          isPublic: data.isPublic || false,
          tags: originalWorkout.tags,
          targetMuscleGroups: originalWorkout.targetMuscleGroups,
          equipment: originalWorkout.equipment,
          creatorId: userId,
          exercises: {
            create: originalWorkout.exercises.map(ex => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              duration: ex.duration,
              restTime: ex.restTime,
              notes: ex.notes
            }))
          }
        },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              profilePicture: true
            }
          },
          exercises: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  nameEn: true,
                  description: true,
                  instructions: true,
                  category: true,
                  muscleGroups: true,
                  equipment: true,
                  difficulty: true,
                  images: true,
                  videoUrl: true,
                  isPublic: true,
                  isOfficial: true,
                  tags: true
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      logger.info(`Treino duplicado: ${workoutId} -> ${duplicatedWorkout.id} pelo usuário ${userId}`);

      return this.mapToWorkoutResponse(duplicatedWorkout);
    } catch (error: any) {
      logger.error('Erro ao duplicar treino:', error);
      throw error;
    }
  }

  /**
   * Compartilhar treino
   */
  async shareWorkout(userId: string, workoutId: string, userIds: string[]): Promise<void> {
    try {
      const workout = await this.prisma.workout.findUnique({
        where: { id: workoutId }
      });

      if (!workout) {
        throw new Error('WORKOUT_NOT_FOUND');
      }

      if (workout.creatorId !== userId) {
        throw new Error('ACCESS_DENIED');
      }

      // Verificar se os usuários existem
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } }
      });

      if (users.length !== userIds.length) {
        const foundIds = users.map(u => u.id);
        const missingIds = userIds.filter(id => !foundIds.includes(id));
        throw { 
          code: 'USERS_NOT_FOUND', 
          message: 'Usuários não encontrados',
          details: { missingIds }
        };
      }

      // Criar compartilhamentos (ignorar duplicatas)
      const shareData = userIds.map(targetUserId => ({
        workoutId,
        sharedById: userId,
        sharedWithId: targetUserId
      }));

      await this.prisma.workoutShare.createMany({
        data: shareData,
        skipDuplicates: true
      });

      logger.info(`Treino ${workoutId} compartilhado com ${userIds.length} usuários pelo usuário ${userId}`);
    } catch (error: any) {
      logger.error('Erro ao compartilhar treino:', error);
      throw error;
    }
  }

  /**
   * Listar usuários com quem o treino foi compartilhado
   */
  async getSharedWith(userId: string, workoutId: string): Promise<any[]> {
    try {
      const workout = await this.prisma.workout.findUnique({
        where: { id: workoutId }
      });

      if (!workout || workout.creatorId !== userId) {
        throw new Error('ACCESS_DENIED');
      }

      const shares = await this.prisma.workoutShare.findMany({
        where: { workoutId },
        include: {
          sharedWith: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true
            }
          }
        }
      });

      return shares.map(share => ({
        ...share.sharedWith,
        sharedAt: share.sharedAt.toISOString()
      }));
    } catch (error: any) {
      logger.error('Erro ao obter compartilhamentos:', error);
      throw error;
    }
  }

  /**
   * Remover compartilhamento
   */
  async removeShare(userId: string, workoutId: string, targetUserId: string): Promise<void> {
    try {
      const workout = await this.prisma.workout.findUnique({
        where: { id: workoutId }
      });

      if (!workout || workout.creatorId !== userId) {
        throw new Error('ACCESS_DENIED');
      }

      await this.prisma.workoutShare.deleteMany({
        where: {
          workoutId,
          sharedById: userId,
          sharedWithId: targetUserId
        }
      });

      logger.info(`Compartilhamento removido: treino ${workoutId} com usuário ${targetUserId}`);
    } catch (error: any) {
      logger.error('Erro ao remover compartilhamento:', error);
      throw error;
    }
  }

  /**
   * Iniciar execução de treino
   */
  async startWorkout(userId: string, workoutId: string, notes?: string): Promise<WorkoutLogResponse> {
    try {
      // Verificar se o treino existe e o usuário tem acesso
      const workout = await this.getWorkoutById(userId, workoutId);
      
      // Criar log de treino
      const workoutLog = await this.prisma.workoutLog.create({
        data: {
          userId,
          workoutId,
          startedAt: new Date(),
          notes
        },
        include: {
          workout: {
            select: {
              id: true,
              name: true,
              category: true,
              difficulty: true
            }
          }
        }
      });

      logger.info(`Treino iniciado: ${workoutId} pelo usuário ${userId}`);

      return this.mapToWorkoutLogResponse(workoutLog);
    } catch (error: any) {
      logger.error('Erro ao iniciar treino:', error);
      throw error;
    }
  }

  /**
   * Completar execução de treino
   */
  async completeWorkout(userId: string, data: CompleteWorkoutRequest): Promise<WorkoutLogResponse> {
    try {
      const { workoutLogId, notes, rating, exerciseLogs } = data;

      // Verificar se o log existe e pertence ao usuário
      const workoutLog = await this.prisma.workoutLog.findUnique({
        where: { id: workoutLogId },
        include: {
          workout: true
        }
      });

      if (!workoutLog || workoutLog.userId !== userId) {
        throw new Error('WORKOUT_LOG_NOT_FOUND');
      }

      // Atualizar log do treino
      const completedAt = new Date();
      const duration = Math.round((completedAt.getTime() - workoutLog.startedAt.getTime()) / 1000 / 60); // em minutos

      const updatedWorkoutLog = await this.prisma.workoutLog.update({
        where: { id: workoutLogId },
        data: {
          completedAt,
          duration,
          notes,
          rating
        },
        include: {
          workout: {
            select: {
              id: true,
              name: true,
              category: true,
              difficulty: true
            }
          }
        }
      });

      // Criar logs dos exercícios
      if (exerciseLogs && exerciseLogs.length > 0) {
        await this.prisma.exerciseLog.createMany({
          data: exerciseLogs.map(log => ({
            workoutLogId,
            exerciseId: log.exerciseId,
            setNumber: log.setNumber,
            reps: log.reps,
            weight: log.weight,
            duration: log.duration,
            restTime: log.restTime,
            notes: log.notes,
            completed: log.completed ?? true
          }))
        });
      }

      logger.info(`Treino completado: ${workoutLog.workoutId} pelo usuário ${userId}`);

      return this.mapToWorkoutLogResponse(updatedWorkoutLog);
    } catch (error: any) {
      logger.error('Erro ao completar treino:', error);
      throw error;
    }
  }

  /**
   * Obter histórico de execuções do treino
   */
  async getWorkoutLogs(userId: string, workoutId: string, query: { page: number; limit: number }): Promise<PaginatedResponse<WorkoutLogResponse>> {
    try {
      const { page, limit } = query;
      const skip = (page - 1) * limit;

      // Verificar acesso ao treino
      await this.getWorkoutById(userId, workoutId);

      const [logs, total] = await Promise.all([
        this.prisma.workoutLog.findMany({
          where: { 
            userId,
            workoutId
          },
          skip,
          take: limit,
          orderBy: { startedAt: 'desc' },
          include: {
            workout: {
              select: {
                id: true,
                name: true,
                category: true,
                difficulty: true
              }
            },
            exerciseLogs: {
              include: {
                exercise: {
                  select: {
                    id: true,
                    name: true,
                    category: true
                  }
                }
              }
            }
          }
        }),
        this.prisma.workoutLog.count({
          where: { userId, workoutId }
        })
      ]);

      const data = logs.map(this.mapToWorkoutLogResponse);
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
      logger.error('Erro ao obter logs de treino:', error);
      throw error;
    }
  }

  /**
   * Obter detalhes de uma execução de treino
   */
  async getWorkoutLogById(userId: string, logId: string): Promise<WorkoutLogResponse> {
    try {
      const workoutLog = await this.prisma.workoutLog.findUnique({
        where: { id: logId },
        include: {
          workout: {
            select: {
              id: true,
              name: true,
              category: true,
              difficulty: true
            }
          },
          exerciseLogs: {
            include: {
              exercise: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          }
        }
      });

      if (!workoutLog || workoutLog.userId !== userId) {
        throw new Error('WORKOUT_LOG_NOT_FOUND');
      }

      return this.mapToWorkoutLogResponse(workoutLog);
    } catch (error: any) {
      logger.error('Erro ao obter log de treino:', error);
      throw error;
    }
  }

  /**
   * Deletar log de treino
   */
  async deleteWorkoutLog(userId: string, logId: string): Promise<void> {
    try {
      const workoutLog = await this.prisma.workoutLog.findUnique({
        where: { id: logId }
      });

      if (!workoutLog || workoutLog.userId !== userId) {
        throw new Error('WORKOUT_LOG_NOT_FOUND');
      }

      await this.prisma.workoutLog.delete({
        where: { id: logId }
      });

      logger.info(`Log de treino deletado: ${logId} pelo usuário ${userId}`);
    } catch (error: any) {
      logger.error('Erro ao deletar log de treino:', error);
      throw error;
    }
  }

  /**
   * Obter estatísticas do treino
   */
  async getWorkoutStats(userId: string, workoutId: string): Promise<any> {
    try {
      // Verificar acesso ao treino
      await this.getWorkoutById(userId, workoutId);

      const stats = await this.prisma.workoutLog.aggregate({
        where: { 
          userId,
          workoutId,
          completedAt: { not: null }
        },
        _count: { id: true },
        _avg: { 
          duration: true,
          rating: true
        },
        _sum: { duration: true }
      });

      const totalCompleted = stats._count.id;
      const averageDuration = stats._avg.duration || 0;
      const averageRating = stats._avg.rating || 0;
      const totalDuration = stats._sum.duration || 0;

      // Obter último treino
      const lastWorkout = await this.prisma.workoutLog.findFirst({
        where: { 
          userId,
          workoutId,
          completedAt: { not: null }
        },
        orderBy: { completedAt: 'desc' }
      });

      return {
        totalCompleted,
        averageDuration,
        averageRating,
        totalDuration,
        lastCompletedAt: lastWorkout?.completedAt?.toISOString()
      };
    } catch (error: any) {
      logger.error('Erro ao obter estatísticas do treino:', error);
      throw error;
    }
  }

  // Métodos auxiliares privados
  private mapToWorkoutResponse(workout: any): WorkoutResponse {
    return {
      id: workout.id,
      name: workout.name,
      description: workout.description,
      category: workout.category,
      difficulty: workout.difficulty,
      estimatedDuration: workout.estimatedDuration,
      restBetweenSets: workout.restBetweenSets,
      restBetweenExercises: workout.restBetweenExercises,
      isTemplate: workout.isTemplate,
      isPublic: workout.isPublic,
      tags: workout.tags,
      targetMuscleGroups: workout.targetMuscleGroups,
      equipment: workout.equipment,
      createdAt: workout.createdAt.toISOString(),
      updatedAt: workout.updatedAt.toISOString(),
      creator: workout.creator,
      exercises: workout.exercises?.map((we: any) => ({
        id: we.id,
        order: we.order,
        sets: we.sets,
        reps: we.reps,
        weight: we.weight,
        duration: we.duration,
        restTime: we.restTime,
        notes: we.notes,
        exercise: we.exercise
      })) || [],
      _count: workout._count
    };
  }

  private mapToWorkoutLogResponse(log: any): WorkoutLogResponse {
    return {
      id: log.id,
      startedAt: log.startedAt.toISOString(),
      completedAt: log.completedAt?.toISOString(),
      duration: log.duration,
      notes: log.notes,
      rating: log.rating,
      createdAt: log.createdAt.toISOString(),
      workout: log.workout,
      exerciseLogs: log.exerciseLogs?.map((el: any) => ({
        id: el.id,
        setNumber: el.setNumber,
        reps: el.reps,
        weight: el.weight,
        duration: el.duration,
        restTime: el.restTime,
        notes: el.notes,
        completed: el.completed,
        createdAt: el.createdAt.toISOString(),
        exercise: el.exercise
      })) || []
    };
  }
}
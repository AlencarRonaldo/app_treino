/**
 * Exercise Routes
 * Rotas para gerenciamento de exercícios
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/authMiddleware';
import { validateRequest } from '../middleware/validateRequest';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createExerciseSchema = Joi.object({
  name: Joi.string().required().max(100),
  description: Joi.string().required().max(500),
  instructions: Joi.array().items(Joi.string()).required(),
  category: Joi.string().valid('STRENGTH', 'CARDIO', 'FLEXIBILITY', 'SPORTS', 'FUNCTIONAL').required(),
  muscleGroups: Joi.array().items(Joi.string()).required(),
  equipment: Joi.array().items(Joi.string()).required(),
  difficulty: Joi.string().valid('BEGINNER', 'INTERMEDIATE', 'ADVANCED').default('BEGINNER'),
  imageUrl: Joi.string().uri().optional(),
  videoUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

const updateExerciseSchema = createExerciseSchema.fork(['name', 'description', 'instructions', 'category', 'muscleGroups', 'equipment'], (schema) => schema.optional());

/**
 * GET /api/v1/exercises
 * Listar exercícios com filtros
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      difficulty,
      muscleGroup,
      equipment,
      isOfficial,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const where: any = {};

    // Filtros
    if (category) where.category = category;
    if (difficulty) where.difficulty = difficulty;
    if (isOfficial !== undefined) where.isOfficial = isOfficial === 'true';

    // Busca por nome ou descrição
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } }
      ];
    }

    // Filtro por grupo muscular (busca no JSON)
    if (muscleGroup) {
      where.muscleGroups = { contains: muscleGroup as string };
    }

    // Filtro por equipamento (busca no JSON)
    if (equipment) {
      where.equipment = { contains: equipment as string };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [exercises, total] = await Promise.all([
      prisma.exercise.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              userType: true
            }
          }
        },
        orderBy: [
          { isOfficial: 'desc' },
          { name: 'asc' }
        ],
        skip,
        take
      }),
      prisma.exercise.count({ where })
    ]);

    // Parse JSON fields
    const parsedExercises = exercises.map(exercise => ({
      ...exercise,
      instructions: JSON.parse(exercise.instructions),
      muscleGroups: JSON.parse(exercise.muscleGroups),
      equipment: JSON.parse(exercise.equipment),
      tags: exercise.tags ? JSON.parse(exercise.tags) : []
    }));

    res.json({
      exercises: parsedExercises,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar exercícios:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os exercícios'
    });
  }
});

/**
 * GET /api/v1/exercises/:id
 * Buscar exercício por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    if (!exercise) {
      return res.status(404).json({
        error: 'Exercício não encontrado'
      });
    }

    // Parse JSON fields
    const parsedExercise = {
      ...exercise,
      instructions: JSON.parse(exercise.instructions),
      muscleGroups: JSON.parse(exercise.muscleGroups),
      equipment: JSON.parse(exercise.equipment),
      tags: exercise.tags ? JSON.parse(exercise.tags) : []
    };

    res.json(parsedExercise);

  } catch (error) {
    console.error('Erro ao buscar exercício:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o exercício'
    });
  }
});

/**
 * POST /api/v1/exercises
 * Criar novo exercício customizado
 */
router.post('/', validateRequest(createExerciseSchema), async (req, res) => {
  try {
    const userId = req.user?.id;
    const exerciseData = req.body;

    const exercise = await prisma.exercise.create({
      data: {
        ...exerciseData,
        instructions: JSON.stringify(exerciseData.instructions),
        muscleGroups: JSON.stringify(exerciseData.muscleGroups),
        equipment: JSON.stringify(exerciseData.equipment),
        tags: exerciseData.tags ? JSON.stringify(exerciseData.tags) : null,
        isOfficial: false,
        createdById: userId
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    // Parse JSON fields para resposta
    const parsedExercise = {
      ...exercise,
      instructions: JSON.parse(exercise.instructions),
      muscleGroups: JSON.parse(exercise.muscleGroups),
      equipment: JSON.parse(exercise.equipment),
      tags: exercise.tags ? JSON.parse(exercise.tags) : []
    };

    res.status(201).json(parsedExercise);

  } catch (error) {
    console.error('Erro ao criar exercício:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o exercício'
    });
  }
});

/**
 * PUT /api/v1/exercises/:id
 * Atualizar exercício customizado
 */
router.put('/:id', validateRequest(updateExerciseSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    // Verificar se o exercício existe e se o usuário pode editá-lo
    const existingExercise = await prisma.exercise.findUnique({
      where: { id }
    });

    if (!existingExercise) {
      return res.status(404).json({
        error: 'Exercício não encontrado'
      });
    }

    // Apenas o criador pode editar exercícios customizados, exercícios oficiais não podem ser editados
    if (existingExercise.isOfficial || existingExercise.createdById !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para editar este exercício'
      });
    }

    // Preparar dados para atualização
    const updatePayload: any = { ...updateData };
    if (updateData.instructions) updatePayload.instructions = JSON.stringify(updateData.instructions);
    if (updateData.muscleGroups) updatePayload.muscleGroups = JSON.stringify(updateData.muscleGroups);
    if (updateData.equipment) updatePayload.equipment = JSON.stringify(updateData.equipment);
    if (updateData.tags) updatePayload.tags = JSON.stringify(updateData.tags);

    const exercise = await prisma.exercise.update({
      where: { id },
      data: updatePayload,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            userType: true
          }
        }
      }
    });

    // Parse JSON fields para resposta
    const parsedExercise = {
      ...exercise,
      instructions: JSON.parse(exercise.instructions),
      muscleGroups: JSON.parse(exercise.muscleGroups),
      equipment: JSON.parse(exercise.equipment),
      tags: exercise.tags ? JSON.parse(exercise.tags) : []
    };

    res.json(parsedExercise);

  } catch (error) {
    console.error('Erro ao atualizar exercício:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o exercício'
    });
  }
});

/**
 * DELETE /api/v1/exercises/:id
 * Deletar exercício customizado
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verificar se o exercício existe e se o usuário pode deletá-lo
    const existingExercise = await prisma.exercise.findUnique({
      where: { id }
    });

    if (!existingExercise) {
      return res.status(404).json({
        error: 'Exercício não encontrado'
      });
    }

    // Apenas o criador pode deletar exercícios customizados, exercícios oficiais não podem ser deletados
    if (existingExercise.isOfficial || existingExercise.createdById !== userId) {
      return res.status(403).json({
        error: 'Você não tem permissão para deletar este exercício'
      });
    }

    // Verificar se o exercício está sendo usado em algum treino
    const workoutExercises = await prisma.workoutExercise.findFirst({
      where: { exerciseId: id }
    });

    if (workoutExercises) {
      return res.status(400).json({
        error: 'Não é possível deletar um exercício que está sendo usado em treinos'
      });
    }

    await prisma.exercise.delete({
      where: { id }
    });

    res.status(204).send();

  } catch (error) {
    console.error('Erro ao deletar exercício:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível deletar o exercício'
    });
  }
});

/**
 * GET /api/v1/exercises/categories
 * Listar categorias disponíveis
 */
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'STRENGTH', label: 'Força', description: 'Exercícios de fortalecimento muscular' },
      { value: 'CARDIO', label: 'Cardio', description: 'Exercícios cardiovasculares' },
      { value: 'FLEXIBILITY', label: 'Flexibilidade', description: 'Exercícios de alongamento' },
      { value: 'SPORTS', label: 'Esportes', description: 'Exercícios esportivos específicos' },
      { value: 'FUNCTIONAL', label: 'Funcional', description: 'Exercícios funcionais' }
    ];

    res.json({ categories });

  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/v1/exercises/muscle-groups
 * Listar grupos musculares disponíveis
 */
router.get('/meta/muscle-groups', async (req, res) => {
  try {
    const muscleGroups = [
      'peito', 'costas', 'ombros', 'biceps', 'triceps',
      'quadríceps', 'isquiotibiais', 'glúteos', 'panturrilhas',
      'abdômen', 'core', 'antebraços', 'trapézio', 'latíssimo',
      'romboides', 'eretores', 'cardiovascular'
    ];

    res.json({ muscleGroups: muscleGroups.sort() });

  } catch (error) {
    console.error('Erro ao buscar grupos musculares:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
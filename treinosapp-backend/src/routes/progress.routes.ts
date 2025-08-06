/**
 * Progress Routes
 * Rotas para gerenciamento de progresso do usuário
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { validateRequest } from '../middleware/validateRequest';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createProgressSchema = Joi.object({
  type: Joi.string().valid('WEIGHT', 'BODY_FAT', 'MUSCLE_MASS', 'MEASUREMENTS', 'PERFORMANCE', 'PHOTOS').required(),
  value: Joi.number().positive().required(),
  unit: Joi.string().required().max(10),
  notes: Joi.string().optional().max(500),
  date: Joi.date().optional()
});

const updateProgressSchema = createProgressSchema.fork(['type', 'value', 'unit'], (schema) => schema.optional());

/**
 * GET /api/v1/progress
 * Listar registros de progresso do usuário
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      type,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    const where: any = { userId };

    // Filtro por tipo de progresso
    if (type) {
      where.type = type;
    }

    // Filtro por data
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const [records, total] = await Promise.all([
      prisma.progressRecord.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take
      }),
      prisma.progressRecord.count({ where })
    ]);

    res.json({
      records,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Erro ao buscar registros de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar os registros de progresso'
    });
  }
});

/**
 * GET /api/v1/progress/summary
 * Resumo do progresso do usuário
 */
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { period = '6m' } = req.query; // 1m, 3m, 6m, 1y

    // Calcular data de início baseada no período
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '1m':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(now.getMonth() - 6);
    }

    // Buscar todos os registros do período
    const records = await prisma.progressRecord.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: now
        }
      },
      orderBy: { date: 'asc' }
    });

    // Agrupar por tipo
    const groupedByType = records.reduce((acc, record) => {
      if (!acc[record.type]) {
        acc[record.type] = [];
      }
      acc[record.type].push(record);
      return acc;
    }, {} as Record<string, typeof records>);

    // Calcular estatísticas para cada tipo
    const summary = Object.entries(groupedByType).map(([type, typeRecords]) => {
      const latest = typeRecords[typeRecords.length - 1];
      const oldest = typeRecords[0];
      const change = latest.value - oldest.value;
      const changePercent = (change / oldest.value) * 100;

      return {
        type,
        latest: {
          value: latest.value,
          unit: latest.unit,
          date: latest.date
        },
        oldest: {
          value: oldest.value,
          unit: oldest.unit,
          date: oldest.date
        },
        change: {
          absolute: change,
          percentage: changePercent
        },
        recordCount: typeRecords.length,
        chartData: typeRecords.map(record => ({
          date: record.date,
          value: record.value
        }))
      };
    });

    res.json({
      period,
      summary,
      totalRecords: records.length
    });

  } catch (error) {
    console.error('Erro ao buscar resumo de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível gerar o resumo de progresso'
    });
  }
});

/**
 * GET /api/v1/progress/:id
 * Buscar registro específico de progresso
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const record = await prisma.progressRecord.findFirst({
      where: {
        id,
        userId // Garantir que o usuário só veja seus próprios registros
      }
    });

    if (!record) {
      return res.status(404).json({
        error: 'Registro de progresso não encontrado'
      });
    }

    res.json(record);

  } catch (error) {
    console.error('Erro ao buscar registro de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível buscar o registro de progresso'
    });
  }
});

/**
 * POST /api/v1/progress
 * Criar novo registro de progresso
 */
router.post('/', validateRequest(createProgressSchema), async (req, res) => {
  try {
    const userId = req.user?.id;
    const progressData = req.body;

    const record = await prisma.progressRecord.create({
      data: {
        ...progressData,
        userId,
        date: progressData.date ? new Date(progressData.date) : new Date()
      }
    });

    res.status(201).json(record);

  } catch (error) {
    console.error('Erro ao criar registro de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível criar o registro de progresso'
    });
  }
});

/**
 * PUT /api/v1/progress/:id
 * Atualizar registro de progresso
 */
router.put('/:id', validateRequest(updateProgressSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    // Verificar se o registro existe e pertence ao usuário
    const existingRecord = await prisma.progressRecord.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Registro de progresso não encontrado'
      });
    }

    const record = await prisma.progressRecord.update({
      where: { id },
      data: {
        ...updateData,
        date: updateData.date ? new Date(updateData.date) : undefined
      }
    });

    res.json(record);

  } catch (error) {
    console.error('Erro ao atualizar registro de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível atualizar o registro de progresso'
    });
  }
});

/**
 * DELETE /api/v1/progress/:id
 * Deletar registro de progresso
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Verificar se o registro existe e pertence ao usuário
    const existingRecord = await prisma.progressRecord.findFirst({
      where: {
        id,
        userId
      }
    });

    if (!existingRecord) {
      return res.status(404).json({
        error: 'Registro de progresso não encontrado'
      });
    }

    await prisma.progressRecord.delete({
      where: { id }
    });

    res.status(204).send();

  } catch (error) {
    console.error('Erro ao deletar registro de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível deletar o registro de progresso'
    });
  }
});

/**
 * GET /api/v1/progress/types
 * Listar tipos de progresso disponíveis
 */
router.get('/meta/types', async (req, res) => {
  try {
    const progressTypes = [
      {
        value: 'WEIGHT',
        label: 'Peso Corporal',
        description: 'Acompanhamento do peso corporal',
        unit: 'kg',
        icon: 'scale'
      },
      {
        value: 'BODY_FAT',
        label: 'Percentual de Gordura',
        description: 'Percentual de gordura corporal',
        unit: '%',
        icon: 'body'
      },
      {
        value: 'MUSCLE_MASS',
        label: 'Massa Muscular',
        description: 'Quantidade de massa muscular',
        unit: 'kg',
        icon: 'muscle'
      },
      {
        value: 'MEASUREMENTS',
        label: 'Medidas Corporais',
        description: 'Medidas de circunferência corporal',
        unit: 'cm',
        icon: 'ruler'
      },
      {
        value: 'PERFORMANCE',
        label: 'Performance',
        description: 'Métricas de performance nos exercícios',
        unit: 'unidade',
        icon: 'performance'
      },
      {
        value: 'PHOTOS',
        label: 'Fotos de Progresso',
        description: 'Registro fotográfico da evolução',
        unit: 'foto',
        icon: 'camera'
      }
    ];

    res.json({ progressTypes });

  } catch (error) {
    console.error('Erro ao buscar tipos de progresso:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

export default router;
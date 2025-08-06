/**
 * Validation Schemas
 * Esquemas de validação usando Joi para todas as requisições
 */

import Joi from 'joi';
import { 
  UserType, 
  Gender, 
  ActivityLevel, 
  WorkoutCategory, 
  ExerciseCategory,
  Difficulty,
  ProgressType
} from '@prisma/client';

// Common patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  objectId: /^[a-zA-Z0-9]{25}$/, // CUID pattern
  brazilianPhone: /^\+55\d{10,11}$/,
  url: /^https?:\/\/.+/,
};

// Base validation functions
const createEnumValidator = (enumValues: any) => {
  return Joi.string().valid(...Object.values(enumValues));
};

// Auth validation schemas
export const authValidation = {
  register: Joi.object({
    email: Joi.string()
      .email()
      .pattern(patterns.email)
      .required()
      .messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      }),
    
    password: Joi.string()
      .min(8)
      .max(128)
      .pattern(patterns.password)
      .required()
      .messages({
        'string.min': 'Senha deve ter pelo menos 8 caracteres',
        'string.max': 'Senha deve ter no máximo 128 caracteres',
        'string.pattern.base': 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
        'any.required': 'Senha é obrigatória'
      }),
    
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Nome deve ter pelo menos 2 caracteres',
        'string.max': 'Nome deve ter no máximo 100 caracteres',
        'any.required': 'Nome é obrigatório'
      }),
    
    userType: createEnumValidator(UserType)
      .required()
      .messages({
        'any.only': 'Tipo de usuário deve ser STUDENT, PERSONAL_TRAINER ou ADMIN',
        'any.required': 'Tipo de usuário é obrigatório'
      }),
    
    dateOfBirth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .optional()
      .messages({
        'date.max': 'Data de nascimento não pode ser no futuro',
        'date.min': 'Data de nascimento deve ser válida'
      }),
    
    gender: createEnumValidator(Gender).optional(),
    
    height: Joi.number()
      .min(50)
      .max(300)
      .optional()
      .messages({
        'number.min': 'Altura deve ser pelo menos 50cm',
        'number.max': 'Altura deve ser no máximo 300cm'
      }),
    
    weight: Joi.number()
      .min(20)
      .max(500)
      .optional()
      .messages({
        'number.min': 'Peso deve ser pelo menos 20kg',
        'number.max': 'Peso deve ser no máximo 500kg'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Senha é obrigatória'
      })
  }),

  googleAuth: Joi.object({
    idToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Token do Google é obrigatório'
      }),
    
    userType: createEnumValidator(UserType)
      .required()
      .messages({
        'any.only': 'Tipo de usuário deve ser STUDENT ou PERSONAL_TRAINER',
        'any.required': 'Tipo de usuário é obrigatório'
      })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'Refresh token é obrigatório'
      })
  }),

  forgotPassword: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email deve ter um formato válido',
        'any.required': 'Email é obrigatório'
      })
  }),

  resetPassword: Joi.object({
    token: Joi.string()
      .required()
      .messages({
        'any.required': 'Token é obrigatório'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(patterns.password)
      .required()
      .messages({
        'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
        'string.max': 'Nova senha deve ter no máximo 128 caracteres',
        'string.pattern.base': 'Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
        'any.required': 'Nova senha é obrigatória'
      })
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Senha atual é obrigatória'
      }),
    
    newPassword: Joi.string()
      .min(8)
      .max(128)
      .pattern(patterns.password)
      .required()
      .messages({
        'string.min': 'Nova senha deve ter pelo menos 8 caracteres',
        'string.max': 'Nova senha deve ter no máximo 128 caracteres',
        'string.pattern.base': 'Nova senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial',
        'any.required': 'Nova senha é obrigatória'
      })
  })
};

// User validation schemas
export const userValidation = {
  updateProfile: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional(),
    
    profilePicture: Joi.string()
      .uri()
      .optional()
      .allow(null),
    
    dateOfBirth: Joi.date()
      .max('now')
      .min('1900-01-01')
      .optional()
      .allow(null),
    
    gender: createEnumValidator(Gender).optional().allow(null),
    
    height: Joi.number()
      .min(50)
      .max(300)
      .optional()
      .allow(null),
    
    weight: Joi.number()
      .min(20)
      .max(500)
      .optional()
      .allow(null),
    
    activityLevel: createEnumValidator(ActivityLevel).optional().allow(null),
    
    goals: Joi.array()
      .items(Joi.string().max(100))
      .max(10)
      .optional(),
    
    preferredLanguage: Joi.string()
      .valid('pt-BR', 'en-US')
      .optional(),
    
    timezone: Joi.string()
      .max(50)
      .optional(),
    
    notifications: Joi.object({
      workout: Joi.boolean().optional(),
      progress: Joi.boolean().optional(),
      social: Joi.boolean().optional(),
      email: Joi.boolean().optional(),
      push: Joi.boolean().optional()
    }).optional()
  }),

  addStudent: Joi.object({
    studentEmail: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email do aluno deve ter um formato válido',
        'any.required': 'Email do aluno é obrigatório'
      }),
    
    personalMessage: Joi.string()
      .max(500)
      .optional()
  }),

  studentInvite: Joi.object({
    email: Joi.string()
      .email()
      .required(),
    
    name: Joi.string()
      .min(2)
      .max(100)
      .required(),
    
    personalMessage: Joi.string()
      .max(500)
      .optional()
  })
};

// Workout validation schemas
export const workoutValidation = {
  createWorkout: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Nome do treino deve ter pelo menos 3 caracteres',
        'string.max': 'Nome do treino deve ter no máximo 100 caracteres',
        'any.required': 'Nome do treino é obrigatório'
      }),
    
    description: Joi.string()
      .max(1000)
      .optional()
      .allow(''),
    
    category: createEnumValidator(WorkoutCategory)
      .required()
      .messages({
        'any.required': 'Categoria do treino é obrigatória'
      }),
    
    difficulty: createEnumValidator(Difficulty)
      .required()
      .messages({
        'any.required': 'Dificuldade do treino é obrigatória'
      }),
    
    estimatedDuration: Joi.number()
      .min(5)
      .max(300)
      .required()
      .messages({
        'number.min': 'Duração estimada deve ser pelo menos 5 minutos',
        'number.max': 'Duração estimada deve ser no máximo 300 minutos',
        'any.required': 'Duração estimada é obrigatória'
      }),
    
    restBetweenSets: Joi.number()
      .min(0)
      .max(600)
      .optional()
      .default(60),
    
    restBetweenExercises: Joi.number()
      .min(0)
      .max(600)
      .optional()
      .default(120),
    
    isTemplate: Joi.boolean().optional().default(false),
    isPublic: Joi.boolean().optional().default(false),
    
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional(),
    
    targetMuscleGroups: Joi.array()
      .items(Joi.string())
      .max(15)
      .optional(),
    
    equipment: Joi.array()
      .items(Joi.string())
      .max(20)
      .optional(),
    
    exercises: Joi.array()
      .items(Joi.object({
        exerciseId: Joi.string()
          .pattern(patterns.objectId)
          .required(),
        order: Joi.number()
          .min(1)
          .required(),
        sets: Joi.number()
          .min(1)
          .max(20)
          .required(),
        reps: Joi.string()
          .max(50)
          .required(),
        weight: Joi.number()
          .min(0)
          .max(1000)
          .optional(),
        duration: Joi.number()
          .min(0)
          .max(3600)
          .optional(),
        restTime: Joi.number()
          .min(0)
          .max(600)
          .optional(),
        notes: Joi.string()
          .max(500)
          .optional()
      }))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'Treino deve ter pelo menos 1 exercício',
        'array.max': 'Treino pode ter no máximo 50 exercícios',
        'any.required': 'Lista de exercícios é obrigatória'
      })
  }),

  updateWorkout: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .optional(),
    
    description: Joi.string()
      .max(1000)
      .optional()
      .allow(''),
    
    category: createEnumValidator(WorkoutCategory).optional(),
    difficulty: createEnumValidator(Difficulty).optional(),
    
    estimatedDuration: Joi.number()
      .min(5)
      .max(300)
      .optional(),
    
    restBetweenSets: Joi.number()
      .min(0)
      .max(600)
      .optional(),
    
    restBetweenExercises: Joi.number()
      .min(0)
      .max(600)
      .optional(),
    
    isTemplate: Joi.boolean().optional(),
    isPublic: Joi.boolean().optional(),
    
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional(),
    
    targetMuscleGroups: Joi.array()
      .items(Joi.string())
      .max(15)
      .optional(),
    
    equipment: Joi.array()
      .items(Joi.string())
      .max(20)
      .optional(),
    
    exercises: Joi.array()
      .items(Joi.object({
        id: Joi.string()
          .pattern(patterns.objectId)
          .optional(),
        exerciseId: Joi.string()
          .pattern(patterns.objectId)
          .optional(),
        order: Joi.number()
          .min(1)
          .optional(),
        sets: Joi.number()
          .min(1)
          .max(20)
          .optional(),
        reps: Joi.string()
          .max(50)
          .optional(),
        weight: Joi.number()
          .min(0)
          .max(1000)
          .optional(),
        duration: Joi.number()
          .min(0)
          .max(3600)
          .optional(),
        restTime: Joi.number()
          .min(0)
          .max(600)
          .optional(),
        notes: Joi.string()
          .max(500)
          .optional()
      }))
      .max(50)
      .optional()
  }),

  duplicateWorkout: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .required(),
    
    isPublic: Joi.boolean().optional().default(false)
  }),

  shareWorkout: Joi.object({
    userIds: Joi.array()
      .items(Joi.string().pattern(patterns.objectId))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'Deve selecionar pelo menos 1 usuário',
        'array.max': 'Pode compartilhar com no máximo 50 usuários',
        'any.required': 'Lista de usuários é obrigatória'
      })
  })
};

// Exercise validation schemas
export const exerciseValidation = {
  createExercise: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Nome do exercício deve ter pelo menos 3 caracteres',
        'string.max': 'Nome do exercício deve ter no máximo 100 caracteres',
        'any.required': 'Nome do exercício é obrigatório'
      }),
    
    nameEn: Joi.string()
      .max(100)
      .optional(),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Descrição deve ter pelo menos 10 caracteres',
        'string.max': 'Descrição deve ter no máximo 1000 caracteres',
        'any.required': 'Descrição é obrigatória'
      }),
    
    instructions: Joi.array()
      .items(Joi.string().max(500))
      .min(1)
      .max(20)
      .required()
      .messages({
        'array.min': 'Deve ter pelo menos 1 instrução',
        'array.max': 'Pode ter no máximo 20 instruções',
        'any.required': 'Instruções são obrigatórias'
      }),
    
    category: createEnumValidator(ExerciseCategory)
      .required()
      .messages({
        'any.required': 'Categoria do exercício é obrigatória'
      }),
    
    muscleGroups: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'Deve selecionar pelo menos 1 grupo muscular',
        'array.max': 'Pode selecionar no máximo 10 grupos musculares',
        'any.required': 'Grupos musculares são obrigatórios'
      }),
    
    equipment: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'Deve selecionar pelo menos 1 equipamento',
        'array.max': 'Pode selecionar no máximo 10 equipamentos',
        'any.required': 'Equipamentos são obrigatórios'
      }),
    
    difficulty: createEnumValidator(Difficulty)
      .required()
      .messages({
        'any.required': 'Dificuldade é obrigatória'
      }),
    
    images: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .optional(),
    
    videoUrl: Joi.string()
      .uri()
      .optional(),
    
    isPublic: Joi.boolean().optional().default(true),
    
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional()
  }),

  updateExercise: Joi.object({
    name: Joi.string()
      .min(3)
      .max(100)
      .trim()
      .optional(),
    
    nameEn: Joi.string()
      .max(100)
      .optional(),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .optional(),
    
    instructions: Joi.array()
      .items(Joi.string().max(500))
      .min(1)
      .max(20)
      .optional(),
    
    category: createEnumValidator(ExerciseCategory).optional(),
    
    muscleGroups: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(10)
      .optional(),
    
    equipment: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(10)
      .optional(),
    
    difficulty: createEnumValidator(Difficulty).optional(),
    
    images: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .optional(),
    
    videoUrl: Joi.string()
      .uri()
      .optional(),
    
    isPublic: Joi.boolean().optional(),
    
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(20)
      .optional()
  })
};

// Progress validation schemas
export const progressValidation = {
  createProgressEntry: Joi.object({
    type: createEnumValidator(ProgressType)
      .required()
      .messages({
        'any.required': 'Tipo de progresso é obrigatório'
      }),
    
    value: Joi.number()
      .min(0)
      .max(10000)
      .required()
      .messages({
        'number.min': 'Valor deve ser positivo',
        'number.max': 'Valor muito alto',
        'any.required': 'Valor é obrigatório'
      }),
    
    unit: Joi.string()
      .max(20)
      .required()
      .messages({
        'string.max': 'Unidade deve ter no máximo 20 caracteres',
        'any.required': 'Unidade é obrigatória'
      }),
    
    notes: Joi.string()
      .max(500)
      .optional(),
    
    recordedAt: Joi.date()
      .max('now')
      .optional()
  }),

  updateProgressEntry: Joi.object({
    value: Joi.number()
      .min(0)
      .max(10000)
      .optional(),
    
    unit: Joi.string()
      .max(20)
      .optional(),
    
    notes: Joi.string()
      .max(500)
      .optional(),
    
    recordedAt: Joi.date()
      .max('now')
      .optional()
  })
};

// AI validation schemas
export const aiValidation = {
  generateWorkout: Joi.object({
    goals: Joi.array()
      .items(Joi.string().max(100))
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'Deve ter pelo menos 1 objetivo',
        'array.max': 'Pode ter no máximo 10 objetivos',
        'any.required': 'Objetivos são obrigatórios'
      }),
    
    fitnessLevel: createEnumValidator(Difficulty)
      .required()
      .messages({
        'any.required': 'Nível de condicionamento é obrigatório'
      }),
    
    activityLevel: createEnumValidator(ActivityLevel)
      .required()
      .messages({
        'any.required': 'Nível de atividade é obrigatório'
      }),
    
    availableTime: Joi.number()
      .min(10)
      .max(300)
      .required()
      .messages({
        'number.min': 'Tempo disponível deve ser pelo menos 10 minutos',
        'number.max': 'Tempo disponível deve ser no máximo 300 minutos',
        'any.required': 'Tempo disponível é obrigatório'
      }),
    
    availableEquipment: Joi.array()
      .items(Joi.string())
      .min(1)
      .max(20)
      .required()
      .messages({
        'array.min': 'Deve selecionar pelo menos 1 equipamento',
        'array.max': 'Pode selecionar no máximo 20 equipamentos',
        'any.required': 'Equipamentos disponíveis são obrigatórios'
      }),
    
    targetMuscleGroups: Joi.array()
      .items(Joi.string())
      .max(15)
      .optional(),
    
    workoutType: createEnumValidator(WorkoutCategory)
      .required()
      .messages({
        'any.required': 'Tipo de treino é obrigatório'
      }),
    
    intensity: Joi.string()
      .valid('low', 'moderate', 'high')
      .required()
      .messages({
        'any.only': 'Intensidade deve ser baixa, moderada ou alta',
        'any.required': 'Intensidade é obrigatória'
      }),
    
    focusAreas: Joi.array()
      .items(Joi.string())
      .max(10)
      .optional(),
    
    avoidExercises: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .optional(),
    
    injuries: Joi.array()
      .items(Joi.string().max(100))
      .max(10)
      .optional(),
    
    limitations: Joi.array()
      .items(Joi.string().max(100))
      .max(10)
      .optional(),
    
    preferences: Joi.object({
      maxSetsPerExercise: Joi.number()
        .min(1)
        .max(20)
        .optional(),
      preferredRepRange: Joi.string()
        .max(20)
        .optional(),
      restTimePreference: Joi.string()
        .valid('short', 'medium', 'long')
        .optional(),
      includeWarmup: Joi.boolean().optional(),
      includeCooldown: Joi.boolean().optional()
    }).optional(),
    
    previousWorkouts: Joi.array()
      .items(Joi.string().pattern(patterns.objectId))
      .max(10)
      .optional(),
    
    personalNotes: Joi.string()
      .max(1000)
      .optional()
  }),

  rateWorkout: Joi.object({
    workoutId: Joi.string()
      .pattern(patterns.objectId)
      .required()
      .messages({
        'any.required': 'ID do treino é obrigatório'
      }),
    
    rating: Joi.number()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Avaliação deve ser entre 1 e 5',
        'number.max': 'Avaliação deve ser entre 1 e 5',
        'any.required': 'Avaliação é obrigatória'
      }),
    
    difficulty: Joi.number()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Dificuldade deve ser entre 1 e 5',
        'number.max': 'Dificuldade deve ser entre 1 e 5',
        'any.required': 'Dificuldade é obrigatória'
      }),
    
    enjoyment: Joi.number()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Diversão deve ser entre 1 e 5',
        'number.max': 'Diversão deve ser entre 1 e 5',
        'any.required': 'Diversão é obrigatória'
      }),
    
    effectiveness: Joi.number()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'Efetividade deve ser entre 1 e 5',
        'number.max': 'Efetividade deve ser entre 1 e 5',
        'any.required': 'Efetividade é obrigatória'
      }),
    
    feedback: Joi.string()
      .max(1000)
      .required()
      .messages({
        'string.max': 'Feedback deve ter no máximo 1000 caracteres',
        'any.required': 'Feedback é obrigatório'
      }),
    
    completionTime: Joi.number()
      .min(1)
      .max(600)
      .optional(),
    
    fatigue: Joi.number()
      .min(1)
      .max(5)
      .optional(),
    
    soreness: Joi.number()
      .min(1)
      .max(5)
      .optional(),
    
    modifications: Joi.array()
      .items(Joi.string().max(200))
      .max(10)
      .optional()
  })
};

// Query validation schemas
export const queryValidation = {
  pagination: Joi.object({
    page: Joi.number()
      .min(1)
      .max(1000)
      .optional()
      .default(1),
    
    limit: Joi.number()
      .min(1)
      .max(100)
      .optional()
      .default(20)
  }),

  search: Joi.object({
    search: Joi.string()
      .min(1)
      .max(100)
      .optional(),
    
    sortBy: Joi.string()
      .max(50)
      .optional(),
    
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('desc')
  })
};

// ID validation
export const idValidation = Joi.string()
  .pattern(patterns.objectId)
  .required()
  .messages({
    'string.pattern.base': 'ID deve ter formato válido',
    'any.required': 'ID é obrigatório'
  });

// File upload validation
export const fileValidation = {
  image: Joi.object({
    mimetype: Joi.string()
      .valid('image/jpeg', 'image/jpg', 'image/png', 'image/webp')
      .required()
      .messages({
        'any.only': 'Arquivo deve ser uma imagem (JPEG, PNG ou WebP)',
        'any.required': 'Tipo de arquivo é obrigatório'
      }),
    
    size: Joi.number()
      .max(5 * 1024 * 1024) // 5MB
      .required()
      .messages({
        'number.max': 'Arquivo deve ter no máximo 5MB',
        'any.required': 'Tamanho do arquivo é obrigatório'
      })
  })
};
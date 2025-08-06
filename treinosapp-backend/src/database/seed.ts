/**
 * Database Seed
 * Dados iniciais para popular o banco de dados com exercícios brasileiros
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Iniciando seed do banco de dados...');

  try {
    // Limpar dados existentes (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      await prisma.exerciseLog.deleteMany();
      await prisma.workoutLog.deleteMany();
      await prisma.workoutExercise.deleteMany();
      await prisma.workout.deleteMany();
      await prisma.exercise.deleteMany();
      await prisma.progressEntry.deleteMany();
      await prisma.workoutShare.deleteMany();
      await prisma.aIUsage.deleteMany();
      await prisma.user.deleteMany();
      logger.info('🗑️ Dados existentes removidos');
    }

    // 1. Criar usuários de exemplo
    const hashedPassword = await bcrypt.hash('123456', 12);

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@treinosapp.com',
        password: hashedPassword,
        name: 'Administrador',
        userType: 'ADMIN',
        isEmailVerified: true,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          workout: true,
          progress: true,
          social: true
        },
        goals: ['Manter o sistema funcionando']
      }
    });

    const personalTrainer = await prisma.user.create({
      data: {
        email: 'personal@treinosapp.com',
        password: hashedPassword,
        name: 'Carlos Silva',
        userType: 'PERSONAL_TRAINER',
        isEmailVerified: true,
        dateOfBirth: new Date('1985-03-15'),
        gender: 'MALE',
        height: 175,
        weight: 80,
        activityLevel: 'VERY_ACTIVE',
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          workout: true,
          progress: true,
          social: true
        },
        goals: ['Ajudar alunos a alcançar seus objetivos', 'Crescer profissionalmente']
      }
    });

    const student = await prisma.user.create({
      data: {
        email: 'aluno@treinosapp.com',
        password: hashedPassword,
        name: 'Maria Santos',
        userType: 'STUDENT',
        isEmailVerified: true,
        dateOfBirth: new Date('1992-07-20'),
        gender: 'FEMALE',
        height: 165,
        weight: 60,
        activityLevel: 'MODERATELY_ACTIVE',
        personalTrainerId: personalTrainer.id,
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        notifications: {
          workout: true,
          progress: true,
          social: true
        },
        goals: ['Perder peso', 'Ganhar massa muscular', 'Melhorar condicionamento']
      }
    });

    logger.info('👥 Usuários criados com sucesso');

    // 2. Criar exercícios brasileiros populares
    const exercises = [
      // Peito
      {
        name: 'Supino Reto',
        nameEn: 'Bench Press',
        description: 'Exercício fundamental para desenvolvimento do peitoral, deltóides anterior e tríceps.',
        instructions: [
          'Deite no banco com os pés firmes no chão',
          'Pegue a barra com as mãos um pouco mais abertas que a largura dos ombros',
          'Desça a barra controladamente até tocar o peito',
          'Empurre a barra de volta à posição inicial',
          'Mantenha os ombros retraídos durante todo o movimento'
        ],
        category: 'STRENGTH',
        muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS'],
        equipment: ['BARBELL', 'BENCH'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['peito', 'força', 'básico', 'compound']
      },
      {
        name: 'Flexão de Braços',
        nameEn: 'Push-ups',
        description: 'Exercício clássico utilizando apenas o peso corporal para trabalhar peito, ombros e tríceps.',
        instructions: [
          'Posicione-se em prancha com as mãos na largura dos ombros',
          'Mantenha o corpo alinhado da cabeça aos pés',
          'Desça o corpo até o peito quase tocar o chão',
          'Empurre de volta à posição inicial',
          'Mantenha o core contraído durante todo o movimento'
        ],
        category: 'STRENGTH',
        muscleGroups: ['CHEST', 'SHOULDERS', 'TRICEPS', 'CORE'],
        equipment: ['BODYWEIGHT'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['peito', 'peso corporal', 'básico', 'casa']
      },
      {
        name: 'Crucifixo com Halteres',
        nameEn: 'Dumbbell Flyes',
        description: 'Exercício de isolamento para o peitoral com amplitude completa de movimento.',
        instructions: [
          'Deite no banco com um halter em cada mão',
          'Inicie com os braços estendidos sobre o peito',
          'Abra os braços em arco, descendo os halteres',
          'Sinta o alongamento no peitoral',
          'Retorne à posição inicial contraindo o peitoral'
        ],
        category: 'STRENGTH',
        muscleGroups: ['CHEST'],
        equipment: ['DUMBBELL', 'BENCH'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['peito', 'isolamento', 'amplitude']
      },

      // Costas
      {
        name: 'Barra Fixa',
        nameEn: 'Pull-ups',
        description: 'Exercício fundamental para desenvolvimento das costas, bíceps e força funcional.',
        instructions: [
          'Pendure na barra com pegada pronada na largura dos ombros',
          'Inicie com os braços totalmente estendidos',
          'Puxe o corpo para cima até o queixo passar da barra',
          'Desça controladamente à posição inicial',
          'Mantenha o core contraído e evite balançar'
        ],
        category: 'STRENGTH',
        muscleGroups: ['BACK', 'BICEPS', 'SHOULDERS'],
        equipment: ['PULL_UP_BAR'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['costas', 'peso corporal', 'força', 'funcional']
      },
      {
        name: 'Remada Curvada',
        nameEn: 'Bent-over Barbell Row',
        description: 'Exercício composto excelente para desenvolvimento da musculatura das costas.',
        instructions: [
          'Fique em pé com a barra na frente das pernas',
          'Incline o tronco para frente mantendo as costas retas',
          'Puxe a barra em direção ao abdome',
          'Contraia as escápulas no topo do movimento',
          'Desça a barra controladamente'
        ],
        category: 'STRENGTH',
        muscleGroups: ['BACK', 'BICEPS', 'SHOULDERS'],
        equipment: ['BARBELL'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['costas', 'remada', 'força', 'compound']
      },
      {
        name: 'Puxada Frontal',
        nameEn: 'Lat Pulldown',
        description: 'Exercício na polia para desenvolvimento do latíssimo do dorso.',
        instructions: [
          'Sente na máquina de puxada frontal',
          'Pegue a barra com pegada pronada mais larga que os ombros',
          'Puxe a barra até a altura do peito',
          'Contraia as costas no final do movimento',
          'Retorne controladamente à posição inicial'
        ],
        category: 'STRENGTH',
        muscleGroups: ['BACK', 'BICEPS'],
        equipment: ['CABLE_MACHINE'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['costas', 'polia', 'largura']
      },

      // Pernas
      {
        name: 'Agachamento',
        nameEn: 'Squat',
        description: 'O rei dos exercícios para pernas, trabalha quadríceps, glúteos e core.',
        instructions: [
          'Posicione os pés na largura dos ombros',
          'Mantenha o peito erguido e as costas retas',
          'Desça como se fosse sentar em uma cadeira',
          'Desça até os quadris ficarem abaixo dos joelhos',
          'Suba empurrando pelos calcanhares'
        ],
        category: 'STRENGTH',
        muscleGroups: ['QUADRICEPS', 'GLUTES', 'HAMSTRINGS', 'CORE'],
        equipment: ['BODYWEIGHT'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['pernas', 'agachamento', 'funcional', 'básico']
      },
      {
        name: 'Agachamento com Barra',
        nameEn: 'Barbell Back Squat',
        description: 'Variação do agachamento com carga adicional para maior desenvolvimento muscular.',
        instructions: [
          'Posicione a barra no trapézio superior',
          'Desencaixe a barra e dê alguns passos para trás',
          'Posicione os pés na largura dos ombros',
          'Agache mantendo os joelhos alinhados com os pés',
          'Suba com força, mantendo o tronco ereto'
        ],
        category: 'STRENGTH',
        muscleGroups: ['QUADRICEPS', 'GLUTES', 'HAMSTRINGS', 'CORE'],
        equipment: ['BARBELL'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['pernas', 'agachamento', 'força', 'barra', 'compound']
      },
      {
        name: 'Leg Press 45°',
        nameEn: 'Leg Press',
        description: 'Exercício na máquina para trabalhar pernas com segurança e controle.',
        instructions: [
          'Sente na máquina e posicione os pés na plataforma',
          'Mantenha os pés na largura dos ombros',
          'Desça a plataforma até formar 90° nos joelhos',
          'Empurre a plataforma de volta com força',
          'Não trave completamente os joelhos no topo'
        ],
        category: 'STRENGTH',
        muscleGroups: ['QUADRICEPS', 'GLUTES', 'HAMSTRINGS'],
        equipment: ['LEG_PRESS'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['pernas', 'máquina', 'segurança']
      },
      {
        name: 'Stiff',
        nameEn: 'Romanian Deadlift',
        description: 'Exercício excelente para posterior de coxa e glúteos.',
        instructions: [
          'Fique em pé segurando a barra ou halteres',
          'Mantenha as pernas ligeiramente flexionadas',
          'Incline o quadril para trás, descendo o peso',
          'Sinta o alongamento na parte posterior da coxa',
          'Retorne à posição inicial contraindo glúteos e posteriores'
        ],
        category: 'STRENGTH',
        muscleGroups: ['HAMSTRINGS', 'GLUTES'],
        equipment: ['BARBELL', 'DUMBBELL'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['posterior', 'glúteo', 'alongamento', 'cadeia posterior']
      },

      // Ombros
      {
        name: 'Desenvolvimento com Halteres',
        nameEn: 'Dumbbell Shoulder Press',
        description: 'Exercício fundamental para desenvolvimento dos ombros.',
        instructions: [
          'Sente em um banco com encosto ou fique em pé',
          'Segure um halter em cada mão na altura dos ombros',
          'Empurre os halteres para cima até estender os braços',
          'Desça controladamente à posição inicial',
          'Mantenha o core contraído durante todo o movimento'
        ],
        category: 'STRENGTH',
        muscleGroups: ['SHOULDERS', 'TRICEPS'],
        equipment: ['DUMBBELL', 'BENCH'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['ombros', 'desenvolvimento', 'halteres']
      },
      {
        name: 'Elevação Lateral',
        nameEn: 'Lateral Raises',
        description: 'Exercício de isolamento para o deltóide médio.',
        instructions: [
          'Fique em pé com um halter em cada mão',
          'Mantenha os braços ligeiramente flexionados',
          'Eleve os halteres lateralmente até a altura dos ombros',
          'Pause brevemente no topo',
          'Desça controladamente à posição inicial'
        ],
        category: 'STRENGTH',
        muscleGroups: ['SHOULDERS'],
        equipment: ['DUMBBELL'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['ombros', 'isolamento', 'deltóide médio']
      },

      // Bíceps
      {
        name: 'Rosca Direta',
        nameEn: 'Barbell Curl',
        description: 'Exercício clássico para desenvolvimento dos bíceps.',
        instructions: [
          'Fique em pé segurando a barra com pegada supinada',
          'Mantenha os cotovelos próximos ao corpo',
          'Flexione os braços elevando a barra',
          'Contraia os bíceps no topo do movimento',
          'Desça a barra controladamente'
        ],
        category: 'STRENGTH',
        muscleGroups: ['BICEPS'],
        equipment: ['BARBELL'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['bíceps', 'rosca', 'isolamento']
      },
      {
        name: 'Rosca Alternada',
        nameEn: 'Alternating Dumbbell Curl',
        description: 'Exercício unilateral para bíceps com halteres.',
        instructions: [
          'Fique em pé com um halter em cada mão',
          'Alterne a flexão dos braços',
          'Contraia o bíceps de cada braço no topo',
          'Mantenha o outro braço estável',
          'Controle o movimento na descida'
        ],
        category: 'STRENGTH',
        muscleGroups: ['BICEPS'],
        equipment: ['DUMBBELL'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['bíceps', 'alternado', 'unilateral']
      },

      // Tríceps
      {
        name: 'Tríceps Testa',
        nameEn: 'Lying Tricep Extension',
        description: 'Exercício para isolamento dos tríceps deitado.',
        instructions: [
          'Deite no banco segurando a barra ou halteres',
          'Estenda os braços sobre o peito',
          'Flexione apenas os antebraços, descendo o peso',
          'Pare quando sentir alongamento nos tríceps',
          'Estenda os braços de volta à posição inicial'
        ],
        category: 'STRENGTH',
        muscleGroups: ['TRICEPS'],
        equipment: ['BARBELL', 'DUMBBELL', 'BENCH'],
        difficulty: 'INTERMEDIATE',
        isOfficial: true,
        tags: ['tríceps', 'isolamento', 'testa']
      },
      {
        name: 'Tríceps Pulley',
        nameEn: 'Tricep Pushdown',
        description: 'Exercício na polia para tríceps.',
        instructions: [
          'Fique de frente para a polia alta',
          'Segure a barra ou corda com pegada pronada',
          'Mantenha os cotovelos fixos ao lado do corpo',
          'Empurre o peso para baixo estendendo os braços',
          'Retorne controladamente à posição inicial'
        ],
        category: 'STRENGTH',
        muscleGroups: ['TRICEPS'],
        equipment: ['CABLE_MACHINE'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['tríceps', 'polia', 'extensão']
      },

      // Abdomen
      {
        name: 'Abdominal Tradicional',
        nameEn: 'Crunches',
        description: 'Exercício básico para fortalecimento do reto abdominal.',
        instructions: [
          'Deite de costas com os joelhos flexionados',
          'Coloque as mãos atrás da cabeça ou cruzadas no peito',
          'Contraia o abdome elevando os ombros do chão',
          'Pause brevemente no topo',
          'Desça controladamente à posição inicial'
        ],
        category: 'STRENGTH',
        muscleGroups: ['ABS'],
        equipment: ['BODYWEIGHT', 'YOGA_MAT'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['abdomen', 'core', 'básico', 'casa']
      },
      {
        name: 'Prancha',
        nameEn: 'Plank',
        description: 'Exercício isométrico para fortalecimento do core.',
        instructions: [
          'Posicione-se em prancha com antebraços no chão',
          'Mantenha o corpo alinhado da cabeça aos pés',
          'Contraia o abdome e glúteos',
          'Respire normalmente durante o exercício',
          'Mantenha a posição pelo tempo determinado'
        ],
        category: 'ISOMETRIC',
        muscleGroups: ['CORE', 'ABS', 'SHOULDERS'],
        equipment: ['BODYWEIGHT', 'YOGA_MAT'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['core', 'isométrico', 'estabilidade', 'funcional']
      },

      // Cardio
      {
        name: 'Corrida na Esteira',
        nameEn: 'Treadmill Running',
        description: 'Exercício cardiovascular na esteira.',
        instructions: [
          'Ajuste a velocidade e inclinação desejadas',
          'Mantenha uma postura ereta',
          'Apoie o pé do meio para o calcanhar',
          'Mantenha os braços relaxados',
          'Respire de forma ritmada'
        ],
        category: 'CARDIO',
        muscleGroups: ['LOWER_BODY', 'CORE'],
        equipment: ['TREADMILL'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['cardio', 'corrida', 'aeróbico', 'endurance']
      },
      {
        name: 'Bike Ergométrica',
        nameEn: 'Stationary Bike',
        description: 'Exercício cardiovascular de baixo impacto.',
        instructions: [
          'Ajuste o selim na altura adequada',
          'Posicione os pés corretamente nos pedais',
          'Mantenha as costas retas',
          'Pedale em ritmo constante',
          'Ajuste a resistência conforme necessário'
        ],
        category: 'CARDIO',
        muscleGroups: ['LOWER_BODY'],
        equipment: ['STATIONARY_BIKE'],
        difficulty: 'BEGINNER',
        isOfficial: true,
        tags: ['cardio', 'bike', 'baixo impacto', 'pernas']
      }
    ];

    // Criar exercícios
    for (const exerciseData of exercises) {
      await prisma.exercise.create({
        data: {
          ...exerciseData,
          creator: {
            connect: { id: adminUser.id }
          }
        }
      });
    }

    logger.info(`💪 ${exercises.length} exercícios criados com sucesso`);

    // 3. Criar alguns treinos template
    const createdExercises = await prisma.exercise.findMany();
    
    const workoutTemplates = [
      {
        name: 'Treino de Peito e Tríceps',
        description: 'Treino focado no desenvolvimento do peitoral e tríceps para iniciantes e intermediários.',
        category: 'STRENGTH_TRAINING',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: 60,
        isTemplate: true,
        isPublic: true,
        targetMuscleGroups: ['CHEST', 'TRICEPS'],
        equipment: ['BARBELL', 'DUMBBELL', 'BENCH', 'CABLE_MACHINE'],
        tags: ['peito', 'tríceps', 'força', 'hipertrofia'],
        exercises: [
          { name: 'Supino Reto', sets: 4, reps: '8-12', order: 1 },
          { name: 'Crucifixo com Halteres', sets: 3, reps: '10-15', order: 2 },
          { name: 'Flexão de Braços', sets: 3, reps: '12-20', order: 3 },
          { name: 'Tríceps Testa', sets: 3, reps: '10-12', order: 4 },
          { name: 'Tríceps Pulley', sets: 3, reps: '12-15', order: 5 }
        ]
      },
      {
        name: 'Treino de Costas e Bíceps',
        description: 'Treino completo para desenvolvimento das costas e bíceps.',
        category: 'STRENGTH_TRAINING',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: 65,
        isTemplate: true,
        isPublic: true,
        targetMuscleGroups: ['BACK', 'BICEPS'],
        equipment: ['PULL_UP_BAR', 'BARBELL', 'DUMBBELL', 'CABLE_MACHINE'],
        tags: ['costas', 'bíceps', 'puxar', 'largura'],
        exercises: [
          { name: 'Barra Fixa', sets: 4, reps: '6-10', order: 1 },
          { name: 'Remada Curvada', sets: 4, reps: '8-12', order: 2 },
          { name: 'Puxada Frontal', sets: 3, reps: '10-15', order: 3 },
          { name: 'Rosca Direta', sets: 3, reps: '10-12', order: 4 },
          { name: 'Rosca Alternada', sets: 3, reps: '12-15', order: 5 }
        ]
      },
      {
        name: 'Treino de Pernas Completo',
        description: 'Treino intenso para quadríceps, posteriores de coxa e glúteos.',
        category: 'STRENGTH_TRAINING',
        difficulty: 'INTERMEDIATE',
        estimatedDuration: 70,
        isTemplate: true,
        isPublic: true,
        targetMuscleGroups: ['QUADRICEPS', 'HAMSTRINGS', 'GLUTES'],
        equipment: ['BARBELL', 'LEG_PRESS', 'DUMBBELL'],
        tags: ['pernas', 'quadríceps', 'glúteos', 'força'],
        exercises: [
          { name: 'Agachamento com Barra', sets: 4, reps: '8-12', order: 1 },
          { name: 'Leg Press 45°', sets: 4, reps: '12-20', order: 2 },
          { name: 'Stiff', sets: 3, reps: '10-15', order: 3 },
          { name: 'Agachamento', sets: 3, reps: '15-25', order: 4 }
        ]
      },
      {
        name: 'Treino Funcional Iniciante',
        description: 'Treino usando apenas o peso corporal, perfeito para iniciantes.',
        category: 'FUNCTIONAL',
        difficulty: 'BEGINNER',
        estimatedDuration: 30,
        isTemplate: true,
        isPublic: true,
        targetMuscleGroups: ['FULL_BODY'],
        equipment: ['BODYWEIGHT', 'YOGA_MAT'],
        tags: ['funcional', 'peso corporal', 'iniciante', 'casa'],
        exercises: [
          { name: 'Flexão de Braços', sets: 3, reps: '8-15', order: 1 },
          { name: 'Agachamento', sets: 3, reps: '15-25', order: 2 },
          { name: 'Prancha', sets: 3, reps: '30-60 segundos', duration: 45, order: 3 },
          { name: 'Abdominal Tradicional', sets: 3, reps: '15-25', order: 4 }
        ]
      }
    ];

    // Criar treinos template
    for (const workoutData of workoutTemplates) {
      const workout = await prisma.workout.create({
        data: {
          name: workoutData.name,
          description: workoutData.description,
          category: workoutData.category as any,
          difficulty: workoutData.difficulty as any,
          estimatedDuration: workoutData.estimatedDuration,
          isTemplate: workoutData.isTemplate,
          isPublic: workoutData.isPublic,
          targetMuscleGroups: workoutData.targetMuscleGroups as any,
          equipment: workoutData.equipment as any,
          tags: workoutData.tags,
          creator: {
            connect: { id: personalTrainer.id }
          }
        }
      });

      // Adicionar exercícios ao treino
      for (const exerciseData of workoutData.exercises) {
        const exercise = createdExercises.find(ex => ex.name === exerciseData.name);
        if (exercise) {
          await prisma.workoutExercise.create({
            data: {
              workout: { connect: { id: workout.id } },
              exercise: { connect: { id: exercise.id } },
              order: exerciseData.order,
              sets: exerciseData.sets,
              reps: exerciseData.reps,
              duration: exerciseData.duration
            }
          });
        }
      }
    }

    logger.info(`🏋️‍♂️ ${workoutTemplates.length} treinos template criados com sucesso`);

    // 4. Criar algumas entradas de progresso para o aluno
    const progressEntries = [
      { type: 'WEIGHT', value: 60, unit: 'kg', recordedAt: new Date('2024-01-01') },
      { type: 'WEIGHT', value: 59.5, unit: 'kg', recordedAt: new Date('2024-01-15') },
      { type: 'WEIGHT', value: 59, unit: 'kg', recordedAt: new Date('2024-02-01') },
      { type: 'BODY_FAT', value: 25, unit: '%', recordedAt: new Date('2024-01-01') },
      { type: 'BODY_FAT', value: 24, unit: '%', recordedAt: new Date('2024-02-01') },
      { type: 'MAX_BENCH_PRESS', value: 40, unit: 'kg', recordedAt: new Date('2024-01-01') },
      { type: 'MAX_BENCH_PRESS', value: 45, unit: 'kg', recordedAt: new Date('2024-02-01') }
    ];

    for (const entry of progressEntries) {
      await prisma.progressEntry.create({
        data: {
          ...entry,
          type: entry.type as any,
          user: { connect: { id: student.id } }
        }
      });
    }

    logger.info(`📊 ${progressEntries.length} entradas de progresso criadas`);

    // 5. Criar alguns logs de treino para demonstrar histórico
    const workouts = await prisma.workout.findMany({
      include: { exercises: true }
    });

    if (workouts.length > 0) {
      const workoutLog = await prisma.workoutLog.create({
        data: {
          user: { connect: { id: student.id } },
          workout: { connect: { id: workouts[0].id } },
          startedAt: new Date('2024-02-01T06:00:00Z'),
          completedAt: new Date('2024-02-01T07:00:00Z'),
          duration: 60,
          rating: 4,
          notes: 'Treino muito bom! Senti que consegui dar o máximo.'
        }
      });

      // Adicionar logs dos exercícios
      for (const workoutExercise of workouts[0].exercises) {
        for (let set = 1; set <= workoutExercise.sets; set++) {
          await prisma.exerciseLog.create({
            data: {
              workoutLog: { connect: { id: workoutLog.id } },
              exercise: { connect: { id: workoutExercise.exerciseId } },
              setNumber: set,
              reps: set === 1 ? 12 : set === 2 ? 10 : 8,
              weight: workoutExercise.weight || 20,
              completed: true
            }
          });
        }
      }
    }

    logger.info('📝 Logs de treino criados com sucesso');

    logger.info('✅ Seed do banco de dados concluído com sucesso!');
    logger.info('');
    logger.info('👥 Usuários criados:');
    logger.info(`   Admin: admin@treinosapp.com (senha: 123456)`);
    logger.info(`   Personal: personal@treinosapp.com (senha: 123456)`);
    logger.info(`   Aluno: aluno@treinosapp.com (senha: 123456)`);
    logger.info('');
    logger.info('🎯 Use estes usuários para testar a aplicação!');

  } catch (error) {
    logger.error('❌ Erro durante o seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar seed se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Erro no seed:', error);
      process.exit(1);
    });
}

export default main;
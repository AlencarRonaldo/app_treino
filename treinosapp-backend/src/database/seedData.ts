import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Dados de exercícios brasileiros
export const brazilianExercises = [
  // STRENGTH - PEITO
  {
    name: "Supino Reto com Barra",
    description: "Exercício fundamental para desenvolvimento do peitoral maior",
    instructions: JSON.stringify([
      "Deite no banco com os pés firmemente apoiados no chão",
      "Pegue a barra com pegada pronada, ligeiramente mais larga que os ombros",
      "Desça a barra controladamente até tocar o peito",
      "Empurre a barra para cima até a extensão completa dos braços"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["peito", "triceps", "ombros"]),
    equipment: JSON.stringify(["barra", "banco", "anilhas"]),
    difficulty: "INTERMEDIATE",
    isOfficial: true,
    tags: JSON.stringify(["peito", "força", "massa muscular"])
  },
  {
    name: "Supino Inclinado com Halteres",
    description: "Trabalha principalmente a porção superior do peitoral",
    instructions: JSON.stringify([
      "Ajuste o banco em 30-45 graus de inclinação",
      "Segure os halteres com pegada neutra",
      "Desça os halteres controladamente até sentir alongamento no peito",
      "Empurre os halteres para cima contraindo o peitoral"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["peito superior", "triceps", "ombros"]),
    equipment: JSON.stringify(["halteres", "banco inclinado"]),
    difficulty: "INTERMEDIATE",
    isOfficial: true,
    tags: JSON.stringify(["peito", "halteres", "inclinado"])
  },
  {
    name: "Flexão de Braços",
    description: "Exercício clássico de peso corporal para peito e braços",
    instructions: JSON.stringify([
      "Posicione-se em prancha com mãos um pouco mais largas que os ombros",
      "Mantenha o corpo alinhado da cabeça aos pés",
      "Desça controladamente até o peito quase tocar o chão",
      "Empurre o corpo para cima até extensão completa dos braços"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["peito", "triceps", "core"]),
    equipment: JSON.stringify(["peso corporal"]),
    difficulty: "BEGINNER",
    isOfficial: true,
    tags: JSON.stringify(["calistenia", "peso corporal", "funcional"])
  },
  
  // STRENGTH - COSTAS
  {
    name: "Barra Fixa",
    description: "Exercício essencial para desenvolvimento das costas e bíceps",
    instructions: JSON.stringify([
      "Pendure-se na barra com pegada pronada, mãos na largura dos ombros",
      "Contraia as escápulas e puxe o corpo para cima",
      "Leve o queixo acima da barra",
      "Desça controladamente até extensão completa dos braços"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["latíssimo", "romboides", "bíceps"]),
    equipment: JSON.stringify(["barra fixa"]),
    difficulty: "INTERMEDIATE",
    isOfficial: true,
    tags: JSON.stringify(["costas", "peso corporal", "funcional"])
  },
  {
    name: "Remada Curvada com Barra",
    description: "Excelente para espessura das costas e retração escapular",
    instructions: JSON.stringify([
      "Fique em pé com joelhos levemente flexionados",
      "Incline o tronco para frente mantendo as costas retas",
      "Segure a barra com pegada pronada",
      "Puxe a barra em direção ao abdômen contraindo as costas"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["latíssimo", "romboides", "trapézio", "bíceps"]),
    equipment: JSON.stringify(["barra", "anilhas"]),
    difficulty: "INTERMEDIATE",
    isOfficial: true,
    tags: JSON.stringify(["costas", "remada", "postura"])
  },
  
  // STRENGTH - PERNAS
  {
    name: "Agachamento Livre",
    description: "O rei dos exercícios para membros inferiores",
    instructions: JSON.stringify([
      "Posicione a barra no trapézio superior",
      "Pés na largura dos ombros, pontas ligeiramente abertas",
      "Desça flexionando quadris e joelhos simultaneamente",
      "Desça até coxas paralelas ao chão",
      "Suba empurrando o chão com os pés"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["quadríceps", "glúteos", "isquiotibiais", "core"]),
    equipment: JSON.stringify(["barra", "anilhas", "rack"]),
    difficulty: "INTERMEDIATE",
    isOfficial: true,
    tags: JSON.stringify(["pernas", "glúteo", "funcional"])
  },
  {
    name: "Leg Press 45°",
    description: "Exercício seguro para desenvolvimento das pernas",
    instructions: JSON.stringify([
      "Sente no aparelho com costas bem apoiadas",
      "Posicione os pés na plataforma na largura dos ombros",
      "Desça controladamente flexionando joelhos e quadris",
      "Empurre a plataforma até quase extensão completa das pernas"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["quadríceps", "glúteos", "isquiotibiais"]),
    equipment: JSON.stringify(["leg press"]),
    difficulty: "BEGINNER",
    isOfficial: true,
    tags: JSON.stringify(["pernas", "máquina", "seguro"])
  },
  {
    name: "Levantamento Terra",
    description: "Exercício completo para posterior das pernas e costas",
    instructions: JSON.stringify([
      "Fique em pé com a barra próxima às canelas",
      "Flexione quadris e joelhos para segurar a barra",
      "Mantenha as costas neutras e peito estufado",
      "Levante a barra estendendo quadris e joelhos simultaneamente"
    ]),
    category: "STRENGTH",
    muscleGroups: JSON.stringify(["isquiotibiais", "glúteos", "eretores", "trapézio"]),
    equipment: JSON.stringify(["barra", "anilhas"]),
    difficulty: "ADVANCED",
    isOfficial: true,
    tags: JSON.stringify(["posterior", "força", "funcional"])
  },
  
  // CARDIO
  {
    name: "Esteira - Caminhada",
    description: "Exercício cardiovascular de baixo impacto",
    instructions: JSON.stringify([
      "Ajuste a velocidade entre 4-6 km/h",
      "Mantenha postura ereta durante o exercício",
      "Use os braços naturalmente no movimento",
      "Mantenha ritmo constante por toda a duração"
    ]),
    category: "CARDIO",
    muscleGroups: JSON.stringify(["cardiovascular", "pernas"]),
    equipment: JSON.stringify(["esteira"]),
    difficulty: "BEGINNER",
    isOfficial: true,
    tags: JSON.stringify(["cardio", "baixo impacto", "queima gordura"])
  },
  {
    name: "Bike Ergométrica",
    description: "Exercício cardiovascular focado em membros inferiores",
    instructions: JSON.stringify([
      "Ajuste a altura do selim na altura do quadril",
      "Mantenha cadência entre 60-80 rpm",
      "Segure o guidão levemente, sem apoiar peso",
      "Varie a resistência conforme o treino"
    ]),
    category: "CARDIO",
    muscleGroups: JSON.stringify(["cardiovascular", "quadríceps", "glúteos"]),
    equipment: JSON.stringify(["bike ergométrica"]),
    difficulty: "BEGINNER",
    isOfficial: true,
    tags: JSON.stringify(["cardio", "baixo impacto", "resistência"])
  },
  
  // FUNCTIONAL
  {
    name: "Burpee",
    description: "Exercício funcional completo que trabalha corpo todo",
    instructions: JSON.stringify([
      "Comece em pé, depois agache e coloque as mãos no chão",
      "Salte as pernas para trás ficando em prancha",
      "Faça uma flexão (opcional)",
      "Salte as pernas de volta e pule com braços para cima"
    ]),
    category: "FUNCTIONAL",
    muscleGroups: JSON.stringify(["corpo todo", "cardiovascular"]),
    equipment: JSON.stringify(["peso corporal"]),
    difficulty: "INTERMEDIATE",
    isOfficial: true,
    tags: JSON.stringify(["funcional", "hiit", "queima caloria"])
  },
  {
    name: "Prancha Abdominal",
    description: "Exercício isométrico para fortalecimento do core",
    instructions: JSON.stringify([
      "Posicione-se em prancha com antebraços no chão",
      "Mantenha corpo alinhado da cabeça aos pés",
      "Contraia abdômen e glúteos",
      "Respire normalmente e mantenha a posição"
    ]),
    category: "FUNCTIONAL",
    muscleGroups: JSON.stringify(["core", "abdômen", "estabilizadores"]),
    equipment: JSON.stringify(["peso corporal"]),
    difficulty: "BEGINNER",
    isOfficial: true,
    tags: JSON.stringify(["core", "isométrico", "estabilidade"])
  }
];

// Dados de usuários de exemplo
export const sampleUsers = [
  {
    email: "joao.personal@treinosapp.com",
    password: "123456",
    name: "João Silva Personal",
    userType: "PERSONAL_TRAINER",
    height: 175,
    weight: 80.5,
    birthDate: new Date("1985-03-15"),
    gender: "MALE",
    fitnessLevel: "ADVANCED",
    primaryGoal: "Ajudar alunos a alcançarem seus objetivos",
    activityLevel: "VERY_ACTIVE",
    emailVerified: true
  },
  {
    email: "maria.aluna@treinosapp.com",
    password: "123456",
    name: "Maria Santos",
    userType: "STUDENT",
    height: 165,
    weight: 60.0,
    birthDate: new Date("1995-07-22"),
    gender: "FEMALE",
    fitnessLevel: "BEGINNER",
    primaryGoal: "Perder peso e ganhar condicionamento",
    activityLevel: "LIGHTLY_ACTIVE",
    emailVerified: true
  },
  {
    email: "carlos.estudante@treinosapp.com",
    password: "123456",
    name: "Carlos Oliveira",
    userType: "STUDENT",
    height: 178,
    weight: 75.0,
    birthDate: new Date("1990-11-08"),
    gender: "MALE",
    fitnessLevel: "INTERMEDIATE",
    primaryGoal: "Ganho de massa muscular",
    activityLevel: "MODERATELY_ACTIVE",
    emailVerified: true
  }
];

// Dados de treinos de exemplo
export const sampleWorkouts = [
  {
    name: "Treino A - Peito e Tríceps",
    description: "Treino focado no desenvolvimento do peitoral e tríceps para iniciantes",
    category: "STRENGTH",
    estimatedDuration: 60,
    difficulty: "BEGINNER",
    isTemplate: true,
    isPublic: true,
    tags: JSON.stringify(["peito", "triceps", "iniciante"]),
    targetMuscleGroups: JSON.stringify(["peito", "triceps"]),
    equipment: JSON.stringify(["halteres", "banco", "aparelhos"]),
    exercises: [
      { exerciseName: "Supino Reto com Barra", order: 1, sets: 3, reps: "8-12", restTime: 120 },
      { exerciseName: "Supino Inclinado com Halteres", order: 2, sets: 3, reps: "10-15", restTime: 90 },
      { exerciseName: "Flexão de Braços", order: 3, sets: 2, reps: "até a falha", restTime: 60 }
    ]
  },
  {
    name: "Treino B - Costas e Bíceps",
    description: "Treino completo para desenvolvimento das costas e bíceps",
    category: "STRENGTH",
    estimatedDuration: 65,
    difficulty: "INTERMEDIATE",
    isTemplate: true,
    isPublic: true,
    tags: JSON.stringify(["costas", "biceps", "intermediário"]),
    targetMuscleGroups: JSON.stringify(["costas", "biceps"]),
    equipment: JSON.stringify(["barra", "halteres", "aparelhos"]),
    exercises: [
      { exerciseName: "Barra Fixa", order: 1, sets: 3, reps: "6-10", restTime: 120 },
      { exerciseName: "Remada Curvada com Barra", order: 2, sets: 4, reps: "8-12", restTime: 90 }
    ]
  },
  {
    name: "Treino C - Pernas Completo",
    description: "Treino intenso para quadríceps, glúteos e posteriores",
    category: "STRENGTH",
    estimatedDuration: 75,
    difficulty: "INTERMEDIATE",
    isTemplate: true,
    isPublic: true,
    tags: JSON.stringify(["pernas", "glúteo", "funcional"]),
    targetMuscleGroups: JSON.stringify(["quadríceps", "glúteos", "isquiotibiais"]),
    equipment: JSON.stringify(["barra", "aparelhos", "peso corporal"]),
    exercises: [
      { exerciseName: "Agachamento Livre", order: 1, sets: 4, reps: "6-10", restTime: 180 },
      { exerciseName: "Leg Press 45°", order: 2, sets: 3, reps: "12-15", restTime: 120 },
      { exerciseName: "Levantamento Terra", order: 3, sets: 3, reps: "5-8", restTime: 180 }
    ]
  },
  {
    name: "HIIT Cardio Funcional",
    description: "Treino intervalado de alta intensidade com exercícios funcionais",
    category: "HIIT",
    estimatedDuration: 30,
    difficulty: "INTERMEDIATE",
    isTemplate: true,
    isPublic: true,
    tags: JSON.stringify(["hiit", "funcional", "queima gordura"]),
    targetMuscleGroups: JSON.stringify(["corpo todo", "cardiovascular"]),
    equipment: JSON.stringify(["peso corporal"]),
    exercises: [
      { exerciseName: "Burpee", order: 1, sets: 4, reps: "30 segundos", restTime: 30 },
      { exerciseName: "Prancha Abdominal", order: 2, sets: 3, reps: "45 segundos", restTime: 15 }
    ]
  }
];

export async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Limpar dados existentes
    await prisma.workoutExercise.deleteMany();
    await prisma.workoutSession.deleteMany();
    await prisma.workout.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.progressRecord.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Dados existentes removidos');

    // Criar exercícios
    const exercises = [];
    for (const exerciseData of brazilianExercises) {
      const exercise = await prisma.exercise.create({
        data: exerciseData
      });
      exercises.push(exercise);
    }
    console.log(`✅ ${exercises.length} exercícios criados`);

    // Criar usuários
    const users = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        }
      });
      users.push(user);
    }
    console.log(`✅ ${users.length} usuários criados`);

    // Relacionar alunos com personal trainer
    const personalTrainer = users.find(u => u.userType === 'PERSONAL_TRAINER');
    const students = users.filter(u => u.userType === 'STUDENT');
    
    for (const student of students) {
      await prisma.user.update({
        where: { id: student.id },
        data: { trainerId: personalTrainer?.id }
      });
    }
    console.log('✅ Relacionamentos trainer-student criados');

    // Criar treinos
    const workouts = [];
    for (const workoutData of sampleWorkouts) {
      const { exercises: workoutExercises, ...workoutInfo } = workoutData;
      
      const workout = await prisma.workout.create({
        data: {
          ...workoutInfo,
          userId: personalTrainer?.id || users[0].id
        }
      });

      // Adicionar exercícios ao treino
      for (const exerciseInfo of workoutExercises) {
        const exercise = exercises.find(e => e.name === exerciseInfo.exerciseName);
        if (exercise) {
          await prisma.workoutExercise.create({
            data: {
              workoutId: workout.id,
              exerciseId: exercise.id,
              order: exerciseInfo.order,
              sets: exerciseInfo.sets,
              reps: exerciseInfo.reps,
              restTime: exerciseInfo.restTime
            }
          });
        }
      }

      workouts.push(workout);
    }
    console.log(`✅ ${workouts.length} treinos criados`);

    // Criar alguns registros de progresso
    const progressRecords = [
      { userId: students[0].id, type: 'WEIGHT', value: 60.0, unit: 'kg', notes: 'Peso inicial' },
      { userId: students[0].id, type: 'BODY_FAT', value: 25.0, unit: '%', notes: 'Medição inicial' },
      { userId: students[1].id, type: 'WEIGHT', value: 75.0, unit: 'kg', notes: 'Peso inicial' },
      { userId: students[1].id, type: 'MUSCLE_MASS', value: 45.0, unit: 'kg', notes: 'Massa muscular inicial' }
    ];

    for (const record of progressRecords) {
      await prisma.progressRecord.create({ data: record });
    }
    console.log('✅ Registros de progresso criados');

    // Criar uma sessão de treino de exemplo
    const sampleSession = await prisma.workoutSession.create({
      data: {
        userId: students[0].id,
        workoutId: workouts[0].id,
        startTime: new Date(Date.now() - 3600000), // 1 hora atrás
        endTime: new Date(),
        duration: 60,
        completed: true,
        rating: 4,
        notes: 'Primeiro treino completo! Senti um pouco de dificuldade no supino.'
      }
    });
    console.log('✅ Sessão de treino de exemplo criada');

    console.log('\n🎉 Seed concluído com sucesso!');
    console.log('\n📊 Resumo dos dados criados:');
    console.log(`👤 Usuários: ${users.length}`);
    console.log(`💪 Exercícios: ${exercises.length}`);
    console.log(`🏋️ Treinos: ${workouts.length}`);
    console.log(`📈 Registros de progresso: ${progressRecords.length}`);
    console.log(`⏱️ Sessões de treino: 1`);

    return {
      users: users.length,
      exercises: exercises.length,
      workouts: workouts.length,
      progressRecords: progressRecords.length,
      sessions: 1
    };

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
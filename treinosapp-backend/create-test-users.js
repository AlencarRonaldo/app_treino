const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🌱 Criando usuários de teste...');

    // Limpar usuários existentes
    await prisma.user.deleteMany();
    console.log('✅ Usuários existentes removidos');

    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Criar usuários de teste
    const users = [
      {
        email: 'joao.personal@treinosapp.com',
        password: hashedPassword,
        name: 'João Silva Personal',
        userType: 'PERSONAL_TRAINER',
        height: 175,
        weight: 80.5,
        birthDate: new Date('1985-03-15'),
        gender: 'MALE',
        fitnessLevel: 'ADVANCED',
        primaryGoal: 'Ajudar alunos a alcançarem seus objetivos',
        activityLevel: 'VERY_ACTIVE',
        emailVerified: true
      },
      {
        email: 'maria.aluna@treinosapp.com',
        password: hashedPassword,
        name: 'Maria Santos',
        userType: 'STUDENT',
        height: 165,
        weight: 60.0,
        birthDate: new Date('1995-07-22'),
        gender: 'FEMALE',
        fitnessLevel: 'BEGINNER',
        primaryGoal: 'Perder peso e ganhar condicionamento',
        activityLevel: 'LIGHTLY_ACTIVE',
        emailVerified: true
      },
      {
        email: 'carlos.estudante@treinosapp.com',
        password: hashedPassword,
        name: 'Carlos Oliveira',
        userType: 'STUDENT',
        height: 178,
        weight: 75.0,
        birthDate: new Date('1990-11-08'),
        gender: 'MALE',
        fitnessLevel: 'INTERMEDIATE',
        primaryGoal: 'Ganho de massa muscular',
        activityLevel: 'MODERATELY_ACTIVE',
        emailVerified: true
      }
    ];

    for (const userData of users) {
      const user = await prisma.user.create({
        data: userData
      });
      console.log(`✅ Usuário criado: ${user.name} (${user.email})`);
    }

    // Relacionar alunos com personal trainer
    const personalTrainer = await prisma.user.findFirst({
      where: { userType: 'PERSONAL_TRAINER' }
    });

    if (personalTrainer) {
      await prisma.user.updateMany({
        where: { userType: 'STUDENT' },
        data: { trainerId: personalTrainer.id }
      });
      console.log('✅ Relacionamentos trainer-student criados');
    }

    console.log('\n🎉 Usuários de teste criados com sucesso!');
    console.log('\n📋 Credenciais de teste:');
    console.log('👤 Personal Trainer: joao.personal@treinosapp.com / 123456');
    console.log('👤 Aluna: maria.aluna@treinosapp.com / 123456');
    console.log('👤 Aluno: carlos.estudante@treinosapp.com / 123456');

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();

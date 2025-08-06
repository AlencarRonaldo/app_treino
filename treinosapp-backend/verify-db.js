const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyDatabase() {
  try {
    console.log('🔍 Verificando dados do banco...');
    
    const userCount = await prisma.user.count();
    const exerciseCount = await prisma.exercise.count();
    const workoutCount = await prisma.workout.count();
    const progressCount = await prisma.progressRecord.count();
    const sessionCount = await prisma.workoutSession.count();
    
    console.log(`👤 Usuários: ${userCount}`);
    console.log(`💪 Exercícios: ${exerciseCount}`);
    console.log(`🏋️ Treinos: ${workoutCount}`);
    console.log(`📈 Registros de progresso: ${progressCount}`);
    console.log(`⏱️ Sessões de treino: ${sessionCount}`);
    
    if (userCount > 0) {
      console.log('\n👥 Usuários cadastrados:');
      const users = await prisma.user.findMany({
        select: {
          name: true,
          email: true,
          userType: true
        }
      });
      users.forEach(user => {
        console.log(`  • ${user.name} (${user.email}) - ${user.userType}`);
      });
    }
    
    if (exerciseCount > 0) {
      console.log('\n💪 Alguns exercícios disponíveis:');
      const exercises = await prisma.exercise.findMany({
        select: {
          name: true,
          category: true,
          difficulty: true
        },
        take: 5
      });
      exercises.forEach(ex => {
        console.log(`  • ${ex.name} (${ex.category} - ${ex.difficulty})`);
      });
    }
    
    console.log('\n✅ Banco de dados verificado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao verificar banco:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEmailVerification() {
  try {
    console.log('🔧 Corrigindo verificação de email para usuários de teste...');
    
    // Marcar todos os usuários como email verificado
    const result = await prisma.user.updateMany({
      where: {
        email: {
          in: [
            'joao.personal@treinosapp.com',
            'maria.aluna@treinosapp.com', 
            'carlos.estudante@treinosapp.com'
          ]
        }
      },
      data: {
        emailVerified: true
      }
    });
    
    console.log(`✅ ${result.count} usuários tiveram seus emails marcados como verificados`);
    
    // Verificar se a correção funcionou
    const users = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'joao.personal@treinosapp.com',
            'maria.aluna@treinosapp.com', 
            'carlos.estudante@treinosapp.com'
          ]
        }
      },
      select: {
        email: true,
        name: true,
        emailVerified: true
      }
    });
    
    console.log('\n📊 Status dos usuários:');
    users.forEach(user => {
      console.log(`  • ${user.name} (${user.email}): ${user.emailVerified ? '✅ Verificado' : '❌ Não verificado'}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao corrigir verificação de email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixEmailVerification();
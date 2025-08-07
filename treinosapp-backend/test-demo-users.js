/**
 * Testar especificamente os usuários demo criados
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const demoCredentials = [
  { email: 'demo.personal@treinosapp.com', password: '123456' },
  { email: 'demo.aluno@treinosapp.com', password: '123456' }
];

async function testDemoUsers() {
  try {
    console.log('🧪 Testando usuários demo...\n');

    for (const cred of demoCredentials) {
      const user = await prisma.user.findUnique({
        where: { email: cred.email },
        select: {
          id: true,
          name: true,
          email: true,
          password: true,
          userType: true,
          emailVerified: true
        }
      });

      if (user) {
        const isValidPassword = await bcrypt.compare(cred.password, user.password);
        
        if (isValidPassword) {
          console.log(`✅ ${user.email} (${cred.password})`);
          console.log(`   Nome: ${user.name}`);
          console.log(`   Tipo: ${user.userType}`);
          console.log(`   Email Verificado: ${user.emailVerified ? 'Sim' : 'Não'}\n`);
        } else {
          console.log(`❌ ${cred.email} - Senha incorreta\n`);
        }
      } else {
        console.log(`❌ ${cred.email} - Usuário não encontrado\n`);
      }
    }

    console.log('🎯 CREDENCIAIS DEMO FUNCIONAIS:');
    console.log('================================');
    console.log('Personal Trainer: demo.personal@treinosapp.com / 123456');
    console.log('Aluno: demo.aluno@treinosapp.com / 123456');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDemoUsers();
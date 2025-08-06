/**
 * Criar usuário de teste usando Prisma Client
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestUser() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Criando usuário de teste...');
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);
    
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: 'joao.personal@treinosapp.com' }
    });
    
    if (existingUser) {
      console.log('⚠️ Usuário já existe, atualizando...');
      
      const updatedUser = await prisma.user.update({
        where: { email: 'joao.personal@treinosapp.com' },
        data: {
          password: hashedPassword,
          name: 'João Personal Trainer',
          userType: 'PERSONAL_TRAINER',
          emailVerified: true
        }
      });
      
      console.log('✅ Usuário atualizado:', updatedUser.email);
    } else {
      // Criar novo usuário
      const user = await prisma.user.create({
        data: {
          email: 'joao.personal@treinosapp.com',
          password: hashedPassword,
          name: 'João Personal Trainer',
          userType: 'PERSONAL_TRAINER',
          emailVerified: true
        }
      });
      
      console.log('✅ Usuário criado:', user.email);
    }
    
    console.log('📧 Email: joao.personal@treinosapp.com');
    console.log('🔑 Senha: 123456');
    console.log('👤 Tipo: Personal Trainer');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
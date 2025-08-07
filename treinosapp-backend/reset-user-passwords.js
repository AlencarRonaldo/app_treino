/**
 * Script para resetar senhas de todos os usuários para senha padrão de teste
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = '123456';

async function resetAllUserPasswords() {
  try {
    console.log('🔄 Resetando senhas de todos os usuários...\n');

    // Buscar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        userType: true
      }
    });

    console.log(`👥 Encontrados ${users.length} usuários para atualizar:`);
    users.forEach(user => {
      console.log(`  • ${user.name} (${user.email}) - ${user.userType}`);
    });

    // Hash da senha padrão
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);
    console.log(`\n🔐 Nova senha criptografada gerada`);

    // Atualizar todos os usuários
    const updateResult = await prisma.user.updateMany({
      data: {
        password: hashedPassword,
        emailVerified: true // Aproveitar para verificar todos os emails
      }
    });

    console.log(`\n✅ ${updateResult.count} usuários atualizados com sucesso!`);

    console.log('\n🔑 CREDENCIAIS ATUALIZADAS:');
    console.log('========================================');
    console.log(`Senha padrão para todos: ${DEFAULT_PASSWORD}`);
    console.log('Usuários disponíveis:');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Senha: ${DEFAULT_PASSWORD}`);
      console.log(`   Nome: ${user.name}`);
      console.log(`   Tipo: ${user.userType}`);
      console.log('   ----------------------------------------');
    });

    // Criar usuários demo adicionais se necessário
    await createAdditionalDemoUsers();

    return users;

  } catch (error) {
    console.error('❌ Erro ao resetar senhas:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdditionalDemoUsers() {
  console.log('\n🔧 Verificando/criando usuários demo adicionais...');

  const demoUsers = [
    {
      email: 'demo.personal@treinosapp.com',
      name: 'Demo Personal Trainer',
      userType: 'PERSONAL_TRAINER'
    },
    {
      email: 'demo.aluno@treinosapp.com', 
      name: 'Demo Aluno',
      userType: 'STUDENT'
    }
  ];

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const userData of demoUsers) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            ...userData,
            password: hashedPassword,
            emailVerified: true
          }
        });
        console.log(`✅ Criado: ${newUser.email} - ${newUser.userType}`);
      } else {
        console.log(`⚠️ Já existe: ${userData.email}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao criar ${userData.email}: ${error.message}`);
    }
  }
}

// Executar reset
resetAllUserPasswords()
  .then((users) => {
    console.log('\n🎉 Reset de senhas concluído com sucesso!');
    console.log('\n💡 INSTRUÇÕES PARA TESTE:');
    console.log('1. Use qualquer email da lista acima');
    console.log(`2. Senha: ${DEFAULT_PASSWORD}`);
    console.log('3. Todos os emails estão verificados');
    console.log('\n📱 Teste no app mobile com essas credenciais');
  })
  .catch((error) => {
    console.error('❌ Falha no reset:', error);
  });
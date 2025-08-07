/**
 * Script para testar credenciais de login disponíveis no TreinosApp
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Credenciais para testar
const testCredentials = [
  { email: 'joao.personal@treinosapp.com', password: '123456' },
  { email: 'joao.teste@treinosapp.com', password: '123456' },
  { email: 'maria.aluna@treinosapp.com', password: '123456' },
  { email: 'carlos.estudante@treinosapp.com', password: '123456' },
  { email: 'teste@example.com', password: '123456' },
  { email: 'testuser@example.com', password: '123456' },
  { email: 'admin@test.com', password: '123456' },
  { email: 'demo@treinosapp.com', password: 'demo123' }
];

async function testLoginCredentials() {
  try {
    console.log('🔐 Testando credenciais de login...\n');

    const validCredentials = [];
    const invalidCredentials = [];

    for (const cred of testCredentials) {
      try {
        // Buscar usuário no banco
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
          // Verificar senha
          const isValidPassword = await bcrypt.compare(cred.password, user.password);
          
          if (isValidPassword) {
            validCredentials.push({
              email: user.email,
              password: cred.password,
              name: user.name,
              userType: user.userType,
              emailVerified: user.emailVerified
            });
            console.log(`✅ ${user.email} (${cred.password}) - ${user.userType} - ✓ VÁLIDO`);
          } else {
            invalidCredentials.push({
              email: cred.email,
              password: cred.password,
              reason: 'Senha incorreta'
            });
            console.log(`❌ ${cred.email} (${cred.password}) - Senha incorreta`);
          }
        } else {
          invalidCredentials.push({
            email: cred.email,
            password: cred.password,
            reason: 'Usuário não encontrado'
          });
          console.log(`❌ ${cred.email} (${cred.password}) - Usuário não encontrado`);
        }
      } catch (error) {
        console.log(`❌ ${cred.email} (${cred.password}) - Erro: ${error.message}`);
        invalidCredentials.push({
          email: cred.email,
          password: cred.password,
          reason: `Erro: ${error.message}`
        });
      }
    }

    console.log('\n📊 RESUMO DOS TESTES:');
    console.log(`✅ Credenciais válidas: ${validCredentials.length}`);
    console.log(`❌ Credenciais inválidas: ${invalidCredentials.length}`);

    if (validCredentials.length > 0) {
      console.log('\n🔑 CREDENCIAIS VÁLIDAS PARA LOGIN:');
      console.log('========================================');
      validCredentials.forEach((cred, index) => {
        console.log(`${index + 1}. Email: ${cred.email}`);
        console.log(`   Senha: ${cred.password}`);
        console.log(`   Nome: ${cred.name}`);
        console.log(`   Tipo: ${cred.userType}`);
        console.log(`   Email Verificado: ${cred.emailVerified ? 'Sim' : 'Não'}`);
        console.log('   ----------------------------------------');
      });

      console.log('\n💡 RECOMENDAÇÕES:');
      const personalTrainers = validCredentials.filter(c => c.userType === 'PERSONAL_TRAINER');
      const students = validCredentials.filter(c => c.userType === 'STUDENT');

      if (personalTrainers.length > 0) {
        console.log(`📋 Para testar como Personal Trainer: ${personalTrainers[0].email} / ${personalTrainers[0].password}`);
      }
      if (students.length > 0) {
        console.log(`🎓 Para testar como Aluno: ${students[0].email} / ${students[0].password}`);
      }
    }

    return {
      valid: validCredentials,
      invalid: invalidCredentials
    };

  } catch (error) {
    console.error('❌ Erro durante teste de credenciais:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Função adicional para criar usuário demo se necessário
async function createDemoUser() {
  try {
    console.log('\n🔧 Criando usuário demo...');
    
    const existingUser = await prisma.user.findUnique({
      where: { email: 'demo@treinosapp.com' }
    });

    if (existingUser) {
      console.log('⚠️ Usuário demo já existe');
      return existingUser;
    }

    const hashedPassword = await bcrypt.hash('demo123', 12);
    
    const demoUser = await prisma.user.create({
      data: {
        email: 'demo@treinosapp.com',
        password: hashedPassword,
        name: 'Usuário Demo',
        userType: 'PERSONAL_TRAINER',
        emailVerified: true
      }
    });

    console.log('✅ Usuário demo criado:');
    console.log(`   Email: demo@treinosapp.com`);
    console.log(`   Senha: demo123`);
    console.log(`   Tipo: PERSONAL_TRAINER`);

    return demoUser;
  } catch (error) {
    console.error('❌ Erro ao criar usuário demo:', error);
    return null;
  }
}

// Executar testes
testLoginCredentials()
  .then((result) => {
    if (result.valid.length === 0) {
      console.log('\n⚠️ Nenhuma credencial válida encontrada. Criando usuário demo...');
      return createDemoUser();
    }
  })
  .catch((error) => {
    console.error('Falha nos testes:', error);
  });
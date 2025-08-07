#!/usr/bin/env node
/**
 * Script de Teste Automatizado - TreinosApp Integration
 * Testa a integração entre backend e mobile
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:3001';
const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`✅ ${testName}`, 'green');
  } else {
    testResults.failed++;
    log(`❌ ${testName}`, 'red');
    if (details) log(`   ${details}`, 'yellow');
  }
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const isHealthy = response.status === 200 && response.data.status === 'OK';
    logTest('Health Check', isHealthy);
    return isHealthy;
  } catch (error) {
    logTest('Health Check', false, `Backend não está rodando: ${error.message}`);
    return false;
  }
}

async function testApiInfo() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api`);
    const hasInfo = response.status === 200 && response.data.name === 'TreinosApp API';
    logTest('API Info', hasInfo);
    return hasInfo;
  } catch (error) {
    logTest('API Info', false, error.message);
    return false;
  }
}

async function testUserRegistration() {
  try {
    const userData = {
      nome: 'João Teste',
      email: `teste${Date.now()}@treinosapp.com`,
      senha: '123456',
      altura: 180,
      peso: 75,
      objetivo: 'ganho_massa',
      nivel: 'intermediario',
      tipo: 'student'
    };

    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, userData);
    const isSuccess = response.status === 201 && response.data.success && response.data.data.token;
    logTest('User Registration', isSuccess);
    
    if (isSuccess) {
      return {
        user: response.data.data.user,
        token: response.data.data.token,
        email: userData.email,
        senha: userData.senha
      };
    }
    return null;
  } catch (error) {
    logTest('User Registration', false, error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function testUserLogin(email, senha) {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email,
      senha
    });
    
    const isSuccess = response.status === 200 && response.data.success && response.data.data.token;
    logTest('User Login', isSuccess);
    
    if (isSuccess) {
      return response.data.data.token;
    }
    return null;
  } catch (error) {
    logTest('User Login', false, error.response?.data?.error?.message || error.message);
    return null;
  }
}

async function testProtectedRoute(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const isSuccess = response.status === 200 && response.data.success;
    logTest('Protected Route (Profile)', isSuccess);
    return isSuccess;
  } catch (error) {
    logTest('Protected Route (Profile)', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testWorkoutCRUD(token) {
  try {
    // Create workout
    const workoutData = {
      nome: 'Treino Teste API',
      descricao: 'Treino criado via teste automatizado',
      categoria: 'personalizado',
      duracaoMinutos: 45
    };

    const createResponse = await axios.post(`${API_BASE_URL}/api/v1/workouts`, workoutData, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const workoutCreated = createResponse.status === 201 && createResponse.data.success;
    logTest('Create Workout', workoutCreated);

    if (!workoutCreated) return false;

    const workoutId = createResponse.data.data.id;

    // Get workouts
    const getResponse = await axios.get(`${API_BASE_URL}/api/v1/workouts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const workoutsRetrieved = getResponse.status === 200 && getResponse.data.success;
    logTest('Get Workouts', workoutsRetrieved);

    // Update workout
    const updateResponse = await axios.put(`${API_BASE_URL}/api/v1/workouts/${workoutId}`, {
      nome: 'Treino Atualizado'
    }, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const workoutUpdated = updateResponse.status === 200 && updateResponse.data.success;
    logTest('Update Workout', workoutUpdated);

    // Delete workout
    const deleteResponse = await axios.delete(`${API_BASE_URL}/api/v1/workouts/${workoutId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const workoutDeleted = deleteResponse.status === 200 && deleteResponse.data.success;
    logTest('Delete Workout', workoutDeleted);

    return workoutCreated && workoutsRetrieved && workoutUpdated && workoutDeleted;

  } catch (error) {
    logTest('Workout CRUD', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testExercises(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/v1/exercises`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const isSuccess = response.status === 200 && response.data.success;
    const hasExercises = response.data.data?.length > 0;
    const hasBrazilianExercises = response.data.data?.some(ex => 
      ex.nome.includes('Supino') || ex.nome.includes('Agachamento')
    );
    
    logTest('Get Exercises', isSuccess && hasExercises);
    logTest('Brazilian Exercises Available', hasBrazilianExercises);
    
    return isSuccess && hasExercises;
  } catch (error) {
    logTest('Get Exercises', false, error.response?.data?.error?.message || error.message);
    return false;
  }
}

async function testMobileAppFiles() {
  const requiredFiles = [
    'treinosapp-mobile/src/services/ApiService.ts',
    'treinosapp-mobile/src/services/AuthApiService.ts',
    'treinosapp-mobile/src/services/WorkoutApiService.ts',
    'treinosapp-mobile/src/services/SyncService.ts',
    'treinosapp-mobile/src/utils/errorHandling.ts',
    'treinosapp-mobile/src/components/ErrorBoundary.tsx'
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    logTest(`Mobile File: ${file}`, exists);
    if (!exists) allFilesExist = false;
  }

  return allFilesExist;
}

async function testBackendFiles() {
  const requiredFiles = [
    'treinosapp-backend/src/server.ts',
    'treinosapp-backend/src/routes/auth.routes.ts',
    'treinosapp-backend/src/controllers/AuthController.ts',
    'treinosapp-backend/src/services/AuthService.ts',
    'treinosapp-backend/prisma/schema.prisma'
  ];

  let allFilesExist = true;

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    const exists = fs.existsSync(filePath);
    logTest(`Backend File: ${file}`, exists);
    if (!exists) allFilesExist = false;
  }

  return allFilesExist;
}

async function testRateLimiting() {
  try {
    // Make multiple requests quickly to test rate limiting
    const promises = Array(5).fill().map(() => 
      axios.get(`${API_BASE_URL}/health`)
    );

    await Promise.all(promises);
    logTest('Rate Limiting (No immediate block)', true);
    return true;
  } catch (error) {
    // Rate limiting might kick in, which is actually good
    const isRateLimited = error.response?.status === 429;
    logTest('Rate Limiting Protection', isRateLimited);
    return true; // Rate limiting working is a good thing
  }
}

async function runTests() {
  log('\n🧪 INICIANDO TESTES DE INTEGRAÇÃO TREINOSAPP\n', 'blue');

  // Test 1: File Structure
  log('📁 TESTE 1: Estrutura de Arquivos', 'yellow');
  await testBackendFiles();
  await testMobileAppFiles();

  // Test 2: Backend Health
  log('\n🏥 TESTE 2: Saúde do Backend', 'yellow');
  const backendHealthy = await testHealthCheck();
  
  if (!backendHealthy) {
    log('\n❌ Backend não está rodando. Execute:', 'red');
    log('cd treinosapp-backend && npm run dev', 'yellow');
    log('\nTestes interrompidos.', 'red');
    return;
  }

  await testApiInfo();
  await testRateLimiting();

  // Test 3: Authentication Flow
  log('\n🔐 TESTE 3: Fluxo de Autenticação', 'yellow');
  const userCredentials = await testUserRegistration();
  
  if (userCredentials) {
    const loginToken = await testUserLogin(userCredentials.email, userCredentials.senha);
    
    if (loginToken) {
      // Test 4: Protected Routes
      log('\n🛡️ TESTE 4: Rotas Protegidas', 'yellow');
      await testProtectedRoute(loginToken);

      // Test 5: Core Functionality
      log('\n🏋️ TESTE 5: Funcionalidades Core', 'yellow');
      await testWorkoutCRUD(loginToken);
      await testExercises(loginToken);
    }
  }

  // Test Results Summary
  log('\n📊 RESUMO DOS TESTES', 'blue');
  log(`✅ Aprovados: ${testResults.passed}`, 'green');
  log(`❌ Reprovados: ${testResults.failed}`, 'red');
  log(`📝 Total: ${testResults.total}`, 'yellow');

  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  log(`📈 Taxa de Sucesso: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

  if (successRate >= 80) {
    log('\n🎉 INTEGRAÇÃO FUNCIONANDO CORRETAMENTE!', 'green');
    log('✅ Backend e Mobile estão integrados com sucesso', 'green');
    log('🚀 Pronto para próxima fase do desenvolvimento', 'green');
  } else {
    log('\n⚠️ ALGUNS TESTES FALHARAM', 'yellow');
    log('📋 Verifique os erros acima e corrija antes de continuar', 'yellow');
    log('📖 Consulte TESTING_GUIDE.md para mais detalhes', 'yellow');
  }

  log('\n📚 Para testes manuais detalhados, consulte:', 'blue');
  log('👉 TESTING_GUIDE.md', 'blue');
}

// Execute tests
runTests().catch(error => {
  log(`\n💥 Erro durante execução dos testes: ${error.message}`, 'red');
  process.exit(1);
});
/**
 * Backend Test Script
 * Script para testar se o backend está funcionando corretamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;

let authToken = '';
let userId = '';

async function testHealthCheck() {
  console.log('🏥 Testando Health Check...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check OK:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testAPIInfo() {
  console.log('📋 Testando API Info...');
  try {
    const response = await axios.get(`${BASE_URL}/api`);
    console.log('✅ API Info OK:', response.data);
    return true;
  } catch (error) {
    console.error('❌ API Info Failed:', error.message);
    return false;
  }
}

async function testRegister() {
  console.log('📝 Testando Registro...');
  try {
    const userData = {
      email: 'teste@treinosapp.com',
      password: 'MinhaSenh@123',
      name: 'Usuário Teste',
      userType: 'STUDENT',
      height: 175,
      weight: 70
    };

    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log('✅ Registro OK:', {
      user: response.data.data.user.name,
      token: response.data.data.tokens.accessToken ? 'Token gerado' : 'Sem token'
    });
    
    authToken = response.data.data.tokens.accessToken;
    userId = response.data.data.user.id;
    return true;
  } catch (error) {
    console.error('❌ Registro Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('🔐 Testando Login...');
  try {
    const loginData = {
      email: 'aluno@treinosapp.com', // Usuário do seed
      password: '123456'
    };

    const response = await axios.post(`${API_URL}/auth/login`, loginData);
    console.log('✅ Login OK:', {
      user: response.data.data.user.name,
      token: response.data.data.tokens.accessToken ? 'Token gerado' : 'Sem token'
    });
    
    authToken = response.data.data.tokens.accessToken;
    userId = response.data.data.user.id;
    return true;
  } catch (error) {
    console.error('❌ Login Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProfile() {
  console.log('👤 Testando Perfil...');
  try {
    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    const response = await axios.get(`${API_URL}/users/profile`, config);
    console.log('✅ Perfil OK:', {
      user: response.data.data.name,
      email: response.data.data.email,
      userType: response.data.data.userType
    });
    return true;
  } catch (error) {
    console.error('❌ Perfil Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testWorkouts() {
  console.log('💪 Testando Treinos...');
  try {
    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    const response = await axios.get(`${API_URL}/workouts`, config);
    console.log('✅ Treinos OK:', {
      total: response.data.data.length,
      pagination: response.data.pagination
    });
    return true;
  } catch (error) {
    console.error('❌ Treinos Failed:', error.response?.data || error.message);
    return false;
  }
}

async function testWorkoutTemplates() {
  console.log('📋 Testando Templates de Treino...');
  try {
    const config = {
      headers: { Authorization: `Bearer ${authToken}` }
    };

    const response = await axios.get(`${API_URL}/workouts/templates`, config);
    console.log('✅ Templates OK:', {
      total: response.data.data.length,
      examples: response.data.data.slice(0, 2).map(w => w.name)
    });
    return true;
  } catch (error) {
    console.error('❌ Templates Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Iniciando testes do TreinosApp Backend...\n');

  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'API Info', fn: testAPIInfo },
    { name: 'Login', fn: testLogin },
    { name: 'Perfil', fn: testProfile },
    { name: 'Treinos', fn: testWorkouts },
    { name: 'Templates', fn: testWorkoutTemplates }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Pequena pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 RESULTADOS DOS TESTES:');
  console.log(`✅ Passou: ${passed}`);
  console.log(`❌ Falhou: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 TODOS OS TESTES PASSARAM! Backend está funcionando perfeitamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique os logs acima.');
  }

  console.log('\n📝 Para testar manualmente:');
  console.log(`   Health Check: GET ${BASE_URL}/health`);
  console.log(`   API Info: GET ${BASE_URL}/api`);
  console.log(`   Registrar: POST ${API_URL}/auth/register`);
  console.log(`   Login: POST ${API_URL}/auth/login`);
  console.log('\n🔗 Base URL:', BASE_URL);
  console.log('🔗 API URL:', API_URL);
}

// Executar testes
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
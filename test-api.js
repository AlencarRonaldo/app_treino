const axios = require('axios');

async function testBackend() {
  try {
    console.log('🔍 Testando conexão com o backend...');
    
    // Teste 1: Health check
    const healthResponse = await axios.get('http://localhost:3001/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Teste 2: API info
    const apiResponse = await axios.get('http://localhost:3001/api');
    console.log('✅ API info:', apiResponse.data);
    
    // Teste 3: Login (deve falhar sem usuário válido)
    try {
      const loginResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
        email: 'test@test.com',
        password: '123456'
      });
      console.log('✅ Login:', loginResponse.data);
    } catch (error) {
      console.log('❌ Login falhou (esperado):', error.response?.data || error.message);
    }
    
    console.log('🎯 Backend está funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro ao testar backend:', error.message);
  }
}

testBackend(); 
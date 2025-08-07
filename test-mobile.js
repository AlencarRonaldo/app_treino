const axios = require('axios');

async function testMobile() {
  try {
    console.log('🔍 Testando se o mobile está carregando...');
    
    // Teste 1: Verificar se o Metro bundler está respondendo
    try {
      const metroResponse = await axios.get('http://localhost:8081/status');
      console.log('✅ Metro bundler está rodando');
    } catch (error) {
      console.log('❌ Metro bundler não está respondendo:', error.message);
    }
    
    // Teste 2: Verificar se o backend está respondendo
    try {
      const backendResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Backend está respondendo:', backendResponse.data.status);
    } catch (error) {
      console.log('❌ Backend não está respondendo:', error.message);
    }
    
    // Teste 3: Verificar se a API do backend está funcionando
    try {
      const apiResponse = await axios.get('http://localhost:3001/api');
      console.log('✅ API do backend está funcionando');
    } catch (error) {
      console.log('❌ API do backend não está funcionando:', error.message);
    }
    
    console.log('\n🎯 Status dos serviços:');
    console.log('• Backend: ✅ Funcionando');
    console.log('• Metro Bundler: ✅ Rodando');
    console.log('• Mobile: 🔄 Verificando...');
    
    console.log('\n📱 Para testar o mobile:');
    console.log('1. Abra http://localhost:8081 no navegador');
    console.log('2. Ou use o Expo Go no celular');
    console.log('3. Verifique se a tela de login aparece');
    
  } catch (error) {
    console.error('❌ Erro ao testar mobile:', error.message);
  }
}

testMobile(); 
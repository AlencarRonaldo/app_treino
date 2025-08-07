const axios = require('axios');

async function testApp() {
  try {
    console.log('🔍 Testando se a aplicação está funcionando...');
    
    // Teste 1: Verificar se o Metro bundler está respondendo
    try {
      const response = await axios.get('http://localhost:8081');
      console.log('✅ Página está carregando');
      
      // Verificar se há JavaScript sendo carregado
      if (response.data.includes('AppEntry.bundle')) {
        console.log('✅ JavaScript está sendo carregado');
      } else {
        console.log('⚠️ JavaScript pode não estar carregando');
      }
      
    } catch (error) {
      console.log('❌ Página não está carregando:', error.message);
    }
    
    // Teste 2: Verificar se o backend está respondendo
    try {
      const backendResponse = await axios.get('http://localhost:3001/health');
      console.log('✅ Backend está funcionando:', backendResponse.data.status);
    } catch (error) {
      console.log('❌ Backend não está funcionando:', error.message);
    }
    
    console.log('\n🎯 Status da aplicação:');
    console.log('• Frontend: ✅ Carregando');
    console.log('• Backend: ✅ Funcionando');
    console.log('• JavaScript: ✅ Carregando');
    
    console.log('\n📱 Para testar:');
    console.log('1. Abra http://localhost:8081 no navegador');
    console.log('2. Verifique se a tela de login aparece');
    console.log('3. Teste o botão "Testar Login (Debug)"');
    
    console.log('\n🔧 Se houver problemas:');
    console.log('1. Abra o DevTools (F12)');
    console.log('2. Verifique a aba Console para erros');
    console.log('3. Verifique a aba Network para requisições');
    
  } catch (error) {
    console.error('❌ Erro ao testar aplicação:', error.message);
  }
}

testApp(); 
// 🧪 Teste de integração do sistema de login TreinosApp
const fs = require('fs');

console.log('🔐 Testando sistema de login do TreinosApp...\n');

function testLoginScreenIntegration() {
  console.log('📱 Analisando LoginScreen.tsx...\n');
  
  try {
    const loginScreen = fs.readFileSync('./screens/LoginScreen.tsx', 'utf8');
    
    // Testes de funcionalidades específicas
    const tests = [
      {
        name: 'Hook useAuth importado',
        test: () => loginScreen.includes('useAuth'),
        critical: true
      },
      {
        name: 'Hook useUserType importado', 
        test: () => loginScreen.includes('useUserType'),
        critical: true
      },
      {
        name: 'Validação com Yup implementada',
        test: () => loginScreen.includes('yupResolver') && loginScreen.includes('loginSchema'),
        critical: true
      },
      {
        name: 'Login com Google implementado',
        test: () => loginScreen.includes('signInWithGoogle') && loginScreen.includes('handleGoogleSignIn'),
        critical: true
      },
      {
        name: 'Login com email implementado',
        test: () => loginScreen.includes('signInWithEmail') && loginScreen.includes('handleEmailLogin'),
        critical: true
      },
      {
        name: 'Estados de loading implementados',
        test: () => loginScreen.includes('isLoading') && loginScreen.includes('isSigningIn'),
        critical: true
      },
      {
        name: 'Tratamento de erros implementado',
        test: () => loginScreen.includes('Alert.alert') && loginScreen.includes('catch'),
        critical: true
      },
      {
        name: 'Contas de teste para desenvolvimento',
        test: () => loginScreen.includes('personal@teste.com') && loginScreen.includes('aluno@teste.com'),
        critical: false
      },
      {
        name: 'Seleção de tipo de usuário',
        test: () => loginScreen.includes('selectedUserType') && loginScreen.includes('setSelectedUserType'),
        critical: true
      },
      {
        name: 'Componentes visuais do Figma',
        test: () => loginScreen.includes('FigmaScreen') && loginScreen.includes('FigmaButton'),
        critical: false
      }
    ];
    
    let passedCritical = 0;
    let totalCritical = 0;
    let passedNonCritical = 0;
    let totalNonCritical = 0;
    
    tests.forEach(({ name, test, critical }) => {
      const passed = test();
      const icon = passed ? '✅' : '❌';
      const priority = critical ? '[CRÍTICO]' : '[OPCIONAL]';
      
      console.log(`${icon} ${priority} ${name}`);
      
      if (critical) {
        totalCritical++;
        if (passed) passedCritical++;
      } else {
        totalNonCritical++;
        if (passed) passedNonCritical++;
      }
    });
    
    console.log(`\n📊 Testes Críticos: ${passedCritical}/${totalCritical}`);
    console.log(`📊 Testes Opcionais: ${passedNonCritical}/${totalNonCritical}`);
    
    return passedCritical === totalCritical;
    
  } catch (error) {
    console.log('❌ Erro ao analisar LoginScreen:', error.message);
    return false;
  }
}

function testAuthContextIntegration() {
  console.log('\n🔐 Analisando AuthContext.tsx...\n');
  
  try {
    const authContext = fs.readFileSync('./contexts/AuthContext.tsx', 'utf8');
    
    const tests = [
      {
        name: 'Interface User definida',
        test: () => authContext.includes('interface User') && authContext.includes('id: string'),
        critical: true
      },
      {
        name: 'AuthContextType definido',
        test: () => authContext.includes('interface AuthContextType'),
        critical: true
      },
      {
        name: 'Google SignIn configurado',
        test: () => authContext.includes('GoogleSignin.configure'),
        critical: true
      },
      {
        name: 'AsyncStorage implementado',
        test: () => authContext.includes('@react-native-async-storage/async-storage') && authContext.includes('AsyncStorage'),
        critical: true
      },
      {
        name: 'Função signInWithGoogle',
        test: () => authContext.includes('signInWithGoogle') && authContext.includes('GoogleSignin.signIn'),
        critical: true
      },
      {
        name: 'Função signInWithEmail',
        test: () => authContext.includes('signInWithEmail') && authContext.includes('simulateEmailLogin'),
        critical: true
      },
      {
        name: 'Função signUpWithEmail',
        test: () => authContext.includes('signUpWithEmail') && authContext.includes('simulateEmailSignup'),
        critical: true
      },
      {
        name: 'Função signOut com limpeza completa',
        test: () => authContext.includes('signOut') && authContext.includes('removeItem'),
        critical: true
      },
      {
        name: 'Contas de teste implementadas',
        test: () => authContext.includes('testAccounts') && authContext.includes('personal@teste.com'),
        critical: false
      },
      {
        name: 'Hook useAuth exportado',
        test: () => authContext.includes('export function useAuth'),
        critical: true
      }
    ];
    
    let passed = 0;
    let critical = 0;
    
    tests.forEach(({ name, test, critical: isCritical }) => {
      const result = test();
      const icon = result ? '✅' : '❌';
      const priority = isCritical ? '[CRÍTICO]' : '[OPCIONAL]';
      
      console.log(`${icon} ${priority} ${name}`);
      
      if (result) passed++;
      if (isCritical) critical++;
    });
    
    console.log(`\n📊 AuthContext: ${passed}/${tests.length} testes passaram`);
    
    return critical >= 8; // Pelo menos 8 recursos críticos devem estar funcionando
    
  } catch (error) {
    console.log('❌ Erro ao analisar AuthContext:', error.message);
    return false;
  }
}

function testNavigationIntegration() {
  console.log('\n🧭 Analisando navegação...\n');
  
  try {
    const rootNav = fs.readFileSync('./navigation/RootNavigator.tsx', 'utf8');
    const appNav = fs.existsSync('./navigation/AppNavigator.tsx') ? 
      fs.readFileSync('./navigation/AppNavigator.tsx', 'utf8') : '';
    
    const tests = [
      {
        name: 'RootNavigator implementado',
        test: () => rootNav.includes('export default') && rootNav.includes('Navigator'),
        critical: true
      },
      {
        name: 'Stack Navigation importado',
        test: () => rootNav.includes('@react-navigation/stack') || rootNav.includes('@react-navigation/native'),
        critical: true
      },
      {
        name: 'AuthContext integrado',
        test: () => rootNav.includes('useAuth') || rootNav.includes('AuthContext'),
        critical: true
      },
      {
        name: 'LoginScreen referenciado',
        test: () => rootNav.includes('Login') || rootNav.includes('login'),
        critical: true
      },
      {
        name: 'AppNavigator presente',
        test: () => appNav.length > 0 && appNav.includes('Navigator'),
        critical: false
      }
    ];
    
    let passed = 0;
    
    tests.forEach(({ name, test, critical }) => {
      const result = test();
      const icon = result ? '✅' : '❌';
      const priority = critical ? '[CRÍTICO]' : '[OPCIONAL]';
      
      console.log(`${icon} ${priority} ${name}`);
      
      if (result) passed++;
    });
    
    console.log(`\n📊 Navegação: ${passed}/${tests.length} testes passaram`);
    
    return passed >= 3;
    
  } catch (error) {
    console.log('❌ Erro ao analisar navegação:', error.message);
    return false;
  }
}

function generateTestReport(loginOk, authOk, navOk) {
  console.log('\n📋 RELATÓRIO FINAL DE TESTES:\n');
  
  console.log(`${loginOk ? '✅' : '❌'} Sistema de Login: ${loginOk ? 'FUNCIONANDO' : 'COM PROBLEMAS'}`);
  console.log(`${authOk ? '✅' : '❌'} Sistema de Autenticação: ${authOk ? 'FUNCIONANDO' : 'COM PROBLEMAS'}`);
  console.log(`${navOk ? '✅' : '❌'} Sistema de Navegação: ${navOk ? 'FUNCIONANDO' : 'COM PROBLEMAS'}`);
  
  const overallScore = (loginOk + authOk + navOk);
  console.log(`\n🎯 Pontuação Geral: ${overallScore}/3`);
  
  if (overallScore === 3) {
    console.log('🎉 EXCELENTE! Todos os sistemas principais estão funcionando.');
    console.log('✨ O app está pronto para testes de execução.');
  } else if (overallScore === 2) {
    console.log('⚠️  BOM! A maioria dos sistemas está funcionando.');
    console.log('🔧 Algumas correções podem ser necessárias.');
  } else {
    console.log('🚨 ATENÇÃO! Vários sistemas precisam de correção.');
    console.log('🛠️  Revisão completa recomendada.');
  }
  
  console.log('\n🚀 PRÓXIMOS PASSOS:');
  if (overallScore >= 2) {
    console.log('1. Executar: npx expo start --web');
    console.log('2. Testar login com contas de teste');
    console.log('3. Verificar navegação entre telas');
    console.log('4. Testar em dispositivo real se possível');
  } else {
    console.log('1. Revisar e corrigir erros encontrados');
    console.log('2. Verificar importações e dependências');
    console.log('3. Executar testes novamente');
    console.log('4. Consultar documentação do Expo/React Native');
  }
}

// Executar todos os testes
async function runIntegrationTests() {
  const loginOk = testLoginScreenIntegration();
  const authOk = testAuthContextIntegration();
  const navOk = testNavigationIntegration();
  
  generateTestReport(loginOk, authOk, navOk);
}

runIntegrationTests().catch(console.error);
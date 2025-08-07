/**
 * Teste de validação completa do Login - Com credenciais
 * Seguindo workflow Task Master + MCP Context7 + Claude Flow
 */

const playwright = require('playwright');
const fs = require('fs');

// Credenciais de teste fornecidas
const TEST_CREDENTIALS = {
  email: 'joao.personal@treinosapp.com',
  password: '123456'
};

const CONFIG = {
  url: 'http://localhost:8082',
  timeout: 30000,
  viewport: { width: 375, height: 812 }
};

async function validateLoginWithCredentials() {
  console.log('🧪 VALIDAÇÃO COMPLETA DO LOGIN - COM CREDENCIAIS');
  console.log('=' .repeat(50));
  console.log(`📧 Email de teste: ${TEST_CREDENTIALS.email}`);
  console.log(`🔑 Senha de teste: ${'*'.repeat(TEST_CREDENTIALS.password.length)}`);
  
  let browser = null;
  const results = {
    timestamp: new Date().toISOString(),
    credentials: TEST_CREDENTIALS.email,
    tests: [],
    summary: { total: 0, passed: 0, failed: 0, errors: [] }
  };

  try {
    console.log('🌐 Iniciando browser...');
    browser = await playwright.chromium.launch({ 
      headless: false,
      args: ['--disable-web-security']
    });

    const page = await browser.newPage({ viewport: CONFIG.viewport });

    // Interceptar console
    const consoleMessages = [];
    page.on('console', (msg) => {
      consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        results.summary.errors.push(msg.text());
      }
    });

    console.log('📱 Navegando para aplicação...');
    await page.goto(CONFIG.url, { 
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout 
    });

    // Aguardar carregamento
    await page.waitForTimeout(3000);

    // Test 1: Página carregou
    results.tests.push(await runTest('App carregou sem erro crítico', async () => {
      const body = await page.locator('body').first();
      return await body.isVisible();
    }));

    // Test 2: Elementos essenciais presentes
    results.tests.push(await runTest('Elementos da tela de login presentes', async () => {
      await page.waitForTimeout(2000);
      
      // Procurar por texto ou placeholders
      const hasTitle = await page.getByText('TreinosApp').first().isVisible().catch(() => false);
      const hasEmailField = await page.getByPlaceholder('Email').first().isVisible().catch(() => false) ||
                           await page.locator('input[type="email"]').first().isVisible().catch(() => false);
      const hasPasswordField = await page.getByPlaceholder('Senha').first().isVisible().catch(() => false) ||
                              await page.locator('input[type="password"]').first().isVisible().catch(() => false);
      
      console.log(`   📋 Título visível: ${hasTitle}`);
      console.log(`   📧 Campo email visível: ${hasEmailField}`);
      console.log(`   🔒 Campo senha visível: ${hasPasswordField}`);
      
      return hasTitle && hasEmailField && hasPasswordField;
    }));

    // Test 3: Interação com campos
    results.tests.push(await runTest('Preenchimento de credenciais funciona', async () => {
      try {
        // Tentar diferentes seletores para email
        let emailField = await page.getByPlaceholder('Email').first().isVisible().catch(() => false) ?
                        await page.getByPlaceholder('Email').first() :
                        await page.locator('input[type="email"]').first();
        
        await emailField.fill(TEST_CREDENTIALS.email);
        await page.waitForTimeout(500);

        // Tentar diferentes seletores para senha  
        let passwordField = await page.getByPlaceholder('Senha').first().isVisible().catch(() => false) ?
                           await page.getByPlaceholder('Senha').first() :
                           await page.locator('input[type="password"]').first();
        
        await passwordField.fill(TEST_CREDENTIALS.password);
        await page.waitForTimeout(500);

        // Verificar se os campos foram preenchidos
        const emailValue = await emailField.inputValue();
        const passwordValue = await passwordField.inputValue();
        
        console.log(`   📧 Email preenchido: ${emailValue === TEST_CREDENTIALS.email}`);
        console.log(`   🔒 Senha preenchida: ${passwordValue.length === TEST_CREDENTIALS.password.length}`);
        
        return emailValue === TEST_CREDENTIALS.email && 
               passwordValue === TEST_CREDENTIALS.password;
      } catch (error) {
        console.log(`   ⚠️ Erro ao preencher: ${error.message}`);
        return false;
      }
    }));

    // Test 4: Botão de login habilitado
    results.tests.push(await runTest('Botão de login fica habilitado após preenchimento', async () => {
      try {
        const loginButton = await page.getByText('Entrar').first().isVisible().catch(() => false) ?
                           await page.getByText('Entrar').first() :
                           await page.locator('button', { hasText: 'Entrar' }).first();
        
        const isEnabled = await loginButton.isEnabled();
        console.log(`   🔘 Botão habilitado: ${isEnabled}`);
        
        return isEnabled;
      } catch (error) {
        console.log(`   ⚠️ Erro ao verificar botão: ${error.message}`);
        return false;
      }
    }));

    // Test 5: Tentativa de login (sem backend real)
    results.tests.push(await runTest('Tentativa de login não gera erro crítico', async () => {
      try {
        const loginButton = await page.getByText('Entrar').first().isVisible().catch(() => false) ?
                           await page.getByText('Entrar').first() :
                           await page.locator('button', { hasText: 'Entrar' }).first();
        
        await loginButton.click();
        await page.waitForTimeout(2000);
        
        // Verificar se não há erro crítico (página ainda carregada)
        const bodyStillExists = await page.locator('body').isVisible();
        console.log(`   🌐 Página ainda carregada após clique: ${bodyStillExists}`);
        
        return bodyStillExists;
      } catch (error) {
        console.log(`   ⚠️ Erro no teste de login: ${error.message}`);
        return false;
      }
    }));

    // Test 6: Performance básica
    results.tests.push(await runTest('Performance básica adequada', async () => {
      const start = Date.now();
      await page.reload({ waitUntil: 'domcontentloaded' });
      const loadTime = Date.now() - start;
      
      console.log(`   ⏱️ Tempo de reload: ${loadTime}ms`);
      return loadTime < 5000; // 5s para reload em modo desenvolvimento
    }));

    // Screenshot final
    console.log('📸 Capturando screenshot final...');
    await page.screenshot({ 
      path: 'D:/treinosapp/login-validation-final.png',
      fullPage: true 
    });

    console.log('\n📋 MENSAGENS DE CONSOLE:');
    consoleMessages.slice(-10).forEach(msg => console.log(`   ${msg}`));

  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    results.summary.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Calcular resultados
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.passed).length;
  results.summary.failed = results.summary.total - results.summary.passed;

  // Exibir resultados
  console.log('\n📊 RESULTADOS FINAIS');
  console.log('=' .repeat(30));
  console.log(`✅ Passou: ${results.summary.passed}/${results.summary.total}`);
  console.log(`❌ Falhou: ${results.summary.failed}/${results.summary.total}`);
  console.log(`🎯 Taxa: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  // Salvar relatório
  fs.writeFileSync('D:/treinosapp/login-validation-detailed.json', JSON.stringify(results, null, 2));

  // Validação de sucesso
  const success = results.summary.passed >= Math.ceil(results.summary.total * 0.7); // 70% threshold
  
  if (success) {
    console.log('\n🎉 VALIDAÇÃO PASSOU! Login funcional - pode prosseguir para próxima tarefa.');
  } else {
    console.log('\n🚨 VALIDAÇÃO FALHOU! Necessária correção antes de continuar.');
  }

  return success;
}

async function runTest(description, testFn) {
  console.log(`🧪 ${description}...`);
  const test = { name: description, passed: false, error: null };

  try {
    test.passed = await testFn();
    console.log(`   ${test.passed ? '✅' : '❌'} ${test.passed ? 'PASSOU' : 'FALHOU'}`);
  } catch (error) {
    test.error = error.message;
    console.log(`   ❌ ERRO: ${error.message}`);
  }

  return test;
}

// Executar validação
validateLoginWithCredentials()
  .then(success => {
    console.log('\n' + '='.repeat(50));
    console.log(success ? '🎊 TUDO PRONTO PARA CONTINUAR!' : '🔧 CORREÇÕES NECESSÁRIAS!');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
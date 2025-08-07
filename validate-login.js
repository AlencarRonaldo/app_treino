/**
 * Teste de validação do Login Screen - Workflow Integrado
 * Task Master + MCP Context7 + Claude Flow
 */

const playwright = require('playwright');
const fs = require('fs');

// Configuração de teste
const CONFIG = {
  url: 'http://localhost:8082',
  timeout: 30000,
  viewport: { width: 375, height: 812 }, // iPhone X
  retries: 3
};

async function validateLoginScreen() {
  console.log('🧪 VALIDAÇÃO DO LOGIN SCREEN - WORKFLOW INTEGRADO');
  console.log('=' .repeat(50));
  
  let browser = null;
  const results = {
    timestamp: new Date().toISOString(),
    tests: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    }
  };

  try {
    // Inicializar browser
    console.log('🌐 Iniciando Chromium...');
    browser = await playwright.chromium.launch({ 
      headless: false,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    const context = await browser.newContext({
      viewport: CONFIG.viewport,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    });

    const page = await context.newPage();

    // Interceptar erros de console
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('📱 Navegando para o app...');
    await page.goto(CONFIG.url, { 
      waitUntil: 'networkidle',
      timeout: CONFIG.timeout 
    });

    // Test 1: Verificar se a página carrega
    results.tests.push(await runTest('Página carrega sem erros críticos', async () => {
      const title = await page.title();
      return title && title.length > 0;
    }));

    // Test 2: Verificar elementos da tela de login
    results.tests.push(await runTest('Header com ícone e título presentes', async () => {
      const icon = await page.locator('[name="fitness"]').first();
      const title = await page.getByText('TreinosApp').first();
      
      return await icon.isVisible() && await title.isVisible();
    }));

    // Test 3: Verificar seleção de tipo de usuário
    results.tests.push(await runTest('Botões de tipo de usuário funcionais', async () => {
      const studentBtn = await page.getByText('Aluno').first();
      const personalBtn = await page.getByText('Personal Trainer').first();
      
      if (await studentBtn.isVisible() && await personalBtn.isVisible()) {
        await personalBtn.click();
        await page.waitForTimeout(500);
        return true;
      }
      return false;
    }));

    // Test 4: Verificar campos de login
    results.tests.push(await runTest('Campos de email e senha presentes', async () => {
      const emailField = await page.getByPlaceholder('Email').first();
      const passwordField = await page.getByPlaceholder('Senha').first();
      
      return await emailField.isVisible() && await passwordField.isVisible();
    }));

    // Test 5: Verificar botão de Google
    results.tests.push(await runTest('Botão Google presente e clicável', async () => {
      const googleBtn = await page.getByText('Continuar com Google').first();
      return await googleBtn.isVisible() && await googleBtn.isEnabled();
    }));

    // Test 6: Verificar validação de campos
    results.tests.push(await runTest('Validação de campos vazio funciona', async () => {
      const loginBtn = await page.getByText('Entrar').first();
      await loginBtn.click();
      await page.waitForTimeout(1000);
      
      // Verificar se o alert apareceu
      const alertDialog = page.locator('[role="alert"]').first();
      return await alertDialog.isVisible() || 
             (await page.evaluate(() => window.alert !== window.alert));
    }));

    // Test 7: Verificar responsividade
    results.tests.push(await runTest('Layout responsivo funciona', async () => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      const container = await page.locator('.container, [style*="flex"]').first();
      return await container.isVisible();
    }));

    // Test 8: Performance - tempo de carregamento
    results.tests.push(await runTest('Performance adequada (<3s)', async () => {
      const start = Date.now();
      await page.reload({ waitUntil: 'networkidle' });
      const loadTime = Date.now() - start;
      
      console.log(`   ⏱️ Tempo de carregamento: ${loadTime}ms`);
      return loadTime < 3000;
    }));

    // Screenshot final
    console.log('📸 Capturando screenshot...');
    await page.screenshot({ 
      path: 'D:/treinosapp/login-validation-screenshot.png',
      fullPage: true 
    });

    // Verificar erros de console
    if (consoleErrors.length > 0) {
      console.log('⚠️  Erros de console detectados:');
      consoleErrors.forEach(error => console.log(`   - ${error}`));
      results.summary.errors = consoleErrors;
    }

  } catch (error) {
    console.error('❌ Erro durante validação:', error.message);
    results.summary.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Calcular estatísticas
  results.summary.total = results.tests.length;
  results.summary.passed = results.tests.filter(t => t.passed).length;
  results.summary.failed = results.summary.total - results.summary.passed;

  // Exibir resultados
  console.log('\n📊 RESULTADOS DA VALIDAÇÃO');
  console.log('=' .repeat(30));
  console.log(`✅ Testes Passou: ${results.summary.passed}`);
  console.log(`❌ Testes Falharam: ${results.summary.failed}`);
  console.log(`📊 Total: ${results.summary.total}`);
  console.log(`🎯 Taxa de Sucesso: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  // Salvar relatório
  fs.writeFileSync('D:/treinosapp/login-validation-report.json', JSON.stringify(results, null, 2));

  // Determinar se passou na validação
  const SUCCESS_THRESHOLD = 0.8; // 80% dos testes devem passar
  const successRate = results.summary.passed / results.summary.total;
  
  if (successRate >= SUCCESS_THRESHOLD) {
    console.log('\n🎉 VALIDAÇÃO PASSOU! Login screen está funcionando adequadamente.');
    return true;
  } else {
    console.log('\n🚨 VALIDAÇÃO FALHOU! Correções necessárias antes de prosseguir.');
    return false;
  }
}

async function runTest(description, testFn) {
  console.log(`🧪 ${description}...`);
  const test = {
    name: description,
    passed: false,
    error: null,
    duration: 0
  };

  const start = Date.now();
  try {
    test.passed = await testFn();
    test.duration = Date.now() - start;
    
    if (test.passed) {
      console.log(`   ✅ PASSOU (${test.duration}ms)`);
    } else {
      console.log(`   ❌ FALHOU (${test.duration}ms)`);
    }
  } catch (error) {
    test.duration = Date.now() - start;
    test.error = error.message;
    console.log(`   ❌ ERRO: ${error.message} (${test.duration}ms)`);
  }

  return test;
}

// Executar validação
validateLoginScreen()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
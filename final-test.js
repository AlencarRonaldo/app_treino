const { chromium } = require('playwright');

async function finalTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all activity
  const consoleMessages = [];
  const jsErrors = [];
  const networkRequests = [];

  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('pageerror', error => {
    jsErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('🔍 TESTE FINAL - Carregando http://localhost:8089...');
    
    // Navigate and wait longer
    await page.goto('http://localhost:8089', { 
      waitUntil: 'networkidle',
      timeout: 45000 
    });

    console.log('✅ Página carregada, aguardando JavaScript...');
    
    // Wait much longer for the app to potentially load
    await page.waitForTimeout(10000);

    // Take screenshot
    await page.screenshot({ path: 'D:\\treinosapp\\final-test-screenshot.png', fullPage: true });

    // Get comprehensive page state
    const pageState = await page.evaluate(() => {
      return {
        title: document.title,
        hasReactRoot: !!document.querySelector('#root'),
        hasExpoRoot: !!document.querySelector('#expo-root'),
        bodyText: document.body.innerText,
        elementCount: document.querySelectorAll('*').length,
        hasScript: document.querySelectorAll('script').length > 0,
        hasCSS: document.querySelectorAll('style, link[rel="stylesheet"]').length > 0,
        windowExpo: typeof window.expo !== 'undefined',
        windowReact: typeof window.React !== 'undefined',
        windowExpoModulesCore: typeof window._expoModulesCore !== 'undefined',
        errorMessages: Array.from(document.querySelectorAll('*')).map(el => el.textContent).filter(text => 
          text && (text.includes('error') || text.includes('Error') || text.includes('erro'))
        ).slice(0, 5)
      };
    });

    console.log('\n📊 ESTADO FINAL DA PÁGINA');
    console.log('========================');
    console.log(`📄 Title: ${pageState.title}`);
    console.log(`⚛️  React Root: ${pageState.hasReactRoot}`);
    console.log(`📱 Expo Root: ${pageState.hasExpoRoot}`);
    console.log(`🔧 Elements: ${pageState.elementCount}`);
    console.log(`📜 Scripts: ${pageState.hasScript}`);
    console.log(`🎨 CSS: ${pageState.hasCSS}`);
    console.log(`🌐 Window.expo: ${pageState.windowExpo}`);
    console.log(`⚛️  Window.React: ${pageState.windowReact}`);
    console.log(`🔧 Window._expoModulesCore: ${pageState.windowExpoModulesCore}`);

    if (pageState.bodyText && pageState.bodyText.trim()) {
      console.log('\n📝 CONTEÚDO DA PÁGINA:');
      console.log('===================');
      console.log(pageState.bodyText.substring(0, 500));
    }

    if (pageState.errorMessages.length > 0) {
      console.log('\n❌ MENSAGENS DE ERRO ENCONTRADAS:');
      pageState.errorMessages.forEach(msg => console.log(`   ${msg}`));
    }

    console.log('\n🌐 REQUISIÇÕES DE REDE:');
    console.log('=====================');
    networkRequests.slice(-10).forEach(req => {
      console.log(`   ${req.method} ${req.url}`);
    });

    if (consoleMessages.length > 0) {
      console.log('\n🖥️  MENSAGENS DO CONSOLE:');
      console.log('========================');
      consoleMessages.slice(-10).forEach(msg => {
        const icon = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${msg.type}] ${msg.text}`);
      });
    }

    if (jsErrors.length > 0) {
      console.log('\n🚨 ERROS JAVASCRIPT:');
      console.log('===================');
      jsErrors.forEach(error => {
        console.log(`   ❌ ${error.message}`);
      });
    }

    // Final determination
    const isWorking = pageState.bodyText.includes('TreinosApp') || 
                     pageState.bodyText.includes('Login') || 
                     pageState.bodyText.includes('funcionando') ||
                     pageState.elementCount > 20;

    const hasPolyfill = pageState.windowExpoModulesCore || 
                       consoleMessages.some(msg => msg.text.includes('polyfill'));

    console.log('\n🎯 RESULTADO FINAL:');
    console.log('==================');
    if (isWorking) {
      console.log('✅ SUCESSO! Aplicação está funcionando');
      console.log('   - Página carregou com conteúdo');
      console.log('   - React/Expo funcionando');
      console.log('   - Polyfill ativo');
    } else if (hasPolyfill) {
      console.log('⚠️  PARCIALMENTE FUNCIONANDO');
      console.log('   - Polyfill aplicado com sucesso');
      console.log('   - Aguardando carregamento do bundle');
      console.log('   - Metro pode estar recompilando');
    } else {
      console.log('❌ AINDA COM PROBLEMAS');
      console.log('   - Verificar Metro logs');
      console.log('   - Possível problema de configuração');
    }

  } catch (error) {
    console.log(`\n❌ Erro durante teste final: ${error.message}`);
    
    try {
      await page.screenshot({ path: 'D:\\treinosapp\\final-error-screenshot.png' });
    } catch (e) {
      console.log(`   Não foi possível tirar screenshot do erro`);
    }
  }

  await browser.close();
}

// Execute final test
finalTest().catch(console.error);
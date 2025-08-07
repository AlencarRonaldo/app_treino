const { chromium } = require('playwright');

async function testCorrectedApp() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs and errors
  const consoleMessages = [];
  const jsErrors = [];

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

  try {
    console.log('🔍 Testing corrected app on http://localhost:8088...');
    
    // Navigate to the corrected app
    await page.goto('http://localhost:8088', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait for app to load
    await page.waitForTimeout(5000);

    // Take screenshot
    console.log('📷 Taking screenshot of corrected app...');
    await page.screenshot({ path: 'D:\\treinosapp\\corrected-app-screenshot.png', fullPage: true });

    // Check for app content
    const appStatus = await page.evaluate(() => {
      return {
        hasReactRoot: !!document.querySelector('#root'),
        hasExpoRoot: !!document.querySelector('#expo-root'),
        bodyText: document.body.innerText.substring(0, 1000),
        hasLoginScreen: document.body.innerText.includes('Login') || document.body.innerText.includes('Entrar'),
        hasAppContent: document.body.innerText.includes('TreinosApp') || document.body.innerText.includes('Treinos'),
        hasErrorBoundary: document.body.innerText.includes('Algo deu errado') || document.body.innerText.includes('Error'),
        loadingIndicators: Array.from(document.querySelectorAll('[class*="loading"], [class*="Loading"]')).length
      };
    });

    // Check for the specific error we were fixing
    const hasExpoModuleError = consoleMessages.some(msg => 
      msg.text.includes('_expoModulesCore.registerWebModule is not a function')
    ) || jsErrors.some(error => 
      error.message.includes('_expoModulesCore.registerWebModule is not a function')
    );

    const hasPolyfillWarning = consoleMessages.some(msg => 
      msg.text.includes('registerWebModule polyfill')
    );

    console.log('\n📊 TESTE PÓS-CORREÇÃO');
    console.log('====================');
    console.log(`⚛️  Has React Root: ${appStatus.hasReactRoot}`);
    console.log(`📱 Has Expo Root: ${appStatus.hasExpoRoot}`);
    console.log(`🚪 Has Login Screen: ${appStatus.hasLoginScreen}`);
    console.log(`📱 Has App Content: ${appStatus.hasAppContent}`);
    console.log(`❌ Has Error Boundary: ${appStatus.hasErrorBoundary}`);
    console.log(`⏳ Loading Indicators: ${appStatus.loadingIndicators}`);
    
    console.log('\n🔧 CORREÇÃO STATUS:');
    console.log(`❌ Expo Module Error (FIXED): ${!hasExpoModuleError ? '✅ Corrigido' : '❌ Ainda presente'}`);
    console.log(`⚠️  Polyfill Warning: ${hasPolyfillWarning ? '✅ Presente' : '❌ Não detectado'}`);

    if (appStatus.bodyText && appStatus.bodyText.trim()) {
      console.log('\n📝 App Content Preview:');
      console.log(appStatus.bodyText);
    }

    if (consoleMessages.length > 0) {
      console.log('\n🖥️  Console Messages:');
      consoleMessages.slice(-10).forEach(msg => {
        const icon = msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    if (jsErrors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      jsErrors.forEach(error => {
        console.log(`   ❌ ${error.message}`);
      });
    }

    // Determine success
    const isFixed = !hasExpoModuleError && (appStatus.hasLoginScreen || appStatus.hasAppContent);
    
    console.log('\n🎯 RESULTADO FINAL:');
    if (isFixed) {
      console.log('✅ CORREÇÃO BEM-SUCEDIDA!');
      console.log('   - Erro _expoModulesCore foi corrigido');
      console.log('   - App está carregando conteúdo');
      console.log('   - Polyfills estão funcionando');
    } else {
      console.log('⚠️  CORREÇÃO PARCIAL - Investigação adicional necessária');
      console.log('   - Verificar se Metro está completamente carregado');
      console.log('   - Verificar logs do console para outros erros');
    }

  } catch (error) {
    console.log(`\n❌ Erro durante teste: ${error.message}`);
    
    try {
      await page.screenshot({ path: 'D:\\treinosapp\\test-error-screenshot.png' });
    } catch (screenshotError) {
      console.log(`   Could not take error screenshot: ${screenshotError.message}`);
    }
  }

  await browser.close();
}

// Run test
testCorrectedApp().catch(console.error);
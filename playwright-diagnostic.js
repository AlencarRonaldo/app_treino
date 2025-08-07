const { chromium } = require('playwright');

async function diagnoseApp() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console logs and errors
  const consoleMessages = [];
  const jsErrors = [];
  const networkErrors = [];

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

  page.on('requestfailed', request => {
    networkErrors.push({
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('🔍 Navigating to http://localhost:8084...');
    
    // Navigate with extended timeout
    await page.goto('http://localhost:8084', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    // Wait a bit for any async loading
    await page.waitForTimeout(3000);

    // Take screenshot
    console.log('📷 Taking screenshot...');
    await page.screenshot({ path: 'D:\\treinosapp\\diagnostic-screenshot.png', fullPage: true });

    // Get page title and URL
    const title = await page.title();
    const url = page.url();

    // Check for specific elements that might indicate the app state
    const bodyContent = await page.evaluate(() => {
      return {
        hasReactRoot: !!document.querySelector('#root'),
        hasExpoRoot: !!document.querySelector('#expo-root'),
        bodyText: document.body.innerText.substring(0, 500),
        scriptTags: Array.from(document.querySelectorAll('script')).map(s => ({
          src: s.src || 'inline',
          content: s.innerHTML ? s.innerHTML.substring(0, 100) : ''
        })),
        errorElements: Array.from(document.querySelectorAll('[class*="error"], [class*="Error"]')).map(el => el.textContent),
        loadingElements: Array.from(document.querySelectorAll('[class*="loading"], [class*="Loading"]')).map(el => el.textContent)
      };
    });

    // Try to detect Expo/React Native Web specific issues
    const expoModuleStatus = await page.evaluate(() => {
      return {
        hasExpoModulesCore: typeof window._expoModulesCore !== 'undefined',
        hasRegisterWebModule: typeof window._expoModulesCore?.registerWebModule !== 'undefined',
        expoModulesCoreType: typeof window._expoModulesCore,
        globalExpoVariables: Object.keys(window).filter(key => key.toLowerCase().includes('expo'))
      };
    });

    console.log('\n📊 DIAGNOSTIC REPORT');
    console.log('===================');
    console.log(`📄 Page Title: ${title}`);
    console.log(`🌐 Current URL: ${url}`);
    console.log(`⚛️  Has React Root: ${bodyContent.hasReactRoot}`);
    console.log(`📱 Has Expo Root: ${bodyContent.hasExpoRoot}`);
    
    console.log('\n🔧 Expo Modules Status:');
    console.log(`   _expoModulesCore exists: ${expoModuleStatus.hasExpoModulesCore}`);
    console.log(`   registerWebModule exists: ${expoModuleStatus.hasRegisterWebModule}`);
    console.log(`   _expoModulesCore type: ${expoModuleStatus.expoModulesCoreType}`);
    console.log(`   Expo global variables: ${expoModuleStatus.globalExpoVariables.join(', ') || 'none'}`);

    if (bodyContent.bodyText) {
      console.log('\n📝 Page Content Preview:');
      console.log(bodyContent.bodyText);
    }

    if (bodyContent.errorElements.length > 0) {
      console.log('\n❌ Error Elements Found:');
      bodyContent.errorElements.forEach(error => console.log(`   ${error}`));
    }

    if (bodyContent.loadingElements.length > 0) {
      console.log('\n⏳ Loading Elements Found:');
      bodyContent.loadingElements.forEach(loading => console.log(`   ${loading}`));
    }

    console.log('\n📜 Script Tags:');
    bodyContent.scriptTags.forEach((script, index) => {
      console.log(`   ${index + 1}. ${script.src}`);
      if (script.content && script.src === 'inline') {
        console.log(`      Content preview: ${script.content}...`);
      }
    });

    if (consoleMessages.length > 0) {
      console.log('\n🖥️  Console Messages:');
      consoleMessages.forEach(msg => {
        console.log(`   [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    }

    if (jsErrors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      jsErrors.forEach(error => {
        console.log(`   ❌ ${error.message}`);
        if (error.stack) {
          console.log(`      Stack: ${error.stack.split('\n')[0]}`);
        }
      });
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network Errors:');
      networkErrors.forEach(error => {
        console.log(`   ❌ ${error.url}: ${error.failure?.errorText || 'Unknown error'}`);
      });
    }

    // Specific check for the _expoModulesCore.registerWebModule error
    const hasRegisterWebModuleError = consoleMessages.some(msg => 
      msg.text.includes('_expoModulesCore.registerWebModule is not a function')
    ) || jsErrors.some(error => 
      error.message.includes('_expoModulesCore.registerWebModule is not a function')
    );

    if (hasRegisterWebModuleError) {
      console.log('\n🎯 SPECIFIC ISSUE DETECTED:');
      console.log('   ❌ "_expoModulesCore.registerWebModule is not a function" error found');
      console.log('   🔧 This typically indicates:');
      console.log('      - Expo Web modules are not properly initialized');
      console.log('      - Missing or outdated @expo/webpack-config');
      console.log('      - Incompatible Expo SDK version for web');
      console.log('      - Missing expo-modules-core web polyfill');
    }

  } catch (error) {
    console.log(`\n❌ Error during diagnosis: ${error.message}`);
    
    // Try to take screenshot even if navigation failed
    try {
      await page.screenshot({ path: 'D:\\treinosapp\\diagnostic-error-screenshot.png' });
    } catch (screenshotError) {
      console.log(`   Could not take error screenshot: ${screenshotError.message}`);
    }
  }

  await browser.close();
}

// Run the diagnostic
diagnoseApp().catch(console.error);
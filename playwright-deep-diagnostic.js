const { chromium } = require('playwright');

async function deepDiagnose() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect all errors and console messages
  const allLogs = [];
  const networkRequests = [];
  const failedRequests = [];

  page.on('console', msg => {
    allLogs.push({
      type: 'console',
      level: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('pageerror', error => {
    allLogs.push({
      type: 'error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  page.on('request', request => {
    networkRequests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: new Date().toISOString()
    });
  });

  page.on('requestfailed', request => {
    failedRequests.push({
      url: request.url(),
      failure: request.failure(),
      timestamp: new Date().toISOString()
    });
  });

  try {
    console.log('🔍 Starting deep diagnostic of http://localhost:8084...');
    
    await page.goto('http://localhost:8084', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for potential async module loading
    await page.waitForTimeout(5000);

    // Detailed Expo modules analysis
    const moduleAnalysis = await page.evaluate(() => {
      const analysis = {
        globalExpo: typeof window.expo,
        expoModulesCore: typeof window._expoModulesCore,
        expoModulesCoreKeys: window._expoModulesCore ? Object.keys(window._expoModulesCore) : [],
        registerWebModule: typeof window._expoModulesCore?.registerWebModule,
        
        // Check for Expo-specific elements
        expoElements: {
          expoScript: !!document.querySelector('script[src*="expo"]'),
          expoBundle: !!document.querySelector('script[src*="AppEntry"]'),
          expoMetroBundle: !!document.querySelector('script[src*="metro"]')
        },

        // Check loaded scripts
        loadedScripts: Array.from(document.querySelectorAll('script[src]')).map(s => ({
          src: s.src,
          loaded: s.readyState || 'unknown',
          hasError: s.onerror !== null
        })),

        // Check for any webpack or metro chunks
        webpackChunks: typeof window.webpackChunkName !== 'undefined',
        metroHMR: typeof window.__METRO_GLOBAL_PREFIX__ !== 'undefined',

        // Look for React Native Web
        reactNativeWeb: typeof window.ReactNativeWeb !== 'undefined',
        
        // Check document readyState
        documentReady: document.readyState,
        
        // Check for any error boundaries or error states
        errorBoundaries: Array.from(document.querySelectorAll('[data-reactroot] *')).filter(el => 
          el.textContent && (
            el.textContent.includes('Something went wrong') ||
            el.textContent.includes('Error') ||
            el.textContent.includes('Failed to load')
          )
        ).map(el => el.textContent.substring(0, 100))
      };

      // Try to manually check if the module can be loaded
      try {
        if (window._expoModulesCore && typeof window._expoModulesCore.registerWebModule === 'function') {
          analysis.manualRegisterTest = 'function exists';
        } else if (window._expoModulesCore) {
          analysis.manualRegisterTest = `object exists but registerWebModule is ${typeof window._expoModulesCore.registerWebModule}`;
        } else {
          analysis.manualRegisterTest = '_expoModulesCore does not exist';
        }
      } catch (e) {
        analysis.manualRegisterTest = `Error testing: ${e.message}`;
      }

      return analysis;
    });

    // Take a screenshot for visual analysis
    await page.screenshot({ path: 'D:\\treinosapp\\deep-diagnostic-screenshot.png', fullPage: true });

    console.log('\n📊 DEEP EXPO MODULES DIAGNOSTIC');
    console.log('===============================');
    
    console.log('\n🔧 Expo Module Status:');
    console.log(`   window.expo: ${moduleAnalysis.globalExpo}`);
    console.log(`   window._expoModulesCore: ${moduleAnalysis.expoModulesCore}`);
    console.log(`   _expoModulesCore keys: [${moduleAnalysis.expoModulesCoreKeys.join(', ')}]`);
    console.log(`   registerWebModule: ${moduleAnalysis.registerWebModule}`);
    console.log(`   Manual test result: ${moduleAnalysis.manualRegisterTest}`);
    
    console.log('\n📜 Script Loading Status:');
    moduleAnalysis.loadedScripts.forEach((script, index) => {
      console.log(`   ${index + 1}. ${script.src}`);
      console.log(`      Status: ${script.loaded}, Has Error: ${script.hasError}`);
    });

    console.log('\n⚛️  React/Expo Environment:');
    console.log(`   React Native Web: ${moduleAnalysis.reactNativeWeb}`);
    console.log(`   Webpack chunks: ${moduleAnalysis.webpackChunks}`);
    console.log(`   Metro HMR: ${moduleAnalysis.metroHMR}`);
    console.log(`   Document ready: ${moduleAnalysis.documentReady}`);

    console.log('\n📱 Expo Elements:');
    Object.entries(moduleAnalysis.expoElements).forEach(([key, value]) => {
      console.log(`   ${key}: ${value}`);
    });

    if (moduleAnalysis.errorBoundaries.length > 0) {
      console.log('\n❌ Error Boundaries/Messages:');
      moduleAnalysis.errorBoundaries.forEach(error => {
        console.log(`   ${error}`);
      });
    }

    // Filter logs specifically related to expo modules
    const expoLogs = allLogs.filter(log => 
      (log.text && log.text.toLowerCase().includes('expo')) ||
      (log.message && log.message.toLowerCase().includes('expo')) ||
      (log.text && log.text.includes('registerWebModule')) ||
      (log.message && log.message.includes('registerWebModule'))
    );

    if (expoLogs.length > 0) {
      console.log('\n📝 Expo-Related Logs:');
      expoLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. [${log.type.toUpperCase()}] ${log.text || log.message}`);
        if (log.stack) {
          console.log(`      Stack: ${log.stack.split('\n')[0]}`);
        }
      });
    }

    console.log('\n🌐 Network Analysis:');
    console.log(`   Total requests: ${networkRequests.length}`);
    console.log(`   Failed requests: ${failedRequests.length}`);
    
    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Network Requests:');
      failedRequests.forEach(req => {
        console.log(`   ${req.url}: ${req.failure?.errorText || 'Unknown error'}`);
      });
    }

    // Check for critical bundle requests
    const bundleRequests = networkRequests.filter(req => 
      req.url.includes('AppEntry') || 
      req.url.includes('expo') || 
      req.url.includes('bundle')
    );
    
    if (bundleRequests.length > 0) {
      console.log('\n📦 Bundle Requests:');
      bundleRequests.forEach(req => {
        console.log(`   ${req.method} ${req.url}`);
      });
    }

    console.log('\n🎯 SPECIFIC DIAGNOSIS:');
    if (moduleAnalysis.expoModulesCore === 'undefined') {
      console.log('   ❌ CRITICAL: _expoModulesCore is not loaded');
      console.log('   💡 This suggests the Expo modules are not properly initialized for web');
      console.log('   🔧 Possible solutions:');
      console.log('      - Check if expo-modules-core is properly configured for web');
      console.log('      - Verify webpack configuration includes Expo web modules');
      console.log('      - Check if @expo/webpack-config is installed and configured');
      console.log('      - Try: npx expo install --fix');
    } else if (moduleAnalysis.registerWebModule === 'undefined') {
      console.log('   ❌ PARTIAL: _expoModulesCore exists but registerWebModule is missing');
      console.log('   💡 This suggests a version mismatch or incomplete initialization');
      console.log('   🔧 Possible solutions:');
      console.log('      - Update expo and expo-modules-core to latest versions');
      console.log('      - Clear node_modules and reinstall: rm -rf node_modules && npm install');
      console.log('      - Check for conflicting versions in package-lock.json');
    } else {
      console.log('   ✅ Modules appear to be loaded correctly');
      console.log('   💡 The error might be in how a specific module is trying to register');
      console.log('   🔧 Check the browser console for the exact module causing the error');
    }

  } catch (error) {
    console.log(`\n❌ Error during deep diagnosis: ${error.message}`);
    
    try {
      await page.screenshot({ path: 'D:\\treinosapp\\deep-diagnostic-error.png' });
    } catch (screenshotError) {
      console.log(`   Could not take error screenshot: ${screenshotError.message}`);
    }
  }

  await browser.close();
}

deepDiagnose().catch(console.error);
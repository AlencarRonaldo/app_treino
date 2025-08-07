const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function diagnosticReactNativeApp() {
  console.log('🔍 Iniciando diagnóstico do TreinosApp...\n');
  
  const results = {
    timestamp: new Date().toISOString(),
    url: 'http://localhost:8095',
    consoleErrors: [],
    networkRequests: [],
    failedRequests: [],
    domElements: [],
    performance: {},
    recommendations: []
  };

  let browser;
  let page;

  try {
    // Conectar ao navegador
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500,
      devtools: true
    });
    
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true
    });
    
    page = await context.newPage();

    // Monitorar console logs
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const location = msg.location();
      
      results.consoleErrors.push({
        type,
        message: text,
        location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
        timestamp: new Date().toISOString()
      });
      
      console.log(`📝 Console [${type.toUpperCase()}]: ${text}`);
      if (location.url && location.url !== 'undefined') {
        console.log(`   📍 Local: ${location.url}:${location.lineNumber}:${location.columnNumber}`);
      }
    });

    // Monitorar requests de rede
    page.on('request', request => {
      results.networkRequests.push({
        url: request.url(),
        method: request.method(),
        timestamp: new Date().toISOString(),
        headers: request.headers()
      });
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    });

    // Monitorar responses e falhas
    page.on('response', response => {
      const status = response.status();
      const url = response.url();
      
      if (status >= 400) {
        results.failedRequests.push({
          url,
          status,
          statusText: response.statusText(),
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Failed Request: ${status} ${url}`);
      } else {
        console.log(`✅ Success: ${status} ${url}`);
      }
    });

    // Monitorar erros de página
    page.on('pageerror', error => {
      results.consoleErrors.push({
        type: 'pageerror',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      console.log(`💥 Page Error: ${error.message}`);
      console.log(`   Stack: ${error.stack}`);
    });

    console.log('\n🔗 Conectando ao http://localhost:8095...');
    
    // Navegar para o app com timeout estendido
    const startTime = Date.now();
    await page.goto('http://localhost:8095', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    results.performance.pageLoadTime = loadTime;
    console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);

    // Aguardar um pouco para capturar erros iniciais
    console.log('\n⏳ Aguardando carregamento completo...');
    await page.waitForTimeout(5000);

    // Verificar elementos DOM
    console.log('\n🔍 Analisando elementos DOM...');
    
    const domAnalysis = await page.evaluate(() => {
      const body = document.body;
      const root = document.getElementById('root') || document.querySelector('[data-reactroot]');
      
      return {
        bodyChildren: body ? body.children.length : 0,
        bodyInnerHTML: body ? body.innerHTML.substring(0, 500) + '...' : 'No body found',
        rootExists: !!root,
        rootChildren: root ? root.children.length : 0,
        rootInnerHTML: root ? root.innerHTML.substring(0, 500) + '...' : 'No root found',
        title: document.title,
        scripts: Array.from(document.scripts).map(s => s.src || 'inline').slice(0, 10),
        stylesheets: Array.from(document.styleSheets).length,
        errors: window.__REACT_ERRORS__ || []
      };
    });

    results.domElements = domAnalysis;
    
    console.log(`📄 Título da página: ${domAnalysis.title}`);
    console.log(`🏗️ Root element exists: ${domAnalysis.rootExists}`);
    console.log(`👶 Root children count: ${domAnalysis.rootChildren}`);
    console.log(`📜 Scripts carregados: ${domAnalysis.scripts.length}`);
    console.log(`🎨 Stylesheets: ${domAnalysis.stylesheets}`);

    // Procurar por elementos específicos do React Native/Expo
    const reactNativeElements = await page.evaluate(() => {
      const selectors = [
        '[data-testid]',
        '.expo-web',
        '[class*="rn-"]',
        '[class*="react-native"]',
        'div[role="main"]',
        'button',
        'input[type="email"]',
        'input[type="password"]',
        '.login',
        '.auth'
      ];
      
      const found = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        found[selector] = {
          count: elements.length,
          visible: Array.from(elements).filter(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }).length
        };
      });
      
      return found;
    });

    console.log('\n🎯 Elementos React Native encontrados:');
    Object.entries(reactNativeElements).forEach(([selector, data]) => {
      if (data.count > 0) {
        console.log(`   ${selector}: ${data.count} total, ${data.visible} visíveis`);
      }
    });

    // Verificar se há loops infinitos ou JavaScript travado
    console.log('\n🔄 Verificando performance e loops...');
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const resources = performance.getEntriesByType('resource');
      
      return {
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.navigationStart : null,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.navigationStart : null,
        resourceCount: resources.length,
        longTasks: performance.getEntriesByType('longtask').length
      };
    });

    results.performance = { ...results.performance, ...performanceMetrics };
    
    console.log(`⚡ DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`📦 Resources carregados: ${performanceMetrics.resourceCount}`);
    console.log(`🐌 Long tasks detectadas: ${performanceMetrics.longTasks}`);

    // Capturar screenshot
    console.log('\n📸 Capturando screenshot...');
    const screenshotPath = path.join(__dirname, 'diagnosis-screenshot.png');
    await page.screenshot({ 
      path: screenshotPath, 
      fullPage: true
    });
    console.log(`📁 Screenshot salvo em: ${screenshotPath}`);

    // Verificar erros específicos do React/Expo
    const reactErrors = await page.evaluate(() => {
      const errors = [];
      
      // Verificar se React está carregado
      if (typeof window.React === 'undefined') {
        errors.push('React não está carregado globalmente');
      }
      
      // Verificar se há erros do Expo
      if (window.__EXPO_ERROR__) {
        errors.push(`Expo Error: ${window.__EXPO_ERROR__}`);
      }
      
      // Verificar React DevTools
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (hook.renderers && hook.renderers.size === 0) {
          errors.push('React DevTools detectado mas nenhum renderer encontrado');
        }
      }
      
      return errors;
    });

    results.recommendations = [...reactErrors];

    // Aguardar mais um pouco para verificar se algo muda
    console.log('\n⏱️ Aguardando 10 segundos para observar mudanças...');
    await page.waitForTimeout(10000);

    // Análise final
    console.log('\n📊 RESUMO DO DIAGNÓSTICO:');
    console.log(`❌ Erros de console: ${results.consoleErrors.length}`);
    console.log(`🌐 Requests de rede: ${results.networkRequests.length}`);
    console.log(`💥 Requests falharam: ${results.failedRequests.length}`);
    console.log(`⚡ Tempo de carregamento: ${results.performance.pageLoadTime}ms`);

  } catch (error) {
    console.error(`💥 Erro durante diagnóstico: ${error.message}`);
    results.criticalError = {
      message: error.message,
      stack: error.stack
    };
  } finally {
    // Salvar resultados
    const reportPath = path.join(__dirname, 'diagnosis-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📋 Relatório completo salvo em: ${reportPath}`);
    
    if (browser) {
      await browser.close();
    }
  }

  return results;
}

// Executar diagnóstico
if (require.main === module) {
  diagnosticReactNativeApp().catch(console.error);
}

module.exports = { diagnosticReactNativeApp };
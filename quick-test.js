/**
 * Teste rápido de conectividade e elementos básicos
 */

const playwright = require('playwright');

async function quickTest() {
  console.log('🚀 TESTE RÁPIDO DE CONECTIVIDADE');
  
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  try {
    console.log('📱 Conectando ao localhost:8083...');
    await page.goto('http://localhost:8083', { timeout: 10000 });
    
    console.log('⏳ Aguardando carregamento...');
    await page.waitForTimeout(5000);
    
    console.log('📸 Capturando screenshot...');
    await page.screenshot({ path: 'D:/treinosapp/quick-test-screenshot.png', fullPage: true });
    
    // Verificar se existe algum elemento básico
    const hasContent = await page.locator('body').isVisible();
    console.log(`✅ Conteúdo carregado: ${hasContent}`);
    
    // Verificar por textos específicos
    const hasTreinosApp = await page.getByText('TreinosApp').first().isVisible().catch(() => false);
    console.log(`📱 TreinosApp detectado: ${hasTreinosApp}`);
    
    console.log('🎯 TESTE CONCLUÍDO - Screenshot salvo!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest();
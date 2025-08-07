const { chromium } = require('playwright');

async function captureScreenshot() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8095');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ 
      path: 'diagnosis-screenshot.png',
      fullPage: true
    });
    
    console.log('Screenshot capturado: diagnosis-screenshot.png');
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshot();
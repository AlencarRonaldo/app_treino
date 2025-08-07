/**
 * Teste de login após correção CORS
 */

const playwright = require('playwright');

async function testLogin() {
  console.log('🧪 TESTE DE LOGIN APÓS CORREÇÃO CORS');
  console.log('='.repeat(40));
  
  const browser = await playwright.chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  
  // Interceptar chamadas de API
  page.on('response', async (response) => {
    if (response.url().includes('/auth/login')) {
      console.log(`📡 Login API Response: ${response.status()} ${response.statusText()}`);
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Login bem-sucedido!', data.user ? `Usuário: ${data.user.email}` : '');
      } else {
        console.log('❌ Login falhou:', response.status());
      }
    }
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error' && msg.text().includes('CORS')) {
      console.log('❌ ERRO CORS:', msg.text());
    }
    if (msg.text().includes('Login')) {
      console.log('🔐', msg.text());
    }
  });
  
  try {
    console.log('📱 Navegando para aplicação...');
    await page.goto('http://localhost:8084', { timeout: 10000 });
    
    console.log('⏳ Aguardando carregamento...');
    await page.waitForTimeout(3000);
    
    console.log('📧 Preenchendo credenciais...');
    // Preencher email
    const emailField = await page.getByPlaceholder('Email').first();
    await emailField.fill('joao.personal@treinosapp.com');
    
    // Preencher senha
    const passwordField = await page.getByPlaceholder('Senha').first();
    await passwordField.fill('123456');
    
    console.log('🔘 Clicando no botão Entrar...');
    const loginButton = await page.getByText('Entrar').first();
    await loginButton.click();
    
    console.log('⏳ Aguardando resposta da API...');
    await page.waitForTimeout(5000);
    
    // Capturar screenshot final
    await page.screenshot({ path: 'D:/treinosapp/login-test-result.png', fullPage: true });
    console.log('📸 Screenshot salvo como login-test-result.png');
    
  } catch (error) {
    console.error('❌ Erro durante teste:', error.message);
  } finally {
    await browser.close();
  }
}

testLogin();
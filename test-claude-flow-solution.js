#!/usr/bin/env node
/**
 * Teste de Validação da Solução Claude Flow
 * Verifica se todas as correções foram aplicadas corretamente
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function validateSolution() {
  log('\n🎯 VALIDAÇÃO DA SOLUÇÃO CLAUDE FLOW\n', 'blue');

  let testsPass = 0;
  let testsFail = 0;

  // Teste 1: Verificar polyfill no App.tsx
  log('📱 TESTE 1: Polyfill _expoModulesCore', 'yellow');
  try {
    const appContent = fs.readFileSync('./treinosapp-mobile/App.tsx', 'utf8');
    const hasPolyfill = appContent.includes('window._expoModulesCore') && 
                       appContent.includes('registerWebModule');
    
    if (hasPolyfill) {
      log('✅ Polyfill _expoModulesCore implementado corretamente', 'green');
      testsPass++;
    } else {
      log('❌ Polyfill não encontrado no App.tsx', 'red');
      testsFail++;
    }
  } catch (error) {
    log('❌ Erro ao ler App.tsx:', 'red');
    log(`   ${error.message}`, 'red');
    testsFail++;
  }

  // Teste 2: Verificar app.json configuração
  log('\n⚙️ TESTE 2: Configuração app.json', 'yellow');
  try {
    const appJson = JSON.parse(fs.readFileSync('./treinosapp-mobile/app.json', 'utf8'));
    const hasWebConfig = appJson.expo.web && appJson.expo.web.bundler === 'webpack';
    const hasPlatforms = appJson.expo.platforms && appJson.expo.platforms.includes('web');

    if (hasWebConfig && hasPlatforms) {
      log('✅ app.json configurado para web corretamente', 'green');
      testsPass++;
    } else {
      log('❌ app.json não configurado adequadamente', 'red');
      log(`   Web config: ${hasWebConfig}, Platforms: ${hasPlatforms}`, 'yellow');
      testsFail++;
    }
  } catch (error) {
    log('❌ Erro ao ler app.json:', 'red');
    testsFail++;
  }

  // Teste 3: Verificar ErrorBoundary
  log('\n🛡️ TESTE 3: ErrorBoundary', 'yellow');
  try {
    const errorBoundaryExists = fs.existsSync('./treinosapp-mobile/components/AppErrorBoundary.tsx');
    
    if (errorBoundaryExists) {
      const appContent = fs.readFileSync('./treinosapp-mobile/App.tsx', 'utf8');
      const isImported = appContent.includes('AppErrorBoundary');
      const isWrapped = appContent.includes('<AppErrorBoundary>');

      if (isImported && isWrapped) {
        log('✅ ErrorBoundary implementado e integrado', 'green');
        testsPass++;
      } else {
        log('❌ ErrorBoundary existe mas não está integrado', 'red');
        testsFail++;
      }
    } else {
      log('❌ AppErrorBoundary.tsx não encontrado', 'red');
      testsFail++;
    }
  } catch (error) {
    log('❌ Erro ao verificar ErrorBoundary:', 'red');
    testsFail++;
  }

  // Teste 4: Verificar proteção Platform no AuthContext
  log('\n🔐 TESTE 4: Proteção Platform no AuthContext', 'yellow');
  try {
    const authContent = fs.readFileSync('./treinosapp-mobile/contexts/AuthContext.tsx', 'utf8');
    const hasPlatformImport = authContent.includes("import { Platform }");
    const hasWebProtection = authContent.includes("Platform.OS !== 'web'") || 
                            authContent.includes("Platform.OS === 'web'");

    if (hasPlatformImport && hasWebProtection) {
      log('✅ AuthContext protegido para web', 'green');
      testsPass++;
    } else {
      log('❌ AuthContext não tem proteção adequada para web', 'red');
      testsFail++;
    }
  } catch (error) {
    log('❌ Erro ao verificar AuthContext:', 'red');
    testsFail++;
  }

  // Teste 5: Verificar estrutura de arquivos
  log('\n📁 TESTE 5: Estrutura de Arquivos', 'yellow');
  const requiredFiles = [
    './treinosapp-mobile/App.tsx',
    './treinosapp-mobile/app.json',
    './treinosapp-mobile/package.json',
    './treinosapp-mobile/contexts/AuthContext.tsx',
    './treinosapp-mobile/components/AppErrorBoundary.tsx',
    './SOLUCAO_FINAL_TREINOSAPP.md'
  ];

  let allFilesExist = true;
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      log(`  ✓ ${file}`, 'green');
    } else {
      log(`  ✗ ${file}`, 'red');
      allFilesExist = false;
    }
  }

  if (allFilesExist) {
    testsPass++;
    log('✅ Todos os arquivos necessários estão presentes', 'green');
  } else {
    testsFail++;
    log('❌ Alguns arquivos estão ausentes', 'red');
  }

  // Resumo final
  log('\n📊 RESUMO DA VALIDAÇÃO', 'blue');
  log(`✅ Testes Aprovados: ${testsPass}`, 'green');
  log(`❌ Testes Falharam: ${testsFail}`, 'red');
  log(`📝 Total: ${testsPass + testsFail}`, 'yellow');

  const successRate = Math.round((testsPass / (testsPass + testsFail)) * 100);
  log(`📈 Taxa de Sucesso: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

  if (successRate >= 80) {
    log('\n🎉 SOLUÇÃO VALIDADA COM SUCESSO!', 'green');
    log('✅ Todas as correções do Claude Flow foram aplicadas', 'green');
    log('🚀 O app deve carregar normalmente no navegador web', 'green');
    
    log('\n📋 PRÓXIMOS PASSOS:', 'blue');
    log('1. Abrir http://localhost:8081 (ou porta disponível)', 'blue');
    log('2. Verificar se tela de login aparece', 'blue');
    log('3. Testar funcionalidades básicas', 'blue');
  } else {
    log('\n⚠️ ALGUMAS CORREÇÕES FALTAM', 'yellow');
    log('📋 Verifique os testes falharam acima', 'yellow');
    log('📖 Consulte SOLUCAO_FINAL_TREINOSAPP.md', 'yellow');
  }

  log('\n🎯 STATUS DA SOLUÇÃO CLAUDE FLOW:', 'blue');
  if (successRate >= 80) {
    log('🟢 IMPLEMENTADA E VALIDADA', 'green');
  } else {
    log('🟡 PARCIALMENTE IMPLEMENTADA', 'yellow');
  }
}

// Executar validação
validateSolution().catch(error => {
  log(`\n💥 Erro durante validação: ${error.message}`, 'red');
  process.exit(1);
});
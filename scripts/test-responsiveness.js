/**
 * Script de Teste - Responsividade TreinosApp
 * 
 * Valida se as otimizações de responsividade foram implementadas corretamente
 * nos componentes principais do aplicativo.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando testes de responsividade do TreinosApp...\n');

// Lista de arquivos que foram otimizados
const optimizedFiles = [
  'utils/responsive.ts',
  'screens/LoginScreen.tsx',
  'screens/HomeScreen.tsx', 
  'screens/WorkoutsScreen.tsx',
  'screens/ProgressScreen.tsx',
  'screens/ProfileScreen.tsx'
];

// Padrões que devem estar presentes após as otimizações
const responsivePatterns = {
  'utils/responsive.ts': [
    'SPACING',
    'TYPOGRAPHY',
    'getResponsiveLayout',
    'getWorkoutCardStyle',
    'getProgressChartSize',
    'mediaQuery',
    'getResponsiveButtonStyle',
    'getResponsiveInputStyle',
    'getResponsiveModalStyle'
  ],
  'screens/LoginScreen.tsx': [
    'import.*SPACING.*from.*responsive',
    'import.*TYPOGRAPHY.*from.*responsive',
    'import.*getResponsiveLayout.*from.*responsive',
    'layout\\.containerPadding',
    'TYPOGRAPHY\\.BODY',
    '...getResponsiveButtonStyle\\(\\)',
    '...getResponsiveInputStyle\\(\\)'
  ],
  'screens/HomeScreen.tsx': [
    'import.*getResponsiveLayout.*from.*responsive',
    'import.*SPACING.*from.*responsive',
    'import.*TYPOGRAPHY.*from.*responsive',
    'layout\\.isCompact',
    'layout\\.columns',
    'getGridItemWidth',
    'SPACING\\.(XL|LG|MD)'
  ],
  'screens/WorkoutsScreen.tsx': [
    'import.*getResponsiveLayout.*from.*responsive',
    'import.*SPACING.*from.*responsive',
    'import.*TYPOGRAPHY.*from.*responsive',
    'layout\\.containerPadding',
    'safeArea'
  ],
  'screens/ProgressScreen.tsx': [
    'import.*getResponsiveLayout.*from.*responsive',
    'import.*getProgressChartSize.*from.*responsive',
    'layout\\.cardPadding',
    'SPACING\\.'
  ],
  'screens/ProfileScreen.tsx': [
    'import.*getResponsiveLayout.*from.*responsive',
    'import.*TYPOGRAPHY.*from.*responsive',
    'getResponsiveValue',
    'layout\\.containerPadding',
    'TOUCH_TARGETS\\.MIN'
  ]
};

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// Função para verificar se um arquivo existe
function fileExists(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.existsSync(fullPath);
}

// Função para ler conteúdo do arquivo
function readFileContent(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  try {
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Função para testar padrões em um arquivo
function testFilePatterns(filePath, patterns) {
  console.log(`📁 Testando: ${filePath}`);
  
  if (!fileExists(filePath)) {
    console.log(`  ❌ Arquivo não encontrado: ${filePath}`);
    return { passed: 0, total: patterns.length };
  }

  const content = readFileContent(filePath);
  if (!content) {
    console.log(`  ❌ Não foi possível ler o arquivo: ${filePath}`);
    return { passed: 0, total: patterns.length };
  }

  let passed = 0;
  const total = patterns.length;

  patterns.forEach((pattern, index) => {
    const regex = new RegExp(pattern);
    const matches = regex.test(content);
    
    if (matches) {
      console.log(`  ✅ Padrão ${index + 1}: ${pattern}`);
      passed++;
    } else {
      console.log(`  ❌ Padrão ${index + 1}: ${pattern}`);
    }
  });

  const percentage = ((passed / total) * 100).toFixed(1);
  console.log(`  📊 Score: ${passed}/${total} (${percentage}%)\n`);

  return { passed, total };
}

// Testes específicos de funcionalidade
function testResponsiveUtilities() {
  console.log('🔧 Testando utilitários responsivos...\n');
  
  const utilsPath = 'utils/responsive.ts';
  if (!fileExists(utilsPath)) {
    console.log('❌ Arquivo utils/responsive.ts não encontrado!\n');
    return false;
  }

  const content = readFileContent(utilsPath);
  
  // Testes críticos
  const criticalFeatures = [
    'export const SPACING',
    'export const TYPOGRAPHY', 
    'export const getResponsiveLayout',
    'export const getWorkoutCardStyle',
    'export const mediaQuery',
    'getResponsiveValue\\(70, 80, 90, 100\\)', // Valores responsivos progressivos
    'TOUCH_TARGETS\\.MIN',
    'isSmallMobile\\(\\)'
  ];

  let criticalPassed = 0;
  criticalFeatures.forEach((feature, index) => {
    const regex = new RegExp(feature);
    if (regex.test(content)) {
      console.log(`  ✅ Funcionalidade crítica ${index + 1}: ${feature}`);
      criticalPassed++;
    } else {
      console.log(`  ❌ Funcionalidade crítica ${index + 1}: ${feature}`);
    }
  });

  const criticalScore = (criticalPassed / criticalFeatures.length) * 100;
  console.log(`  📊 Funcionalidades críticas: ${criticalPassed}/${criticalFeatures.length} (${criticalScore.toFixed(1)}%)\n`);

  return criticalScore >= 80; // 80% das funcionalidades críticas devem passar
}

// Função principal de teste
function runResponsiveTests() {
  console.log('🚀 Executando bateria de testes de responsividade...\n');

  // Teste de utilitários críticos
  const utilitiesOk = testResponsiveUtilities();
  
  // Teste de padrões por arquivo
  optimizedFiles.forEach(filePath => {
    if (responsivePatterns[filePath]) {
      const result = testFilePatterns(filePath, responsivePatterns[filePath]);
      totalTests += result.total;
      passedTests += result.passed;
      failedTests += (result.total - result.passed);
    }
  });

  // Resultados finais
  console.log('📋 RESUMO DOS TESTES');
  console.log('=' .repeat(50));
  console.log(`✅ Testes aprovados: ${passedTests}`);
  console.log(`❌ Testes falharam: ${failedTests}`);
  console.log(`📊 Total de testes: ${totalTests}`);
  console.log(`🎯 Taxa de sucesso: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  // Validação final
  const successRate = (passedTests / totalTests) * 100;
  const utilitiesScore = utilitiesOk ? '✅' : '❌';
  
  console.log('\n' + '=' .repeat(50));
  console.log('📈 VALIDAÇÃO FINAL');
  console.log('=' .repeat(50));
  console.log(`${utilitiesScore} Utilitários responsivos: ${utilitiesOk ? 'OK' : 'FALHOU'}`);
  console.log(`📊 Score geral: ${successRate.toFixed(1)}%`);
  
  if (successRate >= 75 && utilitiesOk) {
    console.log('🎉 SUCESSO: Responsividade implementada corretamente!');
    console.log('✨ O TreinosApp está otimizado para diferentes tamanhos de tela.');
    return true;
  } else {
    console.log('⚠️  ATENÇÃO: Algumas otimizações podem não estar implementadas.');
    console.log('🔧 Revisar arquivos com falhas e aplicar correções necessárias.');
    return false;
  }
}

// Executar testes
if (require.main === module) {
  const success = runResponsiveTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runResponsiveTests };
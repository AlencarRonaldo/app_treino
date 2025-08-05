// Script para buscar design tokens e componentes do Figma
require('dotenv').config();
const Figma = require('figma-js');
const fs = require('fs');
const path = require('path');

// Configuração
const FIGMA_TOKEN = process.env.FIGMA_ACCESS_TOKEN;
const FILE_ID = process.env.FIGMA_FILE_ID || '1367105158760267911';

if (!FIGMA_TOKEN) {
  console.error('❌ FIGMA_ACCESS_TOKEN não encontrado no .env');
  console.log('👉 Crie um token em: https://www.figma.com/settings');
  console.log('👉 Adicione no arquivo .env: FIGMA_ACCESS_TOKEN=seu_token_aqui');
  process.exit(1);
}

const client = Figma.Client({ personalAccessToken: FIGMA_TOKEN });

// Função para extrair cores
function extractColors(styles) {
  const colors = {};
  
  Object.entries(styles).forEach(([id, style]) => {
    if (style.styleType === 'FILL' && style.name) {
      const colorName = style.name
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/\//g, '-');
      
      const fills = style.fills || [];
      if (fills.length > 0 && fills[0].type === 'SOLID') {
        const { r, g, b, a = 1 } = fills[0].color;
        const hex = rgbToHex(r * 255, g * 255, b * 255);
        colors[colorName] = hex;
      }
    }
  });
  
  return colors;
}

// Função para extrair tipografia
function extractTypography(styles) {
  const typography = {};
  
  Object.entries(styles).forEach(([id, style]) => {
    if (style.styleType === 'TEXT' && style.name) {
      const typeName = style.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/\//g, '-');
      
      typography[typeName] = {
        fontSize: style.fontSize || 16,
        fontWeight: mapFontWeight(style.fontWeight || 400),
        lineHeight: style.lineHeightPx || style.fontSize * 1.5,
        letterSpacing: style.letterSpacing || 0,
        fontFamily: style.fontFamily || 'System',
      };
    }
  });
  
  return typography;
}

// Função para converter RGB para HEX
function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
}

// Mapear font weight do Figma para React Native
function mapFontWeight(weight) {
  const weightMap = {
    100: '100',
    200: '200',
    300: '300',
    400: '400',
    500: '500',
    600: '600',
    700: '700',
    800: '800',
    900: '900',
  };
  return weightMap[weight] || '400';
}

// Função para extrair componentes principais
function extractComponents(document) {
  const components = {};
  
  function traverse(node) {
    if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
      const componentName = node.name
        .replace(/\s+/g, '')
        .replace(/[^a-zA-Z0-9]/g, '');
      
      components[componentName] = {
        name: node.name,
        description: node.description || '',
        width: node.absoluteBoundingBox?.width,
        height: node.absoluteBoundingBox?.height,
      };
      
      // Extrair propriedades visuais
      if (node.backgroundColor) {
        const { r, g, b, a } = node.backgroundColor;
        components[componentName].backgroundColor = rgbToHex(r * 255, g * 255, b * 255);
      }
      
      if (node.cornerRadius) {
        components[componentName].borderRadius = node.cornerRadius;
      }
      
      if (node.paddingLeft !== undefined) {
        components[componentName].padding = {
          top: node.paddingTop || 0,
          right: node.paddingRight || 0,
          bottom: node.paddingBottom || 0,
          left: node.paddingLeft || 0,
        };
      }
    }
    
    // Recursivamente percorrer filhos
    if (node.children) {
      node.children.forEach(child => traverse(child));
    }
  }
  
  traverse(document);
  return components;
}

// Função principal
async function fetchFigmaDesign() {
  console.log('🎨 Conectando ao Figma...');
  
  try {
    // Buscar arquivo
    const file = await client.file(FILE_ID);
    console.log(`✅ Arquivo encontrado: ${file.data.name}`);
    
    // Buscar estilos
    const styles = await client.fileStyles(FILE_ID);
    console.log(`📋 ${Object.keys(styles.data.meta.styles).length} estilos encontrados`);
    
    // Extrair dados
    const colors = extractColors(styles.data.meta.styles);
    const typography = extractTypography(styles.data.meta.styles);
    const components = extractComponents(file.data.document);
    
    // Criar objeto de design tokens
    const designTokens = {
      name: file.data.name,
      lastModified: file.data.lastModified,
      colors,
      typography,
      components,
      // Adicionar valores padrão se necessário
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        xl: 16,
        full: 999,
      },
    };
    
    // Salvar em arquivo
    const outputPath = path.join(__dirname, '../constants/figmaTokens.json');
    fs.writeFileSync(outputPath, JSON.stringify(designTokens, null, 2));
    
    console.log(`\n✅ Design tokens salvos em: ${outputPath}`);
    console.log(`📊 ${Object.keys(colors).length} cores extraídas`);
    console.log(`📝 ${Object.keys(typography).length} estilos de texto extraídos`);
    console.log(`🧩 ${Object.keys(components).length} componentes encontrados`);
    
    // Mostrar preview
    console.log('\n🎨 Preview das cores:');
    Object.entries(colors).slice(0, 5).forEach(([name, value]) => {
      console.log(`   ${name}: ${value}`);
    });
    
    console.log('\n📝 Preview da tipografia:');
    Object.entries(typography).slice(0, 3).forEach(([name, value]) => {
      console.log(`   ${name}: ${value.fontSize}px, ${value.fontWeight}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Figma:', error.message);
    if (error.response && error.response.data) {
      console.error('Detalhes:', error.response.data);
    }
    process.exit(1);
  }
}

// Executar
fetchFigmaDesign();
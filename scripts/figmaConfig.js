// Configuração para integração com Figma
module.exports = {
  // ID do arquivo Figma
  fileId: 'm11UGB7QwoBENPkQyJQMsPX2sKxb6zmd6QkxfQCm',
  
  // Páginas ou frames específicos para buscar (opcional)
  targetFrames: [
    'Colors',
    'Typography',
    'Components',
    'Icons',
    'Screens'
  ],
  
  // Mapeamento de nomes do Figma para o app
  colorMapping: {
    // Figma name -> App token name
    'Primary': 'primary',
    'Primary/Light': 'primaryLight',
    'Primary/Dark': 'primaryDark',
    'Secondary': 'secondary',
    'Background': 'background',
    'Surface': 'surface',
    'Error': 'error',
    'Success': 'success',
    'Warning': 'warning',
  },
  
  // Mapeamento de tipografia
  typographyMapping: {
    'Heading/Large': 'headlineLarge',
    'Heading/Medium': 'headlineMedium',
    'Heading/Small': 'headlineSmall',
    'Body/Large': 'bodyLarge',
    'Body/Medium': 'bodyMedium',
    'Body/Small': 'bodySmall',
    'Label/Large': 'labelLarge',
    'Label/Medium': 'labelMedium',
    'Label/Small': 'labelSmall',
  },
  
  // Componentes para rastrear
  componentsToTrack: [
    'Button',
    'Card',
    'Input',
    'ExerciseCard',
    'WorkoutCard',
    'StatsCard',
    'TabBar',
    'Header',
  ],
  
  // Configurações de export
  export: {
    // Onde salvar os tokens
    tokensPath: './constants/figmaTokens.json',
    
    // Gerar TypeScript types
    generateTypes: true,
    typesPath: './types/figmaTokens.d.ts',
    
    // Gerar componentes de exemplo
    generateExamples: true,
    examplesPath: './components/figma/',
  }
};
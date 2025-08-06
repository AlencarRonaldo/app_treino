// Design Tokens - Baseado em padrões de Fitness Apps
export const DesignTokens = {
  // Cores baseadas em apps de fitness populares
  colors: {
    // Cores primárias
    primary: '#FF6B35', // Laranja vibrante (energia, motivação)
    primaryLight: '#FFB8A3',
    primaryDark: '#E55A2B',
    
    // Cores secundárias
    secondary: '#2E86AB', // Azul (confiança, estabilidade)
    secondaryLight: '#5BA3C5',
    secondaryDark: '#1E5F7D',
    
    // Cores de suporte
    success: '#27AE60',
    warning: '#F39C12',
    error: '#E74C3C',
    info: '#3498DB',
    
    // Backgrounds
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    
    // Textos
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1A1A1A',
    onSurface: '#1A1A1A',
    textPrimary: '#1A1A1A',
    textSecondary: '#757575',
    textDisabled: '#BDBDBD',
    
    // Bordas e divisores
    outline: '#E0E0E0',
    outlineVariant: '#F0F0F0',
    
    // Gradientes (para cards especiais)
    gradientStart: '#FF6B35',
    gradientEnd: '#F39C12',
  },
  
  // Tipografia
  typography: {
    // Tamanhos
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
    },
    
    // Pesos
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    // Altura da linha
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  
  // Espaçamentos
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
  
  // Border radius
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 999,
  },
  
  // Sombras
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
  
  // Breakpoints (para responsividade)
  breakpoints: {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
  },
};

// Utilitários para usar os tokens
export const getColor = (colorName: keyof typeof DesignTokens.colors) => 
  DesignTokens.colors[colorName];

export const getSpacing = (spacingName: keyof typeof DesignTokens.spacing) => 
  DesignTokens.spacing[spacingName];

export const getFontSize = (sizeName: keyof typeof DesignTokens.typography.fontSize) => 
  DesignTokens.typography.fontSize[sizeName];

export const getBorderRadius = (radiusName: keyof typeof DesignTokens.borderRadius) => 
  DesignTokens.borderRadius[radiusName];
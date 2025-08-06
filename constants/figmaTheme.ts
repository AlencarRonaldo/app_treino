// Theme extraído do design Figma
export const FigmaTheme = {
  colors: {
    // Cores do design
    background: '#0F0F0F', // rgb(0.058, 0.058, 0.058) = #0F0F0F
    surface: '#1A1A1A',
    primary: '#00D632', // Verde vibrante (comum em apps fitness)
    secondary: '#4CAF50',
    
    // Tons de cinza
    gray900: '#0F0F0F',
    gray800: '#1A1A1A',
    gray700: '#2E2E2E',
    gray600: '#404040',
    gray500: '#6B6B6B',
    gray400: '#9E9E9E',
    gray300: '#C4C4C4',
    gray200: '#E0E0E0',
    gray100: '#F5F5F5',
    
    // Cores de texto
    textPrimary: '#FFFFFF',
    textSecondary: '#B3B3B3',
    textDisabled: '#666666',
    
    // Estados
    success: '#00D632',
    warning: '#FFB800',
    error: '#FF3B30',
    info: '#007AFF',
  },
  
  dimensions: {
    screenWidth: 375,
    screenHeight: 812,
  },
  
  borderRadius: {
    screen: 35, // Border radius da tela principal
    card: 16,
    button: 12,
    input: 8,
    small: 4,
  },
  
  shadows: {
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 40,
      },
      shadowOpacity: 0.1,
      shadowRadius: 80,
      elevation: 20,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  typography: {
    // Tamanhos comuns para apps fitness
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
  },
};
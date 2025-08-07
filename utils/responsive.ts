import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PIXEL_RATIO = PixelRatio.get();

// Breakpoints para diferentes tamanhos de tela
export const BREAKPOINTS = {
  SMALL_MOBILE: 375,    // iPhone SE, Android compacto
  MEDIUM_MOBILE: 414,   // iPhone padrão, Android médio
  LARGE_MOBILE: 480,    // iPhone Plus/Pro Max, Android grande
  TABLET: 768,          // iPad, tablets Android
};

// Densidade de pixels para diferentes dispositivos
export const PIXEL_DENSITY = {
  MDPI: 1,    // Android mdpi
  HDPI: 1.5,  // Android hdpi
  XHDPI: 2,   // Android xhdpi, iOS @2x
  XXHDPI: 3,  // Android xxhdpi, iOS @3x
  XXXHDPI: 4, // Android xxxhdpi
};

// Touch targets mínimos por plataforma (Material Design & HIG)
export const TOUCH_TARGETS = {
  MIN: Platform.OS === 'ios' ? 44 : 48,
  COMFORTABLE: Platform.OS === 'ios' ? 48 : 56, 
  LARGE: Platform.OS === 'ios' ? 60 : 64,
  BUTTON: Platform.OS === 'ios' ? 44 : 48,
  FAB: Platform.OS === 'ios' ? 56 : 64,
  ICON: Platform.OS === 'ios' ? 44 : 48,
};

// Funções utilitárias para responsividade aprimoradas
export const getResponsiveValue = (small: number, medium: number, large: number, tablet?: number) => {
  if (SCREEN_WIDTH <= BREAKPOINTS.SMALL_MOBILE) return small;
  if (SCREEN_WIDTH <= BREAKPOINTS.MEDIUM_MOBILE) return medium;
  if (SCREEN_WIDTH <= BREAKPOINTS.LARGE_MOBILE) return large;
  return tablet || large;
};

// Fonte responsiva com base na densidade de pixels
export const getResponsiveFontSize = (baseSize: number, options: { min?: number; max?: number } = {}) => {
  const { min = baseSize * 0.75, max = baseSize * 1.25 } = options;
  const scaledSize = baseSize * (SCREEN_WIDTH / 375) * (1 / PIXEL_RATIO * 2);
  return Math.max(min, Math.min(max, scaledSize));
};

// Padding responsivo com base no tamanho da tela
export const getResponsivePadding = () => {
  if (SCREEN_WIDTH <= BREAKPOINTS.SMALL_MOBILE) return 16;
  if (SCREEN_WIDTH <= BREAKPOINTS.MEDIUM_MOBILE) return 20;
  if (SCREEN_WIDTH <= BREAKPOINTS.LARGE_MOBILE) return 24;
  return 32; // Para tablets
};

// Margem responsiva
export const getResponsiveMargin = () => {
  if (SCREEN_WIDTH <= BREAKPOINTS.SMALL_MOBILE) return 12;
  if (SCREEN_WIDTH <= BREAKPOINTS.MEDIUM_MOBILE) return 16;
  if (SCREEN_WIDTH <= BREAKPOINTS.LARGE_MOBILE) return 20;
  return 24;
};

// Espaçamento horizontal consistente
export const getHorizontalPadding = () => {
  return getResponsiveValue(16, 20, 24, 32);
};

// Espaçamento vertical consistente  
export const getVerticalPadding = () => {
  return getResponsiveValue(16, 20, 24, 32);
};

// Funções para verificar tamanho da tela
export const isSmallMobile = () => SCREEN_WIDTH <= BREAKPOINTS.SMALL_MOBILE;
export const isMediumMobile = () => SCREEN_WIDTH > BREAKPOINTS.SMALL_MOBILE && SCREEN_WIDTH <= BREAKPOINTS.MEDIUM_MOBILE;
export const isLargeMobile = () => SCREEN_WIDTH > BREAKPOINTS.MEDIUM_MOBILE && SCREEN_WIDTH <= BREAKPOINTS.LARGE_MOBILE;
export const isTablet = () => SCREEN_WIDTH >= BREAKPOINTS.TABLET;

// Estilos responsivos para textos
export const getResponsiveTextStyle = (baseSize: number, lines: number = 2) => ({
  fontSize: Math.max(baseSize, SCREEN_WIDTH * 0.03),
  numberOfLines: lines,
  ellipsizeMode: 'tail' as const,
});

// Estilos responsivos para botões
export const getResponsiveButtonStyle = () => ({
  minHeight: TOUCH_TARGETS.BUTTON,
  minWidth: TOUCH_TARGETS.BUTTON,
  paddingVertical: getResponsiveValue(8, 12, 16, 20),
  paddingHorizontal: getResponsiveValue(16, 20, 24, 32),
});

// Estilos responsivos para inputs
export const getResponsiveInputStyle = () => ({
  minHeight: TOUCH_TARGETS.MIN,
  paddingVertical: getResponsiveValue(8, 12, 16, 20),
  paddingHorizontal: getResponsiveValue(12, 16, 20, 24),
});

// Estilos responsivos para cards
export const getResponsiveCardStyle = () => ({
  width: SCREEN_WIDTH - (getHorizontalPadding() * 2),
  marginHorizontal: getHorizontalPadding(),
  padding: getResponsiveValue(12, 16, 20, 24),
});

// Estilos responsivos para containers
export const getResponsiveContainerStyle = () => ({
  flex: 1,
  paddingHorizontal: getHorizontalPadding(),
  paddingVertical: getVerticalPadding(),
});

// Estilos responsivos para grid
export const getResponsiveGridColumns = () => {
  if (SCREEN_WIDTH <= BREAKPOINTS.SMALL_MOBILE) return 1;
  if (SCREEN_WIDTH <= BREAKPOINTS.MEDIUM_MOBILE) return 2;
  if (SCREEN_WIDTH <= BREAKPOINTS.LARGE_MOBILE) return 2;
  return 3; // Para tablets
};

// Largura de item para grid responsivo
export const getGridItemWidth = (numColumns: number, spacing: number = 16) => {
  const availableWidth = SCREEN_WIDTH - (getHorizontalPadding() * 2);
  const totalSpacing = (numColumns - 1) * spacing;
  return (availableWidth - totalSpacing) / numColumns;
};

// Detecção de orientação
export const isLandscape = () => SCREEN_WIDTH > SCREEN_HEIGHT;
export const isPortrait = () => SCREEN_HEIGHT > SCREEN_WIDTH;

// Safe area helpers
export const getSafeAreaPadding = () => ({
  paddingTop: Platform.OS === 'ios' ? 44 : 24,
  paddingBottom: Platform.OS === 'ios' ? 34 : 16,
});

// Utilitários para densidade de pixels
export const dp = (size: number) => size * PIXEL_RATIO;
export const sp = (size: number) => size * PIXEL_RATIO;

// Estilos responsivos para modais e popups
export const getResponsiveModalStyle = () => ({
  width: getResponsiveValue(
    SCREEN_WIDTH * 0.9,  // 90% no mobile pequeno
    SCREEN_WIDTH * 0.85, // 85% no mobile médio
    SCREEN_WIDTH * 0.8,  // 80% no mobile grande
    Math.min(600, SCREEN_WIDTH * 0.7) // Max 600px no tablet
  ),
  maxHeight: SCREEN_HEIGHT * 0.8,
  borderRadius: getResponsiveValue(8, 12, 16, 20),
  padding: getResponsiveValue(16, 20, 24, 32),
});

// Sistema de spacing consistente
export const SPACING = {
  XXS: getResponsiveValue(4, 4, 6, 8),
  XS: getResponsiveValue(8, 8, 10, 12),
  SM: getResponsiveValue(12, 14, 16, 20),
  MD: getResponsiveValue(16, 18, 20, 24),
  LG: getResponsiveValue(20, 22, 24, 28),
  XL: getResponsiveValue(24, 28, 32, 40),
  XXL: getResponsiveValue(32, 36, 40, 48),
};

// Typography system responsivo
export const TYPOGRAPHY = {
  H1: { fontSize: getResponsiveFontSize(32), lineHeight: getResponsiveFontSize(40) },
  H2: { fontSize: getResponsiveFontSize(28), lineHeight: getResponsiveFontSize(36) },
  H3: { fontSize: getResponsiveFontSize(24), lineHeight: getResponsiveFontSize(32) },
  H4: { fontSize: getResponsiveFontSize(20), lineHeight: getResponsiveFontSize(28) },
  H5: { fontSize: getResponsiveFontSize(18), lineHeight: getResponsiveFontSize(26) },
  H6: { fontSize: getResponsiveFontSize(16), lineHeight: getResponsiveFontSize(24) },
  BODY_LARGE: { fontSize: getResponsiveFontSize(16), lineHeight: getResponsiveFontSize(24) },
  BODY: { fontSize: getResponsiveFontSize(14), lineHeight: getResponsiveFontSize(20) },
  BODY_SMALL: { fontSize: getResponsiveFontSize(12), lineHeight: getResponsiveFontSize(18) },
  CAPTION: { fontSize: getResponsiveFontSize(10), lineHeight: getResponsiveFontSize(14) },
};

// Layout helpers avançados
export const getResponsiveLayout = () => {
  const isSmall = isSmallMobile();
  const isTabletView = isTablet();
  
  return {
    isCompact: isSmall,
    isTablet: isTabletView,
    columns: getResponsiveGridColumns(),
    spacing: isSmall ? SPACING.SM : SPACING.MD,
    containerPadding: getHorizontalPadding(),
    cardPadding: getResponsiveValue(16, 20, 24, 32),
    borderRadius: getResponsiveValue(8, 12, 16, 20),
  };
};

// Funções para componentes específicos do fitness app
export const getWorkoutCardStyle = () => ({
  width: getGridItemWidth(getResponsiveGridColumns(), SPACING.MD),
  minHeight: getResponsiveValue(120, 140, 160, 180),
  padding: SPACING.MD,
  borderRadius: getResponsiveLayout().borderRadius,
});

export const getExerciseItemHeight = () => {
  return getResponsiveValue(80, 90, 100, 110);
};

export const getProgressChartSize = () => {
  const availableWidth = SCREEN_WIDTH - (getHorizontalPadding() * 2);
  return {
    width: availableWidth,
    height: Math.min(250, availableWidth * 0.6),
  };
};

// Helpers para formulários
export const getFormFieldSpacing = () => SPACING.MD;
export const getFormSectionSpacing = () => SPACING.LG;

// Media queries simuladas para React Native
export const mediaQuery = {
  smallMobile: (styles: any) => (isSmallMobile() ? styles : {}),
  mediumMobile: (styles: any) => (isMediumMobile() ? styles : {}),
  largeMobile: (styles: any) => (isLargeMobile() ? styles : {}),
  tablet: (styles: any) => (isTablet() ? styles : {}),
  landscape: (styles: any) => (isLandscape() ? styles : {}),
  portrait: (styles: any) => (isPortrait() ? styles : {}),
};

// Helper para navegação responsiva
export const getNavigationConfig = () => ({
  tabBarStyle: {
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 34 : 8,
    paddingHorizontal: SPACING.MD,
  },
  headerStyle: {
    height: Platform.OS === 'ios' ? 88 : 56,
  },
});

// Debug helper
export const getResponsiveDebugInfo = () => ({
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  pixelRatio: PIXEL_RATIO,
  isSmall: isSmallMobile(),
  isMedium: isMediumMobile(),
  isLarge: isLargeMobile(),
  isTablet: isTablet(),
  isLandscape: isLandscape(),
  platform: Platform.OS,
  spacing: SPACING,
  touchTargets: TOUCH_TARGETS,
});

// Exportações
export { SCREEN_WIDTH, SCREEN_HEIGHT, PIXEL_RATIO };
/**
 * useOptimizedResponsive - Hook otimizado para sistema responsivo
 * Inclui memoização, cache e otimizações de performance
 */

import { useMemo, useEffect, useState, useCallback } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { 
  responsiveCache, 
  dimensionsManager, 
  performanceMonitor,
  createMemoizedStylesheet,
  PERFORMANCE_CONFIG
} from '../utils/PerformanceOptimizer';
import { 
  getResponsiveValue, 
  getResponsiveFontSize, 
  getResponsiveLayout,
  BREAKPOINTS,
  SPACING,
  TOUCH_TARGETS
} from '../utils/responsive';

interface ResponsiveHookReturn {
  // Valores responsivos com cache
  getValue: (small: number, medium: number, large: number, tablet?: number) => number;
  getFontSize: (baseSize: number, options?: { min?: number; max?: number }) => number;
  getLayout: () => ReturnType<typeof getResponsiveLayout>;
  
  // Informações de tela
  screenInfo: {
    width: number;
    height: number;
    isSmall: boolean;
    isMedium: boolean;
    isLarge: boolean;
    isTablet: boolean;
    isLandscape: boolean;
  };
  
  // Estilos memoizados
  createStyles: <T extends Record<string, any>>(styleCreator: () => T) => T;
  
  // Spacing otimizado
  spacing: typeof SPACING;
  touchTargets: typeof TOUCH_TARGETS;
}

export const useOptimizedResponsive = (): ResponsiveHookReturn => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  
  // Listener otimizado com cleanup automático
  useEffect(() => {
    const unsubscribe = dimensionsManager.addListener((dims) => {
      performanceMonitor.measure('dimensions_update', () => {
        setDimensions(dims.window);
      });
    });
    
    return unsubscribe;
  }, []);
  
  // Screen info memoizado
  const screenInfo = useMemo(() => {
    const { width, height } = dimensions;
    
    return performanceMonitor.measure('screen_info_calculation', () => ({
      width,
      height,
      isSmall: width <= BREAKPOINTS.SMALL_MOBILE,
      isMedium: width > BREAKPOINTS.SMALL_MOBILE && width <= BREAKPOINTS.MEDIUM_MOBILE,
      isLarge: width > BREAKPOINTS.MEDIUM_MOBILE && width <= BREAKPOINTS.LARGE_MOBILE,
      isTablet: width >= BREAKPOINTS.TABLET,
      isLandscape: width > height,
    }));
  }, [dimensions]);
  
  // Função getValue com cache
  const getValue = useCallback((
    small: number, 
    medium: number, 
    large: number, 
    tablet?: number
  ): number => {
    const cacheKey = `responsive_value_${small}_${medium}_${large}_${tablet || 'undefined'}`;
    
    let cached = responsiveCache.get<number>(cacheKey);
    if (cached !== null) return cached;
    
    const value = performanceMonitor.measure('responsive_value_calculation', () => 
      getResponsiveValue(small, medium, large, tablet)
    );
    
    responsiveCache.set(cacheKey, value);
    return value;
  }, []);
  
  // Função getFontSize com cache
  const getFontSize = useCallback((
    baseSize: number, 
    options?: { min?: number; max?: number }
  ): number => {
    const cacheKey = `font_size_${baseSize}_${JSON.stringify(options || {})}`;
    
    let cached = responsiveCache.get<number>(cacheKey);
    if (cached !== null) return cached;
    
    const fontSize = performanceMonitor.measure('font_size_calculation', () =>
      getResponsiveFontSize(baseSize, options)
    );
    
    responsiveCache.set(cacheKey, fontSize);
    return fontSize;
  }, []);
  
  // Layout info memoizado com cache
  const getLayout = useCallback(() => {
    const cached = responsiveCache.get<ReturnType<typeof getResponsiveLayout>>('layout_info');
    if (cached !== null) return cached;
    
    const layout = performanceMonitor.measure('layout_calculation', () => 
      getResponsiveLayout()
    );
    
    responsiveCache.set('layout_info', layout);
    return layout;
  }, []);
  
  // Função para criar estilos memoizados
  const createStyles = useCallback(<T extends Record<string, any>>(
    styleCreator: () => T
  ): T => {
    const styleKey = `styles_${screenInfo.width}_${screenInfo.height}`;
    
    return createMemoizedStylesheet(styleCreator, [
      screenInfo.width,
      screenInfo.height,
      screenInfo.isTablet
    ]);
  }, [screenInfo]);
  
  return {
    getValue,
    getFontSize,
    getLayout,
    screenInfo,
    createStyles,
    spacing: SPACING,
    touchTargets: TOUCH_TARGETS,
  };
};

// ===== HOOKS ESPECIALIZADOS PARA COMPONENTES ESPECÍFICOS =====

/**
 * Hook otimizado para componentes de lista
 */
export const useOptimizedList = (itemCount: number) => {
  const { screenInfo, getValue } = useOptimizedResponsive();
  
  const listConfig = useMemo(() => {
    return performanceMonitor.measure('list_config_calculation', () => ({
      itemHeight: getValue(80, 90, 100, 110),
      
      // Otimizações baseadas no tamanho da lista
      windowSize: itemCount > 100 ? 5 : 10,
      maxToRenderPerBatch: itemCount > 100 ? 3 : 5,
      initialNumToRender: Math.min(10, itemCount),
      
      // Layout calculation
      getItemLayout: (data: any, index: number) => ({
        length: getValue(80, 90, 100, 110),
        offset: getValue(80, 90, 100, 110) * index,
        index,
      }),
      
      // Performance optimizations
      removeClippedSubviews: itemCount > 50,
      updateCellsBatchingPeriod: itemCount > 100 ? 100 : 50,
    }));
  }, [itemCount, getValue, screenInfo]);
  
  return listConfig;
};

/**
 * Hook otimizado para WorkoutTimer
 */
export const useOptimizedTimer = () => {
  const { createStyles, getValue, getFontSize } = useOptimizedResponsive();
  
  const timerStyles = createStyles(() => StyleSheet.create({
    timerContainer: {
      alignItems: 'center',
      paddingVertical: getValue(24, 28, 32, 40),
      paddingHorizontal: getValue(32, 40, 48, 56),
      borderRadius: getValue(16, 18, 20, 24),
      minWidth: getValue(240, 260, 280, 320),
    },
    timerText: {
      fontSize: getFontSize(48, { min: 36, max: 60 }),
      fontWeight: '700',
      fontFamily: 'monospace',
      // Otimização: usar textAlign em vez de alignSelf
      textAlign: 'center',
      // Evitar re-renders desnecessários
      includeFontPadding: false,
    },
    controlButton: {
      minHeight: getValue(48, 52, 56, 64),
      paddingVertical: getValue(12, 14, 16, 20),
      paddingHorizontal: getValue(20, 24, 28, 32),
      borderRadius: getValue(8, 10, 12, 16),
      // Otimização para touch
      minWidth: getValue(120, 140, 160, 180),
    }
  }));
  
  // Performance budget para timer (60 FPS = 16ms)
  const performanceConfig = useMemo(() => ({
    budget: PERFORMANCE_CONFIG.TIMER_BUDGET_MS,
    shouldOptimize: true,
    useNativeDriver: true,
  }), []);
  
  return {
    styles: timerStyles,
    config: performanceConfig,
  };
};

/**
 * Hook otimizado para charts de progresso
 */
export const useOptimizedChart = (dataSize: number) => {
  const { screenInfo, getValue } = useOptimizedResponsive();
  
  const chartConfig = useMemo(() => {
    const baseWidth = screenInfo.width - (getValue(16, 20, 24, 32) * 2);
    
    return performanceMonitor.measure('chart_config_calculation', () => ({
      // Dimensões baseadas na tela
      width: Math.min(baseWidth, 600),
      height: Math.min(getValue(200, 220, 250, 300), baseWidth * 0.6),
      
      // Otimizações baseadas no tamanho dos dados
      backgroundColor: 'transparent',
      backgroundGradientFrom: '#1E1E1E',
      backgroundGradientTo: '#2C2C2E',
      
      // Reduzir pontos de dados se muitos
      decimals: dataSize > 50 ? 0 : 1,
      
      // Configurações de performance
      bezier: dataSize <= 20, // Bezier curves apenas para datasets pequenos
      skipXLabels: dataSize > 30 ? Math.floor(dataSize / 10) : 0,
      
      // Cores otimizadas
      color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
      strokeWidth: dataSize > 100 ? 1 : 2,
      
      // Configurações de responsividade
      propsForDots: {
        r: screenInfo.isSmall ? "3" : "4",
        strokeWidth: "1",
        stroke: "#FF6B35"
      },
      
      // Label configuration
      labelColor: () => '#8E8E93',
      style: {
        borderRadius: getValue(8, 10, 12, 16),
      }
    }));
  }, [dataSize, screenInfo, getValue]);
  
  return chartConfig;
};

/**
 * Hook para otimização de orientação
 */
export const useOrientationOptimization = () => {
  const { screenInfo } = useOptimizedResponsive();
  const [isChanging, setIsChanging] = useState(false);
  
  useEffect(() => {
    setIsChanging(true);
    
    const timeout = setTimeout(() => {
      setIsChanging(false);
    }, PERFORMANCE_CONFIG.ORIENTATION_TIMEOUT_MS);
    
    return () => clearTimeout(timeout);
  }, [screenInfo.isLandscape]);
  
  const orientationStyles = useMemo(() => {
    if (isChanging) {
      // Estilos simplificados durante mudança de orientação
      return { opacity: 0.8 };
    }
    
    return screenInfo.isLandscape 
      ? { flexDirection: 'row' as const }
      : { flexDirection: 'column' as const };
  }, [screenInfo.isLandscape, isChanging]);
  
  return {
    isChanging,
    orientationStyles,
    isLandscape: screenInfo.isLandscape
  };
};

/**
 * Hook para chat em tempo real com otimizações de performance
 */
export const useOptimizedChat = (messageCount: number) => {
  const { getValue } = useOptimizedResponsive();
  
  const chatConfig = useMemo(() => ({
    // Configurações de lista para mensagens
    messageHeight: getValue(60, 70, 80, 90),
    maxVisibleMessages: getValue(20, 25, 30, 40),
    
    // Batching para atualizações
    updateBatchSize: 5,
    updateInterval: 100,
    
    // Virtualization para muitas mensagens
    useVirtualization: messageCount > 50,
    windowSize: messageCount > 100 ? 10 : 20,
    
    // Otimizações de input
    inputHeight: getValue(40, 44, 48, 56),
    inputMaxHeight: getValue(120, 140, 160, 180),
    
    // Debounce para typing indicators
    typingDebounce: 300,
  }), [messageCount, getValue]);
  
  return chatConfig;
};
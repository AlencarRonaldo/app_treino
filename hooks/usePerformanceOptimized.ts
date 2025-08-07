/**
 * TreinosApp - Hooks de Performance Otimizados
 * FASE 2: Sistema de hooks com otimização crítica para fitness environment
 * Virtualização, chart adaptivo, memory management e dimensions debounce
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { getResponsiveMetrics, detectDeviceInfo } from '../utils/responsiveCore';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

interface OptimizedListConfig {
  itemHeight: number;
  overscan: number;
  threshold: number;
  enableVirtualization: boolean;
}

interface OptimizedChartConfig {
  maxDataPoints: number;
  enableAdaptiveRendering: boolean;
  qualityThreshold: 'low' | 'medium' | 'high';
  animationEnabled: boolean;
}

interface DimensionsState {
  window: { width: number; height: number };
  screen: { width: number; height: number };
  timestamp: number;
}

interface MemoryWarning {
  level: 'low' | 'medium' | 'high' | 'critical';
  memoryUsage: number;
  recommendations: string[];
}

// =============================================================================
// DIMENSIONS MANAGER - DEBOUNCE INTELIGENTE
// =============================================================================

class DimensionsManager {
  private listeners = new Set<(dimensions: DimensionsState) => void>();
  private currentState: DimensionsState;
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceDelay = 150; // ms
  private isInitialized = false;

  constructor() {
    this.currentState = {
      window: Dimensions.get('window'),
      screen: Dimensions.get('screen'),
      timestamp: Date.now(),
    };
  }

  initialize() {
    if (this.isInitialized) return;

    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      // Debounce dimension changes para evitar excessive re-renders
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        const newState: DimensionsState = {
          window,
          screen,
          timestamp: Date.now(),
        };

        // Só notificar se houve mudança significativa (>5px)
        const hasSignificantChange = 
          Math.abs(this.currentState.window.width - window.width) > 5 ||
          Math.abs(this.currentState.window.height - window.height) > 5;

        if (hasSignificantChange) {
          this.currentState = newState;
          this.notifyListeners(newState);
        }
      }, this.debounceDelay);
    });

    this.isInitialized = true;
    
    return () => {
      subscription?.remove();
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
    };
  }

  subscribe(listener: (dimensions: DimensionsState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getCurrentState() {
    return this.currentState;
  }

  private notifyListeners(state: DimensionsState) {
    this.listeners.forEach(listener => listener(state));
  }
}

const dimensionsManager = new DimensionsManager();

// =============================================================================
// MEMORY MANAGER - CLEANUP AUTOMÁTICO
// =============================================================================

class MemoryManager {
  private memoryRefs = new Map<string, WeakRef<any>>();
  private cleanupCallbacks = new Map<string, () => void>();
  private warningThresholds = {
    low: 100 * 1024 * 1024,      // 100MB
    medium: 200 * 1024 * 1024,   // 200MB
    high: 300 * 1024 * 1024,     // 300MB
    critical: 400 * 1024 * 1024, // 400MB
  };

  register(id: string, ref: any, cleanupCallback?: () => void) {
    this.memoryRefs.set(id, new WeakRef(ref));
    if (cleanupCallback) {
      this.cleanupCallbacks.set(id, cleanupCallback);
    }
  }

  unregister(id: string) {
    this.memoryRefs.delete(id);
    const cleanup = this.cleanupCallbacks.get(id);
    if (cleanup) {
      cleanup();
      this.cleanupCallbacks.delete(id);
    }
  }

  performCleanup() {
    // Cleanup de referências mortas
    for (const [id, weakRef] of this.memoryRefs.entries()) {
      if (weakRef.deref() === undefined) {
        this.unregister(id);
      }
    }

    // Forçar garbage collection se disponível
    if (global.gc && __DEV__) {
      global.gc();
    }
  }

  getMemoryWarning(): MemoryWarning | null {
    // Simulação de memory usage - em produção usaria JSI bridge
    const estimatedUsage = this.memoryRefs.size * 1024 * 1024; // Rough estimate

    let level: MemoryWarning['level'] | null = null;
    const recommendations: string[] = [];

    if (estimatedUsage >= this.warningThresholds.critical) {
      level = 'critical';
      recommendations.push('Limpar cache imediatamente', 'Reduzir qualidade de imagens', 'Desabilitar animações');
    } else if (estimatedUsage >= this.warningThresholds.high) {
      level = 'high';
      recommendations.push('Limpar cache desnecessário', 'Reduzir itens em listas');
    } else if (estimatedUsage >= this.warningThresholds.medium) {
      level = 'medium';
      recommendations.push('Considerar limpeza de cache');
    } else if (estimatedUsage >= this.warningThresholds.low) {
      level = 'low';
      recommendations.push('Monitorar uso de memória');
    }

    return level ? { level, memoryUsage: estimatedUsage, recommendations } : null;
  }
}

const memoryManager = new MemoryManager();

// =============================================================================
// HOOK: useOptimizedList - VIRTUALIZAÇÃO PARA 200+ ITEMS
// =============================================================================

export const useOptimizedList = <T>(
  data: T[],
  itemHeight: number,
  containerHeight: number,
  config?: Partial<OptimizedListConfig>
) => {
  const defaultConfig: OptimizedListConfig = {
    itemHeight,
    overscan: 5,
    threshold: 50, // Ativar virtualização acima de 50 items
    enableVirtualization: data.length > (config?.threshold || 50),
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const [scrollOffset, setScrollOffset] = useState(0);
  const listId = useRef(`list_${Date.now()}_${Math.random()}`).current;

  // Calcular range visível
  const visibleRange = useMemo(() => {
    if (!mergedConfig.enableVirtualization) {
      return { start: 0, end: data.length, visibleItems: data };
    }

    const start = Math.max(0, Math.floor(scrollOffset / mergedConfig.itemHeight) - mergedConfig.overscan);
    const visibleCount = Math.ceil(containerHeight / mergedConfig.itemHeight);
    const end = Math.min(data.length, start + visibleCount + mergedConfig.overscan * 2);

    return {
      start,
      end,
      visibleItems: data.slice(start, end),
    };
  }, [data, scrollOffset, mergedConfig, containerHeight]);

  // Registrar na memory manager
  useEffect(() => {
    memoryManager.register(listId, data);
    return () => memoryManager.unregister(listId);
  }, [listId, data]);

  // Handler de scroll otimizado
  const handleScroll = useCallback((event: any) => {
    const newOffset = event.nativeEvent.contentOffset.y;
    setScrollOffset(newOffset);
  }, []);

  // Calcular espaçadores para virtualização
  const spacerTop = visibleRange.start * mergedConfig.itemHeight;
  const spacerBottom = (data.length - visibleRange.end) * mergedConfig.itemHeight;

  return {
    visibleItems: visibleRange.visibleItems,
    visibleRange,
    handleScroll,
    spacerTop,
    spacerBottom,
    isVirtualized: mergedConfig.enableVirtualization,
    totalHeight: data.length * mergedConfig.itemHeight,
    config: mergedConfig,
  };
};

// =============================================================================
// HOOK: useOptimizedChart - RENDERIZAÇÃO ADAPTATIVA
// =============================================================================

export const useOptimizedChart = (
  data: any[],
  config?: Partial<OptimizedChartConfig>
) => {
  const deviceInfo = detectDeviceInfo();
  const metrics = getResponsiveMetrics();
  
  const defaultConfig: OptimizedChartConfig = {
    maxDataPoints: deviceInfo.isTablet ? 100 : 50,
    enableAdaptiveRendering: true,
    qualityThreshold: deviceInfo.isTablet ? 'high' : 'medium',
    animationEnabled: !deviceInfo.isTablet || data.length < 30,
  };

  const mergedConfig = { ...defaultConfig, ...config };
  const chartId = useRef(`chart_${Date.now()}_${Math.random()}`).current;

  // Processar dados baseado na performance do device
  const processedData = useMemo(() => {
    if (!mergedConfig.enableAdaptiveRendering) {
      return data;
    }

    // Reduzir dados se necessário
    if (data.length > mergedConfig.maxDataPoints) {
      const step = Math.ceil(data.length / mergedConfig.maxDataPoints);
      return data.filter((_, index) => index % step === 0);
    }

    return data;
  }, [data, mergedConfig]);

  // Configuração de qualidade adaptativa
  const chartQuality = useMemo(() => {
    const baseQuality = {
      low: { strokeWidth: 1, pointRadius: 2, gridLines: false },
      medium: { strokeWidth: 2, pointRadius: 3, gridLines: true },
      high: { strokeWidth: 3, pointRadius: 4, gridLines: true },
    };

    return baseQuality[mergedConfig.qualityThreshold];
  }, [mergedConfig.qualityThreshold]);

  // Registrar na memory manager
  useEffect(() => {
    memoryManager.register(chartId, processedData);
    return () => memoryManager.unregister(chartId);
  }, [chartId, processedData]);

  return {
    data: processedData,
    quality: chartQuality,
    config: mergedConfig,
    shouldAnimate: mergedConfig.animationEnabled,
    dataReduction: data.length > processedData.length ? 
      `${Math.round((1 - processedData.length / data.length) * 100)}%` : '0%',
  };
};

// =============================================================================
// HOOK: useDimensionsOptimized - DIMENSIONS COM DEBOUNCE
// =============================================================================

export const useDimensionsOptimized = () => {
  const [dimensions, setDimensions] = useState<DimensionsState>(() =>
    dimensionsManager.getCurrentState()
  );

  useEffect(() => {
    const cleanup = dimensionsManager.initialize();
    const unsubscribe = dimensionsManager.subscribe(setDimensions);

    return () => {
      unsubscribe();
      cleanup?.();
    };
  }, []);

  return dimensions;
};

// =============================================================================
// HOOK: useMemoryOptimized - MEMORY MONITORING
// =============================================================================

export const useMemoryOptimized = (componentId: string) => {
  const [memoryWarning, setMemoryWarning] = useState<MemoryWarning | null>(null);
  const componentRef = useRef<any>(null);

  useEffect(() => {
    // Registrar componente
    memoryManager.register(componentId, componentRef.current);

    // Check memory periodicamente
    const interval = setInterval(() => {
      const warning = memoryManager.getMemoryWarning();
      setMemoryWarning(warning);

      // Auto cleanup se memória crítica
      if (warning?.level === 'critical') {
        memoryManager.performCleanup();
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      memoryManager.unregister(componentId);
    };
  }, [componentId]);

  const forceCleanup = useCallback(() => {
    memoryManager.performCleanup();
  }, []);

  return {
    memoryWarning,
    forceCleanup,
    setRef: (ref: any) => {
      componentRef.current = ref;
    },
  };
};

// =============================================================================
// HOOK: useResponsivePerformance - PERFORMANCE GERAL
// =============================================================================

export const useResponsivePerformance = () => {
  const dimensions = useDimensionsOptimized();
  const deviceInfo = useMemo(() => detectDeviceInfo(), [dimensions]);
  const metrics = useMemo(() => getResponsiveMetrics(), [dimensions]);

  // Performance flags baseadas no device
  const performanceFlags = useMemo(() => {
    return {
      shouldReduceAnimations: !deviceInfo.isTablet && deviceInfo.scale < 2,
      shouldUseVirtualization: true, // Sempre para listas grandes
      shouldOptimizeImages: deviceInfo.densityBucket === 'ldpi' || deviceInfo.densityBucket === 'mdpi',
      shouldLimitParallax: Platform.OS === 'android' && deviceInfo.scale < 2,
      shouldPreferSimpleTransitions: !deviceInfo.isTablet,
      maxConcurrentAnimations: deviceInfo.isTablet ? 5 : 3,
    };
  }, [deviceInfo]);

  // Calcular budget de performance
  const performanceBudget = useMemo(() => {
    const baseScore = deviceInfo.isTablet ? 100 : 60;
    const scaleBonus = deviceInfo.scale >= 3 ? 20 : 0;
    const platformBonus = Platform.OS === 'ios' ? 10 : 0;
    
    return Math.min(100, baseScore + scaleBonus + platformBonus);
  }, [deviceInfo]);

  return {
    dimensions,
    deviceInfo,
    metrics,
    performanceFlags,
    performanceBudget,
    isHighPerformanceDevice: performanceBudget >= 80,
    isLowPerformanceDevice: performanceBudget < 60,
  };
};

// =============================================================================
// HOOK: useSmartMemoization - MEMOIZAÇÃO INTELIGENTE
// =============================================================================

export const useSmartMemoization = <T>(
  factory: () => T,
  deps: any[],
  options?: { 
    expiry?: number;
    deepCompare?: boolean;
  }
) => {
  const { expiry = 60000, deepCompare = false } = options || {};
  const cacheRef = useRef<{ value: T; timestamp: number; deps: any[] } | null>(null);

  return useMemo(() => {
    const now = Date.now();
    
    // Check cache válido
    if (cacheRef.current) {
      const isExpired = now - cacheRef.current.timestamp > expiry;
      const depsChanged = deepCompare 
        ? JSON.stringify(cacheRef.current.deps) !== JSON.stringify(deps)
        : cacheRef.current.deps.some((dep, index) => dep !== deps[index]);
      
      if (!isExpired && !depsChanged) {
        return cacheRef.current.value;
      }
    }

    // Calcular novo valor
    const value = factory();
    cacheRef.current = { value, timestamp: now, deps: [...deps] };
    
    return value;
  }, deps);
};

// =============================================================================
// UTILITIES EXPORTADAS
// =============================================================================

export const performanceUtils = {
  // Force cleanup global
  forceGlobalCleanup: () => memoryManager.performCleanup(),
  
  // Get memory stats
  getMemoryStats: () => memoryManager.getMemoryWarning(),
  
  // Dimensions manager
  getDimensionsManager: () => dimensionsManager,
  
  // Performance profiler
  profileFunction: <T extends (...args: any[]) => any>(fn: T, label?: string): T => {
    return ((...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (__DEV__ && label) {
        console.log(`⚡ ${label}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    }) as T;
  },
};

export default {
  useOptimizedList,
  useOptimizedChart,
  useDimensionsOptimized,
  useMemoryOptimized,
  useResponsivePerformance,
  useSmartMemoization,
  performanceUtils,
};
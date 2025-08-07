/**
 * Performance Optimizer - Sistema de otimização de performance para TreinosApp
 * Foco em cenários críticos: Timer, Listas grandes, Charts, Chat, Responsividade
 */

import { Dimensions, PixelRatio, Platform, InteractionManager } from 'react-native';
import { BREAKPOINTS } from './responsive';

// ===== RESPONSIVE CALCULATIONS CACHING =====

interface ResponsiveCacheItem {
  value: any;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  timestamp: number;
}

class ResponsiveCache {
  private cache = new Map<string, ResponsiveCacheItem>();
  private maxAge = 30000; // 30 segundos
  private maxSize = 100;
  
  private generateKey(key: string, args?: any[]): string {
    return `${key}_${args ? JSON.stringify(args) : ''}`;
  }
  
  get<T>(key: string, args?: any[]): T | null {
    const cacheKey = this.generateKey(key, args);
    const item = this.cache.get(cacheKey);
    
    if (!item) return null;
    
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    
    // Verificar se cache ainda é válido
    const isValid = 
      item.screenWidth === width &&
      item.screenHeight === height &&
      item.pixelRatio === pixelRatio &&
      (Date.now() - item.timestamp) < this.maxAge;
    
    if (!isValid) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return item.value;
  }
  
  set<T>(key: string, value: T, args?: any[]): void {
    if (this.cache.size >= this.maxSize) {
      // Remove oldest item
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    const { width, height } = Dimensions.get('window');
    const cacheKey = this.generateKey(key, args);
    
    this.cache.set(cacheKey, {
      value,
      screenWidth: width,
      screenHeight: height,
      pixelRatio: PixelRatio.get(),
      timestamp: Date.now()
    });
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const responsiveCache = new ResponsiveCache();

// ===== STYLESHEET CREATION CACHING =====

class StyleSheetCache {
  private cache = new Map<string, any>();
  private computedStyles = new Map<string, any>();
  
  createCached<T extends Record<string, any>>(styles: T, key: string): T {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const computedStyles = Object.keys(styles).reduce((acc, styleKey) => {
      const style = styles[styleKey];
      
      // Computar estilos responsivos apenas uma vez
      if (typeof style === 'function') {
        acc[styleKey] = style();
      } else {
        acc[styleKey] = style;
      }
      
      return acc;
    }, {} as T);
    
    this.cache.set(key, computedStyles);
    return computedStyles;
  }
  
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

export const styleSheetCache = new StyleSheetCache();

// ===== DIMENSIONS LISTENER OPTIMIZATION =====

class DimensionsManager {
  private listeners = new Set<(dims: any) => void>();
  private lastDimensions: any = null;
  private debounceTimeout: NodeJS.Timeout | null = null;
  private isListening = false;
  
  addListener(callback: (dims: any) => void): () => void {
    this.listeners.add(callback);
    
    if (!this.isListening) {
      this.startListening();
    }
    
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopListening();
      }
    };
  }
  
  private startListening(): void {
    this.isListening = true;
    this.subscription = Dimensions.addEventListener('change', this.handleDimensionsChange);
  }
  
  private stopListening(): void {
    this.isListening = false;
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }
  
  private subscription: any = null;
  
  private handleDimensionsChange = (dims: any): void => {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout);
    }
    
    this.debounceTimeout = setTimeout(() => {
      this.lastDimensions = dims;
      
      // Limpar caches quando dimensões mudam
      responsiveCache.clear();
      styleSheetCache.invalidate();
      
      // Notificar listeners de forma batched
      this.listeners.forEach(listener => {
        try {
          listener(dims);
        } catch (error) {
          console.warn('Error in dimensions listener:', error);
        }
      });
    }, 16); // ~1 frame delay para evitar múltiplas mudanças
  };
}

export const dimensionsManager = new DimensionsManager();

// ===== PERFORMANCE MONITORING =====

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();
  private thresholds = {
    timer: 16, // 60 FPS target
    listRender: 100,
    orientation: 300,
    chartRender: 500
  };
  
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }
  
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    const duration = performance.now() - metric.startTime;
    metric.endTime = performance.now();
    
    // Check threshold violations
    const threshold = this.thresholds[name as keyof typeof this.thresholds];
    if (threshold && duration > threshold) {
      console.warn(`Performance threshold violated: ${name} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }
    
    return duration;
  }
  
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(name);
    }
  }
  
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }
  
  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }
  
  clearMetrics(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// ===== MEMORY MANAGEMENT =====

class MemoryManager {
  private imageCache = new Map<string, any>();
  private maxImageCacheSize = 50;
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startPeriodicCleanup();
  }
  
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 30000); // Cleanup every 30 seconds
  }
  
  cacheImage(uri: string, imageData: any): void {
    if (this.imageCache.size >= this.maxImageCacheSize) {
      const firstKey = this.imageCache.keys().next().value;
      if (firstKey) {
        this.imageCache.delete(firstKey);
      }
    }
    
    this.imageCache.set(uri, {
      data: imageData,
      timestamp: Date.now(),
      accessed: Date.now()
    });
  }
  
  getImage(uri: string): any | null {
    const cached = this.imageCache.get(uri);
    if (cached) {
      cached.accessed = Date.now();
      return cached.data;
    }
    return null;
  }
  
  cleanup(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    
    for (const [key, value] of this.imageCache) {
      if (now - value.accessed > maxAge) {
        this.imageCache.delete(key);
      }
    }
    
    // Force garbage collection hint
    if (global.gc) {
      global.gc();
    }
  }
  
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.imageCache.clear();
  }
}

export const memoryManager = new MemoryManager();

// ===== INTERACTION MANAGER HELPERS =====

export const runAfterInteractions = <T>(fn: () => T): Promise<T> => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve(fn());
    });
  });
};

export const scheduleWork = <T>(fn: () => T): void => {
  if (Platform.OS === 'android') {
    // Android: use setTimeout for better performance
    setTimeout(fn, 0);
  } else {
    // iOS: use InteractionManager
    InteractionManager.runAfterInteractions(fn);
  }
};

// ===== BATCHING UTILITIES =====

class BatchProcessor {
  private batches = new Map<string, Array<() => void>>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  
  add(batchKey: string, task: () => void, delay = 16): void {
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, []);
    }
    
    const batch = this.batches.get(batchKey)!;
    batch.push(task);
    
    // Clear existing timeout
    const existingTimeout = this.timeouts.get(batchKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      this.flush(batchKey);
    }, delay);
    
    this.timeouts.set(batchKey, timeout);
  }
  
  flush(batchKey: string): void {
    const batch = this.batches.get(batchKey);
    if (!batch) return;
    
    performanceMonitor.measure(`batch_${batchKey}`, () => {
      batch.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn(`Error in batch ${batchKey}:`, error);
        }
      });
    });
    
    this.batches.delete(batchKey);
    
    const timeout = this.timeouts.get(batchKey);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(batchKey);
    }
  }
}

export const batchProcessor = new BatchProcessor();

// ===== COMPONENT OPTIMIZATION HELPERS =====

export const createMemoizedStylesheet = <T extends Record<string, any>>(
  styleCreator: () => T,
  dependencies: any[] = []
): T => {
  const key = JSON.stringify(dependencies);
  
  return performanceMonitor.measure('stylesheet_creation', () => {
    const cached = responsiveCache.get<T>('stylesheet', [key]);
    if (cached) return cached;
    
    const styles = styleCreator();
    responsiveCache.set('stylesheet', styles, [key]);
    return styles;
  });
};

export const optimizeListRendering = {
  getItemLayout: (itemHeight: number) => (data: any, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  }),
  
  keyExtractor: (item: any, index: number) => 
    item.id ? `${item.id}` : `item_${index}`,
  
  windowSize: Platform.OS === 'ios' ? 10 : 5,
  maxToRenderPerBatch: Platform.OS === 'ios' ? 5 : 3,
  updateCellsBatchingPeriod: 50,
  initialNumToRender: Platform.OS === 'ios' ? 10 : 5,
  removeClippedSubviews: Platform.OS === 'android',
};

// ===== CRITICAL PATH OPTIMIZATIONS =====

export const createHighPerformanceTimer = (callback: () => void, interval = 1000) => {
  let lastTime = Date.now();
  let animationFrame: number;
  
  const tick = () => {
    const currentTime = Date.now();
    
    if (currentTime - lastTime >= interval) {
      performanceMonitor.measure('timer_tick', callback);
      lastTime = currentTime;
    }
    
    animationFrame = requestAnimationFrame(tick);
  };
  
  animationFrame = requestAnimationFrame(tick);
  
  return () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
  };
};

export const createOptimizedChartRenderer = (
  renderChart: (data: any) => void,
  debounceMs = 100
) => {
  let debounceTimeout: NodeJS.Timeout;
  let lastData: any;
  
  return (data: any) => {
    if (JSON.stringify(data) === JSON.stringify(lastData)) {
      return; // Skip if data hasn't changed
    }
    
    lastData = data;
    
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    debounceTimeout = setTimeout(() => {
      performanceMonitor.measure('chart_render', () => renderChart(data));
    }, debounceMs);
  };
};

// ===== BUNDLE SIZE OPTIMIZATION =====

export const createLazyBreakpoints = () => {
  let breakpoints: typeof BREAKPOINTS | null = null;
  
  return () => {
    if (!breakpoints) {
      breakpoints = BREAKPOINTS;
    }
    return breakpoints;
  };
};

// ===== EXPORT PERFORMANCE CONFIGURATION =====

export const PERFORMANCE_CONFIG = {
  // Timer rendering budget (60 FPS = 16.67ms per frame)
  TIMER_BUDGET_MS: 16,
  
  // List scrolling performance
  LIST_ITEM_HEIGHT: 80,
  LIST_OVERSCAN: 5,
  LIST_DEBOUNCE_MS: 100,
  
  // Orientation changes
  ORIENTATION_TIMEOUT_MS: 300,
  
  // Memory management
  MAX_IMAGE_CACHE_SIZE: 50,
  CACHE_CLEANUP_INTERVAL_MS: 30000,
  
  // Network optimization
  REQUEST_TIMEOUT_MS: 10000,
  RETRY_ATTEMPTS: 3,
  
  // Chart rendering
  CHART_DEBOUNCE_MS: 100,
  CHART_ANIMATION_DURATION: 300,
  
  // Bundle optimization
  LAZY_LOAD_THRESHOLD: 1000,
  CODE_SPLITTING_SIZE_LIMIT: 100000, // 100KB
} as const;

// ===== DEBUG UTILITIES =====

export const createPerformanceReport = () => {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  
  return {
    device: {
      platform: Platform.OS,
      screenWidth: width,
      screenHeight: height,
      pixelRatio,
      isTablet: width >= BREAKPOINTS.TABLET
    },
    cache: {
      responsiveCacheSize: responsiveCache['cache'].size,
      styleSheetCacheSize: styleSheetCache['cache'].size,
      imageCacheSize: memoryManager['imageCache'].size
    },
    metrics: performanceMonitor.getMetrics(),
    timestamp: Date.now()
  };
};
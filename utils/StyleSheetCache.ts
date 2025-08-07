/**
 * TreinosApp - StyleSheet Cache Otimizado
 * FASE 2: Cache de estilos responsivos com LRU e invalidação automática
 * Otimizado para ambientes fitness com performance crítica
 */

import { StyleSheet, TextStyle, ViewStyle, ImageStyle, Dimensions } from 'react-native';
import { detectDeviceInfo, getResponsiveMetrics } from './responsiveCore';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

interface CacheEntry<T> {
  styles: T;
  timestamp: number;
  ttl: number;
  dimensionsKey: string;
  hash: string;
}

interface CacheStats {
  size: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  memoryUsage: number;
}

interface StyleSheetOptions {
  ttl?: number;
  enableInvalidation?: boolean;
  enableCompression?: boolean;
  maxCacheSize?: number;
}

// =============================================================================
// LRU CACHE IMPLEMENTATION
// =============================================================================

class LRUCache<K, V> {
  private capacity: number;
  private cache = new Map<K, V>();

  constructor(capacity: number = 50) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
}

// =============================================================================
// STYLESHEET CACHE CLASS
// =============================================================================

class StyleSheetCacheImpl {
  private cache = new LRUCache<string, CacheEntry<any>>(50);
  private hitCount = 0;
  private missCount = 0;
  private dimensionsSubscription: any;
  private currentDimensionsKey = '';

  constructor() {
    this.updateDimensionsKey();
    this.setupDimensionsListener();
  }

  private updateDimensionsKey(): void {
    const { width, height } = Dimensions.get('window');
    const deviceInfo = detectDeviceInfo();
    this.currentDimensionsKey = `${width}x${height}_${deviceInfo.scale}_${deviceInfo.isTablet}`;
  }

  private setupDimensionsListener(): void {
    this.dimensionsSubscription = Dimensions.addEventListener('change', () => {
      const oldKey = this.currentDimensionsKey;
      this.updateDimensionsKey();
      
      // Invalidar cache quando dimensões mudam
      if (oldKey !== this.currentDimensionsKey) {
        this.invalidateAll();
      }
    });
  }

  private generateHash(styles: any): string {
    // Simple hash function para detectar mudanças nos estilos
    return JSON.stringify(styles).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(16);
  }

  create<T extends NamedStyles<T>>(
    styles: T | ((metrics: any) => T),
    cacheKey?: string,
    options?: StyleSheetOptions
  ): T {
    const {
      ttl = 300000, // 5 minutos default
      enableInvalidation = true,
      enableCompression = false,
      maxCacheSize = 50,
    } = options || {};

    // Gerar cache key baseada em dimensões e função de estilos
    const stylesString = typeof styles === 'function' ? styles.toString() : JSON.stringify(styles);
    const fullCacheKey = cacheKey || 
      `${this.currentDimensionsKey}_${this.generateHash(stylesString)}`;

    // Verificar cache
    const cached = this.cache.get(fullCacheKey);
    const now = Date.now();

    if (cached && 
        cached.dimensionsKey === this.currentDimensionsKey &&
        (now - cached.timestamp) < cached.ttl) {
      this.hitCount++;
      return cached.styles;
    }

    // Cache miss - calcular estilos
    this.missCount++;
    
    let calculatedStyles: T;
    if (typeof styles === 'function') {
      const metrics = getResponsiveMetrics();
      const deviceInfo = detectDeviceInfo();
      calculatedStyles = styles({ ...metrics, deviceInfo });
    } else {
      calculatedStyles = styles;
    }

    // Criar StyleSheet
    const styleSheet = StyleSheet.create(calculatedStyles);

    // Armazenar no cache
    const cacheEntry: CacheEntry<T> = {
      styles: styleSheet,
      timestamp: now,
      ttl,
      dimensionsKey: this.currentDimensionsKey,
      hash: this.generateHash(calculatedStyles),
    };

    this.cache.set(fullCacheKey, cacheEntry);

    return styleSheet;
  }

  // Invalidar cache específico
  invalidate(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Invalidar todo o cache
  invalidateAll(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  // Invalidar cache baseado em TTL
  invalidateExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key);
      if (entry && (now - entry.timestamp) > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Limpar cache com mudança de dimensões
  invalidateDimensionsMismatch(): void {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key);
      if (entry && entry.dimensionsKey !== this.currentDimensionsKey) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Estatísticas do cache
  getStats(): CacheStats {
    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;
    
    // Estimativa grosseira de uso de memória
    const estimatedMemoryPerEntry = 1024; // 1KB por entrada (aproximado)
    const memoryUsage = this.cache.size() * estimatedMemoryPerEntry;

    return {
      size: this.cache.size(),
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      memoryUsage,
    };
  }

  // Cleanup e destruir
  destroy(): void {
    this.cache.clear();
    if (this.dimensionsSubscription) {
      this.dimensionsSubscription.remove();
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

const StyleSheetCache = new StyleSheetCacheImpl();

// =============================================================================
// HELPER FUNCTIONS PARA FITNESS APP
// =============================================================================

// Função helper para estilos fitness responsivos
export const createFitnessStyles = <T extends NamedStyles<T>>(
  styleFactory: (metrics: any) => T,
  cacheKey?: string
): T => {
  return StyleSheetCache.create(styleFactory, cacheKey, {
    ttl: 600000, // 10 minutos para estilos fitness
    enableInvalidation: true,
  });
};

// Função helper para estilos de timer (performance crítica)
export const createTimerStyles = <T extends NamedStyles<T>>(
  styleFactory: (metrics: any) => T,
  cacheKey?: string
): T => {
  return StyleSheetCache.create(styleFactory, cacheKey, {
    ttl: 60000, // 1 minuto - refresh rápido para timer
    enableInvalidation: true,
    enableCompression: true,
  });
};

// Função helper para estilos de exercício
export const createExerciseStyles = <T extends NamedStyles<T>>(
  styleFactory: (metrics: any) => T,
  cacheKey?: string
): T => {
  return StyleSheetCache.create(styleFactory, cacheKey, {
    ttl: 300000, // 5 minutos
    enableInvalidation: true,
  });
};

// Função helper para estilos de charts (baixa prioridade)
export const createChartStyles = <T extends NamedStyles<T>>(
  styleFactory: (metrics: any) => T,
  cacheKey?: string
): T => {
  return StyleSheetCache.create(styleFactory, cacheKey, {
    ttl: 1800000, // 30 minutos - charts mudam pouco
    enableInvalidation: false, // Charts são menos sensíveis a mudanças
  });
};

// =============================================================================
// ESTILOS PRÉ-DEFINIDOS FITNESS
// =============================================================================

// Base styles para fitness app
export const fitnessBaseStyles = createFitnessStyles((metrics) => ({
  container: {
    flex: 1,
    paddingHorizontal: metrics.scaleWidth(16),
    paddingVertical: metrics.scaleHeight(12),
  },
  
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: metrics.scaleModerate(12),
    padding: metrics.scaleModerate(16),
    marginVertical: metrics.scaleHeight(8),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: metrics.scaleModerate(16),
    padding: metrics.scaleModerate(20),
    marginVertical: metrics.scaleHeight(10),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  
  buttonPrimary: {
    backgroundColor: '#007AFF',
    borderRadius: metrics.scaleModerate(12),
    paddingVertical: metrics.scaleHeight(16),
    paddingHorizontal: metrics.scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: metrics.deviceInfo.isTablet ? 56 : 48,
  },
  
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: metrics.scaleModerate(12),
    paddingVertical: metrics.scaleHeight(14),
    paddingHorizontal: metrics.scaleWidth(24),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: metrics.deviceInfo.isTablet ? 52 : 44,
  },
  
  textTitle: {
    fontSize: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 24 : 20),
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: metrics.scaleHeight(8),
  },
  
  textBody: {
    fontSize: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 18 : 16),
    fontWeight: '400',
    color: '#3A3A3C',
    lineHeight: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 26 : 24),
  },
  
  textCaption: {
    fontSize: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 16 : 14),
    fontWeight: '500',
    color: '#8E8E93',
  },
}), 'fitness_base');

// Timer styles (performance crítica)
export const timerStyles = createTimerStyles((metrics) => ({
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: metrics.scaleHeight(32),
  },
  
  timerDisplay: {
    fontSize: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 72 : 56),
    fontWeight: '200',
    color: '#007AFF',
    fontVariant: ['tabular-nums'],
    marginBottom: metrics.scaleHeight(24),
  },
  
  timerButton: {
    width: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 80 : 72),
    height: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 80 : 72),
    borderRadius: metrics.scaleModerate(metrics.deviceInfo.isTablet ? 40 : 36),
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    margin: metrics.scaleModerate(12),
    elevation: 4,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  
  timerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: metrics.scaleWidth(16),
  },
}), 'timer');

// =============================================================================
// UTILITIES EXPORTADAS
// =============================================================================

export const styleSheetCacheUtils = {
  // Invalidar cache
  invalidate: (pattern: string) => StyleSheetCache.invalidate(pattern),
  invalidateAll: () => StyleSheetCache.invalidateAll(),
  invalidateExpired: () => StyleSheetCache.invalidateExpired(),
  
  // Estatísticas
  getStats: () => StyleSheetCache.getStats(),
  
  // Cleanup
  performMaintenance: () => {
    StyleSheetCache.invalidateExpired();
    StyleSheetCache.invalidateDimensionsMismatch();
  },
  
  // Destruir cache
  destroy: () => StyleSheetCache.destroy(),
};

// =============================================================================
// DEBUG UTILITIES
// =============================================================================

export const debugStyleSheetCache = () => {
  if (__DEV__) {
    const stats = StyleSheetCache.getStats();
    console.log('🎨 StyleSheet Cache Debug');
    console.log('========================');
    console.log(`Cache Size: ${stats.size} entries`);
    console.log(`Hit Rate: ${(stats.hitRate * 100).toFixed(1)}%`);
    console.log(`Memory Usage: ${(stats.memoryUsage / 1024).toFixed(1)}KB`);
    console.log(`Hits: ${stats.hitCount} | Misses: ${stats.missCount}`);
  }
};

// Export principal
export { StyleSheetCache };

export default {
  create: StyleSheetCache.create.bind(StyleSheetCache),
  createFitnessStyles,
  createTimerStyles,
  createExerciseStyles,
  createChartStyles,
  fitnessBaseStyles,
  timerStyles,
  utils: styleSheetCacheUtils,
  debug: debugStyleSheetCache,
};
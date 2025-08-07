/**
 * TreinosApp - Sistema Avançado Core de Responsividade
 * FASE 2: Sistema Core com Cache Otimizado e Performance Crítica
 * Otimizado para ambiente fitness/academia com touch targets expandidos
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';

// =============================================================================
// TIPOS E INTERFACES
// =============================================================================

export interface DeviceInfo {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  isTablet: boolean;
  isLandscape: boolean;
  hasNotch: boolean;
  densityBucket: 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
  platform: 'ios' | 'android';
}

export interface ResponsiveMetrics {
  baseWidth: number;
  baseHeight: number;
  scaleWidth: number;
  scaleHeight: number;
  scaleModerate: number;
  isSmallDevice: boolean;
  isLargeDevice: boolean;
  breakpoint: keyof typeof FITNESS_BREAKPOINTS;
}

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  key: string;
}

// =============================================================================
// BREAKPOINTS FITNESS ESPECÍFICOS
// =============================================================================

export const FITNESS_BREAKPOINTS = {
  phone_small: { minWidth: 0, maxWidth: 360 },      // Phones pequenos
  phone_regular: { minWidth: 361, maxWidth: 414 },   // Phones regulares
  phone_large: { minWidth: 415, maxWidth: 480 },     // Phones grandes
  tablet_small: { minWidth: 481, maxWidth: 768 },    // Tablets pequenos
  tablet_large: { minWidth: 769, maxWidth: 1024 },   // Tablets grandes
  desktop: { minWidth: 1025, maxWidth: Infinity },   // Desktop/TV
} as const;

// =============================================================================
// FITNESS TOUCH TARGETS - AMBIENTE ACADEMIA
// =============================================================================

export const FITNESS_TOUCH_TARGETS = {
  // Targets primários - ambiente academia (luvas, suor)
  TIMER_PRIMARY: 72,        // Timer controls - máxima precisão
  EXERCISE_CARD: 80,        // Cards de exercício principais
  WEIGHT_INPUT: 68,         // Input de peso/repetições
  SET_COMPLETE: 64,         // Botão completar série
  
  // Targets secundários
  NAVIGATION_TAB: 56,       // Tabs de navegação
  LIST_ITEM: 52,            // Itens de lista
  BUTTON_SECONDARY: 48,     // Botões secundários
  
  // Targets mínimos
  ICON_SMALL: 44,           // Ícones pequenos
  TEXT_LINK: 44,            // Links de texto
} as const;

// =============================================================================
// CACHE SYSTEM - PERFORMANCE CRÍTICA
// =============================================================================

class ResponsiveCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize = 50; // LRU limit
  private defaultTTL = 30000; // 30 segundos
  private hitCount = 0;
  private missCount = 0;

  set(key: string, value: T, ttl?: number): void {
    // LRU eviction se cache cheio
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      key,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Verificar TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    this.hitCount++;
    
    // LRU - mover para o fim
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.value;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.clear();
      return;
    }

    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats() {
    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }
}

// Cache global singleton
const responsiveCache = new ResponsiveCache();

// =============================================================================
// DEVICE DETECTION SYSTEM
// =============================================================================

const detectDeviceInfo = (): DeviceInfo => {
  const cacheKey = 'deviceInfo';
  const cached = responsiveCache.get(cacheKey);
  if (cached) return cached;

  const { width, height } = Dimensions.get('window');
  const scale = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();
  
  // Detecção de tablet baseada em densidade de pixels e tamanho
  const shortDimension = Math.min(width, height);
  const longDimension = Math.max(width, height);
  const isTablet = (shortDimension / scale) >= 600 || longDimension >= 900;
  
  // Detecção de notch (aproximada)
  const hasNotch = Platform.OS === 'ios' && 
    (height === 812 || height === 896 || height === 844 || height === 926);
  
  // Bucket de densidade
  let densityBucket: DeviceInfo['densityBucket'] = 'mdpi';
  if (scale <= 1) densityBucket = 'ldpi';
  else if (scale <= 1.5) densityBucket = 'mdpi';
  else if (scale <= 2) densityBucket = 'hdpi';
  else if (scale <= 3) densityBucket = 'xhdpi';
  else if (scale <= 4) densityBucket = 'xxhdpi';
  else densityBucket = 'xxxhdpi';

  const deviceInfo: DeviceInfo = {
    width,
    height,
    scale,
    fontScale,
    isTablet,
    isLandscape: width > height,
    hasNotch,
    densityBucket,
    platform: Platform.OS as 'ios' | 'android',
  };

  // Cache com TTL longo já que info do device raramente muda
  responsiveCache.set(cacheKey, deviceInfo, 300000); // 5 minutos
  
  return deviceInfo;
};

// =============================================================================
// SCALING FUNCTIONS - PERFORMANCE OTIMIZADA
// =============================================================================

// Base dimensions para scaling (design base)
const BASE_WIDTH = 375;  // iPhone 11/12/13 width
const BASE_HEIGHT = 812; // iPhone 11/12/13 height

const calculateScales = (deviceInfo: DeviceInfo) => {
  const cacheKey = `scales_${deviceInfo.width}_${deviceInfo.height}`;
  const cached = responsiveCache.get(cacheKey);
  if (cached) return cached;

  const scaleWidth = deviceInfo.width / BASE_WIDTH;
  const scaleHeight = deviceInfo.height / BASE_HEIGHT;
  const scaleModerate = (scaleWidth + scaleHeight) / 2;

  const scales = { scaleWidth, scaleHeight, scaleModerate };
  responsiveCache.set(cacheKey, scales, 60000); // 1 minuto TTL
  
  return scales;
};

export const scaleWidth = (size: number): number => {
  const deviceInfo = detectDeviceInfo();
  const { scaleWidth } = calculateScales(deviceInfo);
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleWidth));
};

export const scaleHeight = (size: number): number => {
  const deviceInfo = detectDeviceInfo();
  const { scaleHeight } = calculateScales(deviceInfo);
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleHeight));
};

export const scaleModerate = (size: number): number => {
  const deviceInfo = detectDeviceInfo();
  const { scaleModerate } = calculateScales(deviceInfo);
  return Math.round(PixelRatio.roundToNearestPixel(size * scaleModerate));
};

// =============================================================================
// RESPONSIVE METRICS CALCULATOR
// =============================================================================

export const getResponsiveMetrics = (): ResponsiveMetrics => {
  const cacheKey = 'responsiveMetrics';
  const cached = responsiveCache.get(cacheKey);
  if (cached) return cached;

  const deviceInfo = detectDeviceInfo();
  const scales = calculateScales(deviceInfo);
  
  // Determinar breakpoint atual
  let currentBreakpoint: keyof typeof FITNESS_BREAKPOINTS = 'phone_regular';
  for (const [name, range] of Object.entries(FITNESS_BREAKPOINTS)) {
    if (deviceInfo.width >= range.minWidth && deviceInfo.width <= range.maxWidth) {
      currentBreakpoint = name as keyof typeof FITNESS_BREAKPOINTS;
      break;
    }
  }

  const metrics: ResponsiveMetrics = {
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    scaleWidth: scales.scaleWidth,
    scaleHeight: scales.scaleHeight,
    scaleModerate: scales.scaleModerate,
    isSmallDevice: deviceInfo.width < 375,
    isLargeDevice: deviceInfo.width >= 414,
    breakpoint: currentBreakpoint,
  };

  responsiveCache.set(cacheKey, metrics, 60000);
  return metrics;
};

// =============================================================================
// OPTIMIZED HOOKS
// =============================================================================

export const useOptimizedResponsive = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      // Debounce dimension changes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        setDimensions(window);
        // Invalidar cache quando dimensões mudam
        responsiveCache.invalidate();
      }, 100);
    });

    return () => {
      subscription?.remove();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Memoizar valores para evitar recálculos
  const metrics = useMemo(() => getResponsiveMetrics(), [dimensions]);
  const deviceInfo = useMemo(() => detectDeviceInfo(), [dimensions]);
  
  const scaleFunctions = useMemo(() => ({
    scaleWidth,
    scaleHeight,
    scaleModerate,
  }), [dimensions]);

  return {
    ...metrics,
    deviceInfo,
    ...scaleFunctions,
    dimensions,
  };
};

// Hook otimizado para timer - 60 FPS crítico
export const useOptimizedTimer = () => {
  const lastCalcRef = useRef<number>(0);
  const cachedValuesRef = useRef<any>(null);
  
  const getTimerMetrics = useCallback(() => {
    const now = Date.now();
    
    // Cache válido por 16ms (60 FPS)
    if (cachedValuesRef.current && now - lastCalcRef.current < 16) {
      return cachedValuesRef.current;
    }
    
    const deviceInfo = detectDeviceInfo();
    const buttonSize = deviceInfo.isTablet 
      ? FITNESS_TOUCH_TARGETS.TIMER_PRIMARY + 8
      : FITNESS_TOUCH_TARGETS.TIMER_PRIMARY;
    
    const metrics = {
      timerButtonSize: scaleModerate(buttonSize),
      timerTextSize: scaleModerate(deviceInfo.isTablet ? 32 : 28),
      timerSpacing: scaleModerate(deviceInfo.isTablet ? 24 : 20),
      hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    };
    
    cachedValuesRef.current = metrics;
    lastCalcRef.current = now;
    
    return metrics;
  }, []);

  return getTimerMetrics;
};

// =============================================================================
// FITNESS TOUCH TARGET HELPERS
// =============================================================================

export const getFitnessTarget = (
  type: keyof typeof FITNESS_TOUCH_TARGETS,
  isTablet?: boolean
): number => {
  const base = FITNESS_TOUCH_TARGETS[type];
  const scaled = scaleModerate(base);
  
  // Adicionar padding extra para tablets
  return isTablet ? scaled + 8 : scaled;
};

export const getFitnessHitSlop = (
  type: keyof typeof FITNESS_TOUCH_TARGETS,
  customPadding?: number
): { top: number; bottom: number; left: number; right: number } => {
  const padding = customPadding || 8;
  return { top: padding, bottom: padding, left: padding, right: padding };
};

// =============================================================================
// CACHE UTILITIES
// =============================================================================

export const clearResponsiveCache = (): void => {
  responsiveCache.clear();
};

export const getResponsiveCacheStats = () => {
  return responsiveCache.getStats();
};

export const invalidateResponsiveCache = (pattern?: string): void => {
  responsiveCache.invalidate(pattern);
};

// =============================================================================
// DEBUG UTILITIES (Development Only)
// =============================================================================

export const debugResponsiveSystem = () => {
  if (__DEV__) {
    const deviceInfo = detectDeviceInfo();
    const metrics = getResponsiveMetrics();
    const cacheStats = getResponsiveCacheStats();
    
    console.log('🏋️ TreinosApp Responsive System Debug');
    console.log('=====================================');
    console.log('Device Info:', deviceInfo);
    console.log('Responsive Metrics:', metrics);
    console.log('Cache Stats:', cacheStats);
    console.log('Touch Targets:', FITNESS_TOUCH_TARGETS);
  }
};

export default {
  // Core functions
  scaleWidth,
  scaleHeight,
  scaleModerate,
  getResponsiveMetrics,
  detectDeviceInfo,
  
  // Hooks
  useOptimizedResponsive,
  useOptimizedTimer,
  
  // Fitness specific
  getFitnessTarget,
  getFitnessHitSlop,
  FITNESS_TOUCH_TARGETS,
  FITNESS_BREAKPOINTS,
  
  // Cache utilities
  clearResponsiveCache,
  getResponsiveCacheStats,
  invalidateResponsiveCache,
  
  // Debug
  debugResponsiveSystem,
};
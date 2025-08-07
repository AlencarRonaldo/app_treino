/**
 * TreinosApp - Sistema Avançado de Detecção de Device
 * FASE 2: DeviceInfo integrado com detecção avançada e cache inteligente
 * Otimizado para fitness app com detecções específicas de hardware
 */

import { 
  Dimensions, 
  Platform, 
  PixelRatio, 
  StatusBar,
} from 'react-native';
import { detectDeviceInfo, getResponsiveMetrics } from './responsiveCore';

// =============================================================================
// TIPOS E INTERFACES AVANÇADAS
// =============================================================================

export interface ExtendedDeviceInfo {
  // Info básica (já no responsiveCore)
  width: number;
  height: number;
  scale: number;
  fontScale: number;
  isTablet: boolean;
  isLandscape: boolean;
  hasNotch: boolean;
  densityBucket: 'ldpi' | 'mdpi' | 'hdpi' | 'xhdpi' | 'xxhdpi' | 'xxxhdpi';
  platform: 'ios' | 'android';
  
  // Info avançada
  deviceModel: string;
  osVersion: string;
  screenInches: number;
  pixelsPerInch: number;
  aspectRatio: string;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  
  // Categorias de performance
  performanceClass: 'low' | 'mid' | 'high' | 'flagship';
  memoryClass: 'low' | 'medium' | 'high';
  
  // Fitness específico
  fitnessOptimizations: {
    preferLargerTargets: boolean;
    needsHighContrast: boolean;
    supportsHaptics: boolean;
    batteryEfficiencyMode: boolean;
  };
  
  // Capacidades específicas
  capabilities: {
    supportsBlur: boolean;
    supportsAdvancedAnimations: boolean;
    supportsParallax: boolean;
    supportsComplexGestures: boolean;
    maxConcurrentAnimations: number;
  };
}

export interface DeviceCapabilitiesProfile {
  name: string;
  minWidth: number;
  maxWidth: number;
  expectedScale: number[];
  performanceScore: number;
  fitnessRecommendations: {
    timerAccuracy: 'basic' | 'precise' | 'high-precision';
    chartComplexity: 'simple' | 'moderate' | 'advanced';
    animationLevel: 'minimal' | 'standard' | 'rich';
    cacheStrategy: 'aggressive' | 'balanced' | 'conservative';
  };
}

// =============================================================================
// DEVICE CAPABILITY PROFILES
// =============================================================================

const DEVICE_PROFILES: Record<string, DeviceCapabilitiesProfile> = {
  'phone_budget': {
    name: 'Budget Phone',
    minWidth: 320,
    maxWidth: 360,
    expectedScale: [1, 1.5, 2],
    performanceScore: 25,
    fitnessRecommendations: {
      timerAccuracy: 'basic',
      chartComplexity: 'simple',
      animationLevel: 'minimal',
      cacheStrategy: 'conservative',
    }
  },
  
  'phone_mid': {
    name: 'Mid-range Phone',
    minWidth: 361,
    maxWidth: 414,
    expectedScale: [2, 2.5, 3],
    performanceScore: 60,
    fitnessRecommendations: {
      timerAccuracy: 'precise',
      chartComplexity: 'moderate',
      animationLevel: 'standard',
      cacheStrategy: 'balanced',
    }
  },
  
  'phone_premium': {
    name: 'Premium Phone',
    minWidth: 415,
    maxWidth: 480,
    expectedScale: [3, 4],
    performanceScore: 90,
    fitnessRecommendations: {
      timerAccuracy: 'high-precision',
      chartComplexity: 'advanced',
      animationLevel: 'rich',
      cacheStrategy: 'aggressive',
    }
  },
  
  'tablet_standard': {
    name: 'Standard Tablet',
    minWidth: 768,
    maxWidth: 1024,
    expectedScale: [1, 1.5, 2],
    performanceScore: 75,
    fitnessRecommendations: {
      timerAccuracy: 'high-precision',
      chartComplexity: 'advanced',
      animationLevel: 'rich',
      cacheStrategy: 'aggressive',
    }
  },
  
  'tablet_pro': {
    name: 'Pro Tablet',
    minWidth: 1025,
    maxWidth: 1400,
    expectedScale: [2, 2.5, 3],
    performanceScore: 100,
    fitnessRecommendations: {
      timerAccuracy: 'high-precision',
      chartComplexity: 'advanced',
      animationLevel: 'rich',
      cacheStrategy: 'aggressive',
    }
  },
};

// =============================================================================
// NOTCH DETECTION AVANÇADA
// =============================================================================

const KNOWN_NOTCH_DEVICES = {
  ios: [
    // iPhone X series
    { width: 375, height: 812, model: 'iPhone X/XS/11 Pro' },
    { width: 414, height: 896, model: 'iPhone XR/11/XS Max/11 Pro Max' },
    { width: 390, height: 844, model: 'iPhone 12/12 Pro' },
    { width: 428, height: 926, model: 'iPhone 12 Pro Max' },
    { width: 375, height: 812, model: 'iPhone 12 Mini' },
    { width: 393, height: 852, model: 'iPhone 14 Pro' },
    { width: 430, height: 932, model: 'iPhone 14 Pro Max' },
  ],
  android: [
    // Common Android notch patterns
    { width: 360, height: 760, model: 'Android with notch (small)' },
    { width: 393, height: 851, model: 'Android with notch (medium)' },
    { width: 412, height: 869, model: 'Android with notch (large)' },
  ]
};

const detectNotchInfo = (width: number, height: number, platform: string) => {
  const devices = KNOWN_NOTCH_DEVICES[platform as keyof typeof KNOWN_NOTCH_DEVICES] || [];
  
  const matchingDevice = devices.find(device => 
    Math.abs(device.width - width) <= 5 && 
    Math.abs(device.height - height) <= 20
  );
  
  if (matchingDevice) {
    return {
      hasNotch: true,
      notchType: 'camera' as const,
      model: matchingDevice.model,
      safeAreaTop: platform === 'ios' ? 44 : 24,
      safeAreaBottom: platform === 'ios' ? 34 : 0,
    };
  }
  
  // Heurística para detectar notch em devices desconhecidos
  const aspectRatio = height / width;
  const hasLikelyNotch = aspectRatio > 2.1 && (StatusBar.currentHeight || 0) > 24;
  
  return {
    hasNotch: hasLikelyNotch,
    notchType: hasLikelyNotch ? 'unknown' as const : null,
    model: 'Unknown device',
    safeAreaTop: hasLikelyNotch ? (platform === 'ios' ? 44 : 24) : 20,
    safeAreaBottom: hasLikelyNotch ? (platform === 'ios' ? 34 : 0) : 0,
  };
};

// =============================================================================
// PERFORMANCE CLASSIFICATION
// =============================================================================

const classifyPerformance = (
  width: number, 
  height: number, 
  scale: number, 
  platform: string
): { performanceClass: ExtendedDeviceInfo['performanceClass'], memoryClass: ExtendedDeviceInfo['memoryClass'] } => {
  
  // Score baseado em resolução, densidade e plataforma
  const pixelCount = width * height * scale * scale;
  const densityScore = scale >= 3 ? 30 : scale >= 2 ? 20 : 10;
  const platformScore = platform === 'ios' ? 15 : 10; // iOS tende a ter melhor performance
  const resolutionScore = Math.min(40, Math.floor(pixelCount / 100000));
  
  const totalScore = densityScore + platformScore + resolutionScore;
  
  // Classificação de performance
  let performanceClass: ExtendedDeviceInfo['performanceClass'];
  if (totalScore >= 80) performanceClass = 'flagship';
  else if (totalScore >= 60) performanceClass = 'high';
  else if (totalScore >= 40) performanceClass = 'mid';
  else performanceClass = 'low';
  
  // Classificação de memória (aproximada baseada na performance)
  let memoryClass: ExtendedDeviceInfo['memoryClass'];
  if (performanceClass === 'flagship') memoryClass = 'high';
  else if (performanceClass === 'high' || performanceClass === 'mid') memoryClass = 'medium';
  else memoryClass = 'low';
  
  return { performanceClass, memoryClass };
};

// =============================================================================
// CAPABILITIES DETECTION
// =============================================================================

const detectCapabilities = (
  performanceClass: ExtendedDeviceInfo['performanceClass'],
  platform: string,
  osVersion: string
): ExtendedDeviceInfo['capabilities'] => {
  
  const isHighEnd = performanceClass === 'flagship' || performanceClass === 'high';
  const isiOS = platform === 'ios';
  
  return {
    supportsBlur: isHighEnd && (isiOS || parseInt(osVersion) >= 28), // Android API 28+
    supportsAdvancedAnimations: isHighEnd,
    supportsParallax: isHighEnd && performanceClass === 'flagship',
    supportsComplexGestures: isHighEnd || isiOS,
    maxConcurrentAnimations: performanceClass === 'flagship' ? 8 : 
                             performanceClass === 'high' ? 5 :
                             performanceClass === 'mid' ? 3 : 2,
  };
};

// =============================================================================
// FITNESS OPTIMIZATIONS
// =============================================================================

const generateFitnessOptimizations = (
  deviceInfo: any,
  performanceClass: ExtendedDeviceInfo['performanceClass']
): ExtendedDeviceInfo['fitnessOptimizations'] => {
  
  const isSmallScreen = deviceInfo.width < 375;
  const isLowPerformance = performanceClass === 'low' || performanceClass === 'mid';
  
  return {
    preferLargerTargets: isSmallScreen || deviceInfo.scale < 2,
    needsHighContrast: isSmallScreen || deviceInfo.densityBucket === 'ldpi',
    supportsHaptics: deviceInfo.platform === 'ios' || performanceClass !== 'low',
    batteryEfficiencyMode: isLowPerformance || deviceInfo.isTablet,
  };
};

// =============================================================================
// MAIN DETECTION FUNCTION
// =============================================================================

export const getExtendedDeviceInfo = (): ExtendedDeviceInfo => {
  // Começar com info básica do responsiveCore
  const basicInfo = detectDeviceInfo();
  const metrics = getResponsiveMetrics();
  
  // Informações adicionais
  const { width, height, scale, platform } = basicInfo;
  
  // Detecção de notch e safe areas
  const notchInfo = detectNotchInfo(width, height, platform);
  
  // Classificação de performance
  const { performanceClass, memoryClass } = classifyPerformance(width, height, scale, platform);
  
  // Calcular informações físicas
  const screenDiagonal = Math.sqrt((width * width) + (height * height)) / scale;
  const screenInches = screenDiagonal / 160; // Aproximação baseada em DPI
  const pixelsPerInch = Math.sqrt((width * width) + (height * height)) / screenInches;
  const aspectRatio = `${Math.round((height / width) * 100) / 100}:1`;
  
  // OS Version (aproximação)
  const osVersion = Platform.OS === 'ios' ? Platform.Version.toString() : 
                   Platform.Version.toString();
  
  // Device model (aproximação baseada em dimensões)
  let deviceModel = 'Unknown Device';
  const profile = Object.values(DEVICE_PROFILES).find(p => 
    width >= p.minWidth && width <= p.maxWidth
  );
  if (profile) deviceModel = profile.name;
  
  // Safe area insets
  const safeAreaInsets = {
    top: notchInfo.safeAreaTop,
    bottom: notchInfo.safeAreaBottom,
    left: basicInfo.isLandscape && notchInfo.hasNotch ? 44 : 0,
    right: basicInfo.isLandscape && notchInfo.hasNotch ? 44 : 0,
  };
  
  // Capabilities
  const capabilities = detectCapabilities(performanceClass, platform, osVersion);
  
  // Fitness optimizations
  const fitnessOptimizations = generateFitnessOptimizations(basicInfo, performanceClass);
  
  // Compilar info completa
  const extendedInfo: ExtendedDeviceInfo = {
    // Info básica
    ...basicInfo,
    
    // Info avançada
    deviceModel,
    osVersion,
    screenInches: Math.round(screenInches * 10) / 10,
    pixelsPerInch: Math.round(pixelsPerInch),
    aspectRatio,
    safeAreaInsets,
    
    // Performance
    performanceClass,
    memoryClass,
    
    // Fitness específico
    fitnessOptimizations,
    
    // Capabilities
    capabilities,
  };
  
  return extendedInfo;
};

// =============================================================================
// DEVICE CAPABILITY HELPERS
// =============================================================================

export const getDeviceProfile = (deviceInfo?: ExtendedDeviceInfo): DeviceCapabilitiesProfile => {
  const info = deviceInfo || getExtendedDeviceInfo();
  
  const profile = Object.values(DEVICE_PROFILES).find(p => 
    info.width >= p.minWidth && info.width <= p.maxWidth
  );
  
  return profile || DEVICE_PROFILES.phone_mid; // fallback
};

export const shouldUseHighPerformanceMode = (deviceInfo?: ExtendedDeviceInfo): boolean => {
  const info = deviceInfo || getExtendedDeviceInfo();
  return info.performanceClass === 'flagship' || info.performanceClass === 'high';
};

export const getOptimalCacheStrategy = (deviceInfo?: ExtendedDeviceInfo): 'aggressive' | 'balanced' | 'conservative' => {
  const profile = getDeviceProfile(deviceInfo);
  return profile.fitnessRecommendations.cacheStrategy;
};

export const getOptimalTimerAccuracy = (deviceInfo?: ExtendedDeviceInfo): 'basic' | 'precise' | 'high-precision' => {
  const profile = getDeviceProfile(deviceInfo);
  return profile.fitnessRecommendations.timerAccuracy;
};

export const getMaxConcurrentAnimations = (deviceInfo?: ExtendedDeviceInfo): number => {
  const info = deviceInfo || getExtendedDeviceInfo();
  return info.capabilities.maxConcurrentAnimations;
};

// =============================================================================
// RESPONSIVE BREAKPOINT HELPERS
// =============================================================================

export const isSmallDevice = (deviceInfo?: ExtendedDeviceInfo): boolean => {
  const info = deviceInfo || getExtendedDeviceInfo();
  return info.width < 375 || info.screenInches < 4.5;
};

export const isLargeDevice = (deviceInfo?: ExtendedDeviceInfo): boolean => {
  const info = deviceInfo || getExtendedDeviceInfo();
  return info.width >= 414 || info.isTablet;
};

export const isPremiumDevice = (deviceInfo?: ExtendedDeviceInfo): boolean => {
  const info = deviceInfo || getExtendedDeviceInfo();
  return info.performanceClass === 'flagship' || info.performanceClass === 'high';
};

// =============================================================================
// DEBUG UTILITIES
// =============================================================================

export const debugDeviceDetection = (): void => {
  if (__DEV__) {
    const info = getExtendedDeviceInfo();
    const profile = getDeviceProfile(info);
    
    console.log('📱 Extended Device Detection Debug');
    console.log('==================================');
    console.log('Basic Info:');
    console.log(`  Device: ${info.deviceModel} (${info.platform} ${info.osVersion})`);
    console.log(`  Screen: ${info.width}x${info.height}@${info.scale}x (${info.screenInches}" / ${info.aspectRatio})`);
    console.log(`  Density: ${info.densityBucket} (${info.pixelsPerInch} PPI)`);
    console.log('');
    console.log('Classification:');
    console.log(`  Performance: ${info.performanceClass} | Memory: ${info.memoryClass}`);
    console.log(`  Profile: ${profile.name} (Score: ${profile.performanceScore})`);
    console.log('');
    console.log('Capabilities:');
    console.log(`  Blur: ${info.capabilities.supportsBlur}`);
    console.log(`  Advanced Animations: ${info.capabilities.supportsAdvancedAnimations}`);
    console.log(`  Max Concurrent Animations: ${info.capabilities.maxConcurrentAnimations}`);
    console.log('');
    console.log('Fitness Optimizations:');
    console.log(`  Larger Targets: ${info.fitnessOptimizations.preferLargerTargets}`);
    console.log(`  High Contrast: ${info.fitnessOptimizations.needsHighContrast}`);
    console.log(`  Timer Accuracy: ${profile.fitnessRecommendations.timerAccuracy}`);
    console.log(`  Cache Strategy: ${profile.fitnessRecommendations.cacheStrategy}`);
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getExtendedDeviceInfo,
  getDeviceProfile,
  shouldUseHighPerformanceMode,
  getOptimalCacheStrategy,
  getOptimalTimerAccuracy,
  getMaxConcurrentAnimations,
  isSmallDevice,
  isLargeDevice,
  isPremiumDevice,
  debugDeviceDetection,
  DEVICE_PROFILES,
};
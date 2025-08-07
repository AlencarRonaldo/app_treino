/**
 * TreinosApp - FITNESS TOUCH TARGETS System
 * FASE 2: Sistema especializado de touch targets para ambiente academia
 * Otimizado para uso com luvas, suor e diferentes condições de academia
 */

import { Platform } from 'react-native';
import { 
  FITNESS_TOUCH_TARGETS, 
  getFitnessTarget, 
  getFitnessHitSlop, 
  detectDeviceInfo,
  scaleModerate 
} from './responsiveCore';

// =============================================================================
// TIPOS E INTERFACES FITNESS
// =============================================================================

export interface FitnessTargetConfig {
  base: number;
  tablet: number;
  hitSlop: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  contextualBonus: number;
  accessibilitySize: number;
}

export interface GymEnvironmentConfig {
  hasGloves: boolean;
  isWet: boolean; // suor, água
  lightingCondition: 'bright' | 'normal' | 'dim';
  noiseLevel: 'quiet' | 'normal' | 'loud';
  crowdLevel: 'empty' | 'moderate' | 'crowded';
}

export interface TouchTargetResult {
  width: number;
  height: number;
  hitSlop: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  minTouchArea: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

// =============================================================================
// FITNESS TOUCH TARGET CONFIGURATIONS
// =============================================================================

const FITNESS_TARGET_CONFIGS: Record<keyof typeof FITNESS_TOUCH_TARGETS, FitnessTargetConfig> = {
  TIMER_PRIMARY: {
    base: 72,
    tablet: 80,
    hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
    contextualBonus: 8, // Ambiente academia
    accessibilitySize: 88, // WCAG AAA
  },
  
  EXERCISE_CARD: {
    base: 80,
    tablet: 88,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    contextualBonus: 6,
    accessibilitySize: 92,
  },
  
  WEIGHT_INPUT: {
    base: 68,
    tablet: 76,
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
    contextualBonus: 8, // Crítico para entrada de dados
    accessibilitySize: 84,
  },
  
  SET_COMPLETE: {
    base: 64,
    tablet: 72,
    hitSlop: { top: 10, bottom: 10, left: 10, right: 10 },
    contextualBonus: 6,
    accessibilitySize: 80,
  },
  
  NAVIGATION_TAB: {
    base: 56,
    tablet: 64,
    hitSlop: { top: 6, bottom: 6, left: 6, right: 6 },
    contextualBonus: 4,
    accessibilitySize: 72,
  },
  
  LIST_ITEM: {
    base: 52,
    tablet: 60,
    hitSlop: { top: 6, bottom: 6, left: 8, right: 8 },
    contextualBonus: 4,
    accessibilitySize: 68,
  },
  
  BUTTON_SECONDARY: {
    base: 48,
    tablet: 56,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    contextualBonus: 4,
    accessibilitySize: 64,
  },
  
  ICON_SMALL: {
    base: 44,
    tablet: 52,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    contextualBonus: 2,
    accessibilitySize: 60,
  },
  
  TEXT_LINK: {
    base: 44,
    tablet: 52,
    hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
    contextualBonus: 2,
    accessibilitySize: 60,
  },
};

// =============================================================================
// GYM ENVIRONMENT ADAPTATIONS
// =============================================================================

const calculateEnvironmentalBonus = (
  config: GymEnvironmentConfig,
  baseSize: number
): number => {
  let bonus = 0;
  
  // Luvas adicionam dificuldade de precisão
  if (config.hasGloves) bonus += 6;
  
  // Condições úmidas (suor/água) reduzem precisão
  if (config.isWet) bonus += 4;
  
  // Iluminação baixa dificulta visualização
  if (config.lightingCondition === 'dim') bonus += 4;
  else if (config.lightingCondition === 'bright') bonus += 2; // Glare
  
  // Ruído alto aumenta stress e reduz precisão
  if (config.noiseLevel === 'loud') bonus += 3;
  
  // Academia lotada aumenta pressão/pressa
  if (config.crowdLevel === 'crowded') bonus += 4;
  
  // Limitar bonus a 30% do tamanho base
  return Math.min(bonus, Math.floor(baseSize * 0.3));
};

// =============================================================================
// MAIN FITNESS TARGET CALCULATOR
// =============================================================================

export const calculateFitnessTarget = (
  targetType: keyof typeof FITNESS_TOUCH_TARGETS,
  options?: {
    gymEnvironment?: Partial<GymEnvironmentConfig>;
    forceAccessibility?: boolean;
    customScaling?: number;
    platform?: 'ios' | 'android';
  }
): TouchTargetResult => {
  const config = FITNESS_TARGET_CONFIGS[targetType];
  const deviceInfo = detectDeviceInfo();
  const isTablet = deviceInfo.isTablet;
  
  // Base size
  let baseSize = isTablet ? config.tablet : config.base;
  
  // Apply custom scaling se fornecido
  if (options?.customScaling) {
    baseSize *= options.customScaling;
  }
  
  // Apply responsive scaling
  const scaledSize = scaleModerate(baseSize);
  
  // Contextual bonus para ambiente fitness
  let finalSize = scaledSize + config.contextualBonus;
  
  // Environmental adaptations
  if (options?.gymEnvironment) {
    const defaultGymConfig: GymEnvironmentConfig = {
      hasGloves: false,
      isWet: false,
      lightingCondition: 'normal',
      noiseLevel: 'normal',
      crowdLevel: 'moderate',
    };
    
    const gymConfig = { ...defaultGymConfig, ...options.gymEnvironment };
    const environmentalBonus = calculateEnvironmentalBonus(gymConfig, baseSize);
    finalSize += environmentalBonus;
  }
  
  // Accessibility override
  if (options?.forceAccessibility) {
    finalSize = Math.max(finalSize, scaleModerate(config.accessibilitySize));
  }
  
  // Platform-specific adjustments
  const platformBonus = (options?.platform || Platform.OS) === 'android' ? 2 : 0;
  finalSize += platformBonus;
  
  // Ensure minimum 44pt (Apple HIG / Material Design)
  finalSize = Math.max(finalSize, scaleModerate(44));
  
  // Calculate hitSlop with environmental adjustments
  const hitSlopBase = config.hitSlop;
  const hitSlopMultiplier = options?.gymEnvironment?.hasGloves ? 1.5 : 1.2;
  
  const hitSlop = {
    top: Math.round(hitSlopBase.top * hitSlopMultiplier),
    bottom: Math.round(hitSlopBase.bottom * hitSlopMultiplier),
    left: Math.round(hitSlopBase.left * hitSlopMultiplier),
    right: Math.round(hitSlopBase.right * hitSlopMultiplier),
  };
  
  return {
    width: Math.round(finalSize),
    height: Math.round(finalSize),
    hitSlop,
    minTouchArea: Math.round(finalSize * finalSize),
    accessibilityLabel: generateAccessibilityLabel(targetType),
    accessibilityHint: generateAccessibilityHint(targetType),
  };
};

// =============================================================================
// SPECIALIZED FITNESS TARGET CALCULATORS
// =============================================================================

// Timer controls - máxima precisão necessária
export const getTimerTarget = (
  state: 'playing' | 'paused' | 'stopped' = 'paused',
  gymEnvironment?: Partial<GymEnvironmentConfig>
): TouchTargetResult => {
  const environmentBonus = state === 'playing' ? { hasGloves: true, isWet: true } : {};
  
  return calculateFitnessTarget('TIMER_PRIMARY', {
    gymEnvironment: { ...gymEnvironment, ...environmentBonus },
    forceAccessibility: state === 'playing', // Timer ativo precisa ser muito acessível
  });
};

// Exercise card interactions
export const getExerciseTarget = (
  exerciseType: 'strength' | 'cardio' | 'flexibility' = 'strength',
  isInWorkout: boolean = false
): TouchTargetResult => {
  const gymEnvironment = isInWorkout 
    ? { isWet: true, crowdLevel: 'moderate' as const }
    : {};
  
  return calculateFitnessTarget('EXERCISE_CARD', {
    gymEnvironment,
    customScaling: exerciseType === 'strength' ? 1.1 : 1.0, // Força precisa mais precisão
  });
};

// Weight/reps input - entrada crítica de dados
export const getWeightInputTarget = (
  isActiveSet: boolean = false
): TouchTargetResult => {
  return calculateFitnessTarget('WEIGHT_INPUT', {
    gymEnvironment: isActiveSet ? { 
      isWet: true, 
      hasGloves: true, 
      crowdLevel: 'moderate' 
    } : {},
    forceAccessibility: true, // Input sempre acessível
  });
};

// Set completion - momento crítico do treino
export const getSetCompleteTarget = (
  isLastSet: boolean = false
): TouchTargetResult => {
  return calculateFitnessTarget('SET_COMPLETE', {
    gymEnvironment: { 
      isWet: true,
      noiseLevel: 'loud', // Academia geralmente barulhenta
    },
    customScaling: isLastSet ? 1.15 : 1.0, // Última série tem destaque
  });
};

// =============================================================================
// ACCESSIBILITY HELPERS
// =============================================================================

const generateAccessibilityLabel = (targetType: keyof typeof FITNESS_TOUCH_TARGETS): string => {
  const labels = {
    TIMER_PRIMARY: 'Controle do cronômetro',
    EXERCISE_CARD: 'Cartão de exercício',
    WEIGHT_INPUT: 'Campo de entrada de peso',
    SET_COMPLETE: 'Botão concluir série',
    NAVIGATION_TAB: 'Aba de navegação',
    LIST_ITEM: 'Item da lista',
    BUTTON_SECONDARY: 'Botão secundário',
    ICON_SMALL: 'Ícone pequeno',
    TEXT_LINK: 'Link de texto',
  };
  
  return labels[targetType];
};

const generateAccessibilityHint = (targetType: keyof typeof FITNESS_TOUCH_TARGETS): string => {
  const hints = {
    TIMER_PRIMARY: 'Toque duas vezes para iniciar ou pausar o cronômetro',
    EXERCISE_CARD: 'Toque duas vezes para ver detalhes do exercício',
    WEIGHT_INPUT: 'Toque duas vezes para editar peso ou repetições',
    SET_COMPLETE: 'Toque duas vezes para marcar série como concluída',
    NAVIGATION_TAB: 'Toque duas vezes para navegar para esta seção',
    LIST_ITEM: 'Toque duas vezes para selecionar este item',
    BUTTON_SECONDARY: 'Toque duas vezes para ação secundária',
    ICON_SMALL: 'Toque duas vezes para ação rápida',
    TEXT_LINK: 'Toque duas vezes para abrir link',
  };
  
  return hints[targetType];
};

// =============================================================================
// BATCH CALCULATORS PARA PERFORMANCE
// =============================================================================

export const calculateMultipleTargets = (
  targets: Array<{
    type: keyof typeof FITNESS_TOUCH_TARGETS;
    options?: Parameters<typeof calculateFitnessTarget>[1];
  }>
): Record<string, TouchTargetResult> => {
  const results: Record<string, TouchTargetResult> = {};
  
  targets.forEach(({ type, options }, index) => {
    results[`${type.toLowerCase()}_${index}`] = calculateFitnessTarget(type, options);
  });
  
  return results;
};

// Preset para tela de treino ativo
export const getActiveWorkoutTargets = (
  gymEnvironment?: Partial<GymEnvironmentConfig>
): Record<string, TouchTargetResult> => {
  const activeEnvironment: GymEnvironmentConfig = {
    hasGloves: true,
    isWet: true,
    lightingCondition: 'normal',
    noiseLevel: 'loud',
    crowdLevel: 'moderate',
    ...gymEnvironment,
  };
  
  return {
    timer: calculateFitnessTarget('TIMER_PRIMARY', { 
      gymEnvironment: activeEnvironment,
      forceAccessibility: true 
    }),
    setComplete: calculateFitnessTarget('SET_COMPLETE', { 
      gymEnvironment: activeEnvironment 
    }),
    weightInput: calculateFitnessTarget('WEIGHT_INPUT', { 
      gymEnvironment: activeEnvironment,
      forceAccessibility: true 
    }),
    exerciseCard: calculateFitnessTarget('EXERCISE_CARD', { 
      gymEnvironment: activeEnvironment 
    }),
  };
};

// =============================================================================
// DEBUG E UTILITIES
// =============================================================================

export const debugFitnessTargets = () => {
  if (__DEV__) {
    console.log('🏋️ Fitness Touch Targets Debug');
    console.log('==============================');
    
    Object.keys(FITNESS_TOUCH_TARGETS).forEach(key => {
      const target = calculateFitnessTarget(key as keyof typeof FITNESS_TOUCH_TARGETS);
      console.log(`${key}: ${target.width}x${target.height}pt (${target.minTouchArea}pt²)`);
    });
    
    console.log('\n🎯 Active Workout Targets:');
    const activeTargets = getActiveWorkoutTargets();
    Object.entries(activeTargets).forEach(([name, target]) => {
      console.log(`${name}: ${target.width}x${target.height}pt`);
    });
  }
};

// Export principal com utilities
export default {
  calculateFitnessTarget,
  getTimerTarget,
  getExerciseTarget, 
  getWeightInputTarget,
  getSetCompleteTarget,
  calculateMultipleTargets,
  getActiveWorkoutTargets,
  debugFitnessTargets,
  FITNESS_TARGET_CONFIGS,
};
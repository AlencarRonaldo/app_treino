/**
 * ResponsiveFitnessCard - FASE 3: Card fitness com sistema responsivo core
 * ✅ FITNESS_TOUCH_TARGETS expandidos (EXERCISE_CARD = 80px)
 * ✅ Hierarquia visual clara para contexto academia
 * ✅ Accessibility com labels em português
 * ✅ Informações essenciais visíveis em telas pequenas
 * ✅ Contraste alto para diferentes iluminações
 * ✅ One-handed usage patterns
 */

import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import {
  useOptimizedResponsive,
  FITNESS_TOUCH_TARGETS,
  scaleModerate,
  getFitnessTarget,
  getFitnessHitSlop
} from '../utils/responsiveCore';
import { FigmaTheme } from '../constants/figmaTheme';

interface ResponsiveFitnessCardProps {
  title: string;
  subtitle?: string;
  primaryValue?: string | number;
  secondaryValue?: string | number;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'default' | 'workout' | 'progress' | 'achievement' | 'student';
  status?: 'active' | 'completed' | 'pending' | 'warning' | 'error';
  onPress?: () => void;
  onLongPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  compact?: boolean;
  disabled?: boolean;
  showChevron?: boolean;
  children?: React.ReactNode;
}

export const ResponsiveFitnessCard: React.FC<ResponsiveFitnessCardProps> = ({
  title,
  subtitle,
  primaryValue,
  secondaryValue,
  icon,
  variant = 'default',
  status = 'active',
  onPress,
  onLongPress,
  accessibilityLabel,
  accessibilityHint,
  compact = false,
  disabled = false,
  showChevron = false,
  children
}) => {
  const responsiveSystem = useOptimizedResponsive();
  const isTablet = responsiveSystem.deviceInfo.isTablet;
  const isSmallDevice = responsiveSystem.dimensions.width < 375;

  // ===== VARIANT CONFIGURATIONS =====
  const variantConfig = useMemo(() => {
    const configs = {
      default: {
        backgroundColor: FigmaTheme.colors.cardBackground,
        borderColor: 'transparent',
        iconColor: FigmaTheme.colors.textSecondary,
        primaryColor: '#FF6B35'
      },
      workout: {
        backgroundColor: '#2C2C2E',
        borderColor: '#FF6B35',
        iconColor: '#FF6B35',
        primaryColor: '#FF6B35'
      },
      progress: {
        backgroundColor: 'rgba(0, 214, 50, 0.1)',
        borderColor: '#00D632',
        iconColor: '#00D632',
        primaryColor: '#00D632'
      },
      achievement: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderColor: '#FFD700',
        iconColor: '#FFD700',
        primaryColor: '#FFD700'
      },
      student: {
        backgroundColor: 'rgba(46, 134, 171, 0.1)',
        borderColor: '#2E86AB',
        iconColor: '#2E86AB',
        primaryColor: '#2E86AB'
      }
    };
    return configs[variant];
  }, [variant]);

  // ===== STATUS CONFIGURATIONS =====
  const statusConfig = useMemo(() => {
    const configs = {
      active: { opacity: 1.0, shadowOpacity: 0.1 },
      completed: { opacity: 0.9, shadowOpacity: 0.08 },
      pending: { opacity: 0.7, shadowOpacity: 0.05 },
      warning: { opacity: 1.0, shadowOpacity: 0.15 },
      error: { opacity: 1.0, shadowOpacity: 0.2 }
    };
    return configs[status];
  }, [status]);

  // ===== RESPONSIVE STYLES =====
  const styles = StyleSheet.create({
    card: {
      backgroundColor: variantConfig.backgroundColor,
      borderRadius: scaleModerate(12),
      borderWidth: variant !== 'default' ? 1 : 0,
      borderColor: variantConfig.borderColor,
      marginHorizontal: scaleModerate(isTablet ? 24 : 16),
      marginVertical: scaleModerate(compact ? 4 : 8),
      minHeight: compact 
        ? FITNESS_TOUCH_TARGETS.LIST_ITEM 
        : FITNESS_TOUCH_TARGETS.EXERCISE_CARD,
      opacity: disabled ? 0.5 : statusConfig.opacity,
      // Alto contraste para diferentes iluminações
      elevation: Platform.OS === 'android' ? 3 : 0,
      shadowColor: variant === 'workout' ? '#FF6B35' : '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: statusConfig.shadowOpacity,
      shadowRadius: 4,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: scaleModerate(isTablet ? 20 : 16),
      minHeight: compact 
        ? FITNESS_TOUCH_TARGETS.LIST_ITEM 
        : FITNESS_TOUCH_TARGETS.EXERCISE_CARD,
    },
    iconContainer: {
      width: scaleModerate(isTablet ? 48 : 40),
      height: scaleModerate(isTablet ? 48 : 40),
      borderRadius: scaleModerate(isTablet ? 24 : 20),
      backgroundColor: `${variantConfig.iconColor}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: scaleModerate(isTablet ? 16 : 12),
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: scaleModerate(2),
    },
    title: {
      fontSize: scaleModerate(isTablet ? 18 : (compact ? 15 : 16)),
      fontWeight: '600',
      color: FigmaTheme.colors.textPrimary,
      marginBottom: subtitle || primaryValue ? scaleModerate(2) : 0,
      // Melhor legibilidade em telas pequenas
      lineHeight: scaleModerate(isTablet ? 22 : (compact ? 18 : 20)),
    },
    subtitle: {
      fontSize: scaleModerate(isTablet ? 15 : (compact ? 12 : 14)),
      color: FigmaTheme.colors.textSecondary,
      marginBottom: primaryValue ? scaleModerate(4) : 0,
      lineHeight: scaleModerate(isTablet ? 18 : (compact ? 15 : 17)),
    },
    valuesContainer: {
      flexDirection: isSmallDevice ? 'column' : 'row',
      alignItems: isSmallDevice ? 'flex-start' : 'center',
      gap: scaleModerate(8),
    },
    primaryValue: {
      fontSize: scaleModerate(isTablet ? 20 : (compact ? 16 : 18)),
      fontWeight: '700',
      color: variantConfig.primaryColor,
      includeFontPadding: false,
    },
    secondaryValue: {
      fontSize: scaleModerate(isTablet ? 16 : (compact ? 13 : 14)),
      fontWeight: '500',
      color: FigmaTheme.colors.textSecondary,
      includeFontPadding: false,
    },
    chevronContainer: {
      minWidth: FITNESS_TOUCH_TARGETS.ICON_SMALL,
      minHeight: FITNESS_TOUCH_TARGETS.ICON_SMALL,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: scaleModerate(8),
    },
    statusIndicator: {
      position: 'absolute',
      top: scaleModerate(8),
      right: scaleModerate(8),
      width: scaleModerate(8),
      height: scaleModerate(8),
      borderRadius: scaleModerate(4),
      backgroundColor: getStatusColor(),
    }
  });

  function getStatusColor(): string {
    switch (status) {
      case 'completed': return '#00D632';
      case 'pending': return '#F39C12';
      case 'warning': return '#E67E22';
      case 'error': return '#E74C3C';
      case 'active':
      default: return variantConfig.primaryColor;
    }
  }

  // ===== ACCESSIBILITY SETUP =====
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: onPress ? 'button' as const : 'text' as const,
    accessibilityLabel: accessibilityLabel || generateAccessibilityLabel(),
    accessibilityHint: accessibilityHint || (onPress ? 'Toque para ver detalhes' : undefined),
    accessibilityState: {
      disabled: disabled,
      selected: status === 'active'
    }
  };

  function generateAccessibilityLabel(): string {
    let label = title;
    if (subtitle) label += `, ${subtitle}`;
    if (primaryValue) label += `, valor principal ${primaryValue}`;
    if (secondaryValue) label += `, valor secundário ${secondaryValue}`;
    
    const statusLabels = {
      active: 'ativo',
      completed: 'concluído',
      pending: 'pendente',
      warning: 'atenção',
      error: 'erro'
    };
    label += `, status ${statusLabels[status]}`;
    
    return label;
  }

  // ===== RENDER COMPONENT =====
  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        disabled={disabled}
        hitSlop={getFitnessHitSlop('EXERCISE_CARD')}
        {...accessibilityProps}
      >
        <View style={styles.content}>
          {/* Icon */}
          {icon && (
            <View style={styles.iconContainer}>
              <Ionicons
                name={icon}
                size={scaleModerate(isTablet ? 28 : 24)}
                color={variantConfig.iconColor}
              />
            </View>
          )}

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
              {title}
            </Text>
            
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={compact ? 1 : 2}>
                {subtitle}
              </Text>
            )}

            {(primaryValue || secondaryValue) && (
              <View style={styles.valuesContainer}>
                {primaryValue && (
                  <Text style={styles.primaryValue}>
                    {primaryValue}
                  </Text>
                )}
                {secondaryValue && (
                  <Text style={styles.secondaryValue}>
                    {secondaryValue}
                  </Text>
                )}
              </View>
            )}

            {children}
          </View>

          {/* Chevron */}
          {showChevron && (
            <View style={styles.chevronContainer}>
              <Ionicons
                name="chevron-forward"
                size={scaleModerate(20)}
                color={FigmaTheme.colors.textSecondary}
              />
            </View>
          )}
        </View>

        {/* Status Indicator */}
        {status !== 'active' && <View style={styles.statusIndicator} />}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={styles.card}
      {...accessibilityProps}
    >
      <View style={styles.content}>
        {/* Icon */}
        {icon && (
          <View style={styles.iconContainer}>
            <Ionicons
              name={icon}
              size={scaleModerate(isTablet ? 28 : 24)}
              color={variantConfig.iconColor}
            />
          </View>
        )}

        {/* Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={compact ? 1 : 2}>
            {title}
          </Text>
          
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={compact ? 1 : 2}>
              {subtitle}
            </Text>
          )}

          {(primaryValue || secondaryValue) && (
            <View style={styles.valuesContainer}>
              {primaryValue && (
                <Text style={styles.primaryValue}>
                  {primaryValue}
                </Text>
              )}
              {secondaryValue && (
                <Text style={styles.secondaryValue}>
                  {secondaryValue}
                </Text>
              )}
            </View>
          )}

          {children}
        </View>

        {/* Chevron */}
        {showChevron && (
          <View style={styles.chevronContainer}>
            <Ionicons
              name="chevron-forward"
              size={scaleModerate(20)}
              color={FigmaTheme.colors.textSecondary}
            />
          </View>
        )}
      </View>

      {/* Status Indicator */}
      {status !== 'active' && <View style={styles.statusIndicator} />}
    </View>
  );
};

ResponsiveFitnessCard.displayName = 'ResponsiveFitnessCard_Phase3_FitnessUX';
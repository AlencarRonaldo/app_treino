import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../constants/designTokens';

interface KPIWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'stable';
    label?: string;
  };
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
  backgroundColor?: string;
  sparklineData?: number[];
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'gradient' | 'minimal';
}

export default function KPIWidget({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = DesignTokens.colors.primary,
  backgroundColor,
  sparklineData,
  onPress,
  size = 'medium',
  variant = 'default'
}: KPIWidgetProps) {
  const theme = useTheme();

  const getTrendIcon = () => {
    switch (trend?.direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (trend?.direction) {
      case 'up':
        return DesignTokens.colors.success;
      case 'down':
        return DesignTokens.colors.error;
      default:
        return DesignTokens.colors.textSecondary;
    }
  };

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      } else {
        return val.toFixed(1);
      }
    }
    return val;
  };

  const renderSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min;
    
    if (range === 0) return null;

    return (
      <View style={styles.sparklineContainer}>
        <View style={styles.sparkline}>
          {sparklineData.map((point, index) => {
            const height = ((point - min) / range) * 20;
            return (
              <View
                key={index}
                style={[
                  styles.sparklineBar,
                  {
                    height: Math.max(1, height),
                    backgroundColor: color,
                    opacity: 0.6 + (height / 20) * 0.4
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderContent = () => (
    <View style={[styles.content, styles[`${size}Content`]]}>
      {/* Header */}
      <View style={styles.header}>
        {icon && (
          <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
            <Ionicons name={icon} size={size === 'small' ? 16 : 20} color={color} />
          </View>
        )}
        <View style={styles.headerText}>
          <Text variant={size === 'small' ? 'bodySmall' : 'bodyMedium'} style={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {/* Value */}
      <View style={styles.valueContainer}>
        <Text 
          variant={size === 'large' ? 'headlineMedium' : size === 'medium' ? 'headlineSmall' : 'titleLarge'} 
          style={[styles.value, { color }]}
        >
          {formatValue(value)}
        </Text>
        
        {/* Trend Indicator */}
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={getTrendIcon()} 
              size={size === 'small' ? 12 : 16} 
              color={getTrendColor()} 
            />
            <Text 
              variant="bodySmall" 
              style={[styles.trendText, { color: getTrendColor() }]}
            >
              {Math.abs(trend.value)}%
            </Text>
            {trend.label && (
              <Text variant="bodySmall" style={styles.trendLabel}>
                {trend.label}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Sparkline */}
      {renderSparkline()}
    </View>
  );

  const containerStyle = [
    styles.container,
    styles[`${size}Container`],
    backgroundColor && { backgroundColor },
    onPress && styles.touchable
  ];

  if (variant === 'gradient' && !backgroundColor) {
    return (
      <TouchableOpacity 
        style={containerStyle} 
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        <LinearGradient
          colors={[color, `${color}CC`]}
          style={styles.gradientContainer}
        >
          <View style={styles.gradientOverlay}>
            {renderContent()}
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'minimal') {
    return (
      <TouchableOpacity 
        style={[containerStyle, styles.minimalContainer]} 
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  return (
    <Surface 
      style={containerStyle}
      elevation={variant === 'minimal' ? 0 : 2}
    >
      <TouchableOpacity 
        style={styles.touchableContent}
        onPress={onPress}
        activeOpacity={onPress ? 0.8 : 1}
      >
        {renderContent()}
      </TouchableOpacity>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: DesignTokens.borderRadius.lg,
    overflow: 'hidden',
  },
  smallContainer: {
    minHeight: 80,
    flex: 1,
    margin: DesignTokens.spacing.xs,
  },
  mediumContainer: {
    minHeight: 120,
    flex: 1,
    margin: DesignTokens.spacing.sm,
  },
  largeContainer: {
    minHeight: 160,
    margin: DesignTokens.spacing.md,
  },
  touchable: {
    // Adiciona feedback visual quando pressionável
  },
  touchableContent: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
    borderRadius: DesignTokens.borderRadius.lg,
  },
  gradientOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  minimalContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: DesignTokens.colors.outline,
  },
  content: {
    flex: 1,
    padding: DesignTokens.spacing.md,
    justifyContent: 'space-between',
  },
  smallContent: {
    padding: DesignTokens.spacing.sm,
  },
  mediumContent: {
    padding: DesignTokens.spacing.md,
  },
  largeContent: {
    padding: DesignTokens.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: DesignTokens.spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  subtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.xs,
  },
  value: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: DesignTokens.spacing.sm,
  },
  trendText: {
    marginLeft: 2,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  trendLabel: {
    marginLeft: DesignTokens.spacing.xs,
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.fontSize.xs,
  },
  sparklineContainer: {
    height: 24,
    justifyContent: 'flex-end',
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 20,
    gap: 1,
  },
  sparklineBar: {
    flex: 1,
    minWidth: 2,
    borderRadius: 1,
  },
});
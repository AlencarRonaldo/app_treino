import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../constants/designTokens';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function StatsCard({ 
  icon, 
  value, 
  label, 
  iconColor = DesignTokens.colors.primary,
  trend,
  trendValue 
}: StatsCardProps) {
  
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return DesignTokens.colors.success;
      case 'down':
        return DesignTokens.colors.error;
      default:
        return DesignTokens.colors.textSecondary;
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'remove';
    }
  };

  return (
    <Surface style={styles.container} elevation={2}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={icon} 
          size={32} 
          color={iconColor} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
        <Text variant="bodySmall" style={styles.label}>
          {label}
        </Text>
        
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={getTrendIcon()} 
              size={12} 
              color={getTrendColor()} 
            />
            <Text 
              variant="bodySmall" 
              style={[styles.trendText, { color: getTrendColor() }]}
            >
              {trendValue}
            </Text>
          </View>
        )}
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    ...DesignTokens.shadows.md,
  },
  iconContainer: {
    marginBottom: DesignTokens.spacing.sm,
  },
  contentContainer: {
    alignItems: 'center',
  },
  value: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
    marginBottom: DesignTokens.spacing.xs,
  },
  label: {
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.xs,
  },
  trendText: {
    marginLeft: DesignTokens.spacing.xs,
    fontSize: DesignTokens.typography.fontSize.xs,
  },
});
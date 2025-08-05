import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import { DesignTokens } from '../constants/designTokens';

interface FitnessCardProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'featured' | 'stats';
  style?: ViewStyle;
  onPress?: () => void;
}

export default function FitnessCard({ 
  title, 
  subtitle, 
  children, 
  variant = 'default',
  style,
  onPress 
}: FitnessCardProps) {
  const theme = useTheme();
  
  const getCardStyle = () => {
    switch (variant) {
      case 'featured':
        return [
          styles.card,
          styles.featuredCard,
          { 
            backgroundColor: DesignTokens.colors.primary,
            ...DesignTokens.shadows.lg 
          }
        ];
      case 'stats':
        return [
          styles.card,
          styles.statsCard,
          DesignTokens.shadows.md
        ];
      default:
        return [
          styles.card,
          { backgroundColor: theme.colors.surface },
          DesignTokens.shadows.sm
        ];
    }
  };

  const getTitleStyle = () => {
    return variant === 'featured' 
      ? [styles.title, { color: DesignTokens.colors.onPrimary }]
      : [styles.title, { color: DesignTokens.colors.textPrimary }];
  };

  const getSubtitleStyle = () => {
    return variant === 'featured'
      ? [styles.subtitle, { color: DesignTokens.colors.onPrimary, opacity: 0.8 }]
      : [styles.subtitle, { color: DesignTokens.colors.textSecondary }];
  };

  return (
    <Card 
      style={[getCardStyle(), style]} 
      mode="elevated"
      onPress={onPress}
    >
      {(title || subtitle) && (
        <Card.Title
          title={title}
          subtitle={subtitle}
          titleStyle={getTitleStyle()}
          subtitleStyle={getSubtitleStyle()}
        />
      )}
      {children && (
        <Card.Content>
          {children}
        </Card.Content>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: DesignTokens.borderRadius.lg,
    marginBottom: DesignTokens.spacing.md,
  },
  featuredCard: {
    // Gradiente será implementado com LinearGradient se necessário
  },
  statsCard: {
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize.lg,
    fontWeight: DesignTokens.typography.fontWeight.semibold as any,
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.sm,
    marginTop: DesignTokens.spacing.xs,
  },
});
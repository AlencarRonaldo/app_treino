import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { FigmaTheme } from '../constants/figmaTheme';

interface FigmaCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
}

export default function FigmaCard({ 
  children, 
  variant = 'default', 
  style 
}: FigmaCardProps) {
  return (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: FigmaTheme.colors.gray800,
    borderRadius: FigmaTheme.borderRadius.card,
    padding: FigmaTheme.spacing.lg,
  },
  
  default: {
    ...FigmaTheme.shadows.small,
  },
  
  elevated: {
    ...FigmaTheme.shadows.medium,
  },
  
  outlined: {
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray600,
    backgroundColor: FigmaTheme.colors.background,
  },
});
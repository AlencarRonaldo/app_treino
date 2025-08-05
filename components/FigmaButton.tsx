import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FigmaTheme } from '../constants/figmaTheme';

interface FigmaButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export default function FigmaButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  style,
}: FigmaButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.baseText,
    styles[`${variant}Text` as keyof typeof styles],
    styles[`${size}Text` as keyof typeof styles],
    disabled && styles.disabledText,
  ];

  const getIconColor = () => {
    if (disabled) return FigmaTheme.colors.textDisabled;
    
    switch (variant) {
      case 'primary':
        return FigmaTheme.colors.textPrimary;
      case 'secondary':
        return FigmaTheme.colors.textPrimary;
      case 'outline':
        return FigmaTheme.colors.success;
      case 'text':
        return FigmaTheme.colors.success;
      default:
        return FigmaTheme.colors.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={getIconColor()} 
        />
      ) : (
        <>
          {icon && (
            <Ionicons
              name={icon}
              size={size === 'large' ? 20 : size === 'medium' ? 18 : 16}
              color={getIconColor()}
              style={styles.icon}
            />
          )}
          <Text style={textStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: FigmaTheme.borderRadius.button,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  // Variantes
  primary: {
    backgroundColor: FigmaTheme.colors.success,
    ...FigmaTheme.shadows.small,
  },
  secondary: {
    backgroundColor: FigmaTheme.colors.gray700,
    ...FigmaTheme.shadows.small,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: FigmaTheme.colors.success,
    borderWidth: 2,
  },
  text: {
    backgroundColor: 'transparent',
  },
  
  // Tamanhos
  small: {
    paddingHorizontal: FigmaTheme.spacing.md,
    paddingVertical: FigmaTheme.spacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: FigmaTheme.spacing.lg,
    paddingVertical: FigmaTheme.spacing.md,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: FigmaTheme.spacing.xl,
    paddingVertical: FigmaTheme.spacing.md,
    minHeight: 52,
  },
  
  // Estados
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    backgroundColor: FigmaTheme.colors.gray600,
    opacity: 0.5,
  },
  
  // Textos
  baseText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: FigmaTheme.colors.textPrimary,
  },
  secondaryText: {
    color: FigmaTheme.colors.textPrimary,
  },
  outlineText: {
    color: FigmaTheme.colors.success,
  },
  textText: {
    color: FigmaTheme.colors.success,
  },
  
  // Tamanhos de texto
  smallText: {
    fontSize: FigmaTheme.typography.caption.fontSize,
  },
  mediumText: {
    fontSize: FigmaTheme.typography.body.fontSize,
  },
  largeText: {
    fontSize: FigmaTheme.typography.body.fontSize,
    fontWeight: '700',
  },
  
  disabledText: {
    color: FigmaTheme.colors.textDisabled,
  },
  
  icon: {
    marginRight: FigmaTheme.spacing.sm,
  },
});
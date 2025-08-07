import React from 'react';
import { StyleSheet } from 'react-native';
import { Button, useTheme } from 'react-native-paper';
import { DesignTokens } from '../constants/designTokens';
import { 
  getResponsiveButtonStyle, 
  getResponsiveFontSize,
  TOUCH_TARGETS 
} from '../utils/responsive';

interface FitnessButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  icon?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export default function FitnessButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon,
  loading = false,
  fullWidth = false,
}: FitnessButtonProps) {
  const theme = useTheme();

  const getButtonMode = () => {
    switch (variant) {
      case 'secondary':
        return 'contained';
      case 'outline':
        return 'outlined';
      case 'text':
        return 'text';
      default:
        return 'contained';
    }
  };

  const getButtonColor = () => {
    switch (variant) {
      case 'secondary':
        return DesignTokens.colors.secondary;
      case 'outline':
      case 'text':
        return DesignTokens.colors.primary;
      default:
        return DesignTokens.colors.primary;
    }
  };

  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: DesignTokens.borderRadius.md,
      minHeight: size === 'small' ? TOUCH_TARGETS.MIN : 
                size === 'large' ? TOUCH_TARGETS.LARGE : TOUCH_TARGETS.BUTTON,
    };

    const responsiveStyle = getResponsiveButtonStyle();
    
    const sizeStyle = {
      small: { 
        paddingVertical: responsiveStyle.paddingVertical * 0.75,
        paddingHorizontal: responsiveStyle.paddingHorizontal * 0.75,
      },
      medium: { 
        paddingVertical: responsiveStyle.paddingVertical,
        paddingHorizontal: responsiveStyle.paddingHorizontal,
      },
      large: { 
        paddingVertical: responsiveStyle.paddingVertical * 1.25,
        paddingHorizontal: responsiveStyle.paddingHorizontal * 1.25,
      },
    };

    const widthStyle = fullWidth ? { alignSelf: 'stretch' as const } : {};

    return [
      styles.button,
      baseStyle,
      sizeStyle[size],
      widthStyle,
    ];
  };

  const getLabelStyle = () => {
    const sizeStyle = {
      small: { 
        fontSize: getResponsiveFontSize(
          DesignTokens.typography.fontSize.sm, 
          { min: 12, max: 16 }
        ) 
      },
      medium: { 
        fontSize: getResponsiveFontSize(
          DesignTokens.typography.fontSize.base,
          { min: 14, max: 18 }
        ) 
      },
      large: { 
        fontSize: getResponsiveFontSize(
          DesignTokens.typography.fontSize.lg,
          { min: 16, max: 22 }
        ) 
      },
    };

    return [
      styles.label,
      sizeStyle[size],
      { fontWeight: DesignTokens.typography.fontWeight.semibold as any },
    ];
  };

  return (
    <Button
      mode={getButtonMode()}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      icon={icon}
      buttonColor={getButtonColor()}
      style={getButtonStyle()}
      labelStyle={getLabelStyle()}
      contentStyle={styles.content}
    >
      {title}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: {
    marginVertical: DesignTokens.spacing.xs,
  },
  content: {
    paddingHorizontal: DesignTokens.spacing.md,
  },
  label: {
    textTransform: 'none',
  },
});
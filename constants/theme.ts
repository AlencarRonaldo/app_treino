import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { DesignTokens } from './designTokens';

const colors = {
  primary: DesignTokens.colors.primary,
  primaryVariant: DesignTokens.colors.primaryDark,
  secondary: DesignTokens.colors.secondary,
  secondaryVariant: DesignTokens.colors.secondaryDark,
  background: DesignTokens.colors.background,
  surface: DesignTokens.colors.surface,
  error: DesignTokens.colors.error,
  onPrimary: DesignTokens.colors.onPrimary,
  onSecondary: DesignTokens.colors.onSecondary,
  onBackground: DesignTokens.colors.onBackground,
  onSurface: DesignTokens.colors.onSurface,
  onError: DesignTokens.colors.onPrimary,
  // Cores específicas do app
  success: DesignTokens.colors.success,
  warning: DesignTokens.colors.warning,
  info: DesignTokens.colors.info,
  textPrimary: DesignTokens.colors.textPrimary,
  textSecondary: DesignTokens.colors.textSecondary,
  divider: DesignTokens.colors.outline,
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onBackground: colors.onBackground,
    onSurface: colors.onSurface,
    onError: colors.onError,
  },
  custom: {
    colors: {
      success: colors.success,
      warning: colors.warning,
      info: colors.info,
      textPrimary: colors.textPrimary,
      textSecondary: colors.textSecondary,
      divider: colors.divider,
    },
    spacing: {
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
    },
    borderRadius: {
      sm: 4,
      md: 8,
      lg: 16,
      xl: 24,
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
  },
  custom: theme.custom,
};

export type AppTheme = typeof theme;
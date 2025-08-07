/**
 * WebCompatiblePressable - Substituto para TouchableOpacity/TouchableWithoutFeedback
 * Resolve warning "TouchableMixin is deprecated. Please use Pressable."
 */

import React from 'react';
import { Pressable, PressableProps, Platform, ViewStyle, StyleProp } from 'react-native';

interface WebCompatiblePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  activeOpacity?: number;
  delayPressIn?: number;
  delayPressOut?: number;
  delayLongPress?: number;
  hitSlop?: number | { top?: number; bottom?: number; left?: number; right?: number };
  pressRetentionOffset?: number | { top?: number; bottom?: number; left?: number; right?: number };
  // Adicionar suporte a propriedades web específicas
  accessibilityRole?: string;
  accessibilityLabel?: string;
  testID?: string;
}

export default function WebCompatiblePressable({
  children,
  style,
  onPress,
  onLongPress,
  disabled = false,
  activeOpacity = 0.7,
  delayPressIn = 0,
  delayPressOut = 100,
  delayLongPress = 500,
  hitSlop,
  pressRetentionOffset,
  accessibilityRole = 'button',
  accessibilityLabel,
  testID,
  ...rest
}: WebCompatiblePressableProps) {

  return (
    <Pressable
      style={({ pressed }) => [
        style,
        // Aplicar efeito de opacidade quando pressionado
        pressed && {
          opacity: activeOpacity
        },
        // Estilo adicional para web
        Platform.OS === 'web' && {
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none' as any,
          outline: 'none'
        }
      ]}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
      delayPressIn={delayPressIn}
      delayPressOut={delayPressOut}
      delayLongPress={delayLongPress}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      disabled={disabled}
      accessibilityRole={Platform.OS === 'web' ? accessibilityRole as any : undefined}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

// Variante específica para botões de ícone
export function WebCompatibleIconButton({
  children,
  style,
  onPress,
  size = 44,
  disabled = false,
  activeOpacity = 0.6,
  ...rest
}: WebCompatiblePressableProps & { size?: number }) {
  return (
    <WebCompatiblePressable
      style={[
        {
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: size / 2
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      {...rest}
    >
      {children}
    </WebCompatiblePressable>
  );
}

// Variante específica para cards clicáveis
export function WebCompatibleCard({
  children,
  style,
  onPress,
  disabled = false,
  activeOpacity = 0.95,
  elevation = 2,
  ...rest
}: WebCompatiblePressableProps & { elevation?: number }) {
  return (
    <WebCompatiblePressable
      style={[
        {
          borderRadius: 8,
          backgroundColor: '#ffffff',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: elevation
              },
              shadowOpacity: 0.1,
              shadowRadius: elevation * 2
            },
            android: {
              elevation: elevation
            },
            web: {
              boxShadow: `0 ${elevation}px ${elevation * 2}px rgba(0,0,0,0.1)`
            }
          })
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      {...rest}
    >
      {children}
    </WebCompatiblePressable>
  );
}

// Variante para lista de itens
export function WebCompatibleListItem({
  children,
  style,
  onPress,
  disabled = false,
  activeOpacity = 0.9,
  showDivider = false,
  ...rest
}: WebCompatiblePressableProps & { 
  showDivider?: boolean;
}) {
  return (
    <WebCompatiblePressable
      style={[
        {
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderBottomWidth: showDivider ? 1 : 0,
          borderBottomColor: '#e0e0e0'
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={activeOpacity}
      accessibilityRole="button"
      {...rest}
    >
      {children}
    </WebCompatiblePressable>
  );
}
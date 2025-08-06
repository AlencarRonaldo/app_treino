import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, HelperText, useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../constants/designTokens';

interface FitnessInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  left?: React.ReactNode;
  right?: React.ReactNode;
}

// Componente Icon para usar com FitnessInput
interface IconProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  size?: number;
}

function InputIcon({ name, onPress, color = DesignTokens.colors.textSecondary, size = 20 }: IconProps) {
  const IconComponent = onPress ? TouchableOpacity : View;
  
  return (
    <IconComponent onPress={onPress} style={styles.iconContainer}>
      <Ionicons name={name} size={size} color={color} />
    </IconComponent>
  );
}

export default function FitnessInput({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  left,
  right,
}: FitnessInputProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        disabled={disabled}
        multiline={multiline}
        numberOfLines={numberOfLines}
        mode="outlined"
        error={!!error}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          {
            backgroundColor: disabled 
              ? DesignTokens.colors.surfaceVariant 
              : DesignTokens.colors.surface,
          }
        ]}
        outlineStyle={[
          styles.outline,
          {
            borderColor: error 
              ? DesignTokens.colors.error
              : isFocused 
                ? DesignTokens.colors.primary
                : DesignTokens.colors.outline,
            borderWidth: isFocused ? 2 : 1,
          }
        ]}
        contentStyle={styles.content}
        left={left}
        right={right}
      />
      {error && (
        <HelperText type="error" visible={!!error} style={styles.errorText}>
          {error}
        </HelperText>
      )}
    </View>
  );
}

// Adicionar Icon como propriedade estática
FitnessInput.Icon = InputIcon;

const styles = StyleSheet.create({
  container: {
    marginBottom: DesignTokens.spacing.md,
  },
  input: {
    fontSize: DesignTokens.typography.fontSize.base,
  },
  outline: {
    borderRadius: DesignTokens.borderRadius.md,
  },
  content: {
    paddingHorizontal: DesignTokens.spacing.md,
  },
  errorText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    marginTop: DesignTokens.spacing.xs,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
  },
});
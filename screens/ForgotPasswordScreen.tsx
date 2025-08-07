import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { DesignTokens } from '../constants/designTokens';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { AuthStackNavigationProp } from '../types/navigation';

interface ForgotPasswordScreenProps {
  navigation: AuthStackNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu email.', [{ text: 'OK' }]);
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erro', 'Por favor, insira um email válido.', [{ text: 'OK' }]);
      return;
    }

    setIsLoading(true);
    try {
      const success = await resetPassword(email.trim());
      
      if (success) {
        setEmailSent(true);
        Alert.alert(
          'Email Enviado',
          'Verificamos seu email e enviamos instruções para redefinir sua senha. Verifique sua caixa de entrada e spam.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Erro',
          'Não foi possível enviar o email de recuperação. Verifique se o email está correto e tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      if (__DEV__) console.error('Reset password error:', error);
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  if (emailSent) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successContainer}>
            <Ionicons 
              name="checkmark-circle" 
              size={80} 
              color={FigmaTheme.colors.success} 
            />
            <Text style={styles.successTitle}>Email Enviado!</Text>
            <Text style={styles.successMessage}>
              Verificamos seu email e enviamos instruções para redefinir sua senha.
              {'\n\n'}
              Verifique sua caixa de entrada e também a pasta de spam.
            </Text>
            
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToLogin}
            >
              <Text style={styles.backButtonText}>
                Voltar ao Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backIcon}
              onPress={handleBackToLogin}
            >
              <Ionicons 
                name="arrow-back" 
                size={28} 
                color={FigmaTheme.colors.textPrimary} 
              />
            </TouchableOpacity>
            
            <Ionicons 
              name="key" 
              size={60} 
              color={FigmaTheme.colors.primary} 
            />
            <Text style={styles.title}>Esqueci minha senha</Text>
            <Text style={styles.subtitle}>
              Digite seu email e enviaremos instruções para redefinir sua senha
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons 
                name="mail-outline" 
                size={20} 
                color={FigmaTheme.colors.gray600} 
                style={styles.inputIcon} 
              />
              <TextInput
                style={styles.textInput}
                placeholder="Digite seu email"
                placeholderTextColor={FigmaTheme.colors.gray600}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.resetButton,
                (!email.trim() || isLoading) && styles.resetButtonDisabled
              ]}
              onPress={handleResetPassword}
              disabled={!email.trim() || isLoading}
            >
              <Text style={[
                styles.resetButtonText,
                (!email.trim() || isLoading) && styles.resetButtonTextDisabled
              ]}>
                {isLoading ? 'Enviando...' : 'Enviar Email de Recuperação'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Lembrou da sua senha?
            </Text>
            <TouchableOpacity onPress={handleBackToLogin}>
              <Text style={styles.helpLink}>
                Fazer login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.xl,
    paddingBottom: DesignTokens.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.xl,
    position: 'relative',
  },
  backIcon: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: DesignTokens.spacing.xs,
  },
  title: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: FigmaTheme.colors.textPrimary,
    marginTop: DesignTokens.spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textSecondary,
    marginTop: DesignTokens.spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    gap: DesignTokens.spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
    paddingHorizontal: DesignTokens.spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: DesignTokens.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textPrimary,
    paddingVertical: 0,
  },
  resetButton: {
    backgroundColor: FigmaTheme.colors.primary,
    borderRadius: DesignTokens.borderRadius.md,
    paddingVertical: DesignTokens.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDisabled: {
    backgroundColor: FigmaTheme.colors.gray300,
  },
  resetButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: FigmaTheme.colors.white,
  },
  resetButtonTextDisabled: {
    color: FigmaTheme.colors.gray600,
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.xs,
  },
  helpText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: FigmaTheme.colors.textSecondary,
  },
  helpLink: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: FigmaTheme.colors.primary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.lg,
  },
  successTitle: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: FigmaTheme.colors.textPrimary,
    marginTop: DesignTokens.spacing.lg,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: DesignTokens.spacing.md,
  },
  backButton: {
    backgroundColor: FigmaTheme.colors.primary,
    borderRadius: DesignTokens.borderRadius.md,
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    marginTop: DesignTokens.spacing.xl,
  },
  backButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: FigmaTheme.colors.white,
  },
});
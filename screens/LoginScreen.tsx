import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { 
  Text, 
  useTheme, 
  ActivityIndicator 
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import FitnessButton from '../components/FitnessButton';
import FitnessCard from '../components/FitnessCard';
import FitnessInput from '../components/FitnessInput';
import FigmaScreen from '../components/FigmaScreen';
import FigmaButton from '../components/FigmaButton';
import FigmaCard from '../components/FigmaCard';
import { DesignTokens } from '../constants/designTokens';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import { AuthStackNavigationProp } from '../types/navigation';
import { 
  getHorizontalPadding, 
  getVerticalPadding, 
  getResponsiveValue,
  getResponsiveFontSize,
  TOUCH_TARGETS,
  SCREEN_WIDTH,
  SPACING,
  TYPOGRAPHY,
  getResponsiveLayout,
  getResponsiveInputStyle,
  getResponsiveButtonStyle,
  getResponsiveModalStyle,
  getSafeAreaPadding,
  isSmallMobile,
  getFormFieldSpacing,
  mediaQuery
} from '../utils/responsive';

const { width, height } = Dimensions.get('window');

const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Senha é obrigatória'),
});

interface LoginFormData {
  email: string;
  password: string;
}

type UserType = 'personal' | 'student';

interface LoginScreenProps {
  navigation: AuthStackNavigationProp;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const theme = useTheme();
  const { signInWithGoogle, signInWithEmail, isLoading } = useAuth();
  const { setUserType } = useUserType();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('student');
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const success = await signInWithGoogle();
      if (success) {
        // Definir tipo de usuário após login bem-sucedido
        await setUserType(selectedUserType);
      } else {
        Alert.alert(
          'Erro no Login',
          'Não foi possível fazer login com o Google. Tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado. Tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleEmailLogin = async (data: LoginFormData) => {
    try {
      const success = await signInWithEmail(data.email, data.password);
      if (success) {
        // Definir tipo de usuário após login bem-sucedido
        await setUserType(selectedUserType);
      } else {
        Alert.alert(
          'Erro no Login',
          'Email ou senha incorretos. Verifique suas credenciais e tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao fazer login. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <FigmaScreen>
      <StatusBar style="light" />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Login title and icon */}
        <View style={styles.header}>
          <Text style={styles.loginHeaderText}>Login</Text>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              {/* Ícone laranja como no Figma */}
              <View style={styles.dumbbellIcon} />
            </View>
          </View>
        </View>

        {/* Login Form - sem card, direto na tela */}
        <View style={styles.loginForm}>
          <Text style={styles.signInText}>Sign in with</Text>

          {/* Botões de login social */}
          <View style={styles.socialButtons}>
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
              <Ionicons name="logo-google" size={20} color="#333" />
              <Text style={styles.googleButtonText}>Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.facebookButton}>
              <Ionicons name="logo-facebook" size={20} color="#fff" />
              <Text style={styles.facebookButtonText}>Facebook</Text>
            </TouchableOpacity>
          </View>
          
          {/* Campos de input */}
          <View style={styles.inputContainer}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    placeholderTextColor="#666"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputGroup}>
                  <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
          
          {/* Botão de Login */}
          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={handleSubmit(handleEmailLogin) as any}
            disabled={isSubmitting}
          >
            <Text style={styles.loginButtonText}>
              {isSubmitting ? "Entrando..." : "Login"}
            </Text>
          </TouchableOpacity>
          
          {/* Link para esqueci senha */}
          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword' as any)}
            style={styles.forgotPasswordContainer}
          >
            <Text style={styles.forgotPasswordText}>
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          {/* Link para registro */}
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.registerLink}>
              Don't have an account yet? <Text style={styles.registerLinkBold}>Register</Text>
            </Text>
          </TouchableOpacity>
          
          {/* Contas de teste para desenvolvimento */}
          <View style={styles.testAccountsSection}>
            <Text style={styles.testAccountsTitle}>🧪 Contas de Teste:</Text>
            <TouchableOpacity 
              style={styles.testAccountButton}
              onPress={() => {
                setValue('email', 'personal@teste.com');
                setValue('password', '123456');
                setSelectedUserType('personal');
              }}
            >
              <Text style={styles.testAccountText}>📋 Personal: personal@teste.com</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.testAccountButton}
              onPress={() => {
                setValue('email', 'aluno@teste.com');
                setValue('password', '123456');
                setSelectedUserType('student');
              }}
            >
              <Text style={styles.testAccountText}>🏃 Aluno: aluno@teste.com</Text>
            </TouchableOpacity>
          </View>
          
          {/* Seleção do tipo de usuário - pequena e discreta */}
          <View style={styles.userTypeSection}>
            <Text style={styles.userTypeTitle}>Você é:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity 
                style={[
                  styles.userTypeButton, 
                  selectedUserType === 'personal' && styles.userTypeButtonActive
                ]}
                onPress={() => setSelectedUserType('personal')}
              >
                <Ionicons 
                  name="fitness" 
                  size={16} 
                  color={selectedUserType === 'personal' ? '#FFFFFF' : '#FF6B35'} 
                />
                <Text style={[
                  styles.userTypeButtonText,
                  selectedUserType === 'personal' && styles.userTypeButtonTextActive
                ]}>
                  Personal
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.userTypeButton, 
                  selectedUserType === 'student' && styles.userTypeButtonActive
                ]}
                onPress={() => setSelectedUserType('student')}
              >
                <Ionicons 
                  name="person" 
                  size={16} 
                  color={selectedUserType === 'student' ? '#FFFFFF' : '#FF6B35'} 
                />
                <Text style={[
                  styles.userTypeButtonText,
                  selectedUserType === 'student' && styles.userTypeButtonTextActive
                ]}>
                  Aluno
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </FigmaScreen>
  );
}

const layout = getResponsiveLayout();
const safeArea = getSafeAreaPadding();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: FigmaTheme.colors.background,
    paddingHorizontal: layout.containerPadding,
    ...safeArea,
  },
  loadingText: {
    marginTop: SPACING.MD,
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.containerPadding,
    paddingTop: getResponsiveValue(40, 60, 80, 100),
    paddingBottom: Math.max(SPACING.XL, safeArea.paddingBottom),
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveValue(40, 50, 60, 80),
  },
  loginHeaderText: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY,
    position: 'absolute',
    top: getResponsiveValue(-30, -35, -40, -45),
    left: 0,
  },
  logoContainer: {
    width: getResponsiveValue(70, 80, 90, 100),
    height: getResponsiveValue(70, 80, 90, 100),
    borderRadius: layout.borderRadius,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: getResponsiveValue(30, 40, 50, 60),
  },
  logoIcon: {
    width: getResponsiveValue(35, 40, 45, 50),
    height: getResponsiveValue(35, 40, 45, 50),
  },
  dumbbellIcon: {
    width: getResponsiveValue(28, 32, 36, 40),
    height: getResponsiveValue(14, 16, 18, 20),
    backgroundColor: '#FF6B35',
    borderRadius: getResponsiveValue(6, 8, 10, 12),
  },
  loginForm: {
    flex: 1,
  },
  signInText: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY_SMALL,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },
  socialButtons: {
    flexDirection: isSmallMobile() ? 'column' : 'row',
    gap: SPACING.SM,
    marginBottom: SPACING.XL,
  },
  googleButton: {
    flex: isSmallMobile() ? undefined : 1,
    width: isSmallMobile() ? '100%' : undefined,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...getResponsiveButtonStyle(),
    borderRadius: layout.borderRadius,
    gap: SPACING.XS,
  },
  googleButtonText: {
    color: '#333333',
    ...TYPOGRAPHY.BODY,
    fontWeight: '500',
  },
  facebookButton: {
    flex: isSmallMobile() ? undefined : 1,
    width: isSmallMobile() ? '100%' : undefined,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    ...getResponsiveButtonStyle(),
    borderRadius: layout.borderRadius,
    gap: SPACING.XS,
  },
  facebookButtonText: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.BODY,
    fontWeight: '500',
  },
  inputContainer: {
    gap: getFormFieldSpacing(),
    marginBottom: SPACING.XL,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: layout.borderRadius,
    ...getResponsiveInputStyle(),
    gap: SPACING.SM,
  },
  inputIcon: {
    
  },
  input: {
    flex: 1,
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.BODY,
    paddingVertical: SPACING.XXS,
    ...mediaQuery.smallMobile({ fontSize: 16 }), // Evita zoom no iOS
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    ...getResponsiveButtonStyle(),
    minHeight: TOUCH_TARGETS.COMFORTABLE,
    borderRadius: layout.borderRadius,
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  loginButtonText: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.BODY,
    fontWeight: '600',
  },
  registerLink: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY_SMALL,
    textAlign: 'center',
  },
  registerLinkBold: {
    color: FigmaTheme.colors.textPrimary,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginVertical: SPACING.SM,
    minHeight: TOUCH_TARGETS.MIN,
    justifyContent: 'center',
  },
  forgotPasswordText: {
    color: FigmaTheme.colors.primary,
    ...TYPOGRAPHY.BODY_SMALL,
    fontWeight: '500',
  },
  userTypeSection: {
    marginTop: SPACING.LG,
    alignItems: 'center',
  },
  userTypeTitle: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.CAPTION,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: SPACING.XS,
    justifyContent: 'center',
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: getResponsiveValue(6, 8, 10, 12),
    paddingVertical: SPACING.XS,
    paddingHorizontal: SPACING.SM,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: SPACING.XXS,
    minHeight: TOUCH_TARGETS.MIN * 0.8,
  },
  userTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  userTypeButtonText: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.CAPTION,
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  testAccountsSection: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.SM,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderRadius: layout.borderRadius,
    padding: SPACING.SM,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  testAccountsTitle: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.CAPTION,
    fontWeight: '500',
    marginBottom: SPACING.XS,
    textAlign: 'center',
  },
  testAccountButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: getResponsiveValue(4, 6, 8, 10),
    paddingVertical: SPACING.XXS,
    paddingHorizontal: SPACING.XS,
    marginBottom: SPACING.XXS,
    minHeight: TOUCH_TARGETS.MIN * 0.7,
    justifyContent: 'center',
  },
  testAccountText: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.CAPTION,
    fontWeight: '400',
    textAlign: 'center',
  },
});

// Adicionar validação para setValue
function setValue(field: string, value: string) {
  // Esta função deveria vir do react-hook-form
  console.warn('setValue não está implementada corretamente');
}
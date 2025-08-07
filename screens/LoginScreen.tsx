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
  },
  loadingText: {
    marginTop: FigmaTheme.spacing.md,
    color: FigmaTheme.colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  loginHeaderText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    position: 'absolute',
    top: -40,
    left: 0,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  logoIcon: {
    width: 40,
    height: 40,
  },
  dumbbellIcon: {
    width: 32,
    height: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 8,
  },
  loginForm: {
    flex: 1,
  },
  signInText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  googleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 16,
    fontWeight: '500',
  },
  facebookButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1877F2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  facebookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputIcon: {
    
  },
  input: {
    flex: 1,
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 4,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  registerLink: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  registerLinkBold: {
    color: FigmaTheme.colors.textPrimary,
    fontWeight: '600',
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  forgotPasswordText: {
    color: FigmaTheme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  userTypeSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  userTypeTitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 8,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  userTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  userTypeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  userTypeButtonText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  userTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  testAccountsSection: {
    marginTop: 20,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  testAccountsTitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'center',
  },
  testAccountButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 6,
  },
  testAccountText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '400',
    textAlign: 'center',
  },
});
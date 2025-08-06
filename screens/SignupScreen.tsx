import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity
} from 'react-native';
import { Text } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import { AuthStackNavigationProp } from '../types/navigation';

const signupSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('Nome é obrigatório')
    .min(2, 'Nome deve ter pelo menos 2 caracteres'),
  lastName: yup
    .string()
    .required('Sobrenome é obrigatório')
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  email: yup
    .string()
    .email('Email inválido')
    .required('Email é obrigatório'),
  password: yup
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .required('Senha é obrigatória'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Senhas não coincidem')
    .required('Confirmação de senha é obrigatória'),
});

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type UserType = 'personal' | 'student';

interface SignupScreenProps {
  navigation: AuthStackNavigationProp;
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  const { signUpWithEmail } = useAuth();
  const { setUserType } = useUserType();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>('student');
  
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: yupResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSignup = async (data: SignupFormData) => {
    try {
      const success = await signUpWithEmail(data);
      if (success) {
        // Definir tipo de usuário após cadastro bem-sucedido
        await setUserType(selectedUserType);
      } else {
        Alert.alert(
          'Erro no Cadastro',
          'Não foi possível criar sua conta. Verifique os dados e tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro',
        'Ocorreu um erro inesperado. Tente novamente.',
        [{ text: 'OK' }]
      );
    }
  };

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
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={FigmaTheme.colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Criar Conta</Text>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <View style={styles.dumbbellIcon} />
            </View>
          </View>
        </View>

        {/* Signup Form */}
        <View style={styles.signupForm}>
          <Text style={styles.welcomeText}>Junte-se ao TreinosApp</Text>
          <Text style={styles.subtitleText}>Preencha os dados para criar sua conta</Text>
          

          {/* Nome e Sobrenome */}
          <View style={styles.nameRow}>
            <Controller
              control={control}
              name="firstName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome"
                    placeholderTextColor="#666"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
            
            <Controller
              control={control}
              name="lastName"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Ionicons name="person" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Sobrenome"
                    placeholderTextColor="#666"
                    value={value}
                    onChangeText={onChange}
                    autoCapitalize="words"
                  />
                </View>
              )}
            />
          </View>
          
          {/* Mostrar erros de nome */}
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName.message}</Text>
          )}
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName.message}</Text>
          )}

          {/* Email */}
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Ionicons name="mail" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email.message}</Text>
          )}
          
          {/* Senha */}
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Senha"
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
          {errors.password && (
            <Text style={styles.errorText}>{errors.password.message}</Text>
          )}
          
          {/* Confirmar Senha */}
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputGroup}>
                <Ionicons name="lock-closed" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar Senha"
                  placeholderTextColor="#666"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
              </View>
            )}
          />
          {errors.confirmPassword && (
            <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>
          )}
          
          {/* Botão de Cadastro */}
          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={handleSubmit(handleSignup) as any}
            disabled={isSubmitting}
          >
            <Text style={styles.signupButtonText}>
              {isSubmitting ? "Criando conta..." : "Criar Conta"}
            </Text>
          </TouchableOpacity>
          
          {/* Link para login */}
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>
              Já tem uma conta? <Text style={styles.loginLinkBold}>Fazer Login</Text>
            </Text>
          </TouchableOpacity>
          
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
    position: 'absolute',
    top: 10,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
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
  signupForm: {
    flex: 1,
  },
  welcomeText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputIcon: {
    
  },
  input: {
    flex: 1,
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 4,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  signupButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  loginLinkBold: {
    color: FigmaTheme.colors.textPrimary,
    fontWeight: '600',
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
});
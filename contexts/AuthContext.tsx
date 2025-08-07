import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getWebClientId } from '../config/googleSignIn';
import { googleAuthService } from '../treinosapp-mobile/services/GoogleAuthService';
import { supabaseService } from '../treinosapp-mobile/services/SupabaseService';
import { User as SupabaseUser } from '../treinosapp-mobile/types/database';
import { supabase } from '../treinosapp-mobile/lib/supabase';

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  givenName?: string;
  familyName?: string;
  user_type?: 'STUDENT' | 'PERSONAL_TRAINER';
  email_verified?: boolean;
  trainer_id?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (userData: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
  supabaseUser: SupabaseUser | null;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (updates: any) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Inicializar Supabase Auth
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        // Configurar Google Sign-In
        await googleAuthService.configure({
          webClientId: getWebClientId(),
          offlineAccess: true,
          hostedDomain: '',
          forceCodeForRefreshToken: true,
        });

        // Inicializar Supabase Service
        await supabaseService.initialize();

        // Setup Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (__DEV__) console.log('🔐 Auth State Change:', event, session?.user?.id);
            
            if (!mounted) return;
            
            if (event === 'SIGNED_IN' && session?.user) {
              const profile = await supabaseService.getUserProfile(session.user.id);
              if (profile && mounted) {
                setSupabaseUser(profile);
                const compatibleUser = convertSupabaseUserToCompatible(profile);
                setUser(compatibleUser);
                await AsyncStorage.setItem('@user', JSON.stringify(compatibleUser));
                
                // Auto-set user type in legacy context for compatibility
                if (profile.user_type) {
                  const legacyUserType = profile.user_type === 'PERSONAL_TRAINER' ? 'personal' : 'student';
                  await AsyncStorage.setItem('@TreinosApp:userType', legacyUserType);
                }
              }
            } else if (event === 'SIGNED_OUT') {
              if (mounted) {
                setUser(null);
                setSupabaseUser(null);
                await AsyncStorage.removeItem('@user');
                await AsyncStorage.removeItem('@TreinosApp:userType');
              }
            }
            
            if (mounted) {
              setIsLoading(false);
              if (!authInitialized) {
                setAuthInitialized(true);
              }
            }
          }
        );

        // Check initial session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const profile = await supabaseService.getUserProfile(session.user.id);
          if (profile) {
            setSupabaseUser(profile);
            const compatibleUser = convertSupabaseUserToCompatible(profile);
            setUser(compatibleUser);
          }
        }

        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }

        // Cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        if (__DEV__) console.error('Auth initialization error:', error);
        if (mounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // Helper function to convert Supabase User to compatible format
  const convertSupabaseUserToCompatible = (supabaseUser: SupabaseUser): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.name,
      email: supabaseUser.email,
      photo: supabaseUser.profile_picture || undefined,
      user_type: supabaseUser.user_type,
      email_verified: supabaseUser.email_verified,
      trainer_id: supabaseUser.trainer_id,
    };
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use enhanced Google Auth Service
      const result = await googleAuthService.signIn('STUDENT'); // Default to student
      
      if (result.success && result.user) {
        if (__DEV__) {
          console.log('✅ Google Sign-In successful:', {
            email: result.user.email,
            userType: result.user.user_type,
            needsProfile: result.needsProfileCompletion
          });
        }
        
        // User state will be updated via auth state listener
        return true;
      } else {
        if (__DEV__) console.log('❌ Google Sign-In failed:', result.error);
        
        // Fallback to original implementation for development
        return await fallbackGoogleSignIn();
      }
    } catch (error: any) {
      if (__DEV__) console.log('Erro no login Google:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fallback Google Sign-In for development/testing
  const fallbackGoogleSignIn = async (): Promise<boolean> => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      
      if (!userInfo.data?.user) {
        return false;
      }
      
      const googleUser = userInfo.data.user;
      const userData: User = {
        id: googleUser.id,
        name: googleUser.name || '',
        email: googleUser.email,
        photo: googleUser.photo || undefined,
        givenName: googleUser.givenName || undefined,
        familyName: googleUser.familyName || undefined,
      };

      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      
      return true;
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        if (__DEV__) console.log('Login cancelado pelo usuário');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        if (__DEV__) console.log('Login já em progresso');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        if (__DEV__) console.log('Google Play Services não disponível');
      } else {
        if (__DEV__) console.log('Erro desconhecido:', error);
      }
      
      return false;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Use real Supabase authentication
      const response = await supabaseService.signInWithEmail(email, password);
      
      if (response.success && response.user) {
        // User state will be updated via auth state listener
        if (__DEV__) console.log('✅ Supabase login successful:', response.user.email);
        return true;
      } else {
        if (__DEV__) console.log('❌ Supabase login failed:', response.error);
        
        // Fallback to mock system for development/testing
        const mockResponse = await simulateEmailLogin(email, password);
        if (mockResponse.success && mockResponse.user) {
          const userData: User = {
            id: mockResponse.user.id,
            name: mockResponse.user.name,
            email: mockResponse.user.email,
            photo: mockResponse.user.photo || undefined,
            user_type: mockResponse.user.userType === 'personal' ? 'PERSONAL_TRAINER' : 'STUDENT',
          };

          setUser(userData);
          await AsyncStorage.setItem('@user', JSON.stringify(userData));
          
          // Set legacy user type for compatibility
          if (mockResponse.user.userType) {
            await AsyncStorage.setItem('@TreinosApp:userType', mockResponse.user.userType);
            if (__DEV__) console.log(`🎯 Mock user type set: ${mockResponse.user.userType}`);
          }
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      if (__DEV__) console.log('Erro no login com email:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { email, password, firstName, lastName, userType, trainerEmail } = userData;
      const fullName = `${firstName} ${lastName}`;
      
      let response;
      
      // Use real Supabase authentication
      if (userType === 'personal' || userType === 'PERSONAL_TRAINER') {
        response = await supabaseService.signUpTrainer(email, password, fullName);
      } else {
        response = await supabaseService.signUpStudent(email, password, fullName, trainerEmail);
      }
      
      if (response.success) {
        if (__DEV__) {
          console.log('✅ Supabase signup successful:', response.user?.email);
          if (response.needsEmailVerification) {
            console.log('📧 Email verification required');
          }
        }
        return true;
      } else {
        if (__DEV__) console.log('❌ Supabase signup failed:', response.error);
        
        // Fallback to mock system for development/testing
        const mockResponse = await simulateEmailSignup(userData);
        if (mockResponse.success && mockResponse.user) {
          const newUser: User = {
            id: mockResponse.user.id,
            name: fullName,
            email: email,
            user_type: userType === 'personal' ? 'PERSONAL_TRAINER' : 'STUDENT',
          };

          setUser(newUser);
          await AsyncStorage.setItem('@user', JSON.stringify(newUser));
          
          // Set legacy user type for compatibility
          await AsyncStorage.setItem('@TreinosApp:userType', userType);
          
          return true;
        }
      }
      
      return false;
    } catch (error) {
      if (__DEV__) console.log('Erro no cadastro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      if (__DEV__) console.log('🚪 AuthContext - Iniciando processo de logout...');
      setIsLoading(true);
      
      // Logout do Supabase primeiro
      try {
        await supabaseService.signOut();
        if (__DEV__) console.log('✅ AuthContext - Supabase SignOut realizado');
      } catch (error) {
        if (__DEV__) console.log('⚠️ AuthContext - Supabase SignOut error:', error);
      }
      
      // Logout do Google usando Google Auth Service
      try {
        await googleAuthService.signOut();
        if (__DEV__) console.log('✅ AuthContext - Google SignOut realizado');
      } catch (error) {
        if (__DEV__) console.log('⚠️ AuthContext - Google SignOut não necessário:', error);
      }
      
      // Limpar estado local
      setUser(null);
      setSupabaseUser(null);
      
      // Limpar AsyncStorage
      await AsyncStorage.removeItem('@user');
      await AsyncStorage.removeItem('@TreinosApp:userType');
      
      // Limpar dados de fitness também para garantir logout completo
      const fitnessKeys = [
        'fitness_usuario',
        'fitness_treinos', 
        'fitness_exercicios',
        'fitness_series',
        'fitness_progresso',
        'fitness_estatisticas',
        'fitness_templates',
        'fitness_metas',
        'fitness_fila_sincronizacao',
        'fitness_backup',
        'fitness_metadata'
      ];
      
      for (const key of fitnessKeys) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (keyError) {
          if (__DEV__) console.warn(`⚠️ AuthContext - Erro ao remover ${key}:`, keyError);
        }
      }
      
      if (__DEV__) console.log('✅ AuthContext - Logout realizado com sucesso');
      
    } catch (error) {
      console.error('❌ AuthContext - Erro crítico durante logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // New methods for enhanced functionality
  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'com.treinosapp://auth/reset-password'
      });
      
      if (error) {
        if (__DEV__) console.error('Reset password error:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      if (__DEV__) console.error('Reset password error:', error);
      return false;
    }
  };

  const updateProfile = async (updates: any): Promise<boolean> => {
    try {
      if (!supabaseUser?.id) {
        return false;
      }
      
      const success = await supabaseService.updateProfile(supabaseUser.id, updates);
      
      if (success) {
        // Refresh user profile
        const updatedProfile = await supabaseService.getUserProfile(supabaseUser.id);
        if (updatedProfile) {
          setSupabaseUser(updatedProfile);
          const compatibleUser = convertSupabaseUserToCompatible(updatedProfile);
          setUser(compatibleUser);
          await AsyncStorage.setItem('@user', JSON.stringify(compatibleUser));
        }
      }
      
      return success;
    } catch (error) {
      if (__DEV__) console.error('Update profile error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isSignedIn: !!user,
    supabaseUser,
    resetPassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Funções de simulação de API (substituir por chamadas reais)
async function simulateEmailLogin(email: string, password: string) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Contas de teste pré-definidas
  const testAccounts = [
    {
      email: 'personal@teste.com',
      password: '123456',
      user: {
        id: 'personal_001',
        name: 'Carlos Silva',
        email: 'personal@teste.com',
        photo: undefined,
        userType: 'personal'
      }
    },
    {
      email: 'aluno@teste.com', 
      password: '123456',
      user: {
        id: 'student_001',
        name: 'Maria Santos',
        email: 'aluno@teste.com',
        photo: undefined,
        userType: 'student'
      }
    },
    {
      email: 'teste@teste.com',
      password: '123456',
      user: {
        id: 'user_001',
        name: 'Usuário Teste',
        email: 'teste@teste.com',
        photo: undefined,
        userType: 'student'
      }
    }
  ];
  
  // Buscar conta correspondente
  const account = testAccounts.find(acc => 
    acc.email === email && acc.password === password
  );
  
  if (account) {
    if (__DEV__) console.log(`✅ Login realizado: ${account.user.name} (${account.user.userType})`);
    return {
      success: true,
      user: account.user
    };
  }
  
  // Simular credenciais inválidas
  if (__DEV__) console.log('❌ Credenciais inválidas para:', email);
  return { success: false, error: 'Credenciais inválidas' };
}

async function simulateEmailSignup(userData: any) {
  // Simular delay de rede
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Simular verificação de email existente
  if (userData.email === 'existente@teste.com') {
    return { success: false, error: 'Email já cadastrado' };
  }
  
  // Simular cadastro bem-sucedido
  return {
    success: true,
    user: {
      id: Date.now().toString(),
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
      photo: undefined,
    }
  };
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
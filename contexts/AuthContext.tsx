import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { getWebClientId } from '../config/googleSignIn';

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
  givenName?: string;
  familyName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (userData: any) => Promise<boolean>;
  signOut: () => Promise<void>;
  isSignedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Configurar Google Sign-In
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: getWebClientId(),
      offlineAccess: true,
      hostedDomain: '',
      forceCodeForRefreshToken: true,
    });

    checkSignInStatus();
  }, []);

  const checkSignInStatus = async () => {
    try {
      setIsLoading(true);
      
      // Verificar se há usuário salvo no AsyncStorage
      const savedUser = await AsyncStorage.getItem('@user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
        setIsLoading(false);
        return;
      }

      // Verificar se o usuário está logado com Google
      const isSignedIn = await GoogleSignin.getCurrentUser() !== null;
      if (isSignedIn) {
        const userInfo = await GoogleSignin.getCurrentUser();
        if (userInfo) {
          const userData: User = {
            id: userInfo.user.id,
            name: userInfo.user.name || '',
            email: userInfo.user.email,
            photo: userInfo.user.photo || undefined,
            givenName: userInfo.user.givenName || undefined,
            familyName: userInfo.user.familyName || undefined,
          };
          setUser(userData);
          await AsyncStorage.setItem('@user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.log('Erro ao verificar status de login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Verificar se os Google Play Services estão disponíveis
      await GoogleSignin.hasPlayServices();
      
      // Fazer login
      const userInfo = await GoogleSignin.signIn();
      
      const userData: User = {
        id: userInfo.data?.user.id || '',
        name: userInfo.data?.user.name || '',
        email: userInfo.data?.user.email || '',
        photo: userInfo.data?.user.photo || undefined,
        givenName: userInfo.data?.user.givenName || undefined,
        familyName: userInfo.data?.user.familyName || undefined,
      };

      setUser(userData);
      await AsyncStorage.setItem('@user', JSON.stringify(userData));
      
      return true;
    } catch (error: any) {
      console.log('Erro no login:', error);
      
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('Login cancelado pelo usuário');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log('Login já em progresso');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log('Google Play Services não disponível');
      } else {
        console.log('Erro desconhecido:', error);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simular autenticação com email/senha
      // Em produção, fazer chamada para sua API
      const response = await simulateEmailLogin(email, password);
      
      if (response.success && response.user) {
        const userData: User = {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          photo: response.user.photo || undefined,
        };

        setUser(userData);
        await AsyncStorage.setItem('@user', JSON.stringify(userData));
        
        // Definir tipo de usuário automaticamente para contas de teste
        if (response.user.userType) {
          await AsyncStorage.setItem('@TreinosApp:userType', response.user.userType);
          console.log(`🎯 Tipo de usuário definido automaticamente: ${response.user.userType}`);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Erro no login com email:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Simular cadastro com email/senha
      // Em produção, fazer chamada para sua API
      const response = await simulateEmailSignup(userData);
      
      if (response.success && response.user) {
        const newUser: User = {
          id: response.user.id,
          name: `${userData.firstName} ${userData.lastName}`,
          email: userData.email,
        };

        setUser(newUser);
        await AsyncStorage.setItem('@user', JSON.stringify(newUser));
        return true;
      }
      
      return false;
    } catch (error) {
      console.log('Erro no cadastro:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      console.log('🚪 AuthContext - Iniciando processo de logout...');
      setIsLoading(true);
      
      // Fazer logout do Google se necessário
      console.log('🔄 AuthContext - Tentando logout do Google...');
      try {
        await GoogleSignin.signOut();
        console.log('✅ AuthContext - Google SignOut realizado');
      } catch (error) {
        // Google não estava logado, ignorar erro
        console.log('⚠️ AuthContext - Google SignOut não necessário:', error);
      }
      
      // Limpar dados locais
      console.log('🧹 AuthContext - Limpando dados do usuário...');
      setUser(null);
      console.log('👤 AuthContext - User state definido como null');
      
      await AsyncStorage.removeItem('@user');
      console.log('🗑️ AuthContext - @user removido do AsyncStorage');
      
      // Limpar tipo de usuário também
      console.log('🗑️ AuthContext - Removendo tipo de usuário...');
      await AsyncStorage.removeItem('@TreinosApp:userType');
      console.log('🗑️ AuthContext - @TreinosApp:userType removido do AsyncStorage');
      
      // Limpar dados de fitness também para garantir logout completo
      console.log('💪 AuthContext - Iniciando limpeza de dados de fitness...');
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
          console.log(`🗑️ AuthContext - Removido: ${key}`);
        } catch (keyError) {
          console.warn(`⚠️ AuthContext - Erro ao remover ${key}:`, keyError);
        }
      }
      
      console.log('✅ AuthContext - Logout realizado com sucesso - todos os dados limpos');
      console.log('🔄 AuthContext - Processo de logout concluído, aguardando redirecionamento...');
      
    } catch (error) {
      console.error('❌ AuthContext - Erro crítico durante logout:', error);
      throw error; // Re-throw para o ProfileScreen detectar
    } finally {
      console.log('🔄 AuthContext - Definindo isLoading como false');
      setIsLoading(false);
      console.log('✅ AuthContext - signOut function completamente finalizada');
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
    console.log(`✅ Login realizado: ${account.user.name} (${account.user.userType})`);
    return {
      success: true,
      user: account.user
    };
  }
  
  // Simular credenciais inválidas
  console.log('❌ Credenciais inválidas para:', email);
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
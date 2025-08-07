import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserType = 'personal' | 'student' | null;

interface UserTypeContextData {
  userType: UserType;
  setUserType: (type: UserType) => void;
  isPersonal: boolean;
  isStudent: boolean;
  isLoading: boolean;
}

const UserTypeContext = createContext<UserTypeContextData>({} as UserTypeContextData);

export function UserTypeProvider({ children }: { children: React.ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar tipo de usuário inicial apenas uma vez
  useEffect(() => {
    loadUserType();
  }, []); // Array vazio - executa apenas na montagem

  // Listener separado para detectar mudanças externas
  useEffect(() => {
    // Não iniciar listener se ainda está carregando
    if (isLoading) return;

    const interval = setInterval(async () => {
      try {
        const storedUserType = await AsyncStorage.getItem('@TreinosApp:userType');
        const currentType = storedUserType as UserType;
        
        // Se o tipo armazenado é diferente do estado atual, atualizar
        // Usar callback para evitar dependência direta
        setUserTypeState(prevType => {
          if (currentType !== prevType) {
            console.log('🔄 Tipo de usuário alterado externamente:', { 
              antes: prevType, 
              depois: currentType,
              timestamp: new Date().toISOString()
            });
            return currentType;
          }
          return prevType;
        });
      } catch (error) {
        console.log('❌ Erro ao verificar tipo de usuário:', error);
      }
    }, 2000); // Reduzir frequência para 2 segundos
    
    return () => {
      console.log('🧹 Limpando listener do UserTypeContext');
      clearInterval(interval);
    };
  }, [isLoading]); // Dependência apenas do isLoading

  const loadUserType = async () => {
    try {
      const storedUserType = await AsyncStorage.getItem('@TreinosApp:userType');
      if (storedUserType) {
        setUserTypeState(storedUserType as UserType);
        console.log('📱 Tipo de usuário carregado:', storedUserType);
      } else {
        console.log('📱 Nenhum tipo de usuário encontrado');
        setUserTypeState(null);
      }
    } catch (error) {
      console.log('❌ Erro ao carregar tipo de usuário:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setUserType = useCallback(async (type: UserType) => {
    try {
      setUserTypeState(type);
      if (type) {
        await AsyncStorage.setItem('@TreinosApp:userType', type);
        console.log('✅ Tipo de usuário salvo:', type);
      } else {
        await AsyncStorage.removeItem('@TreinosApp:userType');
        console.log('🗑️ Tipo de usuário removido');
      }
    } catch (error) {
      console.log('❌ Erro ao salvar tipo de usuário:', error);
    }
  }, []);

  const value: UserTypeContextData = useMemo(() => ({
    userType,
    setUserType,
    isPersonal: userType === 'personal',
    isStudent: userType === 'student',
    isLoading,
  }), [userType, setUserType, isLoading]);

  return (
    <UserTypeContext.Provider value={value}>
      {children}
    </UserTypeContext.Provider>
  );
}

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error('useUserType deve ser usado dentro de UserTypeProvider');
  }
  return context;
}
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import UserTypeSelectionScreen from '../screens/UserTypeSelectionScreen';
import AppNavigator from './AppNavigator';
import { DesignTokens } from '../constants/designTokens';
import { AuthStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { isSignedIn, isLoading: authLoading } = useAuth();
  const { userType, isLoading: userTypeLoading, setUserType } = useUserType();

  // Log do estado atual para debug
  console.log('🧭 RootNavigator - Estado atual:', {
    isSignedIn,
    userType,
    authLoading,
    userTypeLoading
  });

  // Mostrar loading enquanto verifica autenticação e tipo de usuário
  if (authLoading || userTypeLoading) {
    console.log('⏳ RootNavigator - Mostrando tela de loading');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        // Usuário logado
        userType ? (
          // Tipo selecionado - mostrar app principal
          <>
            {console.log('✅ RootNavigator - Redirecionando para App principal')}
            <Stack.Screen name="App" component={AppNavigator} />
          </>
        ) : (
          // Tipo não selecionado - mostrar seleção
          <>
            {console.log('🎯 RootNavigator - Redirecionando para seleção de tipo')}
            <Stack.Screen 
              name="UserTypeSelection" 
              children={(props) => (
                <UserTypeSelectionScreen 
                  {...props} 
                  onSelectUserType={setUserType}
                />
              )}
            />
          </>
        )
      ) : (
        // Usuário não logado - mostrar telas de autenticação
        <>
          {console.log('🔐 RootNavigator - Redirecionando para telas de login')}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DesignTokens.colors.background,
  },
  loadingText: {
    marginTop: DesignTokens.spacing.md,
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.fontSize.base,
  },
});
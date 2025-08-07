import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import { profileService } from '../treinosapp-mobile/services/ProfileService';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ProfileCompletionScreen from '../screens/ProfileCompletionScreen';
import UserTypeSelectionScreen from '../screens/UserTypeSelectionScreen';
import AppNavigator from './AppNavigator';
import { DesignTokens } from '../constants/designTokens';
import { AuthStackParamList } from '../types/navigation';

const Stack = createStackNavigator<AuthStackParamList>();

export default function RootNavigator() {
  const { isSignedIn, isLoading: authLoading, supabaseUser } = useAuth();
  const { userType, isLoading: userTypeLoading, setUserType } = useUserType();
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(false);

  // Check profile completion when user is signed in
  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!isSignedIn || !supabaseUser?.id || authLoading) {
        setProfileComplete(null);
        return;
      }

      setCheckingProfile(true);
      try {
        const isComplete = await profileService.isProfileComplete(supabaseUser.id);
        setProfileComplete(isComplete);
        
        if (__DEV__) {
          console.log('🎯 Profile completion check:', {
            userId: supabaseUser.id,
            isComplete,
            userType: supabaseUser.user_type
          });
        }
      } catch (error) {
        if (__DEV__) console.error('Profile completion check error:', error);
        setProfileComplete(false); // Default to incomplete on error
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileCompletion();
  }, [isSignedIn, supabaseUser?.id, authLoading]);

  // Handle profile completion
  const handleProfileComplete = () => {
    setProfileComplete(true);
  };

  // Log do estado atual para debug
  console.log('🧭 RootNavigator - Estado atual:', {
    isSignedIn,
    userType,
    authLoading,
    userTypeLoading,
    profileComplete,
    checkingProfile,
    userId: supabaseUser?.id
  });

  // Mostrar loading enquanto verifica autenticação, tipo de usuário e perfil
  if (authLoading || userTypeLoading || checkingProfile) {
    console.log('⏳ RootNavigator - Mostrando tela de loading');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DesignTokens.colors.primary} />
        <Text style={styles.loadingText}>
          {checkingProfile ? 'Verificando perfil...' : 'Carregando...'}
        </Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        // Usuário logado
        userType ? (
          // Tipo selecionado - verificar se perfil está completo
          profileComplete ? (
            // Perfil completo - mostrar app principal
            <>
              {console.log('✅ RootNavigator - Redirecionando para App principal')}
              <Stack.Screen name="App" component={AppNavigator} />
            </>
          ) : (
            // Perfil incompleto - mostrar completar perfil
            <>
              {console.log('📝 RootNavigator - Redirecionando para completar perfil')}
              <Stack.Screen 
                name="ProfileCompletion" 
                children={(props) => (
                  <ProfileCompletionScreen 
                    {...props} 
                    onComplete={handleProfileComplete}
                  />
                )}
              />
            </>
          )
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
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
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
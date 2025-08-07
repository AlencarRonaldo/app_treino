import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from './contexts/AuthContext';
import { UserTypeProvider } from './contexts/UserTypeContext';
import { FitnessProvider } from './contexts/FitnessContext';
import { RealtimeProvider } from './contexts/RealtimeContext';
import RootNavigator from './navigation/RootNavigator';
import { theme } from './constants/theme';
import { useRenderDebug } from './utils/debugRenderLoop';

export default function App() {
  // Debug para detectar loops de renderização
  if (__DEV__) {
    useRenderDebug('App');
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <UserTypeProvider>
              <FitnessProvider>
                <RealtimeProvider>
                  <NavigationContainer>
                    <StatusBar style="auto" />
                    <RootNavigator />
                  </NavigationContainer>
                </RealtimeProvider>
              </FitnessProvider>
            </UserTypeProvider>
          </AuthProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
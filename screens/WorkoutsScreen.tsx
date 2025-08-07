import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { usePermissions } from '../hooks/usePermissions';
import { useUserType } from '../contexts/UserTypeContext';
import TrainerWorkoutsScreen from './pt/TrainerWorkoutsScreen';
import StudentWorkoutsScreen from './student/StudentWorkoutsScreen';

/**
 * WorkoutsScreen - Tela Principal de Treinos com Diferenciação de Usuário
 * 
 * Esta tela implementa a Task 12.4 - Área de Treinos Diferenciada
 * Redireciona para interfaces específicas baseadas no tipo de usuário:
 * 
 * - Personal Trainers: Interface de gestão profissional (TrainerWorkoutsScreen)
 * - Alunos: Interface simplificada focada em execução (StudentWorkoutsScreen)
 */
export default function WorkoutsScreen() {
  const { isPersonalTrainer, isStudent, userType, isLoading } = useUserType();
  
  console.log('📋 WorkoutsScreen - Tipo de usuário:', userType);
  console.log('📋 WorkoutsScreen - Personal Trainer:', isPersonalTrainer);
  console.log('📋 WorkoutsScreen - Student:', isStudent);

  // Loading state enquanto determina o tipo de usuário
  if (isLoading) {
    return (
      <FigmaScreen>
        <View style={styles.loadingContainer}>
          <Ionicons name="barbell" size={64} color="#FF6B35" />
          <Text style={styles.loadingTitle}>TreinosApp</Text>
          <Text style={styles.loadingText}>Carregando interface...</Text>
        </View>
      </FigmaScreen>
    );
  }

  // Redirecionar para interface específica baseada no tipo de usuário
  if (isPersonalTrainer) {
    console.log('📋 Redirecionando para TrainerWorkoutsScreen');
    return <TrainerWorkoutsScreen />;
  }

  if (isStudent) {
    console.log('📋 Redirecionando para StudentWorkoutsScreen');
    return <StudentWorkoutsScreen />;
  }

  // Fallback caso o tipo de usuário não seja determinado
  return (
    <FigmaScreen>
      <View style={styles.errorContainer}>
        <Ionicons name="warning" size={64} color="#FFB800" />
        <Text style={styles.errorTitle}>Tipo de Usuário Indefinido</Text>
        <Text style={styles.errorDescription}>
          Não foi possível determinar seu tipo de usuário. 
          Por favor, faça logout e entre novamente.
        </Text>
      </View>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  // Loading States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
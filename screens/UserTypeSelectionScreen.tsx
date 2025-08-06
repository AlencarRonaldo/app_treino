import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { AuthStackNavigationProp } from '../types/navigation';

interface UserTypeSelectionScreenProps {
  navigation: AuthStackNavigationProp;
  onSelectUserType: (userType: 'personal' | 'student') => void;
}

export default function UserTypeSelectionScreen({ navigation, onSelectUserType }: UserTypeSelectionScreenProps) {
  
  const handleSelectPersonal = () => {
    onSelectUserType('personal');
    navigation.navigate('Home');
  };

  const handleSelectStudent = () => {
    onSelectUserType('student'); 
    navigation.navigate('Home');
  };

  return (
    <FigmaScreen>
      <StatusBar style="light" />
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <View style={styles.dumbbellIcon} />
            </View>
          </View>
          <Text style={styles.title}>TreinosApp</Text>
          <Text style={styles.subtitle}>Como você quer usar o aplicativo?</Text>
        </View>

        {/* User Type Options */}
        <View style={styles.optionsContainer}>
          
          {/* Personal/Academia Option */}
          <TouchableOpacity style={styles.optionCard} onPress={handleSelectPersonal}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="fitness" size={32} color="#FF6B35" />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Personal/Academia</Text>
              <Text style={styles.optionDescription}>
                Crie treinos personalizados, gerencie alunos e monitore o progresso de cada um
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00D632" />
                  <Text style={styles.featureText}>Criar treinos para alunos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00D632" />
                  <Text style={styles.featureText}>Gerenciar múltiplos alunos</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00D632" />
                  <Text style={styles.featureText}>Acompanhar progresso</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.optionArrow}>
              <Ionicons name="chevron-forward" size={24} color={FigmaTheme.colors.textSecondary} />
            </View>
          </TouchableOpacity>

          {/* Aluno Option */}
          <TouchableOpacity style={styles.optionCard} onPress={handleSelectStudent}>
            <View style={styles.optionIconContainer}>
              <Ionicons name="person" size={32} color="#FF6B35" />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Aluno</Text>
              <Text style={styles.optionDescription}>
                Acesse seus treinos criados pelo personal, registre progresso e acompanhe evolução
              </Text>
              
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00D632" />
                  <Text style={styles.featureText}>Ver treinos do personal</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00D632" />
                  <Text style={styles.featureText}>Registrar execução</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00D632" />
                  <Text style={styles.featureText}>Acompanhar evolução</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.optionArrow}>
              <Ionicons name="chevron-forward" size={24} color={FigmaTheme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Você pode alterar esta configuração depois nas configurações do aplicativo
          </Text>
        </View>

      </View>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  optionsContainer: {
    flex: 1,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  optionIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  optionArrow: {
    marginLeft: 8,
    marginTop: 8,
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
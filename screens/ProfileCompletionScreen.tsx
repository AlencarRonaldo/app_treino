import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

import { DesignTokens } from '../constants/designTokens';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { profileService, ProfileCompletionData } from '../treinosapp-mobile/services/ProfileService';
import SafeContainer from '../components/SafeContainer';

interface ProfileCompletionScreenProps {
  onComplete: () => void;
}

export default function ProfileCompletionScreen({ onComplete }: ProfileCompletionScreenProps) {
  const { user, supabaseUser, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data
  const [profileData, setProfileData] = useState<ProfileCompletionData>({
    height: undefined,
    weight: undefined,
    birth_date: undefined,
    gender: undefined,
    fitness_level: undefined,
    primary_goal: '',
    activity_level: undefined,
    profile_picture: undefined,
  });

  // UI state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthDate, setBirthDate] = useState<Date>(new Date(2000, 0, 1));

  const totalSteps = supabaseUser?.user_type === 'PERSONAL_TRAINER' ? 4 : 3;

  // Check profile completion status
  useEffect(() => {
    checkProfileCompletion();
  }, []);

  const checkProfileCompletion = async () => {
    if (!supabaseUser?.id) return;
    
    try {
      const isComplete = await profileService.isProfileComplete(supabaseUser.id);
      if (isComplete) {
        onComplete();
      }
    } catch (error) {
      if (__DEV__) console.error('Check profile completion error:', error);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1: // Basic info
        if (!profileData.birth_date || !profileData.gender) {
          Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.', [{ text: 'OK' }]);
          return false;
        }
        return true;
      case 2: // Physical info
        if (!profileData.height || !profileData.weight) {
          Alert.alert('Erro', 'Por favor, informe sua altura e peso.', [{ text: 'OK' }]);
          return false;
        }
        return true;
      case 3: // Fitness info
        if (!profileData.fitness_level || !profileData.activity_level) {
          Alert.alert('Erro', 'Por favor, selecione seu nível de condicionamento e atividade.', [{ text: 'OK' }]);
          return false;
        }
        return true;
      case 4: // Goals (optional for students, required for trainers)
        if (supabaseUser?.user_type === 'PERSONAL_TRAINER' && !profileData.primary_goal?.trim()) {
          Alert.alert('Erro', 'Por favor, descreva seu objetivo principal.', [{ text: 'OK' }]);
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    if (!supabaseUser?.id) {
      Alert.alert('Erro', 'Usuário não encontrado. Tente novamente.', [{ text: 'OK' }]);
      return;
    }

    setIsLoading(true);
    try {
      const success = await profileService.completeProfile(supabaseUser.id, profileData);
      
      if (success) {
        // Update local auth context
        await updateProfile(profileData);
        
        Alert.alert(
          'Perfil Completo!',
          'Seu perfil foi completado com sucesso. Bem-vindo ao TreinosApp!',
          [{ text: 'OK', onPress: onComplete }]
        );
      } else {
        Alert.alert('Erro', 'Não foi possível completar seu perfil. Tente novamente.', [{ text: 'OK' }]);
      }
    } catch (error) {
      if (__DEV__) console.error('Complete profile error:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.', [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthDate(selectedDate);
      setProfileData({
        ...profileData,
        birth_date: selectedDate.toISOString().split('T')[0]
      });
    }
  };

  const handleProfilePicture = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos da permissão para acessar suas fotos.', [{ text: 'OK' }]);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setProfileData({
          ...profileData,
          profile_picture: result.assets[0].uri
        });
      }
    } catch (error) {
      if (__DEV__) console.error('Profile picture error:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto.', [{ text: 'OK' }]);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informações Básicas</Text>
      <Text style={styles.stepDescription}>
        Conte-nos um pouco sobre você para personalizar sua experiência
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Data de Nascimento *</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateButtonText, !profileData.birth_date && styles.placeholderText]}>
            {profileData.birth_date 
              ? new Date(profileData.birth_date).toLocaleDateString('pt-BR')
              : 'Selecione sua data de nascimento'
            }
          </Text>
          <Ionicons name="calendar-outline" size={20} color={FigmaTheme.colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Gênero *</Text>
        <View style={styles.optionsRow}>
          {[
            { value: 'MALE', label: 'Masculino', icon: 'male' },
            { value: 'FEMALE', label: 'Feminino', icon: 'female' },
            { value: 'OTHER', label: 'Outro', icon: 'transgender' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                profileData.gender === option.value && styles.optionButtonActive
              ]}
              onPress={() => setProfileData({ ...profileData, gender: option.value as any })}
            >
              <Ionicons 
                name={option.icon as any} 
                size={20} 
                color={profileData.gender === option.value ? FigmaTheme.colors.white : FigmaTheme.colors.primary} 
              />
              <Text style={[
                styles.optionButtonText,
                profileData.gender === option.value && styles.optionButtonTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
          minimumDate={new Date(1900, 0, 1)}
        />
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informações Físicas</Text>
      <Text style={styles.stepDescription}>
        Essas informações nos ajudam a personalizar seus treinos
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Altura (cm) *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={profileData.height?.toString() || ''}
            onChangeText={(text) => setProfileData({ 
              ...profileData, 
              height: parseInt(text) || undefined 
            })}
            placeholder="170"
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.inputUnit}>cm</Text>
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Peso (kg) *</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={profileData.weight?.toString() || ''}
            onChangeText={(text) => setProfileData({ 
              ...profileData, 
              weight: parseInt(text) || undefined 
            })}
            placeholder="70"
            keyboardType="numeric"
            maxLength={3}
          />
          <Text style={styles.inputUnit}>kg</Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Nível de Condicionamento</Text>
      <Text style={styles.stepDescription}>
        Isso nos ajuda a recomendar treinos adequados para você
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Seu nível atual *</Text>
        <View style={styles.optionsColumn}>
          {[
            { value: 'BEGINNER', label: 'Iniciante', desc: 'Pouca ou nenhuma experiência' },
            { value: 'INTERMEDIATE', label: 'Intermediário', desc: 'Já treino há alguns meses' },
            { value: 'ADVANCED', label: 'Avançado', desc: 'Treino há mais de 1 ano' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.levelOption,
                profileData.fitness_level === option.value && styles.levelOptionActive
              ]}
              onPress={() => setProfileData({ ...profileData, fitness_level: option.value as any })}
            >
              <View style={styles.levelOptionContent}>
                <Text style={[
                  styles.levelOptionTitle,
                  profileData.fitness_level === option.value && styles.levelOptionTitleActive
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.levelOptionDesc,
                  profileData.fitness_level === option.value && styles.levelOptionDescActive
                ]}>
                  {option.desc}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Nível de atividade *</Text>
        <View style={styles.optionsColumn}>
          {[
            { value: 'SEDENTARY', label: 'Sedentário', desc: 'Pouco ou nenhum exercício' },
            { value: 'LIGHTLY_ACTIVE', label: 'Levemente ativo', desc: '1-3 dias por semana' },
            { value: 'MODERATELY_ACTIVE', label: 'Moderadamente ativo', desc: '3-5 dias por semana' },
            { value: 'VERY_ACTIVE', label: 'Muito ativo', desc: '6-7 dias por semana' },
            { value: 'EXTREMELY_ACTIVE', label: 'Extremamente ativo', desc: '2x por dia, treinos intensos' }
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.levelOption,
                profileData.activity_level === option.value && styles.levelOptionActive
              ]}
              onPress={() => setProfileData({ ...profileData, activity_level: option.value as any })}
            >
              <View style={styles.levelOptionContent}>
                <Text style={[
                  styles.levelOptionTitle,
                  profileData.activity_level === option.value && styles.levelOptionTitleActive
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.levelOptionDesc,
                  profileData.activity_level === option.value && styles.levelOptionDescActive
                ]}>
                  {option.desc}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Seus Objetivos</Text>
      <Text style={styles.stepDescription}>
        {supabaseUser?.user_type === 'PERSONAL_TRAINER' 
          ? 'Como personal trainer, qual é seu foco principal?'
          : 'Qual é seu principal objetivo? (opcional)'
        }
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>
          Objetivo Principal {supabaseUser?.user_type === 'PERSONAL_TRAINER' ? '*' : ''}
        </Text>
        <TextInput
          style={styles.textAreaInput}
          value={profileData.primary_goal}
          onChangeText={(text) => setProfileData({ ...profileData, primary_goal: text })}
          placeholder={
            supabaseUser?.user_type === 'PERSONAL_TRAINER'
              ? 'Ex: Ajudar meus alunos a alcançarem seus objetivos de forma segura e eficiente'
              : 'Ex: Perder peso, ganhar massa muscular, melhorar condicionamento...'
          }
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      {/* Profile Picture - Optional */}
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>Foto de Perfil (opcional)</Text>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={handleProfilePicture}
        >
          <Ionicons name="camera-outline" size={24} color={FigmaTheme.colors.primary} />
          <Text style={styles.photoButtonText}>
            {profileData.profile_picture ? 'Alterar foto' : 'Adicionar foto'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <SafeContainer style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Complete seu Perfil</Text>
            <Text style={styles.subtitle}>
              Etapa {currentStep} de {totalSteps}
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${(currentStep / totalSteps) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Current Step Content */}
          {renderCurrentStep()}
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={handleBack}
            disabled={currentStep === 1}
          >
            <Ionicons 
              name="arrow-back" 
              size={20} 
              color={currentStep === 1 ? FigmaTheme.colors.gray400 : FigmaTheme.colors.primary} 
            />
            <Text style={[
              styles.navButtonText, 
              currentStep === 1 && styles.navButtonTextDisabled
            ]}>
              Voltar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading 
                ? 'Salvando...' 
                : currentStep === totalSteps 
                  ? 'Concluir' 
                  : 'Próximo'
              }
            </Text>
            {currentStep < totalSteps && (
              <Ionicons name="arrow-forward" size={20} color={FigmaTheme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.xl,
    paddingBottom: DesignTokens.spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: DesignTokens.typography.fontSize['2xl'],
    fontWeight: DesignTokens.typography.fontWeight.bold,
    color: FigmaTheme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textSecondary,
    marginTop: DesignTokens.spacing.sm,
  },
  progressContainer: {
    width: '100%',
    marginTop: DesignTokens.spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: FigmaTheme.colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: FigmaTheme.colors.primary,
    borderRadius: 4,
  },
  stepContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.xl,
  },
  stepTitle: {
    fontSize: DesignTokens.typography.fontSize.xl,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: FigmaTheme.colors.textPrimary,
    marginBottom: DesignTokens.spacing.sm,
  },
  stepDescription: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textSecondary,
    marginBottom: DesignTokens.spacing.xl,
    lineHeight: 22,
  },
  fieldContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  fieldLabel: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: FigmaTheme.colors.textPrimary,
    marginBottom: DesignTokens.spacing.sm,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
  },
  dateButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textPrimary,
  },
  placeholderText: {
    color: FigmaTheme.colors.gray600,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  optionsColumn: {
    gap: DesignTokens.spacing.sm,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
    paddingVertical: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  optionButtonActive: {
    backgroundColor: FigmaTheme.colors.primary,
    borderColor: FigmaTheme.colors.primary,
  },
  optionButtonText: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: FigmaTheme.colors.textPrimary,
  },
  optionButtonTextActive: {
    color: FigmaTheme.colors.white,
  },
  levelOption: {
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
  },
  levelOptionActive: {
    backgroundColor: FigmaTheme.colors.primary,
    borderColor: FigmaTheme.colors.primary,
  },
  levelOptionContent: {
    
  },
  levelOptionTitle: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: FigmaTheme.colors.textPrimary,
    marginBottom: DesignTokens.spacing.xs,
  },
  levelOptionTitleActive: {
    color: FigmaTheme.colors.white,
  },
  levelOptionDesc: {
    fontSize: DesignTokens.typography.fontSize.sm,
    color: FigmaTheme.colors.textSecondary,
  },
  levelOptionDescActive: {
    color: FigmaTheme.colors.gray100,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
    paddingHorizontal: DesignTokens.spacing.md,
  },
  textInput: {
    flex: 1,
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textPrimary,
    paddingVertical: DesignTokens.spacing.md,
  },
  textAreaInput: {
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.md,
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  inputUnit: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.textSecondary,
    marginLeft: DesignTokens.spacing.sm,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FigmaTheme.colors.white,
    borderRadius: DesignTokens.borderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: FigmaTheme.colors.primary,
    paddingVertical: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  photoButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    color: FigmaTheme.colors.primary,
    fontWeight: DesignTokens.typography.fontWeight.medium,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
    backgroundColor: FigmaTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: FigmaTheme.colors.gray200,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.md,
    paddingHorizontal: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.md,
    gap: DesignTokens.spacing.xs,
  },
  backButton: {
    backgroundColor: FigmaTheme.colors.white,
    borderWidth: 1,
    borderColor: FigmaTheme.colors.gray300,
  },
  nextButton: {
    backgroundColor: FigmaTheme.colors.primary,
    minWidth: 120,
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.medium,
    color: FigmaTheme.colors.primary,
  },
  navButtonTextDisabled: {
    color: FigmaTheme.colors.gray400,
  },
  nextButtonText: {
    fontSize: DesignTokens.typography.fontSize.base,
    fontWeight: DesignTokens.typography.fontWeight.semibold,
    color: FigmaTheme.colors.white,
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useFitness } from '../contexts/FitnessContext';
import { Exercicio, ItemTreino } from '../types/fitness';
import { RootStackNavigationProp } from '../types/navigation';

interface ExerciseInWorkout extends ItemTreino {
  exercicio?: Exercicio;
}

export default function CreateWorkoutScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { exercicios, criarTreino } = useFitness();
  
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutDuration, setWorkoutDuration] = useState('45');
  const [selectedExercises, setSelectedExercises] = useState<ExerciseInWorkout[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [saving, setSaving] = useState(false);

  console.log('🏗️ CreateWorkoutScreen - Exercícios disponíveis:', exercicios.length);

  // Filtrar exercícios para seleção
  const filteredExercises = exercicios.filter(exercicio =>
    exercicio.nome.toLowerCase().includes(searchText.toLowerCase()) ||
    exercicio.grupoMuscular.toLowerCase().includes(searchText.toLowerCase())
  );

  const addExerciseToWorkout = (exercicio: Exercicio) => {
    const newItem: ExerciseInWorkout = {
      id: `item_${Date.now()}_${Math.random()}`,
      exercicioId: exercicio.nome, // Usando nome como ID por enquanto
      series: 3,
      repeticoes: 12,
      pesoKg: 20,
      tempoDescanso: 60,
      observacoes: '',
      exercicio: exercicio
    };

    setSelectedExercises(prev => [...prev, newItem]);
    setShowExerciseSelector(false);
    setSearchText('');
    
    console.log('➕ Exercício adicionado:', exercicio.nome);
  };

  const removeExerciseFromWorkout = (itemId: string) => {
    setSelectedExercises(prev => prev.filter(item => item.id !== itemId));
    console.log('➖ Exercício removido:', itemId);
  };

  const updateExerciseInWorkout = (itemId: string, field: keyof ItemTreino, value: any) => {
    setSelectedExercises(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Nome obrigatório', 'Por favor, digite um nome para o treino.');
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert('Exercícios obrigatórios', 'Adicione pelo menos um exercício ao treino.');
      return;
    }

    setSaving(true);

    try {
      const workoutData = {
        nome: workoutName.trim(),
        descricao: workoutDescription.trim(),
        categoria: 'personalizado' as const,
        usuarioId: 'user_default',
        data: new Date().toISOString(),
        duracaoMinutos: parseInt(workoutDuration) || 45,
        concluido: false,
        itens: selectedExercises.map(item => ({
          id: item.id,
          exercicioId: item.exercicioId,
          series: item.series,
          repeticoes: item.repeticoes,
          pesoKg: item.pesoKg,
          tempoDescanso: item.tempoDescanso,
          observacoes: item.observacoes || ''
        }))
      };

      await criarTreino(workoutData);

      Alert.alert(
        'Treino Criado!',
        `O treino "${workoutName}" foi criado com sucesso.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );

      console.log('✅ Treino criado com sucesso:', workoutName);
    } catch (error) {
      console.error('❌ Erro ao criar treino:', error);
      Alert.alert('Erro', 'Não foi possível criar o treino. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const renderExerciseInWorkout = ({ item }: { item: ExerciseInWorkout }) => (
    <View style={styles.exerciseInWorkoutCard}>
      <View style={styles.exerciseHeader}>
        <View style={styles.exerciseInfo}>
          <Text style={styles.exerciseName}>{item.exercicio?.nome || item.exercicioId}</Text>
          <Text style={styles.exerciseGroup}>
            {item.exercicio?.grupoMuscular || 'Grupo muscular'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeExerciseFromWorkout(item.id)}
        >
          <Ionicons name="close" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <View style={styles.exerciseParams}>
        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Séries</Text>
          <TextInput
            style={styles.paramInput}
            value={String(item.series)}
            onChangeText={(text) => updateExerciseInWorkout(item.id, 'series', parseInt(text) || 1)}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        
        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Reps</Text>
          <TextInput
            style={styles.paramInput}
            value={String(item.repeticoes)}
            onChangeText={(text) => updateExerciseInWorkout(item.id, 'repeticoes', parseInt(text) || 1)}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        
        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Peso (kg)</Text>
          <TextInput
            style={styles.paramInput}
            value={String(item.pesoKg)}
            onChangeText={(text) => updateExerciseInWorkout(item.id, 'pesoKg', parseFloat(text) || 0)}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
        
        <View style={styles.paramGroup}>
          <Text style={styles.paramLabel}>Descanso (s)</Text>
          <TextInput
            style={styles.paramInput}
            value={String(item.tempoDescanso)}
            onChangeText={(text) => updateExerciseInWorkout(item.id, 'tempoDescanso', parseInt(text) || 30)}
            keyboardType="numeric"
            selectTextOnFocus
          />
        </View>
      </View>
    </View>
  );

  const renderExerciseSelector = ({ item }: { item: Exercicio }) => (
    <TouchableOpacity
      style={styles.exerciseSelectorCard}
      onPress={() => addExerciseToWorkout(item)}
    >
      <View style={styles.exerciseSelectorInfo}>
        <Text style={styles.exerciseSelectorName}>{item.nome}</Text>
        <Text style={styles.exerciseSelectorGroup}>{item.grupoMuscular}</Text>
        <Text style={styles.exerciseSelectorEquipment}>{item.equipamento}</Text>
      </View>
      <Ionicons name="add-circle" size={24} color="#FF6B35" />
    </TouchableOpacity>
  );

  if (showExerciseSelector) {
    return (
      <FigmaScreen>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowExerciseSelector(false)}
            >
              <Ionicons name="arrow-back" size={24} color={FigmaTheme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.title}>Selecionar Exercício</Text>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color={FigmaTheme.colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar exercícios..."
                placeholderTextColor={FigmaTheme.colors.textSecondary}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>
          </View>

          <FlatList
            data={filteredExercises}
            renderItem={renderExerciseSelector}
            keyExtractor={(item) => item.id}
            style={styles.exercisesList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </FigmaScreen>
    );
  }

  return (
    <FigmaScreen>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={FigmaTheme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Criar Treino</Text>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Informações básicas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nome do Treino *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Peito e Tríceps"
                placeholderTextColor={FigmaTheme.colors.textSecondary}
                value={workoutName}
                onChangeText={setWorkoutName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Descrição</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Descreva o objetivo deste treino..."
                placeholderTextColor={FigmaTheme.colors.textSecondary}
                value={workoutDescription}
                onChangeText={setWorkoutDescription}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duração Estimada (minutos)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="45"
                placeholderTextColor={FigmaTheme.colors.textSecondary}
                value={workoutDuration}
                onChangeText={setWorkoutDuration}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Exercícios */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Exercícios ({selectedExercises.length})
              </Text>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setShowExerciseSelector(true)}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addExerciseButtonText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {selectedExercises.length === 0 ? (
              <View style={styles.emptyExercises}>
                <Ionicons name="fitness-outline" size={48} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.emptyExercisesText}>
                  Nenhum exercício adicionado
                </Text>
                <TouchableOpacity
                  style={styles.addFirstExerciseButton}
                  onPress={() => setShowExerciseSelector(true)}
                >
                  <Text style={styles.addFirstExerciseButtonText}>
                    + Adicionar primeiro exercício
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={selectedExercises}
                renderItem={renderExerciseInWorkout}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>

        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={saveWorkout}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Salvando...' : 'Criar Treino'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addExerciseButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyExercises: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyExercisesText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 12,
    marginBottom: 20,
  },
  addFirstExerciseButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  addFirstExerciseButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseInWorkoutCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseGroup: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  removeButton: {
    padding: 4,
  },
  exerciseParams: {
    flexDirection: 'row',
    gap: 12,
  },
  paramGroup: {
    flex: 1,
  },
  paramLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
  },
  paramInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    color: FigmaTheme.colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 16,
  },
  exercisesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  exerciseSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  exerciseSelectorInfo: {
    flex: 1,
  },
  exerciseSelectorName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exerciseSelectorGroup: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    textTransform: 'capitalize',
    marginBottom: 2,
  },
  exerciseSelectorEquipment: {
    color: '#FF6B35',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: FigmaTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#666666',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
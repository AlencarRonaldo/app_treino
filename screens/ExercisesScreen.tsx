import React, { useState, useMemo } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useFitness } from '../contexts/FitnessContext';
import { Exercicio } from '../types/fitness';

const exerciseCategories = [
  { id: 'todos', name: 'Todos', icon: 'grid' as const },
  { id: 'peito', name: 'Peito', icon: 'body' as const },
  { id: 'costas', name: 'Costas', icon: 'body' as const },
  { id: 'pernas', name: 'Pernas', icon: 'walk' as const },
  { id: 'ombros', name: 'Ombros', icon: 'body' as const },
  { id: 'biceps', name: 'Bíceps', icon: 'fitness' as const },
  { id: 'triceps', name: 'Tríceps', icon: 'fitness' as const },
  { id: 'abdomen', name: 'Abdômen', icon: 'body' as const },
  { id: 'gluteos', name: 'Glúteos', icon: 'body' as const },
];

export default function ExercisesScreen() {
  const { exercicios, buscarExercicios, adicionarExercicio, carregando } = useFitness();
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchText, setSearchText] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filtrar exercícios com base na categoria e busca
  const filteredExercises = useMemo(() => {
    let filtered = exercicios;

    // Filtrar por categoria
    if (selectedCategory !== 'todos') {
      filtered = buscarExercicios({ grupoMuscular: selectedCategory });
    }

    // Filtrar por busca
    if (searchText.length > 0) {
      filtered = filtered.filter(exercicio => 
        exercicio.nome.toLowerCase().includes(searchText.toLowerCase()) ||
        exercicio.grupoMuscular.toLowerCase().includes(searchText.toLowerCase()) ||
        exercicio.subgrupos?.some(subgrupo => 
          subgrupo.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }

    return filtered;
  }, [exercicios, selectedCategory, searchText, buscarExercicios]);

  const getDifficultyColor = (nivel: string) => {
    switch (nivel) {
      case 'iniciante': return '#00D632';
      case 'intermediario': return '#FFB800';
      case 'avancado': return '#FF3B30';
      default: return FigmaTheme.colors.textSecondary;
    }
  };

  const formatDifficulty = (nivel: string) => {
    switch (nivel) {
      case 'iniciante': return 'Iniciante';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return nivel;
    }
  };

  const formatEquipment = (equipamento: string) => {
    switch (equipamento) {
      case 'barra': return 'Barra';
      case 'halteres': return 'Halteres';
      case 'polia': return 'Polia';
      case 'maquina': return 'Máquina';
      case 'peso_corporal': return 'Peso Corporal';
      case 'elastico': return 'Elástico';
      default: return equipamento;
    }
  };

  const formatMuscleGroup = (grupo: string) => {
    switch (grupo) {
      case 'peito': return 'Peito';
      case 'costas': return 'Costas';
      case 'pernas': return 'Pernas';
      case 'ombros': return 'Ombros';
      case 'biceps': return 'Bíceps';
      case 'triceps': return 'Tríceps';
      case 'abdomen': return 'Abdômen';
      case 'gluteos': return 'Glúteos';
      default: return grupo;
    }
  };

  const handleExercisePress = (exercicio: Exercicio) => {
    Alert.alert(
      exercicio.nome,
      exercicio.instrucoes || 'Instruções não disponíveis',
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Ver Detalhes', onPress: () => showExerciseDetails(exercicio) }
      ]
    );
  };

  const showExerciseDetails = (exercicio: Exercicio) => {
    const details = [
      `Grupo Muscular: ${formatMuscleGroup(exercicio.grupoMuscular)}`,
      `Equipamento: ${formatEquipment(exercicio.equipamento)}`,
      `Nível: ${formatDifficulty(exercicio.nivel)}`,
      `Tipo: ${exercicio.tipo === 'forca' ? 'Força' : exercicio.tipo === 'cardio' ? 'Cardio' : 'Flexibilidade'}`,
    ];

    if (exercicio.subgrupos && exercicio.subgrupos.length > 0) {
      details.push(`Músculos Envolvidos: ${exercicio.subgrupos.join(', ')}`);
    }

    if (exercicio.dicas && exercicio.dicas.length > 0) {
      details.push(`\nDicas:\n• ${exercicio.dicas.join('\n• ')}`);
    }

    Alert.alert(
      exercicio.nome,
      details.join('\n\n'),
      [{ text: 'OK' }]
    );
  };

  const renderExercise = ({ item }: { item: Exercicio }) => (
    <TouchableOpacity style={styles.exerciseCard} onPress={() => handleExercisePress(item)}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.nome}</Text>
        <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(item.nivel) }]}>
          <Text style={[styles.difficultyText, { color: getDifficultyColor(item.nivel) }]}>
            {formatDifficulty(item.nivel)}
          </Text>
        </View>
      </View>
      
      <View style={styles.exerciseInfo}>
        <View style={styles.infoItem}>
          <Ionicons name="body" size={16} color={FigmaTheme.colors.textSecondary} />
          <Text style={styles.infoText}>{formatMuscleGroup(item.grupoMuscular)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="barbell" size={16} color={FigmaTheme.colors.textSecondary} />
          <Text style={styles.infoText}>{formatEquipment(item.equipamento)}</Text>
        </View>
      </View>

      <View style={styles.exerciseFooter}>
        {item.subgrupos && item.subgrupos.length > 0 && (
          <Text style={styles.subMuscles}>
            {item.subgrupos.slice(0, 2).join(', ')}
            {item.subgrupos.length > 2 && '...'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Exercícios</Text>
          <Text style={styles.subtitle}>
            {carregando ? 'Carregando...' : `${filteredExercises.length} exercícios disponíveis`}
          </Text>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={FigmaTheme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar exercícios..."
            placeholderTextColor={FigmaTheme.colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {/* Categories */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {exerciseCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Ionicons 
                name={category.icon} 
                size={18} 
                color={selectedCategory === category.id ? '#FFFFFF' : FigmaTheme.colors.textSecondary} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextActive
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Loading or Exercises List */}
        {carregando ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>Carregando exercícios...</Text>
          </View>
        ) : filteredExercises.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="barbell" size={48} color={FigmaTheme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>Nenhum exercício encontrado</Text>
            <Text style={styles.emptySubtitle}>
              {searchText ? 'Tente buscar por outro termo' : 'Não há exercícios nesta categoria'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            renderItem={renderExercise}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.exercisesList}
          />
        )}
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
    paddingHorizontal: 32,
    paddingTop: 20,
    paddingBottom: 24,
  },
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    gap: 12,
  },
  searchIcon: {
    
  },
  searchInput: {
    flex: 1,
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 4,
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 32,
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
  },
  categoryText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  exercisesList: {
    paddingHorizontal: 32,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  exerciseInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseFooter: {
    marginTop: 8,
  },
  subMuscles: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
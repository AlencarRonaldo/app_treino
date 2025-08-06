import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Text, FAB } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useFitness } from '../contexts/FitnessContext';
import { WorkoutsScreenNavigationProp } from '../types/navigation';

const workoutCategories = [
  { id: 'meus', name: 'Meus Treinos' },
  { id: 'explorar', name: 'Explorar' },
];

const workouts = [
  {
    id: '1',
    name: 'Peito e Tríceps',
    exercises: 8,
    duration: '45 min',
    difficulty: 'Intermediário',
    lastUsed: 'Hoje',
  },
  {
    id: '2',
    name: 'Pernas Completo',
    exercises: 6,
    duration: '60 min',
    difficulty: 'Avançado',
    lastUsed: 'Ontem',
  },
  {
    id: '3',
    name: 'Costas e Bíceps',
    exercises: 7,
    duration: '50 min',
    difficulty: 'Intermediário',
    lastUsed: '2 dias atrás',
  },
  {
    id: '4',
    name: 'Ombros e Trapézio',
    exercises: 5,
    duration: '35 min',
    difficulty: 'Básico',
    lastUsed: '1 semana atrás',
  },
];

const exploreWorkouts = [
  {
    id: '5',
    name: 'Full Body Iniciante',
    exercises: 10,
    duration: '30 min',
    difficulty: 'Básico',
    category: 'Iniciante',
    rating: 4.8,
  },
  {
    id: '6',
    name: 'HIIT Cardio',
    exercises: 12,
    duration: '25 min',
    difficulty: 'Intermediário',
    category: 'Cardio',
    rating: 4.9,
  },
  {
    id: '7',
    name: 'Força e Massa',
    exercises: 8,
    duration: '55 min',
    difficulty: 'Avançado',
    category: 'Hipertrofia',
    rating: 4.7,
  },
];

export default function WorkoutsScreen() {
  const [selectedTab, setSelectedTab] = useState('meus');
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const { treinos, carregando, criarTreino, removerTreino } = useFitness();

  console.log('📋 WorkoutsScreen - Treinos carregados:', treinos.length);

  const handleEditWorkout = (workout: any) => {
    // TODO: Implementar tela de edição de treino
    Alert.alert('Editar Treino', `Funcionalidade de edição será implementada em breve.\n\nTreino: ${workout.nome}`);
  };

  const handleDuplicateWorkout = async (workout: any) => {
    try {
      const duplicatedWorkout = {
        ...workout,
        nome: `${workout.nome} (Cópia)`,
        id: undefined, // Remove ID para criar novo
        data: new Date().toISOString(),
        concluido: false
      };

      await criarTreino(duplicatedWorkout);
      Alert.alert('Treino Duplicado', `O treino "${workout.nome}" foi duplicado com sucesso!`);
    } catch (error) {
      console.error('Erro ao duplicar treino:', error);
      Alert.alert('Erro', 'Não foi possível duplicar o treino. Tente novamente.');
    }
  };

  const handleDeleteWorkout = (workout: any) => {
    Alert.alert(
      'Excluir Treino',
      `Tem certeza de que deseja excluir o treino "${workout.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerTreino(workout.id);
              Alert.alert('Treino Excluído', `O treino "${workout.nome}" foi excluído com sucesso.`);
            } catch (error) {
              console.error('Erro ao excluir treino:', error);
              Alert.alert('Erro', 'Não foi possível excluir o treino. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico': return '#00D632';
      case 'Intermediário': return '#FFB800';
      case 'Avançado': return '#FF3B30';
      default: return FigmaTheme.colors.textSecondary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hoje';
    if (diffDays === 2) return 'Ontem';
    if (diffDays <= 7) return `${diffDays - 1} dias atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getDifficulty = (itemCount: number) => {
    if (itemCount <= 4) return 'Básico';
    if (itemCount <= 7) return 'Intermediário';
    return 'Avançado';
  };

  const renderMyWorkout = ({ item }: { item: any }) => {
    const difficulty = getDifficulty(item.itens?.length || 0);
    
    return (
      <TouchableOpacity 
        style={styles.workoutCard}
        onPress={() => {
          console.log('📋 Treino selecionado:', item.nome);
          // Navegar para o timer do treino
          navigation.navigate('WorkoutTimer', { workout: item });
        }}
      >
        <View style={styles.workoutImageContainer}>
          <View style={styles.workoutImagePlaceholder}>
            <Ionicons name="barbell" size={32} color="#FF6B35" />
          </View>
          <TouchableOpacity 
            style={styles.workoutMenuButton}
            onPress={() => {
              Alert.alert(
                item.nome,
                'Escolha uma ação:',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Editar', onPress: () => handleEditWorkout(item) },
                  { text: 'Duplicar', onPress: () => handleDuplicateWorkout(item) },
                  { text: 'Excluir', style: 'destructive', onPress: () => handleDeleteWorkout(item) },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={16} color={FigmaTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.workoutContent}>
          <Text style={styles.workoutName}>{item.nome}</Text>
          {item.descricao && (
            <Text style={styles.workoutDescription} numberOfLines={2}>{item.descricao}</Text>
          )}
          
          <View style={styles.workoutInfo}>
            <View style={styles.workoutInfoItem}>
              <Ionicons name="fitness" size={14} color={FigmaTheme.colors.textSecondary} />
              <Text style={styles.workoutInfoText}>
                {item.itens?.length || 0} exercícios
              </Text>
            </View>
            <View style={styles.workoutInfoItem}>
              <Ionicons name="time" size={14} color={FigmaTheme.colors.textSecondary} />
              <Text style={styles.workoutInfoText}>{item.duracaoMinutos} min</Text>
            </View>
          </View>
          
          <View style={styles.workoutFooter}>
            <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(difficulty) }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
                {difficulty}
              </Text>
            </View>
            <Text style={styles.lastUsedText}>
              {item.concluido ? 'Concluído' : formatDate(item.data)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExploreWorkout = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.exploreWorkoutCard}>
      <View style={styles.exploreWorkoutContent}>
        <Text style={styles.exploreWorkoutName}>{item.name}</Text>
        <Text style={styles.exploreWorkoutCategory}>{item.category}</Text>
        
        <View style={styles.exploreWorkoutInfo}>
          <View style={styles.workoutInfoItem}>
            <Ionicons name="fitness" size={14} color={FigmaTheme.colors.textSecondary} />
            <Text style={styles.workoutInfoText}>{item.exercises} exercícios</Text>
          </View>
          <View style={styles.workoutInfoItem}>
            <Ionicons name="time" size={14} color={FigmaTheme.colors.textSecondary} />
            <Text style={styles.workoutInfoText}>{item.duration}</Text>
          </View>
        </View>
        
        <View style={styles.exploreWorkoutFooter}>
          <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(item.difficulty) }]}>
            <Text style={[styles.difficultyText, { color: getDifficultyColor(item.difficulty) }]}>
              {item.difficulty}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Treinos</Text>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {workoutCategories.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                selectedTab === tab.id && styles.tabButtonActive
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={[
                styles.tabText,
                selectedTab === tab.id && styles.tabTextActive
              ]}>
                {tab.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {selectedTab === 'meus' ? (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Meus Treinos</Text>
                <Text style={styles.sectionSubtitle}>
                  {treinos.length} treino{treinos.length !== 1 ? 's' : ''}
                </Text>
              </View>
              
              {carregando ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando treinos...</Text>
                </View>
              ) : treinos.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="barbell-outline" size={64} color={FigmaTheme.colors.textSecondary} />
                  <Text style={styles.emptyTitle}>Nenhum treino criado</Text>
                  <Text style={styles.emptyDescription}>
                    Crie seu primeiro treino personalizado tocando no botão "+" abaixo
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={treinos}
                  renderItem={renderMyWorkout}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={styles.workoutRow}
                  scrollEnabled={false}
                  contentContainerStyle={styles.workoutsList}
                />
              )}
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Explorar Treinos</Text>
                <TouchableOpacity>
                  <Ionicons name="filter" size={20} color={FigmaTheme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <FlatList
                data={exploreWorkouts}
                renderItem={renderExploreWorkout}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.exploreList}
              />
            </View>
          )}
        </ScrollView>

        {/* FAB para criar novo treino */}
        {selectedTab === 'meus' && (
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={() => {
              console.log('📋 Criar novo treino - Botão pressionado!');
              try {
                // Navegar para CreateWorkout usando o tipo composto
                navigation.navigate('CreateWorkout');
                console.log('📋 Navegação para CreateWorkout iniciada');
              } catch (error) {
                console.error('❌ Erro na navegação:', error);
                Alert.alert('Erro', 'Não foi possível abrir a tela de criar treino.');
              }
            }}
            label="Novo Treino"
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
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 32,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  sectionTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutsList: {
    paddingHorizontal: 24,
  },
  workoutRow: {
    justifyContent: 'space-between',
    gap: 16,
  },
  workoutCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  workoutImageContainer: {
    height: 100,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  workoutImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutMenuButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  workoutContent: {
    padding: 16,
  },
  workoutName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  workoutInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  workoutInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutInfoText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
  },
  workoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: '500',
  },
  lastUsedText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
  },
  exploreList: {
    paddingHorizontal: 32,
  },
  exploreWorkoutCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  exploreWorkoutContent: {
    
  },
  exploreWorkoutName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  exploreWorkoutCategory: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  exploreWorkoutInfo: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  exploreWorkoutFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  // Novos estilos
  sectionSubtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  workoutDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B35',
  },
});
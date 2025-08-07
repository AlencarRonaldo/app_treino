import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  RefreshControl,
  Alert 
} from 'react-native';
import { Text, Card, ProgressBar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FigmaScreen from '../../components/FigmaScreen';
import { FigmaTheme } from '../../constants/figmaTheme';
import { useFitness } from '../../contexts/FitnessContext';
import { usePermissions } from '../../treinosapp-mobile/hooks/usePermissions';
import StudentWorkoutCard from '../../components/student/StudentWorkoutCard';
import { WorkoutsScreenNavigationProp } from '../../types/navigation';
import { useRenderDebug } from '../../utils/debugRenderLoop';

const studentCategories = [
  { id: 'proximo', name: 'Próximo', icon: 'play-circle' },
  { id: 'meus', name: 'Meus Treinos', icon: 'barbell' },
  { id: 'historico', name: 'Histórico', icon: 'time' },
];

// Move calculateStreak para fora do componente para evitar recriação
const calculateStreak = (workouts: any[]) => {
  const completedWorkouts = workouts
    .filter(w => w.concluido)
    .sort((a, b) => 
      new Date(b.dataFinalizacao || b.data).getTime() - 
      new Date(a.dataFinalizacao || a.data).getTime()
    );

  if (completedWorkouts.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const workout of completedWorkouts) {
    const workoutDate = new Date(workout.dataFinalizacao || workout.data);
    workoutDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
    } else if (diffDays === streak + 1) {
      // Permitir um dia de intervalo
      continue;
    } else {
      break;
    }
  }

  return streak;
};

const getDifficulty = (itemCount: number) => {
  if (itemCount <= 4) return 'Básico';
  if (itemCount <= 7) return 'Intermediário';
  return 'Avançado';
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'Básico': return '#00D632';
    case 'Intermediário': return '#FFB800';
    case 'Avançado': return '#FF3B30';
    default: return FigmaTheme.colors.textSecondary;
  }
};

interface StudentWorkoutsScreenProps {}

export default function StudentWorkoutsScreen({}: StudentWorkoutsScreenProps) {
  const [selectedTab, setSelectedTab] = useState('proximo');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const { treinos, carregando } = useFitness();
  const { isStudent } = usePermissions();

  // Debug render loops
  useRenderDebug('StudentWorkoutsScreen', [treinos, carregando, isStudent, selectedTab]);

  // Estatísticas do aluno otimizadas com useMemo
  const studentStats = useMemo(() => {
    console.log('📊 StudentWorkoutsScreen - Calculando stats para:', treinos.length, 'treinos');
    
    const completed = treinos.filter(t => t.concluido).length;
    const total = treinos.length;
    const pending = total - completed;
    const thisWeekCompleted = treinos.filter(t => {
      if (!t.concluido) return false;
      const completedDate = new Date(t.dataFinalizacao || t.data);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return completedDate >= weekAgo;
    }).length;
    
    const streak = calculateStreak(treinos);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      completed,
      pending,
      thisWeekCompleted,
      streak,
      completionRate,
      total
    };
  }, [treinos]);

  // Próximo treino recomendado
  const nextWorkout = useMemo(() => {
    console.log('📋 StudentWorkoutsScreen - Calculando nextWorkout para:', treinos.length, 'treinos');
    
    const incompleteTreinos = treinos.filter(t => !t.concluido);
    if (incompleteTreinos.length === 0) return null;
    
    // Priorizar treinos atribuídos pelo personal trainer
    const assigned = incompleteTreinos.find(t => t.atribuido);
    if (assigned) return assigned;
    
    // Caso contrário, pegar o mais recente
    return incompleteTreinos.sort((a, b) => 
      new Date(b.data).getTime() - new Date(a.data).getTime()
    )[0];
  }, [treinos]);

  const filteredWorkouts = useMemo(() => {
    console.log('🔍 StudentWorkoutsScreen - Filtrando treinos para tab:', selectedTab, 'de', treinos.length, 'treinos');
    
    let filtered = treinos;

    switch (selectedTab) {
      case 'proximo':
        // Mostrar apenas treinos não concluídos, priorizando atribuídos
        filtered = treinos.filter(t => !t.concluido)
          .sort((a, b) => {
            // Atribuídos primeiro
            if (a.atribuido && !b.atribuido) return -1;
            if (!a.atribuido && b.atribuido) return 1;
            // Depois por data
            return new Date(b.data).getTime() - new Date(a.data).getTime();
          })
          .slice(0, 5); // Limitar a 5 próximos treinos
        break;
      case 'historico':
        filtered = treinos.filter(t => t.concluido)
          .sort((a, b) => 
            new Date(b.dataFinalizacao || b.data).getTime() - 
            new Date(a.dataFinalizacao || a.data).getTime()
          );
        break;
      case 'meus':
      default:
        filtered = treinos.filter(t => !t.atribuido)
          .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
        break;
    }

    console.log('🎯 StudentWorkoutsScreen - Filtrados:', filtered.length, 'treinos');
    return filtered;
  }, [treinos, selectedTab]);


  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Recarregar dados se necessário
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleStartWorkout = useCallback((workout: any) => {
    console.log('🏃‍♀️ Aluno iniciando treino:', workout.nome);
    navigation.navigate('WorkoutTimer', { workout });
  }, [navigation]);

  const handleViewDetails = useCallback((workout: any) => {
    Alert.alert(
      workout.nome,
      `Exercícios: ${workout.itens?.length || 0}\nDuração: ${workout.duracaoMinutos} min\n\n${workout.descricao || 'Sem descrição'}`,
      [
        { text: 'Fechar', style: 'cancel' },
        { text: 'Iniciar Treino', onPress: () => handleStartWorkout(workout) }
      ]
    );
  }, [handleStartWorkout]);

  const handleMarkCompleted = useCallback((workout: any) => {
    Alert.alert(
      'Marcar como Concluído',
      `Deseja marcar o treino "${workout.nome}" como concluído sem usar o timer?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Marcar',
          onPress: () => {
            // Implementar lógica de marcar como concluído
            Alert.alert('Sucesso', 'Treino marcado como concluído!');
          }
        }
      ]
    );
  }, []);

  const renderWorkout = useCallback(({ item }: { item: any }) => (
    <StudentWorkoutCard
      workout={item}
      onPress={() => handleStartWorkout(item)}
      onViewDetails={() => handleViewDetails(item)}
      onMarkCompleted={() => handleMarkCompleted(item)}
      showCompletedBadge={selectedTab === 'historico'}
    />
  ), [handleStartWorkout, handleViewDetails, handleMarkCompleted, selectedTab]);

  const renderNextWorkoutCard = () => {
    if (!nextWorkout) {
      return (
        <Card style={styles.nextWorkoutCard}>
          <Card.Content style={styles.nextWorkoutContent}>
            <View style={styles.nextWorkoutHeader}>
              <Ionicons name="checkmark-circle" size={32} color="#00D632" />
              <View style={styles.nextWorkoutInfo}>
                <Text style={styles.nextWorkoutTitle}>Parabéns!</Text>
                <Text style={styles.nextWorkoutSubtitle}>Todos os treinos concluídos</Text>
              </View>
            </View>
            <Text style={styles.nextWorkoutDescription}>
              Você completou todos os seus treinos. Aguarde novos treinos do seu personal trainer ou crie um novo.
            </Text>
          </Card.Content>
        </Card>
      );
    }

    const difficulty = getDifficulty(nextWorkout.itens?.length || 0);
    
    return (
      <Card style={styles.nextWorkoutCard}>
        <Card.Content style={styles.nextWorkoutContent}>
          <View style={styles.nextWorkoutHeader}>
            <View style={styles.nextWorkoutIcon}>
              <Ionicons name="play" size={24} color="#FF6B35" />
            </View>
            <View style={styles.nextWorkoutInfo}>
              <Text style={styles.nextWorkoutTitle}>{nextWorkout.nome}</Text>
              <Text style={styles.nextWorkoutSubtitle}>
                {nextWorkout.atribuido ? 'Atribuído pelo seu personal' : 'Seu próximo treino'}
              </Text>
            </View>
          </View>
          
          <View style={styles.nextWorkoutDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="fitness" size={16} color={FigmaTheme.colors.textSecondary} />
              <Text style={styles.detailText}>{nextWorkout.itens?.length || 0} exercícios</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time" size={16} color={FigmaTheme.colors.textSecondary} />
              <Text style={styles.detailText}>{nextWorkout.duracaoMinutos} min</Text>
            </View>
            <View style={[styles.difficultyBadge, { borderColor: getDifficultyColor(difficulty) }]}>
              <Text style={[styles.difficultyText, { color: getDifficultyColor(difficulty) }]}>
                {difficulty}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.startButton}
            onPress={() => handleStartWorkout(nextWorkout)}
          >
            <Text style={styles.startButtonText}>Iniciar Treino</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </Card.Content>
      </Card>
    );
  };

  const renderStatsCard = () => (
    <Card style={styles.statsCard}>
      <Card.Content>
        <Text style={styles.statsTitle}>Seu Progresso</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Taxa de Conclusão</Text>
            <Text style={styles.progressPercent}>{studentStats.completionRate}%</Text>
          </View>
          <ProgressBar 
            progress={studentStats.completionRate / 100} 
            color="#00D632" 
            style={styles.progressBar} 
          />
        </View>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#00D632' }]}>{studentStats.completed}</Text>
            <Text style={styles.statLabel}>Concluídos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FFB800' }]}>{studentStats.pending}</Text>
            <Text style={styles.statLabel}>Pendentes</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF6B35' }]}>{studentStats.thisWeekCompleted}</Text>
            <Text style={styles.statLabel}>Esta Semana</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#007AFF' }]}>{studentStats.streak}</Text>
            <Text style={styles.statLabel}>Sequência</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );


  const renderEmptyState = () => {
    const emptyMessages = {
      proximo: {
        title: 'Nenhum treino pendente',
        description: 'Você não tem treinos pendentes no momento. Aguarde novos treinos do seu personal trainer.'
      },
      meus: {
        title: 'Nenhum treino próprio',
        description: 'Você ainda não criou treinos próprios. Explore nossa biblioteca ou aguarde treinos do seu personal.'
      },
      historico: {
        title: 'Nenhum treino concluído',
        description: 'Você ainda não completou nenhum treino. Comece hoje mesmo!'
      }
    };

    const message = emptyMessages[selectedTab as keyof typeof emptyMessages] || emptyMessages.proximo;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="barbell-outline" size={64} color={FigmaTheme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptyDescription}>{message.description}</Text>
      </View>
    );
  };

  if (!isStudent) {
    return (
      <FigmaScreen>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorDescription}>
            Esta tela é exclusiva para Alunos.
          </Text>
        </View>
      </FigmaScreen>
    );
  }

  return (
    <FigmaScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Meus Treinos</Text>
            <Text style={styles.subtitle}>Mantenha-se ativo e motivado</Text>
          </View>
        </View>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Next Workout Card - apenas na tab 'proximo' */}
        {selectedTab === 'proximo' && renderNextWorkoutCard()}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {studentCategories.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                selectedTab === tab.id && styles.tabButtonActive
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={selectedTab === tab.id ? '#FFFFFF' : FigmaTheme.colors.textSecondary} 
              />
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
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={FigmaTheme.colors.primary}
            />
          }
        >
          {carregando ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando treinos...</Text>
            </View>
          ) : filteredWorkouts.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={filteredWorkouts}
              renderItem={renderWorkout}
              keyExtractor={(item) => item.id}
              numColumns={selectedTab === 'proximo' ? 1 : 2}
              columnWrapperStyle={selectedTab !== 'proximo' ? styles.workoutRow : undefined}
              scrollEnabled={false}
              contentContainerStyle={styles.workoutsList}
            />
          )}
        </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
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
  statsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
  },
  statsTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  progressPercent: {
    color: '#00D632',
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3A3A3C',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
  },
  nextWorkoutCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
  },
  nextWorkoutContent: {
    padding: 20,
  },
  nextWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  nextWorkoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nextWorkoutInfo: {
    flex: 1,
  },
  nextWorkoutTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  nextWorkoutSubtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
  },
  nextWorkoutDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  nextWorkoutDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
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
  startButton: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 13,
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
  workoutsList: {
    paddingHorizontal: 16,
  },
  workoutRow: {
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: '#FF3B30',
    fontSize: 24,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
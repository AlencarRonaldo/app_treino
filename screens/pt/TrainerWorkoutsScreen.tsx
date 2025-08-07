import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  RefreshControl 
} from 'react-native';
import { Text, FAB, Searchbar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FigmaScreen from '../../components/FigmaScreen';
import { FigmaTheme } from '../../constants/figmaTheme';
import { useFitness } from '../../contexts/FitnessContext';
import { usePermissions } from '../../treinosapp-mobile/hooks/usePermissions';
import { Permission } from '../../treinosapp-mobile/types/permissions';
import TrainerWorkoutCard from '../../components/pt/TrainerWorkoutCard';
import { WorkoutsScreenNavigationProp } from '../../types/navigation';

const trainerCategories = [
  { id: 'meus', name: 'Meus Treinos', icon: 'barbell' },
  { id: 'atribuidos', name: 'Atribuídos', icon: 'people' },
  { id: 'templates', name: 'Templates', icon: 'bookmark' },
];

interface TrainerWorkoutsScreenProps {}

export default function TrainerWorkoutsScreen({}: TrainerWorkoutsScreenProps) {
  const [selectedTab, setSelectedTab] = useState('meus');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigation = useNavigation<WorkoutsScreenNavigationProp>();
  const { treinos, carregando, criarTreino, removerTreino, editarTreino } = useFitness();
  const { hasPermission, isPersonalTrainer } = usePermissions();

  // Filtros e estatísticas otimizados com useMemo
  const workoutStats = useMemo(() => {
    const total = treinos.length;
    const assigned = treinos.filter(t => t.atribuido).length;
    const completed = treinos.filter(t => t.concluido).length;
    const templates = treinos.filter(t => t.template).length;
    
    return {
      total,
      assigned,
      completed,
      templates,
      activeRate: total > 0 ? Math.round(((total - completed) / total) * 100) : 0
    };
  }, [treinos]);

  const filteredWorkouts = useMemo(() => {
    let filtered = treinos;

    // Filtrar por categoria
    switch (selectedTab) {
      case 'atribuidos':
        filtered = filtered.filter(t => t.atribuido);
        break;
      case 'templates':
        filtered = filtered.filter(t => t.template);
        break;
      case 'meus':
      default:
        filtered = filtered.filter(t => !t.atribuido && !t.template);
        break;
    }

    // Filtrar por pesquisa
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(treino =>
        treino.nome.toLowerCase().includes(query) ||
        treino.descricao?.toLowerCase().includes(query) ||
        treino.categoria?.toLowerCase().includes(query)
      );
    }

    // Ordenar por data de criação (mais recente primeiro)
    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [treinos, selectedTab, searchQuery]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Recarregar dados se necessário
      // await reloadWorkouts();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const handleCreateWorkout = useCallback(() => {
    if (!hasPermission(Permission.CREATE_WORKOUT)) {
      Alert.alert('Sem Permissão', 'Você não tem permissão para criar treinos.');
      return;
    }

    console.log('📋 Criar novo treino - Personal Trainer');
    navigation.navigate('CreateWorkout');
  }, [hasPermission, navigation]);

  const handleWorkoutAction = useCallback(async (action: string, workout: any) => {
    switch (action) {
      case 'edit':
        if (!hasPermission(Permission.EDIT_WORKOUT)) {
          Alert.alert('Sem Permissão', 'Você não tem permissão para editar treinos.');
          return;
        }
        Alert.alert('Editar Treino', `Funcionalidade de edição será implementada em breve.\n\nTreino: ${workout.nome}`);
        break;

      case 'duplicate':
        if (!hasPermission(Permission.CREATE_WORKOUT)) {
          Alert.alert('Sem Permissão', 'Você não tem permissão para duplicar treinos.');
          return;
        }
        await handleDuplicateWorkout(workout);
        break;

      case 'assign':
        if (!hasPermission(Permission.ASSIGN_WORKOUT)) {
          Alert.alert('Sem Permissão', 'Você não tem permissão para atribuir treinos.');
          return;
        }
        Alert.alert('Atribuir Treino', 'Funcionalidade de atribuição será implementada em breve.');
        break;

      case 'template':
        await handleMakeTemplate(workout);
        break;

      case 'archive':
        await handleArchiveWorkout(workout);
        break;

      case 'delete':
        if (!hasPermission(Permission.DELETE_WORKOUT)) {
          Alert.alert('Sem Permissão', 'Você não tem permissão para excluir treinos.');
          return;
        }
        await handleDeleteWorkout(workout);
        break;

      default:
        break;
    }
  }, [hasPermission]);

  const handleDuplicateWorkout = async (workout: any) => {
    try {
      const duplicatedWorkout = {
        ...workout,
        nome: `${workout.nome} (Cópia)`,
        id: undefined,
        data: new Date().toISOString(),
        concluido: false,
        atribuido: false,
        template: false
      };

      await criarTreino(duplicatedWorkout);
      Alert.alert('Sucesso', `Treino "${workout.nome}" duplicado com sucesso!`);
    } catch (error) {
      console.error('Erro ao duplicar treino:', error);
      Alert.alert('Erro', 'Não foi possível duplicar o treino. Tente novamente.');
    }
  };

  const handleMakeTemplate = async (workout: any) => {
    try {
      const templateWorkout = {
        ...workout,
        template: !workout.template
      };

      await editarTreino(workout.id, { template: !workout.template });
      const action = workout.template ? 'removido dos' : 'adicionado aos';
      Alert.alert('Sucesso', `Treino ${action} templates!`);
    } catch (error) {
      console.error('Erro ao alterar template:', error);
      Alert.alert('Erro', 'Não foi possível alterar o template. Tente novamente.');
    }
  };

  const handleArchiveWorkout = async (workout: any) => {
    Alert.alert('Arquivar Treino', 'Funcionalidade de arquivamento será implementada em breve.');
  };

  const handleDeleteWorkout = async (workout: any) => {
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
              Alert.alert('Sucesso', `Treino "${workout.nome}" excluído com sucesso.`);
            } catch (error) {
              console.error('Erro ao excluir treino:', error);
              Alert.alert('Erro', 'Não foi possível excluir o treino. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  const handleStartWorkout = useCallback((workout: any) => {
    console.log('📋 Iniciar treino como Personal Trainer:', workout.nome);
    navigation.navigate('WorkoutTimer', { workout });
  }, [navigation]);

  const renderWorkout = useCallback(({ item }: { item: any }) => (
    <TrainerWorkoutCard
      workout={item}
      onPress={() => handleStartWorkout(item)}
      onAction={(action) => handleWorkoutAction(action, item)}
      showAssignOption={selectedTab !== 'atribuidos'}
      showTemplateOption={selectedTab !== 'templates'}
    />
  ), [handleStartWorkout, handleWorkoutAction, selectedTab]);

  const renderEmptyState = () => {
    const emptyMessages = {
      meus: {
        title: 'Nenhum treino criado',
        description: 'Crie seu primeiro treino profissional para começar a treinar seus alunos'
      },
      atribuidos: {
        title: 'Nenhum treino atribuído',
        description: 'Você ainda não atribuiu treinos para seus alunos. Crie treinos e atribua-os para acompanhar o progresso.'
      },
      templates: {
        title: 'Nenhum template salvo',
        description: 'Transforme seus melhores treinos em templates para reutilização rápida.'
      }
    };

    const message = emptyMessages[selectedTab as keyof typeof emptyMessages] || emptyMessages.meus;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="barbell-outline" size={64} color={FigmaTheme.colors.textSecondary} />
        <Text style={styles.emptyTitle}>{message.title}</Text>
        <Text style={styles.emptyDescription}>{message.description}</Text>
      </View>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <Text style={styles.statsTitle}>Visão Geral</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{workoutStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{workoutStats.assigned}</Text>
          <Text style={styles.statLabel}>Atribuídos</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{workoutStats.templates}</Text>
          <Text style={styles.statLabel}>Templates</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#00D632' }]}>{workoutStats.activeRate}%</Text>
          <Text style={styles.statLabel}>Ativos</Text>
        </View>
      </View>
    </View>
  );

  if (!isPersonalTrainer) {
    return (
      <FigmaScreen>
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={64} color="#FF3B30" />
          <Text style={styles.errorTitle}>Acesso Negado</Text>
          <Text style={styles.errorDescription}>
            Esta tela é exclusiva para Personal Trainers.
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
          <Text style={styles.title}>Gestão de Treinos</Text>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => Alert.alert('Filtros', 'Filtros avançados serão implementados em breve.')}
          >
            <Ionicons name="options" size={20} color={FigmaTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Buscar treinos, alunos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            inputStyle={styles.searchInput}
            iconColor={FigmaTheme.colors.textSecondary}
            placeholderTextColor={FigmaTheme.colors.textSecondary}
          />
        </View>

        {/* Stats Card */}
        {renderStatsCard()}

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {trainerCategories.map((tab) => (
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
              numColumns={2}
              columnWrapperStyle={styles.workoutRow}
              scrollEnabled={false}
              contentContainerStyle={styles.workoutsList}
            />
          )}
        </ScrollView>

        {/* FAB para criar novo treino */}
        {hasPermission(Permission.CREATE_WORKOUT) && (
          <FAB
            icon="plus"
            style={styles.fab}
            onPress={handleCreateWorkout}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#2C2C2E',
    elevation: 0,
  },
  searchInput: {
    color: FigmaTheme.colors.textPrimary,
  },
  statsCard: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#FF6B35',
  },
});
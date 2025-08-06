import React from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions 
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import FigmaScreen from '../components/FigmaScreen';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import { useFitness, useFitnessStats } from '../contexts/FitnessContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { isPersonal, isStudent } = useUserType();
  const { usuario, treinos, carregando } = useFitness();
  const stats = useFitnessStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handleStartWorkout = () => {
    // Se houver treinos disponíveis, usar o primeiro não concluído
    const treinoDisponivel = treinos.find(t => !t.concluido);
    
    if (treinoDisponivel) {
      navigation.navigate('WorkoutTimer', { workout: treinoDisponivel });
    } else {
      // Se não houver treinos, criar um treino de exemplo
      navigation.navigate('Workouts' as never);
    }
  };

  return (
    <FigmaScreen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header simples */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
        </View>

        {/* Card principal - diferente para Personal e Aluno */}
        {isPersonal ? (
          <View style={styles.mainCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="people" size={24} color="#FF6B35" />
            </View>
            
            <Text style={styles.mainTitle}>Painel do Personal</Text>
            <Text style={styles.workoutName}>Gerencie seus alunos</Text>
            
            <View style={styles.workoutInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="person-add" size={16} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.infoText}>8 alunos ativos</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="barbell" size={16} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.infoText}>12 treinos criados</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Gerenciar Alunos</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.mainCard}>
            <View style={styles.iconContainer}>
              <View style={styles.dumbbellIcon} />
            </View>
            
            <Text style={styles.mainTitle}>Treino de Hoje</Text>
            <Text style={styles.workoutName}>Peito e Tríceps</Text>
            
            <View style={styles.workoutInfo}>
              <View style={styles.infoItem}>
                <Ionicons name="time" size={16} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.infoText}>45 min</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="fitness" size={16} color={FigmaTheme.colors.textSecondary} />
                <Text style={styles.infoText}>8 exercícios</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.startButton} onPress={handleStartWorkout}>
              <Text style={styles.startButtonText}>Iniciar Treino</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats cards com dados reais da persistência */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>
            {isPersonal ? 'Seus Alunos' : 'Estatísticas'}
          </Text>
          
          {carregando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text style={styles.loadingText}>Carregando dados...</Text>
            </View>
          ) : (
            <View style={styles.statsGrid}>
              {isPersonal ? (
                <>
                  <View style={styles.statCard}>
                    <Ionicons name="people" size={24} color="#FF6B35" />
                    <Text style={styles.statValue}>8</Text>
                    <Text style={styles.statLabel}>Alunos</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="barbell" size={24} color="#FF6B35" />
                    <Text style={styles.statValue}>{stats.totalTreinos}</Text>
                    <Text style={styles.statLabel}>Treinos</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
                    <Text style={styles.statValue}>{stats.treinosCompletos}</Text>
                    <Text style={styles.statLabel}>Concluídos</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="trophy" size={24} color="#FF6B35" />
                    <Text style={styles.statValue}>{stats.recordesPessoais}</Text>
                    <Text style={styles.statLabel}>Recordes</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.statCard}>
                    <Ionicons name="flame" size={24} color="#FF6B35" />
                    <Text style={styles.statValue}>{stats.totalTreinos}</Text>
                    <Text style={styles.statLabel}>Treinos</Text>
                  </View>
                  
                  <View style={styles.statCard}>
                    <Ionicons name="time" size={24} color="#FF6B35" />
                  <Text style={styles.statValue}>
                    {Math.floor(stats.tempoTotal / 60)}h{stats.tempoTotal % 60 > 0 ? (stats.tempoTotal % 60).toFixed(0) + 'm' : ''}
                  </Text>
                  <Text style={styles.statLabel}>Tempo</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="checkmark-circle" size={24} color="#FF6B35" />
                  <Text style={styles.statValue}>{stats.treinosCompletos}</Text>
                  <Text style={styles.statLabel}>Concluídos</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Ionicons name="barbell" size={24} color="#FF6B35" />
                  <Text style={styles.statValue}>
                    {(stats.volumeTotal / 1000).toFixed(1)}T
                  </Text>
                  <Text style={styles.statLabel}>Volume</Text>
                </View>
              </>
            )}
          </View>
          )}
        </View>

        {/* Ações rápidas - diferentes para Personal e Aluno */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <View style={styles.actionsGrid}>
            {isPersonal ? (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Students' as never)}
                >
                  <Ionicons name="person-add" size={20} color={FigmaTheme.colors.textSecondary} />
                  <Text style={styles.actionText}>Novo Aluno</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CreateWorkout' as never)}
                >
                  <Ionicons name="add-circle" size={20} color={FigmaTheme.colors.textSecondary} />
                  <Text style={styles.actionText}>Criar Treino</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('CreateWorkout' as never)}
                >
                  <Ionicons name="add-circle" size={20} color={FigmaTheme.colors.textSecondary} />
                  <Text style={styles.actionText}>Novo Treino</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Exercises' as never)}
                >
                  <Ionicons name="library" size={20} color={FigmaTheme.colors.textSecondary} />
                  <Text style={styles.actionText}>Exercícios</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Próximos treinos */}
        <View style={styles.upcomingSection}>
          <Text style={styles.sectionTitle}>Próximos</Text>
          
          {treinos.length > 0 ? (
            treinos
              .filter(treino => !treino.concluido)
              .slice(0, 2)
              .map((treino, index) => (
                <TouchableOpacity 
                  key={treino.id}
                  style={styles.upcomingCard}
                  onPress={() => navigation.navigate('WorkoutTimer' as never, { workout: treino } as never)}
                >
                  <View style={styles.upcomingInfo}>
                    <Text style={styles.upcomingTitle}>{treino.nome}</Text>
                    <Text style={styles.upcomingSubtitle}>
                      {index === 0 ? 'Próximo' : 'Depois'} • {treino.itens?.length || 0} exercícios
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={FigmaTheme.colors.textSecondary} />
                </TouchableOpacity>
              ))
          ) : (
            <TouchableOpacity 
              style={styles.upcomingCard}
              onPress={() => navigation.navigate('CreateWorkout' as never)}
            >
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingTitle}>Crie seu primeiro treino</Text>
                <Text style={styles.upcomingSubtitle}>Toque aqui para começar</Text>
              </View>
              <Ionicons name="add-circle" size={20} color="#FF6B35" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    paddingBottom: 40,
  },
  greetingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '400',
  },
  userName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#3A3A3C',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dumbbellIcon: {
    width: 24,
    height: 12,
    backgroundColor: '#FF6B35',
    borderRadius: 6,
  },
  mainTitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  workoutName: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 16,
  },
  workoutInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
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
  startButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  statLabel: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    marginBottom: 32,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 32,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionText: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  upcomingSection: {
    marginBottom: 32,
  },
  upcomingCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 32,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  upcomingInfo: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 12,
  },
  upcomingTitle: {
    color: FigmaTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  upcomingSubtitle: {
    color: FigmaTheme.colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  bottomSpacing: {
    height: 100,
  },
});
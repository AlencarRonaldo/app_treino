/**
 * HomeScreen - FASE 4: Migração para ResponsiveFitnessCard
 * ✅ Integração com ResponsiveFitnessCard da FASE 3
 * ✅ Layout diferenciado PT vs Aluno usando breakpoints
 * ✅ Dashboard responsivo com FITNESS_BREAKPOINTS
 * ✅ Quick actions com touch targets fitness
 * ✅ Gradual fallback se componente falha
 */

import React, { useCallback, useState } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  InteractionManager
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import FigmaScreen from '../components/FigmaScreen';
import { ResponsiveFitnessCard } from '../components/ResponsiveFitnessCard';
import { FigmaTheme } from '../constants/figmaTheme';
import { useAuth } from '../contexts/AuthContext';
import { useUserType } from '../contexts/UserTypeContext';
import { useFitness, useFitnessStats } from '../contexts/FitnessContext';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { 
  useOptimizedResponsive,
  FITNESS_BREAKPOINTS,
  FITNESS_TOUCH_TARGETS,
  scaleModerate
} from '../utils/responsiveCore';
import { 
  getHorizontalPadding, 
  getVerticalPadding, 
  getResponsiveValue,
  getResponsiveFontSize,
  TOUCH_TARGETS,
  isSmallMobile,
  SPACING,
  TYPOGRAPHY,
  getResponsiveLayout,
  getResponsiveGridColumns,
  getWorkoutCardStyle,
  getResponsiveButtonStyle,
  getGridItemWidth,
  getSafeAreaPadding,
  mediaQuery
} from '../utils/responsive';

const { width } = Dimensions.get('window');
const layout = getResponsiveLayout();
const safeArea = getSafeAreaPadding();

export default function HomeScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { isPersonal, isStudent } = useUserType();
  const { usuario, treinos, carregando } = useFitness();
  const stats = useFitnessStats();
  
  // ===== RESPONSIVE FITNESS SYSTEM =====
  const responsiveSystem = useOptimizedResponsive();
  const [useOptimizedCards, setUseOptimizedCards] = useState(true);
  const [optimizedCardError, setOptimizedCardError] = useState<string | null>(null);
  
  const isTablet = responsiveSystem.deviceInfo.isTablet;
  const isLandscape = responsiveSystem.deviceInfo.isLandscape;

  // ===== FITNESS UX HELPERS =====
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  // ===== HANDLERS OTIMIZADOS PARA FITNESS CARDS =====
  const handleStartWorkout = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      // Se houver treinos disponíveis, usar o primeiro não concluído
      const treinoDisponivel = treinos.find(t => !t.concluido);
      
      if (treinoDisponivel) {
        navigation.navigate('WorkoutTimer', { workout: treinoDisponivel });
      } else {
        // Se não houver treinos, criar um treino de exemplo
        navigation.navigate('Workouts' as never);
      }
    });
  }, [treinos, navigation]);
  
  const handleManageStudents = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('StudentsManagement' as never);
    });
  }, [navigation]);
  
  const handleViewWorkouts = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('Workouts' as never);
    });
  }, [navigation]);
  
  const handleViewProgress = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('Progress' as never);
    });
  }, [navigation]);
  
  const handleOptimizedCardError = useCallback((error: any) => {
    console.warn('ResponsiveFitnessCard error, falling back to legacy:', error);
    setOptimizedCardError(error.message || 'Erro desconhecido');
    setUseOptimizedCards(false);
  }, []);

  return (
    <FigmaScreen>
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header simples */}
        <View style={styles.header}>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
        </View>

        {/* Card principal - FITNESS UX com breakpoints */}
        {useOptimizedCards && !optimizedCardError ? (
          /* ===== RESPONSIVE FITNESS CARDS ===== */
          <>
            {isPersonal ? (
              <ResponsiveFitnessCard
                title="Painel do Personal"
                subtitle="Gerencie seus alunos"
                primaryValue="8 alunos"
                secondaryValue="12 treinos criados"
                icon="people"
                variant="student"
                status="active"
                onPress={handleManageStudents}
                showChevron={true}
                accessibilityLabel="Painel do personal trainer, 8 alunos ativos, 12 treinos criados"
                accessibilityHint="Toque para gerenciar seus alunos"
              />
            ) : (
              <ResponsiveFitnessCard
                title="Treino de Hoje"
                subtitle="Peito e Tríceps"
                primaryValue="45 min"
                secondaryValue="8 exercícios"
                icon="barbell"
                variant="workout"
                status="active"
                onPress={handleStartWorkout}
                showChevron={true}
                accessibilityLabel="Treino de hoje, Peito e Tríceps, 45 minutos, 8 exercícios"
                accessibilityHint="Toque para iniciar o treino"
              />
            )}
          </>
        ) : (
          /* ===== FALLBACK CARDS ===== */
          <>
            {optimizedCardError && __DEV__ && (
              <View style={{
                backgroundColor: '#E67E22',
                padding: 12,
                margin: 16,
                borderRadius: 8
              }}>
                <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>
                  ⚠️ Fallback Cards: {optimizedCardError}
                </Text>
              </View>
            )}
            
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

                <TouchableOpacity style={styles.startButton} onPress={handleManageStudents}>
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
          </>
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
          ) : useOptimizedCards && !optimizedCardError ? (
            /* ===== RESPONSIVE FITNESS STATS CARDS ===== */
            <View style={[
              styles.statsGrid, 
              isLandscape && isTablet && { 
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between' 
              }
            ]}>
              {isPersonal ? (
                <>
                  <ResponsiveFitnessCard
                    title="Alunos"
                    primaryValue="8"
                    icon="people"
                    variant="student"
                    compact={true}
                    onPress={handleManageStudents}
                    accessibilityLabel="8 alunos ativos"
                  />
                  
                  <ResponsiveFitnessCard
                    title="Treinos"
                    primaryValue={stats.totalTreinos.toString()}
                    icon="barbell"
                    variant="progress"
                    compact={true}
                    onPress={handleViewWorkouts}
                    accessibilityLabel={`${stats.totalTreinos} treinos criados`}
                  />
                  
                  <ResponsiveFitnessCard
                    title="Concluídos"
                    primaryValue={stats.treinosCompletos.toString()}
                    icon="checkmark-circle"
                    variant="achievement"
                    compact={true}
                    onPress={handleViewProgress}
                    accessibilityLabel={`${stats.treinosCompletos} treinos concluídos`}
                  />
                  
                  <ResponsiveFitnessCard
                    title="Recordes"
                    primaryValue={stats.recordesPessoais.toString()}
                    icon="trophy"
                    variant="achievement"
                    compact={true}
                    onPress={handleViewProgress}
                    accessibilityLabel={`${stats.recordesPessoais} recordes pessoais`}
                  />
                </>
              ) : (
                <>
                  <ResponsiveFitnessCard
                    title="Treinos"
                    primaryValue={stats.totalTreinos.toString()}
                    icon="flame"
                    variant="workout"
                    compact={true}
                    onPress={handleViewWorkouts}
                    accessibilityLabel={`${stats.totalTreinos} treinos realizados`}
                  />
                  
                  <ResponsiveFitnessCard
                    title="Tempo"
                    primaryValue={`${Math.floor(stats.tempoTotal / 60)}h${stats.tempoTotal % 60 > 0 ? (stats.tempoTotal % 60).toFixed(0) + 'm' : ''}`}
                    icon="time"
                    variant="progress"
                    compact={true}
                    onPress={handleViewProgress}
                    accessibilityLabel={`Tempo total de treino: ${Math.floor(stats.tempoTotal / 60)} horas`}
                  />
                  
                  <ResponsiveFitnessCard
                    title="Concluídos"
                    primaryValue={stats.treinosCompletos.toString()}
                    icon="checkmark-circle"
                    variant="achievement"
                    compact={true}
                    onPress={handleViewProgress}
                    accessibilityLabel={`${stats.treinosCompletos} treinos concluídos`}
                  />
                  
                  <ResponsiveFitnessCard
                    title="Volume"
                    primaryValue={`${(stats.volumeTotal / 1000).toFixed(1)}T`}
                    icon="barbell"
                    variant="progress"
                    compact={true}
                    onPress={handleViewProgress}
                    accessibilityLabel={`Volume total: ${(stats.volumeTotal / 1000).toFixed(1)} toneladas`}
                  />
                </>
              )}
            </View>
          ) : (
            /* ===== FALLBACK STATS GRID ===== */
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

      </ScrollView>
      
      {/* Debug info para desenvolvimento */}
      {__DEV__ && useOptimizedCards && !optimizedCardError && (
        <View style={{
          position: 'absolute',
          top: 40,
          right: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 8,
          borderRadius: 4
        }}>
          <Text style={{ color: '#fff', fontSize: 10 }}>
            ResponsiveCards: ON | {isPersonal ? 'PT' : 'Aluno'}
          </Text>
        </View>
      )}
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Math.max(120, safeArea.paddingBottom + 100),
  },
  header: {
    paddingHorizontal: layout.containerPadding,
    paddingTop: Math.max(SPACING.XL, safeArea.paddingTop),
    paddingBottom: SPACING.LG,
  },
  greetingText: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY,
    fontWeight: '400',
  },
  userName: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.H2,
    fontWeight: '700',
    marginTop: SPACING.XXS,
    numberOfLines: 1,
    ellipsizeMode: 'tail',
  },
  mainCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: layout.containerPadding,
    borderRadius: layout.borderRadius,
    padding: layout.cardPadding,
    alignItems: 'center',
    marginBottom: SPACING.XL,
  },
  iconContainer: {
    width: getResponsiveValue(50, 60, 70, 80),
    height: getResponsiveValue(50, 60, 70, 80),
    backgroundColor: '#3A3A3C',
    borderRadius: getResponsiveValue(10, 12, 14, 16),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  dumbbellIcon: {
    width: getResponsiveValue(20, 24, 28, 32),
    height: getResponsiveValue(10, 12, 14, 16),
    backgroundColor: '#FF6B35',
    borderRadius: getResponsiveValue(5, 6, 7, 8),
  },
  mainTitle: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY_SMALL,
    marginBottom: SPACING.XXS,
  },
  workoutName: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.H3,
    fontWeight: '600',
    marginBottom: SPACING.MD,
    textAlign: 'center',
    numberOfLines: 2,
    ellipsizeMode: 'tail',
  },
  workoutInfo: {
    flexDirection: 'row',
    gap: SPACING.LG,
    marginBottom: SPACING.LG,
    justifyContent: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XXS,
  },
  infoText: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY_SMALL,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    ...getResponsiveButtonStyle(),
    borderRadius: layout.borderRadius,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.BODY,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: SPACING.XL,
  },
  sectionTitle: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.H4,
    fontWeight: '600',
    paddingHorizontal: layout.containerPadding,
    marginBottom: SPACING.MD,
  },
  statsGrid: {
    flexDirection: layout.isCompact ? 'column' : 'row',
    paddingHorizontal: layout.containerPadding,
    gap: layout.spacing,
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: layout.isCompact ? undefined : 1,
    width: layout.isCompact ? '100%' : getGridItemWidth(layout.columns, layout.spacing),
    backgroundColor: '#2C2C2E',
    borderRadius: layout.borderRadius,
    padding: layout.cardPadding,
    alignItems: 'center',
    marginBottom: layout.isCompact ? layout.spacing : 0,
    minHeight: getResponsiveValue(90, 100, 110, 120),
    justifyContent: 'center',
  },
  statValue: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.H4,
    fontWeight: '700',
    marginTop: SPACING.XS,
  },
  statLabel: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.CAPTION,
    marginTop: SPACING.XXS,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: SPACING.XL,
  },
  actionsGrid: {
    flexDirection: layout.isCompact ? 'column' : 'row',
    paddingHorizontal: layout.containerPadding,
    gap: layout.spacing,
  },
  actionButton: {
    flex: layout.isCompact ? undefined : 1,
    width: layout.isCompact ? '100%' : undefined,
    backgroundColor: '#2C2C2E',
    borderRadius: layout.borderRadius,
    ...getResponsiveButtonStyle(),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.SM,
  },
  actionText: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.BODY,
    fontWeight: '500',
  },
  upcomingSection: {
    marginBottom: SPACING.XL,
  },
  upcomingCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: layout.containerPadding,
    borderRadius: layout.borderRadius,
    ...getResponsiveButtonStyle(),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  upcomingInfo: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.XL,
    paddingHorizontal: layout.containerPadding,
  },
  loadingText: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY_SMALL,
    marginTop: SPACING.SM,
  },
  upcomingTitle: {
    color: FigmaTheme.colors.textPrimary,
    ...TYPOGRAPHY.BODY,
    fontWeight: '500',
  },
  upcomingSubtitle: {
    color: FigmaTheme.colors.textSecondary,
    ...TYPOGRAPHY.BODY_SMALL,
    marginTop: SPACING.XXS,
  },
});
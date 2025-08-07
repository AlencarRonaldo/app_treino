import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, FAB, Button, Chip, Modal, Portal, TextInput } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../../constants/designTokens';
import ProgressRing from '../../components/ProgressRing';
import KPIWidget from '../../components/KPIWidget';

interface Goal {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  category: 'weight' | 'strength' | 'frequency' | 'endurance' | 'body' | 'habit';
  deadline: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'paused';
  milestones: Milestone[];
  createdAt: string;
}

interface Milestone {
  id: string;
  title: string;
  value: number;
  achieved: boolean;
  achievedAt?: string;
}

export default function PersonalGoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target: '',
    unit: '',
    category: 'weight' as Goal['category'],
    deadline: '',
    priority: 'medium' as Goal['priority']
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    // Mock goals data
    const mockGoals: Goal[] = [
      {
        id: '1',
        title: 'Perder 8kg',
        description: 'Meta de redução de peso para melhorar saúde geral',
        target: 8,
        current: 3.2,
        unit: 'kg',
        category: 'weight',
        deadline: '2024-08-01',
        priority: 'high',
        status: 'active',
        milestones: [
          { id: '1', title: '2kg perdidos', value: 2, achieved: true, achievedAt: '2024-02-15' },
          { id: '2', title: '4kg perdidos', value: 4, achieved: false },
          { id: '3', title: '6kg perdidos', value: 6, achieved: false },
          { id: '4', title: 'Meta alcançada!', value: 8, achieved: false }
        ],
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        title: 'Supino 100kg',
        description: 'Aumentar carga máxima no supino reto',
        target: 100,
        current: 82,
        unit: 'kg',
        category: 'strength',
        deadline: '2024-06-15',
        priority: 'high',
        status: 'active',
        milestones: [
          { id: '1', title: '80kg alcançados', value: 80, achieved: true, achievedAt: '2024-02-20' },
          { id: '2', title: '90kg alcançados', value: 90, achieved: false },
          { id: '3', title: '100kg - Meta!', value: 100, achieved: false }
        ],
        createdAt: '2024-01-10'
      },
      {
        id: '3',
        title: 'Treinar 5x por semana',
        description: 'Manter consistência de treino',
        target: 5,
        current: 3.8,
        unit: 'vezes/semana',
        category: 'frequency',
        deadline: '2024-12-31',
        priority: 'medium',
        status: 'active',
        milestones: [
          { id: '1', title: '3x por semana', value: 3, achieved: true, achievedAt: '2024-01-30' },
          { id: '2', title: '4x por semana', value: 4, achieved: false },
          { id: '3', title: '5x por semana', value: 5, achieved: false }
        ],
        createdAt: '2024-01-05'
      },
      {
        id: '4',
        title: 'Corrida 10km',
        description: 'Correr 10km em menos de 50 minutos',
        target: 50,
        current: 58,
        unit: 'min',
        category: 'endurance',
        deadline: '2024-07-01',
        priority: 'medium',
        status: 'active',
        milestones: [
          { id: '1', title: 'Correr 5km', value: 5, achieved: true, achievedAt: '2024-02-01' },
          { id: '2', title: 'Correr 10km', value: 10, achieved: true, achievedAt: '2024-02-25' },
          { id: '3', title: 'Sub-55 min', value: 55, achieved: false },
          { id: '4', title: 'Sub-50 min', value: 50, achieved: false }
        ],
        createdAt: '2024-01-15'
      }
    ];

    setGoals(mockGoals);
  };

  const getCategoryColor = (category: Goal['category']) => {
    switch (category) {
      case 'weight': return DesignTokens.colors.error;
      case 'strength': return DesignTokens.colors.primary;
      case 'frequency': return DesignTokens.colors.success;
      case 'endurance': return DesignTokens.colors.warning;
      case 'body': return DesignTokens.colors.info;
      case 'habit': return DesignTokens.colors.secondary;
      default: return DesignTokens.colors.textSecondary;
    }
  };

  const getCategoryLabel = (category: Goal['category']) => {
    switch (category) {
      case 'weight': return 'Peso';
      case 'strength': return 'Força';
      case 'frequency': return 'Frequência';
      case 'endurance': return 'Resistência';
      case 'body': return 'Corporal';
      case 'habit': return 'Hábito';
      default: return 'Outro';
    }
  };

  const getPriorityColor = (priority: Goal['priority']) => {
    switch (priority) {
      case 'high': return DesignTokens.colors.error;
      case 'medium': return DesignTokens.colors.warning;
      case 'low': return DesignTokens.colors.success;
      default: return DesignTokens.colors.textSecondary;
    }
  };

  const calculateProgress = (goal: Goal) => {
    if (goal.category === 'endurance' && goal.unit === 'min') {
      // For time-based goals (lower is better)
      const improvement = ((goal.current - goal.target) / goal.current) * 100;
      return Math.max(0, Math.min(100, 100 - improvement));
    }
    return Math.min((goal.current / goal.target) * 100, 100);
  };

  const getDaysToDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredGoals = selectedCategory === 'all' 
    ? goals 
    : goals.filter(goal => goal.category === selectedCategory);

  const renderGoalsSummary = () => {
    const activeGoals = goals.filter(g => g.status === 'active').length;
    const completedGoals = goals.filter(g => g.status === 'completed').length;
    const totalMilestones = goals.reduce((sum, g) => sum + g.milestones.length, 0);
    const achievedMilestones = goals.reduce((sum, g) => sum + g.milestones.filter(m => m.achieved).length, 0);

    return (
      <Card style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <LinearGradient
            colors={[DesignTokens.colors.primary, `${DesignTokens.colors.primary}CC`]}
            style={styles.summaryGradient}
          >
            <Ionicons name="flag" size={28} color="white" />
            <Text variant="titleLarge" style={styles.summaryTitle}>
              Meus Objetivos
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.summaryContent}>
          <View style={styles.summaryStats}>
            <KPIWidget
              title="Ativas"
              value={activeGoals}
              icon="flag"
              color={DesignTokens.colors.primary}
              size="small"
              variant="minimal"
            />
            <KPIWidget
              title="Concluídas"
              value={completedGoals}
              icon="checkmark-circle"
              color={DesignTokens.colors.success}
              size="small"
              variant="minimal"
            />
            <KPIWidget
              title="Marcos"
              value={`${achievedMilestones}/${totalMilestones}`}
              subtitle="Alcançados"
              icon="trophy"
              color={DesignTokens.colors.warning}
              size="small"
              variant="minimal"
            />
          </View>
        </View>
      </Card>
    );
  };

  const renderCategoryFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filters}>
          {[
            { key: 'all', label: 'Todas', icon: 'apps' },
            { key: 'weight', label: 'Peso', icon: 'scale' },
            { key: 'strength', label: 'Força', icon: 'barbell' },
            { key: 'frequency', label: 'Frequência', icon: 'calendar' },
            { key: 'endurance', label: 'Resistência', icon: 'heart' },
            { key: 'body', label: 'Corporal', icon: 'body' },
            { key: 'habit', label: 'Hábitos', icon: 'checkmark-done' }
          ].map((category) => (
            <Chip
              key={category.key}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
              icon={category.icon}
              style={[
                styles.categoryChip,
                selectedCategory === category.key && {
                  backgroundColor: DesignTokens.colors.primary
                }
              ]}
              textStyle={selectedCategory === category.key ? { color: 'white' } : {}}
            >
              {category.label}
            </Chip>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderGoalCard = (goal: Goal) => {
    const progress = calculateProgress(goal);
    const daysLeft = getDaysToDeadline(goal.deadline);
    const nextMilestone = goal.milestones.find(m => !m.achieved);

    return (
      <Card key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={styles.goalInfo}>
            <View style={styles.goalTitleRow}>
              <Text variant="titleMedium" style={styles.goalTitle}>
                {goal.title}
              </Text>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(goal.priority) }]}>
                <Text style={styles.priorityText}>
                  {goal.priority === 'high' ? 'ALTA' : goal.priority === 'medium' ? 'MÉDIA' : 'BAIXA'}
                </Text>
              </View>
            </View>
            <Text variant="bodySmall" style={styles.goalDescription}>
              {goal.description}
            </Text>
            <View style={styles.goalMeta}>
              <Chip 
                mode="outlined" 
                style={[styles.categoryTag, { borderColor: getCategoryColor(goal.category) }]}
                textStyle={{ color: getCategoryColor(goal.category) }}
              >
                {getCategoryLabel(goal.category)}
              </Chip>
              <Text variant="bodySmall" style={styles.deadline}>
                {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Prazo vencido'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.goalProgress}>
          <View style={styles.progressHeader}>
            <Text variant="bodyMedium" style={styles.progressLabel}>
              Progresso: {goal.current} / {goal.target} {goal.unit}
            </Text>
            <Text variant="titleMedium" style={[styles.progressPercentage, { color: getCategoryColor(goal.category) }]}>
              {progress.toFixed(0)}%
            </Text>
          </View>

          <ProgressRing
            data={[{
              value: progress,
              maxValue: 100,
              label: 'Progresso',
              color: getCategoryColor(goal.category)
            }]}
            size={100}
            strokeWidth={6}
            showLabels={false}
            showValues={false}
            centerContent={
              <View style={styles.progressCenter}>
                <Text variant="headlineSmall" style={styles.progressCenterValue}>
                  {progress.toFixed(0)}%
                </Text>
              </View>
            }
          />

          {nextMilestone && (
            <View style={styles.nextMilestone}>
              <Text variant="bodySmall" style={styles.nextMilestoneLabel}>
                Próximo marco:
              </Text>
              <Text variant="bodyMedium" style={styles.nextMilestoneTitle}>
                {nextMilestone.title}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.milestones}>
          <Text variant="titleSmall" style={styles.milestonesTitle}>
            Marcos
          </Text>
          <View style={styles.milestonesList}>
            {goal.milestones.map((milestone, index) => (
              <View key={milestone.id} style={styles.milestoneItem}>
                <View style={[
                  styles.milestoneIcon,
                  { backgroundColor: milestone.achieved ? getCategoryColor(goal.category) : DesignTokens.colors.surfaceVariant }
                ]}>
                  <Ionicons 
                    name={milestone.achieved ? 'checkmark' : 'flag-outline'} 
                    size={14} 
                    color={milestone.achieved ? 'white' : DesignTokens.colors.textSecondary} 
                  />
                </View>
                <View style={styles.milestoneContent}>
                  <Text 
                    variant="bodySmall" 
                    style={[
                      styles.milestoneTitle,
                      milestone.achieved && styles.milestoneAchieved
                    ]}
                  >
                    {milestone.title}
                  </Text>
                  {milestone.achieved && milestone.achievedAt && (
                    <Text variant="bodySmall" style={styles.milestoneDate}>
                      {new Date(milestone.achievedAt).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                </View>
                {index < goal.milestones.length - 1 && (
                  <View style={[
                    styles.milestoneLine,
                    { backgroundColor: milestone.achieved ? getCategoryColor(goal.category) : DesignTokens.colors.outline }
                  ]} />
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.goalActions}>
          <Button 
            mode="outlined" 
            onPress={() => {}}
            style={styles.goalActionButton}
          >
            Editar
          </Button>
          <Button 
            mode="contained" 
            onPress={() => updateGoalProgress(goal)}
            style={[styles.goalActionButton, { backgroundColor: getCategoryColor(goal.category) }]}
          >
            Atualizar
          </Button>
        </View>
      </Card>
    );
  };

  const updateGoalProgress = (goal: Goal) => {
    Alert.prompt(
      'Atualizar Progresso',
      `Qual seu progresso atual em ${goal.unit}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Atualizar', 
          onPress: (value) => {
            if (value) {
              const newValue = parseFloat(value);
              if (!isNaN(newValue)) {
                // Update goal progress
                const updatedGoals = goals.map(g => {
                  if (g.id === goal.id) {
                    return { ...g, current: newValue };
                  }
                  return g;
                });
                setGoals(updatedGoals);
                
                // Check for milestone achievements
                checkMilestoneAchievements(goal, newValue);
              }
            }
          }
        }
      ],
      'plain-text',
      goal.current.toString()
    );
  };

  const checkMilestoneAchievements = (goal: Goal, newValue: number) => {
    const updatedMilestones = goal.milestones.map(milestone => {
      if (!milestone.achieved && newValue >= milestone.value) {
        Alert.alert(
          'Marco Alcançado! 🎉',
          `Parabéns! Você alcançou o marco: ${milestone.title}`,
          [{ text: 'Incrível!', style: 'default' }]
        );
        
        return {
          ...milestone,
          achieved: true,
          achievedAt: new Date().toISOString()
        };
      }
      return milestone;
    });

    // Update goals with new milestones
    const updatedGoals = goals.map(g => {
      if (g.id === goal.id) {
        return { ...g, milestones: updatedMilestones };
      }
      return g;
    });
    setGoals(updatedGoals);
  };

  const createNewGoal = () => {
    if (!newGoal.title || !newGoal.target) return;

    const goal: Goal = {
      id: Date.now().toString(),
      title: newGoal.title,
      description: newGoal.description,
      target: parseFloat(newGoal.target),
      current: 0,
      unit: newGoal.unit,
      category: newGoal.category,
      deadline: newGoal.deadline,
      priority: newGoal.priority,
      status: 'active',
      milestones: [],
      createdAt: new Date().toISOString()
    };

    setGoals([...goals, goal]);
    setShowNewGoalModal(false);
    setNewGoal({
      title: '',
      description: '',
      target: '',
      unit: '',
      category: 'weight',
      deadline: '',
      priority: 'medium'
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Meus Objetivos
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Defina e acompanhe suas metas fitness
          </Text>
        </View>

        {/* Goals Summary */}
        {renderGoalsSummary()}

        {/* Category Filters */}
        {renderCategoryFilters()}

        {/* Goals List */}
        <View style={styles.goalsList}>
          {filteredGoals.map(goal => renderGoalCard(goal))}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* New Goal Modal */}
      <Portal>
        <Modal 
          visible={showNewGoalModal} 
          onDismiss={() => setShowNewGoalModal(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Nova Meta
          </Text>

          <TextInput
            label="Título da meta"
            value={newGoal.title}
            onChangeText={(text) => setNewGoal({ ...newGoal, title: text })}
            style={styles.modalInput}
          />

          <TextInput
            label="Descrição (opcional)"
            value={newGoal.description}
            onChangeText={(text) => setNewGoal({ ...newGoal, description: text })}
            style={styles.modalInput}
            multiline
          />

          <View style={styles.modalRow}>
            <TextInput
              label="Meta"
              value={newGoal.target}
              onChangeText={(text) => setNewGoal({ ...newGoal, target: text })}
              style={[styles.modalInput, styles.modalInputHalf]}
              keyboardType="numeric"
            />

            <TextInput
              label="Unidade"
              value={newGoal.unit}
              onChangeText={(text) => setNewGoal({ ...newGoal, unit: text })}
              style={[styles.modalInput, styles.modalInputHalf]}
            />
          </View>

          <View style={styles.modalActions}>
            <Button onPress={() => setShowNewGoalModal(false)}>
              Cancelar
            </Button>
            <Button mode="contained" onPress={createNewGoal}>
              Criar Meta
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowNewGoalModal(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  headerTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  headerSubtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  summaryCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  summaryHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  summaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  summaryTitle: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginLeft: DesignTokens.spacing.md,
  },
  summaryContent: {
    padding: DesignTokens.spacing.lg,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  filtersContainer: {
    marginBottom: DesignTokens.spacing.lg,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  categoryChip: {
    backgroundColor: DesignTokens.colors.surface,
  },
  goalsList: {
    paddingHorizontal: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.md,
  },
  goalCard: {
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
    padding: DesignTokens.spacing.lg,
  },
  goalHeader: {
    marginBottom: DesignTokens.spacing.lg,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignTokens.spacing.sm,
  },
  goalTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
    flex: 1,
    marginRight: DesignTokens.spacing.sm,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  goalDescription: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: DesignTokens.spacing.md,
    lineHeight: 18,
  },
  goalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    backgroundColor: 'transparent',
  },
  deadline: {
    color: DesignTokens.colors.textSecondary,
  },
  goalProgress: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: DesignTokens.spacing.md,
  },
  progressLabel: {
    color: DesignTokens.colors.textPrimary,
  },
  progressPercentage: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenterValue: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  nextMilestone: {
    alignItems: 'center',
    marginTop: DesignTokens.spacing.md,
  },
  nextMilestoneLabel: {
    color: DesignTokens.colors.textSecondary,
  },
  nextMilestoneTitle: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
  },
  milestones: {
    marginBottom: DesignTokens.spacing.lg,
  },
  milestonesTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: DesignTokens.spacing.md,
    color: DesignTokens.colors.textPrimary,
  },
  milestonesList: {
    paddingLeft: DesignTokens.spacing.sm,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  milestoneIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: DesignTokens.spacing.sm,
    zIndex: 1,
  },
  milestoneContent: {
    flex: 1,
    paddingBottom: DesignTokens.spacing.md,
  },
  milestoneTitle: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  milestoneAchieved: {
    textDecorationLine: 'line-through',
    color: DesignTokens.colors.textSecondary,
  },
  milestoneDate: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  milestoneLine: {
    position: 'absolute',
    left: 11.5,
    top: 24,
    width: 1,
    height: '100%',
    zIndex: 0,
  },
  goalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.sm,
  },
  goalActionButton: {
    minWidth: 100,
  },
  modalContainer: {
    backgroundColor: DesignTokens.colors.surface,
    margin: DesignTokens.spacing.lg,
    borderRadius: DesignTokens.borderRadius.lg,
    padding: DesignTokens.spacing.lg,
  },
  modalTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: DesignTokens.spacing.lg,
    color: DesignTokens.colors.textPrimary,
  },
  modalInput: {
    marginBottom: DesignTokens.spacing.md,
  },
  modalRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
  },
  modalInputHalf: {
    flex: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.lg,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: DesignTokens.colors.primary,
  },
  bottomSpacing: {
    height: 100,
  },
});
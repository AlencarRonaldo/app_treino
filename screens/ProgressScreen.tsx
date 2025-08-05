import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Card, Text, SegmentedButtons, useTheme, Surface, ProgressBar } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../constants/designTokens';

const { width } = Dimensions.get('window');

export default function ProgressScreen() {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('weight');

  // Dados de exemplo mais ricos
  const weightData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [75.2, 75.8, 75.5, 76.2, 76.0, 76.5, 76.3],
        color: (opacity = 1) => DesignTokens.colors.primary,
        strokeWidth: 3,
      },
    ],
  };

  const workoutVolumeData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        data: [2800, 0, 3200, 2600, 0, 3500, 0],
        color: (opacity = 1) => DesignTokens.colors.secondary,
      },
    ],
  };

  const muscleGroupData = [
    {
      name: 'Peito',
      sets: 24,
      color: DesignTokens.colors.primary,
      legendFontColor: DesignTokens.colors.textPrimary,
      legendFontSize: 12,
    },
    {
      name: 'Costas',
      sets: 22,
      color: DesignTokens.colors.secondary,
      legendFontColor: DesignTokens.colors.textPrimary,
      legendFontSize: 12,
    },
    {
      name: 'Pernas',
      sets: 18,
      color: DesignTokens.colors.success,
      legendFontColor: DesignTokens.colors.textPrimary,
      legendFontSize: 12,
    },
    {
      name: 'Ombros',
      sets: 16,
      color: DesignTokens.colors.warning,
      legendFontColor: DesignTokens.colors.textPrimary,
      legendFontSize: 12,
    },
    {
      name: 'Braços',
      sets: 20,
      color: DesignTokens.colors.info,
      legendFontColor: DesignTokens.colors.textPrimary,
      legendFontSize: 12,
    },
  ];

  const chartConfig = {
    backgroundGradientFrom: DesignTokens.colors.surface,
    backgroundGradientTo: DesignTokens.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `${DesignTokens.colors.primary}${Math.round(opacity * 255).toString(16)}`,
    labelColor: (opacity = 1) => `${DesignTokens.colors.textPrimary}${Math.round(opacity * 255).toString(16)}`,
    style: {
      borderRadius: DesignTokens.borderRadius.lg,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: DesignTokens.colors.primary,
    },
  };

  const achievements = [
    { id: 1, title: 'Semana Completa', description: '7 treinos consecutivos', icon: 'medal', earned: true },
    { id: 2, title: 'Volume Master', description: '10K kg movimentados', icon: 'barbell', earned: true },
    { id: 3, title: 'Consistência', description: '30 dias seguidos', icon: 'calendar', earned: false },
    { id: 4, title: 'PR Crusher', description: '5 recordes quebrados', icon: 'trophy', earned: true },
  ];

  const weeklyGoals = [
    { name: 'Treinos', current: 5, target: 6, unit: '', color: DesignTokens.colors.primary },
    { name: 'Calorias', current: 2450, target: 3000, unit: 'kcal', color: DesignTokens.colors.error },
    { name: 'Volume', current: 15.2, target: 20, unit: 'ton', color: DesignTokens.colors.success },
    { name: 'Tempo', current: 285, target: 360, unit: 'min', color: DesignTokens.colors.warning },
  ];

  const renderWeeklyGoals = () => (
    <Card style={styles.goalsCard}>
      <View style={styles.cardHeaderWithGradient}>
        <LinearGradient
          colors={[DesignTokens.colors.primary, DesignTokens.colors.gradientEnd]}
          style={styles.goalHeaderGradient}
        >
          <Ionicons name="target" size={24} color="white" />
          <Text variant="titleMedium" style={styles.goalHeaderText}>
            Metas da Semana
          </Text>
        </LinearGradient>
      </View>
      
      <View style={styles.goalsContent}>
        {weeklyGoals.map((goal, index) => (
          <View key={index} style={styles.goalItem}>
            <View style={styles.goalInfo}>
              <Text variant="bodyMedium" style={styles.goalName}>{goal.name}</Text>
              <Text variant="bodySmall" style={styles.goalProgress}>
                {goal.current} / {goal.target} {goal.unit}
              </Text>
            </View>
            <View style={styles.goalProgressContainer}>
              <ProgressBar
                progress={goal.current / goal.target}
                color={goal.color}
                style={styles.goalProgressBar}
              />
              <Text variant="bodySmall" style={styles.goalPercentage}>
                {Math.round((goal.current / goal.target) * 100)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );

  const renderAchievements = () => (
    <Card style={styles.achievementsCard}>
      <Card.Title
        title="Conquistas"
        subtitle="Suas vitórias recentes"
        left={() => <Ionicons name="trophy" size={24} color={DesignTokens.colors.warning} />}
      />
      <Card.Content>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.achievementsContainer}>
            {achievements.map((achievement) => (
              <TouchableOpacity
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  !achievement.earned && styles.achievementLocked
                ]}
              >
                <View style={[
                  styles.achievementIcon,
                  { backgroundColor: achievement.earned ? DesignTokens.colors.warning : DesignTokens.colors.surfaceVariant }
                ]}>
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.earned ? 'white' : DesignTokens.colors.textSecondary}
                  />
                </View>
                <Text variant="bodySmall" style={styles.achievementTitle}>
                  {achievement.title}
                </Text>
                <Text variant="bodySmall" style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Seu Progresso
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Acompanhe sua evolução
        </Text>
      </View>

      {/* Seletor de Período */}
      <View style={styles.segmentedContainer}>
        <SegmentedButtons
          value={timeRange}
          onValueChange={setTimeRange}
          buttons={[
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mês' },
            { value: 'year', label: 'Ano' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {/* Metas da Semana */}
      {renderWeeklyGoals()}

      {/* Estatísticas em Cards Visuais */}
      <View style={styles.statsGrid}>
        <TouchableOpacity style={styles.statCard}>
          <LinearGradient
            colors={[DesignTokens.colors.primary, `${DesignTokens.colors.primary}CC`]}
            style={styles.statGradient}
          >
            <Ionicons name="barbell" size={28} color="white" />
            <Text variant="headlineSmall" style={styles.statValue}>12</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Treinos</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statTrendText}>+20%</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <LinearGradient
            colors={[DesignTokens.colors.error, `${DesignTokens.colors.error}CC`]}
            style={styles.statGradient}
          >
            <Ionicons name="flame" size={28} color="white" />
            <Text variant="headlineSmall" style={styles.statValue}>2.450</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Calorias</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statTrendText}>+15%</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <LinearGradient
            colors={[DesignTokens.colors.success, `${DesignTokens.colors.success}CC`]}
            style={styles.statGradient}
          >
            <Ionicons name="trending-up" size={28} color="white" />
            <Text variant="headlineSmall" style={styles.statValue}>+2.5kg</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Evolução</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statTrendText}>+8%</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.statCard}>
          <LinearGradient
            colors={[DesignTokens.colors.warning, `${DesignTokens.colors.warning}CC`]}
            style={styles.statGradient}
          >
            <Ionicons name="time" size={28} color="white" />
            <Text variant="headlineSmall" style={styles.statValue}>9h45</Text>
            <Text variant="bodySmall" style={styles.statLabel}>Tempo</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.statTrendText}>+25%</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Seletor de Métricas */}
      <View style={styles.metricsSelector}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Análise Detalhada
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.metricButtons}>
            {[
              { id: 'weight', label: 'Peso', icon: 'scale' },
              { id: 'volume', label: 'Volume', icon: 'barbell' },
              { id: 'muscles', label: 'Grupos', icon: 'body' },
            ].map((metric) => (
              <TouchableOpacity
                key={metric.id}
                style={[
                  styles.metricButton,
                  selectedMetric === metric.id && styles.selectedMetricButton
                ]}
                onPress={() => setSelectedMetric(metric.id)}
              >
                <Ionicons
                  name={metric.icon as any}
                  size={20}
                  color={selectedMetric === metric.id ? 'white' : DesignTokens.colors.textSecondary}
                />
                <Text style={[
                  styles.metricButtonText,
                  selectedMetric === metric.id && styles.selectedMetricButtonText
                ]}>
                  {metric.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Gráficos Condicionais */}
      {selectedMetric === 'weight' && (
        <Card style={styles.chartCard}>
          <Card.Title title="Evolução do Peso" subtitle="Últimos 7 dias" />
          <Card.Content>
            <LineChart
              data={weightData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {selectedMetric === 'volume' && (
        <Card style={styles.chartCard}>
          <Card.Title title="Volume de Treino" subtitle="Kg movimentados por dia" />
          <Card.Content>
            <BarChart
              data={workoutVolumeData}
              width={width - 64}
              height={220}
              yAxisLabel=""
              yAxisSuffix="kg"
              chartConfig={{
                ...chartConfig,
                color: (opacity = 1) => `${DesignTokens.colors.secondary}${Math.round(opacity * 255).toString(16)}`,
              }}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {selectedMetric === 'muscles' && (
        <Card style={styles.chartCard}>
          <Card.Title title="Distribuição por Grupo Muscular" subtitle="Séries realizadas esta semana" />
          <Card.Content>
            <PieChart
              data={muscleGroupData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              accessor="sets"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {/* Conquistas */}
      {renderAchievements()}

      {/* Recordes Pessoais Modernizado */}
      <Card style={styles.recordsCard}>
        <View style={styles.recordsHeader}>
          <Ionicons name="trophy" size={24} color={DesignTokens.colors.warning} />
          <View style={styles.recordsHeaderText}>
            <Text variant="titleMedium" style={styles.recordsTitle}>
              Recordes Pessoais
            </Text>
            <Text variant="bodySmall" style={styles.recordsSubtitle}>
              Suas melhores marcas
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.recordsContent}>
          {[
            { exercise: 'Supino Reto', weight: '80 kg', trend: '+5kg', color: DesignTokens.colors.primary },
            { exercise: 'Agachamento', weight: '100 kg', trend: '+10kg', color: DesignTokens.colors.success },
            { exercise: 'Terra', weight: '120 kg', trend: '+15kg', color: DesignTokens.colors.error },
          ].map((record, index) => (
            <View key={index} style={styles.recordItem}>
              <View style={[styles.recordIndicator, { backgroundColor: record.color }]} />
              <View style={styles.recordInfo}>
                <Text variant="bodyMedium" style={styles.recordExercise}>
                  {record.exercise}
                </Text>
                <Text variant="bodySmall" style={styles.recordTrend}>
                  {record.trend} esta semana
                </Text>
              </View>
              <Text variant="titleMedium" style={[styles.recordValue, { color: record.color }]}>
                {record.weight}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.background,
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
  segmentedContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.lg,
  },
  segmentedButtons: {
    backgroundColor: DesignTokens.colors.surface,
  },
  // Metas da Semana
  goalsCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  cardHeaderWithGradient: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  goalHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  goalHeaderText: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginLeft: DesignTokens.spacing.sm,
  },
  goalsContent: {
    padding: DesignTokens.spacing.lg,
  },
  goalItem: {
    marginBottom: DesignTokens.spacing.md,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: DesignTokens.spacing.xs,
  },
  goalName: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
  },
  goalProgress: {
    color: DesignTokens.colors.textSecondary,
  },
  goalProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: DesignTokens.colors.surfaceVariant,
    marginRight: DesignTokens.spacing.sm,
  },
  goalPercentage: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    minWidth: 40,
    textAlign: 'right',
  },
  // Estatísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 56) / 2,
    borderRadius: DesignTokens.borderRadius.xl,
    overflow: 'hidden',
    ...DesignTokens.shadows.lg,
  },
  statGradient: {
    padding: DesignTokens.spacing.lg,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'space-between',
  },
  statValue: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginTop: DesignTokens.spacing.xs,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: DesignTokens.typography.fontSize.sm,
    marginTop: DesignTokens.spacing.xs,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.xs,
  },
  statTrendText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: DesignTokens.typography.fontSize.xs,
    marginLeft: 4,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  // Seletor de métricas
  metricsSelector: {
    marginBottom: DesignTokens.spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  metricButtons: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.full,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.sm,
  },
  selectedMetricButton: {
    backgroundColor: DesignTokens.colors.primary,
  },
  metricButtonText: {
    marginLeft: DesignTokens.spacing.xs,
    fontSize: DesignTokens.typography.fontSize.sm,
    color: DesignTokens.colors.textSecondary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  selectedMetricButtonText: {
    color: 'white',
  },
  // Gráficos
  chartCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  chart: {
    marginVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.lg,
  },
  // Conquistas
  achievementsCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  achievementsContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.md,
    paddingRight: DesignTokens.spacing.lg,
  },
  achievementItem: {
    alignItems: 'center',
    width: 100,
  },
  achievementLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  achievementTitle: {
    textAlign: 'center',
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
    marginBottom: 2,
  },
  achievementDescription: {
    textAlign: 'center',
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.fontSize.xs,
  },
  // Recordes
  recordsCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  recordsHeaderText: {
    flex: 1,
    marginLeft: DesignTokens.spacing.sm,
  },
  recordsTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  recordsSubtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    color: DesignTokens.colors.primary,
    fontSize: DesignTokens.typography.fontSize.sm,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  recordsContent: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
  },
  recordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.outline,
  },
  recordIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: DesignTokens.spacing.md,
  },
  recordInfo: {
    flex: 1,
  },
  recordExercise: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
  },
  recordTrend: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  recordValue: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    fontSize: DesignTokens.typography.fontSize.lg,
  },
  bottomSpacing: {
    height: 100,
  },
});
import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { Card, Text, SegmentedButtons, useTheme, Surface, ProgressBar, FAB, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../constants/designTokens';
import { PerformanceCalculator } from '../services/PerformanceCalculator';
import AnalyticsChart from '../components/AnalyticsChart';
import KPIWidget from '../components/KPIWidget';
import ProgressRing from '../components/ProgressRing';
import ComparisonChart from '../components/ComparisonChart';
import WebCompatibleChart from '../components/WebCompatibleChart';
import WebCompatiblePressable from '../components/WebCompatiblePressable';
import {
  SPACING,
  TYPOGRAPHY,
  getResponsiveLayout,
  getProgressChartSize,
  getSafeAreaPadding,
  getResponsiveValue,
  isSmallMobile,
  getResponsiveGridColumns,
  getGridItemWidth
} from '../utils/responsive';

const { width } = Dimensions.get('window');
const layout = getResponsiveLayout();
const safeArea = getSafeAreaPadding();
const chartSize = getProgressChartSize();

export default function ProgressScreen({ navigation }: { navigation?: any }) {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('weight');
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPerformanceData();
  }, [timeRange]);

  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const data = await PerformanceCalculator.generateMockProgressData();
      
      // Calculate additional metrics
      const injuryRisk = PerformanceCalculator.calculateInjuryRisk(
        data.workoutSessions,
        data.bodyMetrics
      );

      const strengthImprovement = PerformanceCalculator.calculateStrengthImprovement([
        { name: 'Supino Reto', records: data.workoutSessions.map(s => ({ date: s.date, sets: s.exercises[0].sets })) },
        { name: 'Agachamento', records: data.workoutSessions.map(s => ({ date: s.date, sets: s.exercises[1].sets })) }
      ]);

      setPerformanceData({
        ...data,
        injuryRisk,
        strengthImprovement
      });
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

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
              <WebCompatiblePressable
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
              </WebCompatiblePressable>
            ))}
          </View>
        </ScrollView>
      </Card.Content>
    </Card>
  );

  const renderAdvancedKPIs = () => {
    if (!performanceData) return null;

    const latestBodyMetric = performanceData.bodyMetrics[performanceData.bodyMetrics.length - 1];
    const previousBodyMetric = performanceData.bodyMetrics[performanceData.bodyMetrics.length - 7] || latestBodyMetric;
    const weightChange = latestBodyMetric.weight - previousBodyMetric.weight;

    return (
      <View style={styles.advancedKPIs}>
        <View style={styles.kpiRow}>
          <KPIWidget
            title="Peso Atual"
            value={`${latestBodyMetric.weight}kg`}
            trend={{
              value: Math.abs(weightChange),
              direction: weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable',
              label: 'vs semana passada'
            }}
            icon="scale"
            color={DesignTokens.colors.primary}
            size="medium"
          />
          
          <KPIWidget
            title="Risco de Lesão"
            value={`${performanceData.injuryRisk.riskScore}%`}
            subtitle={performanceData.injuryRisk.riskLevel === 'low' ? 'Baixo' : 'Moderado'}
            icon="shield-checkmark"
            color={performanceData.injuryRisk.riskLevel === 'low' ? DesignTokens.colors.success : DesignTokens.colors.warning}
            size="medium"
          />
        </View>
      </View>
    );
  };

  const renderPersonalRecords = () => {
    if (!performanceData?.personalRecords) return null;

    return (
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
          <Button onPress={() => navigation?.navigate('PersonalGoals')}>
            Ver metas
          </Button>
        </View>
        
        <View style={styles.recordsContent}>
          {performanceData.personalRecords.map((record: any, index: number) => (
            <View key={index} style={styles.recordItem}>
              <View style={[styles.recordIndicator, { backgroundColor: DesignTokens.colors.primary }]} />
              <View style={styles.recordInfo}>
                <Text variant="bodyMedium" style={styles.recordExercise}>
                  {record.exercise}
                </Text>
                <Text variant="bodySmall" style={styles.recordDate}>
                  {new Date(record.date).toLocaleDateString('pt-BR')}
                </Text>
              </View>
              <Text variant="titleMedium" style={[styles.recordValue, { color: DesignTokens.colors.primary }]}>
                {record.weight}kg
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderMotivationalInsights = () => {
    if (!performanceData) return null;

    const totalWorkouts = performanceData.workoutSessions.length;
    const averageRating = performanceData.workoutSessions
      .filter((s: any) => s.rating)
      .reduce((sum: number, s: any) => sum + s.rating, 0) / 
      performanceData.workoutSessions.filter((s: any) => s.rating).length;

    const insights = [
      {
        icon: 'fitness' as keyof typeof Ionicons.glyphMap,
        title: 'Treinos Realizados',
        value: totalWorkouts,
        subtitle: 'Nos últimos 90 dias',
        color: DesignTokens.colors.primary
      },
      {
        icon: 'happy' as keyof typeof Ionicons.glyphMap,
        title: 'Satisfação Média',
        value: `${averageRating.toFixed(1)}/5`,
        subtitle: 'Avaliação dos treinos',
        color: DesignTokens.colors.success
      },
      {
        icon: 'trending-up' as keyof typeof Ionicons.glyphMap,
        title: 'Melhoria na Força',
        value: `+${performanceData.strengthImprovement[0]?.improvement.toFixed(1) || 0}%`,
        subtitle: 'Supino reto',
        color: DesignTokens.colors.warning
      }
    ];

    return (
      <Card style={styles.insightsCard}>
        <View style={styles.insightsHeader}>
          <LinearGradient
            colors={[DesignTokens.colors.success, `${DesignTokens.colors.success}CC`]}
            style={styles.insightsGradient}
          >
            <Ionicons name="bulb" size={28} color="white" />
            <Text variant="titleMedium" style={styles.insightsTitle}>
              Insights Motivacionais
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.insightsGrid}>
          {insights.map((insight, index) => (
            <View key={index} style={styles.insightItem}>
              <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
                <Ionicons name={insight.icon} size={24} color="white" />
              </View>
              <Text variant="headlineSmall" style={styles.insightValue}>
                {insight.value}
              </Text>
              <Text variant="bodySmall" style={styles.insightTitle}>
                {insight.title}
              </Text>
              <Text variant="bodySmall" style={styles.insightSubtitle}>
                {insight.subtitle}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    );
  };

  const renderProgressComparison = () => {
    if (!performanceData?.bodyMetrics) return null;

    const recent = performanceData.bodyMetrics.slice(-7); // Last week
    const previous = performanceData.bodyMetrics.slice(-14, -7); // Previous week

    if (recent.length === 0 || previous.length === 0) return null;

    const recentAvgWeight = recent.reduce((sum: number, m: any) => sum + m.weight, 0) / recent.length;
    const previousAvgWeight = previous.reduce((sum: number, m: any) => sum + m.weight, 0) / previous.length;

    const comparisonData = [
      {
        label: 'Peso Médio',
        current: recentAvgWeight,
        previous: previousAvgWeight,
        unit: 'kg'
      }
    ];

    return (
      <ComparisonChart
        title="Comparação Semanal"
        data={comparisonData}
        comparisonType="vs-previous"
        showPercentageImprovement={true}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Seu Progresso
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Acompanhe sua evolução fitness
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

        {/* Advanced KPIs */}
        {renderAdvancedKPIs()}

      {/* Metas da Semana */}
      {renderWeeklyGoals()}

      {/* Estatísticas em Cards Visuais */}
      <View style={styles.statsGrid}>
        <WebCompatiblePressable style={styles.statCard}>
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
        </WebCompatiblePressable>

        <WebCompatiblePressable style={styles.statCard}>
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
        </WebCompatiblePressable>

        <WebCompatiblePressable style={styles.statCard}>
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
        </WebCompatiblePressable>

        <WebCompatiblePressable style={styles.statCard}>
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
        </WebCompatiblePressable>
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
              <WebCompatiblePressable
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
              </WebCompatiblePressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Gráficos Condicionais */}
      {selectedMetric === 'weight' && (
        <Card style={styles.chartCard}>
          <Card.Title title="Evolução do Peso" subtitle="Últimos 7 dias" />
          <Card.Content>
            <WebCompatibleChart
              type="line"
              data={weightData}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

      {selectedMetric === 'volume' && (
        <Card style={styles.chartCard}>
          <Card.Title title="Volume de Treino" subtitle="Kg movimentados por dia" />
          <Card.Content>
            <WebCompatibleChart
              type="bar"
              data={workoutVolumeData}
              width={width - 64}
              height={220}
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
            <WebCompatibleChart
              type="pie"
              data={{
                labels: muscleGroupData.map(item => item.name),
                datasets: [{
                  data: muscleGroupData.map(item => item.sets)
                }]
              }}
              width={width - 64}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          </Card.Content>
        </Card>
      )}

        {/* Progress Comparison */}
        {renderProgressComparison()}

        {/* Motivational Insights */}
        {renderMotivationalInsights()}

        {/* Conquistas */}
        {renderAchievements()}

        {/* Personal Records Enhanced */}
        {renderPersonalRecords()}

        {/* Original Records Card - Keeping for backward compatibility */}
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
          <WebCompatiblePressable>
            <Text style={styles.seeAllText}>Ver todos</Text>
          </WebCompatiblePressable>
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

      {/* Quick Action FABs */}
      <FAB.Group
        open={false}
        visible
        icon="plus"
        actions={[
          {
            icon: 'flag',
            label: 'Nova Meta',
            onPress: () => navigation?.navigate('PersonalGoals'),
          },
          {
            icon: 'trophy',
            label: 'Conquistas',
            onPress: () => navigation?.navigate('Achievements'),
          },
          {
            icon: 'camera',
            label: 'Foto Progresso',
            onPress: () => {},
          },
        ]}
        onStateChange={() => {}}
        style={styles.fabGroup}
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
    paddingHorizontal: layout.containerPadding,
    paddingTop: Math.max(SPACING.XL, safeArea.paddingTop),
    paddingBottom: SPACING.MD,
  },
  headerTitle: {
    ...TYPOGRAPHY.H2,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  headerSubtitle: {
    ...TYPOGRAPHY.BODY,
    color: DesignTokens.colors.textSecondary,
    marginTop: SPACING.XXS,
  },
  segmentedContainer: {
    paddingHorizontal: layout.containerPadding,
    marginBottom: SPACING.LG,
  },
  segmentedButtons: {
    backgroundColor: DesignTokens.colors.surface,
  },
  // Metas da Semana
  goalsCard: {
    marginHorizontal: layout.containerPadding,
    marginBottom: SPACING.LG,
    backgroundColor: DesignTokens.colors.surface,
    borderRadius: layout.borderRadius,
    ...DesignTokens.shadows.md,
  },
  cardHeaderWithGradient: {
    overflow: 'hidden',
    borderTopLeftRadius: layout.borderRadius,
    borderTopRightRadius: layout.borderRadius,
  },
  goalHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.cardPadding,
  },
  goalHeaderText: {
    ...TYPOGRAPHY.H5,
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginLeft: SPACING.SM,
  },
  goalsContent: {
    padding: layout.cardPadding,
  },
  goalItem: {
    marginBottom: SPACING.MD,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.XS,
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
  // New styles for enhanced features
  advancedKPIs: {
    marginBottom: DesignTokens.spacing.lg,
  },
  kpiRow: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
  },
  insightsCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  insightsHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  insightsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  insightsTitle: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginLeft: DesignTokens.spacing.md,
  },
  insightsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignTokens.spacing.lg,
  },
  insightItem: {
    alignItems: 'center',
    flex: 1,
  },
  insightIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  insightValue: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
    marginBottom: 4,
  },
  insightTitle: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 2,
  },
  insightSubtitle: {
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
  },
  recordDate: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
  fabGroup: {
    paddingBottom: 16,
  },
});
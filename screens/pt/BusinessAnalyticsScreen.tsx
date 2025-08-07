import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons, FAB, Surface } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DesignTokens } from '../../constants/designTokens';
import { BusinessMetricsService } from '../../services/BusinessMetricsService';
import { AnalyticsService } from '../../services/AnalyticsService';
import AnalyticsChart from '../../components/AnalyticsChart';
import KPIWidget from '../../components/KPIWidget';
import ComparisonChart from '../../components/ComparisonChart';

export default function BusinessAnalyticsScreen() {
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [businessData, setBusinessData] = useState<any>(null);

  useEffect(() => {
    loadBusinessData();
  }, [timeRange]);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      const [
        revenue,
        studentMetrics,
        workoutAnalytics,
        communicationMetrics,
        marketInsights,
        predictions
      ] = await Promise.all([
        BusinessMetricsService.calculateRevenue(timeRange as any),
        BusinessMetricsService.calculateStudentMetrics(),
        BusinessMetricsService.calculateWorkoutAnalytics(),
        BusinessMetricsService.calculateCommunicationMetrics(),
        BusinessMetricsService.getMarketInsights(),
        BusinessMetricsService.generateBusinessPredictions()
      ]);

      setBusinessData({
        revenue,
        studentMetrics,
        workoutAnalytics,
        communicationMetrics,
        marketInsights,
        predictions
      });
    } catch (error) {
      console.error('Error loading business data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadBusinessData();
    setRefreshing(false);
  };

  const renderExecutiveKPIs = () => {
    if (!businessData) return null;

    return (
      <View style={styles.section}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          KPIs Executivos
        </Text>
        
        <View style={styles.kpiGrid}>
          <KPIWidget
            title="Receita Mensal"
            value={`R$ ${businessData.revenue.total.toLocaleString()}`}
            trend={{
              value: businessData.revenue.trend,
              direction: businessData.revenue.direction,
              label: 'vs mês anterior'
            }}
            icon="cash"
            color={DesignTokens.colors.success}
            variant="gradient"
            size="medium"
          />

          <KPIWidget
            title="Alunos Ativos"
            value={businessData.studentMetrics.active}
            trend={{
              value: businessData.studentMetrics.new,
              direction: 'up',
              label: 'novos este mês'
            }}
            icon="people"
            color={DesignTokens.colors.primary}
            variant="gradient"
            size="medium"
          />

          <KPIWidget
            title="Taxa de Retenção"
            value={`${businessData.studentMetrics.retentionRate}%`}
            trend={{
              value: 2.5,
              direction: 'up',
              label: 'vs média'
            }}
            icon="heart"
            color={DesignTokens.colors.warning}
            variant="gradient"
            size="medium"
          />

          <KPIWidget
            title="Lifetime Value"
            value={`R$ ${businessData.studentMetrics.clv.toLocaleString()}`}
            subtitle="Valor médio por aluno"
            icon="trending-up"
            color={DesignTokens.colors.info}
            variant="gradient"
            size="medium"
          />
        </View>
      </View>
    );
  };

  const renderRevenueAnalysis = () => {
    if (!businessData) return null;

    // Mock revenue breakdown data for chart
    const revenueData = {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        data: [8500, 9200, 8800, 10500, 11200, businessData.revenue.total],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 3
      }]
    };

    return (
      <View style={styles.section}>
        <AnalyticsChart
          type="line"
          data={revenueData}
          title="Evolução da Receita"
          subtitle="Receita mensal recorrente"
          showExportButton={true}
          interactive={true}
        />
      </View>
    );
  };

  const renderStudentAnalytics = () => {
    if (!businessData) return null;

    const studentComparisonData = [
      {
        label: 'Aquisição',
        current: businessData.studentMetrics.new,
        previous: 6,
        unit: ' alunos'
      },
      {
        label: 'Retenção',
        current: businessData.studentMetrics.retentionRate,
        previous: 82.5,
        unit: '%'
      },
      {
        label: 'Churn Rate',
        current: businessData.studentMetrics.churnRate,
        previous: 18.5,
        unit: '%',
        color: DesignTokens.colors.error
      }
    ];

    return (
      <View style={styles.section}>
        <ComparisonChart
          title="Métricas de Alunos"
          data={studentComparisonData}
          comparisonType="vs-previous"
          showPercentageImprovement={true}
          showStatisticalSignificance={true}
        />
      </View>
    );
  };

  const renderWorkoutPerformance = () => {
    if (!businessData) return null;

    const workoutPopularity = {
      labels: businessData.workoutAnalytics.mostPopular.slice(0, 5).map(w => w.name.substring(0, 8)),
      datasets: [{
        data: businessData.workoutAnalytics.mostPopular.slice(0, 5).map(w => w.sessionCount),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`
      }]
    };

    return (
      <View style={styles.section}>
        <AnalyticsChart
          type="bar"
          data={workoutPopularity}
          title="Treinos Mais Populares"
          subtitle="Número de sessões realizadas"
          height={200}
        />
      </View>
    );
  };

  const renderMarketIntelligence = () => {
    if (!businessData) return null;

    return (
      <Card style={styles.marketCard}>
        <View style={styles.marketHeader}>
          <LinearGradient
            colors={[DesignTokens.colors.info, `${DesignTokens.colors.info}CC`]}
            style={styles.marketGradient}
          >
            <Ionicons name="analytics" size={28} color="white" />
            <Text variant="titleMedium" style={styles.marketTitle}>
              Inteligência de Mercado
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.marketContent}>
          <View style={styles.marketMetric}>
            <Text variant="bodySmall" style={styles.marketLabel}>
              Crescimento da Indústria
            </Text>
            <Text variant="headlineSmall" style={styles.marketValue}>
              {businessData.marketInsights.industryGrowth}%
            </Text>
          </View>

          <View style={styles.trendsContainer}>
            <Text variant="titleSmall" style={styles.trendsTitle}>
              Tendências de Mercado
            </Text>
            {businessData.marketInsights.marketTrends.map((trend, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={styles.trendInfo}>
                  <Text variant="bodyMedium" style={styles.trendName}>
                    {trend.trend}
                  </Text>
                  <View style={styles.trendOpportunity}>
                    <View style={[
                      styles.opportunityBadge,
                      { backgroundColor: trend.opportunity === 'very-high' ? DesignTokens.colors.success : 
                                         trend.opportunity === 'high' ? DesignTokens.colors.warning : 
                                         DesignTokens.colors.info }
                    ]}>
                      <Text style={styles.opportunityText}>
                        {trend.opportunity === 'very-high' ? 'Muito Alta' :
                         trend.opportunity === 'high' ? 'Alta' : 'Média'}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text variant="titleSmall" style={styles.trendGrowth}>
                  +{trend.growth}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Card>
    );
  };

  const renderPredictiveAnalytics = () => {
    if (!businessData) return null;

    return (
      <Card style={styles.predictionCard}>
        <View style={styles.predictionHeader}>
          <Ionicons name="trending-up" size={24} color={DesignTokens.colors.primary} />
          <Text variant="titleMedium" style={styles.predictionTitle}>
            Previsões para Próximo Mês
          </Text>
        </View>

        <View style={styles.predictionGrid}>
          <View style={styles.predictionItem}>
            <Text variant="bodySmall" style={styles.predictionLabel}>
              Receita Prevista
            </Text>
            <Text variant="headlineSmall" style={styles.predictionValue}>
              R$ {businessData.predictions.revenue.nextMonth.toLocaleString()}
            </Text>
            <Text variant="bodySmall" style={styles.predictionConfidence}>
              {businessData.predictions.revenue.confidence}% de confiança
            </Text>
          </View>

          <View style={styles.predictionItem}>
            <Text variant="bodySmall" style={styles.predictionLabel}>
              Novos Alunos
            </Text>
            <Text variant="headlineSmall" style={styles.predictionValue}>
              {businessData.predictions.studentGrowth.nextMonth}
            </Text>
            <Text variant="bodySmall" style={styles.predictionConfidence}>
              {businessData.predictions.studentGrowth.confidence}% de confiança
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Business Intelligence
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            Dashboard executivo do seu negócio
          </Text>
        </View>

        {/* Time Range Selector */}
        <View style={styles.timeRangeContainer}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
              { value: 'year', label: 'Ano' },
            ]}
          />
        </View>

        {/* Executive KPIs */}
        {renderExecutiveKPIs()}

        {/* Revenue Analysis */}
        {renderRevenueAnalysis()}

        {/* Student Analytics */}
        {renderStudentAnalytics()}

        {/* Workout Performance */}
        {renderWorkoutPerformance()}

        {/* Market Intelligence */}
        {renderMarketIntelligence()}

        {/* Predictive Analytics */}
        {renderPredictiveAnalytics()}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button for Reports */}
      <FAB
        icon="file-document"
        style={styles.fab}
        onPress={() => {
          // Navigate to detailed reports or export
          console.log('Generate detailed report');
        }}
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
  timeRangeContainer: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.lg,
  },
  section: {
    marginBottom: DesignTokens.spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: DesignTokens.spacing.lg,
    marginBottom: DesignTokens.spacing.md,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
  },
  marketCard: {
    marginHorizontal: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  marketHeader: {
    overflow: 'hidden',
    borderTopLeftRadius: DesignTokens.borderRadius.lg,
    borderTopRightRadius: DesignTokens.borderRadius.lg,
  },
  marketGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
  },
  marketTitle: {
    color: 'white',
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginLeft: DesignTokens.spacing.md,
  },
  marketContent: {
    padding: DesignTokens.spacing.lg,
  },
  marketMetric: {
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.lg,
  },
  marketLabel: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: 4,
  },
  marketValue: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  trendsContainer: {
    marginTop: DesignTokens.spacing.md,
  },
  trendsTitle: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: DesignTokens.spacing.md,
    color: DesignTokens.colors.textPrimary,
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DesignTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.outline,
  },
  trendInfo: {
    flex: 1,
  },
  trendName: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
  },
  trendOpportunity: {
    marginTop: 4,
  },
  opportunityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  opportunityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  trendGrowth: {
    color: DesignTokens.colors.success,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  predictionCard: {
    marginHorizontal: DesignTokens.spacing.md,
    marginBottom: DesignTokens.spacing.lg,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  predictionTitle: {
    marginLeft: DesignTokens.spacing.sm,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  predictionGrid: {
    flexDirection: 'row',
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.lg,
  },
  predictionItem: {
    flex: 1,
    alignItems: 'center',
    padding: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.surfaceVariant,
    borderRadius: DesignTokens.borderRadius.md,
  },
  predictionLabel: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: 4,
  },
  predictionValue: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    marginBottom: 4,
  },
  predictionConfidence: {
    color: DesignTokens.colors.textSecondary,
    fontSize: 10,
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
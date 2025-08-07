/**
 * LiveDashboardWidget - Componente para exibir métricas e analytics em tempo real
 * Dashboard cards com animações e updates automáticos
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Card, Chip, IconButton, ProgressBar } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolateColor,
  useDerivedValue
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LiveMetric, KPIData, ChartData, AlertData } from '../hooks/useLiveAnalytics';

const { width } = Dimensions.get('window');
const AnimatedCard = Animated.createAnimatedComponent(Card);

interface MetricCardProps {
  metric: LiveMetric;
  size?: 'small' | 'medium' | 'large';
  showTrend?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  metric,
  size = 'medium',
  showTrend = true
}) => {
  const animatedValue = useSharedValue(0);
  const trendColor = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withSpring(metric.value, { damping: 15 });
    
    // Trend color animation
    switch (metric.trend) {
      case 'up':
        trendColor.value = withSpring(1); // Verde
        break;
      case 'down':
        trendColor.value = withSpring(-1); // Vermelho
        break;
      default:
        trendColor.value = withSpring(0); // Neutro
        break;
    }
  }, [metric.value, metric.trend]);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      trendColor.value,
      [-1, 0, 1],
      ['rgba(244, 67, 54, 0.05)', 'rgba(158, 158, 158, 0.05)', 'rgba(76, 175, 80, 0.05)']
    );

    return { backgroundColor };
  });

  const cardSize = {
    small: styles.smallCard,
    medium: styles.mediumCard,
    large: styles.largeCard
  }[size];

  const textSize = {
    small: 14,
    medium: 18,
    large: 24
  }[size];

  const getTrendIcon = () => {
    switch (metric.trend) {
      case 'up': return 'trending-up';
      case 'down': return 'trending-down';
      default: return 'remove';
    }
  };

  const getTrendColor = () => {
    switch (metric.trend) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(0);
  };

  return (
    <AnimatedCard style={[cardSize, animatedStyle]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.metricName, { fontSize: textSize * 0.6 }]}>
            {metric.name}
          </Text>
          {showTrend && (
            <View style={styles.trendContainer}>
              <Ionicons 
                name={getTrendIcon()} 
                size={16} 
                color={getTrendColor()} 
              />
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {Math.abs(metric.changePercent).toFixed(1)}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.valueContainer}>
          <Text style={[styles.metricValue, { fontSize: textSize }]}>
            {formatValue(metric.value)}
          </Text>
          <Text style={styles.metricUnit}>
            {metric.unit}
          </Text>
        </View>

        {metric.targetValue && (
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={Math.min(metric.value / metric.targetValue, 1)}
              color={metric.value >= metric.targetValue ? '#4CAF50' : '#FF9800'}
              style={styles.progressBar}
            />
            <Text style={styles.targetText}>
              Meta: {formatValue(metric.targetValue)} {metric.unit}
            </Text>
          </View>
        )}
      </Card.Content>
    </AnimatedCard>
  );
};

interface KPICardProps {
  kpi: KPIData;
  compact?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ kpi, compact = false }) => {
  const progressValue = useSharedValue(0);

  React.useEffect(() => {
    progressValue.value = withSpring(kpi.progress / 100, { damping: 12 });
  }, [kpi.progress]);

  const getStatusColor = () => {
    switch (kpi.status) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'warning': return '#FF9800';
      case 'critical': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = () => {
    switch (kpi.status) {
      case 'excellent': return 'checkmark-circle';
      case 'good': return 'checkmark';
      case 'warning': return 'warning';
      case 'critical': return 'close-circle';
      default: return 'help-circle';
    }
  };

  return (
    <Card style={[compact ? styles.compactKPICard : styles.kpiCard]}>
      <Card.Content style={styles.kpiContent}>
        <View style={styles.kpiHeader}>
          <Text style={styles.kpiTitle}>{kpi.title}</Text>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor() }]}>
            <Ionicons 
              name={getStatusIcon()} 
              size={16} 
              color="white" 
            />
          </View>
        </View>

        <View style={styles.kpiValues}>
          <Text style={styles.kpiCurrentValue}>
            {kpi.value.toFixed(0)} {kpi.unit}
          </Text>
          <Text style={styles.kpiTargetValue}>
            / {kpi.target} {kpi.unit}
          </Text>
        </View>

        <View style={styles.kpiProgress}>
          <ProgressBar
            progress={kpi.progress / 100}
            color={getStatusColor()}
            style={styles.kpiProgressBar}
          />
          <Text style={[styles.kpiProgressText, { color: getStatusColor() }]}>
            {kpi.progress.toFixed(0)}%
          </Text>
        </View>

        {!compact && (
          <Text style={styles.kpiTrend}>
            {kpi.trend === 'improving' ? '↗ Melhorando' :
             kpi.trend === 'declining' ? '↘ Declinando' :
             '→ Estável'}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

interface LiveChartProps {
  chart: ChartData;
  height?: number;
}

export const LiveChart: React.FC<LiveChartProps> = ({ chart, height = 220 }) => {
  const chartWidth = width - 32;

  const chartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0
  };

  const renderChart = () => {
    switch (chart.type) {
      case 'line':
        return (
          <LineChart
            data={{
              labels: chart.data.map(d => d.label || d.x.toString().slice(0, 5)),
              datasets: [{ data: chart.data.map(d => d.y) }]
            }}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        );

      case 'bar':
        return (
          <BarChart
            data={{
              labels: chart.data.map(d => d.label || d.x.toString().slice(0, 5)),
              datasets: [{ data: chart.data.map(d => d.y) }]
            }}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        );

      case 'pie':
        const colors = ['#FF6B35', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
        return (
          <PieChart
            data={chart.data.map((d, index) => ({
              name: d.label || d.x.toString(),
              population: d.y,
              color: colors[index % colors.length],
              legendFontColor: '#333333',
              legendFontSize: 12
            }))}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        );

      default:
        return <Text>Tipo de gráfico não suportado</Text>;
    }
  };

  return (
    <Card style={styles.chartCard}>
      <Card.Content>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{chart.title}</Text>
          <Chip compact mode="outlined">
            {chart.period}
          </Chip>
        </View>
        {renderChart()}
        <Text style={styles.chartUpdateTime}>
          Atualizado: {new Date(chart.updatedAt).toLocaleTimeString('pt-BR')}
        </Text>
      </Card.Content>
    </Card>
  );
};

interface AlertPanelProps {
  alerts: AlertData[];
  onAlertPress?: (alert: AlertData) => void;
  maxVisible?: number;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts,
  onAlertPress,
  maxVisible = 3
}) => {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const unreadCount = alerts.filter(a => !a.isRead).length;

  const getAlertColor = (type: AlertData['type']) => {
    switch (type) {
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      case 'success': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getAlertIcon = (type: AlertData['type']) => {
    switch (type) {
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      case 'success': return 'checkmark-circle';
      default: return 'help-circle';
    }
  };

  if (alerts.length === 0) {
    return (
      <Card style={styles.alertPanel}>
        <Card.Content style={styles.noAlertsContent}>
          <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
          <Text style={styles.noAlertsText}>Nenhum alerta ativo</Text>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.alertPanel}>
      <Card.Content>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>
            Alertas {unreadCount > 0 && `(${unreadCount} novos)`}
          </Text>
        </View>

        <ScrollView style={styles.alertList} showsVerticalScrollIndicator={false}>
          {visibleAlerts.map(alert => (
            <View 
              key={alert.id} 
              style={[
                styles.alertItem,
                { borderLeftColor: getAlertColor(alert.type) },
                !alert.isRead && styles.unreadAlert
              ]}
              onTouchEnd={() => onAlertPress?.(alert)}
            >
              <View style={styles.alertContent}>
                <Ionicons 
                  name={getAlertIcon(alert.type)} 
                  size={20} 
                  color={getAlertColor(alert.type)} 
                />
                <View style={styles.alertTextContainer}>
                  <Text style={[
                    styles.alertItemTitle,
                    !alert.isRead && styles.unreadText
                  ]}>
                    {alert.title}
                  </Text>
                  <Text style={styles.alertItemMessage}>
                    {alert.message}
                  </Text>
                  <Text style={styles.alertItemTime}>
                    {new Date(alert.createdAt).toLocaleString('pt-BR')}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>

        {alerts.length > maxVisible && (
          <Text style={styles.moreAlertsText}>
            +{alerts.length - maxVisible} alertas adicionais
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  // Metric Cards
  smallCard: {
    width: (width - 48) / 3,
    marginRight: 8,
    marginBottom: 8,
  },
  mediumCard: {
    width: (width - 40) / 2,
    marginRight: 8,
    marginBottom: 12,
  },
  largeCard: {
    width: width - 32,
    marginBottom: 16,
  },
  cardContent: {
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricName: {
    fontWeight: '500',
    color: '#666',
    flex: 1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  metricUnit: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    marginBottom: 4,
  },
  targetText: {
    fontSize: 10,
    color: '#666',
  },

  // KPI Cards
  kpiCard: {
    marginBottom: 12,
  },
  compactKPICard: {
    marginBottom: 8,
  },
  kpiContent: {
    padding: 16,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusChip: {
    borderRadius: 12,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  kpiCurrentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  kpiTargetValue: {
    fontSize: 16,
    color: '#666',
    marginLeft: 4,
  },
  kpiProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiProgressBar: {
    flex: 1,
    height: 6,
    marginRight: 8,
  },
  kpiProgressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  kpiTrend: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  // Charts
  chartCard: {
    marginBottom: 16,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  chartUpdateTime: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },

  // Alerts
  alertPanel: {
    marginBottom: 16,
  },
  noAlertsContent: {
    alignItems: 'center',
    padding: 24,
  },
  noAlertsText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  alertHeader: {
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  alertList: {
    maxHeight: 200,
  },
  alertItem: {
    borderLeftWidth: 4,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    padding: 12,
  },
  unreadAlert: {
    backgroundColor: '#E3F2FD',
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  alertItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  alertItemMessage: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  alertItemTime: {
    fontSize: 10,
    color: '#999',
  },
  moreAlertsText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
    marginTop: 8,
  },
});

export default LiveDashboardWidget;
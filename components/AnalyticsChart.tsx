import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Surface, useTheme } from 'react-native-paper';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../constants/designTokens';

const { width } = Dimensions.get('window');

interface ChartData {
  labels: string[];
  datasets: any[];
}

interface PieData {
  name: string;
  value: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'progress' | 'area';
  data: ChartData | PieData[] | any;
  title: string;
  subtitle?: string;
  height?: number;
  showExportButton?: boolean;
  interactive?: boolean;
  onDataPointClick?: (data: any) => void;
  customConfig?: any;
}

export default function AnalyticsChart({
  type,
  data,
  title,
  subtitle,
  height = 220,
  showExportButton = false,
  interactive = false,
  onDataPointClick,
  customConfig
}: AnalyticsChartProps) {
  const theme = useTheme();
  const [selectedDataPoint, setSelectedDataPoint] = useState<any>(null);

  const defaultChartConfig = {
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
    ...customConfig
  };

  const chartWidth = width - 64;

  const handleDataPointClick = (data: any) => {
    if (interactive) {
      setSelectedDataPoint(data);
      onDataPointClick?.(data);
    }
  };

  const handleExport = () => {
    // Export functionality - could save as image or share
    console.log('Export chart data:', { title, type, data });
    // Implementation would use react-native-view-shot or similar
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={data as ChartData}
            width={chartWidth}
            height={height}
            chartConfig={defaultChartConfig}
            bezier={true}
            style={styles.chart}
            onDataPointClick={handleDataPointClick}
            withDots={true}
            withShadow={false}
            withVerticalLabels={true}
            withHorizontalLabels={true}
          />
        );

      case 'bar':
        return (
          <BarChart
            data={data as ChartData}
            width={chartWidth}
            height={height}
            chartConfig={defaultChartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix=""
            showValuesOnTopOfBars={true}
          />
        );

      case 'pie':
        return (
          <PieChart
            data={data as PieData[]}
            width={chartWidth}
            height={height}
            chartConfig={defaultChartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            style={styles.chart}
          />
        );

      case 'progress':
        return (
          <ProgressChart
            data={data}
            width={chartWidth}
            height={height}
            strokeWidth={16}
            radius={32}
            chartConfig={defaultChartConfig}
            hideLegend={false}
            style={styles.chart}
          />
        );

      case 'area':
        return (
          <LineChart
            data={data as ChartData}
            width={chartWidth}
            height={height}
            chartConfig={defaultChartConfig}
            bezier={true}
            style={styles.chart}
            withDots={false}
            withShadow={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fillShadowGradient={DesignTokens.colors.primary}
            fillShadowGradientOpacity={0.3}
          />
        );

      default:
        return (
          <View style={styles.errorContainer}>
            <Text>Tipo de gráfico não suportado</Text>
          </View>
        );
    }
  };

  const renderDataPointTooltip = () => {
    if (!selectedDataPoint || !interactive) return null;

    return (
      <Surface style={styles.tooltip} elevation={4}>
        <Text variant="bodySmall" style={styles.tooltipText}>
          Valor: {selectedDataPoint.value}
        </Text>
        <Text variant="bodySmall" style={styles.tooltipText}>
          Índice: {selectedDataPoint.index}
        </Text>
      </Surface>
    );
  };

  const renderChartActions = () => {
    if (!showExportButton) return null;

    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleExport}>
          <Ionicons name="download-outline" size={18} color={DesignTokens.colors.primary} />
          <Text style={styles.actionButtonText}>Exportar</Text>
        </TouchableOpacity>
        
        {interactive && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="expand-outline" size={18} color={DesignTokens.colors.primary} />
            <Text style={styles.actionButtonText}>Expandir</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderLegend = () => {
    if (type !== 'line' || !data.datasets || data.datasets.length <= 1) return null;

    return (
      <View style={styles.legendContainer}>
        {data.datasets.map((dataset: any, index: number) => (
          <View key={index} style={styles.legendItem}>
            <View 
              style={[
                styles.legendColor, 
                { backgroundColor: dataset.color?.(1) || DesignTokens.colors.primary }
              ]} 
            />
            <Text variant="bodySmall" style={styles.legendText}>
              {dataset.label || `Série ${index + 1}`}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>
        {renderChartActions()}
      </View>

      {/* Chart Content */}
      <View style={styles.chartContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContainer}
        >
          {renderChart()}
        </ScrollView>
      </View>

      {/* Legend */}
      {renderLegend()}

      {/* Interactive Tooltip */}
      {renderDataPointTooltip()}

      {/* Chart Statistics */}
      {type === 'line' && data.datasets && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Máximo</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {Math.max(...data.datasets[0].data).toFixed(1)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Mínimo</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {Math.min(...data.datasets[0].data).toFixed(1)}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Média</Text>
            <Text variant="bodyMedium" style={styles.statValue}>
              {(data.datasets[0].data.reduce((a: number, b: number) => a + b, 0) / data.datasets[0].data.length).toFixed(1)}
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: DesignTokens.spacing.md,
    backgroundColor: DesignTokens.colors.surface,
    ...DesignTokens.shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  subtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
    borderRadius: DesignTokens.borderRadius.md,
    backgroundColor: `${DesignTokens.colors.primary}15`,
  },
  actionButtonText: {
    fontSize: DesignTokens.typography.fontSize.xs,
    color: DesignTokens.colors.primary,
    marginLeft: 4,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  chartContainer: {
    paddingHorizontal: DesignTokens.spacing.md,
  },
  chartScrollContainer: {
    paddingRight: DesignTokens.spacing.lg,
  },
  chart: {
    marginVertical: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.lg,
  },
  errorContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltip: {
    position: 'absolute',
    right: DesignTokens.spacing.lg,
    top: DesignTokens.spacing.xl,
    padding: DesignTokens.spacing.sm,
    borderRadius: DesignTokens.borderRadius.md,
    backgroundColor: DesignTokens.colors.surface,
    zIndex: 1000,
  },
  tooltipText: {
    color: DesignTokens.colors.textPrimary,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: DesignTokens.spacing.md,
    paddingTop: 0,
    gap: DesignTokens.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DesignTokens.spacing.xs,
  },
  legendText: {
    color: DesignTokens.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignTokens.spacing.lg,
    paddingTop: DesignTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.outline,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
});
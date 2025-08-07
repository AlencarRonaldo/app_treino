import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Surface } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { DesignTokens } from '../constants/designTokens';

interface ComparisonData {
  label: string;
  current: number;
  previous: number;
  target?: number;
  unit?: string;
  color?: string;
}

interface ComparisonChartProps {
  title: string;
  data: ComparisonData[];
  comparisonType: 'vs-previous' | 'vs-target' | 'vs-benchmark';
  showPercentageImprovement?: boolean;
  showStatisticalSignificance?: boolean;
  height?: number;
}

export default function ComparisonChart({
  title,
  data,
  comparisonType,
  showPercentageImprovement = true,
  showStatisticalSignificance = false,
  height = 220
}: ComparisonChartProps) {
  const getComparisonLabel = () => {
    switch (comparisonType) {
      case 'vs-previous':
        return 'vs Anterior';
      case 'vs-target':
        return 'vs Meta';
      case 'vs-benchmark':
        return 'vs Benchmark';
      default:
        return 'Comparação';
    }
  };

  const calculateImprovement = (current: number, comparison: number): number => {
    if (comparison === 0) return 0;
    return ((current - comparison) / comparison) * 100;
  };

  const getComparisonValue = (item: ComparisonData): number => {
    switch (comparisonType) {
      case 'vs-target':
        return item.target || item.previous;
      default:
        return item.previous;
    }
  };

  const renderComparisonBars = () => {
    return data.map((item, index) => {
      const comparisonValue = getComparisonValue(item);
      const improvement = calculateImprovement(item.current, comparisonValue);
      const isPositive = improvement > 0;
      const color = item.color || DesignTokens.colors.primary;
      const comparisonColor = DesignTokens.colors.textSecondary;

      // Calculate bar widths for visual representation
      const maxValue = Math.max(item.current, comparisonValue);
      const currentWidth = (item.current / maxValue) * 100;
      const comparisonWidth = (comparisonValue / maxValue) * 100;

      return (
        <View key={index} style={styles.comparisonItem}>
          {/* Header */}
          <View style={styles.itemHeader}>
            <Text variant="bodyMedium" style={styles.itemLabel}>
              {item.label}
            </Text>
            {showPercentageImprovement && (
              <View style={styles.improvementContainer}>
                <Ionicons 
                  name={isPositive ? 'trending-up' : improvement < 0 ? 'trending-down' : 'remove'} 
                  size={16} 
                  color={isPositive ? DesignTokens.colors.success : improvement < 0 ? DesignTokens.colors.error : DesignTokens.colors.textSecondary} 
                />
                <Text 
                  variant="bodySmall" 
                  style={[
                    styles.improvementText,
                    { color: isPositive ? DesignTokens.colors.success : improvement < 0 ? DesignTokens.colors.error : DesignTokens.colors.textSecondary }
                  ]}
                >
                  {Math.abs(improvement).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>

          {/* Bars */}
          <View style={styles.barsContainer}>
            {/* Current Bar */}
            <View style={styles.barRow}>
              <Text variant="bodySmall" style={styles.barLabel}>Atual</Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { width: `${currentWidth}%`, backgroundColor: color }
                  ]} 
                />
                <Text variant="bodySmall" style={styles.barValue}>
                  {item.current.toFixed(1)}{item.unit || ''}
                </Text>
              </View>
            </View>

            {/* Comparison Bar */}
            <View style={styles.barRow}>
              <Text variant="bodySmall" style={styles.barLabel}>
                {getComparisonLabel()}
              </Text>
              <View style={styles.barContainer}>
                <View 
                  style={[
                    styles.bar, 
                    { width: `${comparisonWidth}%`, backgroundColor: comparisonColor }
                  ]} 
                />
                <Text variant="bodySmall" style={styles.barValue}>
                  {comparisonValue.toFixed(1)}{item.unit || ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Statistical Significance */}
          {showStatisticalSignificance && Math.abs(improvement) > 5 && (
            <View style={styles.significanceContainer}>
              <Ionicons 
                name="checkmark-circle" 
                size={14} 
                color={DesignTokens.colors.success} 
              />
              <Text variant="bodySmall" style={styles.significanceText}>
                Estatisticamente significativo
              </Text>
            </View>
          )}
        </View>
      );
    });
  };

  const renderSummaryStats = () => {
    const improvements = data.map(item => 
      calculateImprovement(item.current, getComparisonValue(item))
    );
    
    const avgImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    const positiveChanges = improvements.filter(imp => imp > 0).length;
    const negativeChanges = improvements.filter(imp => imp < 0).length;

    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={styles.summaryLabel}>Melhoria Média</Text>
          <Text 
            variant="titleSmall" 
            style={[
              styles.summaryValue,
              { color: avgImprovement > 0 ? DesignTokens.colors.success : avgImprovement < 0 ? DesignTokens.colors.error : DesignTokens.colors.textPrimary }
            ]}
          >
            {avgImprovement > 0 ? '+' : ''}{avgImprovement.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={styles.summaryLabel}>Melhorias</Text>
          <Text variant="titleSmall" style={[styles.summaryValue, { color: DesignTokens.colors.success }]}>
            {positiveChanges}/{data.length}
          </Text>
        </View>

        <View style={styles.summaryItem}>
          <Text variant="bodySmall" style={styles.summaryLabel}>Pioras</Text>
          <Text variant="titleSmall" style={[styles.summaryValue, { color: DesignTokens.colors.error }]}>
            {negativeChanges}/{data.length}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          Comparação {getComparisonLabel()}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderComparisonBars()}
      </ScrollView>

      {renderSummaryStats()}
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
    padding: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
  },
  title: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
    color: DesignTokens.colors.textPrimary,
  },
  subtitle: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: DesignTokens.spacing.lg,
    maxHeight: 300,
  },
  comparisonItem: {
    marginBottom: DesignTokens.spacing.lg,
    paddingBottom: DesignTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.outline,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  itemLabel: {
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    color: DesignTokens.colors.textPrimary,
    flex: 1,
  },
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementText: {
    marginLeft: 4,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    fontSize: DesignTokens.typography.fontSize.sm,
  },
  barsContainer: {
    gap: DesignTokens.spacing.sm,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  barLabel: {
    width: 60,
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.fontSize.xs,
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  bar: {
    height: 20,
    borderRadius: DesignTokens.borderRadius.sm,
    minWidth: 4,
  },
  barValue: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
    minWidth: 60,
    textAlign: 'right',
  },
  significanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: DesignTokens.spacing.sm,
    paddingLeft: 68, // Align with bars
  },
  significanceText: {
    color: DesignTokens.colors.success,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: DesignTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.outline,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    color: DesignTokens.colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
});
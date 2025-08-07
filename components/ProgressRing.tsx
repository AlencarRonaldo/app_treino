import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle, LinearGradient, Defs, Stop } from 'react-native-svg';
import { DesignTokens } from '../constants/designTokens';

interface ProgressData {
  value: number;
  maxValue: number;
  label: string;
  color?: string;
}

interface ProgressRingProps {
  data: ProgressData[];
  size?: number;
  strokeWidth?: number;
  backgroundColor?: string;
  showLabels?: boolean;
  showValues?: boolean;
  centerContent?: React.ReactNode;
  animated?: boolean;
}

export default function ProgressRing({
  data,
  size = 120,
  strokeWidth = 8,
  backgroundColor = DesignTokens.colors.surfaceVariant,
  showLabels = true,
  showValues = true,
  centerContent,
  animated = true
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const renderProgressRing = (progress: ProgressData, index: number) => {
    const percentage = Math.min((progress.value / progress.maxValue) * 100, 100);
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const ringRadius = radius - (index * (strokeWidth + 4));
    const ringCircumference = 2 * Math.PI * ringRadius;
    const adjustedStrokeDasharray = ringCircumference;
    const adjustedStrokeDashoffset = ringCircumference - (percentage / 100) * ringCircumference;

    const color = progress.color || DesignTokens.colors.primary;

    return (
      <React.Fragment key={index}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          fill="none"
          stroke={`url(#gradient-${index})`}
          strokeWidth={strokeWidth}
          strokeDasharray={adjustedStrokeDasharray}
          strokeDashoffset={adjustedStrokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </React.Fragment>
    );
  };

  const renderGradients = () => (
    <Defs>
      {data.map((progress, index) => {
        const color = progress.color || DesignTokens.colors.primary;
        return (
          <LinearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={color} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={color} stopOpacity="1" />
          </LinearGradient>
        );
      })}
    </Defs>
  );

  const renderCenterContent = () => {
    if (centerContent) {
      return (
        <View style={[styles.centerContent, { width: size, height: size }]}>
          {centerContent}
        </View>
      );
    }

    if (data.length === 1 && showValues) {
      const progress = data[0];
      const percentage = Math.min((progress.value / progress.maxValue) * 100, 100);
      
      return (
        <View style={[styles.centerContent, { width: size, height: size }]}>
          <Text variant="headlineSmall" style={styles.centerValue}>
            {percentage.toFixed(0)}%
          </Text>
          <Text variant="bodySmall" style={styles.centerLabel}>
            {progress.label}
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderLabels = () => {
    if (!showLabels || data.length === 1) return null;

    return (
      <View style={styles.labelsContainer}>
        {data.map((progress, index) => {
          const percentage = Math.min((progress.value / progress.maxValue) * 100, 100);
          const color = progress.color || DesignTokens.colors.primary;

          return (
            <View key={index} style={styles.labelItem}>
              <View style={[styles.labelIndicator, { backgroundColor: color }]} />
              <View style={styles.labelText}>
                <Text variant="bodySmall" style={styles.labelTitle}>
                  {progress.label}
                </Text>
                {showValues && (
                  <Text variant="bodySmall" style={styles.labelValue}>
                    {progress.value}/{progress.maxValue} ({percentage.toFixed(0)}%)
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.ringContainer}>
        <Svg width={size} height={size}>
          {renderGradients()}
          {data.map((progress, index) => renderProgressRing(progress, index))}
        </Svg>
        {renderCenterContent()}
      </View>
      {renderLabels()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.bold as any,
  },
  centerLabel: {
    color: DesignTokens.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  labelsContainer: {
    marginTop: DesignTokens.spacing.lg,
    alignItems: 'flex-start',
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: DesignTokens.spacing.sm,
  },
  labelIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: DesignTokens.spacing.sm,
  },
  labelText: {
    flex: 1,
  },
  labelTitle: {
    color: DesignTokens.colors.textPrimary,
    fontWeight: DesignTokens.typography.fontWeight.medium as any,
  },
  labelValue: {
    color: DesignTokens.colors.textSecondary,
    marginTop: 2,
  },
});
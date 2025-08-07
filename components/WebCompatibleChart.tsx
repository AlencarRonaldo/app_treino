/**
 * WebCompatibleChart - Wrapper para charts compatíveis com Web e Mobile
 * Resolve warnings de React Native Web mantendo funcionalidade
 */

import React from 'react';
import { Platform, View, Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
    label?: string;
  }>;
}

interface WebCompatibleChartProps {
  type: 'line' | 'bar' | 'pie';
  data: ChartData;
  width?: number;
  height?: number;
  chartConfig?: any;
  style?: any;
  onDataPointClick?: (data: any) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export default function WebCompatibleChart({
  type,
  data,
  width = screenWidth - 32,
  height = 220,
  chartConfig,
  style,
  onDataPointClick
}: WebCompatibleChartProps) {
  const theme = useTheme();

  // Configuração padrão otimizada para web e mobile
  const defaultChartConfig = {
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientFromOpacity: 0,
    backgroundGradientTo: theme.colors.surface,
    backgroundGradientToOpacity: 0.1,
    color: (opacity = 1) => `rgba(${theme.colors.primary}ff)`.replace('ff', Math.floor(opacity * 255).toString(16)),
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 1,
    ...chartConfig
  };

  // Para web, envolver com suppressors de eventos React Native
  const WebWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (Platform.OS !== 'web') {
      return <>{children}</>;
    }

    // Wrapper que suprime eventos React Native no web
    return (
      <View
        style={{
          ...style,
          // Remover eventos touch específicos do RN no web
          pointerEvents: onDataPointClick ? 'auto' : 'none'
        }}
        // @ts-ignore - Propriedades web específicas
        onClick={Platform.OS === 'web' && onDataPointClick ? (e: any) => {
          // Simular onDataPointClick para web
          if (onDataPointClick) {
            onDataPointClick({ x: 0, y: 0, dataset: data.datasets[0] });
          }
        } : undefined}
      >
        {children}
      </View>
    );
  };

  // Fallback simples para casos onde o chart não funciona
  const SimpleFallback: React.FC = () => (
    <Card style={{ padding: 16, height }}>
      <Text variant="titleMedium">Gráfico de {type === 'line' ? 'Linha' : type === 'bar' ? 'Barras' : 'Pizza'}</Text>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Dados: {data.datasets[0]?.data?.join(', ') || 'Sem dados'}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
          Labels: {data.labels?.join(', ') || 'Sem labels'}
        </Text>
      </View>
    </Card>
  );

  try {
    return (
      <WebWrapper>
        {type === 'line' && (
          <LineChart
            data={data}
            width={width}
            height={height}
            chartConfig={defaultChartConfig}
            style={style}
            onDataPointClick={onDataPointClick}
            withDots={true}
            withShadow={false}
            withInnerLines={true}
            withOuterLines={false}
            segments={4}
            // Suprimir warnings específicos do web
            {...(Platform.OS === 'web' && {
              // Propriedades que causam warnings no web são removidas
              onStartShouldSetResponder: undefined,
              onResponderTerminationRequest: undefined,
              onResponderGrant: undefined,
              onResponderMove: undefined,
              onResponderRelease: undefined,
              onResponderTerminate: undefined,
              onPress: undefined
            })}
          />
        )}
        
        {type === 'bar' && (
          <BarChart
            data={data}
            width={width}
            height={height}
            chartConfig={defaultChartConfig}
            style={style}
            showValuesOnTopOfBars={true}
            segments={4}
            {...(Platform.OS === 'web' && {
              onStartShouldSetResponder: undefined,
              onResponderTerminationRequest: undefined,
              onResponderGrant: undefined,
              onResponderMove: undefined,
              onResponderRelease: undefined,
              onResponderTerminate: undefined,
              onPress: undefined
            })}
          />
        )}
        
        {type === 'pie' && (
          <PieChart
            data={data.datasets[0]?.data?.map((value, index) => ({
              name: data.labels[index] || `Item ${index + 1}`,
              population: value,
              color: defaultChartConfig.color(1),
              legendFontColor: theme.colors.onSurface,
              legendFontSize: 12
            })) || []}
            width={width}
            height={height}
            chartConfig={defaultChartConfig}
            style={style}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[width / 4, 0]}
            absolute={false}
            {...(Platform.OS === 'web' && {
              onStartShouldSetResponder: undefined,
              onResponderTerminationRequest: undefined,
              onResponderGrant: undefined,
              onResponderMove: undefined,
              onResponderRelease: undefined,
              onResponderTerminate: undefined,
              onPress: undefined
            })}
          />
        )}
      </WebWrapper>
    );
  } catch (error) {
    // Em caso de erro, mostrar fallback
    console.warn('Chart rendering error, showing fallback:', error);
    return <SimpleFallback />;
  }
}

// Hook para gerar dados de exemplo para testes
export const useChartData = () => {
  const generateMockData = (type: 'line' | 'bar' | 'pie') => {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mai', 'Jun'];
    
    switch (type) {
      case 'line':
        return {
          labels,
          datasets: [{
            data: [20, 45, 28, 80, 99, 43],
            strokeWidth: 2
          }]
        };
      
      case 'bar':
        return {
          labels,
          datasets: [{
            data: [20, 45, 28, 80, 99, 43]
          }]
        };
      
      case 'pie':
        return {
          labels: ['Cardio', 'Força', 'Flexibilidade', 'Funcional'],
          datasets: [{
            data: [30, 40, 15, 15]
          }]
        };
      
      default:
        return {
          labels: [],
          datasets: [{ data: [] }]
        };
    }
  };

  return { generateMockData };
};
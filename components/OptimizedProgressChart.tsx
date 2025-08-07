/**
 * OptimizedProgressChart - Charts de progresso com animações otimizadas
 * Inclui lazy loading, debouncing e otimizações para diferentes tamanhos de dados
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Dimensions,
  StyleSheet,
  InteractionManager,
  Platform
} from 'react-native';
import { Text, ActivityIndicator, Card } from 'react-native-paper';
import { LineChart, BarChart, ProgressChart } from 'react-native-chart-kit';
import { 
  useOptimizedChart,
  useOptimizedResponsive 
} from '../hooks/useOptimizedResponsive';
import { 
  performanceMonitor, 
  createOptimizedChartRenderer,
  runAfterInteractions,
  PERFORMANCE_CONFIG
} from '../utils/PerformanceOptimizer';
import { FigmaTheme } from '../constants/figmaTheme';

interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

interface OptimizedProgressChartProps {
  data: ChartDataPoint[];
  title: string;
  type?: 'line' | 'bar' | 'progress';
  loading?: boolean;
  color?: string;
  showAnimation?: boolean;
  maxDataPoints?: number;
  height?: number;
}

export const OptimizedProgressChart: React.FC<OptimizedProgressChartProps> = React.memo(({
  data,
  title,
  type = 'line',
  loading = false,
  color = '#FF6B35',
  showAnimation = true,
  maxDataPoints = 50,
  height
}) => {
  const { screenInfo, getValue, createStyles } = useOptimizedResponsive();
  const chartConfig = useOptimizedChart(data.length);
  
  // ===== STATE MANAGEMENT =====
  const [isRendering, setIsRendering] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // ===== REFS PARA PERFORMANCE =====
  const renderTimeoutRef = useRef<NodeJS.Timeout>();
  const animationFrameRef = useRef<number>();
  const lastDataRef = useRef<ChartDataPoint[]>([]);
  
  // ===== PROCESSAMENTO DE DADOS OTIMIZADO =====
  const processedData = useMemo(() => {
    return performanceMonitor.measure('chart_data_processing', () => {
      let processed = [...data];
      
      // Limitar número de pontos de dados para performance
      if (processed.length > maxDataPoints) {
        const step = Math.ceil(processed.length / maxDataPoints);
        processed = processed.filter((_, index) => index % step === 0);
      }
      
      // Ordenar por data
      processed.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      return processed;
    });
  }, [data, maxDataPoints]);
  
  // ===== CONFIGURAÇÃO DE CHART OTIMIZADA =====
  const optimizedChartConfig = useMemo(() => {
    const baseConfig = {
      ...chartConfig,
      color: (opacity = 1) => color.includes('rgba') ? color : `${color}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
      strokeWidth: processedData.length > 30 ? 1.5 : 2,
      // Desabilitar animações em datasets grandes
      withAnimation: showAnimation && processedData.length <= 20,
    };
    
    // Otimizações específicas por tipo
    if (type === 'line') {
      return {
        ...baseConfig,
        bezier: processedData.length <= 10, // Bezier apenas para poucos pontos
        withDots: processedData.length <= 15,
        withShadow: processedData.length <= 20,
      };
    }
    
    return baseConfig;
  }, [chartConfig, color, processedData.length, showAnimation, type]);
  
  // ===== FORMATAÇÃO DE DADOS PARA CHARTS =====
  const formatDataForChart = useCallback(() => {
    return performanceMonitor.measure('chart_data_formatting', () => {
      if (processedData.length === 0) {
        return {
          labels: [''],
          datasets: [{ data: [0] }]
        };
      }
      
      const maxLabels = screenInfo.isSmall ? 4 : screenInfo.isTablet ? 8 : 6;
      const labelStep = Math.max(1, Math.floor(processedData.length / maxLabels));
      
      return {
        labels: processedData.map((item, index) => {
          if (index % labelStep === 0 || index === processedData.length - 1) {
            // Formato de data otimizado
            const date = new Date(item.date);
            return screenInfo.isSmall 
              ? `${date.getDate()}/${date.getMonth() + 1}`
              : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
          }
          return '';
        }),
        datasets: [{
          data: processedData.map(item => item.value),
          color: (opacity = 1) => optimizedChartConfig.color(opacity),
          strokeWidth: optimizedChartConfig.strokeWidth,
        }]
      };
    });
  }, [processedData, screenInfo, optimizedChartConfig]);
  
  // ===== FORMATAÇÃO PARA PROGRESS CHART =====
  const formatDataForProgress = useCallback(() => {
    if (processedData.length === 0) return { data: [0] };
    
    const latest = processedData[processedData.length - 1];
    const previous = processedData[processedData.length - 2];
    
    if (!previous) return { data: [latest.value / 100] };
    
    return {
      data: [Math.min(latest.value / 100, 1)], // Normalizar para 0-1
      colors: [color]
    };
  }, [processedData, color]);
  
  // ===== RENDERIZADOR OTIMIZADO =====
  const optimizedRenderer = useMemo(() => {
    return createOptimizedChartRenderer((data) => {
      setIsRendering(true);
      
      runAfterInteractions(() => {
        setChartReady(true);
        setIsRendering(false);
      });
    }, PERFORMANCE_CONFIG.CHART_DEBOUNCE_MS);
  }, []);
  
  // ===== EFEITOS DE PERFORMANCE =====
  useEffect(() => {
    // Verificar se dados realmente mudaram
    const dataChanged = JSON.stringify(processedData) !== JSON.stringify(lastDataRef.current);
    
    if (dataChanged) {
      lastDataRef.current = processedData;
      setChartReady(false);
      
      // Usar timeout para evitar renders desnecessários
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      renderTimeoutRef.current = setTimeout(() => {
        optimizedRenderer(processedData);
      }, 50);
    }
    
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [processedData, optimizedRenderer]);
  
  // ===== ANIMAÇÃO OTIMIZADA =====
  useEffect(() => {
    if (!showAnimation || !chartReady) return;
    
    let startTime: number;
    const duration = Math.min(PERFORMANCE_CONFIG.CHART_ANIMATION_DURATION, 1000);
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showAnimation, chartReady]);
  
  // ===== CLEANUP =====
  useEffect(() => {
    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // ===== ESTILOS MEMOIZADOS =====
  const styles = createStyles(() => StyleSheet.create({
    container: {
      backgroundColor: FigmaTheme.colors.cardBackground,
      borderRadius: getValue(12, 14, 16, 20),
      padding: getValue(16, 18, 20, 24),
      marginHorizontal: getValue(16, 20, 24, 32),
      marginVertical: getValue(8, 10, 12, 16),
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    title: {
      fontSize: getValue(18, 19, 20, 22),
      fontWeight: '600',
      color: FigmaTheme.colors.textPrimary,
      marginBottom: getValue(12, 14, 16, 20),
      textAlign: 'center',
    },
    chartContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: height || chartConfig.height,
    },
    loadingContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: height || chartConfig.height,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      height: height || chartConfig.height,
    },
    emptyText: {
      fontSize: getValue(14, 15, 16, 18),
      color: FigmaTheme.colors.textSecondary,
      textAlign: 'center',
      marginTop: getValue(8, 10, 12, 16),
    },
    chartWrapper: {
      opacity: showAnimation ? animationProgress : 1,
      transform: [
        {
          scale: showAnimation ? 0.9 + (animationProgress * 0.1) : 1
        }
      ]
    }
  }));
  
  // ===== RENDERIZAÇÃO CONDICIONAL =====
  const renderChart = () => {
    if (loading || isRendering || !chartReady) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.emptyText}>
            {loading ? 'Carregando dados...' : 'Processando gráfico...'}
          </Text>
        </View>
      );
    }
    
    if (processedData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Nenhum dado disponível para exibir
          </Text>
        </View>
      );
    }
    
    const commonProps = {
      width: chartConfig.width,
      height: height || chartConfig.height,
      chartConfig: optimizedChartConfig,
      bezier: optimizedChartConfig.bezier,
      style: {
        borderRadius: getValue(8, 10, 12, 16),
      },
      withAnimation: optimizedChartConfig.withAnimation,
    };
    
    switch (type) {
      case 'line':
        return (
          <View style={styles.chartWrapper}>
            <LineChart
              data={formatDataForChart()}
              {...commonProps}
            />
          </View>
        );
        
      case 'bar':
        return (
          <View style={styles.chartWrapper}>
            <BarChart
              data={formatDataForChart()}
              {...commonProps}
              showValuesOnTopOfBars
              fromZero
            />
          </View>
        );
        
      case 'progress':
        return (
          <View style={styles.chartWrapper}>
            <ProgressChart
              data={formatDataForProgress()}
              width={chartConfig.width}
              height={height || chartConfig.height}
              strokeWidth={16}
              radius={32}
              chartConfig={optimizedChartConfig}
              hideLegend={false}
              style={{
                borderRadius: getValue(8, 10, 12, 16),
              }}
            />
          </View>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
});

OptimizedProgressChart.displayName = 'OptimizedProgressChart_Phase3_FitnessUX';
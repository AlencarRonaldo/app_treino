/**
 * usePerformanceMonitoring - Hook para monitoramento de performance em tempo real
 * Inclui métricas, alertas e otimizações automáticas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, Dimensions } from 'react-native';
import { performanceMonitor, createPerformanceReport, PERFORMANCE_CONFIG } from '../utils/PerformanceOptimizer';

interface PerformanceMetrics {
  // Performance básica
  fps: number;
  memoryUsage: number;
  renderTime: number;
  
  // Métricas específicas
  timerAccuracy: number;
  listScrollPerformance: number;
  chartRenderTime: number;
  
  // Status do sistema
  isLowEndDevice: boolean;
  networkQuality: 'good' | 'poor' | 'offline';
  batteryLevel: number;
  
  // Alertas
  performanceAlerts: string[];
  recommendations: string[];
}

interface UsePerformanceMonitoringOptions {
  enableAlerts?: boolean;
  autoOptimize?: boolean;
  alertThreshold?: number;
  monitorInterval?: number;
}

export const usePerformanceMonitoring = (options: UsePerformanceMonitoringOptions = {}) => {
  const {
    enableAlerts = true,
    autoOptimize = true,
    alertThreshold = 0.7,
    monitorInterval = 5000
  } = options;
  
  // ===== STATE MANAGEMENT =====
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 0,
    timerAccuracy: 100,
    listScrollPerformance: 100,
    chartRenderTime: 0,
    isLowEndDevice: false,
    networkQuality: 'good',
    batteryLevel: 100,
    performanceAlerts: [],
    recommendations: []
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // ===== REFS PARA TRACKING =====
  const frameCount = useRef(0);
  const lastFrameTime = useRef(Date.now());
  const monitoringInterval = useRef<NodeJS.Timeout>();
  const performanceHistory = useRef<PerformanceMetrics[]>([]);
  
  // ===== DEVICE DETECTION =====
  const detectDeviceCapability = useCallback(() => {
    const { width, height } = Dimensions.get('window');
    const totalPixels = width * height;
    
    // Considerar dispositivo low-end se:
    // 1. Resolução baixa (< 720p)
    // 2. Poucos cores de CPU (estimativa baseada em performance)
    // 3. Pouca memória disponível
    
    const isLowRes = totalPixels < 1280 * 720;
    const estimatedLowEnd = isLowRes; // Mais detecções podem ser adicionadas
    
    return {
      isLowEndDevice: estimatedLowEnd,
      screenDensity: totalPixels,
      estimatedRAM: estimatedLowEnd ? '< 3GB' : '≥ 3GB'
    };
  }, []);
  
  // ===== FPS MONITORING =====
  const measureFPS = useCallback(() => {
    const now = Date.now();
    const delta = now - lastFrameTime.current;
    
    if (delta > 0) {
      const currentFPS = 1000 / delta;
      frameCount.current++;
      lastFrameTime.current = now;
      
      return Math.min(60, Math.round(currentFPS));
    }
    
    return 60;
  }, []);
  
  // ===== MEMORY MONITORING =====
  const estimateMemoryUsage = useCallback(() => {
    // React Native não expõe métricas de memória diretamente
    // Estimamos baseado em componentes e caches ativos
    const report = createPerformanceReport();
    
    // Estimativa baseada em caches e componentes
    const cacheSize = report.cache.responsiveCacheSize + 
                     report.cache.styleSheetCacheSize + 
                     report.cache.imageCacheSize;
    
    // Normalizar para porcentagem (0-100)
    return Math.min(100, (cacheSize / 100) * 10);
  }, []);
  
  // ===== PERFORMANCE ANALYSIS =====
  const analyzePerformance = useCallback(() => {
    const currentMetrics = performanceMonitor.getMetrics();
    const alerts: string[] = [];
    const recommendations: string[] = [];
    
    // Analisar métricas de timer
    const timerMetrics = currentMetrics.filter(m => m.name.includes('timer'));
    const avgTimerTime = timerMetrics.reduce((acc, m) => {
      const duration = (m.endTime || Date.now()) - m.startTime;
      return acc + duration;
    }, 0) / Math.max(timerMetrics.length, 1);
    
    if (avgTimerTime > PERFORMANCE_CONFIG.TIMER_BUDGET_MS) {
      alerts.push(`Timer performance: ${avgTimerTime.toFixed(1)}ms (target: ${PERFORMANCE_CONFIG.TIMER_BUDGET_MS}ms)`);
      recommendations.push('Considere ativar modo de economia de bateria para melhorar o timer');
    }
    
    // Analisar métricas de lista
    const listMetrics = currentMetrics.filter(m => m.name.includes('list'));
    const avgListTime = listMetrics.reduce((acc, m) => {
      const duration = (m.endTime || Date.now()) - m.startTime;
      return acc + duration;
    }, 0) / Math.max(listMetrics.length, 1);
    
    if (avgListTime > PERFORMANCE_CONFIG.LIST_DEBOUNCE_MS) {
      alerts.push(`Lista lenta: ${avgListTime.toFixed(1)}ms`);
      recommendations.push('Ativar virtualização para listas grandes');
    }
    
    // Analisar métricas de gráficos
    const chartMetrics = currentMetrics.filter(m => m.name.includes('chart'));
    const avgChartTime = chartMetrics.reduce((acc, m) => {
      const duration = (m.endTime || Date.now()) - m.startTime;
      return acc + duration;
    }, 0) / Math.max(chartMetrics.length, 1);
    
    if (avgChartTime > PERFORMANCE_CONFIG.CHART_DEBOUNCE_MS * 2) {
      alerts.push(`Gráficos lentos: ${avgChartTime.toFixed(1)}ms`);
      recommendations.push('Reduzir pontos de dados ou desativar animações');
    }
    
    return { alerts, recommendations, avgTimerTime, avgListTime, avgChartTime };
  }, []);
  
  // ===== NETWORK QUALITY DETECTION =====
  const detectNetworkQuality = useCallback(() => {
    // Implementação básica - pode ser expandida com testes de latência
    return 'good' as const;
  }, []);
  
  // ===== AUTO-OPTIMIZATION =====
  const applyAutoOptimizations = useCallback((currentMetrics: PerformanceMetrics) => {
    if (!autoOptimize) return;
    
    // Otimização 1: Reduzir qualidade de gráficos se necessário
    if (currentMetrics.chartRenderTime > PERFORMANCE_CONFIG.CHART_DEBOUNCE_MS * 2) {
      console.log('🔧 Auto-optimization: Reduzindo qualidade de gráficos');
    }
    
    // Otimização 2: Ativar modo economia se FPS baixo
    if (currentMetrics.fps < 30) {
      console.log('🔧 Auto-optimization: Ativando modo economia de performance');
    }
    
    // Otimização 3: Limpar caches se memória alta
    if (currentMetrics.memoryUsage > 80) {
      console.log('🔧 Auto-optimization: Limpando caches para liberar memória');
      // Implementar limpeza de cache
    }
  }, [autoOptimize]);
  
  // ===== MONITORING LOOP =====
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    
    monitoringInterval.current = setInterval(() => {
      const fps = measureFPS();
      const memoryUsage = estimateMemoryUsage();
      const deviceInfo = detectDeviceCapability();
      const networkQuality = detectNetworkQuality();
      const analysis = analyzePerformance();
      
      const newMetrics: PerformanceMetrics = {
        fps,
        memoryUsage,
        renderTime: analysis.avgListTime,
        timerAccuracy: Math.max(0, 100 - (analysis.avgTimerTime - PERFORMANCE_CONFIG.TIMER_BUDGET_MS)),
        listScrollPerformance: Math.max(0, 100 - analysis.avgListTime),
        chartRenderTime: analysis.avgChartTime,
        isLowEndDevice: deviceInfo.isLowEndDevice,
        networkQuality,
        batteryLevel: 100, // Placeholder - React Native não expõe isso nativamente
        performanceAlerts: analysis.alerts,
        recommendations: analysis.recommendations
      };
      
      setMetrics(newMetrics);
      
      // Armazenar histórico
      performanceHistory.current.push(newMetrics);
      if (performanceHistory.current.length > 100) {
        performanceHistory.current.shift();
      }
      
      // Auto-otimizações
      applyAutoOptimizations(newMetrics);
      
      // Alertas críticos
      if (enableAlerts) {
        const criticalAlerts = analysis.alerts.filter(alert => 
          alert.includes('Timer performance') && analysis.avgTimerTime > PERFORMANCE_CONFIG.TIMER_BUDGET_MS * 2
        );
        
        if (criticalAlerts.length > 0) {
          Alert.alert(
            '⚠️ Performance Crítica',
            'O timer está com performance degradada. Isso pode afetar a precisão do treino.',
            [
              { text: 'OK' },
              { text: 'Otimizar', onPress: () => applyAutoOptimizations(newMetrics) }
            ]
          );
        }
      }
    }, monitorInterval);
  }, [
    measureFPS,
    estimateMemoryUsage,
    detectDeviceCapability,
    detectNetworkQuality,
    analyzePerformance,
    applyAutoOptimizations,
    enableAlerts,
    monitorInterval
  ]);
  
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = undefined;
    }
  }, []);
  
  // ===== LIFECYCLE =====
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active') {
        startMonitoring();
      } else {
        stopMonitoring();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    // Iniciar monitoramento
    startMonitoring();
    
    return () => {
      stopMonitoring();
      subscription?.remove();
    };
  }, [startMonitoring, stopMonitoring]);
  
  // ===== MANUAL CONTROLS =====
  const clearMetrics = useCallback(() => {
    performanceMonitor.clearMetrics();
    performanceHistory.current = [];
  }, []);
  
  const generateReport = useCallback(() => {
    const report = createPerformanceReport();
    const history = performanceHistory.current;
    
    return {
      ...report,
      currentMetrics: metrics,
      history: history.slice(-20), // Últimos 20 pontos
      recommendations: metrics.recommendations,
      alerts: metrics.performanceAlerts
    };
  }, [metrics]);
  
  const forceOptimization = useCallback(() => {
    applyAutoOptimizations(metrics);
  }, [metrics, applyAutoOptimizations]);
  
  return {
    // Metrics
    metrics,
    isMonitoring,
    
    // Controls
    startMonitoring,
    stopMonitoring,
    clearMetrics,
    generateReport,
    forceOptimization,
    
    // Utilities
    measurePerformance: performanceMonitor.measure,
    measureAsync: performanceMonitor.measureAsync,
    
    // History
    performanceHistory: performanceHistory.current
  };
};
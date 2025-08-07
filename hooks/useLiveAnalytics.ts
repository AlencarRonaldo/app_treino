/**
 * useLiveAnalytics - Hook para analytics e dashboards em tempo real
 * Monitora KPIs, métricas de business e dados de performance
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRealtimeSubscription } from './useRealtimeSubscription';
import { useAuth } from '../contexts/AuthContext';

export interface LiveMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  unit: string;
  category: 'business' | 'fitness' | 'engagement' | 'performance';
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  updatedAt: string;
  targetValue?: number;
  alertThreshold?: number;
}

export interface DashboardData {
  metrics: LiveMetric[];
  charts: ChartData[];
  kpis: KPIData[];
  alerts: AlertData[];
  lastUpdate: string;
}

export interface ChartData {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  data: Array<{ x: any; y: number; label?: string }>;
  period: '24h' | '7d' | '30d' | '90d';
  updatedAt: string;
}

export interface KPIData {
  id: string;
  title: string;
  value: number;
  target: number;
  unit: string;
  progress: number; // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: 'improving' | 'declining' | 'stable';
  updatedAt: string;
}

export interface AlertData {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  threshold?: number;
  currentValue?: number;
  createdAt: string;
  isRead: boolean;
  autoResolve: boolean;
}

export function useLiveAnalytics(dashboardType: 'trainer' | 'student' | 'admin' = 'trainer') {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    metrics: [],
    charts: [],
    kpis: [],
    alerts: [],
    lastUpdate: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [updateFrequency, setUpdateFrequency] = useState<'realtime' | 'fast' | 'normal' | 'slow'>('normal');

  // Subscribe to metrics updates
  useRealtimeSubscription(`analytics_metrics_${user?.id}`, {
    table: 'live_metrics',
    filter: `user_id=eq.${user?.id},dashboard_type=eq.${dashboardType}`,
    enabled: !!user?.id,
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        handleMetricUpdate(payload.new as LiveMetric);
      }
    }
  });

  // Subscribe to KPI updates
  useRealtimeSubscription(`analytics_kpis_${user?.id}`, {
    table: 'live_kpis',
    filter: `user_id=eq.${user?.id},dashboard_type=eq.${dashboardType}`,
    enabled: !!user?.id,
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        handleKPIUpdate(payload.new as KPIData);
      }
    }
  });

  // Subscribe to chart data updates
  useRealtimeSubscription(`analytics_charts_${user?.id}`, {
    table: 'live_chart_data',
    filter: `user_id=eq.${user?.id},dashboard_type=eq.${dashboardType}`,
    enabled: !!user?.id,
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        handleChartUpdate(payload.new as ChartData);
      }
    }
  });

  // Subscribe to alerts
  useRealtimeSubscription(`analytics_alerts_${user?.id}`, {
    table: 'live_alerts',
    filter: `user_id=eq.${user?.id}`,
    enabled: !!user?.id,
    onData: (payload) => {
      if (payload.eventType === 'INSERT') {
        handleNewAlert(payload.new as AlertData);
      } else if (payload.eventType === 'UPDATE') {
        handleAlertUpdate(payload.new as AlertData);
      }
    }
  });

  /**
   * Processa atualização de métrica
   */
  const handleMetricUpdate = useCallback((metric: LiveMetric) => {
    setDashboardData(prev => {
      const existingIndex = prev.metrics.findIndex(m => m.id === metric.id);
      let updatedMetrics;

      if (existingIndex >= 0) {
        updatedMetrics = [...prev.metrics];
        updatedMetrics[existingIndex] = metric;
      } else {
        updatedMetrics = [...prev.metrics, metric];
      }

      return {
        ...prev,
        metrics: updatedMetrics,
        lastUpdate: new Date().toISOString()
      };
    });

    // Trigger alert se métrica ultrapassou threshold
    if (metric.alertThreshold && metric.value > metric.alertThreshold) {
      createAlert({
        type: 'warning',
        title: `Alerta: ${metric.name}`,
        message: `Valor ${metric.value} ${metric.unit} ultrapassou limite de ${metric.alertThreshold} ${metric.unit}`,
        currentValue: metric.value,
        threshold: metric.alertThreshold,
        autoResolve: true
      });
    }
  }, []);

  /**
   * Processa atualização de KPI
   */
  const handleKPIUpdate = useCallback((kpi: KPIData) => {
    setDashboardData(prev => {
      const existingIndex = prev.kpis.findIndex(k => k.id === kpi.id);
      let updatedKPIs;

      if (existingIndex >= 0) {
        updatedKPIs = [...prev.kpis];
        updatedKPIs[existingIndex] = kpi;
      } else {
        updatedKPIs = [...prev.kpis, kpi];
      }

      return {
        ...prev,
        kpis: updatedKPIs,
        lastUpdate: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Processa atualização de gráfico
   */
  const handleChartUpdate = useCallback((chart: ChartData) => {
    setDashboardData(prev => {
      const existingIndex = prev.charts.findIndex(c => c.id === chart.id);
      let updatedCharts;

      if (existingIndex >= 0) {
        updatedCharts = [...prev.charts];
        updatedCharts[existingIndex] = chart;
      } else {
        updatedCharts = [...prev.charts, chart];
      }

      return {
        ...prev,
        charts: updatedCharts,
        lastUpdate: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Processa novo alerta
   */
  const handleNewAlert = useCallback((alert: AlertData) => {
    setDashboardData(prev => ({
      ...prev,
      alerts: [alert, ...prev.alerts],
      lastUpdate: new Date().toISOString()
    }));
  }, []);

  /**
   * Processa atualização de alerta
   */
  const handleAlertUpdate = useCallback((alert: AlertData) => {
    setDashboardData(prev => {
      const updatedAlerts = prev.alerts.map(a => 
        a.id === alert.id ? alert : a
      );

      return {
        ...prev,
        alerts: updatedAlerts,
        lastUpdate: new Date().toISOString()
      };
    });
  }, []);

  /**
   * Cria novo alerta
   */
  const createAlert = useCallback(async (alertData: Omit<AlertData, 'id' | 'createdAt' | 'isRead'>) => {
    const alert: AlertData = {
      ...alertData,
      id: `alert_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isRead: false
    };

    // Add to local state immediately
    setDashboardData(prev => ({
      ...prev,
      alerts: [alert, ...prev.alerts]
    }));

    // TODO: Persist to database
  }, []);

  /**
   * Marca alerta como lido
   */
  const markAlertAsRead = useCallback(async (alertId: string) => {
    setDashboardData(prev => ({
      ...prev,
      alerts: prev.alerts.map(a => 
        a.id === alertId ? { ...a, isRead: true } : a
      )
    }));

    // TODO: Update in database
  }, []);

  /**
   * Limpa alertas lidos
   */
  const clearReadAlerts = useCallback(async () => {
    setDashboardData(prev => ({
      ...prev,
      alerts: prev.alerts.filter(a => !a.isRead)
    }));
  }, []);

  /**
   * Atualiza frequência de atualizações
   */
  const setDashboardUpdateFrequency = useCallback((frequency: typeof updateFrequency) => {
    setUpdateFrequency(frequency);
    // TODO: Implement frequency-based subscription management
  }, []);

  /**
   * Computed values para dashboard
   */
  const dashboardStats = useMemo(() => {
    const { metrics, kpis, alerts } = dashboardData;
    
    return {
      totalMetrics: metrics.length,
      metricsImproving: metrics.filter(m => m.trend === 'up').length,
      metricsDeclining: metrics.filter(m => m.trend === 'down').length,
      
      totalKPIs: kpis.length,
      kpisOnTarget: kpis.filter(k => k.progress >= 90).length,
      kpisAtRisk: kpis.filter(k => k.status === 'warning' || k.status === 'critical').length,
      
      totalAlerts: alerts.length,
      unreadAlerts: alerts.filter(a => !a.isRead).length,
      criticalAlerts: alerts.filter(a => a.type === 'error' && !a.isRead).length,
      
      overallHealth: calculateOverallHealth(kpis, alerts)
    };
  }, [dashboardData]);

  /**
   * Filtra dados por categoria ou período
   */
  const getMetricsByCategory = useCallback((category: LiveMetric['category']) => {
    return dashboardData.metrics.filter(m => m.category === category);
  }, [dashboardData.metrics]);

  const getChartsByPeriod = useCallback((period: ChartData['period']) => {
    return dashboardData.charts.filter(c => c.period === period);
  }, [dashboardData.charts]);

  const getKPIsByStatus = useCallback((status: KPIData['status']) => {
    return dashboardData.kpis.filter(k => k.status === status);
  }, [dashboardData.kpis]);

  // Initial data load
  useEffect(() => {
    // TODO: Load initial dashboard data
    setIsLoading(false);
  }, [user, dashboardType]);

  return {
    // Estado principal
    dashboardData,
    isLoading,
    updateFrequency,
    
    // Estatísticas computadas
    stats: dashboardStats,
    
    // Actions
    markAlertAsRead,
    clearReadAlerts,
    setDashboardUpdateFrequency,
    
    // Filters
    getMetricsByCategory,
    getChartsByPeriod,
    getKPIsByStatus,
    
    // Status checks
    hasUnreadAlerts: dashboardStats.unreadAlerts > 0,
    hasCriticalAlerts: dashboardStats.criticalAlerts > 0,
    isHealthy: dashboardStats.overallHealth > 70,
    
    // Utilities
    refreshDashboard: () => {
      // TODO: Implement manual refresh
      setDashboardData(prev => ({
        ...prev,
        lastUpdate: new Date().toISOString()
      }));
    }
  };
}

/**
 * Hook específico para Personal Trainers - overview de todos os alunos
 */
export function useTrainerAnalytics() {
  const { user } = useAuth();
  const [studentsMetrics, setStudentsMetrics] = useState<Record<string, DashboardData>>({});
  
  // Subscribe to all students metrics
  useRealtimeSubscription(`trainer_analytics_${user?.id}`, {
    table: 'live_metrics',
    filter: `trainer_id=eq.${user?.id}`,
    enabled: user?.user_type === 'personal',
    onData: (payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const metric = payload.new as LiveMetric & { student_id: string };
        updateStudentMetric(metric.student_id, metric);
      }
    }
  });

  const updateStudentMetric = useCallback((studentId: string, metric: LiveMetric) => {
    setStudentsMetrics(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId] || { metrics: [], charts: [], kpis: [], alerts: [], lastUpdate: '' },
        metrics: [
          ...(prev[studentId]?.metrics.filter(m => m.id !== metric.id) || []),
          metric
        ],
        lastUpdate: new Date().toISOString()
      }
    }));
  }, []);

  const getOverallStats = useCallback(() => {
    const allStudents = Object.keys(studentsMetrics);
    const totalMetrics = Object.values(studentsMetrics).reduce((acc, data) => acc + data.metrics.length, 0);
    const activeStudents = allStudents.filter(studentId => {
      const lastUpdate = studentsMetrics[studentId]?.lastUpdate;
      if (!lastUpdate) return false;
      const timeDiff = new Date().getTime() - new Date(lastUpdate).getTime();
      return timeDiff < 24 * 60 * 60 * 1000; // Ativo nas últimas 24h
    });

    return {
      totalStudents: allStudents.length,
      activeStudents: activeStudents.length,
      totalMetrics,
      avgMetricsPerStudent: allStudents.length > 0 ? totalMetrics / allStudents.length : 0,
      studentsWithAlerts: Object.values(studentsMetrics).filter(data => 
        data.alerts.some(a => !a.isRead)
      ).length
    };
  }, [studentsMetrics]);

  return {
    studentsMetrics,
    getStudentData: (studentId: string) => studentsMetrics[studentId],
    overallStats: getOverallStats(),
    topPerformingStudents: () => {
      // TODO: Implement ranking logic
      return [];
    },
    studentsNeedingAttention: () => {
      return Object.entries(studentsMetrics)
        .filter(([_, data]) => data.alerts.some(a => a.type === 'warning' || a.type === 'error'))
        .map(([studentId]) => studentId);
    }
  };
}

/**
 * Calcula saúde geral do dashboard
 */
function calculateOverallHealth(kpis: KPIData[], alerts: AlertData[]): number {
  if (kpis.length === 0) return 50; // Neutro se não há dados

  // Score baseado nos KPIs
  const kpiScore = kpis.reduce((acc, kpi) => {
    switch (kpi.status) {
      case 'excellent': return acc + 100;
      case 'good': return acc + 75;
      case 'warning': return acc + 50;
      case 'critical': return acc + 25;
      default: return acc + 50;
    }
  }, 0) / kpis.length;

  // Penalização por alertas não lidos
  const unreadAlerts = alerts.filter(a => !a.isRead).length;
  const alertPenalty = Math.min(unreadAlerts * 5, 30); // Máximo 30 pontos de penalidade

  return Math.max(0, Math.min(100, kpiScore - alertPenalty));
}

export default useLiveAnalytics;
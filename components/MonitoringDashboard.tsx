/**
 * TREINOSAPP - PRODUCTION MONITORING DASHBOARD
 * Real-time monitoring and observability dashboard
 * 
 * Features:
 * - Real-time APM metrics and performance monitoring
 * - Error tracking with severity and trend analysis
 * - Business metrics and KPI visualization
 * - Security incident monitoring and alerts
 * - System health status and uptime monitoring
 * - Performance regression detection
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert, Dimensions } from 'react-native';
import { Card, Button, ProgressBar, Badge, Chip } from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import MonitoringService from '../services/MonitoringService';
import { supabase } from '../lib/supabase-production';

// ===================================================================
// TYPES
// ===================================================================

interface DashboardData {
  apm: {
    totalTransactions: number;
    slowTransactions: number;
    failedTransactions: number;
    averageDuration: number;
    transactionsByType: Record<string, number>;
  };
  errors: {
    totalErrors: number;
    uniqueErrors: number;
    errorsByLevel: Record<string, number>;
    topErrors: Array<{ message: string; count: number; level: string }>;
  };
  metrics: {
    totalMetrics: number;
    metricsByType: Record<string, number>;
  };
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    checks: Array<{ name: string; status: string; details?: string }>;
  };
}

interface MonitoringAlert {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
}

// ===================================================================
// MONITORING DASHBOARD COMPONENT
// ===================================================================

const MonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h');

  const screenWidth = Dimensions.get('window').width;

  // ===================================================================
  // DATA LOADING
  // ===================================================================

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get data from monitoring service
      const data = MonitoringService.getInstance().getDashboardData();
      setDashboardData(data);

      // Load alerts from database
      await loadAlerts();

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      MonitoringService.getInstance().captureError(
        error instanceof Error ? error : new Error('Dashboard load failed'),
        { context: { component: 'MonitoringDashboard', action: 'loadDashboardData' } }
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedTimeRange]);

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('monitoring_alert_history')
        .select(`
          id,
          severity,
          status,
          triggered_at,
          context,
          alert_rule:monitoring_alert_rules(name, description)
        `)
        .eq('status', 'active')
        .order('triggered_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formattedAlerts: MonitoringAlert[] = (data || []).map(alert => ({
        id: alert.id,
        name: alert.alert_rule?.name || 'Unknown Alert',
        severity: alert.severity,
        message: alert.alert_rule?.description || 'No description',
        timestamp: new Date(alert.triggered_at),
        status: alert.status,
      }));

      setAlerts(formattedAlerts);
    } catch (error) {
      console.warn('Failed to load alerts:', error);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  // ===================================================================
  // EVENT HANDLERS
  // ===================================================================

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('monitoring_alert_history')
        .update({ 
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', alertId);

      if (error) throw error;

      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, status: 'acknowledged' } : alert
      ));

    } catch (error) {
      Alert.alert('Erro', 'Falha ao confirmar alerta');
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('monitoring_alert_history')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;

      // Remove from local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));

    } catch (error) {
      Alert.alert('Erro', 'Falha ao resolver alerta');
    }
  };

  // ===================================================================
  // RENDER HELPERS
  // ===================================================================

  const renderSystemHealthStatus = () => {
    if (!dashboardData) return null;

    const { status, checks } = dashboardData.systemHealth;
    const statusColor = {
      healthy: '#4CAF50',
      warning: '#FF9800',
      critical: '#F44336'
    }[status];

    return (
      <Card style={styles.card}>
        <Card.Title title="Status do Sistema" />
        <Card.Content>
          <View style={styles.healthStatus}>
            <Badge 
              style={[styles.statusBadge, { backgroundColor: statusColor }]}
              size={20}
            >
              {status.toUpperCase()}
            </Badge>
            <Text style={styles.statusText}>
              Sistema {status === 'healthy' ? 'saudável' : 
                     status === 'warning' ? 'com avisos' : 'crítico'}
            </Text>
          </View>
          
          {checks.map((check, index) => (
            <View key={index} style={styles.healthCheck}>
              <Text style={styles.checkName}>{check.name}</Text>
              <Badge 
                style={[
                  styles.checkBadge, 
                  { backgroundColor: check.status === 'OK' ? '#4CAF50' : 
                                   check.status === 'WARNING' ? '#FF9800' : '#F44336' }
                ]}
              >
                {check.status}
              </Badge>
              {check.details && (
                <Text style={styles.checkDetails}>{check.details}</Text>
              )}
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderAPMMetrics = () => {
    if (!dashboardData) return null;

    const { apm } = dashboardData;
    
    // Prepare chart data
    const transactionTypeData = Object.entries(apm.transactionsByType).map(([key, value]) => ({
      name: key,
      count: value,
      color: getTypeColor(key),
      legendFontColor: '#333',
      legendFontSize: 12,
    }));

    return (
      <Card style={styles.card}>
        <Card.Title title="Performance (APM)" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{apm.totalTransactions}</Text>
              <Text style={styles.metricLabel}>Total de Transações</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: '#FF9800' }]}>
                {apm.slowTransactions}
              </Text>
              <Text style={styles.metricLabel}>Transações Lentas</Text>
            </View>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: '#F44336' }]}>
                {apm.failedTransactions}
              </Text>
              <Text style={styles.metricLabel}>Falhas</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{apm.averageDuration}ms</Text>
              <Text style={styles.metricLabel}>Tempo Médio</Text>
            </View>
          </View>

          {transactionTypeData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Transações por Tipo</Text>
              <PieChart
                data={transactionTypeData}
                width={screenWidth - 80}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderErrorTracking = () => {
    if (!dashboardData) return null;

    const { errors } = dashboardData;

    return (
      <Card style={styles.card}>
        <Card.Title title="Rastreamento de Erros" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            <View style={styles.metric}>
              <Text style={[styles.metricValue, { color: '#F44336' }]}>
                {errors.totalErrors}
              </Text>
              <Text style={styles.metricLabel}>Total de Erros</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{errors.uniqueErrors}</Text>
              <Text style={styles.metricLabel}>Erros Únicos</Text>
            </View>
          </View>

          <View style={styles.errorLevels}>
            <Text style={styles.sectionTitle}>Erros por Nível</Text>
            {Object.entries(errors.errorsByLevel).map(([level, count]) => (
              <View key={level} style={styles.errorLevel}>
                <Chip 
                  style={[styles.levelChip, { backgroundColor: getLevelColor(level) }]}
                  textStyle={{ color: 'white' }}
                >
                  {level.toUpperCase()}
                </Chip>
                <Text style={styles.errorCount}>{count}</Text>
              </View>
            ))}
          </View>

          {errors.topErrors.length > 0 && (
            <View style={styles.topErrors}>
              <Text style={styles.sectionTitle}>Principais Erros</Text>
              {errors.topErrors.slice(0, 5).map((error, index) => (
                <View key={index} style={styles.errorItem}>
                  <Text style={styles.errorMessage} numberOfLines={2}>
                    {error.message}
                  </Text>
                  <View style={styles.errorMeta}>
                    <Badge style={[styles.errorBadge, { backgroundColor: getLevelColor(error.level) }]}>
                      {error.level}
                    </Badge>
                    <Text style={styles.errorCount}>{error.count}x</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const renderActiveAlerts = () => {
    if (alerts.length === 0) return null;

    return (
      <Card style={styles.card}>
        <Card.Title title={`Alertas Ativos (${alerts.length})`} />
        <Card.Content>
          {alerts.map((alert) => (
            <View key={alert.id} style={styles.alertItem}>
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{alert.name}</Text>
                <Badge 
                  style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) }]}
                >
                  {alert.severity.toUpperCase()}
                </Badge>
              </View>
              
              <Text style={styles.alertMessage}>{alert.message}</Text>
              <Text style={styles.alertTime}>
                {formatTimeAgo(alert.timestamp)}
              </Text>
              
              <View style={styles.alertActions}>
                <Button 
                  mode="outlined" 
                  compact
                  onPress={() => handleAcknowledgeAlert(alert.id)}
                  disabled={alert.status === 'acknowledged'}
                >
                  {alert.status === 'acknowledged' ? 'Confirmado' : 'Confirmar'}
                </Button>
                <Button 
                  mode="contained" 
                  compact
                  onPress={() => handleResolveAlert(alert.id)}
                  buttonColor="#4CAF50"
                >
                  Resolver
                </Button>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>
    );
  };

  const renderBusinessMetrics = () => {
    if (!dashboardData) return null;

    const { metrics } = dashboardData;

    return (
      <Card style={styles.card}>
        <Card.Title title="Métricas de Negócio" />
        <Card.Content>
          <View style={styles.metricsGrid}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{metrics.totalMetrics}</Text>
              <Text style={styles.metricLabel}>Total de Métricas</Text>
            </View>
          </View>

          {Object.keys(metrics.metricsByType).length > 0 && (
            <View style={styles.metricTypes}>
              <Text style={styles.sectionTitle}>Métricas por Tipo</Text>
              {Object.entries(metrics.metricsByType).map(([type, count]) => (
                <View key={type} style={styles.metricType}>
                  <Text style={styles.metricTypeName}>{type}</Text>
                  <Text style={styles.metricTypeCount}>{count}</Text>
                </View>
              ))}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // ===================================================================
  // UTILITY FUNCTIONS
  // ===================================================================

  const getTypeColor = (type: string): string => {
    const colors = {
      screen: '#2196F3',
      api: '#4CAF50',
      database: '#FF9800',
      auth: '#9C27B0',
      media: '#F44336',
    };
    return colors[type as keyof typeof colors] || '#757575';
  };

  const getLevelColor = (level: string): string => {
    const colors = {
      info: '#2196F3',
      warning: '#FF9800',
      error: '#F44336',
      fatal: '#9C27B0',
    };
    return colors[level as keyof typeof colors] || '#757575';
  };

  const getSeverityColor = (severity: string): string => {
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0',
    };
    return colors[severity as keyof typeof colors] || '#757575';
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  // ===================================================================
  // MAIN RENDER
  // ===================================================================

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={isLoading} 
          onRefresh={loadDashboardData}
          colors={['#2196F3']}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard de Monitoramento</Text>
        <Text style={styles.lastUpdated}>
          Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}
        </Text>
      </View>

      {renderActiveAlerts()}
      {renderSystemHealthStatus()}
      {renderAPMMetrics()}
      {renderErrorTracking()}
      {renderBusinessMetrics()}
    </ScrollView>
  );
};

// ===================================================================
// STYLES
// ===================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  healthCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  checkName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  checkBadge: {
    marginLeft: 8,
  },
  checkDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  errorLevels: {
    marginTop: 16,
  },
  errorLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  levelChip: {
    marginRight: 8,
  },
  errorCount: {
    fontSize: 16,
    fontWeight: '500',
  },
  topErrors: {
    marginTop: 16,
  },
  errorItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBadge: {
    marginRight: 8,
  },
  metricTypes: {
    marginTop: 16,
  },
  metricType: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metricTypeName: {
    fontSize: 14,
    fontWeight: '500',
  },
  metricTypeCount: {
    fontSize: 14,
    color: '#666',
  },
  alertItem: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  severityBadge: {
    marginLeft: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

export default MonitoringDashboard;
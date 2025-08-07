/**
 * TREINOSAPP - DATABASE MONITORING SERVICE
 * Production database health monitoring and performance tracking
 * 
 * Features:
 * - Real-time database health monitoring
 * - Query performance analysis
 * - Connection pool monitoring
 * - Slow query detection and alerting
 * - Database size and growth tracking
 * - Backup status monitoring
 * - Index usage analytics
 */

import { supabase } from '../lib/supabase-production';
import MonitoringService from './MonitoringService';

// ===================================================================
// TYPES
// ===================================================================

interface DatabaseHealthMetrics {
  connectionStats: {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    utilizationPercent: number;
    maxConnections: number;
  };
  queryPerformance: {
    slowQueries: Array<{
      query: string;
      calls: number;
      totalTime: number;
      meanTime: number;
      rows: number;
      hitPercent: number;
    }>;
    averageResponseTime: number;
    queriesPerSecond: number;
  };
  databaseSize: {
    totalSize: string;
    growthRate: number;
    tablesSizes: Array<{
      tableName: string;
      size: string;
      rows: number;
    }>;
  };
  indexHealth: {
    totalIndexes: number;
    unusedIndexes: number;
    indexUsageStats: Array<{
      indexName: string;
      tableName: string;
      scans: number;
      usage: number;
    }>;
  };
  backupStatus: {
    lastBackup: Date | null;
    backupSize: string;
    status: 'success' | 'failed' | 'in_progress';
    nextScheduledBackup: Date | null;
  };
}

interface DatabaseAlert {
  id: string;
  type: 'performance' | 'connection' | 'storage' | 'backup' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
}

interface QueryAnalysis {
  query: string;
  executionPlan: string;
  recommendations: string[];
  estimatedCost: number;
  actualCost?: number;
  executionTime: number;
  indexSuggestions: string[];
}

// ===================================================================
// DATABASE MONITORING SERVICE
// ===================================================================

class DatabaseMonitoringService {
  private healthMetrics: DatabaseHealthMetrics | null = null;
  private alerts: DatabaseAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;

  constructor() {
    this.initializeMonitoring();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================

  private initializeMonitoring(): void {
    // Start monitoring if not already started
    if (!this.isMonitoring) {
      this.startMonitoring();
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;

    console.log('🔍 Starting database monitoring...');
    this.isMonitoring = true;

    // Collect metrics every 2 minutes
    this.monitoringInterval = setInterval(() => {
      this.collectDatabaseMetrics();
    }, 2 * 60 * 1000);

    // Initial collection
    this.collectDatabaseMetrics();
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('⏹️ Stopping database monitoring...');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // ===================================================================
  // METRICS COLLECTION
  // ===================================================================

  private async collectDatabaseMetrics(): Promise<void> {
    try {
      console.log('📊 Collecting database metrics...');

      const [
        connectionStats,
        queryPerformance,
        databaseSize,
        indexHealth,
        backupStatus
      ] = await Promise.allSettled([
        this.getConnectionStats(),
        this.getQueryPerformance(),
        this.getDatabaseSize(),
        this.getIndexHealth(),
        this.getBackupStatus(),
      ]);

      // Process results and handle errors
      const metrics: DatabaseHealthMetrics = {
        connectionStats: connectionStats.status === 'fulfilled' ? connectionStats.value : this.getDefaultConnectionStats(),
        queryPerformance: queryPerformance.status === 'fulfilled' ? queryPerformance.value : this.getDefaultQueryPerformance(),
        databaseSize: databaseSize.status === 'fulfilled' ? databaseSize.value : this.getDefaultDatabaseSize(),
        indexHealth: indexHealth.status === 'fulfilled' ? indexHealth.value : this.getDefaultIndexHealth(),
        backupStatus: backupStatus.status === 'fulfilled' ? backupStatus.value : this.getDefaultBackupStatus(),
      };

      this.healthMetrics = metrics;

      // Analyze metrics and generate alerts
      await this.analyzeMetricsAndGenerateAlerts(metrics);

      // Record performance metrics
      MonitoringService.recordBusinessMetric('database_connections_active', metrics.connectionStats.activeConnections);
      MonitoringService.recordBusinessMetric('database_utilization_percent', metrics.connectionStats.utilizationPercent);
      MonitoringService.recordBusinessMetric('database_slow_queries', metrics.queryPerformance.slowQueries.length);

    } catch (error) {
      console.error('Failed to collect database metrics:', error);
      MonitoringService.getInstance().captureError(
        error instanceof Error ? error : new Error('Database metrics collection failed'),
        { 
          context: { 
            service: 'DatabaseMonitoringService',
            action: 'collectDatabaseMetrics'
          } 
        }
      );
    }
  }

  private async getConnectionStats(): Promise<DatabaseHealthMetrics['connectionStats']> {
    const { data, error } = await supabase.rpc('get_connection_stats');
    
    if (error) throw error;

    return {
      totalConnections: data[0]?.total_connections || 0,
      activeConnections: data[0]?.active_connections || 0,
      idleConnections: data[0]?.idle_connections || 0,
      utilizationPercent: data[0]?.utilization_percent || 0,
      maxConnections: data[0]?.max_connections || 100,
    };
  }

  private async getQueryPerformance(): Promise<DatabaseHealthMetrics['queryPerformance']> {
    const { data: slowQueries, error } = await supabase.rpc('get_slow_queries', { min_duration_ms: 1000 });
    
    if (error) throw error;

    // Calculate average response time from recent transactions
    const { data: recentTransactions } = await supabase
      .from('monitoring_transactions')
      .select('duration')
      .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 minutes
      .not('duration', 'is', null);

    const avgResponseTime = recentTransactions?.length > 0
      ? Math.round(recentTransactions.reduce((sum, tx) => sum + (tx.duration || 0), 0) / recentTransactions.length)
      : 0;

    const queriesPerSecond = recentTransactions?.length > 0
      ? Math.round(recentTransactions.length / 300) // 5 minutes = 300 seconds
      : 0;

    return {
      slowQueries: (slowQueries || []).map((query: any) => ({
        query: query.query,
        calls: query.calls,
        totalTime: query.total_time,
        meanTime: query.mean_time,
        rows: query.rows,
        hitPercent: query.hit_percent,
      })),
      averageResponseTime: avgResponseTime,
      queriesPerSecond,
    };
  }

  private async getDatabaseSize(): Promise<DatabaseHealthMetrics['databaseSize']> {
    // Get database size information
    const { data, error } = await supabase
      .rpc('get_database_size_info');

    if (error) {
      // Fallback to basic size query
      const { data: sizeData } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_rows');
      
      return {
        totalSize: 'Unknown',
        growthRate: 0,
        tablesSizes: sizeData?.slice(0, 10).map((table: any) => ({
          tableName: table.table_name,
          size: 'Unknown',
          rows: table.table_rows || 0,
        })) || [],
      };
    }

    return {
      totalSize: data?.[0]?.database_size || 'Unknown',
      growthRate: data?.[0]?.growth_rate || 0,
      tablesSizes: data?.slice(0, 10) || [],
    };
  }

  private async getIndexHealth(): Promise<DatabaseHealthMetrics['indexHealth']> {
    try {
      const { data, error } = await supabase
        .from('pg_stat_user_indexes')
        .select('indexrelname, relname, idx_scan, idx_tup_read');

      if (error) throw error;

      const indexStats = (data || []).map((index: any) => ({
        indexName: index.indexrelname,
        tableName: index.relname,
        scans: index.idx_scan || 0,
        usage: index.idx_tup_read || 0,
      }));

      const unusedIndexes = indexStats.filter(index => index.scans === 0).length;

      return {
        totalIndexes: indexStats.length,
        unusedIndexes,
        indexUsageStats: indexStats.slice(0, 10),
      };
    } catch (error) {
      return this.getDefaultIndexHealth();
    }
  }

  private async getBackupStatus(): Promise<DatabaseHealthMetrics['backupStatus']> {
    try {
      const { data, error } = await supabase
        .from('backup_metadata')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return {
        lastBackup: data ? new Date(data.end_time || data.start_time) : null,
        backupSize: data?.backup_size ? this.formatBytes(data.backup_size) : 'Unknown',
        status: data?.status || 'failed',
        nextScheduledBackup: data ? new Date(Date.now() + 24 * 60 * 60 * 1000) : null, // Next day
      };
    } catch (error) {
      return this.getDefaultBackupStatus();
    }
  }

  // ===================================================================
  // ALERT GENERATION
  // ===================================================================

  private async analyzeMetricsAndGenerateAlerts(metrics: DatabaseHealthMetrics): Promise<void> {
    const newAlerts: DatabaseAlert[] = [];

    // Connection utilization alerts
    if (metrics.connectionStats.utilizationPercent > 80) {
      newAlerts.push({
        id: `conn_util_${Date.now()}`,
        type: 'connection',
        severity: metrics.connectionStats.utilizationPercent > 90 ? 'critical' : 'high',
        message: `High connection utilization: ${metrics.connectionStats.utilizationPercent.toFixed(1)}%`,
        details: metrics.connectionStats,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Slow query alerts
    if (metrics.queryPerformance.slowQueries.length > 5) {
      newAlerts.push({
        id: `slow_queries_${Date.now()}`,
        type: 'performance',
        severity: 'medium',
        message: `${metrics.queryPerformance.slowQueries.length} slow queries detected`,
        details: { slowQueries: metrics.queryPerformance.slowQueries.slice(0, 3) },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Average response time alerts
    if (metrics.queryPerformance.averageResponseTime > 2000) {
      newAlerts.push({
        id: `response_time_${Date.now()}`,
        type: 'performance',
        severity: metrics.queryPerformance.averageResponseTime > 5000 ? 'high' : 'medium',
        message: `High average response time: ${metrics.queryPerformance.averageResponseTime}ms`,
        details: { averageResponseTime: metrics.queryPerformance.averageResponseTime },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Backup alerts
    if (metrics.backupStatus.status === 'failed') {
      newAlerts.push({
        id: `backup_failed_${Date.now()}`,
        type: 'backup',
        severity: 'high',
        message: 'Database backup failed',
        details: metrics.backupStatus,
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Check if backup is overdue (more than 25 hours)
    if (metrics.backupStatus.lastBackup) {
      const hoursSinceLastBackup = (Date.now() - metrics.backupStatus.lastBackup.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastBackup > 25) {
        newAlerts.push({
          id: `backup_overdue_${Date.now()}`,
          type: 'backup',
          severity: 'medium',
          message: `Backup overdue: ${Math.round(hoursSinceLastBackup)} hours since last backup`,
          details: { hoursSinceLastBackup: Math.round(hoursSinceLastBackup) },
          timestamp: new Date(),
          resolved: false,
        });
      }
    }

    // Unused indexes alert
    if (metrics.indexHealth.unusedIndexes > 10) {
      newAlerts.push({
        id: `unused_indexes_${Date.now()}`,
        type: 'performance',
        severity: 'low',
        message: `${metrics.indexHealth.unusedIndexes} unused indexes detected`,
        details: { unusedIndexes: metrics.indexHealth.unusedIndexes },
        timestamp: new Date(),
        resolved: false,
      });
    }

    // Add new alerts to the list
    this.alerts = [...this.alerts, ...newAlerts];

    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => alert.timestamp > oneDayAgo);

    // Record alert metrics
    MonitoringService.recordBusinessMetric('database_alerts_active', this.alerts.filter(a => !a.resolved).length);
    MonitoringService.recordBusinessMetric('database_alerts_critical', this.alerts.filter(a => a.severity === 'critical' && !a.resolved).length);
  }

  // ===================================================================
  // QUERY ANALYSIS
  // ===================================================================

  async analyzeQuery(query: string): Promise<QueryAnalysis> {
    try {
      const startTime = Date.now();

      // Get query execution plan
      const { data: planData, error: planError } = await supabase
        .rpc('explain_query', { query_text: query });

      if (planError) throw planError;

      const executionTime = Date.now() - startTime;

      // Basic analysis and recommendations
      const recommendations = this.generateQueryRecommendations(query, planData);
      const indexSuggestions = this.generateIndexSuggestions(query);

      return {
        query: query.substring(0, 500),
        executionPlan: JSON.stringify(planData, null, 2),
        recommendations,
        estimatedCost: planData?.[0]?.['Total Cost'] || 0,
        executionTime,
        indexSuggestions,
      };
    } catch (error) {
      console.error('Query analysis failed:', error);
      throw error;
    }
  }

  private generateQueryRecommendations(query: string, plan: any): string[] {
    const recommendations: string[] = [];

    // Basic query analysis
    if (query.toLowerCase().includes('select *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }

    if (query.toLowerCase().includes('like \'%') && query.includes('%\'')) {
      recommendations.push('Leading wildcard LIKE patterns prevent index usage');
    }

    if (!query.toLowerCase().includes('limit') && query.toLowerCase().includes('select')) {
      recommendations.push('Consider adding LIMIT to prevent large result sets');
    }

    if (query.toLowerCase().includes('order by') && !query.toLowerCase().includes('index')) {
      recommendations.push('Ensure ORDER BY columns are indexed for better performance');
    }

    // Plan-based recommendations
    if (plan && Array.isArray(plan)) {
      const planText = JSON.stringify(plan).toLowerCase();
      
      if (planText.includes('seq scan')) {
        recommendations.push('Sequential scan detected - consider adding appropriate indexes');
      }
      
      if (planText.includes('nested loop')) {
        recommendations.push('Nested loop join detected - verify join conditions are indexed');
      }
      
      if (planText.includes('sort')) {
        recommendations.push('Sort operation detected - consider adding index for ORDER BY columns');
      }
    }

    return recommendations.length > 0 ? recommendations : ['Query appears to be well-optimized'];
  }

  private generateIndexSuggestions(query: string): string[] {
    const suggestions: string[] = [];
    const lowerQuery = query.toLowerCase();

    // Extract table names from simple queries
    const tableMatch = lowerQuery.match(/from\s+(\w+)/);
    const tableName = tableMatch?.[1];

    // Extract WHERE conditions
    const whereMatch = lowerQuery.match(/where\s+(.+?)(?:\s+order|\s+group|\s+limit|$)/);
    if (whereMatch && tableName) {
      const whereClause = whereMatch[1];
      
      // Look for equality conditions
      const equalityMatches = whereClause.match(/(\w+)\s*=\s*/g);
      if (equalityMatches) {
        equalityMatches.forEach(match => {
          const column = match.replace(/\s*=\s*/, '');
          suggestions.push(`CREATE INDEX idx_${tableName}_${column} ON ${tableName}(${column});`);
        });
      }

      // Look for range conditions
      const rangeMatches = whereClause.match(/(\w+)\s*[><]=?\s*/g);
      if (rangeMatches) {
        rangeMatches.forEach(match => {
          const column = match.replace(/\s*[><]=?\s*/, '');
          suggestions.push(`CREATE INDEX idx_${tableName}_${column}_range ON ${tableName}(${column});`);
        });
      }
    }

    return suggestions;
  }

  // ===================================================================
  // MAINTENANCE OPERATIONS
  // ===================================================================

  async runMaintenanceOperation(operation: 'vacuum' | 'analyze' | 'reindex'): Promise<{ success: boolean; message: string }> {
    try {
      let result;
      
      switch (operation) {
        case 'vacuum':
          result = await supabase.rpc('production_maintenance');
          break;
        case 'analyze':
          result = await supabase.rpc('production_maintenance');
          break;
        case 'reindex':
          result = await supabase.rpc('reindex_fragmented_indexes');
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      if (result.error) throw result.error;

      return {
        success: true,
        message: `${operation.toUpperCase()} operation completed successfully`
      };
    } catch (error) {
      return {
        success: false,
        message: `${operation.toUpperCase()} operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async optimizeDatabase(): Promise<{ success: boolean; message: string; details: any[] }> {
    try {
      const operations = await Promise.allSettled([
        this.runMaintenanceOperation('vacuum'),
        this.runMaintenanceOperation('analyze'),
      ]);

      const results = operations.map((op, index) => ({
        operation: index === 0 ? 'vacuum' : 'analyze',
        status: op.status,
        result: op.status === 'fulfilled' ? op.value : op.reason
      }));

      const successCount = results.filter(r => r.status === 'fulfilled' && r.result.success).length;
      
      return {
        success: successCount > 0,
        message: `Database optimization completed. ${successCount}/${results.length} operations succeeded.`,
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: `Database optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: []
      };
    }
  }

  // ===================================================================
  // DEFAULT VALUES
  // ===================================================================

  private getDefaultConnectionStats(): DatabaseHealthMetrics['connectionStats'] {
    return {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      utilizationPercent: 0,
      maxConnections: 100,
    };
  }

  private getDefaultQueryPerformance(): DatabaseHealthMetrics['queryPerformance'] {
    return {
      slowQueries: [],
      averageResponseTime: 0,
      queriesPerSecond: 0,
    };
  }

  private getDefaultDatabaseSize(): DatabaseHealthMetrics['databaseSize'] {
    return {
      totalSize: 'Unknown',
      growthRate: 0,
      tablesSizes: [],
    };
  }

  private getDefaultIndexHealth(): DatabaseHealthMetrics['indexHealth'] {
    return {
      totalIndexes: 0,
      unusedIndexes: 0,
      indexUsageStats: [],
    };
  }

  private getDefaultBackupStatus(): DatabaseHealthMetrics['backupStatus'] {
    return {
      lastBackup: null,
      backupSize: 'Unknown',
      status: 'failed',
      nextScheduledBackup: null,
    };
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  // ===================================================================
  // PUBLIC API
  // ===================================================================

  getHealthMetrics(): DatabaseHealthMetrics | null {
    return this.healthMetrics;
  }

  getAlerts(): DatabaseAlert[] {
    return [...this.alerts];
  }

  getActiveAlerts(): DatabaseAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  resolveAlert(alertId: string): void {
    const alertIndex = this.alerts.findIndex(alert => alert.id === alertId);
    if (alertIndex !== -1) {
      this.alerts[alertIndex].resolved = true;
    }
  }

  // Force metrics collection (for manual refresh)
  async refreshMetrics(): Promise<void> {
    await this.collectDatabaseMetrics();
  }

  destroy(): void {
    this.stopMonitoring();
  }
}

// ===================================================================
// SINGLETON EXPORT
// ===================================================================

const databaseMonitoringService = new DatabaseMonitoringService();

export { DatabaseMonitoringService, databaseMonitoringService as default };
export type { DatabaseHealthMetrics, DatabaseAlert, QueryAnalysis };
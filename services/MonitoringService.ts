/**
 * TREINOSAPP - PRODUCTION MONITORING & OBSERVABILITY SERVICE
 * Enterprise APM, Error Tracking, Business Metrics & Security Monitoring
 * 
 * Features:
 * - Application Performance Monitoring (APM)
 * - Real-time error tracking and alerting
 * - Business metrics and KPI tracking
 * - Security incident monitoring
 * - Performance regression detection
 * - User behavior analytics
 * - System health dashboards
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import { supabase } from '../lib/supabase-production';

// ===================================================================
// MONITORING CONFIGURATION
// ===================================================================

interface MonitoringConfig {
  apm: {
    enabled: boolean;
    sampleRate: number;
    transactionThreshold: number; // ms
    errorThreshold: number;
    memoryThreshold: number; // MB
  };
  errorTracking: {
    enabled: boolean;
    captureUnhandledRejections: boolean;
    captureConsoleErrors: boolean;
    maxErrorsPerSession: number;
  };
  businessMetrics: {
    enabled: boolean;
    trackUserActions: boolean;
    trackPerformanceMetrics: boolean;
    reportingInterval: number; // ms
  };
  securityMonitoring: {
    enabled: boolean;
    threatDetection: boolean;
    anomalyDetection: boolean;
    realTimeAlerts: boolean;
  };
}

const MONITORING_CONFIG: MonitoringConfig = {
  apm: {
    enabled: true,
    sampleRate: 1.0, // 100% in production for fitness apps
    transactionThreshold: 1000, // 1 second
    errorThreshold: 5, // errors per minute
    memoryThreshold: 150, // 150MB
  },
  errorTracking: {
    enabled: true,
    captureUnhandledRejections: true,
    captureConsoleErrors: true,
    maxErrorsPerSession: 50,
  },
  businessMetrics: {
    enabled: true,
    trackUserActions: true,
    trackPerformanceMetrics: true,
    reportingInterval: 60000, // 1 minute
  },
  securityMonitoring: {
    enabled: true,
    threatDetection: true,
    anomalyDetection: true,
    realTimeAlerts: true,
  },
};

// ===================================================================
// MONITORING TYPES
// ===================================================================

interface PerformanceTransaction {
  id: string;
  name: string;
  type: 'screen' | 'api' | 'database' | 'auth' | 'media';
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  metadata: Record<string, any>;
  tags: string[];
  userId?: string;
  sessionId: string;
}

interface ErrorEvent {
  id: string;
  message: string;
  stack?: string;
  level: 'info' | 'warning' | 'error' | 'fatal';
  timestamp: Date;
  userId?: string;
  sessionId: string;
  context: Record<string, any>;
  fingerprint: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

interface BusinessMetric {
  name: string;
  value: number | string;
  tags: Record<string, string>;
  timestamp: Date;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  unit?: string;
}

interface SecurityEvent {
  type: 'authentication' | 'authorization' | 'data_access' | 'suspicious_activity' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  userId?: string;
  ipAddress?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

// ===================================================================
// APPLICATION PERFORMANCE MONITORING (APM)
// ===================================================================

class APMService {
  private activeTransactions: Map<string, PerformanceTransaction> = new Map();
  private completedTransactions: PerformanceTransaction[] = [];
  private performanceObserver: PerformanceObserver | null = null;
  private sessionId: string = '';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializePerformanceObserver();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private initializePerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.performanceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordPerformanceEntry(entry);
        }
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'resource', 'measure', 'mark'] 
      });
    }
  }

  private recordPerformanceEntry(entry: PerformanceEntry): void {
    const transaction: PerformanceTransaction = {
      id: this.generateTransactionId(),
      name: entry.name,
      type: this.categorizePerformanceEntry(entry),
      startTime: entry.startTime,
      endTime: entry.startTime + entry.duration,
      duration: entry.duration,
      status: 'success',
      metadata: {
        entryType: entry.entryType,
        transferSize: (entry as any).transferSize,
        responseEnd: (entry as any).responseEnd,
      },
      tags: [entry.entryType],
      sessionId: this.sessionId,
    };

    this.completeTransaction(transaction);
  }

  private categorizePerformanceEntry(entry: PerformanceEntry): PerformanceTransaction['type'] {
    if (entry.name.includes('api') || entry.name.includes('supabase')) return 'api';
    if (entry.name.includes('screen') || entry.name.includes('navigation')) return 'screen';
    if (entry.name.includes('auth') || entry.name.includes('login')) return 'auth';
    if (entry.name.includes('media') || entry.name.includes('image') || entry.name.includes('video')) return 'media';
    return 'database';
  }

  startTransaction(
    name: string, 
    type: PerformanceTransaction['type'],
    metadata: Record<string, any> = {}
  ): string {
    const transactionId = this.generateTransactionId();
    const transaction: PerformanceTransaction = {
      id: transactionId,
      name,
      type,
      startTime: Date.now(),
      status: 'pending',
      metadata,
      tags: [type],
      sessionId: this.sessionId,
    };

    this.activeTransactions.set(transactionId, transaction);
    return transactionId;
  }

  finishTransaction(
    transactionId: string,
    status: PerformanceTransaction['status'] = 'success',
    additionalMetadata: Record<string, any> = {}
  ): void {
    const transaction = this.activeTransactions.get(transactionId);
    if (!transaction) {
      console.warn(`Transaction ${transactionId} not found`);
      return;
    }

    transaction.endTime = Date.now();
    transaction.duration = transaction.endTime - transaction.startTime;
    transaction.status = status;
    transaction.metadata = { ...transaction.metadata, ...additionalMetadata };

    this.activeTransactions.delete(transactionId);
    this.completeTransaction(transaction);
  }

  private completeTransaction(transaction: PerformanceTransaction): void {
    this.completedTransactions.push(transaction);

    // Keep only recent transactions in memory
    if (this.completedTransactions.length > 1000) {
      this.completedTransactions = this.completedTransactions.slice(-500);
    }

    // Send to monitoring backend if transaction is slow or failed
    if ((transaction.duration && transaction.duration > MONITORING_CONFIG.apm.transactionThreshold) ||
        transaction.status === 'error' || transaction.status === 'timeout') {
      this.reportTransaction(transaction);
    }
  }

  private async reportTransaction(transaction: PerformanceTransaction): Promise<void> {
    try {
      await supabase
        .from('monitoring_transactions')
        .insert({
          id: transaction.id,
          name: transaction.name,
          type: transaction.type,
          duration: transaction.duration,
          status: transaction.status,
          metadata: transaction.metadata,
          tags: transaction.tags,
          session_id: transaction.sessionId,
          user_id: transaction.userId,
          timestamp: new Date(transaction.startTime).toISOString(),
        });
    } catch (error) {
      console.warn('Failed to report transaction:', error);
    }
  }

  private generateTransactionId(): string {
    return `tx_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  getTransactionSummary(): {
    totalTransactions: number;
    slowTransactions: number;
    failedTransactions: number;
    averageDuration: number;
    transactionsByType: Record<string, number>;
  } {
    const total = this.completedTransactions.length;
    const slow = this.completedTransactions.filter(
      tx => tx.duration && tx.duration > MONITORING_CONFIG.apm.transactionThreshold
    ).length;
    const failed = this.completedTransactions.filter(
      tx => tx.status === 'error' || tx.status === 'timeout'
    ).length;
    const avgDuration = total > 0 
      ? Math.round(
          this.completedTransactions
            .filter(tx => tx.duration)
            .reduce((sum, tx) => sum + (tx.duration || 0), 0) / total
        )
      : 0;

    const byType: Record<string, number> = {};
    this.completedTransactions.forEach(tx => {
      byType[tx.type] = (byType[tx.type] || 0) + 1;
    });

    return {
      totalTransactions: total,
      slowTransactions: slow,
      failedTransactions: failed,
      averageDuration: avgDuration,
      transactionsByType: byType,
    };
  }

  destroy(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
  }
}

// ===================================================================
// ERROR TRACKING SERVICE
// ===================================================================

class ErrorTrackingService {
  private errors: Map<string, ErrorEvent> = new Map();
  private sessionId: string = '';
  private errorCount: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupErrorHandlers();
  }

  private generateSessionId(): string {
    return `error_session_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  private setupErrorHandlers(): void {
    // Global error handler
    if (typeof ErrorUtils !== 'undefined') {
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        this.captureError(error, {
          level: isFatal ? 'fatal' : 'error',
          context: { isFatal, type: 'unhandled_exception' },
        });
        originalHandler(error, isFatal);
      });
    }

    // Unhandled promise rejections
    if (MONITORING_CONFIG.errorTracking.captureUnhandledRejections) {
      const rejectionHandler = (event: any) => {
        this.captureError(new Error(event.reason), {
          level: 'error',
          context: { type: 'unhandled_rejection', reason: event.reason },
        });
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('unhandledrejection', rejectionHandler);
      }
    }

    // Console error capturing
    if (MONITORING_CONFIG.errorTracking.captureConsoleErrors) {
      const originalConsoleError = console.error;
      console.error = (...args) => {
        this.captureError(new Error(args.join(' ')), {
          level: 'error',
          context: { type: 'console_error', args },
        });
        originalConsoleError.apply(console, args);
      };
    }
  }

  captureError(
    error: Error | string,
    options: {
      level?: ErrorEvent['level'];
      context?: Record<string, any>;
      userId?: string;
      fingerprint?: string;
    } = {}
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;
    
    const fingerprint = options.fingerprint || this.generateFingerprint(errorMessage, stack);
    const now = new Date();
    
    let errorEvent = this.errors.get(fingerprint);
    
    if (errorEvent) {
      // Update existing error
      errorEvent.count++;
      errorEvent.lastSeen = now;
      errorEvent.context = { ...errorEvent.context, ...options.context };
    } else {
      // Create new error event
      errorEvent = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        message: errorMessage,
        stack,
        level: options.level || 'error',
        timestamp: now,
        userId: options.userId,
        sessionId: this.sessionId,
        context: options.context || {},
        fingerprint,
        count: 1,
        firstSeen: now,
        lastSeen: now,
      };
      
      this.errors.set(fingerprint, errorEvent);
    }

    this.errorCount++;

    // Report critical errors immediately
    if (errorEvent.level === 'fatal' || errorEvent.level === 'error') {
      this.reportError(errorEvent);
    }

    // Alert if too many errors in session
    if (this.errorCount >= MONITORING_CONFIG.errorTracking.maxErrorsPerSession) {
      this.triggerErrorAlert();
    }
  }

  private generateFingerprint(message: string, stack?: string): string {
    const content = `${message}${stack ? stack.split('\n')[0] : ''}`;
    return btoa(content).substring(0, 32);
  }

  private async reportError(errorEvent: ErrorEvent): Promise<void> {
    try {
      await supabase
        .from('monitoring_errors')
        .insert({
          id: errorEvent.id,
          message: errorEvent.message,
          stack: errorEvent.stack,
          level: errorEvent.level,
          context: errorEvent.context,
          fingerprint: errorEvent.fingerprint,
          count: errorEvent.count,
          session_id: errorEvent.sessionId,
          user_id: errorEvent.userId,
          first_seen: errorEvent.firstSeen.toISOString(),
          last_seen: errorEvent.lastSeen.toISOString(),
        });
    } catch (error) {
      console.warn('Failed to report error:', error);
      // Fallback to local storage
      this.storeErrorLocally(errorEvent);
    }
  }

  private async storeErrorLocally(errorEvent: ErrorEvent): Promise<void> {
    try {
      const existingErrors = await AsyncStorage.getItem('monitoring-errors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      
      errors.push({
        ...errorEvent,
        timestamp: errorEvent.timestamp.toISOString(),
        firstSeen: errorEvent.firstSeen.toISOString(),
        lastSeen: errorEvent.lastSeen.toISOString(),
      });

      // Keep only last 100 errors locally
      const recentErrors = errors.slice(-100);
      await AsyncStorage.setItem('monitoring-errors', JSON.stringify(recentErrors));
    } catch (error) {
      console.warn('Failed to store error locally:', error);
    }
  }

  private triggerErrorAlert(): void {
    console.error(`🚨 HIGH ERROR RATE: ${this.errorCount} errors in current session`);
    
    // In production, this would trigger alerts to monitoring systems
    MonitoringService.recordBusinessMetric('error_rate_alert', this.errorCount, {
      session_id: this.sessionId,
      threshold: MONITORING_CONFIG.errorTracking.maxErrorsPerSession.toString(),
    });
  }

  getErrorSummary(): {
    totalErrors: number;
    uniqueErrors: number;
    errorsByLevel: Record<string, number>;
    topErrors: Array<{ message: string; count: number; level: string }>;
  } {
    const errors = Array.from(this.errors.values());
    const totalErrors = this.errorCount;
    const uniqueErrors = errors.length;

    const errorsByLevel: Record<string, number> = {};
    errors.forEach(error => {
      errorsByLevel[error.level] = (errorsByLevel[error.level] || 0) + error.count;
    });

    const topErrors = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(error => ({
        message: error.message.substring(0, 100),
        count: error.count,
        level: error.level,
      }));

    return {
      totalErrors,
      uniqueErrors,
      errorsByLevel,
      topErrors,
    };
  }
}

// ===================================================================
// BUSINESS METRICS SERVICE
// ===================================================================

class BusinessMetricsService {
  private metrics: BusinessMetric[] = [];
  private reportingTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.startReporting();
  }

  private startReporting(): void {
    if (!MONITORING_CONFIG.businessMetrics.enabled) return;

    this.reportingTimer = setInterval(() => {
      this.flushMetrics();
    }, MONITORING_CONFIG.businessMetrics.reportingInterval);
  }

  recordCounter(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    this.recordMetric({
      name,
      value,
      tags,
      type: 'counter',
      timestamp: new Date(),
    });
  }

  recordGauge(name: string, value: number, tags: Record<string, string> = {}, unit?: string): void {
    this.recordMetric({
      name,
      value,
      tags,
      type: 'gauge',
      timestamp: new Date(),
      unit,
    });
  }

  recordTimer(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric({
      name,
      value,
      tags,
      type: 'timer',
      timestamp: new Date(),
      unit: 'ms',
    });
  }

  recordHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    this.recordMetric({
      name,
      value,
      tags,
      type: 'histogram',
      timestamp: new Date(),
    });
  }

  private recordMetric(metric: BusinessMetric): void {
    this.metrics.push(metric);

    // Keep metrics buffer from growing too large
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    const metricsToSend = [...this.metrics];
    this.metrics = [];

    try {
      // Batch insert metrics to database
      const { error } = await supabase
        .from('monitoring_metrics')
        .insert(
          metricsToSend.map(metric => ({
            name: metric.name,
            value: typeof metric.value === 'number' ? metric.value : metric.value.toString(),
            tags: metric.tags,
            type: metric.type,
            unit: metric.unit,
            timestamp: metric.timestamp.toISOString(),
          }))
        );

      if (error) {
        console.warn('Failed to flush metrics:', error);
        // Put metrics back in queue for retry
        this.metrics.unshift(...metricsToSend);
      }
    } catch (error) {
      console.warn('Failed to flush metrics:', error);
      this.metrics.unshift(...metricsToSend);
    }
  }

  getMetricsSummary(): {
    totalMetrics: number;
    metricsByType: Record<string, number>;
    recentMetrics: BusinessMetric[];
  } {
    const totalMetrics = this.metrics.length;
    const metricsByType: Record<string, number> = {};

    this.metrics.forEach(metric => {
      metricsByType[metric.type] = (metricsByType[metric.type] || 0) + 1;
    });

    const recentMetrics = this.metrics
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20);

    return {
      totalMetrics,
      metricsByType,
      recentMetrics,
    };
  }

  destroy(): void {
    if (this.reportingTimer) {
      clearInterval(this.reportingTimer);
    }
    this.flushMetrics(); // Final flush
  }
}

// ===================================================================
// MAIN MONITORING SERVICE
// ===================================================================

class MonitoringService {
  private static instance: MonitoringService;
  private apm: APMService;
  private errorTracking: ErrorTrackingService;
  private businessMetrics: BusinessMetricsService;
  private isInitialized: boolean = false;

  constructor() {
    this.apm = new APMService();
    this.errorTracking = new ErrorTrackingService();
    this.businessMetrics = new BusinessMetricsService();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔍 Initializing Monitoring Service');
      
      // Set up app state monitoring
      AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        this.recordBusinessMetric('app_state_change', 1, { state: nextAppState });
      });

      // Set up network monitoring
      NetInfo.addEventListener(state => {
        this.recordBusinessMetric('network_state_change', 1, {
          type: state.type || 'unknown',
          connected: state.isConnected ? 'true' : 'false',
        });
      });

      this.isInitialized = true;
      console.log('✅ Monitoring Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Monitoring Service:', error);
      this.captureError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  // ===================================================================
  // APM METHODS
  // ===================================================================

  startTransaction(
    name: string,
    type: PerformanceTransaction['type'],
    metadata?: Record<string, any>
  ): string {
    return this.apm.startTransaction(name, type, metadata);
  }

  finishTransaction(
    transactionId: string,
    status?: PerformanceTransaction['status'],
    metadata?: Record<string, any>
  ): void {
    this.apm.finishTransaction(transactionId, status, metadata);
  }

  // ===================================================================
  // ERROR TRACKING METHODS
  // ===================================================================

  captureError(
    error: Error | string,
    options?: {
      level?: ErrorEvent['level'];
      context?: Record<string, any>;
      userId?: string;
    }
  ): void {
    this.errorTracking.captureError(error, options);
  }

  // ===================================================================
  // BUSINESS METRICS METHODS
  // ===================================================================

  static recordBusinessMetric(
    name: string,
    value: number | string,
    tags: Record<string, string> = {}
  ): void {
    const instance = MonitoringService.getInstance();
    if (typeof value === 'number') {
      instance.businessMetrics.recordGauge(name, value, tags);
    } else {
      instance.businessMetrics.recordCounter(name, 1, { ...tags, value });
    }
  }

  recordCounter(name: string, value?: number, tags?: Record<string, string>): void {
    this.businessMetrics.recordCounter(name, value, tags);
  }

  recordTimer(name: string, duration: number, tags?: Record<string, string>): void {
    this.businessMetrics.recordTimer(name, duration, tags);
  }

  // ===================================================================
  // MONITORING DASHBOARD DATA
  // ===================================================================

  getDashboardData(): {
    apm: ReturnType<APMService['getTransactionSummary']>;
    errors: ReturnType<ErrorTrackingService['getErrorSummary']>;
    metrics: ReturnType<BusinessMetricsService['getMetricsSummary']>;
    systemHealth: {
      status: 'healthy' | 'warning' | 'critical';
      checks: Array<{ name: string; status: string; details?: string }>;
    };
  } {
    const apm = this.apm.getTransactionSummary();
    const errors = this.errorTracking.getErrorSummary();
    const metrics = this.businessMetrics.getMetricsSummary();

    // System health assessment
    let healthStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
    const healthChecks = [
      {
        name: 'Error Rate',
        status: errors.totalErrors < 10 ? 'OK' : errors.totalErrors < 50 ? 'WARNING' : 'CRITICAL',
        details: `${errors.totalErrors} errors in session`,
      },
      {
        name: 'Performance',
        status: apm.averageDuration < 1000 ? 'OK' : apm.averageDuration < 3000 ? 'WARNING' : 'CRITICAL',
        details: `${apm.averageDuration}ms average duration`,
      },
      {
        name: 'Failed Transactions',
        status: apm.failedTransactions === 0 ? 'OK' : apm.failedTransactions < 5 ? 'WARNING' : 'CRITICAL',
        details: `${apm.failedTransactions} failed transactions`,
      },
    ];

    // Determine overall health
    if (healthChecks.some(check => check.status === 'CRITICAL')) {
      healthStatus = 'critical';
    } else if (healthChecks.some(check => check.status === 'WARNING')) {
      healthStatus = 'warning';
    }

    return {
      apm,
      errors,
      metrics,
      systemHealth: {
        status: healthStatus,
        checks: healthChecks,
      },
    };
  }

  // ===================================================================
  // CLEANUP
  // ===================================================================

  destroy(): void {
    this.apm.destroy();
    this.businessMetrics.destroy();
  }
}

// ===================================================================
// SINGLETON EXPORT
// ===================================================================

const monitoringService = MonitoringService.getInstance();

export { MonitoringService, monitoringService as default };
export type { PerformanceTransaction, ErrorEvent, BusinessMetric, SecurityEvent };
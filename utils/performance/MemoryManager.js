/**
 * MemoryManager - FASE 7: Gerenciador de memória com WeakRef e cleanup automático
 * ✅ WeakRef usage para componentes pesados sem memory leaks
 * ✅ Automatic cleanup baseado em memory pressure
 * ✅ Monitoring de usage patterns e detection de leaks
 * ✅ Emergency recovery procedures
 * ✅ Integration com ResponsiveCache para coordinated cleanup
 */

import { DeviceEventEmitter, Platform } from 'react-native';
import { performanceManager } from './PerformanceManager';

class MemoryManager {
  constructor() {
    this.references = new Map(); // ComponentId -> WeakRef
    this.refMetadata = new Map(); // ComponentId -> { type, size, timestamp, accessCount }
    this.cleanupCallbacks = new Map(); // ComponentId -> cleanup function
    this.memoryBaseline = null;
    this.lastMemoryCheck = 0;
    this.memoryHistory = [];
    
    // Thresholds para memory management
    this.thresholds = {
      warning: 80 * 1024 * 1024,   // 80MB
      critical: 120 * 1024 * 1024, // 120MB
      emergency: 150 * 1024 * 1024 // 150MB
    };
    
    // Configurações de cleanup
    this.cleanupConfig = {
      checkInterval: 5000,        // 5s
      emergencyCheckInterval: 1000, // 1s durante emergency
      retentionTime: {
        'workout_timer': 30000,   // 30s - componente crítico
        'exercise_list': 15000,   // 15s - lista pode ser recriada
        'progress_chart': 20000,  // 20s - charts são pesados
        'media_viewer': 5000,     // 5s - imagens/videos são grandes
        'default': 10000          // 10s - componentes gerais
      }
    };
    
    this.isEmergencyMode = false;
    this.cleanupTimer = null;
    
    this.initialize();
  }

  // ===== INITIALIZATION =====
  
  initialize() {
    this.establishBaseline();
    this.startMemoryMonitoring();
    this.setupEventListeners();
  }
  
  establishBaseline() {
    // Tentar obter baseline real de memória
    if (typeof performance !== 'undefined' && performance.memory) {
      this.memoryBaseline = performance.memory.usedJSHeapSize;
    } else {
      // Fallback: estimativa baseada em platform
      this.memoryBaseline = Platform.OS === 'ios' ? 40 * 1024 * 1024 : 60 * 1024 * 1024;
    }
    
    this.recordMemoryMetric('baseline_established', {
      baseline: this.memoryBaseline,
      platform: Platform.OS
    });
  }
  
  startMemoryMonitoring() {
    const checkInterval = this.isEmergencyMode ? 
      this.cleanupConfig.emergencyCheckInterval : 
      this.cleanupConfig.checkInterval;
    
    this.cleanupTimer = setInterval(() => {
      this.performMemoryCheck();
    }, checkInterval);
  }
  
  setupEventListeners() {
    // Listen para memory pressure do sistema
    DeviceEventEmitter.addListener('memory_cleanup_required', () => {
      this.performEmergencyCleanup();
    });
    
    // Listen para cache cleanup coordination
    DeviceEventEmitter.addListener('cache_emergency_cleanup', () => {
      this.performCoordinatedCleanup();
    });
  }

  // ===== WEAKREF MANAGEMENT =====
  
  registerComponent(componentId, component, options = {}) {
    const { type = 'default', estimatedSize = 1024 * 1024, cleanupCallback = null } = options;
    
    // Create WeakRef para não segurar componente na memória
    const weakRef = new WeakRef(component);
    
    // Metadata para tracking
    const metadata = {
      type,
      estimatedSize,
      timestamp: Date.now(),
      accessCount: 0,
      lastAccess: Date.now()
    };
    
    this.references.set(componentId, weakRef);
    this.refMetadata.set(componentId, metadata);
    
    if (cleanupCallback) {
      this.cleanupCallbacks.set(componentId, cleanupCallback);
    }
    
    this.recordMemoryMetric('component_registered', {
      componentId,
      type,
      estimatedSize,
      totalComponents: this.references.size
    });
    
    // Retornar função para cleanup manual
    return () => this.unregisterComponent(componentId);
  }
  
  getComponent(componentId) {
    const weakRef = this.references.get(componentId);
    if (!weakRef) return null;
    
    const component = weakRef.deref();
    if (!component) {
      // Componente foi garbage collected - cleanup metadata
      this.cleanupDeadReference(componentId);
      return null;
    }
    
    // Update access tracking
    const metadata = this.refMetadata.get(componentId);
    if (metadata) {
      metadata.accessCount++;
      metadata.lastAccess = Date.now();
    }
    
    return component;
  }
  
  unregisterComponent(componentId) {
    const weakRef = this.references.get(componentId);
    const metadata = this.refMetadata.get(componentId);
    
    // Execute cleanup callback se disponível
    const cleanupCallback = this.cleanupCallbacks.get(componentId);
    if (cleanupCallback) {
      try {
        cleanupCallback();
      } catch (error) {
        console.warn('Cleanup callback failed:', error);
      }
    }
    
    // Remove todas as references
    this.references.delete(componentId);
    this.refMetadata.delete(componentId);
    this.cleanupCallbacks.delete(componentId);
    
    this.recordMemoryMetric('component_unregistered', {
      componentId,
      type: metadata?.type,
      lifespan: metadata ? Date.now() - metadata.timestamp : 0,
      accessCount: metadata?.accessCount || 0
    });
  }
  
  cleanupDeadReference(componentId) {
    const metadata = this.refMetadata.get(componentId);
    
    this.references.delete(componentId);
    this.refMetadata.delete(componentId);
    this.cleanupCallbacks.delete(componentId);
    
    this.recordMemoryMetric('dead_reference_cleaned', {
      componentId,
      type: metadata?.type,
      lifespan: metadata ? Date.now() - metadata.timestamp : 0
    });
  }

  // ===== MEMORY MONITORING =====
  
  performMemoryCheck() {
    const currentUsage = this.getCurrentMemoryUsage();
    const pressureLevel = this.calculateMemoryPressure(currentUsage);
    
    // Atualizar histórico
    this.memoryHistory.push({
      usage: currentUsage,
      pressure: pressureLevel,
      timestamp: Date.now(),
      componentCount: this.references.size
    });
    
    // Limitar histórico
    if (this.memoryHistory.length > 100) {
      this.memoryHistory.shift();
    }
    
    // Cleanup based no pressure level
    if (pressureLevel === 'emergency') {
      this.enterEmergencyMode();
      this.performEmergencyCleanup();
    } else if (pressureLevel === 'critical') {
      this.performCriticalCleanup();
    } else if (pressureLevel === 'warning') {
      this.performPreventiveCleanup();
    } else if (this.isEmergencyMode && pressureLevel === 'normal') {
      this.exitEmergencyMode();
    }
    
    // Cleanup dead references periodicamente
    this.cleanupDeadReferences();
    
    this.recordMemoryMetric('memory_check', {
      usage: currentUsage,
      pressure: pressureLevel,
      componentCount: this.references.size,
      deadReferences: this.countDeadReferences()
    });
  }
  
  getCurrentMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    
    // Estimate based em registered components
    return this.estimateMemoryUsage();
  }
  
  estimateMemoryUsage() {
    let estimated = this.memoryBaseline || 0;
    
    for (const metadata of this.refMetadata.values()) {
      estimated += metadata.estimatedSize;
    }
    
    return estimated;
  }
  
  calculateMemoryPressure(currentUsage) {
    if (currentUsage > this.thresholds.emergency) return 'emergency';
    if (currentUsage > this.thresholds.critical) return 'critical';
    if (currentUsage > this.thresholds.warning) return 'warning';
    return 'normal';
  }

  // ===== CLEANUP OPERATIONS =====
  
  performPreventiveCleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Cleanup componentes não acessados há muito tempo
    for (const [componentId, metadata] of this.refMetadata.entries()) {
      const retentionTime = this.cleanupConfig.retentionTime[metadata.type] || 
                           this.cleanupConfig.retentionTime.default;
      
      if (now - metadata.lastAccess > retentionTime * 2) {
        // Não acessado há 2x o retention time - pode limpar
        const component = this.getComponent(componentId);
        if (!component) {
          this.cleanupDeadReference(componentId);
          cleanedCount++;
        }
      }
    }
    
    this.recordMemoryMetric('preventive_cleanup', {
      componentsRemoved: cleanedCount,
      remainingComponents: this.references.size
    });
  }
  
  performCriticalCleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Cleanup mais agressivo - usar retention time normal
    for (const [componentId, metadata] of this.refMetadata.entries()) {
      const retentionTime = this.cleanupConfig.retentionTime[metadata.type] || 
                           this.cleanupConfig.retentionTime.default;
      
      if (now - metadata.lastAccess > retentionTime) {
        const component = this.getComponent(componentId);
        if (!component) {
          this.cleanupDeadReference(componentId);
          cleanedCount++;
        } else if (metadata.type !== 'workout_timer') {
          // Force cleanup de componentes não críticos
          this.unregisterComponent(componentId);
          cleanedCount++;
        }
      }
    }
    
    // Force garbage collection se disponível
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
    
    this.recordMemoryMetric('critical_cleanup', {
      componentsRemoved: cleanedCount,
      remainingComponents: this.references.size
    });
    
    DeviceEventEmitter.emit('memory_pressure_high', {
      level: 'critical',
      componentsRemoved: cleanedCount
    });
  }
  
  performEmergencyCleanup() {
    const beforeCount = this.references.size;
    let cleanedCount = 0;
    
    // Emergency mode - cleanup tudo exceto componentes críticos ativos
    const criticalTypes = ['workout_timer'];
    const now = Date.now();
    
    for (const [componentId, metadata] of this.refMetadata.entries()) {
      // Manter apenas componentes críticos acessados recentemente
      if (criticalTypes.includes(metadata.type) && 
          now - metadata.lastAccess < 10000) { // 10s grace period
        continue;
      }
      
      const component = this.getComponent(componentId);
      if (!component) {
        this.cleanupDeadReference(componentId);
        cleanedCount++;
      } else {
        // Force cleanup mesmo de componentes ativos
        this.unregisterComponent(componentId);
        cleanedCount++;
      }
    }
    
    // Force multiple GC cycles
    for (let i = 0; i < 3; i++) {
      if (typeof global !== 'undefined' && global.gc) {
        setTimeout(() => global.gc(), i * 100);
      }
    }
    
    this.recordMemoryMetric('emergency_cleanup', {
      beforeCount,
      afterCount: this.references.size,
      componentsRemoved: cleanedCount,
      memoryUsage: this.getCurrentMemoryUsage()
    });
    
    DeviceEventEmitter.emit('memory_pressure_critical', {
      level: 'emergency',
      componentsRemoved: cleanedCount,
      remainingComponents: this.references.size
    });
  }
  
  performCoordinatedCleanup() {
    // Cleanup coordenado com cache systems
    this.performCriticalCleanup();
    
    // Emit para outros systems
    DeviceEventEmitter.emit('coordinated_cleanup', {
      source: 'memory_manager',
      timestamp: Date.now()
    });
  }
  
  cleanupDeadReferences() {
    const deadRefs = [];
    
    for (const [componentId, weakRef] of this.references.entries()) {
      if (!weakRef.deref()) {
        deadRefs.push(componentId);
      }
    }
    
    deadRefs.forEach(componentId => {
      this.cleanupDeadReference(componentId);
    });
    
    if (deadRefs.length > 0) {
      this.recordMemoryMetric('dead_references_cleanup', {
        count: deadRefs.length,
        remainingComponents: this.references.size
      });
    }
  }
  
  countDeadReferences() {
    let count = 0;
    for (const weakRef of this.references.values()) {
      if (!weakRef.deref()) count++;
    }
    return count;
  }

  // ===== EMERGENCY MODE =====
  
  enterEmergencyMode() {
    if (this.isEmergencyMode) return;
    
    this.isEmergencyMode = true;
    
    // Increase monitoring frequency
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.startMemoryMonitoring();
    
    // Notify app of emergency mode
    DeviceEventEmitter.emit('memory_emergency_mode', {
      entered: true,
      timestamp: Date.now()
    });
    
    this.recordMemoryMetric('emergency_mode_entered', {
      memoryUsage: this.getCurrentMemoryUsage(),
      componentCount: this.references.size
    });
  }
  
  exitEmergencyMode() {
    if (!this.isEmergencyMode) return;
    
    this.isEmergencyMode = false;
    
    // Restore normal monitoring frequency  
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.startMemoryMonitoring();
    
    DeviceEventEmitter.emit('memory_emergency_mode', {
      entered: false,
      timestamp: Date.now()
    });
    
    this.recordMemoryMetric('emergency_mode_exited', {
      memoryUsage: this.getCurrentMemoryUsage(),
      componentCount: this.references.size
    });
  }

  // ===== METRICS AND REPORTING =====
  
  recordMemoryMetric(type, data) {
    if (performanceManager) {
      performanceManager.recordMetric(`memory_${type}`, {
        ...data,
        timestamp: Date.now()
      });
    }
  }
  
  getMemoryReport() {
    const currentUsage = this.getCurrentMemoryUsage();
    const pressureLevel = this.calculateMemoryPressure(currentUsage);
    
    return {
      currentUsage,
      baseline: this.memoryBaseline,
      pressure: pressureLevel,
      isEmergencyMode: this.isEmergencyMode,
      components: {
        total: this.references.size,
        dead: this.countDeadReferences(),
        byType: this.getComponentsByType()
      },
      history: this.memoryHistory.slice(-10), // Last 10 checks
      thresholds: this.thresholds,
      recommendations: this.generateRecommendations(currentUsage, pressureLevel)
    };
  }
  
  getComponentsByType() {
    const byType = {};
    
    for (const metadata of this.refMetadata.values()) {
      const type = metadata.type;
      if (!byType[type]) {
        byType[type] = { count: 0, totalSize: 0, avgAge: 0 };
      }
      
      byType[type].count++;
      byType[type].totalSize += metadata.estimatedSize;
      byType[type].avgAge += Date.now() - metadata.timestamp;
    }
    
    // Calculate averages
    for (const type of Object.keys(byType)) {
      const stats = byType[type];
      stats.avgAge = stats.count > 0 ? stats.avgAge / stats.count : 0;
      stats.avgSize = stats.count > 0 ? stats.totalSize / stats.count : 0;
    }
    
    return byType;
  }
  
  generateRecommendations(usage, pressure) {
    const recommendations = [];
    
    if (pressure === 'emergency' || pressure === 'critical') {
      recommendations.push({
        priority: 'critical',
        action: 'Reduzir número de componentes ativos simultaneamente',
        impact: 'high'
      });
    }
    
    if (this.countDeadReferences() > 10) {
      recommendations.push({
        priority: 'medium',
        action: 'Cleanup dead references mais frequente',
        impact: 'medium'
      });
    }
    
    const componentsByType = this.getComponentsByType();
    const heaviestType = Object.entries(componentsByType)
      .sort(([, a], [, b]) => b.totalSize - a.totalSize)[0];
    
    if (heaviestType && heaviestType[1].totalSize > 20 * 1024 * 1024) {
      recommendations.push({
        priority: 'high',
        action: `Otimizar componentes do tipo ${heaviestType[0]}`,
        impact: 'high'
      });
    }
    
    return recommendations;
  }

  // ===== PUBLIC API =====
  
  // Create helper function para hooks
  createComponentRef(componentId, component, options) {
    return this.registerComponent(componentId, component, options);
  }
  
  // Memory leak detection
  detectMemoryLeaks() {
    const now = Date.now();
    const suspiciousComponents = [];
    
    for (const [componentId, metadata] of this.refMetadata.entries()) {
      const age = now - metadata.timestamp;
      const avgRetentionTime = this.cleanupConfig.retentionTime[metadata.type] || 
                              this.cleanupConfig.retentionTime.default;
      
      // Component vivendo muito mais que esperado
      if (age > avgRetentionTime * 5) {
        const component = this.getComponent(componentId);
        if (component) {
          suspiciousComponents.push({
            componentId,
            type: metadata.type,
            age,
            accessCount: metadata.accessCount,
            estimatedSize: metadata.estimatedSize
          });
        }
      }
    }
    
    if (suspiciousComponents.length > 0) {
      this.recordMemoryMetric('memory_leak_detected', {
        suspiciousComponents: suspiciousComponents.length,
        components: suspiciousComponents
      });
      
      DeviceEventEmitter.emit('memory_leak_warning', {
        components: suspiciousComponents
      });
    }
    
    return suspiciousComponents;
  }
  
  // Force cleanup de tipo específico
  cleanupComponentType(type) {
    const cleaned = [];
    
    for (const [componentId, metadata] of this.refMetadata.entries()) {
      if (metadata.type === type) {
        this.unregisterComponent(componentId);
        cleaned.push(componentId);
      }
    }
    
    this.recordMemoryMetric('type_cleanup', {
      type,
      componentsRemoved: cleaned.length
    });
    
    return cleaned.length;
  }
  
  // Get live statistics
  getStatistics() {
    return {
      totalComponents: this.references.size,
      deadReferences: this.countDeadReferences(),
      memoryUsage: this.getCurrentMemoryUsage(),
      memoryPressure: this.calculateMemoryPressure(this.getCurrentMemoryUsage()),
      isEmergencyMode: this.isEmergencyMode,
      componentsByType: this.getComponentsByType()
    };
  }
  
  // Destroy manager
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    // Cleanup all references
    for (const componentId of this.references.keys()) {
      this.unregisterComponent(componentId);
    }
    
    DeviceEventEmitter.removeAllListeners('memory_cleanup_required');
    DeviceEventEmitter.removeAllListeners('cache_emergency_cleanup');
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();

// Hook para uso em componentes
export const useMemoryManager = () => {
  const createRef = (componentId, component, options) => 
    memoryManager.createComponentRef(componentId, component, options);
  
  const getComponent = (componentId) => 
    memoryManager.getComponent(componentId);
  
  const getStatistics = () => 
    memoryManager.getStatistics();
  
  return {
    createRef,
    getComponent,
    getStatistics,
    report: memoryManager.getMemoryReport.bind(memoryManager),
    detectLeaks: memoryManager.detectMemoryLeaks.bind(memoryManager)
  };
};

export default MemoryManager;
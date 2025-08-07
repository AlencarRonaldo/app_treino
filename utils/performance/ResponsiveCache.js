/**
 * ResponsiveCache - FASE 7: Sistema de cache LRU com TTL e cleanup automático
 * ✅ LRU (Least Recently Used) com capacidade dinâmica
 * ✅ TTL (Time To Live) configurável por tipo de cache
 * ✅ Cleanup automático baseado em memory pressure
 * ✅ Validação de hit rate >80% para performance
 * ✅ Monitoring em tempo real de eficiência
 */

import { DeviceEventEmitter } from 'react-native';
import { performanceManager } from './PerformanceManager';

class ResponsiveCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutos
    this.cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minuto
    
    // Cache storage com metadata
    this.cache = new Map();
    this.accessOrder = new Map(); // Para LRU tracking
    this.hitCount = 0;
    this.missCount = 0;
    this.cleanupCount = 0;
    
    // TTL específico por categoria
    this.categoryTTL = {
      'exercise_images': 10 * 60 * 1000,    // 10 min - imagens são estáveis
      'api_responses': 2 * 60 * 1000,       // 2 min - dados podem mudar
      'user_preferences': 30 * 60 * 1000,   // 30 min - configurações pessoais
      'workout_data': 5 * 60 * 1000,        // 5 min - dados de treino
      'exercise_list': 15 * 60 * 1000,      // 15 min - lista de exercícios
      'progress_stats': 1 * 60 * 1000,      // 1 min - estatísticas em tempo real
    };
    
    // Memory pressure thresholds
    this.memoryPressureThresholds = {
      normal: 0.7,   // 70% capacity
      high: 0.85,    // 85% capacity 
      critical: 0.95 // 95% capacity
    };
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      cleanupOperations: 0,
      memoryCleanups: 0,
      lastHitRate: 0,
      averageResponseTime: 0,
      totalOperations: 0
    };
    
    this.startCleanupTimer();
    this.setupMemoryPressureListening();
    this.startMetricsCollection();
  }

  // ===== CORE CACHE OPERATIONS =====
  
  get(key, category = 'default') {
    const startTime = performance.now();
    const fullKey = this.getFullKey(key, category);
    
    if (!this.cache.has(fullKey)) {
      this.missCount++;
      this.metrics.misses++;
      this.recordMetric('cache_miss', { key: fullKey, category });
      return null;
    }
    
    const item = this.cache.get(fullKey);
    
    // TTL validation
    if (this.isExpired(item)) {
      this.cache.delete(fullKey);
      this.accessOrder.delete(fullKey);
      this.missCount++;
      this.metrics.misses++;
      this.recordMetric('cache_expired', { key: fullKey, category, age: Date.now() - item.timestamp });
      return null;
    }
    
    // Update access order for LRU
    this.updateAccessOrder(fullKey);
    
    // Cache hit
    this.hitCount++;
    this.metrics.hits++;
    
    const responseTime = performance.now() - startTime;
    this.updateMetrics('hit', responseTime);
    
    this.recordMetric('cache_hit', { 
      key: fullKey, 
      category, 
      age: Date.now() - item.timestamp,
      responseTime
    });
    
    return item.value;
  }
  
  set(key, value, category = 'default', customTTL = null) {
    const startTime = performance.now();
    const fullKey = this.getFullKey(key, category);
    const ttl = customTTL || this.getCategoryTTL(category);
    
    const item = {
      value,
      category,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      size: this.estimateSize(value)
    };
    
    // Check memory pressure before adding
    const memoryPressure = this.calculateMemoryPressure();
    if (memoryPressure > this.memoryPressureThresholds.critical) {
      this.performEmergencyCleanup();
    }
    
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(fullKey)) {
      this.evictLRU();
    }
    
    // Add/update item
    const wasUpdate = this.cache.has(fullKey);
    this.cache.set(fullKey, item);
    this.updateAccessOrder(fullKey);
    
    const responseTime = performance.now() - startTime;
    this.updateMetrics(wasUpdate ? 'update' : 'set', responseTime);
    
    this.recordMetric('cache_set', { 
      key: fullKey, 
      category, 
      size: item.size,
      ttl,
      responseTime,
      wasUpdate
    });
  }
  
  // ===== LRU IMPLEMENTATION =====
  
  updateAccessOrder(key) {
    // Remove from current position
    this.accessOrder.delete(key);
    // Add to end (most recent)
    this.accessOrder.set(key, Date.now());
  }
  
  evictLRU() {
    if (this.accessOrder.size === 0) return;
    
    // Get least recently used key (first in map)
    const [lruKey] = this.accessOrder.keys();
    
    const item = this.cache.get(lruKey);
    this.cache.delete(lruKey);
    this.accessOrder.delete(lruKey);
    
    this.metrics.evictions++;
    this.recordMetric('cache_evict', { 
      key: lruKey, 
      category: item?.category,
      age: Date.now() - (item?.timestamp || 0),
      reason: 'lru'
    });
  }
  
  // ===== TTL MANAGEMENT =====
  
  isExpired(item) {
    return (Date.now() - item.timestamp) > item.ttl;
  }
  
  getCategoryTTL(category) {
    return this.categoryTTL[category] || this.defaultTTL;
  }
  
  // ===== CLEANUP OPERATIONS =====
  
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup();
    }, this.cleanupInterval);
  }
  
  performCleanup() {
    const startTime = performance.now();
    let cleanedCount = 0;
    let freedMemory = 0;
    
    // Remove expired items
    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        freedMemory += item.size || 0;
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleanedCount++;
      }
    }
    
    // Memory pressure cleanup
    const memoryPressure = this.calculateMemoryPressure();
    if (memoryPressure > this.memoryPressureThresholds.high) {
      const additionalCleanup = this.performPressureCleanup(memoryPressure);
      cleanedCount += additionalCleanup.count;
      freedMemory += additionalCleanup.memory;
    }
    
    this.cleanupCount++;
    this.metrics.cleanupOperations++;
    
    const cleanupTime = performance.now() - startTime;
    
    this.recordMetric('cache_cleanup', {
      itemsRemoved: cleanedCount,
      memoryFreed: freedMemory,
      memoryPressure,
      cleanupTime,
      cacheSize: this.cache.size
    });
    
    // Emit cleanup event se significant
    if (cleanedCount > 0) {
      DeviceEventEmitter.emit('cache_cleanup', {
        itemsRemoved: cleanedCount,
        memoryFreed: freedMemory,
        cacheSize: this.cache.size
      });
    }
  }
  
  performPressureCleanup(pressureLevel) {
    let cleanedCount = 0;
    let freedMemory = 0;
    
    if (pressureLevel > this.memoryPressureThresholds.critical) {
      // Emergency cleanup - remove 50% of cache
      const targetSize = Math.floor(this.cache.size * 0.5);
      cleanedCount = this.evictMultiple(this.cache.size - targetSize);
    } else if (pressureLevel > this.memoryPressureThresholds.high) {
      // Aggressive cleanup - remove 25% of cache
      const targetSize = Math.floor(this.cache.size * 0.75);
      cleanedCount = this.evictMultiple(this.cache.size - targetSize);
    }
    
    this.metrics.memoryCleanups++;
    
    return { count: cleanedCount, memory: freedMemory };
  }
  
  performEmergencyCleanup() {
    const beforeSize = this.cache.size;
    
    // Clear 75% of cache immediately
    const keepSize = Math.floor(this.maxSize * 0.25);
    const evictCount = Math.max(0, this.cache.size - keepSize);
    
    this.evictMultiple(evictCount);
    
    this.recordMetric('cache_emergency_cleanup', {
      beforeSize,
      afterSize: this.cache.size,
      itemsRemoved: beforeSize - this.cache.size
    });
    
    DeviceEventEmitter.emit('cache_emergency_cleanup', {
      itemsRemoved: beforeSize - this.cache.size,
      remainingItems: this.cache.size
    });
  }
  
  evictMultiple(count) {
    let evicted = 0;
    const accessOrderEntries = Array.from(this.accessOrder.entries())
      .sort(([, a], [, b]) => a - b); // Sort by access time (oldest first)
    
    for (const [key] of accessOrderEntries) {
      if (evicted >= count) break;
      
      const item = this.cache.get(key);
      this.cache.delete(key);
      this.accessOrder.delete(key);
      evicted++;
      
      this.recordMetric('cache_evict', {
        key,
        category: item?.category,
        reason: 'pressure_cleanup'
      });
    }
    
    return evicted;
  }
  
  // ===== MEMORY PRESSURE MONITORING =====
  
  setupMemoryPressureListening() {
    DeviceEventEmitter.addListener('memory_cleanup_required', () => {
      this.performEmergencyCleanup();
    });
  }
  
  calculateMemoryPressure() {
    const currentSize = this.cache.size;
    const maxSize = this.maxSize;
    return currentSize / maxSize;
  }
  
  // ===== PERFORMANCE VALIDATION =====
  
  validateHitRate() {
    const totalRequests = this.hitCount + this.missCount;
    if (totalRequests === 0) return { hitRate: 0, valid: true };
    
    const hitRate = (this.hitCount / totalRequests) * 100;
    const isValid = hitRate >= 80; // Target: >80% hit rate
    
    this.metrics.lastHitRate = hitRate;
    
    return {
      hitRate,
      valid: isValid,
      hits: this.hitCount,
      misses: this.missCount,
      total: totalRequests,
      performance: isValid ? 'excellent' : hitRate >= 60 ? 'good' : 'poor'
    };
  }
  
  getPerformanceMetrics() {
    const validation = this.validateHitRate();
    
    return {
      ...this.metrics,
      ...validation,
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      memoryPressure: this.calculateMemoryPressure(),
      averageItemSize: this.calculateAverageItemSize(),
      oldestItemAge: this.getOldestItemAge(),
      categories: this.getCategoryStats()
    };
  }
  
  // ===== UTILITY METHODS =====
  
  getFullKey(key, category) {
    return `${category}:${key}`;
  }
  
  estimateSize(value) {
    if (!value) return 0;
    
    try {
      // Rough estimation based on JSON serialization
      const jsonStr = JSON.stringify(value);
      return jsonStr.length * 2; // Approximate UTF-16 bytes
    } catch {
      // Fallback for non-serializable objects
      return 1000; // 1KB estimate
    }
  }
  
  calculateAverageItemSize() {
    if (this.cache.size === 0) return 0;
    
    let totalSize = 0;
    let count = 0;
    
    for (const item of this.cache.values()) {
      totalSize += item.size || 0;
      count++;
    }
    
    return count > 0 ? totalSize / count : 0;
  }
  
  getOldestItemAge() {
    let oldestAge = 0;
    
    for (const item of this.cache.values()) {
      const age = Date.now() - item.timestamp;
      if (age > oldestAge) oldestAge = age;
    }
    
    return oldestAge;
  }
  
  getCategoryStats() {
    const stats = {};
    
    for (const item of this.cache.values()) {
      const category = item.category || 'default';
      if (!stats[category]) {
        stats[category] = { count: 0, totalSize: 0, avgAge: 0 };
      }
      
      stats[category].count++;
      stats[category].totalSize += item.size || 0;
      stats[category].avgAge += Date.now() - item.timestamp;
    }
    
    // Calculate averages
    for (const category of Object.keys(stats)) {
      const stat = stats[category];
      stat.avgAge = stat.count > 0 ? stat.avgAge / stat.count : 0;
      stat.avgSize = stat.count > 0 ? stat.totalSize / stat.count : 0;
    }
    
    return stats;
  }
  
  startMetricsCollection() {
    setInterval(() => {
      const metrics = this.getPerformanceMetrics();
      
      // Emit metrics for external monitoring
      DeviceEventEmitter.emit('cache_metrics', metrics);
      
      // Record in performance manager
      if (performanceManager) {
        performanceManager.recordMetric('cache_performance', metrics);
      }
    }, 10000); // Every 10 seconds
  }
  
  updateMetrics(operation, responseTime) {
    this.metrics.totalOperations++;
    
    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalOperations - 1) + responseTime) / 
      this.metrics.totalOperations;
  }
  
  recordMetric(type, data) {
    if (performanceManager) {
      performanceManager.recordMetric(`cache_${type}`, {
        ...data,
        timestamp: Date.now()
      });
    }
  }
  
  // ===== PUBLIC API METHODS =====
  
  clear(category = null) {
    if (category) {
      // Clear specific category
      const keysToDelete = [];
      for (const [key, item] of this.cache.entries()) {
        if (item.category === category) {
          keysToDelete.push(key);
        }
      }
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
        this.accessOrder.delete(key);
      });
      
      this.recordMetric('category_clear', { category, itemsRemoved: keysToDelete.length });
    } else {
      // Clear entire cache
      const itemsRemoved = this.cache.size;
      this.cache.clear();
      this.accessOrder.clear();
      
      this.recordMetric('full_clear', { itemsRemoved });
    }
  }
  
  has(key, category = 'default') {
    const fullKey = this.getFullKey(key, category);
    return this.cache.has(fullKey) && !this.isExpired(this.cache.get(fullKey));
  }
  
  delete(key, category = 'default') {
    const fullKey = this.getFullKey(key, category);
    const item = this.cache.get(fullKey);
    
    const deleted = this.cache.delete(fullKey);
    this.accessOrder.delete(fullKey);
    
    if (deleted) {
      this.recordMetric('manual_delete', { key: fullKey, category });
    }
    
    return deleted;
  }
  
  size() {
    return this.cache.size;
  }
  
  // For debugging and development
  debug() {
    return {
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      memoryPressure: this.calculateMemoryPressure(),
      hitRate: this.validateHitRate().hitRate,
      metrics: this.metrics,
      categoryStats: this.getCategoryStats()
    };
  }
  
  // Cleanup
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clear();
    DeviceEventEmitter.removeAllListeners('memory_cleanup_required');
  }
}

// Global cache instances for different purposes
export const imageCache = new ResponsiveCache({
  maxSize: 150,
  defaultTTL: 10 * 60 * 1000 // 10 minutes for images
});

export const apiCache = new ResponsiveCache({
  maxSize: 100,
  defaultTTL: 2 * 60 * 1000 // 2 minutes for API responses
});

export const responseCache = new ResponsiveCache({
  maxSize: 200,
  defaultTTL: 5 * 60 * 1000 // 5 minutes for general responses
});

// Factory function for custom caches
export const createCache = (options) => new ResponsiveCache(options);

export default ResponsiveCache;
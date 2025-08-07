/**
 * Performance Profiler for TreinosApp Testing
 * Measures and analyzes application performance
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: number;
  operationsPerSecond: number;
  errorRate: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface DatabasePerformanceTest {
  operation: string;
  table: string;
  recordCount: number;
  concurrency: number;
  duration: number;
}

export interface RealtimePerformanceTest {
  subscriptions: number;
  messagesPerSecond: number;
  latency: number;
  connectionTime: number;
}

export interface StoragePerformanceTest {
  operation: 'upload' | 'download' | 'list';
  fileSize: number;
  fileCount: number;
  duration: number;
  throughput: number;
}

export class PerformanceProfiler {
  private client: SupabaseClient;
  private measurements: number[] = [];
  private errors: number = 0;
  private startTime: number = 0;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Start performance measurement
   */
  startMeasurement(): void {
    this.measurements = [];
    this.errors = 0;
    this.startTime = performance.now();
  }

  /**
   * Record single operation time
   */
  recordOperation(duration: number, hasError: boolean = false): void {
    this.measurements.push(duration);
    if (hasError) this.errors++;
  }

  /**
   * Calculate performance metrics
   */
  getMetrics(): PerformanceMetrics {
    if (this.measurements.length === 0) {
      throw new Error('No measurements recorded');
    }

    const sorted = [...this.measurements].sort((a, b) => a - b);
    const totalDuration = performance.now() - this.startTime;
    const memoryUsage = this.getMemoryUsage();

    return {
      duration: totalDuration,
      memoryUsage,
      operationsPerSecond: (this.measurements.length / totalDuration) * 1000,
      errorRate: (this.errors / this.measurements.length) * 100,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /**
   * Test database performance
   */
  async testDatabasePerformance(config: {
    operations: Array<{ name: string; fn: () => Promise<any> }>;
    iterations: number;
    concurrency: number;
  }): Promise<DatabasePerformanceTest[]> {
    const results: DatabasePerformanceTest[] = [];

    for (const operation of config.operations) {
      console.log(`Testing ${operation.name}...`);
      
      this.startMeasurement();
      
      // Run concurrent operations
      const promises = Array.from({ length: config.concurrency }, async () => {
        for (let i = 0; i < Math.ceil(config.iterations / config.concurrency); i++) {
          const start = performance.now();
          try {
            await operation.fn();
            const duration = performance.now() - start;
            this.recordOperation(duration, false);
          } catch (error) {
            const duration = performance.now() - start;
            this.recordOperation(duration, true);
          }
        }
      });

      await Promise.all(promises);
      
      const metrics = this.getMetrics();
      
      results.push({
        operation: operation.name,
        table: 'various',
        recordCount: config.iterations,
        concurrency: config.concurrency,
        duration: metrics.duration,
      });
    }

    return results;
  }

  /**
   * Test real-time performance
   */
  async testRealtimePerformance(config: {
    subscriptionCount: number;
    messageRate: number; // messages per second
    testDuration: number; // milliseconds
  }): Promise<RealtimePerformanceTest> {
    const subscriptions: any[] = [];
    const messageTimestamps: number[] = [];
    let messagesReceived = 0;

    console.log(`Creating ${config.subscriptionCount} subscriptions...`);
    
    const connectionStart = performance.now();
    
    // Create subscriptions
    for (let i = 0; i < config.subscriptionCount; i++) {
      const subscription = this.client
        .channel(`test-channel-${i}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'messages' },
          (payload) => {
            messagesReceived++;
            messageTimestamps.push(performance.now());
          }
        )
        .subscribe();
      
      subscriptions.push(subscription);
    }

    const connectionTime = performance.now() - connectionStart;

    // Send messages at specified rate
    const messageInterval = 1000 / config.messageRate;
    const startTime = performance.now();
    
    while (performance.now() - startTime < config.testDuration) {
      await this.simulateMessage();
      await new Promise(resolve => setTimeout(resolve, messageInterval));
    }

    // Calculate latency
    const avgLatency = messageTimestamps.length > 0 
      ? messageTimestamps.reduce((sum, ts, idx) => {
          const expected = startTime + (idx * messageInterval);
          return sum + (ts - expected);
        }, 0) / messageTimestamps.length
      : 0;

    // Cleanup
    await Promise.all(subscriptions.map(sub => sub.unsubscribe()));

    return {
      subscriptions: config.subscriptionCount,
      messagesPerSecond: messagesReceived / (config.testDuration / 1000),
      latency: Math.abs(avgLatency),
      connectionTime,
    };
  }

  /**
   * Test storage performance
   */
  async testStoragePerformance(config: {
    fileCount: number;
    fileSize: number; // in KB
    operation: 'upload' | 'download' | 'list';
  }): Promise<StoragePerformanceTest> {
    const bucket = 'test-storage';
    const startTime = performance.now();
    let totalBytes = 0;

    switch (config.operation) {
      case 'upload':
        for (let i = 0; i < config.fileCount; i++) {
          const fileData = this.generateTestFile(config.fileSize);
          await this.client.storage
            .from(bucket)
            .upload(`test-file-${i}.txt`, fileData);
          totalBytes += config.fileSize * 1024;
        }
        break;

      case 'download':
        for (let i = 0; i < config.fileCount; i++) {
          await this.client.storage
            .from(bucket)
            .download(`test-file-${i}.txt`);
          totalBytes += config.fileSize * 1024;
        }
        break;

      case 'list':
        await this.client.storage
          .from(bucket)
          .list('', { limit: config.fileCount });
        break;
    }

    const duration = performance.now() - startTime;
    const throughput = totalBytes / (duration / 1000); // bytes per second

    return {
      operation: config.operation,
      fileSize: config.fileSize,
      fileCount: config.fileCount,
      duration,
      throughput,
    };
  }

  /**
   * Load test with concurrent operations
   */
  async loadTest(config: {
    operation: () => Promise<any>;
    concurrentUsers: number;
    operationsPerUser: number;
    rampUpTime: number; // milliseconds
  }): Promise<{
    totalOperations: number;
    successfulOperations: number;
    failedOperations: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
  }> {
    const results: Array<{ duration: number; error: boolean }> = [];
    const userDelay = config.rampUpTime / config.concurrentUsers;

    console.log(`Starting load test with ${config.concurrentUsers} concurrent users...`);

    const userPromises = Array.from({ length: config.concurrentUsers }, async (_, userIndex) => {
      // Ramp up delay
      await new Promise(resolve => setTimeout(resolve, userIndex * userDelay));

      // Execute operations for this user
      for (let i = 0; i < config.operationsPerUser; i++) {
        const start = performance.now();
        try {
          await config.operation();
          results.push({ duration: performance.now() - start, error: false });
        } catch (error) {
          results.push({ duration: performance.now() - start, error: true });
        }
      }
    });

    await Promise.all(userPromises);

    const totalOperations = results.length;
    const failedOperations = results.filter(r => r.error).length;
    const successfulOperations = totalOperations - failedOperations;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
    const averageResponseTime = totalTime / totalOperations;

    return {
      totalOperations,
      successfulOperations,
      failedOperations,
      averageResponseTime,
      throughput: successfulOperations / (totalTime / 1000),
      errorRate: (failedOperations / totalOperations) * 100,
    };
  }

  /**
   * Memory usage profiling
   */
  async profileMemoryUsage(
    operation: () => Promise<void>,
    iterations: number = 100
  ): Promise<{
    initialMemory: number;
    finalMemory: number;
    peakMemory: number;
    averageMemory: number;
    memoryGrowth: number;
    possibleLeak: boolean;
  }> {
    const measurements: number[] = [];
    const initialMemory = this.getMemoryUsage();
    let peakMemory = initialMemory;

    for (let i = 0; i < iterations; i++) {
      await operation();
      
      const currentMemory = this.getMemoryUsage();
      measurements.push(currentMemory);
      
      if (currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }

    const finalMemory = measurements[measurements.length - 1];
    const averageMemory = measurements.reduce((sum, mem) => sum + mem, 0) / measurements.length;
    const memoryGrowth = finalMemory - initialMemory;

    // Simple leak detection: consistent growth over last 25% of measurements
    const lastQuarter = measurements.slice(-Math.floor(measurements.length * 0.25));
    const growthTrend = lastQuarter.reduce((acc, mem, idx) => {
      if (idx === 0) return acc;
      return acc + (mem > lastQuarter[idx - 1] ? 1 : -1);
    }, 0);

    const possibleLeak = growthTrend > lastQuarter.length * 0.7;

    return {
      initialMemory,
      finalMemory,
      peakMemory,
      averageMemory,
      memoryGrowth,
      possibleLeak,
    };
  }

  /**
   * Generate performance report
   */
  generateReport(results: {
    database?: DatabasePerformanceTest[];
    realtime?: RealtimePerformanceTest;
    storage?: StoragePerformanceTest[];
    loadTest?: any;
    memory?: any;
  }): string {
    let report = '# TreinosApp Performance Test Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    if (results.database) {
      report += '## Database Performance\n\n';
      results.database.forEach(test => {
        report += `- **${test.operation}**: ${test.duration.toFixed(2)}ms for ${test.recordCount} records\n`;
      });
      report += '\n';
    }

    if (results.realtime) {
      report += '## Real-time Performance\n\n';
      report += `- **Subscriptions**: ${results.realtime.subscriptions}\n`;
      report += `- **Messages/sec**: ${results.realtime.messagesPerSecond.toFixed(2)}\n`;
      report += `- **Latency**: ${results.realtime.latency.toFixed(2)}ms\n`;
      report += `- **Connection Time**: ${results.realtime.connectionTime.toFixed(2)}ms\n\n`;
    }

    if (results.storage) {
      report += '## Storage Performance\n\n';
      results.storage.forEach(test => {
        report += `- **${test.operation}**: ${test.duration.toFixed(2)}ms, ${(test.throughput / 1024).toFixed(2)} KB/s\n`;
      });
      report += '\n';
    }

    if (results.loadTest) {
      report += '## Load Test Results\n\n';
      report += `- **Total Operations**: ${results.loadTest.totalOperations}\n`;
      report += `- **Success Rate**: ${((results.loadTest.successfulOperations / results.loadTest.totalOperations) * 100).toFixed(2)}%\n`;
      report += `- **Average Response Time**: ${results.loadTest.averageResponseTime.toFixed(2)}ms\n`;
      report += `- **Throughput**: ${results.loadTest.throughput.toFixed(2)} ops/sec\n\n`;
    }

    if (results.memory) {
      report += '## Memory Analysis\n\n';
      report += `- **Memory Growth**: ${(results.memory.memoryGrowth / 1024 / 1024).toFixed(2)} MB\n`;
      report += `- **Peak Usage**: ${(results.memory.peakMemory / 1024 / 1024).toFixed(2)} MB\n`;
      report += `- **Possible Leak**: ${results.memory.possibleLeak ? 'YES ⚠️' : 'NO ✅'}\n\n`;
    }

    return report;
  }

  // Private helper methods
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private generateTestFile(sizeKB: number): Uint8Array {
    const size = sizeKB * 1024;
    return new Uint8Array(size).fill(65); // Fill with 'A' character
  }

  private async simulateMessage(): Promise<void> {
    // This would trigger a real-time message in actual implementation
    // For testing purposes, we'll just simulate the delay
    await new Promise(resolve => setTimeout(resolve, 1));
  }
}

export default PerformanceProfiler;
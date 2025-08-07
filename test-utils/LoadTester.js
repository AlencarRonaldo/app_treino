/**
 * Load Testing Utility
 * Performs stress testing on TreinosApp with Supabase
 */

const autocannon = require('autocannon');
const { createClient } = require('@supabase/supabase-js');
const { faker } = require('@faker-js/faker');

class LoadTester {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_ANON_KEY || 'test-key'
    );
    
    this.results = {
      database: {},
      realtime: {},
      storage: {},
      api: {},
    };
  }

  /**
   * Database Load Testing
   */
  async testDatabaseLoad(options = {}) {
    const {
      concurrency = 50,
      duration = 30,
      operations = 1000,
    } = options;

    console.log('🗄️ Starting database load test...');
    console.log(`Configuration: ${concurrency} concurrent users, ${duration}s duration`);

    const startTime = Date.now();
    const promises = [];
    const stats = {
      reads: { success: 0, error: 0, totalTime: 0 },
      writes: { success: 0, error: 0, totalTime: 0 },
      updates: { success: 0, error: 0, totalTime: 0 },
      deletes: { success: 0, error: 0, totalTime: 0 },
    };

    // Create test user for operations
    const testUser = await this.createTestUser();
    await this.supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password,
    });

    // Generate concurrent operations
    for (let i = 0; i < concurrency; i++) {
      // Each user performs mixed operations
      promises.push(this.performMixedOperations(stats, duration));
    }

    await Promise.all(promises);

    const totalTime = Date.now() - startTime;
    
    this.results.database = {
      duration: totalTime,
      concurrency,
      stats,
      throughput: {
        readsPerSecond: Math.round(stats.reads.success / (totalTime / 1000)),
        writesPerSecond: Math.round(stats.writes.success / (totalTime / 1000)),
        totalOperationsPerSecond: Math.round(
          (stats.reads.success + stats.writes.success + stats.updates.success + stats.deletes.success) / (totalTime / 1000)
        ),
      },
      avgResponseTime: {
        reads: stats.reads.success > 0 ? Math.round(stats.reads.totalTime / stats.reads.success) : 0,
        writes: stats.writes.success > 0 ? Math.round(stats.writes.totalTime / stats.writes.success) : 0,
        updates: stats.updates.success > 0 ? Math.round(stats.updates.totalTime / stats.updates.success) : 0,
        deletes: stats.deletes.success > 0 ? Math.round(stats.deletes.totalTime / stats.deletes.success) : 0,
      },
      errorRates: {
        reads: stats.reads.error / (stats.reads.success + stats.reads.error || 1),
        writes: stats.writes.error / (stats.writes.success + stats.writes.error || 1),
        updates: stats.updates.error / (stats.updates.success + stats.updates.error || 1),
        deletes: stats.deletes.error / (stats.deletes.success + stats.deletes.error || 1),
      },
    };

    console.log('📊 Database load test results:', this.results.database);
    return this.results.database;
  }

  /**
   * Perform mixed database operations for a user
   */
  async performMixedOperations(stats, duration) {
    const endTime = Date.now() + duration * 1000;
    const operations = ['read', 'write', 'update', 'delete'];
    const weights = [0.5, 0.3, 0.15, 0.05]; // 50% reads, 30% writes, 15% updates, 5% deletes

    while (Date.now() < endTime) {
      try {
        // Select operation based on weights
        const rand = Math.random();
        let operation = 'read';
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
          cumulative += weights[i];
          if (rand <= cumulative) {
            operation = operations[i];
            break;
          }
        }

        const startTime = Date.now();
        await this.performOperation(operation);
        const duration = Date.now() - startTime;

        stats[operation + 's'].success++;
        stats[operation + 's'].totalTime += duration;

      } catch (error) {
        const operation = 'read'; // Default for error counting
        stats[operation + 's'].error++;
      }

      // Small random delay to simulate realistic usage
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    }
  }

  /**
   * Perform a specific database operation
   */
  async performOperation(operation) {
    const workoutId = faker.string.uuid();
    
    switch (operation) {
      case 'read':
        await this.supabase
          .from('workouts')
          .select('id, name, category')
          .limit(10);
        break;

      case 'write':
        await this.supabase
          .from('workouts')
          .insert({
            id: workoutId,
            name: `Load Test Workout ${faker.word.words(2)}`,
            category: faker.helpers.arrayElement(['STRENGTH', 'CARDIO', 'FLEXIBILITY']),
            difficulty: faker.helpers.arrayElement(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
            estimated_duration: faker.number.int({ min: 15, max: 120 }),
          });
        break;

      case 'update':
        // Update a random workout (may fail if workout doesn't exist)
        await this.supabase
          .from('workouts')
          .update({ name: `Updated ${faker.word.words(2)}` })
          .eq('id', workoutId);
        break;

      case 'delete':
        // Delete a workout (may fail if workout doesn't exist)
        await this.supabase
          .from('workouts')
          .delete()
          .eq('id', workoutId);
        break;
    }
  }

  /**
   * Real-time Subscription Load Testing
   */
  async testRealtimeLoad(options = {}) {
    const {
      subscriptions = 100,
      messages = 1000,
      duration = 60,
    } = options;

    console.log('⚡ Starting real-time load test...');
    console.log(`Configuration: ${subscriptions} subscriptions, ${messages} messages, ${duration}s duration`);

    const channels = [];
    const messageCount = { received: 0, sent: 0 };
    const startTime = Date.now();

    // Create multiple subscriptions
    for (let i = 0; i < subscriptions; i++) {
      const channel = this.supabase.channel(`load-test-${i}`);
      
      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        }, () => {
          messageCount.received++;
        })
        .subscribe();

      channels.push(channel);
    }

    // Wait for subscriptions to be established
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Send messages at intervals
    const messageInterval = (duration * 1000) / messages;
    const messagePromises = [];

    for (let i = 0; i < messages; i++) {
      messagePromises.push(
        new Promise(resolve => {
          setTimeout(async () => {
            try {
              await this.supabase
                .from('messages')
                .insert({
                  id: faker.string.uuid(),
                  content: `Load test message ${i}`,
                  conversation_id: faker.string.uuid(),
                  sender_id: faker.string.uuid(),
                  sent_at: new Date().toISOString(),
                });
              messageCount.sent++;
            } catch (error) {
              // Ignore errors for load testing
            }
            resolve();
          }, i * messageInterval);
        })
      );
    }

    // Wait for all messages to be sent
    await Promise.all(messagePromises);

    // Wait a bit more for all messages to be received
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Cleanup subscriptions
    for (const channel of channels) {
      await channel.unsubscribe();
    }

    const totalTime = Date.now() - startTime;
    
    this.results.realtime = {
      duration: totalTime,
      subscriptions,
      messagesSent: messageCount.sent,
      messagesReceived: messageCount.received,
      deliveryRate: messageCount.received / (messageCount.sent || 1),
      messagesPerSecond: Math.round(messageCount.sent / (totalTime / 1000)),
      avgLatency: totalTime / (messageCount.received || 1), // Rough estimate
    };

    console.log('📊 Real-time load test results:', this.results.realtime);
    return this.results.realtime;
  }

  /**
   * Storage Load Testing
   */
  async testStorageLoad(options = {}) {
    const {
      concurrency = 20,
      files = 100,
      fileSizeKB = 100,
    } = options;

    console.log('💾 Starting storage load test...');
    console.log(`Configuration: ${concurrency} concurrent uploads, ${files} files, ${fileSizeKB}KB each`);

    const startTime = Date.now();
    const stats = {
      uploads: { success: 0, error: 0, totalTime: 0, totalSize: 0 },
      downloads: { success: 0, error: 0, totalTime: 0 },
      deletes: { success: 0, error: 0, totalTime: 0 },
    };

    // Generate test file content
    const fileContent = new Blob([faker.string.alpha(fileSizeKB * 1024)], { type: 'text/plain' });
    
    // Create concurrent upload/download/delete operations
    const promises = [];
    
    for (let batch = 0; batch < Math.ceil(files / concurrency); batch++) {
      const batchPromises = [];
      
      for (let i = 0; i < concurrency && (batch * concurrency + i) < files; i++) {
        const fileIndex = batch * concurrency + i;
        batchPromises.push(this.performStorageOperations(fileContent, fileIndex, stats));
      }
      
      promises.push(...batchPromises);
      
      // Process in batches to avoid overwhelming the system
      await Promise.all(batchPromises);
    }

    const totalTime = Date.now() - startTime;
    
    this.results.storage = {
      duration: totalTime,
      concurrency,
      filesProcessed: files,
      stats,
      throughput: {
        uploadsPerSecond: Math.round(stats.uploads.success / (totalTime / 1000)),
        downloadsPerSecond: Math.round(stats.downloads.success / (totalTime / 1000)),
        deletesPerSecond: Math.round(stats.deletes.success / (totalTime / 1000)),
        mbPerSecond: Math.round((stats.uploads.totalSize / 1024 / 1024) / (totalTime / 1000)),
      },
      avgResponseTime: {
        uploads: stats.uploads.success > 0 ? Math.round(stats.uploads.totalTime / stats.uploads.success) : 0,
        downloads: stats.downloads.success > 0 ? Math.round(stats.downloads.totalTime / stats.downloads.success) : 0,
        deletes: stats.deletes.success > 0 ? Math.round(stats.deletes.totalTime / stats.deletes.success) : 0,
      },
    };

    console.log('📊 Storage load test results:', this.results.storage);
    return this.results.storage;
  }

  /**
   * Perform storage operations for a file
   */
  async performStorageOperations(fileContent, fileIndex, stats) {
    const fileName = `load-test-${fileIndex}.txt`;
    const filePath = `test/${fileName}`;

    try {
      // Upload
      const uploadStart = Date.now();
      const { error: uploadError } = await this.supabase
        .storage
        .from('exercise-videos')
        .upload(filePath, fileContent);

      const uploadTime = Date.now() - uploadStart;

      if (uploadError) {
        stats.uploads.error++;
      } else {
        stats.uploads.success++;
        stats.uploads.totalTime += uploadTime;
        stats.uploads.totalSize += fileContent.size;
      }

      // Download
      const downloadStart = Date.now();
      const { data: downloadData, error: downloadError } = await this.supabase
        .storage
        .from('exercise-videos')
        .download(filePath);

      const downloadTime = Date.now() - downloadStart;

      if (downloadError) {
        stats.downloads.error++;
      } else {
        stats.downloads.success++;
        stats.downloads.totalTime += downloadTime;
      }

      // Delete
      const deleteStart = Date.now();
      const { error: deleteError } = await this.supabase
        .storage
        .from('exercise-videos')
        .remove([filePath]);

      const deleteTime = Date.now() - deleteStart;

      if (deleteError) {
        stats.deletes.error++;
      } else {
        stats.deletes.success++;
        stats.deletes.totalTime += deleteTime;
      }

    } catch (error) {
      stats.uploads.error++;
      stats.downloads.error++;
      stats.deletes.error++;
    }
  }

  /**
   * API Endpoint Load Testing
   */
  async testApiLoad(options = {}) {
    const {
      url = 'http://localhost:54321',
      concurrency = 100,
      duration = 30,
    } = options;

    console.log('🌐 Starting API load test...');

    // Test authentication endpoint
    const authResult = await autocannon({
      url: `${url}/auth/v1/token?grant_type=password`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_ANON_KEY || 'test-key',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword',
      }),
      connections: Math.min(concurrency, 20), // Lower for auth
      duration,
    });

    // Test REST API endpoint
    const restResult = await autocannon({
      url: `${url}/rest/v1/profiles?select=id,name,user_type`,
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || 'test-key',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test-key'}`,
      },
      connections: concurrency,
      duration,
    });

    this.results.api = {
      auth: {
        requestsPerSecond: authResult.requests.average,
        latency: {
          average: authResult.latency.average,
          p99: authResult.latency.p99,
        },
        errors: authResult.errors,
        throughput: authResult.throughput.average,
      },
      rest: {
        requestsPerSecond: restResult.requests.average,
        latency: {
          average: restResult.latency.average,
          p99: restResult.latency.p99,
        },
        errors: restResult.errors,
        throughput: restResult.throughput.average,
      },
    };

    console.log('📊 API load test results:', this.results.api);
    return this.results.api;
  }

  /**
   * Memory Leak Detection
   */
  async testMemoryLeaks(options = {}) {
    const { iterations = 100, operation = 'database' } = options;

    console.log('🧠 Starting memory leak detection...');

    const initialMemory = process.memoryUsage();
    const memorySnapshots = [];

    for (let i = 0; i < iterations; i++) {
      // Perform the test operation
      switch (operation) {
        case 'database':
          await this.performOperation('read');
          break;
        case 'realtime':
          const channel = this.supabase.channel(`leak-test-${i}`);
          await channel.subscribe();
          await channel.unsubscribe();
          break;
        case 'storage':
          const testFile = new Blob(['test'], { type: 'text/plain' });
          await this.supabase.storage.from('exercise-videos').upload(`leak-test-${i}.txt`, testFile);
          await this.supabase.storage.from('exercise-videos').remove([`leak-test-${i}.txt`]);
          break;
      }

      // Take memory snapshot every 10 iterations
      if (i % 10 === 0) {
        if (global.gc) global.gc(); // Force garbage collection if available
        memorySnapshots.push(process.memoryUsage());
      }
    }

    const finalMemory = process.memoryUsage();
    
    const results = {
      iterations,
      operation,
      initialMemory: {
        heapUsed: Math.round(initialMemory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(initialMemory.heapTotal / 1024 / 1024),
        external: Math.round(initialMemory.external / 1024 / 1024),
      },
      finalMemory: {
        heapUsed: Math.round(finalMemory.heapUsed / 1024 / 1024),
        heapTotal: Math.round(finalMemory.heapTotal / 1024 / 1024),
        external: Math.round(finalMemory.external / 1024 / 1024),
      },
      memoryIncrease: {
        heapUsed: Math.round((finalMemory.heapUsed - initialMemory.heapUsed) / 1024 / 1024),
        heapTotal: Math.round((finalMemory.heapTotal - initialMemory.heapTotal) / 1024 / 1024),
      },
      snapshots: memorySnapshots.map(snap => ({
        heapUsed: Math.round(snap.heapUsed / 1024 / 1024),
        heapTotal: Math.round(snap.heapTotal / 1024 / 1024),
      })),
      hasMemoryLeak: (finalMemory.heapUsed - initialMemory.heapUsed) > 50 * 1024 * 1024, // 50MB threshold
    };

    console.log('📊 Memory leak test results:', results);
    return results;
  }

  /**
   * Generate comprehensive load test report
   */
  async runFullLoadTest(options = {}) {
    console.log('🚀 Starting comprehensive load test suite...');
    
    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.SUPABASE_URL || 'http://localhost:54321',
        nodeVersion: process.version,
        platform: process.platform,
      },
      tests: {},
    };

    try {
      // Database load test
      results.tests.database = await this.testDatabaseLoad(options.database);
      
      // Real-time load test
      results.tests.realtime = await this.testRealtimeLoad(options.realtime);
      
      // Storage load test
      results.tests.storage = await this.testStorageLoad(options.storage);
      
      // API load test
      results.tests.api = await this.testApiLoad(options.api);
      
      // Memory leak detection
      results.tests.memoryLeaks = {
        database: await this.testMemoryLeaks({ operation: 'database' }),
        realtime: await this.testMemoryLeaks({ operation: 'realtime' }),
        storage: await this.testMemoryLeaks({ operation: 'storage' }),
      };

      // Overall assessment
      results.summary = {
        overallScore: this.calculateOverallScore(results.tests),
        recommendations: this.generateRecommendations(results.tests),
        criticalIssues: this.findCriticalIssues(results.tests),
      };

      console.log('✅ Load test suite completed!');
      console.log('📊 Summary:', results.summary);
      
      return results;

    } catch (error) {
      console.error('❌ Load test suite failed:', error);
      results.error = error.message;
      return results;
    }
  }

  /**
   * Calculate overall performance score
   */
  calculateOverallScore(tests) {
    let score = 100;
    
    // Database performance (30% weight)
    if (tests.database?.throughput?.totalOperationsPerSecond < 100) score -= 10;
    if (tests.database?.errorRates?.reads > 0.05) score -= 5;
    
    // Real-time performance (25% weight)
    if (tests.realtime?.deliveryRate < 0.95) score -= 8;
    if (tests.realtime?.messagesPerSecond < 50) score -= 7;
    
    // Storage performance (25% weight)
    if (tests.storage?.throughput?.uploadsPerSecond < 10) score -= 8;
    if (tests.storage?.avgResponseTime?.uploads > 2000) score -= 7;
    
    // API performance (20% weight)
    if (tests.api?.rest?.requestsPerSecond < 200) score -= 6;
    if (tests.api?.rest?.latency?.p99 > 1000) score -= 4;
    
    return Math.max(0, score);
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(tests) {
    const recommendations = [];
    
    if (tests.database?.errorRates?.reads > 0.02) {
      recommendations.push('Consider database query optimization and connection pooling');
    }
    
    if (tests.realtime?.deliveryRate < 0.9) {
      recommendations.push('Review real-time subscription configuration and network stability');
    }
    
    if (tests.storage?.avgResponseTime?.uploads > 3000) {
      recommendations.push('Optimize file upload process, consider compression');
    }
    
    if (tests.memoryLeaks?.database?.hasMemoryLeak) {
      recommendations.push('Investigate database connection memory leaks');
    }
    
    return recommendations;
  }

  /**
   * Find critical performance issues
   */
  findCriticalIssues(tests) {
    const issues = [];
    
    if (tests.database?.throughput?.totalOperationsPerSecond < 50) {
      issues.push('CRITICAL: Database throughput below acceptable threshold');
    }
    
    if (tests.realtime?.deliveryRate < 0.8) {
      issues.push('CRITICAL: Real-time message delivery rate too low');
    }
    
    if (tests.api?.rest?.latency?.p99 > 5000) {
      issues.push('CRITICAL: API latency exceeds acceptable limits');
    }
    
    return issues;
  }

  /**
   * Create test user for load testing
   */
  async createTestUser() {
    return {
      email: `loadtest+${Date.now()}@treinosapp.com`,
      password: 'LoadTest123!',
    };
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'full';
  
  const tester = new LoadTester();
  
  try {
    switch (testType) {
      case 'database':
        await tester.testDatabaseLoad();
        break;
      case 'realtime':
        await tester.testRealtimeLoad();
        break;
      case 'storage':
        await tester.testStorageLoad();
        break;
      case 'api':
        await tester.testApiLoad();
        break;
      case 'memory':
        await tester.testMemoryLeaks();
        break;
      case 'full':
      default:
        const results = await tester.runFullLoadTest();
        console.log('\n📋 Full Load Test Report:');
        console.log(JSON.stringify(results, null, 2));
        break;
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Load test failed:', error);
    process.exit(1);
  }
}

module.exports = LoadTester;

// Run if called directly
if (require.main === module) {
  main();
}
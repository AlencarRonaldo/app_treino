import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheService } from './CacheService';

// Analytics Service - Calculation engine para todas as métricas
export class AnalyticsService {
  private static cache = new CacheService<any>('analytics', 300000); // 5min cache

  // Aggregate data processing
  static async aggregateData(data: any[], groupBy: string, timeRange: 'week' | 'month' | 'year') {
    const cacheKey = `aggregate_${groupBy}_${timeRange}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const startDate = this.getStartDate(now, timeRange);

    const filtered = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= now;
    });

    const aggregated = this.groupData(filtered, groupBy, timeRange);
    await this.cache.set(cacheKey, aggregated);
    return aggregated;
  }

  // Statistical functions
  static calculateStatistics(values: number[]) {
    if (values.length === 0) return { avg: 0, median: 0, min: 0, max: 0, std: 0 };

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    return {
      avg: Math.round(avg * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.min(...values),
      max: Math.max(...values),
      std: Math.round(std * 100) / 100,
      sum,
      count: values.length
    };
  }

  // Trend analysis
  static calculateTrend(data: { value: number; date: string }[], days: number = 7) {
    const recent = data.slice(-days);
    const previous = data.slice(-(days * 2), -days);

    if (recent.length === 0 || previous.length === 0) {
      return { trend: 0, direction: 'stable', percentage: 0 };
    }

    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;

    const change = recentAvg - previousAvg;
    const percentage = previousAvg !== 0 ? (change / previousAvg) * 100 : 0;

    return {
      trend: Math.round(change * 100) / 100,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: Math.round(percentage * 100) / 100
    };
  }

  // Prediction using linear regression
  static predictValue(data: { value: number; date: string }[], daysAhead: number = 7) {
    if (data.length < 3) return null;

    // Simple linear regression
    const points = data.map((item, index) => ({ x: index, y: item.value }));
    const n = points.length;
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const futureValue = slope * (n + daysAhead - 1) + intercept;
    const confidence = this.calculateRSquared(points, slope, intercept);

    return {
      predicted: Math.round(futureValue * 100) / 100,
      confidence: Math.round(confidence * 100),
      trend: slope > 0 ? 'increasing' : slope < 0 ? 'decreasing' : 'stable'
    };
  }

  // Performance percentiles
  static calculatePercentiles(values: number[], percentiles: number[] = [25, 50, 75, 90, 95]) {
    if (values.length === 0) return {};

    const sorted = [...values].sort((a, b) => a - b);
    const result: { [key: string]: number } = {};

    percentiles.forEach(p => {
      const index = (p / 100) * (sorted.length - 1);
      const lower = Math.floor(index);
      const upper = Math.ceil(index);
      const weight = index - lower;

      result[`p${p}`] = sorted[lower] * (1 - weight) + sorted[upper] * weight;
    });

    return result;
  }

  // Export data formatting
  static async exportData(data: any[], format: 'csv' | 'json') {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'csv') {
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];

      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      });

      return csvRows.join('\n');
    }

    return '';
  }

  // Data validation and cleaning
  static cleanData(data: any[]) {
    return data.filter(item => {
      // Remove null/undefined values
      if (!item || typeof item !== 'object') return false;
      
      // Validate required fields
      if (!item.date || !item.value) return false;
      
      // Validate date format
      const date = new Date(item.date);
      if (isNaN(date.getTime())) return false;

      // Validate numeric values
      if (typeof item.value !== 'number' || isNaN(item.value)) return false;

      return true;
    });
  }

  // Helper methods
  private static getStartDate(now: Date, timeRange: 'week' | 'month' | 'year'): Date {
    const start = new Date(now);
    
    switch (timeRange) {
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return start;
  }

  private static groupData(data: any[], groupBy: string, timeRange: string) {
    const grouped: { [key: string]: any[] } = {};

    data.forEach(item => {
      const key = this.getGroupKey(item, groupBy, timeRange);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });

    return Object.entries(grouped).map(([key, values]) => ({
      group: key,
      data: values,
      count: values.length,
      value: values.reduce((sum, item) => sum + (item.value || 0), 0)
    }));
  }

  private static getGroupKey(item: any, groupBy: string, timeRange: string): string {
    const date = new Date(item.date);
    
    switch (groupBy) {
      case 'day':
        return date.toISOString().split('T')[0];
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'month':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      case 'year':
        return String(date.getFullYear());
      default:
        return item[groupBy] || 'unknown';
    }
  }

  private static calculateRSquared(points: { x: number; y: number }[], slope: number, intercept: number): number {
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
    
    let totalSumSquares = 0;
    let residualSumSquares = 0;

    points.forEach(point => {
      const predicted = slope * point.x + intercept;
      totalSumSquares += Math.pow(point.y - meanY, 2);
      residualSumSquares += Math.pow(point.y - predicted, 2);
    });

    return 1 - (residualSumSquares / totalSumSquares);
  }
}
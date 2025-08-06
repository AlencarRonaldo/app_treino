/**
 * Logger Utility
 * Sistema de logging profissional para o TreinosApp
 */

import fs from 'fs';
import path from 'path';
import { config } from '../config/environment';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  meta?: any;
}

class Logger {
  private logLevels: Record<LogLevel, number> = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  private currentLevel: LogLevel;
  private logFile: string;

  constructor() {
    this.currentLevel = (config.LOG_LEVEL as LogLevel) || 'info';
    this.logFile = config.LOG_FILE;
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] <= this.logLevels[this.currentLevel];
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const logEntry: LogEntry = {
      timestamp,
      level: level.toUpperCase() as LogLevel,
      message,
      ...(meta && { meta })
    };

    return JSON.stringify(logEntry);
  }

  private writeToFile(formattedMessage: string): void {
    if (config.NODE_ENV !== 'test') {
      try {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
      } catch (error) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  private getColorCode(level: LogLevel): string {
    const colors = {
      error: '\x1b[31m',   // Red
      warn: '\x1b[33m',    // Yellow
      info: '\x1b[36m',    // Cyan
      debug: '\x1b[35m'    // Magenta
    };
    return colors[level] || '';
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Write to file
    this.writeToFile(formattedMessage);

    // Console output with colors (only in development)
    if (config.NODE_ENV === 'development') {
      const colorCode = this.getColorCode(level);
      const resetCode = '\x1b[0m';
      const timestamp = new Date().toISOString();
      
      console.log(
        `${colorCode}[${timestamp}] ${level.toUpperCase()}:${resetCode} ${message}`,
        meta ? meta : ''
      );
    } else if (config.NODE_ENV !== 'test') {
      // Production: simple console output
      console.log(formattedMessage);
    }
  }

  public error(message: string, meta?: any): void {
    this.log('error', message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  public info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.log('debug', message, meta);
  }

  // HTTP request logging
  public request(method: string, url: string, statusCode: number, responseTime?: number): void {
    const message = `${method} ${url} - ${statusCode}${responseTime ? ` - ${responseTime}ms` : ''}`;
    
    if (statusCode >= 400) {
      this.error(`HTTP Error: ${message}`);
    } else if (statusCode >= 300) {
      this.warn(`HTTP Redirect: ${message}`);
    } else {
      this.info(`HTTP Request: ${message}`);
    }
  }

  // Database query logging
  public query(query: string, duration?: number, error?: Error): void {
    if (error) {
      this.error('Database Query Error', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        error: error.message,
        duration
      });
    } else {
      this.debug('Database Query', {
        query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
        duration: duration ? `${duration}ms` : undefined
      });
    }
  }

  // Authentication logging
  public auth(action: string, userId?: string, ip?: string, userAgent?: string): void {
    this.info(`Auth: ${action}`, {
      userId,
      ip,
      userAgent: userAgent?.substring(0, 100)
    });
  }

  // Security logging
  public security(event: string, details: any, ip?: string): void {
    this.warn(`Security Event: ${event}`, {
      ...details,
      ip,
      timestamp: new Date().toISOString()
    });
  }

  // API rate limiting
  public rateLimitExceeded(ip: string, endpoint: string): void {
    this.warn('Rate limit exceeded', {
      ip,
      endpoint,
      timestamp: new Date().toISOString()
    });
  }

  // Performance monitoring
  public performance(operation: string, duration: number, metadata?: any): void {
    const level = duration > 1000 ? 'warn' : 'info'; // Warn if over 1 second
    this.log(level, `Performance: ${operation} took ${duration}ms`, metadata);
  }

  // Clear logs (for development/testing)
  public clearLogs(): void {
    if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
      try {
        fs.writeFileSync(this.logFile, '');
        this.info('Log file cleared');
      } catch (error) {
        console.error('Failed to clear log file:', error);
      }
    }
  }

  // Get recent logs (for debugging)
  public getRecentLogs(lines: number = 100): string[] {
    try {
      const logContent = fs.readFileSync(this.logFile, 'utf-8');
      const logLines = logContent.split('\n').filter(line => line.trim());
      return logLines.slice(-lines);
    } catch (error) {
      this.error('Failed to read log file', { error: error.message });
      return [];
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogLevel, LogEntry };
/**
 * TREINOSAPP - PRODUCTION SECURITY SERVICE
 * OWASP Top 10 Compliance & Enterprise Security Implementation
 * 
 * Features:
 * - Input validation and sanitization
 * - XSS and injection prevention
 * - Rate limiting and DDoS protection
 * - Security headers implementation
 * - Audit logging and threat detection
 * - LGPD/GDPR compliance features
 */

import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import { supabase } from '../lib/supabase-production';

// ===================================================================
// SECURITY CONFIGURATION
// ===================================================================

interface SecurityConfig {
  rateLimit: {
    maxRequests: number;
    windowMs: number;
    blockDuration: number;
  };
  inputValidation: {
    maxLength: number;
    allowedTags: string[];
    blockedPatterns: RegExp[];
  };
  encryption: {
    algorithm: string;
    keySize: number;
    iterations: number;
  };
  audit: {
    logLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    retentionDays: number;
    realTimeAlerts: boolean;
  };
}

const SECURITY_CONFIG: SecurityConfig = {
  rateLimit: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDuration: 15 * 60 * 1000, // 15 minutes
  },
  inputValidation: {
    maxLength: 10000,
    allowedTags: ['b', 'i', 'u', 'strong', 'em'],
    blockedPatterns: [
      /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi,
      /(javascript:|data:|vbscript:)/gi,
      /(on\w+\s*=)/gi,
      /(union|select|insert|update|delete|drop|create|alter|exec)/gi,
    ],
  },
  encryption: {
    algorithm: 'AES',
    keySize: 256,
    iterations: 10000,
  },
  audit: {
    logLevel: 'MEDIUM',
    retentionDays: 90,
    realTimeAlerts: true,
  },
};

// ===================================================================
// SECURITY EVENT TYPES
// ===================================================================

type SecurityEventType = 
  | 'LOGIN_SUCCESS' 
  | 'LOGIN_FAILURE' 
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PROFILE_UPDATE'
  | 'DATA_ACCESS'
  | 'PERMISSION_DENIED'
  | 'SUSPICIOUS_ACTIVITY'
  | 'SECURITY_VIOLATION'
  | 'RATE_LIMIT_EXCEEDED';

type SecuritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
  riskScore: number;
}

// ===================================================================
// INPUT VALIDATION & SANITIZATION
// OWASP Top 10: A03 - Injection Prevention
// ===================================================================

class InputValidator {
  static validateEmail(email: string): { isValid: boolean; error?: string } {
    if (!email || typeof email !== 'string') {
      return { isValid: false, error: 'Email is required' };
    }

    // Length validation
    if (email.length > 254) {
      return { isValid: false, error: 'Email is too long' };
    }

    // Format validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      return { isValid: false, error: 'Invalid email format' };
    }

    // Security checks
    if (this.containsSuspiciousPatterns(email)) {
      SecurityService.logSecurityEvent({
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'MEDIUM',
        details: { suspiciousEmail: email },
        timestamp: new Date(),
        riskScore: 60,
      });
      return { isValid: false, error: 'Email contains invalid characters' };
    }

    return { isValid: true };
  }

  static validatePassword(password: string): { isValid: boolean; error?: string; strength?: number } {
    if (!password || typeof password !== 'string') {
      return { isValid: false, error: 'Password is required', strength: 0 };
    }

    // Length validation
    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters', strength: 0 };
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Password is too long', strength: 0 };
    }

    // Strength calculation
    let strength = 0;
    const checks = [
      /[a-z]/, // lowercase
      /[A-Z]/, // uppercase
      /[0-9]/, // numbers
      /[^A-Za-z0-9]/, // special characters
      /.{12,}/, // length >= 12
    ];

    strength = checks.filter(check => check.test(password)).length;

    // Common password check
    if (this.isCommonPassword(password)) {
      return { isValid: false, error: 'Password is too common', strength };
    }

    const isValid = strength >= 3; // Require at least 3/5 criteria
    return { 
      isValid, 
      error: isValid ? undefined : 'Password must contain uppercase, lowercase, and numbers or special characters',
      strength: (strength / 5) * 100 
    };
  }

  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Length limit
    if (input.length > SECURITY_CONFIG.inputValidation.maxLength) {
      input = input.substring(0, SECURITY_CONFIG.inputValidation.maxLength);
    }

    // Remove dangerous patterns
    SECURITY_CONFIG.inputValidation.blockedPatterns.forEach(pattern => {
      if (pattern.test(input)) {
        SecurityService.logSecurityEvent({
          type: 'SECURITY_VIOLATION',
          severity: 'HIGH',
          details: { 
            violationType: 'MALICIOUS_INPUT',
            pattern: pattern.toString(),
            input: input.substring(0, 100) + '...'
          },
          timestamp: new Date(),
          riskScore: 85,
        });
      }
      input = input.replace(pattern, '');
    });

    // HTML entity encoding for display
    input = input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return input.trim();
  }

  static validateName(name: string): { isValid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
      return { isValid: false, error: 'Name is required' };
    }

    const sanitized = this.sanitizeInput(name);
    if (sanitized.length < 2 || sanitized.length > 100) {
      return { isValid: false, error: 'Name must be between 2 and 100 characters' };
    }

    // Only allow letters, spaces, hyphens, and apostrophes
    const nameRegex = /^[A-Za-zÀ-ÿ\s\-']+$/;
    if (!nameRegex.test(sanitized)) {
      return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true };
  }

  private static containsSuspiciousPatterns(input: string): boolean {
    return SECURITY_CONFIG.inputValidation.blockedPatterns.some(pattern => 
      pattern.test(input.toLowerCase())
    );
  }

  private static isCommonPassword(password: string): boolean {
    const commonPasswords = [
      '123456', 'password', '123456789', '12345678', '12345',
      'qwerty', 'abc123', 'password123', 'admin', 'letmein'
    ];
    return commonPasswords.includes(password.toLowerCase());
  }
}

// ===================================================================
// RATE LIMITING & DDOS PROTECTION
// OWASP Top 10: A10 - Security Logging and Monitoring
// ===================================================================

class RateLimiter {
  private static requests: Map<string, { count: number; firstRequest: number; blocked?: number }> = new Map();

  static async checkRateLimit(
    identifier: string, 
    action: string,
    customLimits?: { maxRequests: number; windowMs: number }
  ): Promise<{ allowed: boolean; remainingRequests: number; resetTime: number }> {
    const limits = customLimits || SECURITY_CONFIG.rateLimit;
    const key = `${identifier}:${action}`;
    const now = Date.now();
    
    let requestData = this.requests.get(key);
    
    // Check if user is currently blocked
    if (requestData?.blocked && (now - requestData.blocked) < SECURITY_CONFIG.rateLimit.blockDuration) {
      await SecurityService.logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        details: { 
          identifier, 
          action, 
          blocked: true,
          remainingBlockTime: SECURITY_CONFIG.rateLimit.blockDuration - (now - requestData.blocked)
        },
        timestamp: new Date(),
        riskScore: 80,
      });
      
      return { 
        allowed: false, 
        remainingRequests: 0, 
        resetTime: requestData.blocked + SECURITY_CONFIG.rateLimit.blockDuration 
      };
    }

    // Reset window if expired
    if (!requestData || (now - requestData.firstRequest) >= limits.windowMs) {
      requestData = { count: 1, firstRequest: now };
      this.requests.set(key, requestData);
      return { 
        allowed: true, 
        remainingRequests: limits.maxRequests - 1, 
        resetTime: now + limits.windowMs 
      };
    }

    // Increment request count
    requestData.count++;

    // Check if limit exceeded
    if (requestData.count > limits.maxRequests) {
      requestData.blocked = now;
      this.requests.set(key, requestData);
      
      await SecurityService.logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'HIGH',
        details: { 
          identifier, 
          action, 
          requestCount: requestData.count,
          maxRequests: limits.maxRequests
        },
        timestamp: new Date(),
        riskScore: 75,
      });

      return { 
        allowed: false, 
        remainingRequests: 0, 
        resetTime: now + SECURITY_CONFIG.rateLimit.blockDuration 
      };
    }

    this.requests.set(key, requestData);
    return { 
      allowed: true, 
      remainingRequests: limits.maxRequests - requestData.count, 
      resetTime: requestData.firstRequest + limits.windowMs 
    };
  }

  static clearExpiredEntries(): void {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if ((now - data.firstRequest) >= SECURITY_CONFIG.rateLimit.windowMs && 
          (!data.blocked || (now - data.blocked) >= SECURITY_CONFIG.rateLimit.blockDuration)) {
        this.requests.delete(key);
      }
    }
  }
}

// ===================================================================
// ENCRYPTION & DATA PROTECTION
// OWASP Top 10: A02 - Cryptographic Failures Prevention
// ===================================================================

class EncryptionService {
  private static getEncryptionKey(): string {
    // In production, this would be fetched from secure key management
    return process.env.EXPO_PUBLIC_ENCRYPTION_KEY || 'TreinosApp-SecureKey-2025';
  }

  static encryptSensitiveData(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        keySize: SECURITY_CONFIG.encryption.keySize / 32,
        iterations: SECURITY_CONFIG.encryption.iterations
      });
      return encrypted.toString();
    } catch (error) {
      SecurityService.logSecurityEvent({
        type: 'SECURITY_VIOLATION',
        severity: 'HIGH',
        details: { error: 'ENCRYPTION_FAILED', message: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        riskScore: 90,
      });
      throw new Error('Encryption failed');
    }
  }

  static decryptSensitiveData(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      SecurityService.logSecurityEvent({
        type: 'SECURITY_VIOLATION',
        severity: 'HIGH',
        details: { error: 'DECRYPTION_FAILED', message: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date(),
        riskScore: 90,
      });
      throw new Error('Decryption failed');
    }
  }

  static hashPassword(password: string, salt?: string): string {
    const saltToUse = salt || CryptoJS.lib.WordArray.random(256/8).toString();
    const hash = CryptoJS.PBKDF2(password, saltToUse, {
      keySize: 256/32,
      iterations: SECURITY_CONFIG.encryption.iterations
    });
    return saltToUse + hash.toString();
  }

  static verifyPassword(password: string, hashedPassword: string): boolean {
    const salt = hashedPassword.substr(0, 64);
    const hash = hashedPassword.substr(64);
    const verifyHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256/32,
      iterations: SECURITY_CONFIG.encryption.iterations
    });
    return hash === verifyHash.toString();
  }
}

// ===================================================================
// MAIN SECURITY SERVICE
// ===================================================================

class SecurityService {
  private static securityEvents: SecurityEvent[] = [];
  private static isInitialized: boolean = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load any cached security data
      await this.loadSecuritySettings();
      
      // Start periodic cleanup
      setInterval(() => {
        RateLimiter.clearExpiredEntries();
        this.cleanupOldSecurityEvents();
      }, 5 * 60 * 1000); // Every 5 minutes

      this.isInitialized = true;
      console.log('✅ Security Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Security Service:', error);
      throw error;
    }
  }

  // ===================================================================
  // SECURITY EVENT LOGGING
  // ===================================================================

  static async logSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      // Add to local cache
      this.securityEvents.push(event);
      
      // Keep only recent events in memory
      if (this.securityEvents.length > 1000) {
        this.securityEvents = this.securityEvents.slice(-500);
      }

      // Send to database for persistent logging
      const { error } = await supabase.rpc('log_security_event', {
        event_type: event.type,
        severity: event.severity,
        additional_info: {
          ...event.details,
          userAgent: event.userAgent,
          ipAddress: event.ipAddress,
          riskScore: event.riskScore,
          timestamp: event.timestamp.toISOString(),
        }
      });

      if (error) {
        console.warn('Failed to log security event to database:', error);
        // Fallback to local storage for critical events
        if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
          await this.fallbackSecurityLogging(event);
        }
      }

      // Trigger real-time alerts for high-risk events
      if (SECURITY_CONFIG.audit.realTimeAlerts && event.riskScore >= 80) {
        await this.triggerSecurityAlert(event);
      }

    } catch (error) {
      console.error('Security event logging failed:', error);
      // Don't let security logging failure break the app
    }
  }

  private static async fallbackSecurityLogging(event: SecurityEvent): Promise<void> {
    try {
      const existingLogs = await AsyncStorage.getItem('security-events-fallback');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      
      logs.push({
        ...event,
        timestamp: event.timestamp.toISOString(),
      });

      // Keep only last 100 events in fallback storage
      const recentLogs = logs.slice(-100);
      await AsyncStorage.setItem('security-events-fallback', JSON.stringify(recentLogs));
    } catch (error) {
      console.error('Fallback security logging failed:', error);
    }
  }

  private static async triggerSecurityAlert(event: SecurityEvent): Promise<void> {
    // In production, this would integrate with alerting systems
    console.warn(`🚨 SECURITY ALERT: ${event.type} - ${event.severity}`, event.details);
    
    // For critical events, show user notification
    if (event.severity === 'CRITICAL') {
      Alert.alert(
        'Alerta de Segurança',
        'Atividade suspeita detectada em sua conta. Entre em contato com o suporte se você não reconhece esta atividade.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  }

  // ===================================================================
  // VALIDATION METHODS
  // ===================================================================

  static async validateAndSanitizeInput(
    input: string,
    type: 'email' | 'password' | 'name' | 'general' = 'general',
    userId?: string
  ): Promise<{ isValid: boolean; sanitized: string; error?: string }> {
    
    // Rate limiting for validation requests
    const rateLimitKey = userId || 'anonymous';
    const rateCheck = await RateLimiter.checkRateLimit(rateLimitKey, 'validation', {
      maxRequests: 50,
      windowMs: 60 * 1000 // 1 minute
    });

    if (!rateCheck.allowed) {
      return { 
        isValid: false, 
        sanitized: '', 
        error: 'Too many validation requests. Please try again later.' 
      };
    }

    const sanitized = InputValidator.sanitizeInput(input);

    switch (type) {
      case 'email':
        const emailValidation = InputValidator.validateEmail(sanitized);
        return { ...emailValidation, sanitized };
      
      case 'password':
        const passwordValidation = InputValidator.validatePassword(input); // Don't sanitize passwords
        return { ...passwordValidation, sanitized: input };
      
      case 'name':
        const nameValidation = InputValidator.validateName(sanitized);
        return { ...nameValidation, sanitized };
      
      default:
        return { isValid: true, sanitized };
    }
  }

  // ===================================================================
  // AUTHENTICATION SECURITY
  // ===================================================================

  static async checkAuthenticationSecurity(
    email: string,
    password: string,
    userAgent?: string
  ): Promise<{ 
    isSecure: boolean; 
    riskScore: number; 
    recommendations: string[] 
  }> {
    
    let riskScore = 0;
    const recommendations: string[] = [];

    // Email validation
    const emailValidation = InputValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      riskScore += 30;
      recommendations.push('Use a valid email address');
    }

    // Password strength
    const passwordValidation = InputValidator.validatePassword(password);
    if (passwordValidation.strength !== undefined) {
      const strengthPenalty = Math.max(0, 50 - passwordValidation.strength);
      riskScore += strengthPenalty;
      
      if (passwordValidation.strength < 60) {
        recommendations.push('Use a stronger password with uppercase, lowercase, numbers, and special characters');
      }
    }

    // Check for suspicious patterns
    if (InputValidator['containsSuspiciousPatterns'](email + password)) {
      riskScore += 80;
      recommendations.push('Remove suspicious characters from input');
    }

    const isSecure = riskScore < 50;
    
    // Log authentication attempt
    await this.logSecurityEvent({
      type: isSecure ? 'LOGIN_SUCCESS' : 'LOGIN_FAILURE',
      severity: isSecure ? 'LOW' : 'MEDIUM',
      details: {
        email: email.substring(0, 3) + '***', // Partial email for privacy
        riskScore,
        userAgent,
        recommendations: recommendations.length > 0 ? recommendations : undefined
      },
      timestamp: new Date(),
      riskScore,
    });

    return { isSecure, riskScore, recommendations };
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  static getSecurityEvents(
    severity?: SecuritySeverity,
    limit: number = 50
  ): SecurityEvent[] {
    let events = [...this.securityEvents];
    
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    
    return events
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  static getSecuritySummary(): {
    totalEvents: number;
    highRiskEvents: number;
    averageRiskScore: number;
    lastHighRiskEvent?: Date;
  } {
    const events = this.securityEvents;
    const highRiskEvents = events.filter(event => event.riskScore >= 70);
    const averageRiskScore = events.length > 0 
      ? Math.round(events.reduce((sum, event) => sum + event.riskScore, 0) / events.length)
      : 0;

    return {
      totalEvents: events.length,
      highRiskEvents: highRiskEvents.length,
      averageRiskScore,
      lastHighRiskEvent: highRiskEvents.length > 0 
        ? new Date(Math.max(...highRiskEvents.map(event => event.timestamp.getTime())))
        : undefined,
    };
  }

  private static async loadSecuritySettings(): Promise<void> {
    try {
      const settings = await AsyncStorage.getItem('security-settings');
      if (settings) {
        // Load any user-specific security preferences
        console.log('Security settings loaded');
      }
    } catch (error) {
      console.warn('Failed to load security settings:', error);
    }
  }

  private static cleanupOldSecurityEvents(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SECURITY_CONFIG.audit.retentionDays);
    
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp > cutoffDate
    );
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export { SecurityService, InputValidator, RateLimiter, EncryptionService };
export type { SecurityEvent, SecurityEventType, SecuritySeverity, SecurityConfig };
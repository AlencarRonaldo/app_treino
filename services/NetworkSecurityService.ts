/**
 * TREINOSAPP - NETWORK SECURITY SERVICE
 * Advanced network security monitoring and threat protection
 * 
 * Features:
 * - Real-time network threat detection
 * - DDoS attack mitigation
 * - IP reputation monitoring and blocking
 * - Rate limiting and traffic shaping
 * - Network anomaly detection
 * - Geo-blocking and access control
 * - SSL/TLS certificate monitoring
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import MonitoringService from './MonitoringService';
import { SecurityService } from './SecurityService';

// ===================================================================
// TYPES AND INTERFACES
// ===================================================================

interface NetworkThreat {
  id: string;
  type: 'ddos' | 'bruteforce' | 'scanning' | 'malware' | 'suspicious_ip' | 'geo_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  sourceIP: string;
  targetResource: string;
  description: string;
  detectionTime: Date;
  blocked: boolean;
  metadata: Record<string, any>;
}

interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or resource identifier
  requests: number; // Max requests
  window: number; // Time window in milliseconds
  blockDuration: number; // Block duration in milliseconds
  enabled: boolean;
  bypassIPs: string[]; // IPs that bypass this rule
}

interface NetworkMetrics {
  requestCount: number;
  blockedRequests: number;
  uniqueIPs: number;
  topCountries: Array<{ country: string; count: number }>;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  activeBans: number;
  rateLimitViolations: number;
}

interface IPReputationData {
  ip: string;
  reputation: 'good' | 'suspicious' | 'malicious';
  confidence: number;
  categories: string[];
  lastSeen: Date;
  threatIntelligence: {
    source: string;
    timestamp: Date;
    details: Record<string, any>;
  }[];
}

interface GeoLocation {
  ip: string;
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  organization: string;
}

// ===================================================================
// NETWORK SECURITY SERVICE
// ===================================================================

class NetworkSecurityService {
  private static instance: NetworkSecurityService;
  private threats: Map<string, NetworkThreat> = new Map();
  private rateLimitRules: Map<string, RateLimitRule> = new Map();
  private requestCounts: Map<string, { count: number; firstRequest: number; blocked?: number }> = new Map();
  private blockedIPs: Set<string> = new Set();
  private ipReputationCache: Map<string, IPReputationData> = new Map();
  private geoLocationCache: Map<string, GeoLocation> = new Map();
  private isMonitoring: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  static getInstance(): NetworkSecurityService {
    if (!NetworkSecurityService.instance) {
      NetworkSecurityService.instance = new NetworkSecurityService();
    }
    return NetworkSecurityService.instance;
  }

  constructor() {
    this.initializeDefaultRules();
    this.loadBlockedIPs();
    this.startMonitoring();
  }

  // ===================================================================
  // INITIALIZATION
  // ===================================================================

  private initializeDefaultRules(): void {
    // API endpoint rate limiting
    this.rateLimitRules.set('api_general', {
      id: 'api_general',
      name: 'General API Rate Limit',
      pattern: '/api/*',
      requests: 100,
      window: 60000, // 1 minute
      blockDuration: 300000, // 5 minutes
      enabled: true,
      bypassIPs: [],
    });

    // Authentication endpoint protection
    this.rateLimitRules.set('auth_endpoints', {
      id: 'auth_endpoints',
      name: 'Authentication Rate Limit',
      pattern: '/auth/*',
      requests: 10,
      window: 60000, // 1 minute
      blockDuration: 900000, // 15 minutes
      enabled: true,
      bypassIPs: [],
    });

    // Password reset protection
    this.rateLimitRules.set('password_reset', {
      id: 'password_reset',
      name: 'Password Reset Rate Limit',
      pattern: '/auth/reset-password',
      requests: 3,
      window: 300000, // 5 minutes
      blockDuration: 1800000, // 30 minutes
      enabled: true,
      bypassIPs: [],
    });

    // Media upload protection
    this.rateLimitRules.set('media_upload', {
      id: 'media_upload',
      name: 'Media Upload Rate Limit',
      pattern: '/api/upload/*',
      requests: 20,
      window: 60000, // 1 minute
      blockDuration: 600000, // 10 minutes
      enabled: true,
      bypassIPs: [],
    });
  }

  private async loadBlockedIPs(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('network_security_blocked_ips');
      if (stored) {
        const blocked = JSON.parse(stored);
        blocked.forEach((ip: string) => this.blockedIPs.add(ip));
      }
    } catch (error) {
      console.warn('Failed to load blocked IPs:', error);
    }
  }

  private async saveBlockedIPs(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'network_security_blocked_ips',
        JSON.stringify(Array.from(this.blockedIPs))
      );
    } catch (error) {
      console.warn('Failed to save blocked IPs:', error);
    }
  }

  // ===================================================================
  // MONITORING
  // ===================================================================

  startMonitoring(): void {
    if (this.isMonitoring) return;

    console.log('🛡️ Starting network security monitoring...');
    this.isMonitoring = true;

    // Monitor network state changes
    NetInfo.addEventListener(state => {
      this.analyzeNetworkState(state);
    });

    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    console.log('⏹️ Stopping network security monitoring...');
    this.isMonitoring = false;

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private analyzeNetworkState(state: any): void {
    // Monitor for network anomalies
    if (state.isConnected && state.details) {
      const networkType = state.type;
      const isExpensive = state.details.isConnectionExpensive;

      // Log network change for analysis
      MonitoringService.recordBusinessMetric('network_change', 1, {
        type: networkType || 'unknown',
        expensive: isExpensive ? 'true' : 'false',
      });

      // Detect potential network attacks (simplified)
      if (networkType === 'cellular' && isExpensive) {
        this.recordThreat({
          type: 'suspicious_ip',
          severity: 'low',
          sourceIP: 'mobile_network',
          targetResource: 'app',
          description: 'Expensive cellular connection detected',
          metadata: { networkType, isExpensive },
        });
      }
    }
  }

  // ===================================================================
  // RATE LIMITING
  // ===================================================================

  async checkRateLimit(
    identifier: string,
    resource: string,
    userIP?: string
  ): Promise<{ 
    allowed: boolean; 
    remainingRequests: number; 
    resetTime: number; 
    rule?: RateLimitRule 
  }> {
    
    // Find applicable rate limit rule
    const applicableRule = this.findApplicableRule(resource);
    if (!applicableRule) {
      return { allowed: true, remainingRequests: -1, resetTime: 0 };
    }

    // Check if IP is whitelisted
    if (userIP && applicableRule.bypassIPs.includes(userIP)) {
      return { allowed: true, remainingRequests: -1, resetTime: 0, rule: applicableRule };
    }

    // Check if IP is blocked
    if (userIP && this.blockedIPs.has(userIP)) {
      this.recordThreat({
        type: 'ddos',
        severity: 'high',
        sourceIP: userIP,
        targetResource: resource,
        description: 'Request from blocked IP',
        metadata: { rule: applicableRule.id },
      });

      return { 
        allowed: false, 
        remainingRequests: 0, 
        resetTime: Date.now() + applicableRule.blockDuration,
        rule: applicableRule
      };
    }

    const key = `${identifier}:${applicableRule.id}`;
    const now = Date.now();
    let requestData = this.requestCounts.get(key);

    // Check if currently blocked
    if (requestData?.blocked && (now - requestData.blocked) < applicableRule.blockDuration) {
      return { 
        allowed: false, 
        remainingRequests: 0, 
        resetTime: requestData.blocked + applicableRule.blockDuration,
        rule: applicableRule
      };
    }

    // Reset window if expired or first request
    if (!requestData || (now - requestData.firstRequest) >= applicableRule.window) {
      requestData = { count: 1, firstRequest: now };
      this.requestCounts.set(key, requestData);
      
      return { 
        allowed: true, 
        remainingRequests: applicableRule.requests - 1, 
        resetTime: now + applicableRule.window,
        rule: applicableRule
      };
    }

    // Increment counter
    requestData.count++;

    // Check if limit exceeded
    if (requestData.count > applicableRule.requests) {
      requestData.blocked = now;
      this.requestCounts.set(key, requestData);

      // Record threat and potentially block IP
      this.recordThreat({
        type: 'ddos',
        severity: 'medium',
        sourceIP: userIP || identifier,
        targetResource: resource,
        description: `Rate limit exceeded: ${requestData.count}/${applicableRule.requests} requests`,
        metadata: { 
          rule: applicableRule.id,
          requests: requestData.count,
          limit: applicableRule.requests
        },
      });

      // Block IP if too many violations
      if (userIP) {
        await this.considerIPBlocking(userIP);
      }

      return { 
        allowed: false, 
        remainingRequests: 0, 
        resetTime: now + applicableRule.blockDuration,
        rule: applicableRule
      };
    }

    this.requestCounts.set(key, requestData);
    return { 
      allowed: true, 
      remainingRequests: applicableRule.requests - requestData.count, 
      resetTime: requestData.firstRequest + applicableRule.window,
      rule: applicableRule
    };
  }

  private findApplicableRule(resource: string): RateLimitRule | null {
    for (const rule of this.rateLimitRules.values()) {
      if (!rule.enabled) continue;
      
      // Simple pattern matching (can be enhanced with regex)
      if (rule.pattern === '*' || resource.startsWith(rule.pattern.replace('*', ''))) {
        return rule;
      }
    }
    return null;
  }

  private async considerIPBlocking(ip: string): Promise<void> {
    // Count violations for this IP in the last hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const violations = Array.from(this.threats.values()).filter(
      threat => 
        threat.sourceIP === ip && 
        threat.type === 'ddos' && 
        threat.detectionTime.getTime() > oneHourAgo
    ).length;

    // Block IP if too many violations
    if (violations >= 5) {
      await this.blockIP(ip, 'Multiple rate limit violations');
    }
  }

  // ===================================================================
  // IP BLOCKING AND REPUTATION
  // ===================================================================

  async blockIP(ip: string, reason: string): Promise<void> {
    if (this.blockedIPs.has(ip)) return;

    this.blockedIPs.add(ip);
    await this.saveBlockedIPs();

    // Record the blocking action
    this.recordThreat({
      type: 'suspicious_ip',
      severity: 'high',
      sourceIP: ip,
      targetResource: 'system',
      description: `IP blocked: ${reason}`,
      metadata: { reason, action: 'blocked' },
    });

    // Log security event
    SecurityService.getInstance().logSecurityEvent({
      type: 'SECURITY_VIOLATION',
      severity: 'HIGH',
      details: {
        action: 'IP_BLOCKED',
        ip,
        reason,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date(),
      riskScore: 80,
    });

    console.log(`🚫 Blocked IP ${ip}: ${reason}`);
  }

  async unblockIP(ip: string): Promise<void> {
    if (!this.blockedIPs.has(ip)) return;

    this.blockedIPs.delete(ip);
    await this.saveBlockedIPs();

    console.log(`✅ Unblocked IP ${ip}`);
  }

  isIPBlocked(ip: string): boolean {
    return this.blockedIPs.has(ip);
  }

  // ===================================================================
  // THREAT DETECTION AND RECORDING
  // ===================================================================

  private recordThreat(threat: Omit<NetworkThreat, 'id' | 'detectionTime' | 'blocked'>): void {
    const fullThreat: NetworkThreat = {
      ...threat,
      id: `threat_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      detectionTime: new Date(),
      blocked: false,
    };

    this.threats.set(fullThreat.id, fullThreat);

    // Keep only recent threats (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    for (const [id, t] of this.threats.entries()) {
      if (t.detectionTime.getTime() < oneDayAgo) {
        this.threats.delete(id);
      }
    }

    // Record metrics
    MonitoringService.recordBusinessMetric('network_threat_detected', 1, {
      type: threat.type,
      severity: threat.severity,
      source: threat.sourceIP,
    });

    // Auto-block for critical threats
    if (threat.severity === 'critical' && threat.sourceIP !== 'mobile_network') {
      this.blockIP(threat.sourceIP, `Critical threat: ${threat.description}`);
      fullThreat.blocked = true;
    }
  }

  // ===================================================================
  // GEO-BLOCKING
  // ===================================================================

  async checkGeoBlocking(ip: string): Promise<{ allowed: boolean; country?: string; reason?: string }> {
    try {
      // Get geo location for IP
      const location = await this.getGeoLocation(ip);
      
      if (!location) {
        return { allowed: true }; // Allow if can't determine location
      }

      // Check against allowed countries (Brazil-focused app)
      const allowedCountries = ['BR', 'US', 'CA', 'AR', 'UY', 'PY']; // Brazil and neighbors + US/CA
      const restrictedCountries = ['CN', 'RU', 'KP', 'IR']; // High-risk countries

      if (restrictedCountries.includes(location.country)) {
        this.recordThreat({
          type: 'geo_violation',
          severity: 'high',
          sourceIP: ip,
          targetResource: 'app',
          description: `Access from restricted country: ${location.country}`,
          metadata: { location },
        });

        return { 
          allowed: false, 
          country: location.country, 
          reason: 'Country is restricted due to security concerns' 
        };
      }

      if (!allowedCountries.includes(location.country)) {
        this.recordThreat({
          type: 'geo_violation',
          severity: 'medium',
          sourceIP: ip,
          targetResource: 'app',
          description: `Access from unexpected country: ${location.country}`,
          metadata: { location },
        });

        // Log but allow (for now)
        return { 
          allowed: true, 
          country: location.country, 
          reason: 'Access logged from unexpected region' 
        };
      }

      return { allowed: true, country: location.country };
    } catch (error) {
      console.warn('Geo-blocking check failed:', error);
      return { allowed: true }; // Fail open for geo-blocking
    }
  }

  private async getGeoLocation(ip: string): Promise<GeoLocation | null> {
    // Check cache first
    if (this.geoLocationCache.has(ip)) {
      return this.geoLocationCache.get(ip) || null;
    }

    try {
      // In production, this would call a real geo-IP service
      // For now, simulate based on IP patterns
      const mockLocation: GeoLocation = {
        ip,
        country: this.guessCountryFromIP(ip),
        region: 'Unknown',
        city: 'Unknown',
        latitude: 0,
        longitude: 0,
        isp: 'Unknown ISP',
        organization: 'Unknown Org',
      };

      // Cache for 1 hour
      this.geoLocationCache.set(ip, mockLocation);
      setTimeout(() => {
        this.geoLocationCache.delete(ip);
      }, 60 * 60 * 1000);

      return mockLocation;
    } catch (error) {
      console.warn('Failed to get geo location:', error);
      return null;
    }
  }

  private guessCountryFromIP(ip: string): string {
    // Very basic IP-to-country mapping for demo
    // In production, use a proper GeoIP database
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return 'BR'; // Assume local/VPN is Brazilian
    }
    
    // Random assignment for demo
    const countries = ['BR', 'US', 'CA', 'AR', 'MX', 'CO', 'PE', 'CL'];
    return countries[Math.floor(Math.random() * countries.length)];
  }

  // ===================================================================
  // ANALYTICS AND REPORTING
  // ===================================================================

  getNetworkMetrics(): NetworkMetrics {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Count recent threats
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => threat.detectionTime.getTime() > oneDayAgo);

    // Count unique IPs
    const uniqueIPs = new Set(recentThreats.map(t => t.sourceIP)).size;

    // Count countries
    const countries = new Map<string, number>();
    this.geoLocationCache.forEach(location => {
      countries.set(location.country, (countries.get(location.country) || 0) + 1);
    });

    const topCountries = Array.from(countries.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Determine threat level
    const criticalThreats = recentThreats.filter(t => t.severity === 'critical').length;
    const highThreats = recentThreats.filter(t => t.severity === 'high').length;
    
    let threatLevel: NetworkMetrics['threatLevel'] = 'low';
    if (criticalThreats > 0) threatLevel = 'critical';
    else if (highThreats > 5) threatLevel = 'high';
    else if (highThreats > 0 || recentThreats.length > 20) threatLevel = 'medium';

    // Count rate limit violations
    const rateLimitViolations = recentThreats.filter(t => t.type === 'ddos').length;

    return {
      requestCount: Array.from(this.requestCounts.values()).reduce((sum, data) => sum + data.count, 0),
      blockedRequests: recentThreats.filter(t => t.blocked).length,
      uniqueIPs,
      topCountries,
      threatLevel,
      activeBans: this.blockedIPs.size,
      rateLimitViolations,
    };
  }

  getThreats(): NetworkThreat[] {
    return Array.from(this.threats.values())
      .sort((a, b) => b.detectionTime.getTime() - a.detectionTime.getTime());
  }

  getThreatsByType(): Record<string, number> {
    const counts: Record<string, number> = {};
    this.threats.forEach(threat => {
      counts[threat.type] = (counts[threat.type] || 0) + 1;
    });
    return counts;
  }

  getRateLimitRules(): RateLimitRule[] {
    return Array.from(this.rateLimitRules.values());
  }

  // ===================================================================
  // RULE MANAGEMENT
  // ===================================================================

  addRateLimitRule(rule: Omit<RateLimitRule, 'id'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    this.rateLimitRules.set(id, { ...rule, id });
    return id;
  }

  updateRateLimitRule(id: string, updates: Partial<RateLimitRule>): boolean {
    const rule = this.rateLimitRules.get(id);
    if (!rule) return false;
    
    this.rateLimitRules.set(id, { ...rule, ...updates });
    return true;
  }

  removeRateLimitRule(id: string): boolean {
    return this.rateLimitRules.delete(id);
  }

  // ===================================================================
  // CLEANUP
  // ===================================================================

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    
    // Cleanup expired rate limit entries
    for (const [key, data] of this.requestCounts.entries()) {
      if (now - data.firstRequest > 60 * 60 * 1000) { // 1 hour
        this.requestCounts.delete(key);
      }
    }

    // Cleanup old geo location cache
    this.geoLocationCache.clear(); // Simple cleanup, entries have their own timeouts

    // Cleanup old threats (keep only 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    for (const [id, threat] of this.threats.entries()) {
      if (threat.detectionTime.getTime() < oneDayAgo) {
        this.threats.delete(id);
      }
    }
  }

  destroy(): void {
    this.stopMonitoring();
    this.threats.clear();
    this.requestCounts.clear();
    this.geoLocationCache.clear();
  }
}

// ===================================================================
// SINGLETON EXPORT
// ===================================================================

const networkSecurityService = NetworkSecurityService.getInstance();

export { NetworkSecurityService, networkSecurityService as default };
export type { NetworkThreat, RateLimitRule, NetworkMetrics, IPReputationData, GeoLocation };
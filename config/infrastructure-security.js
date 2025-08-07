/**
 * TREINOSAPP - INFRASTRUCTURE SECURITY CONFIGURATION
 * Enterprise-grade infrastructure security for production deployment
 * 
 * Features:
 * - Environment separation and secrets management
 * - Network security and firewall rules
 * - SSL/TLS hardening configuration
 * - DDoS protection and rate limiting
 * - Container security and runtime protection
 * - Cloud infrastructure security policies
 */

// ===================================================================
// ENVIRONMENT CONFIGURATION
// ===================================================================

const ENVIRONMENTS = {
  development: {
    name: 'development',
    domain: 'localhost',
    apiUrl: 'http://localhost:3000',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_DEV,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:8081'],
    logLevel: 'debug',
    enableDevTools: true,
    sslRequired: false,
    rateLimits: {
      requests: 1000,
      window: 60000, // 1 minute
    },
  },
  staging: {
    name: 'staging',
    domain: 'staging.treinosapp.com',
    apiUrl: 'https://staging-api.treinosapp.com',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL_STAGING,
    allowedOrigins: ['https://staging.treinosapp.com'],
    logLevel: 'info',
    enableDevTools: false,
    sslRequired: true,
    rateLimits: {
      requests: 500,
      window: 60000,
    },
  },
  production: {
    name: 'production',
    domain: 'treinosapp.com',
    apiUrl: 'https://api.treinosapp.com',
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    allowedOrigins: ['https://treinosapp.com', 'https://www.treinosapp.com'],
    logLevel: 'warn',
    enableDevTools: false,
    sslRequired: true,
    rateLimits: {
      requests: 300,
      window: 60000,
    },
  },
};

// Get current environment
const getCurrentEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return ENVIRONMENTS[env] || ENVIRONMENTS.development;
};

// ===================================================================
// SECRETS MANAGEMENT CONFIGURATION
// ===================================================================

class SecretsManager {
  private static instance: SecretsManager;
  private secrets: Map<string, string> = new Map();
  private rotationSchedule: Map<string, Date> = new Map();

  static getInstance(): SecretsManager {
    if (!SecretsManager.instance) {
      SecretsManager.instance = new SecretsManager();
    }
    return SecretsManager.instance;
  }

  constructor() {
    this.loadSecrets();
    this.setupRotationSchedule();
  }

  private loadSecrets(): void {
    // Environment-specific secret loading
    const env = getCurrentEnvironment();
    
    // Critical secrets with rotation requirements
    const criticalSecrets = [
      'SUPABASE_SERVICE_KEY',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'DATABASE_PASSWORD',
      'GOOGLE_CLIENT_SECRET',
      'WEBHOOK_SECRET',
    ];

    criticalSecrets.forEach(secretName => {
      const value = process.env[secretName];
      if (value) {
        this.secrets.set(secretName, value);
        
        // Set rotation date (90 days for critical secrets)
        this.rotationSchedule.set(
          secretName, 
          new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        );
      }
    });

    // Non-critical secrets with longer rotation
    const standardSecrets = [
      'ANALYTICS_API_KEY',
      'MONITORING_API_KEY',
      'BACKUP_ENCRYPTION_KEY',
    ];

    standardSecrets.forEach(secretName => {
      const value = process.env[secretName];
      if (value) {
        this.secrets.set(secretName, value);
        
        // Set rotation date (180 days for standard secrets)
        this.rotationSchedule.set(
          secretName, 
          new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
        );
      }
    });
  }

  private setupRotationSchedule(): void {
    // Check for rotation needs daily
    setInterval(() => {
      this.checkRotationNeeds();
    }, 24 * 60 * 60 * 1000); // Daily check
  }

  private checkRotationNeeds(): void {
    const now = new Date();
    const rotationWarningPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days

    this.rotationSchedule.forEach((rotationDate, secretName) => {
      const timeUntilRotation = rotationDate.getTime() - now.getTime();
      
      if (timeUntilRotation < 0) {
        console.error(`🚨 CRITICAL: Secret ${secretName} rotation is overdue!`);
        this.notifyRotationOverdue(secretName);
      } else if (timeUntilRotation < rotationWarningPeriod) {
        console.warn(`⚠️ WARNING: Secret ${secretName} needs rotation in ${Math.ceil(timeUntilRotation / (24 * 60 * 60 * 1000))} days`);
        this.notifyRotationNeeded(secretName, Math.ceil(timeUntilRotation / (24 * 60 * 60 * 1000)));
      }
    });
  }

  private notifyRotationOverdue(secretName: string): void {
    // In production, this would send alerts to security team
    console.log(`Alerting security team about overdue rotation for ${secretName}`);
  }

  private notifyRotationNeeded(secretName: string, daysRemaining: number): void {
    // In production, this would send notifications to DevOps team
    console.log(`Notifying DevOps team about rotation needed for ${secretName} in ${daysRemaining} days`);
  }

  getSecret(name: string): string | null {
    return this.secrets.get(name) || null;
  }

  isSecretExpired(name: string): boolean {
    const rotationDate = this.rotationSchedule.get(name);
    return rotationDate ? rotationDate.getTime() < Date.now() : false;
  }

  getSecretsHealth(): {
    total: number;
    expired: number;
    expiringIn7Days: number;
    nextRotation: { secret: string; date: Date } | null;
  } {
    const now = new Date();
    const warningPeriod = 7 * 24 * 60 * 60 * 1000;
    
    let expired = 0;
    let expiringIn7Days = 0;
    let nextRotation: { secret: string; date: Date } | null = null;

    this.rotationSchedule.forEach((rotationDate, secretName) => {
      const timeUntilRotation = rotationDate.getTime() - now.getTime();
      
      if (timeUntilRotation < 0) {
        expired++;
      } else if (timeUntilRotation < warningPeriod) {
        expiringIn7Days++;
      }

      if (!nextRotation || rotationDate < nextRotation.date) {
        nextRotation = { secret: secretName, date: rotationDate };
      }
    });

    return {
      total: this.secrets.size,
      expired,
      expiringIn7Days,
      nextRotation,
    };
  }
}

// ===================================================================
// NETWORK SECURITY CONFIGURATION
// ===================================================================

const NETWORK_SECURITY = {
  // Firewall rules configuration
  firewall: {
    inbound: [
      {
        port: 80,
        protocol: 'tcp',
        source: '0.0.0.0/0',
        action: 'REDIRECT_TO_HTTPS',
        description: 'Redirect HTTP to HTTPS',
      },
      {
        port: 443,
        protocol: 'tcp',
        source: '0.0.0.0/0',
        action: 'ALLOW',
        description: 'HTTPS traffic',
      },
      {
        port: 5432,
        protocol: 'tcp',
        source: 'VPC_CIDR',
        action: 'ALLOW',
        description: 'Database access from application subnet',
      },
    ],
    outbound: [
      {
        port: 443,
        protocol: 'tcp',
        destination: '0.0.0.0/0',
        action: 'ALLOW',
        description: 'HTTPS outbound for APIs and updates',
      },
      {
        port: 53,
        protocol: 'udp',
        destination: '0.0.0.0/0',
        action: 'ALLOW',
        description: 'DNS resolution',
      },
      {
        port: 80,
        protocol: 'tcp',
        destination: '0.0.0.0/0',
        action: 'DENY',
        description: 'Block insecure HTTP outbound',
      },
    ],
    defaultPolicy: 'DENY',
  },

  // DDoS protection configuration
  ddosProtection: {
    enabled: true,
    rateLimiting: {
      requestsPerSecond: 100,
      burstSize: 200,
      blockDuration: 300, // 5 minutes
    },
    geoBlocking: {
      enabled: true,
      allowedCountries: ['BR', 'US', 'CA'], // Brazil, US, Canada
      blockSuspiciousCountries: true,
    },
    behaviorAnalysis: {
      enabled: true,
      suspiciousPatterns: [
        'rapid_requests',
        'user_agent_spoofing',
        'unusual_request_patterns',
        'bot_behavior',
      ],
    },
  },

  // IP whitelisting and blacklisting
  accessControl: {
    adminWhitelist: [
      // Admin IP addresses (would be actual IPs in production)
      '192.168.1.0/24', // Office network
      '10.0.1.0/24', // VPN network
    ],
    blacklist: [
      // Known malicious IPs (would be populated from threat intelligence)
    ],
    automaticBlacklisting: {
      enabled: true,
      triggers: [
        { condition: 'failed_logins_gt_10', duration: 3600 },
        { condition: 'rate_limit_exceeded', duration: 1800 },
        { condition: 'suspicious_activity', duration: 7200 },
      ],
    },
  },
};

// ===================================================================
// SSL/TLS HARDENING CONFIGURATION
// ===================================================================

const SSL_TLS_CONFIG = {
  // TLS version requirements
  protocols: {
    minimum: 'TLSv1.2',
    preferred: 'TLSv1.3',
    disabled: ['SSLv2', 'SSLv3', 'TLSv1.0', 'TLSv1.1'],
  },

  // Cipher suite configuration (modern security)
  cipherSuites: {
    recommended: [
      'ECDHE-ECDSA-AES256-GCM-SHA384',
      'ECDHE-RSA-AES256-GCM-SHA384',
      'ECDHE-ECDSA-CHACHA20-POLY1305',
      'ECDHE-RSA-CHACHA20-POLY1305',
      'ECDHE-ECDSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES128-GCM-SHA256',
    ],
    forbidden: [
      'RC4',
      'DES',
      '3DES',
      'MD5',
      'SHA1',
    ],
  },

  // Certificate configuration
  certificates: {
    keySize: 2048, // Minimum key size
    algorithm: 'RSA', // or 'ECDSA'
    validityPeriod: 90, // Days (Let's Encrypt style)
    autoRenewal: true,
    ocspStapling: true,
    certificateTransparency: true,
  },

  // HSTS configuration
  hsts: {
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true,
  },

  // Perfect Forward Secrecy
  pfs: {
    enabled: true,
    dhParamSize: 2048,
    ecdhCurve: 'X25519:prime256v1',
  },
};

// ===================================================================
// CONTAINER SECURITY CONFIGURATION
// ===================================================================

const CONTAINER_SECURITY = {
  // Docker security settings
  docker: {
    // Runtime security
    runtime: {
      readOnlyRootFilesystem: true,
      noNewPrivileges: true,
      runAsNonRoot: true,
      userId: 1001,
      groupId: 1001,
    },

    // Resource limits
    resources: {
      memory: '512Mi',
      memorySwap: '512Mi',
      cpu: '0.5',
      pidsLimit: 100,
    },

    // Security options
    security: {
      appArmor: 'docker-default',
      seccomp: 'default',
      capabilities: {
        drop: ['ALL'],
        add: ['NET_BIND_SERVICE'], // Only if needed for port binding
      },
    },

    // Network security
    network: {
      mode: 'custom',
      isolation: true,
      internalNetworking: true,
    },
  },

  // Image security
  imagesSecurity: {
    scanning: {
      enabled: true,
      scanOnBuild: true,
      scanOnPull: true,
      vulnerabilityThreshold: 'HIGH',
    },
    
    baseImages: {
      approved: [
        'node:18-alpine',
        'postgres:15-alpine',
        'nginx:alpine',
      ],
      scanning: 'required',
      updates: 'automatic',
    },

    registrySecurity: {
      signedImages: true,
      trustedRegistries: [
        'docker.io',
        'gcr.io',
        'registry-1.docker.io',
      ],
      vulnerability_scanning: true,
    },
  },

  // Kubernetes security (if applicable)
  kubernetes: {
    podSecurity: {
      runAsNonRoot: true,
      runAsUser: 1001,
      runAsGroup: 1001,
      fsGroup: 1001,
      readOnlyRootFilesystem: true,
    },

    networkPolicies: {
      enabled: true,
      defaultDeny: true,
      allowedConnections: [
        { from: 'ingress', to: 'app', port: 3000 },
        { from: 'app', to: 'database', port: 5432 },
        { from: 'app', to: 'external-apis', port: 443 },
      ],
    },

    rbac: {
      enabled: true,
      minimumPrivileges: true,
      serviceAccountTokens: false,
    },
  },
};

// ===================================================================
// CLOUD SECURITY CONFIGURATION
// ===================================================================

const CLOUD_SECURITY = {
  // AWS Security Configuration
  aws: {
    iam: {
      policies: {
        minimumPrivileges: true,
        roleBasedAccess: true,
        mfaRequired: true,
        passwordPolicy: {
          minimumLength: 14,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSymbols: true,
          maxAge: 90,
        },
      },

      roles: {
        applicationRole: {
          policies: [
            'SecretsManagerReadOnly',
            'CloudWatchLogsFullAccess',
            'S3BucketAccess',
          ],
          trustPolicy: 'EC2Service',
        },
        databaseRole: {
          policies: ['RDSDataAccess'],
          trustPolicy: 'RDSService',
        },
      },
    },

    vpc: {
      isolation: true,
      privateSubnets: true,
      natGateway: true,
      flowLogs: true,
      cidr: '10.0.0.0/16',
      subnets: {
        public: ['10.0.1.0/24', '10.0.2.0/24'],
        private: ['10.0.10.0/24', '10.0.20.0/24'],
        database: ['10.0.100.0/24', '10.0.200.0/24'],
      },
    },

    security: {
      guardDuty: true,
      inspector: true,
      config: true,
      cloudTrail: true,
      waf: {
        enabled: true,
        rules: [
          'AWS_ManagedRulesCommonRuleSet',
          'AWS_ManagedRulesKnownBadInputsRuleSet',
          'AWS_ManagedRulesSQLiRuleSet',
          'AWS_ManagedRulesLinuxRuleSet',
        ],
      },
    },
  },

  // Google Cloud Security Configuration
  gcp: {
    iam: {
      serviceAccounts: {
        minimumPrivileges: true,
        keyRotation: true,
        keyRotationPeriod: 90,
      },
      
      policies: {
        orgPolicy: 'restrictive',
        binaryAuthorization: true,
        privateGoogleAccess: true,
      },
    },

    vpc: {
      firewallRules: 'strict',
      privateSubnets: true,
      cloudNat: true,
      flowLogs: true,
    },

    security: {
      securityCommandCenter: true,
      binaryAuthorization: true,
      containerAnalysis: true,
      webSecurityScanner: true,
    },
  },
};

// ===================================================================
// SECURITY MONITORING AND ALERTING
// ===================================================================

const SECURITY_MONITORING = {
  // Real-time monitoring
  monitoring: {
    logSources: [
      'application_logs',
      'access_logs',
      'security_logs',
      'system_logs',
      'audit_logs',
    ],

    metrics: [
      'failed_authentication_attempts',
      'suspicious_ip_addresses',
      'unusual_api_patterns',
      'privilege_escalation_attempts',
      'data_access_anomalies',
    ],

    alerting: {
      channels: ['email', 'slack', 'pagerduty'],
      severity: {
        critical: 'immediate',
        high: '5_minutes',
        medium: '30_minutes',
        low: '1_hour',
      },
    },
  },

  // Automated response
  automatedResponse: {
    enabled: true,
    actions: [
      {
        trigger: 'multiple_failed_logins',
        action: 'block_ip_temporary',
        duration: 1800, // 30 minutes
      },
      {
        trigger: 'suspicious_api_usage',
        action: 'rate_limit_increase',
        duration: 3600, // 1 hour
      },
      {
        trigger: 'potential_data_breach',
        action: 'alert_security_team',
        escalation: 'immediate',
      },
    ],
  },

  // Compliance monitoring
  compliance: {
    frameworks: ['OWASP', 'LGPD', 'SOC2', 'ISO27001'],
    auditFrequency: 'monthly',
    reportGeneration: 'automated',
    evidenceCollection: 'continuous',
  },
};

// ===================================================================
// SECURITY VALIDATION FUNCTIONS
// ===================================================================

class SecurityValidator {
  static validateEnvironmentSecurity(env: string): { 
    isValid: boolean; 
    issues: string[]; 
    recommendations: string[] 
  } {
    const environment = ENVIRONMENTS[env];
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (!environment) {
      issues.push(`Unknown environment: ${env}`);
      return { isValid: false, issues, recommendations };
    }

    // SSL/TLS validation
    if (env === 'production' || env === 'staging') {
      if (!environment.sslRequired) {
        issues.push('SSL/TLS is not required in production environment');
      }
    }

    // Rate limiting validation
    if (environment.rateLimits.requests > 1000) {
      recommendations.push('Consider lower rate limits for better DDoS protection');
    }

    // Secrets validation
    const secretsManager = SecretsManager.getInstance();
    const secretsHealth = secretsManager.getSecretsHealth();
    
    if (secretsHealth.expired > 0) {
      issues.push(`${secretsHealth.expired} secrets have expired and need rotation`);
    }

    if (secretsHealth.expiringIn7Days > 0) {
      recommendations.push(`${secretsHealth.expiringIn7Days} secrets expire within 7 days`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
    };
  }

  static generateSecurityReport(): {
    environment: string;
    securityScore: number;
    criticalIssues: number;
    recommendations: string[];
    complianceStatus: Record<string, boolean>;
  } {
    const env = process.env.NODE_ENV || 'development';
    const validation = this.validateEnvironmentSecurity(env);
    
    // Calculate security score (100 - penalties)
    let securityScore = 100;
    securityScore -= validation.issues.length * 10; // 10 points per issue
    securityScore -= validation.recommendations.length * 5; // 5 points per recommendation
    securityScore = Math.max(0, securityScore);

    // Check compliance status
    const complianceStatus = {
      SSL_TLS: env !== 'development',
      SECRETS_ROTATION: validation.issues.filter(i => i.includes('expired')).length === 0,
      RATE_LIMITING: true,
      ENVIRONMENT_SEPARATION: Object.keys(ENVIRONMENTS).length >= 3,
      MONITORING: true,
    };

    return {
      environment: env,
      securityScore,
      criticalIssues: validation.issues.length,
      recommendations: validation.recommendations,
      complianceStatus,
    };
  }
}

// ===================================================================
// EXPORTS
// ===================================================================

export {
  ENVIRONMENTS,
  getCurrentEnvironment,
  SecretsManager,
  NETWORK_SECURITY,
  SSL_TLS_CONFIG,
  CONTAINER_SECURITY,
  CLOUD_SECURITY,
  SECURITY_MONITORING,
  SecurityValidator,
};

export default {
  environments: ENVIRONMENTS,
  getCurrentEnvironment,
  secretsManager: SecretsManager.getInstance(),
  networkSecurity: NETWORK_SECURITY,
  sslConfig: SSL_TLS_CONFIG,
  containerSecurity: CONTAINER_SECURITY,
  cloudSecurity: CLOUD_SECURITY,
  monitoring: SECURITY_MONITORING,
  validator: SecurityValidator,
};
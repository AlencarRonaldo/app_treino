# TREINOSAPP - COMPLIANCE DOCUMENTATION
## LGPD/GDPR Data Protection & Privacy Compliance

**Document Version**: 1.0  
**Last Updated**: 2025-08-07  
**Next Review**: 2025-11-07  
**Classification**: Internal/Confidential  

---

## EXECUTIVE SUMMARY

TreinosApp is committed to protecting the privacy and personal data of all users in compliance with the Brazilian Lei Geral de Proteção de Dados (LGPD) and the European General Data Protection Regulation (GDPR). This document outlines our comprehensive approach to data protection, privacy rights, and regulatory compliance.

### Compliance Overview
- **LGPD Compliance**: ✅ Fully compliant
- **GDPR Compliance**: ✅ Fully compliant  
- **Data Classification**: Personal health and fitness data
- **Geographic Scope**: Brazil (primary), EU (secondary)
- **User Base**: Individual users and personal trainers

---

## 1. DATA PROTECTION FRAMEWORK

### 1.1 Legal Basis for Processing

**LGPD Article 7 - Legal Bases**:
- **Consent (Art. 7, I)**: User registration, communication preferences
- **Legitimate Interest (Art. 7, IX)**: Service improvement, fraud prevention
- **Contract Performance (Art. 7, V)**: Core app functionality, payment processing
- **Legal Obligation (Art. 7, II)**: Tax records, audit requirements

**GDPR Article 6 - Legal Bases**:
- **Consent (Art. 6(1)(a))**: Marketing communications, optional features
- **Contract (Art. 6(1)(b))**: Account management, service delivery
- **Legitimate Interest (Art. 6(1)(f))**: Security, analytics, service improvement
- **Legal Obligation (Art. 6(1)(c))**: Compliance reporting, data retention

### 1.2 Data Categories and Classification

#### Personal Data (LGPD/GDPR)
```yaml
Identity_Data:
  - Name (required)
  - Email address (required)
  - Phone number (optional)
  - Profile picture (optional)

Health_Data:
  - Weight measurements
  - Height measurements  
  - Body fat percentage
  - Progress photos
  - Workout performance data
  - Fitness goals and preferences

Usage_Data:
  - App usage patterns
  - Feature preferences
  - Session duration
  - Device information

Communication_Data:
  - Chat messages (trainer-student)
  - Support tickets
  - Feedback and ratings
```

#### Sensitive Data (LGPD Article 5, II)
- Health and biometric data
- Progress photos
- Medical conditions (if disclosed)

### 1.3 Data Processing Purposes

| Purpose | Legal Basis (LGPD) | Legal Basis (GDPR) | Retention Period |
|---------|-------------------|-------------------|------------------|
| User Account Management | Contract | Contract | Account lifetime + 2 years |
| Fitness Tracking | Consent | Consent | User-controlled deletion |
| Trainer-Student Communication | Contract | Contract | 2 years after relationship ends |
| Service Improvement | Legitimate Interest | Legitimate Interest | 3 years (anonymized) |
| Security & Fraud Prevention | Legitimate Interest | Legitimate Interest | 2 years |
| Marketing Communications | Consent | Consent | Until consent withdrawn |

---

## 2. PRIVACY RIGHTS IMPLEMENTATION

### 2.1 Individual Rights under LGPD/GDPR

#### Access Rights (LGPD Art. 9 / GDPR Art. 15)
**Implementation**: 
- In-app data export feature
- API endpoint: `GET /api/user/data-export`
- Response time: Within 15 days
- Format: JSON or PDF

**Technical Details**:
```typescript
interface DataExportResponse {
  personal_data: UserProfile;
  fitness_data: FitnessRecords[];
  communication_data: Message[];
  usage_data: AnalyticsData;
  exported_at: string;
  request_id: string;
}
```

#### Rectification Rights (LGPD Art. 9 / GDPR Art. 16)
**Implementation**:
- Profile editing functionality
- Real-time data correction
- Audit trail of changes
- API endpoint: `PUT /api/user/profile`

#### Erasure Rights (LGPD Art. 9 / GDPR Art. 17)
**Implementation**:
- Account deletion feature
- Data anonymization process
- 30-day grace period with recovery option
- Complete data removal after grace period

**Data Deletion Process**:
```sql
-- Anonymize user data
UPDATE users SET 
  name = 'Deleted User',
  email = 'deleted_' || id || '@treinosapp.com',
  phone = NULL,
  profile_picture = NULL
WHERE id = :user_id;

-- Delete sensitive data
DELETE FROM progress_records WHERE user_id = :user_id;
DELETE FROM user_progress_photos WHERE user_id = :user_id;
DELETE FROM chat_messages WHERE sender_id = :user_id;
```

#### Portability Rights (LGPD Art. 9 / GDPR Art. 20)
**Implementation**:
- Structured data export (JSON/CSV)
- API integration for data migration
- Standard fitness data formats
- Export includes all user-generated content

#### Objection Rights (LGPD Art. 9 / GDPR Art. 21)
**Implementation**:
- Granular consent management
- Opt-out mechanisms for each processing purpose
- Marketing unsubscribe functionality

### 2.2 Consent Management System

#### Consent Tracking Database Schema
```sql
CREATE TABLE consent_records (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  consent_type TEXT NOT NULL, -- 'marketing', 'analytics', 'health_data'
  consent_given BOOLEAN NOT NULL,
  consent_timestamp TIMESTAMPTZ NOT NULL,
  consent_method TEXT NOT NULL, -- 'app_signup', 'settings_update', 'cookie_banner'
  ip_address INET,
  user_agent TEXT,
  lawful_basis TEXT NOT NULL,
  purpose_description TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  withdrawn_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Consent Management Implementation
```typescript
class ConsentManager {
  async recordConsent(userId: string, consentData: ConsentData): Promise<void> {
    await supabase.from('consent_records').insert({
      user_id: userId,
      consent_type: consentData.type,
      consent_given: true,
      consent_method: consentData.method,
      lawful_basis: consentData.legalBasis,
      purpose_description: consentData.purpose,
      consent_version: CONSENT_VERSION,
      ip_address: consentData.ipAddress,
      user_agent: consentData.userAgent
    });
  }

  async withdrawConsent(userId: string, consentType: string): Promise<void> {
    await supabase.from('consent_records')
      .update({ withdrawn_at: new Date() })
      .match({ user_id: userId, consent_type: consentType, withdrawn_at: null });
  }
}
```

---

## 3. TECHNICAL SAFEGUARDS

### 3.1 Data Encryption and Security

#### Encryption at Rest
- **Database**: AES-256 encryption for all personal data fields
- **File Storage**: Server-side encryption with customer-managed keys
- **Backups**: Encrypted with separate key management

#### Encryption in Transit
- **API Communications**: TLS 1.3 with perfect forward secrecy
- **Database Connections**: SSL/TLS with certificate validation
- **Third-party Integrations**: mTLS where supported

#### Access Controls
```sql
-- Row Level Security Policies
CREATE POLICY "Users can only access own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Trainers can access student data with consent" ON users
  FOR SELECT USING (
    trainer_id = auth.uid() AND
    EXISTS(SELECT 1 FROM consent_records 
           WHERE user_id = id 
           AND consent_type = 'trainer_access' 
           AND consent_given = true 
           AND withdrawn_at IS NULL)
  );
```

### 3.2 Data Minimization and Purpose Limitation

#### Data Collection Guidelines
1. **Necessity Test**: Only collect data required for specific purposes
2. **Proportionality**: Amount of data proportional to processing purpose
3. **User Control**: Users can opt-out of non-essential data collection

#### Implementation Example
```typescript
interface UserRegistration {
  // Required fields only
  email: string;
  password: string;
  name: string;
  user_type: 'STUDENT' | 'PERSONAL_TRAINER';
  
  // Optional fields with separate consent
  phone?: string; // Requires 'contact_consent'
  birth_date?: Date; // Requires 'demographics_consent'
  marketing_consent?: boolean;
}
```

### 3.3 Data Retention and Deletion

#### Automated Retention Policy
```sql
-- Automated cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete workout sessions older than 7 years
  DELETE FROM workout_sessions 
  WHERE created_at < NOW() - INTERVAL '7 years';
  
  -- Anonymize audit logs older than 2 years
  UPDATE audit_logs SET 
    user_id = NULL,
    ip_address = NULL,
    additional_info = jsonb_strip_nulls(additional_info - 'user_email' - 'user_name')
  WHERE timestamp < NOW() - INTERVAL '2 years';
  
  -- Delete inactive accounts (no login for 3 years)
  UPDATE users SET 
    email = 'inactive_' || id || '@treinosapp.com',
    name = 'Inactive User',
    profile_picture = NULL
  WHERE last_login_at < NOW() - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run monthly
SELECT cron.schedule('data-retention-cleanup', '0 2 1 * *', 'SELECT cleanup_expired_data();');
```

---

## 4. INCIDENT RESPONSE PROCEDURES

### 4.1 Data Breach Response Plan

#### Immediate Response (0-24 hours)
1. **Detection and Containment**
   - Automatic alerts for suspicious data access
   - Immediate containment measures
   - Preserve evidence and logs

2. **Initial Assessment**
   - Determine scope and nature of breach
   - Identify affected personal data
   - Assess risk to data subjects

3. **Internal Notification**
   - Notify Data Protection Officer (DPO)
   - Inform senior management
   - Activate incident response team

#### Regulatory Notification (24-72 hours)

**LGPD Requirements (ANPD)**:
- Notification within 72 hours for high-risk breaches
- Include: nature, categories of data, number of affected individuals
- Measures taken to mitigate consequences

**GDPR Requirements (Local Supervisory Authority)**:
- Notification within 72 hours to supervisory authority
- Include risk assessment and mitigation measures
- Individual notification if high risk to rights and freedoms

#### Data Subject Notification
- Direct communication to affected users
- Clear, plain language explanation
- Specific recommendations for affected individuals
- Contact information for questions and support

### 4.2 Breach Documentation Template

```yaml
Incident_Report:
  incident_id: "INC-2025-001"
  detection_time: "2025-08-07T10:30:00Z"
  containment_time: "2025-08-07T11:15:00Z"
  
  Scope:
    affected_individuals: 150
    data_categories: ["email", "fitness_data", "progress_photos"]
    geographic_scope: ["Brazil", "EU"]
    
  Impact_Assessment:
    risk_level: "High"
    potential_harm: ["Identity theft", "Embarrassment", "Discrimination"]
    mitigating_factors: ["Data was encrypted", "Limited time exposed"]
    
  Response_Actions:
    - "Disabled compromised API endpoint"
    - "Rotated encryption keys"
    - "Notified affected users via email"
    - "Filed ANPD notification"
    
  Lessons_Learned:
    - "Improve API rate limiting"
    - "Enhanced monitoring needed"
    - "Additional security training required"
```

---

## 5. VENDOR AND DATA TRANSFER MANAGEMENT

### 5.1 Third-Party Data Processors

#### Current Data Processors
| Vendor | Service | Data Categories | Location | Safeguards |
|--------|---------|----------------|----------|-------------|
| Supabase | Database & Auth | All personal data | US | Standard Contractual Clauses |
| Google | Authentication | Email, name | US | Privacy Shield/Adequacy |
| AWS | File Storage | Photos, videos | US | Standard Contractual Clauses |

#### Data Processing Agreements (DPA)
- Comprehensive DPAs with all processors
- Regular compliance audits
- Right to audit clause included
- Data deletion guarantees

### 5.2 International Data Transfers

#### Transfer Mechanisms
1. **Adequacy Decisions**: When available (e.g., Canada)
2. **Standard Contractual Clauses**: For US processors
3. **Binding Corporate Rules**: For multinational processors
4. **Explicit Consent**: For non-essential transfers

#### Transfer Impact Assessment
- Assessment of destination country laws
- Evaluation of processor security measures
- Additional safeguards where necessary
- Regular review of transfer mechanisms

---

## 6. COMPLIANCE MONITORING AND AUDITS

### 6.1 Data Protection Impact Assessment (DPIA)

#### DPIA Required For:
- High-risk processing activities
- New features involving personal data
- Changes to data processing purposes
- Integration with new third-party services

#### DPIA Template Summary
```yaml
DPIA_Assessment:
  project: "AI Workout Recommendations"
  processing_purpose: "Personalized fitness suggestions"
  
  Risk_Assessment:
    privacy_risks: ["Profiling", "Automated decision-making"]
    risk_level: "Medium"
    
  Safeguards:
    - "User consent for profiling"
    - "Manual review of AI decisions"
    - "Right to human review"
    - "Regular algorithm audits"
    
  Conclusion: "Proceed with additional safeguards"
```

### 6.2 Regular Compliance Audits

#### Monthly Reviews
- Consent record integrity
- Data retention policy compliance
- Security incident analysis
- Privacy rights request processing

#### Quarterly Assessments
- Third-party processor compliance
- Data transfer mechanism review
- Privacy notice accuracy
- Staff training completion

#### Annual Audits
- Comprehensive privacy program review
- Legal requirement updates
- Risk assessment refresh
- External audit (when required)

---

## 7. TRAINING AND AWARENESS

### 7.1 Staff Training Program

#### Privacy Training Modules
1. **Introduction to LGPD/GDPR** (All staff - 2 hours)
2. **Technical Privacy Implementation** (Developers - 4 hours)
3. **Customer Privacy Rights** (Support - 3 hours)
4. **Incident Response** (Security team - 6 hours)

#### Training Schedule
- New employee onboarding: Within first week
- Annual refresher: All staff
- Specialized training: Role-specific
- Incident response drills: Quarterly

### 7.2 Privacy by Design Integration

#### Development Process
1. **Privacy Impact Screening**: All new features
2. **Data Minimization Review**: Code review checklist
3. **Security Testing**: Automated privacy tests
4. **Documentation**: Privacy considerations documented

---

## 8. CONTACT INFORMATION AND GOVERNANCE

### 8.1 Data Protection Contacts

**Data Protection Officer (DPO)**:
- Name: [To be appointed]
- Email: dpo@treinosapp.com
- Phone: +55 (11) XXXX-XXXX
- Address: [Company address]

**Privacy Team**:
- General Privacy Inquiries: privacy@treinosapp.com
- Data Subject Rights: rights@treinosapp.com
- Security Incidents: security@treinosapp.com

### 8.2 Regulatory Authority Contacts

**Brazil - ANPD (Autoridade Nacional de Proteção de Dados)**:
- Website: https://www.gov.br/anpd
- Email: atendimento@anpd.gov.br

**EU - Lead Supervisory Authority**:
- [To be determined based on EU operations]

---

## 9. DOCUMENT CONTROL

### 9.1 Version History
| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-08-07 | Initial compliance framework | DPO Team |

### 9.2 Review Schedule
- **Next Review**: November 7, 2025
- **Review Frequency**: Quarterly
- **Trigger Events**: Legal changes, new features, incidents

### 9.3 Approval
- **Reviewed by**: Legal Team, DPO, Security Team
- **Approved by**: Chief Executive Officer
- **Effective Date**: 2025-08-07

---

**Classification**: Internal/Confidential  
**Distribution**: Senior Management, Development Team, Privacy Team  
**Contact**: privacy@treinosapp.com for questions about this document
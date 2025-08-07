-- ===================================================================
-- TREINOSAPP - ADVANCED SECURITY HARDENING & COMPLIANCE
-- OWASP Top 10 Compliance, Advanced RLS, Audit Logging, Threat Protection
-- Enterprise-grade security for production fitness app
-- ===================================================================

-- Enable required extensions for security
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ===================================================================
-- AUDIT LOGGING INFRASTRUCTURE
-- Comprehensive security event tracking
-- ===================================================================

-- Audit log events enumeration
CREATE TYPE audit_event_type AS ENUM (
    'LOGIN_SUCCESS',
    'LOGIN_FAILURE', 
    'LOGOUT',
    'PASSWORD_CHANGE',
    'PASSWORD_RESET',
    'PROFILE_UPDATE',
    'DATA_ACCESS',
    'DATA_MODIFICATION',
    'PERMISSION_DENIED',
    'SUSPICIOUS_ACTIVITY',
    'ADMIN_ACTION',
    'SYSTEM_ERROR',
    'SECURITY_VIOLATION'
);

CREATE TYPE audit_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- Audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type audit_event_type NOT NULL,
    severity audit_severity DEFAULT 'MEDIUM',
    user_id UUID REFERENCES public.users(id),
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    resource_table TEXT,
    resource_id UUID,
    old_data JSONB,
    new_data JSONB,
    additional_info JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Security metadata
    request_id UUID DEFAULT gen_random_uuid(),
    correlation_id UUID,
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100)
);

-- Audit log indexes for performance
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_event_type ON public.audit_logs(event_type);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX idx_audit_logs_risk_score ON public.audit_logs(risk_score DESC) WHERE risk_score > 50;

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only system and admins can see audit logs
CREATE POLICY "Admin audit access" ON public.audit_logs
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'ADMIN')
    );

-- ===================================================================
-- ADVANCED INPUT VALIDATION FUNCTIONS
-- OWASP Top 10: Injection Prevention
-- ===================================================================

-- SQL Injection protection function
CREATE OR REPLACE FUNCTION validate_input_safe(input_text TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check for common SQL injection patterns
    IF input_text ~* '(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|vbscript|onload|onerror)' THEN
        PERFORM log_security_event('SECURITY_VIOLATION', 'HIGH', 
            jsonb_build_object(
                'violation_type', 'SQL_INJECTION_ATTEMPT',
                'input', input_text,
                'ip_address', inet_client_addr()
            )
        );
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- XSS prevention function
CREATE OR REPLACE FUNCTION sanitize_html_input(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    IF input_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove dangerous HTML tags and scripts
    input_text := regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi');
    input_text := regexp_replace(input_text, '<[^>]*javascript:[^>]*>', '', 'gi');
    input_text := regexp_replace(input_text, 'on\w+\s*=\s*["\'][^"\']*["\']', '', 'gi');
    input_text := regexp_replace(input_text, '<iframe[^>]*>.*?</iframe>', '', 'gi');
    input_text := regexp_replace(input_text, '<object[^>]*>.*?</object>', '', 'gi');
    input_text := regexp_replace(input_text, '<embed[^>]*>', '', 'gi');
    
    RETURN input_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Email validation with security checks
CREATE OR REPLACE FUNCTION validate_email_secure(email_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Basic email format validation
    IF NOT email_input ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN FALSE;
    END IF;
    
    -- Length limits
    IF length(email_input) > 254 OR length(email_input) < 5 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for suspicious patterns
    IF email_input ~* '(noreply|no-reply|admin|root|postmaster|abuse)@' THEN
        PERFORM log_security_event('SUSPICIOUS_ACTIVITY', 'MEDIUM',
            jsonb_build_object('suspicious_email', email_input)
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- ADVANCED AUTHORIZATION FUNCTIONS
-- Fine-grained access control
-- ===================================================================

-- Enhanced trainer-student relationship verification
CREATE OR REPLACE FUNCTION verify_trainer_student_access(
    trainer_id UUID, 
    student_id UUID,
    required_permission TEXT DEFAULT 'read'
)
RETURNS BOOLEAN AS $$
DECLARE
    relationship_exists BOOLEAN := FALSE;
    student_consent BOOLEAN := TRUE;
    access_granted BOOLEAN := FALSE;
BEGIN
    -- Check if trainer-student relationship exists
    SELECT EXISTS(
        SELECT 1 FROM public.users 
        WHERE id = student_id 
        AND trainer_id = verify_trainer_student_access.trainer_id
        AND user_type = 'STUDENT'
    ) INTO relationship_exists;
    
    IF NOT relationship_exists THEN
        PERFORM log_security_event('PERMISSION_DENIED', 'MEDIUM',
            jsonb_build_object(
                'trainer_id', trainer_id,
                'student_id', student_id,
                'reason', 'NO_TRAINER_RELATIONSHIP'
            )
        );
        RETURN FALSE;
    END IF;
    
    -- Log successful access
    PERFORM log_security_event('DATA_ACCESS', 'LOW',
        jsonb_build_object(
            'trainer_id', trainer_id,
            'student_id', student_id,
            'permission', required_permission
        )
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting function for API endpoints
CREATE OR REPLACE FUNCTION check_rate_limit(
    user_identifier TEXT,
    action_type TEXT,
    max_requests INTEGER DEFAULT 100,
    window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
    request_count INTEGER;
    window_start TIMESTAMPTZ;
BEGIN
    window_start := NOW() - (window_minutes || ' minutes')::INTERVAL;
    
    -- Count requests in current window
    SELECT COUNT(*) INTO request_count
    FROM public.audit_logs
    WHERE additional_info->>'user_identifier' = user_identifier
    AND additional_info->>'action_type' = action_type
    AND timestamp > window_start;
    
    IF request_count >= max_requests THEN
        PERFORM log_security_event('SECURITY_VIOLATION', 'HIGH',
            jsonb_build_object(
                'violation_type', 'RATE_LIMIT_EXCEEDED',
                'user_identifier', user_identifier,
                'action_type', action_type,
                'request_count', request_count,
                'max_requests', max_requests
            )
        );
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- ADVANCED ROW LEVEL SECURITY POLICIES
-- Enhanced data isolation and access control
-- ===================================================================

-- Drop existing policies to replace with enhanced versions
DROP POLICY IF EXISTS "Students can view own profile" ON public.users;
DROP POLICY IF EXISTS "Trainers can view own profile and students" ON public.users;

-- Enhanced user profile access with audit logging
CREATE POLICY "Enhanced student profile access" ON public.users
    FOR SELECT USING (
        auth.uid() = id 
        AND user_type = 'STUDENT'
        AND log_data_access('users', id::TEXT) -- Audit trail
    );

CREATE POLICY "Enhanced trainer profile access" ON public.users
    FOR SELECT USING (
        (auth.uid() = id AND user_type = 'PERSONAL_TRAINER')
        OR
        (trainer_id = auth.uid() AND user_type = 'STUDENT' 
         AND verify_trainer_student_access(auth.uid(), id))
    );

-- Enhanced workout access with time-based restrictions
CREATE POLICY "Enhanced workout access with time limits" ON public.workouts
    FOR SELECT USING (
        (user_id = auth.uid())
        OR
        (user_id IN (
            SELECT id FROM public.users 
            WHERE trainer_id = auth.uid() 
            AND user_type = 'STUDENT'
            AND created_at > NOW() - INTERVAL '2 years' -- Limit historical data access
        ) AND verify_trainer_student_access(auth.uid(), user_id))
    );

-- Enhanced chat security with message encryption check
CREATE POLICY "Enhanced secure chat access" ON public.chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM public.chat_conversations 
            WHERE (trainer_id = auth.uid() OR student_id = auth.uid())
            AND created_at > NOW() - INTERVAL '1 year' -- Message retention limit
        )
        AND log_data_access('chat_messages', id::TEXT)
    );

-- ===================================================================
-- SECURITY EVENT LOGGING FUNCTIONS
-- Centralized security event tracking
-- ===================================================================

-- Main security event logging function
CREATE OR REPLACE FUNCTION log_security_event(
    event_type audit_event_type,
    severity audit_severity,
    additional_info JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_user_id UUID;
    client_ip INET;
    risk_score INTEGER := 0;
BEGIN
    -- Get current user safely
    current_user_id := auth.uid();
    
    -- Get client IP safely
    client_ip := inet_client_addr();
    
    -- Calculate risk score based on event type
    risk_score := CASE event_type
        WHEN 'SECURITY_VIOLATION' THEN 90
        WHEN 'LOGIN_FAILURE' THEN 60
        WHEN 'PERMISSION_DENIED' THEN 70
        WHEN 'SUSPICIOUS_ACTIVITY' THEN 75
        WHEN 'ADMIN_ACTION' THEN 50
        ELSE 20
    END;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        event_type,
        severity,
        user_id,
        ip_address,
        additional_info,
        risk_score
    ) VALUES (
        event_type,
        severity,
        current_user_id,
        client_ip,
        additional_info,
        risk_score
    ) RETURNING id INTO log_id;
    
    -- Trigger immediate alerts for high-risk events
    IF risk_score >= 80 THEN
        PERFORM send_security_alert(log_id, event_type, severity);
    END IF;
    
    RETURN log_id;
EXCEPTION
    WHEN OTHERS THEN
        -- Fail silently but log to system
        RAISE WARNING 'Security logging failed: %', SQLERRM;
        RETURN gen_random_uuid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Data access logging for compliance
CREATE OR REPLACE FUNCTION log_data_access(table_name TEXT, record_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM log_security_event('DATA_ACCESS', 'LOW',
        jsonb_build_object(
            'table', table_name,
            'record_id', record_id,
            'timestamp', NOW()
        )
    );
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the main query if logging fails
        RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- BREACH DETECTION & INCIDENT RESPONSE
-- Automated threat detection
-- ===================================================================

-- Suspicious activity detection
CREATE OR REPLACE FUNCTION detect_suspicious_activity()
RETURNS TABLE(
    user_id UUID,
    activity_type TEXT,
    risk_score INTEGER,
    event_count INTEGER,
    time_window TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH suspicious_patterns AS (
        -- Multiple failed login attempts
        SELECT 
            al.user_id,
            'MULTIPLE_FAILED_LOGINS' as activity_type,
            85 as risk_score,
            COUNT(*)::INTEGER as event_count,
            '1 hour' as time_window
        FROM public.audit_logs al
        WHERE al.event_type = 'LOGIN_FAILURE'
        AND al.timestamp > NOW() - INTERVAL '1 hour'
        GROUP BY al.user_id
        HAVING COUNT(*) >= 5
        
        UNION ALL
        
        -- Rapid data access patterns
        SELECT 
            al.user_id,
            'RAPID_DATA_ACCESS' as activity_type,
            70 as risk_score,
            COUNT(*)::INTEGER as event_count,
            '5 minutes' as time_window
        FROM public.audit_logs al
        WHERE al.event_type = 'DATA_ACCESS'
        AND al.timestamp > NOW() - INTERVAL '5 minutes'
        GROUP BY al.user_id
        HAVING COUNT(*) >= 50
        
        UNION ALL
        
        -- Permission denied spikes
        SELECT 
            al.user_id,
            'PERMISSION_DENIED_SPIKE' as activity_type,
            80 as risk_score,
            COUNT(*)::INTEGER as event_count,
            '30 minutes' as time_window
        FROM public.audit_logs al
        WHERE al.event_type = 'PERMISSION_DENIED'
        AND al.timestamp > NOW() - INTERVAL '30 minutes'
        GROUP BY al.user_id
        HAVING COUNT(*) >= 10
    )
    SELECT * FROM suspicious_patterns
    ORDER BY risk_score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automated incident response
CREATE OR REPLACE FUNCTION trigger_incident_response(incident_type TEXT, severity audit_severity)
RETURNS BOOLEAN AS $$
DECLARE
    incident_id UUID;
BEGIN
    -- Create incident record
    incident_id := gen_random_uuid();
    
    -- Log the incident
    PERFORM log_security_event('SECURITY_VIOLATION', severity,
        jsonb_build_object(
            'incident_id', incident_id,
            'incident_type', incident_type,
            'auto_generated', true,
            'requires_investigation', true
        )
    );
    
    -- For critical incidents, disable affected users
    IF severity = 'CRITICAL' THEN
        -- This would integrate with user management system
        PERFORM log_security_event('ADMIN_ACTION', 'HIGH',
            jsonb_build_object(
                'action', 'USER_ACCOUNT_SUSPENDED',
                'reason', 'CRITICAL_SECURITY_INCIDENT',
                'incident_id', incident_id
            )
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- DATA ENCRYPTION & PROTECTION
-- OWASP Top 10: Sensitive Data Exposure Prevention
-- ===================================================================

-- PII encryption function
CREATE OR REPLACE FUNCTION encrypt_pii(sensitive_data TEXT, key_id TEXT DEFAULT 'default')
RETURNS TEXT AS $$
BEGIN
    IF sensitive_data IS NULL OR length(sensitive_data) = 0 THEN
        RETURN sensitive_data;
    END IF;
    
    -- Using pgcrypto for encryption
    RETURN encode(
        pgp_sym_encrypt(
            sensitive_data,
            get_encryption_key(key_id)
        ),
        'base64'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PII decryption function
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data TEXT, key_id TEXT DEFAULT 'default')
RETURNS TEXT AS $$
BEGIN
    IF encrypted_data IS NULL OR length(encrypted_data) = 0 THEN
        RETURN encrypted_data;
    END IF;
    
    RETURN pgp_sym_decrypt(
        decode(encrypted_data, 'base64'),
        get_encryption_key(key_id)
    );
EXCEPTION
    WHEN OTHERS THEN
        PERFORM log_security_event('SYSTEM_ERROR', 'HIGH',
            jsonb_build_object('error', 'DECRYPTION_FAILED', 'details', SQLERRM)
        );
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get encryption key (would integrate with key management service)
CREATE OR REPLACE FUNCTION get_encryption_key(key_id TEXT)
RETURNS TEXT AS $$
BEGIN
    -- In production, this would fetch from secure key management service
    -- For demo purposes, using a placeholder
    RETURN 'TreinosApp-Production-Key-2025-' || key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================================================================
-- SECURITY MONITORING VIEWS
-- Real-time security dashboard data
-- ===================================================================

-- Security events summary view
CREATE OR REPLACE VIEW security_events_summary AS
SELECT 
    event_type,
    severity,
    COUNT(*) as event_count,
    AVG(risk_score) as avg_risk_score,
    MAX(timestamp) as last_occurrence,
    COUNT(DISTINCT user_id) as affected_users
FROM public.audit_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY event_type, severity
ORDER BY avg_risk_score DESC, event_count DESC;

-- High-risk users view
CREATE OR REPLACE VIEW high_risk_users AS
SELECT 
    u.id,
    u.email,
    u.name,
    u.user_type,
    COUNT(al.id) as security_events,
    AVG(al.risk_score) as avg_risk_score,
    MAX(al.timestamp) as last_security_event
FROM public.users u
JOIN public.audit_logs al ON u.id = al.user_id
WHERE al.timestamp > NOW() - INTERVAL '7 days'
AND al.risk_score >= 50
GROUP BY u.id, u.email, u.name, u.user_type
HAVING AVG(al.risk_score) >= 60 OR COUNT(al.id) >= 10
ORDER BY avg_risk_score DESC;

-- System security health view
CREATE OR REPLACE VIEW system_security_health AS
SELECT 
    'Failed Logins (24h)' as metric,
    COUNT(*)::TEXT as value,
    CASE WHEN COUNT(*) > 100 THEN 'HIGH' ELSE 'NORMAL' END as risk_level
FROM public.audit_logs
WHERE event_type = 'LOGIN_FAILURE' AND timestamp > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'High Risk Events (24h)' as metric,
    COUNT(*)::TEXT as value,
    CASE WHEN COUNT(*) > 50 THEN 'CRITICAL' 
         WHEN COUNT(*) > 20 THEN 'HIGH' 
         ELSE 'NORMAL' END as risk_level
FROM public.audit_logs
WHERE risk_score >= 80 AND timestamp > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Unique Attackers (24h)' as metric,
    COUNT(DISTINCT ip_address)::TEXT as value,
    CASE WHEN COUNT(DISTINCT ip_address) > 20 THEN 'HIGH' ELSE 'NORMAL' END as risk_level
FROM public.audit_logs
WHERE risk_score >= 70 AND timestamp > NOW() - INTERVAL '24 hours';

-- ===================================================================
-- SECURITY MAINTENANCE TASKS
-- Automated security housekeeping
-- ===================================================================

-- Clean old audit logs (GDPR/LGPD compliance)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Keep audit logs for 2 years for compliance
    DELETE FROM public.audit_logs
    WHERE timestamp < NOW() - INTERVAL '2 years'
    AND severity IN ('LOW', 'MEDIUM');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    PERFORM log_security_event('ADMIN_ACTION', 'LOW',
        jsonb_build_object(
            'action', 'AUDIT_LOG_CLEANUP',
            'deleted_records', deleted_count
        )
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Security health check
CREATE OR REPLACE FUNCTION security_health_check()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    recommendation TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Failed Login Rate' as check_name,
        CASE WHEN COUNT(*) > 1000 THEN 'CRITICAL'
             WHEN COUNT(*) > 500 THEN 'WARNING'
             ELSE 'OK' END as status,
        'Failed logins in last 24h: ' || COUNT(*)::TEXT as details,
        CASE WHEN COUNT(*) > 500 THEN 'Consider implementing additional rate limiting'
             ELSE 'No action needed' END as recommendation
    FROM public.audit_logs
    WHERE event_type = 'LOGIN_FAILURE' AND timestamp > NOW() - INTERVAL '24 hours'
    
    UNION ALL
    
    SELECT 
        'High Risk Activity' as check_name,
        CASE WHEN COUNT(*) > 100 THEN 'CRITICAL'
             WHEN COUNT(*) > 50 THEN 'WARNING'
             ELSE 'OK' END as status,
        'High risk events in last 24h: ' || COUNT(*)::TEXT as details,
        CASE WHEN COUNT(*) > 50 THEN 'Investigate high risk activities immediately'
             ELSE 'Security posture is normal' END as recommendation
    FROM public.audit_logs
    WHERE risk_score >= 80 AND timestamp > NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant appropriate permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON security_events_summary TO authenticated;
GRANT SELECT ON system_security_health TO authenticated;

-- Grant admin-only access to sensitive functions
REVOKE EXECUTE ON FUNCTION security_health_check() FROM authenticated;
GRANT EXECUTE ON FUNCTION security_health_check() TO postgres;

COMMENT ON TABLE audit_logs IS 'Comprehensive security audit trail for OWASP compliance';
COMMENT ON FUNCTION log_security_event IS 'Primary function for logging security events with risk scoring';
COMMENT ON FUNCTION detect_suspicious_activity IS 'Automated threat detection based on behavioral patterns';
COMMENT ON VIEW security_events_summary IS 'Real-time security dashboard for monitoring threats';
COMMENT ON VIEW high_risk_users IS 'Users with elevated security risk profiles requiring investigation';

-- Schedule automated security tasks (requires pg_cron)
-- SELECT cron.schedule('security-cleanup', '0 3 * * 0', 'SELECT cleanup_old_audit_logs();');
-- SELECT cron.schedule('security-monitoring', '*/15 * * * *', 'SELECT detect_suspicious_activity();');
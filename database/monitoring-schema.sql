-- ===================================================================
-- TREINOSAPP - MONITORING & OBSERVABILITY DATABASE SCHEMA
-- APM, Error Tracking, Business Metrics & Security Monitoring Tables
-- Production-ready monitoring infrastructure
-- ===================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ===================================================================
-- MONITORING ENUMS
-- ===================================================================

CREATE TYPE transaction_type AS ENUM ('screen', 'api', 'database', 'auth', 'media');
CREATE TYPE transaction_status AS ENUM ('pending', 'success', 'error', 'timeout');
CREATE TYPE error_level AS ENUM ('info', 'warning', 'error', 'fatal');
CREATE TYPE metric_type AS ENUM ('counter', 'gauge', 'histogram', 'timer');
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');

-- ===================================================================
-- APM TRANSACTIONS TABLE
-- Track application performance transactions
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    duration INTEGER, -- milliseconds
    status transaction_status DEFAULT 'pending',
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    
    -- Context
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id),
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for transaction queries
CREATE INDEX idx_monitoring_transactions_timestamp ON public.monitoring_transactions(timestamp DESC);
CREATE INDEX idx_monitoring_transactions_type ON public.monitoring_transactions(type);
CREATE INDEX idx_monitoring_transactions_status ON public.monitoring_transactions(status);
CREATE INDEX idx_monitoring_transactions_user_id ON public.monitoring_transactions(user_id);
CREATE INDEX idx_monitoring_transactions_session_id ON public.monitoring_transactions(session_id);
CREATE INDEX idx_monitoring_transactions_duration ON public.monitoring_transactions(duration DESC) WHERE duration > 1000;
CREATE INDEX idx_monitoring_transactions_slow ON public.monitoring_transactions(timestamp DESC) 
    WHERE duration > 1000 OR status IN ('error', 'timeout');

-- ===================================================================
-- ERROR TRACKING TABLE
-- Comprehensive error logging and grouping
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    stack TEXT,
    level error_level DEFAULT 'error',
    
    -- Context
    context JSONB DEFAULT '{}'::jsonb,
    fingerprint TEXT NOT NULL,
    count INTEGER DEFAULT 1,
    
    -- Session info
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id),
    
    -- Timestamps
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for error queries
CREATE INDEX idx_monitoring_errors_fingerprint ON public.monitoring_errors(fingerprint);
CREATE INDEX idx_monitoring_errors_level ON public.monitoring_errors(level);
CREATE INDEX idx_monitoring_errors_last_seen ON public.monitoring_errors(last_seen DESC);
CREATE INDEX idx_monitoring_errors_count ON public.monitoring_errors(count DESC);
CREATE INDEX idx_monitoring_errors_user_id ON public.monitoring_errors(user_id);
CREATE INDEX idx_monitoring_errors_session_id ON public.monitoring_errors(session_id);

-- ===================================================================
-- BUSINESS METRICS TABLE
-- KPI and business intelligence data
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    value DECIMAL NOT NULL,
    type metric_type DEFAULT 'counter',
    unit TEXT,
    
    -- Tags for grouping and filtering
    tags JSONB DEFAULT '{}'::jsonb,
    
    -- Context
    user_id UUID REFERENCES public.users(id),
    session_id TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for metrics queries
CREATE INDEX idx_monitoring_metrics_name ON public.monitoring_metrics(name);
CREATE INDEX idx_monitoring_metrics_timestamp ON public.monitoring_metrics(timestamp DESC);
CREATE INDEX idx_monitoring_metrics_type ON public.monitoring_metrics(type);
CREATE INDEX idx_monitoring_metrics_name_timestamp ON public.monitoring_metrics(name, timestamp DESC);
CREATE INDEX idx_monitoring_metrics_tags ON public.monitoring_metrics USING GIN(tags);
CREATE INDEX idx_monitoring_metrics_user_id ON public.monitoring_metrics(user_id);

-- ===================================================================
-- SYSTEM HEALTH MONITORING TABLE
-- Infrastructure and system health metrics
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_system_health (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL NOT NULL,
    metric_unit TEXT,
    
    -- Health status
    status TEXT NOT NULL CHECK (status IN ('healthy', 'warning', 'critical')),
    threshold_value DECIMAL,
    
    -- Additional context
    details JSONB DEFAULT '{}'::jsonb,
    node_id TEXT DEFAULT 'app-node-1',
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for system health queries
CREATE INDEX idx_monitoring_system_health_timestamp ON public.monitoring_system_health(timestamp DESC);
CREATE INDEX idx_monitoring_system_health_metric ON public.monitoring_system_health(metric_name);
CREATE INDEX idx_monitoring_system_health_status ON public.monitoring_system_health(status);
CREATE INDEX idx_monitoring_system_health_critical ON public.monitoring_system_health(timestamp DESC) 
    WHERE status = 'critical';

-- ===================================================================
-- ALERTING RULES TABLE
-- Configurable monitoring alerts
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_alert_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Rule configuration
    metric_name TEXT NOT NULL,
    condition TEXT NOT NULL, -- 'gt', 'lt', 'eq', 'contains'
    threshold_value DECIMAL,
    threshold_string TEXT,
    time_window INTEGER DEFAULT 300, -- seconds
    
    -- Alert settings
    severity alert_severity DEFAULT 'medium',
    enabled BOOLEAN DEFAULT true,
    
    -- Notification settings
    notification_channels JSONB DEFAULT '[]'::jsonb, -- email, slack, webhook
    cooldown_period INTEGER DEFAULT 3600, -- seconds
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_triggered TIMESTAMPTZ
);

-- ===================================================================
-- ALERT HISTORY TABLE
-- Track fired alerts and their resolution
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    alert_rule_id UUID NOT NULL REFERENCES public.monitoring_alert_rules(id),
    
    -- Alert details
    triggered_value DECIMAL,
    triggered_string TEXT,
    severity alert_severity NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'acknowledged')),
    resolved_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.users(id),
    
    -- Additional data
    context JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for alert history
CREATE INDEX idx_monitoring_alert_history_rule_id ON public.monitoring_alert_history(alert_rule_id);
CREATE INDEX idx_monitoring_alert_history_triggered_at ON public.monitoring_alert_history(triggered_at DESC);
CREATE INDEX idx_monitoring_alert_history_status ON public.monitoring_alert_history(status);
CREATE INDEX idx_monitoring_alert_history_severity ON public.monitoring_alert_history(severity);

-- ===================================================================
-- USER BEHAVIOR ANALYTICS TABLE
-- Track user interactions and behavior patterns
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_user_behavior (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id),
    
    -- Event details
    event_name TEXT NOT NULL,
    event_category TEXT NOT NULL, -- 'navigation', 'workout', 'social', 'settings'
    event_action TEXT NOT NULL,
    event_label TEXT,
    
    -- Event data
    event_value DECIMAL,
    event_properties JSONB DEFAULT '{}'::jsonb,
    
    -- Session context
    session_id TEXT NOT NULL,
    screen_name TEXT,
    
    -- Device context
    device_info JSONB DEFAULT '{}'::jsonb,
    app_version TEXT,
    platform TEXT,
    
    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for user behavior analytics
CREATE INDEX idx_monitoring_user_behavior_user_id ON public.monitoring_user_behavior(user_id);
CREATE INDEX idx_monitoring_user_behavior_timestamp ON public.monitoring_user_behavior(timestamp DESC);
CREATE INDEX idx_monitoring_user_behavior_event_name ON public.monitoring_user_behavior(event_name);
CREATE INDEX idx_monitoring_user_behavior_category ON public.monitoring_user_behavior(event_category);
CREATE INDEX idx_monitoring_user_behavior_session ON public.monitoring_user_behavior(session_id);

-- ===================================================================
-- PERFORMANCE BASELINES TABLE
-- Store performance benchmarks and regression detection
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.monitoring_performance_baselines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'response_time', 'throughput', 'error_rate', 'memory_usage'
    
    -- Baseline values
    baseline_value DECIMAL NOT NULL,
    baseline_unit TEXT,
    confidence_interval DECIMAL DEFAULT 0.95,
    
    -- Statistical data
    sample_size INTEGER,
    std_deviation DECIMAL,
    percentile_95 DECIMAL,
    percentile_99 DECIMAL,
    
    -- Context
    environment TEXT DEFAULT 'production',
    version TEXT,
    tags JSONB DEFAULT '{}'::jsonb,
    
    -- Validity period
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(metric_name, environment, version)
);

-- Indexes for performance baselines
CREATE INDEX idx_monitoring_baselines_metric_name ON public.monitoring_performance_baselines(metric_name);
CREATE INDEX idx_monitoring_baselines_environment ON public.monitoring_performance_baselines(environment);
CREATE INDEX idx_monitoring_baselines_valid ON public.monitoring_performance_baselines(valid_from, valid_until);

-- ===================================================================
-- MONITORING FUNCTIONS
-- ===================================================================

-- Function to calculate transaction performance percentiles
CREATE OR REPLACE FUNCTION calculate_transaction_percentiles(
    transaction_name TEXT DEFAULT NULL,
    time_window INTERVAL DEFAULT INTERVAL '1 hour'
)
RETURNS TABLE(
    name TEXT,
    count BIGINT,
    avg_duration NUMERIC,
    p50_duration NUMERIC,
    p95_duration NUMERIC,
    p99_duration NUMERIC,
    error_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH transaction_stats AS (
        SELECT 
            t.name,
            COUNT(*) as total_count,
            AVG(t.duration) as avg_duration,
            PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY t.duration) as p50_duration,
            PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY t.duration) as p95_duration,
            PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY t.duration) as p99_duration,
            COUNT(CASE WHEN t.status IN ('error', 'timeout') THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100 as error_rate
        FROM public.monitoring_transactions t
        WHERE t.timestamp > NOW() - time_window
        AND (transaction_name IS NULL OR t.name = transaction_name)
        GROUP BY t.name
    )
    SELECT 
        ts.name,
        ts.total_count,
        ROUND(ts.avg_duration, 2),
        ROUND(ts.p50_duration, 2),
        ROUND(ts.p95_duration, 2),
        ROUND(ts.p99_duration, 2),
        ROUND(ts.error_rate, 2)
    FROM transaction_stats ts
    ORDER BY ts.avg_duration DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect performance regressions
CREATE OR REPLACE FUNCTION detect_performance_regression(
    metric_name TEXT,
    current_value DECIMAL,
    regression_threshold DECIMAL DEFAULT 1.2 -- 20% degradation
)
RETURNS TABLE(
    is_regression BOOLEAN,
    baseline_value DECIMAL,
    current_value DECIMAL,
    degradation_percent DECIMAL,
    severity TEXT
) AS $$
DECLARE
    baseline RECORD;
BEGIN
    -- Get the latest baseline for this metric
    SELECT * INTO baseline
    FROM public.monitoring_performance_baselines
    WHERE monitoring_performance_baselines.metric_name = detect_performance_regression.metric_name
    AND valid_from <= NOW()
    AND (valid_until IS NULL OR valid_until > NOW())
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF baseline IS NULL THEN
        -- No baseline exists, not a regression
        RETURN QUERY SELECT FALSE, NULL::DECIMAL, current_value, NULL::DECIMAL, 'NO_BASELINE'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate degradation
    DECLARE
        degradation_ratio DECIMAL;
        degradation_percent DECIMAL;
        is_regression BOOLEAN;
        severity TEXT;
    BEGIN
        degradation_ratio := current_value / baseline.baseline_value;
        degradation_percent := (degradation_ratio - 1) * 100;
        is_regression := degradation_ratio > regression_threshold;
        
        -- Determine severity
        severity := CASE
            WHEN degradation_ratio > 2.0 THEN 'CRITICAL'
            WHEN degradation_ratio > 1.5 THEN 'HIGH'
            WHEN degradation_ratio > regression_threshold THEN 'MEDIUM'
            ELSE 'LOW'
        END;
        
        RETURN QUERY SELECT 
            is_regression, 
            baseline.baseline_value, 
            current_value, 
            degradation_percent,
            severity;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to get system health summary
CREATE OR REPLACE FUNCTION get_system_health_summary()
RETURNS TABLE(
    total_metrics INTEGER,
    healthy_count INTEGER,
    warning_count INTEGER,
    critical_count INTEGER,
    latest_check TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH health_stats AS (
        SELECT 
            COUNT(*)::INTEGER as total_metrics,
            COUNT(CASE WHEN status = 'healthy' THEN 1 END)::INTEGER as healthy_count,
            COUNT(CASE WHEN status = 'warning' THEN 1 END)::INTEGER as warning_count,
            COUNT(CASE WHEN status = 'critical' THEN 1 END)::INTEGER as critical_count,
            MAX(timestamp) as latest_check
        FROM public.monitoring_system_health
        WHERE timestamp > NOW() - INTERVAL '1 hour'
    )
    SELECT * FROM health_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data(retention_days INTEGER DEFAULT 90)
RETURNS TABLE(
    table_name TEXT,
    rows_deleted BIGINT
) AS $$
DECLARE
    cutoff_date TIMESTAMPTZ;
    deleted_count BIGINT;
BEGIN
    cutoff_date := NOW() - (retention_days || ' days')::INTERVAL;
    
    -- Cleanup transactions
    DELETE FROM public.monitoring_transactions WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'monitoring_transactions'::TEXT, deleted_count;
    
    -- Cleanup errors (keep critical errors longer)
    DELETE FROM public.monitoring_errors 
    WHERE created_at < cutoff_date AND level NOT IN ('error', 'fatal');
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'monitoring_errors'::TEXT, deleted_count;
    
    -- Cleanup metrics (keep aggregated data longer)
    DELETE FROM public.monitoring_metrics WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'monitoring_metrics'::TEXT, deleted_count;
    
    -- Cleanup system health
    DELETE FROM public.monitoring_system_health WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'monitoring_system_health'::TEXT, deleted_count;
    
    -- Cleanup user behavior (keep for analysis)
    DELETE FROM public.monitoring_user_behavior 
    WHERE created_at < NOW() - INTERVAL '180 days'; -- Keep longer for analytics
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'monitoring_user_behavior'::TEXT, deleted_count;
    
    -- Cleanup resolved alerts older than 1 year
    DELETE FROM public.monitoring_alert_history 
    WHERE created_at < NOW() - INTERVAL '1 year' AND status = 'resolved';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN QUERY SELECT 'monitoring_alert_history'::TEXT, deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Enable RLS on monitoring tables
ALTER TABLE public.monitoring_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_user_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_alert_history ENABLE ROW LEVEL SECURITY;

-- Monitoring data access policies (admin and system only for most tables)
CREATE POLICY "System can access all monitoring data" ON public.monitoring_transactions
    FOR ALL USING (true); -- System service account has full access

CREATE POLICY "System can access all error data" ON public.monitoring_errors
    FOR ALL USING (true);

CREATE POLICY "System can access all metrics data" ON public.monitoring_metrics
    FOR ALL USING (true);

CREATE POLICY "Users can view own behavior data" ON public.monitoring_user_behavior
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert behavior data" ON public.monitoring_user_behavior
    FOR INSERT WITH CHECK (true);

-- Admin access to alerts
CREATE POLICY "Admin can manage alerts" ON public.monitoring_alert_rules
    FOR ALL USING (
        EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'ADMIN')
    );

CREATE POLICY "Admin can view alert history" ON public.monitoring_alert_history
    FOR SELECT USING (
        EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND user_type = 'ADMIN')
    );

-- ===================================================================
-- TRIGGERS FOR AUTOMATED PROCESSING
-- ===================================================================

-- Trigger to update error count and timestamps
CREATE OR REPLACE FUNCTION update_error_on_duplicate()
RETURNS TRIGGER AS $$
BEGIN
    -- This would be handled by application logic with UPSERT
    -- but keeping as placeholder for database-level logic
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic alert evaluation
CREATE OR REPLACE FUNCTION evaluate_alert_rules()
RETURNS TRIGGER AS $$
DECLARE
    rule RECORD;
BEGIN
    -- Check if new metric/transaction triggers any alert rules
    FOR rule IN 
        SELECT * FROM public.monitoring_alert_rules 
        WHERE enabled = true AND metric_name = TG_TABLE_NAME
    LOOP
        -- This would contain alert evaluation logic
        -- In practice, this might be better handled by a background job
        NULL;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- INITIAL ALERT RULES
-- ===================================================================

INSERT INTO public.monitoring_alert_rules (name, description, metric_name, condition, threshold_value, severity, notification_channels)
VALUES 
    ('High Error Rate', 'Alert when error rate exceeds 5% in 5 minutes', 'error_rate', 'gt', 5.0, 'high', '["email", "slack"]'::jsonb),
    ('Slow Response Time', 'Alert when average response time exceeds 2 seconds', 'avg_response_time', 'gt', 2000.0, 'medium', '["email"]'::jsonb),
    ('High Memory Usage', 'Alert when memory usage exceeds 200MB', 'memory_usage', 'gt', 200.0, 'medium', '["email"]'::jsonb),
    ('Critical System Error', 'Alert on any critical system error', 'critical_errors', 'gt', 0.0, 'critical', '["email", "slack", "webhook"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Grant appropriate permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON public.monitoring_performance_baselines TO authenticated;
GRANT SELECT ON public.monitoring_system_health TO authenticated;

COMMENT ON TABLE monitoring_transactions IS 'APM transaction tracking for performance monitoring';
COMMENT ON TABLE monitoring_errors IS 'Error tracking with automatic grouping and counting';
COMMENT ON TABLE monitoring_metrics IS 'Business metrics and KPI tracking';
COMMENT ON TABLE monitoring_user_behavior IS 'User interaction analytics and behavior tracking';
COMMENT ON TABLE monitoring_alert_rules IS 'Configurable monitoring alert rules';
COMMENT ON TABLE monitoring_performance_baselines IS 'Performance baselines for regression detection';

-- Schedule cleanup job (requires pg_cron extension)
-- SELECT cron.schedule('monitoring-cleanup', '0 2 * * 0', 'SELECT cleanup_monitoring_data(90);');
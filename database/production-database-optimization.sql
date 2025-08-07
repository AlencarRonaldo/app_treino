-- ===================================================================
-- TREINOSAPP - PRODUCTION DATABASE OPTIMIZATION
-- Advanced PostgreSQL optimization for production fitness application
-- Target: <100ms P99 query latency, enterprise-grade reliability
-- ===================================================================

-- ===================================================================
-- POSTGRESQL CONFIGURATION OPTIMIZATION
-- Tuning parameters for production workload
-- ===================================================================

-- Memory Configuration (adjust based on server specs)
-- For 4GB RAM server:
ALTER SYSTEM SET shared_buffers = '1GB';                  -- 25% of RAM
ALTER SYSTEM SET effective_cache_size = '3GB';            -- 75% of RAM
ALTER SYSTEM SET work_mem = '32MB';                        -- Per operation
ALTER SYSTEM SET maintenance_work_mem = '256MB';          -- Maintenance ops
ALTER SYSTEM SET random_page_cost = 1.1;                  -- For SSD storage

-- Connection and Process Management
ALTER SYSTEM SET max_connections = 200;                   -- Based on app load
ALTER SYSTEM SET superuser_reserved_connections = 3;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,auto_explain,pg_hint_plan';

-- Write-Ahead Logging (WAL) Optimization
ALTER SYSTEM SET wal_level = 'replica';
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET checkpoint_timeout = '10min';
ALTER SYSTEM SET max_wal_size = '2GB';
ALTER SYSTEM SET min_wal_size = '1GB';

-- Query Performance
ALTER SYSTEM SET effective_io_concurrency = 200;          -- For SSD
ALTER SYSTEM SET seq_page_cost = 1.0;
ALTER SYSTEM SET cpu_tuple_cost = 0.01;
ALTER SYSTEM SET cpu_index_tuple_cost = 0.005;
ALTER SYSTEM SET cpu_operator_cost = 0.0025;

-- Background Writer and Checkpointer
ALTER SYSTEM SET bgwriter_delay = '200ms';
ALTER SYSTEM SET bgwriter_lru_maxpages = 100;
ALTER SYSTEM SET bgwriter_lru_multiplier = 2.0;

-- Statistics Collection
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = 'pl';

-- Auto Explain for Performance Analysis
ALTER SYSTEM SET auto_explain.log_min_duration = '1000ms';
ALTER SYSTEM SET auto_explain.log_analyze = on;
ALTER SYSTEM SET auto_explain.log_buffers = on;
ALTER SYSTEM SET auto_explain.log_timing = on;
ALTER SYSTEM SET auto_explain.log_nested_statements = on;

-- Security and Connection Timeouts
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';
ALTER SYSTEM SET lock_timeout = '10s';

-- ===================================================================
-- ADVANCED INDEXING STRATEGY
-- Performance-optimized indexes for TreinosApp queries
-- ===================================================================

-- Drop and recreate indexes with CONCURRENTLY for zero downtime
-- Users table performance indexes
DROP INDEX IF EXISTS idx_users_email;
CREATE INDEX CONCURRENTLY idx_users_email_hash ON public.users USING hash(email);
CREATE INDEX CONCURRENTLY idx_users_trainer_students_active ON public.users(trainer_id, last_login_at DESC, user_type) 
    WHERE user_type = 'STUDENT' AND trainer_id IS NOT NULL;

-- Exercise search optimization with GIN indexes
DROP INDEX IF EXISTS idx_exercises_name_trgm;
CREATE INDEX CONCURRENTLY idx_exercises_fulltext_search ON public.exercises 
    USING gin(to_tsvector('portuguese', name || ' ' || description || ' ' || array_to_string(muscle_groups::text[], ' ')));

-- Covering indexes for workout queries (include commonly fetched columns)
CREATE INDEX CONCURRENTLY idx_workouts_user_covering ON public.workouts(user_id, created_at DESC)
    INCLUDE (name, category, estimated_duration, is_template);

-- Workout session analytics with conditional indexes
CREATE INDEX CONCURRENTLY idx_workout_sessions_completed_recent ON public.workout_sessions(user_id, start_time DESC)
    WHERE completed = true AND start_time > NOW() - INTERVAL '1 year';

-- Progress tracking with time-series optimization
CREATE INDEX CONCURRENTLY idx_progress_records_timeseries ON public.progress_records(user_id, type, date DESC)
    INCLUDE (value, unit);

-- Chat system performance with partial indexes
CREATE INDEX CONCURRENTLY idx_chat_messages_unread ON public.chat_messages(conversation_id, created_at DESC)
    WHERE read_at IS NULL;

CREATE INDEX CONCURRENTLY idx_chat_conversations_recent ON public.chat_conversations(trainer_id, student_id, last_message_at DESC)
    WHERE last_message_at > NOW() - INTERVAL '30 days';

-- Multi-column indexes for complex queries
CREATE INDEX CONCURRENTLY idx_exercises_category_difficulty_official ON public.exercises(category, difficulty, is_official)
    INCLUDE (name, muscle_groups, equipment, image_url);

-- ===================================================================
-- PARTITIONING STRATEGY FOR LARGE TABLES
-- Implement table partitioning for scalability
-- ===================================================================

-- Partition audit_logs by month for better performance
CREATE TABLE IF NOT EXISTS public.audit_logs_partitioned (
    LIKE public.audit_logs INCLUDING DEFAULTS INCLUDING CONSTRAINTS
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions for audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs_2025_01 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
CREATE TABLE IF NOT EXISTS public.audit_logs_2025_02 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
CREATE TABLE IF NOT EXISTS public.audit_logs_2025_03 PARTITION OF public.audit_logs_partitioned
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Function to automatically create monthly partitions
CREATE OR REPLACE FUNCTION create_monthly_audit_partition()
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    -- Get next month
    start_date := date_trunc('month', CURRENT_DATE + INTERVAL '1 month')::DATE;
    end_date := (start_date + INTERVAL '1 month')::DATE;
    partition_name := 'audit_logs_' || to_char(start_date, 'YYYY_MM');
    
    -- Create partition if it doesn't exist
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_logs_partitioned 
                    FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, end_date);
    
    RAISE NOTICE 'Created partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Partition monitoring data by day for high-volume tables
CREATE TABLE IF NOT EXISTS public.monitoring_transactions_partitioned (
    LIKE public.monitoring_transactions INCLUDING DEFAULTS INCLUDING CONSTRAINTS
) PARTITION BY RANGE (timestamp);

-- Function to create daily monitoring partitions
CREATE OR REPLACE FUNCTION create_daily_monitoring_partition()
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    start_date DATE;
    end_date DATE;
BEGIN
    start_date := CURRENT_DATE + INTERVAL '1 day';
    end_date := start_date + INTERVAL '1 day';
    partition_name := 'monitoring_transactions_' || to_char(start_date, 'YYYY_MM_DD');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.monitoring_transactions_partitioned 
                    FOR VALUES FROM (%L) TO (%L)', 
                   partition_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- AUTOMATED MAINTENANCE PROCEDURES
-- Production maintenance automation
-- ===================================================================

-- Comprehensive VACUUM and ANALYZE procedure
CREATE OR REPLACE FUNCTION production_maintenance()
RETURNS TABLE(
    table_name TEXT,
    operation TEXT,
    duration INTERVAL,
    status TEXT,
    details TEXT
) AS $$
DECLARE
    table_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    -- Analyze table statistics first
    FOR table_record IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        start_time := clock_timestamp();
        
        BEGIN
            EXECUTE format('ANALYZE %I.%I', table_record.schemaname, table_record.tablename);
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                table_record.tablename,
                'ANALYZE'::TEXT,
                end_time - start_time,
                'SUCCESS'::TEXT,
                'Statistics updated'::TEXT;
        EXCEPTION WHEN OTHERS THEN
            end_time := clock_timestamp();
            RETURN QUERY SELECT 
                table_record.tablename,
                'ANALYZE'::TEXT,
                end_time - start_time,
                'ERROR'::TEXT,
                SQLERRM::TEXT;
        END;
    END LOOP;

    -- VACUUM high-traffic tables
    FOR table_record IN 
        SELECT schemaname, tablename, n_tup_ins + n_tup_upd + n_tup_del as changes
        FROM pg_tables t
        JOIN pg_stat_user_tables s ON t.tablename = s.relname
        WHERE schemaname = 'public'
        AND (n_tup_ins + n_tup_upd + n_tup_del) > 1000
        ORDER BY changes DESC
    LOOP
        start_time := clock_timestamp();
        
        BEGIN
            EXECUTE format('VACUUM (ANALYZE) %I.%I', table_record.schemaname, table_record.tablename);
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                table_record.tablename,
                'VACUUM'::TEXT,
                end_time - start_time,
                'SUCCESS'::TEXT,
                format('Processed %s changes', table_record.changes)::TEXT;
        EXCEPTION WHEN OTHERS THEN
            end_time := clock_timestamp();
            RETURN QUERY SELECT 
                table_record.tablename,
                'VACUUM'::TEXT,
                end_time - start_time,
                'ERROR'::TEXT,
                SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Reindex procedure for index maintenance
CREATE OR REPLACE FUNCTION reindex_fragmented_indexes()
RETURNS TABLE(
    index_name TEXT,
    table_name TEXT,
    bloat_ratio DECIMAL,
    status TEXT,
    duration INTERVAL
) AS $$
DECLARE
    index_record RECORD;
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
BEGIN
    -- Find fragmented indexes (this is a simplified version)
    FOR index_record IN 
        SELECT 
            indexname,
            tablename,
            schemaname
        FROM pg_indexes 
        WHERE schemaname = 'public'
        -- Add bloat detection logic here based on pg_stat_user_indexes
    LOOP
        start_time := clock_timestamp();
        
        BEGIN
            EXECUTE format('REINDEX INDEX CONCURRENTLY %I.%I', 
                          index_record.schemaname, index_record.indexname);
            end_time := clock_timestamp();
            
            RETURN QUERY SELECT 
                index_record.indexname,
                index_record.tablename,
                0.0::DECIMAL, -- Placeholder for bloat ratio
                'SUCCESS'::TEXT,
                end_time - start_time;
        EXCEPTION WHEN OTHERS THEN
            end_time := clock_timestamp();
            RETURN QUERY SELECT 
                index_record.indexname,
                index_record.tablename,
                0.0::DECIMAL,
                'ERROR'::TEXT,
                end_time - start_time;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- BACKUP AND RECOVERY STRATEGY
-- Enterprise backup procedures
-- ===================================================================

-- Create backup metadata table
CREATE TABLE IF NOT EXISTS public.backup_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'log')),
    backup_path TEXT NOT NULL,
    backup_size BIGINT,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    error_message TEXT,
    retention_until TIMESTAMPTZ,
    
    -- Backup validation
    checksum TEXT,
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    
    -- Metadata
    database_size BIGINT,
    wal_location TEXT,
    created_by TEXT DEFAULT current_user
);

-- Function to log backup operations
CREATE OR REPLACE FUNCTION log_backup_operation(
    p_backup_type TEXT,
    p_backup_path TEXT,
    p_status TEXT DEFAULT 'completed',
    p_backup_size BIGINT DEFAULT NULL,
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
BEGIN
    INSERT INTO public.backup_metadata (
        backup_type,
        backup_path,
        backup_size,
        end_time,
        status,
        error_message,
        retention_until,
        database_size,
        wal_location
    ) VALUES (
        p_backup_type,
        p_backup_path,
        p_backup_size,
        NOW(),
        p_status,
        p_error_message,
        CASE p_backup_type
            WHEN 'full' THEN NOW() + INTERVAL '30 days'
            WHEN 'incremental' THEN NOW() + INTERVAL '7 days'  
            WHEN 'log' THEN NOW() + INTERVAL '3 days'
        END,
        pg_database_size(current_database()),
        pg_current_wal_lsn()::TEXT
    ) RETURNING id INTO backup_id;
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify backup integrity
CREATE OR REPLACE FUNCTION verify_backup_integrity(backup_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    backup_record RECORD;
    file_exists BOOLEAN := false;
    calculated_checksum TEXT;
BEGIN
    SELECT * INTO backup_record FROM public.backup_metadata WHERE id = backup_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Backup with ID % not found', backup_id;
    END IF;
    
    -- In a real implementation, this would:
    -- 1. Check if backup file exists
    -- 2. Verify file checksum
    -- 3. Test restore capability (for critical backups)
    
    -- Simulate verification (replace with actual file system checks)
    file_exists := true; -- This would be replaced with actual file check
    
    UPDATE public.backup_metadata 
    SET 
        verified = file_exists,
        verification_date = NOW()
    WHERE id = backup_id;
    
    RETURN file_exists;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old backups based on retention policy
CREATE OR REPLACE FUNCTION cleanup_old_backups()
RETURNS TABLE(
    backup_id UUID,
    backup_type TEXT,
    backup_path TEXT,
    deleted BOOLEAN
) AS $$
DECLARE
    backup_record RECORD;
BEGIN
    FOR backup_record IN 
        SELECT id, backup_type, backup_path, retention_until
        FROM public.backup_metadata 
        WHERE retention_until < NOW()
        AND status = 'completed'
    LOOP
        -- In production, this would actually delete the backup files
        -- and then remove the metadata record
        
        RETURN QUERY SELECT 
            backup_record.id,
            backup_record.backup_type,
            backup_record.backup_path,
            true; -- Placeholder for actual deletion
    END LOOP;
    
    -- Remove metadata for expired backups
    DELETE FROM public.backup_metadata 
    WHERE retention_until < NOW() 
    AND status = 'completed';
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- CONNECTION POOLING AND RATE LIMITING
-- Database connection management
-- ===================================================================

-- Function to monitor active connections
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE(
    total_connections INTEGER,
    active_connections INTEGER,
    idle_connections INTEGER,
    idle_in_transaction INTEGER,
    waiting_connections INTEGER,
    max_connections INTEGER,
    utilization_percent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH connection_stats AS (
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN state = 'active' THEN 1 END) as active,
            COUNT(CASE WHEN state = 'idle' THEN 1 END) as idle,
            COUNT(CASE WHEN state = 'idle in transaction' THEN 1 END) as idle_in_tx,
            COUNT(CASE WHEN wait_event IS NOT NULL THEN 1 END) as waiting,
            current_setting('max_connections')::INTEGER as max_conn
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
    )
    SELECT 
        total::INTEGER,
        active::INTEGER,
        idle::INTEGER,
        idle_in_tx::INTEGER,
        waiting::INTEGER,
        max_conn::INTEGER,
        ROUND((total::DECIMAL / max_conn::DECIMAL) * 100, 2) as utilization
    FROM connection_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to terminate problematic connections
CREATE OR REPLACE FUNCTION terminate_problematic_connections()
RETURNS TABLE(
    terminated_pid INTEGER,
    reason TEXT,
    query_start TIMESTAMPTZ,
    state TEXT
) AS $$
DECLARE
    connection_record RECORD;
BEGIN
    -- Terminate connections idle in transaction for too long
    FOR connection_record IN 
        SELECT pid, state, query_start, query
        FROM pg_stat_activity 
        WHERE state = 'idle in transaction'
        AND query_start < NOW() - INTERVAL '5 minutes'
        AND pid <> pg_backend_pid()
    LOOP
        PERFORM pg_terminate_backend(connection_record.pid);
        
        RETURN QUERY SELECT 
            connection_record.pid,
            'Idle in transaction too long'::TEXT,
            connection_record.query_start,
            connection_record.state;
    END LOOP;
    
    -- Terminate long-running queries (over 10 minutes)
    FOR connection_record IN 
        SELECT pid, state, query_start, query
        FROM pg_stat_activity 
        WHERE state = 'active'
        AND query_start < NOW() - INTERVAL '10 minutes'
        AND pid <> pg_backend_pid()
        AND query NOT LIKE '%pg_stat_activity%' -- Don't kill monitoring queries
    LOOP
        PERFORM pg_terminate_backend(connection_record.pid);
        
        RETURN QUERY SELECT 
            connection_record.pid,
            'Long-running query'::TEXT,
            connection_record.query_start,
            connection_record.state;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- QUERY PERFORMANCE MONITORING
-- Real-time query analysis
-- ===================================================================

-- Function to get slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(min_duration_ms INTEGER DEFAULT 1000)
RETURNS TABLE(
    query TEXT,
    calls BIGINT,
    total_time NUMERIC,
    mean_time NUMERIC,
    rows BIGINT,
    hit_percent NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        LEFT(s.query, 200) as query,
        s.calls,
        ROUND(s.total_exec_time::NUMERIC, 2) as total_time,
        ROUND(s.mean_exec_time::NUMERIC, 2) as mean_time,
        s.rows,
        ROUND(
            (s.shared_blks_hit::NUMERIC / 
            NULLIF(s.shared_blks_hit + s.shared_blks_read, 0)::NUMERIC) * 100, 
            2
        ) as hit_percent
    FROM pg_stat_statements s
    WHERE s.mean_exec_time > min_duration_ms
    ORDER BY s.mean_exec_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to reset query statistics
CREATE OR REPLACE FUNCTION reset_query_stats()
RETURNS BOOLEAN AS $$
BEGIN
    PERFORM pg_stat_statements_reset();
    PERFORM pg_stat_reset();
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- AUTOMATED SCHEDULING SETUP
-- Production maintenance automation
-- ===================================================================

-- Note: These would be implemented with pg_cron extension in production

-- Create maintenance schedule
/*
-- Daily maintenance at 2 AM
SELECT cron.schedule('daily-maintenance', '0 2 * * *', 'SELECT production_maintenance();');

-- Weekly reindexing on Sunday at 3 AM
SELECT cron.schedule('weekly-reindex', '0 3 * * 0', 'SELECT reindex_fragmented_indexes();');

-- Monthly partition creation
SELECT cron.schedule('monthly-partitions', '0 1 1 * *', 'SELECT create_monthly_audit_partition();');

-- Daily monitoring partition creation
SELECT cron.schedule('daily-monitoring-partitions', '0 0 * * *', 'SELECT create_daily_monitoring_partition();');

-- Backup cleanup weekly
SELECT cron.schedule('backup-cleanup', '0 4 * * 1', 'SELECT cleanup_old_backups();');

-- Connection monitoring every 5 minutes
SELECT cron.schedule('connection-monitoring', '*/5 * * * *', 'SELECT terminate_problematic_connections();');
*/

-- Grant appropriate permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
GRANT SELECT ON public.backup_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_slow_queries(INTEGER) TO authenticated;

-- Create monitoring views for DBAs
CREATE OR REPLACE VIEW database_health_summary AS
SELECT 
    'Database Size' as metric,
    pg_size_pretty(pg_database_size(current_database())) as value,
    'OK' as status
UNION ALL
SELECT 
    'Active Connections',
    active_connections::TEXT,
    CASE WHEN utilization_percent > 80 THEN 'WARNING' ELSE 'OK' END
FROM get_connection_stats()
UNION ALL
SELECT 
    'Slow Queries',
    COUNT(*)::TEXT,
    CASE WHEN COUNT(*) > 10 THEN 'WARNING' ELSE 'OK' END
FROM get_slow_queries(1000);

COMMENT ON FUNCTION production_maintenance() IS 'Comprehensive production maintenance including VACUUM and ANALYZE';
COMMENT ON FUNCTION reindex_fragmented_indexes() IS 'Rebuild fragmented indexes to maintain query performance';
COMMENT ON FUNCTION log_backup_operation IS 'Log backup operations with metadata for monitoring and compliance';
COMMENT ON FUNCTION get_connection_stats() IS 'Monitor database connections and utilization for capacity planning';
COMMENT ON FUNCTION get_slow_queries(INTEGER) IS 'Identify slow queries for performance optimization';
COMMENT ON VIEW database_health_summary IS 'High-level database health metrics for monitoring dashboard';
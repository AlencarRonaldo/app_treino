-- ===================================================================
-- TREINOSAPP - PRODUCTION PERFORMANCE OPTIMIZATION SQL
-- Advanced Database Query Optimization & Production-Ready Performance
-- Target: <100ms P99 latency, <500ms API response, enterprise-grade performance
-- ===================================================================

-- Enable Query Performance Extensions
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ===================================================================
-- ADVANCED INDEXING STRATEGIES
-- Composite indexes for high-frequency query patterns
-- ===================================================================

-- Users table advanced indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_type_verified 
    ON public.users(email, user_type, email_verified);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_trainer_active_students 
    ON public.users(trainer_id, user_type, last_login_at DESC) 
    WHERE user_type = 'STUDENT' AND trainer_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_fitness_profile 
    ON public.users(fitness_level, activity_level, primary_goal) 
    WHERE user_type = 'STUDENT';

-- Exercise table advanced indexes for search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_search_composite 
    ON public.exercises(category, difficulty, is_official);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_name_trgm 
    ON public.exercises USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_muscle_groups_category 
    ON public.exercises USING gin(muscle_groups, tags) 
    WHERE is_official = true;

-- Workout table performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_user_category_recent 
    ON public.workouts(user_id, category, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workouts_trainer_students 
    ON public.workouts(user_id, is_template, created_at DESC) 
    WHERE is_public = false;

-- Workout session analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_analytics 
    ON public.workout_sessions(user_id, start_time DESC, completed, duration) 
    WHERE completed = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_workout_sessions_trainer_overview 
    ON public.workout_sessions(user_id, start_time DESC) 
    INCLUDE (workout_id, duration, rating);

-- Progress tracking optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_records_user_type_recent 
    ON public.progress_records(user_id, type, date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_progress_analytics 
    ON public.progress_records(user_id, type, date) 
    INCLUDE (value, unit);

-- Chat system performance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_messages_conversation_recent 
    ON public.chat_messages(conversation_id, created_at DESC) 
    INCLUDE (sender_id, message_type, read_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chat_unread_messages 
    ON public.chat_messages(conversation_id, sender_id, created_at DESC) 
    WHERE read_at IS NULL;

-- ===================================================================
-- QUERY PERFORMANCE OPTIMIZATION FUNCTIONS
-- Pre-computed aggregations and materialized views
-- ===================================================================

-- User activity summary for dashboard performance
CREATE OR REPLACE FUNCTION get_user_activity_summary(user_id UUID)
RETURNS TABLE(
    total_workouts INTEGER,
    completed_sessions INTEGER,
    total_exercises INTEGER,
    last_workout_date TIMESTAMPTZ,
    avg_workout_duration NUMERIC,
    weekly_frequency NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH workout_stats AS (
        SELECT 
            COUNT(DISTINCT w.id) as workouts_count,
            COUNT(DISTINCT ws.id) as sessions_count,
            COUNT(DISTINCT we.exercise_id) as exercises_count,
            MAX(ws.start_time) as last_session,
            AVG(ws.duration) as avg_duration
        FROM public.workouts w
        LEFT JOIN public.workout_sessions ws ON w.id = ws.workout_id AND ws.user_id = user_id
        LEFT JOIN public.workout_exercises we ON w.id = we.workout_id
        WHERE w.user_id = user_id
    ),
    weekly_stats AS (
        SELECT COUNT(*)::NUMERIC / EXTRACT(WEEK FROM AGE(MAX(start_time), MIN(start_time))) as frequency
        FROM public.workout_sessions 
        WHERE user_id = user_id AND completed = true AND start_time > NOW() - INTERVAL '3 months'
    )
    SELECT 
        ws.workouts_count::INTEGER,
        ws.sessions_count::INTEGER,
        ws.exercises_count::INTEGER,
        ws.last_session,
        ws.avg_duration,
        COALESCE(wf.frequency, 0)
    FROM workout_stats ws, weekly_stats wf;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trainer dashboard optimization - student overview
CREATE OR REPLACE FUNCTION get_trainer_dashboard_data(trainer_id UUID)
RETURNS TABLE(
    total_students INTEGER,
    active_students INTEGER,
    total_workouts_assigned INTEGER,
    recent_sessions INTEGER,
    avg_student_progress NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT u.id)::INTEGER as total_students,
        COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL '7 days' THEN u.id END)::INTEGER as active_students,
        COUNT(DISTINCT w.id)::INTEGER as workouts_assigned,
        COUNT(DISTINCT ws.id)::INTEGER as recent_sessions,
        AVG(CASE 
            WHEN ws.completed THEN ws.rating 
            ELSE NULL 
        END) as avg_progress
    FROM public.users u
    LEFT JOIN public.workouts w ON u.id = w.user_id
    LEFT JOIN public.workout_sessions ws ON u.id = ws.user_id AND ws.start_time > NOW() - INTERVAL '30 days'
    WHERE u.trainer_id = trainer_id AND u.user_type = 'STUDENT';
END;
$$ LANGUAGE plpgsql STABLE;

-- Fast exercise search with ranking
CREATE OR REPLACE FUNCTION search_exercises(
    search_term TEXT,
    category_filter exercise_category DEFAULT NULL,
    difficulty_filter difficulty DEFAULT NULL,
    user_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    category exercise_category,
    difficulty difficulty,
    muscle_groups JSONB,
    equipment JSONB,
    image_url TEXT,
    is_official BOOLEAN,
    search_rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.category,
        e.difficulty,
        e.muscle_groups,
        e.equipment,
        e.image_url,
        e.is_official,
        ts_rank_cd(
            to_tsvector('portuguese', e.name || ' ' || e.description),
            plainto_tsquery('portuguese', search_term)
        ) + CASE 
            WHEN e.is_official THEN 0.1 
            ELSE 0 
        END as search_rank
    FROM public.exercises e
    WHERE 
        (category_filter IS NULL OR e.category = category_filter)
        AND (difficulty_filter IS NULL OR e.difficulty = difficulty_filter)
        AND (
            e.is_official = true 
            OR e.created_by_id = user_id
            OR (user_id IS NOT NULL AND e.created_by_id IN (
                SELECT trainer_id FROM public.users WHERE id = user_id
            ))
        )
        AND (
            e.name ILIKE '%' || search_term || '%'
            OR to_tsvector('portuguese', e.name || ' ' || e.description) @@ plainto_tsquery('portuguese', search_term)
        )
    ORDER BY search_rank DESC, e.name
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===================================================================
-- CONNECTION POOLING & RESOURCE OPTIMIZATION
-- Database connection and resource management
-- ===================================================================

-- Connection limit recommendations (adjust based on instance size)
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Query timeout protection
ALTER SYSTEM SET statement_timeout = '30s';
ALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';
ALTER SYSTEM SET lock_timeout = '10s';

-- Connection pooling configuration
ALTER SYSTEM SET max_prepared_transactions = 50;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements,auto_explain';

-- Auto-explain for slow queries
ALTER SYSTEM SET auto_explain.log_min_duration = '1000ms';
ALTER SYSTEM SET auto_explain.log_analyze = on;
ALTER SYSTEM SET auto_explain.log_buffers = on;

-- ===================================================================
-- AUTOMATED MAINTENANCE & VACUUM STRATEGIES
-- Production maintenance automation
-- ===================================================================

-- Automated vacuum and analyze scheduling
CREATE OR REPLACE FUNCTION maintenance_vacuum_analyze()
RETURNS void AS $$
BEGIN
    -- Vacuum analyze high-traffic tables
    VACUUM ANALYZE public.users;
    VACUUM ANALYZE public.exercises;
    VACUUM ANALYZE public.workouts;
    VACUUM ANALYZE public.workout_sessions;
    VACUUM ANALYZE public.chat_messages;
    VACUUM ANALYZE public.progress_records;
    
    -- Update statistics
    SELECT pg_stat_reset();
    
    RAISE NOTICE 'Maintenance vacuum completed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Performance monitoring view
CREATE OR REPLACE VIEW performance_monitor AS
SELECT 
    schemaname,
    tablename,
    attname as column_name,
    inherited,
    null_frac,
    avg_width,
    n_distinct,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Query performance analysis view
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100 -- queries slower than 100ms
ORDER BY mean_time DESC
LIMIT 20;

-- ===================================================================
-- BATCH PROCESSING & BULK OPERATIONS
-- Optimized batch operations for data processing
-- ===================================================================

-- Bulk workout session insert for analytics
CREATE OR REPLACE FUNCTION bulk_insert_workout_sessions(session_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER;
BEGIN
    INSERT INTO public.workout_sessions (user_id, workout_id, start_time, end_time, duration, completed, rating, notes)
    SELECT 
        (item->>'user_id')::UUID,
        (item->>'workout_id')::UUID,
        (item->>'start_time')::TIMESTAMPTZ,
        (item->>'end_time')::TIMESTAMPTZ,
        (item->>'duration')::INTEGER,
        (item->>'completed')::BOOLEAN,
        (item->>'rating')::INTEGER,
        item->>'notes'
    FROM jsonb_array_elements(session_data) AS item;
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- Bulk progress record updates
CREATE OR REPLACE FUNCTION bulk_update_progress_records(progress_data JSONB)
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
    record RECORD;
BEGIN
    FOR record IN 
        SELECT 
            (item->>'user_id')::UUID as user_id,
            (item->>'type')::progress_type as type,
            (item->>'value')::DECIMAL as value,
            item->>'unit' as unit,
            item->>'notes' as notes,
            COALESCE((item->>'date')::TIMESTAMPTZ, NOW()) as date
        FROM jsonb_array_elements(progress_data) AS item
    LOOP
        INSERT INTO public.progress_records (user_id, type, value, unit, notes, date)
        VALUES (record.user_id, record.type, record.value, record.unit, record.notes, record.date)
        ON CONFLICT DO NOTHING;
        
        IF FOUND THEN
            updated_count := updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- CACHE OPTIMIZATION FUNCTIONS
-- Database-level caching for frequently accessed data
-- ===================================================================

-- Materialized view for exercise library performance
CREATE MATERIALIZED VIEW IF NOT EXISTS exercise_search_cache AS
SELECT 
    e.id,
    e.name,
    e.category,
    e.difficulty,
    e.muscle_groups,
    e.equipment,
    e.image_url,
    e.is_official,
    to_tsvector('portuguese', e.name || ' ' || COALESCE(e.description, '')) as search_vector,
    array_to_string(array(select jsonb_array_elements_text(e.muscle_groups)), ' ') as muscle_groups_text
FROM public.exercises e
WHERE e.is_official = true OR e.created_at > NOW() - INTERVAL '1 month';

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_exercise_cache_search 
    ON exercise_search_cache USING gin(search_vector);

CREATE INDEX IF NOT EXISTS idx_exercise_cache_category 
    ON exercise_search_cache(category, difficulty);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_exercise_cache()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY exercise_search_cache;
    RAISE NOTICE 'Exercise search cache refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- PERFORMANCE MONITORING & ALERTING
-- Production monitoring functions
-- ===================================================================

-- Database health check function
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS TABLE(
    metric TEXT,
    value TEXT,
    status TEXT,
    threshold TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Active Connections' as metric,
        (SELECT count(*)::TEXT FROM pg_stat_activity WHERE state = 'active') as value,
        CASE 
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') > 50 THEN 'WARNING'
            WHEN (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') > 80 THEN 'CRITICAL'
            ELSE 'OK'
        END as status,
        '< 50 (Warning), < 80 (Critical)' as threshold
    
    UNION ALL
    
    SELECT 
        'Slow Queries (>1s)' as metric,
        (SELECT count(*)::TEXT FROM pg_stat_statements WHERE mean_time > 1000) as value,
        CASE 
            WHEN (SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000) > 10 THEN 'WARNING'
            WHEN (SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000) > 20 THEN 'CRITICAL'
            ELSE 'OK'
        END as status,
        '< 10 (Warning), < 20 (Critical)' as threshold
    
    UNION ALL
    
    SELECT 
        'Cache Hit Ratio' as metric,
        ROUND(100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)), 2)::TEXT || '%' as value,
        CASE 
            WHEN 100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)) < 95 THEN 'WARNING'
            WHEN 100.0 * sum(blks_hit) / (sum(blks_hit) + sum(blks_read)) < 90 THEN 'CRITICAL'
            ELSE 'OK'
        END as status,
        '> 95% (OK), < 95% (Warning), < 90% (Critical)' as threshold
    FROM pg_stat_database;
END;
$$ LANGUAGE plpgsql;

-- ===================================================================
-- SCHEDULED MAINTENANCE TASKS
-- Production maintenance automation
-- ===================================================================

-- Schedule automatic maintenance (requires pg_cron extension)
-- SELECT cron.schedule('vacuum-maintenance', '0 2 * * *', 'SELECT maintenance_vacuum_analyze();');
-- SELECT cron.schedule('refresh-cache', '0 */6 * * *', 'SELECT refresh_exercise_cache();');

COMMENT ON FUNCTION maintenance_vacuum_analyze() IS 'Automated vacuum and analyze for production maintenance';
COMMENT ON FUNCTION database_health_check() IS 'Production database health monitoring';
COMMENT ON FUNCTION get_user_activity_summary(UUID) IS 'Optimized user activity aggregation for dashboards';
COMMENT ON FUNCTION search_exercises(TEXT, exercise_category, difficulty, UUID, INTEGER) IS 'High-performance exercise search with ranking';

-- Grant appropriate permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON performance_monitor TO authenticated;
GRANT SELECT ON slow_queries TO authenticated;
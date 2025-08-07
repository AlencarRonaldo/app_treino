-- Database Schema para Sistema de Preços e Assinaturas FitPro
-- PostgreSQL + Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- Tabela de Planos
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  name_pt VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('freemium', 'starter', 'professional', 'expert', 'basic', 'business', 'enterprise')),
  target_audience VARCHAR(20) NOT NULL CHECK (target_audience IN ('personal', 'academy', 'student')),
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]',
  limits JSONB NOT NULL DEFAULT '{}',
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  trial_days INTEGER DEFAULT 14,
  description TEXT,
  description_pt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Assinaturas
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  stripe_subscription_id VARCHAR(255),
  mp_subscription_id VARCHAR(255),
  billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Rastreamento de Uso
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type VARCHAR(20) NOT NULL CHECK (metric_type IN ('students', 'templates', 'workouts', 'messages')),
  current_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, metric_type, period_start)
);

-- Tabela de Histórico de Faturamento
CREATE TABLE billing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'failed', 'refunded')),
  provider VARCHAR(20) NOT NULL CHECK (provider IN ('stripe', 'mercadopago')),
  invoice_url TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Descontos e Promoções
CREATE TABLE discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) UNIQUE NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed', 'trial_extension')),
  value DECIMAL(10,2) NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_plans JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Notificações de Faturamento
CREATE TABLE billing_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('payment_success', 'payment_failed', 'subscription_canceled', 'trial_ending', 'limit_warning')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_mp_id ON subscriptions(mp_subscription_id);

-- Índices para usage_tracking
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_metric_type ON usage_tracking(metric_type);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Índices para billing_history
CREATE INDEX idx_billing_history_user_id ON billing_history(user_id);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_billing_history_status ON billing_history(status);
CREATE INDEX idx_billing_history_created_at ON billing_history(created_at);

-- Índices para discounts
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_valid_until ON discounts(valid_until);
CREATE INDEX idx_discounts_is_active ON discounts(is_active);

-- Índices para billing_notifications
CREATE INDEX idx_billing_notifications_user_id ON billing_notifications(user_id);
CREATE INDEX idx_billing_notifications_is_read ON billing_notifications(is_read);
CREATE INDEX idx_billing_notifications_created_at ON billing_notifications(created_at);

-- =============================================
-- FUNÇÕES E TRIGGERS
-- =============================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para verificar limites de uso
CREATE OR REPLACE FUNCTION check_usage_limit(
  p_user_id UUID,
  p_metric_type VARCHAR(20),
  p_required_count INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_count INTEGER;
  v_limit_count INTEGER;
  v_subscription_status VARCHAR(20);
BEGIN
  -- Verificar se usuário tem assinatura ativa
  SELECT status INTO v_subscription_status
  FROM subscriptions
  WHERE user_id = p_user_id AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_subscription_status IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Obter uso atual
  SELECT current_count INTO v_current_count
  FROM usage_tracking
  WHERE user_id = p_user_id 
    AND metric_type = p_metric_type
    AND period_start <= NOW()
    AND period_end >= NOW();

  IF v_current_count IS NULL THEN
    v_current_count := 0;
  END IF;

  -- Obter limite da assinatura atual
  SELECT (limits->>p_metric_type)::INTEGER INTO v_limit_count
  FROM subscriptions s
  JOIN plans p ON s.plan_id = p.id
  WHERE s.user_id = p_user_id AND s.status IN ('active', 'trialing')
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_limit_count IS NULL THEN
    v_limit_count := 0;
  END IF;

  -- Verificar se há espaço suficiente
  RETURN (v_current_count + p_required_count) <= v_limit_count;
END;
$$ LANGUAGE plpgsql;

-- Função para incrementar uso
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_metric_type VARCHAR(20),
  p_increment INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_current_count INTEGER;
BEGIN
  -- Definir período atual (mês)
  v_period_start := DATE_TRUNC('month', NOW());
  v_period_end := v_period_start + INTERVAL '1 month' - INTERVAL '1 day';

  -- Verificar se registro existe
  SELECT current_count INTO v_current_count
  FROM usage_tracking
  WHERE user_id = p_user_id 
    AND metric_type = p_metric_type
    AND period_start = v_period_start;

  IF v_current_count IS NULL THEN
    -- Criar novo registro
    INSERT INTO usage_tracking (user_id, metric_type, current_count, limit_count, period_start, period_end)
    SELECT 
      p_user_id,
      p_metric_type,
      p_increment,
      (p.limits->>p_metric_type)::INTEGER,
      v_period_start,
      v_period_end
    FROM subscriptions s
    JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = p_user_id AND s.status IN ('active', 'trialing')
    ORDER BY s.created_at DESC
    LIMIT 1;
  ELSE
    -- Atualizar registro existente
    UPDATE usage_tracking
    SET current_count = current_count + p_increment,
        updated_at = NOW()
    WHERE user_id = p_user_id 
      AND metric_type = p_metric_type
      AND period_start = v_period_start;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS ÚTEIS
-- =============================================

-- View para assinaturas ativas com detalhes do plano
CREATE VIEW active_subscriptions AS
SELECT 
  s.id,
  s.user_id,
  s.plan_id,
  p.name as plan_name,
  p.name_pt as plan_name_pt,
  p.type as plan_type,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.trial_ends_at,
  s.billing_cycle,
  p.price_monthly,
  p.price_yearly,
  p.features,
  p.limits
FROM subscriptions s
JOIN plans p ON s.plan_id = p.id
WHERE s.status IN ('active', 'trialing');

-- View para uso atual dos usuários
CREATE VIEW current_usage AS
SELECT 
  ut.user_id,
  ut.metric_type,
  ut.current_count,
  ut.limit_count,
  ROUND((ut.current_count::DECIMAL / ut.limit_count::DECIMAL) * 100, 2) as usage_percentage,
  ut.period_start,
  ut.period_end
FROM usage_tracking ut
WHERE ut.period_start <= NOW() AND ut.period_end >= NOW();

-- View para métricas de receita
CREATE VIEW revenue_metrics AS
SELECT 
  DATE_TRUNC('month', bh.created_at) as month,
  COUNT(DISTINCT bh.user_id) as paying_users,
  SUM(bh.amount) as total_revenue,
  AVG(bh.amount) as avg_revenue_per_user
FROM billing_history bh
WHERE bh.status = 'paid'
GROUP BY DATE_TRUNC('month', bh.created_at)
ORDER BY month DESC;

-- =============================================
-- RLS (Row Level Security)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_notifications ENABLE ROW LEVEL SECURITY;

-- Políticas para plans (leitura pública)
CREATE POLICY "Plans are viewable by everyone" ON plans
  FOR SELECT USING (is_active = true);

-- Políticas para subscriptions
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para usage_tracking
CREATE POLICY "Users can view their own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON usage_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON usage_tracking
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para billing_history
CREATE POLICY "Users can view their own billing history" ON billing_history
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para billing_notifications
CREATE POLICY "Users can view their own notifications" ON billing_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON billing_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- DADOS INICIAIS (SEED)
-- =============================================

-- Inserir planos padrão
INSERT INTO plans (name, name_pt, type, target_audience, price_monthly, price_yearly, features, limits, is_popular, trial_days, description, description_pt) VALUES
-- Personal Trainers
('Freemium', 'Freemium', 'freemium', 'personal', 0, 0, 
 '["Biblioteca de exercícios", "3 alunos", "5 templates básicos"]',
 '{"students": 3, "templates": 5, "workouts": 10, "messages_per_month": 0, "analytics_days": 0, "white_label": false, "api_access": false, "webhooks": false}',
 false, 0, 'Perfect for getting started', 'Perfeito para começar'),

('Starter', 'Starter', 'starter', 'personal', 19, 190, 
 '["Biblioteca completa", "10 alunos", "15 templates", "Dashboard básico", "Suporte por email"]',
 '{"students": 10, "templates": 15, "workouts": 50, "messages_per_month": 100, "analytics_days": 30, "white_label": false, "api_access": false, "webhooks": false}',
 false, 14, 'Great for growing personal trainers', 'Ideal para personal trainers em crescimento'),

('Professional', 'Professional', 'professional', 'personal', 49, 490, 
 '["Biblioteca completa", "40 alunos", "50+ templates", "Chat em tempo real", "Analytics avançados", "White label básico", "Relatórios PDF", "Agendamento"]',
 '{"students": 40, "templates": 50, "workouts": 200, "messages_per_month": 500, "analytics_days": 90, "white_label": true, "api_access": false, "webhooks": false}',
 true, 14, 'Most popular choice for professionals', 'Escolha mais popular para profissionais'),

('Expert', 'Expert', 'expert', 'personal', 99, 990, 
 '["Tudo do Professional", "Alunos ilimitados", "Templates ilimitados", "White label completo", "API access", "Webhooks", "Suporte prioritário"]',
 '{"students": -1, "templates": -1, "workouts": -1, "messages_per_month": -1, "analytics_days": 365, "white_label": true, "api_access": true, "webhooks": true}',
 false, 14, 'For established professionals', 'Para profissionais estabelecidos'),

-- Academies
('Basic Academy', 'Academia Básica', 'basic', 'academy', 199, 1990, 
 '["200 alunos", "5 instrutores", "Biblioteca completa", "Dashboard básico"]',
 '{"students": 200, "instructors": 5, "templates": 100, "workouts": 500, "messages_per_month": 1000, "analytics_days": 30, "white_label": false, "api_access": false, "webhooks": false}',
 false, 14, 'Perfect for small academies', 'Perfeito para academias pequenas'),

('Business Academy', 'Academia Business', 'business', 'academy', 399, 3990, 
 '["500 alunos", "15 instrutores", "Analytics avançados", "White label", "Relatórios personalizados"]',
 '{"students": 500, "instructors": 15, "templates": 200, "workouts": 1000, "messages_per_month": 2000, "analytics_days": 90, "white_label": true, "api_access": false, "webhooks": false}',
 false, 14, 'For growing academies', 'Para academias em crescimento'),

('Enterprise Academy', 'Academia Enterprise', 'enterprise', 'academy', 799, 7990, 
 '["Alunos ilimitados", "Instrutores ilimitados", "Tudo ilimitado", "Suporte dedicado", "Integrações customizadas"]',
 '{"students": -1, "instructors": -1, "templates": -1, "workouts": -1, "messages_per_month": -1, "analytics_days": 365, "white_label": true, "api_access": true, "webhooks": true}',
 false, 14, 'For large academy chains', 'Para grandes redes de academias');

-- Inserir alguns descontos de exemplo
INSERT INTO discounts (code, type, value, max_uses, valid_from, valid_until, applicable_plans, description) VALUES
('WELCOME50', 'percentage', 50, 1000, NOW(), NOW() + INTERVAL '1 year', '["starter", "professional"]', '50% off for new users'),
('ANNUAL20', 'percentage', 20, 500, NOW(), NOW() + INTERVAL '6 months', '["professional", "expert"]', '20% off annual plans'),
('STUDENT50', 'percentage', 50, 200, NOW(), NOW() + INTERVAL '1 year', '["starter", "professional"]', 'Student discount'); 
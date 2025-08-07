// Tipos para o sistema de preços e assinaturas do FitPro

export type BillingCycle = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
export type PaymentProvider = 'stripe' | 'mercadopago';
export type UserType = 'personal' | 'academy' | 'student';
export type PlanType = 'freemium' | 'starter' | 'professional' | 'expert' | 'basic' | 'business' | 'enterprise';

export interface Plan {
  id: string;
  name: string;
  name_pt: string;
  type: PlanType;
  target_audience: UserType;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    students: number;
    instructors?: number;
    templates: number;
    workouts: number;
    messages_per_month: number;
    analytics_days: number;
    white_label: boolean;
    api_access: boolean;
    webhooks: boolean;
  };
  is_popular?: boolean;
  is_active: boolean;
  trial_days: number;
  description: string;
  description_pt: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  trial_ends_at?: Date;
  canceled_at?: Date;
  stripe_subscription_id?: string;
  mp_subscription_id?: string;
  billing_cycle: BillingCycle;
  created_at: Date;
  updated_at: Date;
}

export interface UsageTracking {
  id: string;
  user_id: string;
  metric_type: 'students' | 'templates' | 'workouts' | 'messages';
  current_count: number;
  limit_count: number;
  period_start: Date;
  period_end: Date;
  created_at: Date;
  updated_at: Date;
}

export interface BillingHistory {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  provider: PaymentProvider;
  invoice_url?: string;
  paid_at?: Date;
  created_at: Date;
}

export interface PricingCardProps {
  plan: Plan;
  isPopular?: boolean;
  currentPlan?: string;
  onSelectPlan: (planId: string, billingCycle: BillingCycle) => void;
  billingCycle: BillingCycle;
  isLoading?: boolean;
}

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: Plan;
  suggestedPlan: Plan;
  reason: 'student_limit' | 'feature_request' | 'manual';
  currentUsage?: {
    students: number;
    templates: number;
    workouts: number;
  };
}

export interface UsageIndicatorProps {
  label: string;
  current: number;
  limit: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  unit?: string;
}

export interface PricingPageProps {
  userType?: UserType;
  currentPlan?: Plan;
  currentUsage?: Record<string, number>;
}

// Tipos para webhooks
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface MercadoPagoWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    status: string;
    payer_id?: string;
    preapproval_id?: string;
    date_created?: string;
    next_payment_date?: string;
    trial_end_date?: string;
    frequency?: number;
    transaction_amount?: number;
    currency_id?: string;
    external_reference?: string;
    date_approved?: string;
    subscription_id?: string;
  };
  created: number;
}

// Tipos para analytics
export interface RevenueMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  churn_rate: number;
  trial_conversion_rate: number;
}

export interface UsageMetrics {
  total_users: number;
  active_subscriptions: number;
  trial_users: number;
  feature_usage: Record<string, number>;
}

// Tipos para feature gates
export interface FeatureAccess {
  can_create_workouts: boolean;
  can_use_templates: boolean;
  can_chat: boolean;
  can_analytics: boolean;
  can_white_label: boolean;
  can_api_access: boolean;
  can_webhooks: boolean;
  student_limit: number;
  template_limit: number;
  workout_limit: number;
  message_limit: number;
}

// Tipos para promoções e descontos
export interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'trial_extension';
  value: number;
  max_uses: number;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  applicable_plans: string[];
  is_active: boolean;
}

// Tipos para notificações
export interface BillingNotification {
  id: string;
  user_id: string;
  type: 'payment_success' | 'payment_failed' | 'subscription_canceled' | 'trial_ending' | 'limit_warning';
  title: string;
  message: string;
  is_read: boolean;
  created_at: Date;
} 
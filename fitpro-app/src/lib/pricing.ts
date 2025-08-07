// Biblioteca de utilitários para sistema de preços e assinaturas FitPro

import { Plan, Subscription, UsageTracking, BillingCycle, FeatureAccess } from '@/types/pricing';

// =============================================
// CONSTANTES E CONFIGURAÇÕES
// =============================================

export const BILLING_CYCLES: Record<BillingCycle, { label: string; months: number }> = {
  monthly: { label: 'Mensal', months: 1 },
  yearly: { label: 'Anual', months: 12 }
};

export const SUBSCRIPTION_STATUSES = {
  active: { label: 'Ativo', color: 'green' },
  canceled: { label: 'Cancelado', color: 'red' },
  past_due: { label: 'Em atraso', color: 'orange' },
  unpaid: { label: 'Não pago', color: 'red' },
  trialing: { label: 'Em teste', color: 'blue' }
} as const;

// =============================================
// CÁLCULOS DE PREÇO
// =============================================

/**
 * Calcula o preço com desconto anual
 */
export function calculateYearlyPrice(monthlyPrice: number): number {
  // 2 meses grátis no plano anual (16.67% desconto)
  return monthlyPrice * 10;
}

/**
 * Calcula o desconto percentual do plano anual
 */
export function calculateYearlyDiscount(monthlyPrice: number, yearlyPrice: number): number {
  const fullYearPrice = monthlyPrice * 12;
  return Math.round(((fullYearPrice - yearlyPrice) / fullYearPrice) * 100);
}

/**
 * Calcula o preço com desconto aplicado
 */
export function applyDiscount(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100);
}

/**
 * Formata preço em reais
 */
export function formatPrice(price: number, currency: string = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(price);
}

/**
 * Calcula o preço por período
 */
export function getPlanPrice(plan: Plan, billingCycle: BillingCycle): number {
  return billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
}

// =============================================
// VERIFICAÇÃO DE LIMITES
// =============================================

/**
 * Verifica se o usuário pode adicionar mais alunos
 */
export function canAddStudent(
  currentStudents: number,
  plan: Plan,
  subscription?: Subscription
): boolean {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  const limit = plan.limits.students;
  return limit === -1 || currentStudents < limit;
}

/**
 * Verifica se o usuário pode criar mais treinos
 */
export function canCreateWorkout(
  currentWorkouts: number,
  plan: Plan,
  subscription?: Subscription
): boolean {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  const limit = plan.limits.workouts;
  return limit === -1 || currentWorkouts < limit;
}

/**
 * Verifica se o usuário pode usar templates
 */
export function canUseTemplates(
  currentTemplates: number,
  plan: Plan,
  subscription?: Subscription
): boolean {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  const limit = plan.limits.templates;
  return limit === -1 || currentTemplates < limit;
}

/**
 * Verifica se o usuário pode usar chat
 */
export function canUseChat(plan: Plan, subscription?: Subscription): boolean {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  return plan.limits.messages_per_month > 0;
}

/**
 * Verifica se o usuário pode usar analytics
 */
export function canUseAnalytics(plan: Plan, subscription?: Subscription): boolean {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  return plan.limits.analytics_days > 0;
}

/**
 * Verifica se o usuário pode usar white label
 */
export function canUseWhiteLabel(plan: Plan, subscription?: Subscription): boolean {
  if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
    return false;
  }

  return plan.limits.white_label;
}

// =============================================
// FEATURE ACCESS
// =============================================

/**
 * Gera objeto de acesso a features baseado no plano
 */
export function getFeatureAccess(
  plan: Plan,
  subscription?: Subscription,
  currentUsage?: Record<string, number>
): FeatureAccess {
  const isActive = Boolean(subscription && ['active', 'trialing'].includes(subscription.status));
  
  return {
    can_create_workouts: isActive && (plan.limits.workouts === -1 || 
      (currentUsage?.workouts || 0) < plan.limits.workouts),
    can_use_templates: isActive && (plan.limits.templates === -1 || 
      (currentUsage?.templates || 0) < plan.limits.templates),
    can_chat: isActive && plan.limits.messages_per_month > 0,
    can_analytics: isActive && plan.limits.analytics_days > 0,
    can_white_label: isActive && plan.limits.white_label,
    can_api_access: isActive && plan.limits.api_access,
    can_webhooks: isActive && plan.limits.webhooks,
    student_limit: plan.limits.students,
    template_limit: plan.limits.templates,
    workout_limit: plan.limits.workouts,
    message_limit: plan.limits.messages_per_month
  };
}

// =============================================
// CÁLCULOS DE USO
// =============================================

/**
 * Calcula percentual de uso
 */
export function calculateUsagePercentage(current: number, limit: number): number {
  if (limit === -1) return 0; // Ilimitado
  if (limit === 0) return 100; // Sem limite definido
  return Math.min((current / limit) * 100, 100);
}

/**
 * Determina cor do indicador de uso
 */
export function getUsageColor(percentage: number): string {
  if (percentage >= 90) return 'red';
  if (percentage >= 75) return 'orange';
  if (percentage >= 50) return 'yellow';
  return 'green';
}

/**
 * Formata número com limite
 */
export function formatUsage(current: number, limit: number): string {
  if (limit === -1) return `${current} (ilimitado)`;
  return `${current} / ${limit}`;
}

// =============================================
// VALIDAÇÃO DE PLANOS
// =============================================

/**
 * Valida se um plano é adequado para o tipo de usuário
 */
export function isPlanSuitableForUser(plan: Plan, userType: string): boolean {
  return plan.target_audience === userType || plan.target_audience === 'personal';
}

/**
 * Filtra planos por tipo de usuário
 */
export function filterPlansByUserType(plans: Plan[], userType: string): Plan[] {
  return plans.filter(plan => isPlanSuitableForUser(plan, userType));
}

/**
 * Ordena planos por preço
 */
export function sortPlansByPrice(plans: Plan[], billingCycle: BillingCycle): Plan[] {
  return [...plans].sort((a, b) => {
    const priceA = getPlanPrice(a, billingCycle);
    const priceB = getPlanPrice(b, billingCycle);
    return priceA - priceB;
  });
}

// =============================================
// UPGRADE/DOWNGRADE
// =============================================

/**
 * Calcula proration para upgrade/downgrade
 */
export function calculateProration(
  currentPlan: Plan,
  newPlan: Plan,
  billingCycle: BillingCycle,
  daysRemaining: number
): number {
  const currentPrice = getPlanPrice(currentPlan, billingCycle);
  const newPrice = getPlanPrice(newPlan, billingCycle);
  
  const dailyCurrentRate = currentPrice / 30;
  const dailyNewRate = newPrice / 30;
  
  const unusedAmount = dailyCurrentRate * daysRemaining;
  const newAmount = dailyNewRate * daysRemaining;
  
  return newAmount - unusedAmount;
}

/**
 * Determina se é upgrade ou downgrade
 */
export function isUpgrade(currentPlan: Plan, newPlan: Plan, billingCycle: BillingCycle): boolean {
  const currentPrice = getPlanPrice(currentPlan, billingCycle);
  const newPrice = getPlanPrice(newPlan, billingCycle);
  return newPrice > currentPrice;
}

// =============================================
// TRIAL PERIOD
// =============================================

/**
 * Verifica se está em período de trial
 */
export function isInTrial(subscription?: Subscription): boolean {
  if (!subscription) return false;
  return Boolean(subscription.status === 'trialing' && 
         subscription.trial_ends_at && 
         new Date() < subscription.trial_ends_at);
}

/**
 * Calcula dias restantes do trial
 */
export function getTrialDaysRemaining(subscription?: Subscription): number {
  if (!subscription?.trial_ends_at) return 0;
  
  const now = new Date();
  const trialEnd = new Date(subscription.trial_ends_at);
  const diffTime = trialEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Verifica se trial está próximo do fim
 */
export function isTrialEndingSoon(subscription?: Subscription, daysThreshold: number = 3): boolean {
  const daysRemaining = getTrialDaysRemaining(subscription);
  return daysRemaining <= daysThreshold && daysRemaining > 0;
}

// =============================================
// NOTIFICAÇÕES
// =============================================

/**
 * Gera mensagem de limite atingido
 */
export function getLimitReachedMessage(
  metricType: string,
  current: number,
  limit: number
): string {
  const metricLabels: Record<string, string> = {
    students: 'alunos',
    templates: 'templates',
    workouts: 'treinos',
    messages: 'mensagens'
  };

  const label = metricLabels[metricType] || metricType;
  return `Você atingiu o limite de ${limit} ${label}. Faça upgrade para continuar.`;
}

/**
 * Gera mensagem de trial terminando
 */
export function getTrialEndingMessage(daysRemaining: number): string {
  if (daysRemaining === 1) {
    return 'Seu período de teste termina amanhã. Faça upgrade para continuar usando o FitPro.';
  }
  return `Seu período de teste termina em ${daysRemaining} dias. Faça upgrade para continuar usando o FitPro.`;
}

// =============================================
// UTILITÁRIOS DE FORMATAÇÃO
// =============================================

/**
 * Formata período de assinatura
 */
export function formatSubscriptionPeriod(start: Date, end: Date): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
}

/**
 * Formata status da assinatura
 */
export function formatSubscriptionStatus(status: string): string {
  return SUBSCRIPTION_STATUSES[status as keyof typeof SUBSCRIPTION_STATUSES]?.label || status;
}

/**
 * Formata ciclo de faturamento
 */
export function formatBillingCycle(cycle: BillingCycle): string {
  return BILLING_CYCLES[cycle].label;
}

// =============================================
// VALIDAÇÃO DE DESCONTOS
// =============================================

/**
 * Valida código de desconto
 */
export function validateDiscountCode(
  code: string,
  planId: string,
  applicablePlans: string[]
): { isValid: boolean; message?: string } {
  if (!code) {
    return { isValid: false, message: 'Código de desconto é obrigatório' };
  }

  if (!applicablePlans.includes(planId)) {
    return { isValid: false, message: 'Código não válido para este plano' };
  }

  return { isValid: true };
}

 
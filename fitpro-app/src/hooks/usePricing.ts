import { useState, useEffect, useCallback } from 'react';
import { Plan, Subscription, BillingCycle, UserType } from '@/types/pricing';
import { getFeatureAccess, isInTrial, getTrialDaysRemaining } from '@/lib/pricing';

interface UsePricingOptions {
  userId?: string;
  userType?: UserType;
}

interface UsePricingReturn {
  // Estado
  plans: Plan[];
  currentSubscription: Subscription | null;
  currentPlan: Plan | null;
  billingCycle: BillingCycle;
  isLoading: boolean;
  error: string | null;

  // Ações
  setBillingCycle: (cycle: BillingCycle) => void;
  selectPlan: (planId: string, cycle: BillingCycle) => Promise<void>;
  cancelSubscription: () => Promise<void>;
  upgradeSubscription: (newPlanId: string) => Promise<void>;
  refreshData: () => Promise<void>;

  // Utilitários
  featureAccess: ReturnType<typeof getFeatureAccess>;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  canUpgrade: boolean;
  canDowngrade: boolean;
}

export function usePricing(options: UsePricingOptions = {}): UsePricingReturn {
  const { userId, userType = 'personal' } = options;

  // Estado
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar planos
  const loadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/plans?userType=${userType}&isActive=true`);
      const data = await response.json();

      if (data.success) {
        setPlans(data.data);
      } else {
        setError(data.error || 'Erro ao carregar planos');
      }
    } catch (err) {
      setError('Erro de conexão ao carregar planos');
      console.error('Erro ao carregar planos:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userType]);

  // Carregar assinatura atual
  const loadCurrentSubscription = useCallback(async () => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/subscriptions?userId=${userId}&status=active`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const subscription = data.data[0];
        setCurrentSubscription(subscription);

        // Buscar plano da assinatura
        const planResponse = await fetch(`/api/plans?id=${subscription.plan_id}`);
        const planData = await planResponse.json();

        if (planData.success && planData.data.length > 0) {
          setCurrentPlan(planData.data[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar assinatura atual:', err);
    }
  }, [userId]);

  // Selecionar plano
  const selectPlan = useCallback(async (planId: string, cycle: BillingCycle) => {
    if (!userId) {
      setError('Usuário não identificado');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          billing_cycle: cycle
        })
      });

      const data = await response.json();

      if (data.success) {
        // Em produção, aqui você redirecionaria para checkout
        console.log('Plano selecionado:', planId, cycle);
        
        // Recarregar dados
        await loadCurrentSubscription();
      } else {
        setError(data.error || 'Erro ao selecionar plano');
      }
    } catch (err) {
      setError('Erro de conexão ao selecionar plano');
      console.error('Erro ao selecionar plano:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, loadCurrentSubscription]);

  // Cancelar assinatura
  const cancelSubscription = useCallback(async () => {
    if (!currentSubscription) {
      setError('Nenhuma assinatura ativa encontrada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/subscriptions?id=${currentSubscription.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setCurrentSubscription(null);
        setCurrentPlan(null);
      } else {
        setError(data.error || 'Erro ao cancelar assinatura');
      }
    } catch (err) {
      setError('Erro de conexão ao cancelar assinatura');
      console.error('Erro ao cancelar assinatura:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentSubscription]);

  // Fazer upgrade da assinatura
  const upgradeSubscription = useCallback(async (newPlanId: string) => {
    if (!currentSubscription) {
      setError('Nenhuma assinatura ativa encontrada');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/subscriptions?id=${currentSubscription.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: newPlanId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Recarregar dados
        await loadCurrentSubscription();
      } else {
        setError(data.error || 'Erro ao fazer upgrade da assinatura');
      }
    } catch (err) {
      setError('Erro de conexão ao fazer upgrade');
      console.error('Erro ao fazer upgrade:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentSubscription, loadCurrentSubscription]);

  // Recarregar dados
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadPlans(),
      loadCurrentSubscription()
    ]);
  }, [loadPlans, loadCurrentSubscription]);

  // Carregar dados iniciais
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Calcular feature access
  const featureAccess = getFeatureAccess(
    currentPlan || plans[0] || {
      id: 'freemium',
      limits: {
        students: 3,
        templates: 5,
        workouts: 10,
        messages_per_month: 0,
        analytics_days: 0,
        white_label: false,
        api_access: false,
        webhooks: false
      }
    },
    currentSubscription || undefined
  );

  // Verificar trial
  const isTrialActive = isInTrial(currentSubscription || undefined);
  const trialDaysRemaining = getTrialDaysRemaining(currentSubscription || undefined);

  // Verificar se pode fazer upgrade/downgrade
  const canUpgrade = Boolean(currentPlan && plans.some(plan => 
    plan.price_monthly > currentPlan.price_monthly && plan.target_audience === userType
  ));

  const canDowngrade = Boolean(currentPlan && plans.some(plan => 
    plan.price_monthly < currentPlan.price_monthly && plan.target_audience === userType
  ));

  return {
    // Estado
    plans,
    currentSubscription,
    currentPlan,
    billingCycle,
    isLoading,
    error,

    // Ações
    setBillingCycle,
    selectPlan,
    cancelSubscription,
    upgradeSubscription,
    refreshData,

    // Utilitários
    featureAccess,
    isTrialActive,
    trialDaysRemaining,
    canUpgrade,
    canDowngrade
  };
} 
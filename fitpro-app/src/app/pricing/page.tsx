'use client';

import { useState, useEffect } from 'react';
import { PricingPageProps, Plan, BillingCycle, UserType } from '@/types/pricing';
import { filterPlansByUserType, sortPlansByPrice } from '@/lib/pricing';
import PricingCard from '@/components/pricing/PricingCard';
import UpgradeModal from '@/components/pricing/UpgradeModal';

// Dados mockados dos planos (em produção viriam do banco)
const MOCK_PLANS: Plan[] = [
  // Personal Trainers
  {
    id: 'freemium',
    name: 'Freemium',
    name_pt: 'Freemium',
    type: 'freemium',
    target_audience: 'personal',
    price_monthly: 0,
    price_yearly: 0,
    features: [
      'Biblioteca de exercícios',
      '3 alunos',
      '5 templates básicos',
      'Acesso básico'
    ],
    limits: {
      students: 3,
      templates: 5,
      workouts: 10,
      messages_per_month: 0,
      analytics_days: 0,
      white_label: false,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 0,
    description: 'Perfect for getting started',
    description_pt: 'Perfeito para começar'
  },
  {
    id: 'starter',
    name: 'Starter',
    name_pt: 'Starter',
    type: 'starter',
    target_audience: 'personal',
    price_monthly: 19,
    price_yearly: 190,
    features: [
      'Biblioteca completa',
      '10 alunos',
      '15 templates',
      'Dashboard básico',
      'Suporte por email'
    ],
    limits: {
      students: 10,
      templates: 15,
      workouts: 50,
      messages_per_month: 100,
      analytics_days: 30,
      white_label: false,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'Great for growing personal trainers',
    description_pt: 'Ideal para personal trainers em crescimento'
  },
  {
    id: 'professional',
    name: 'Professional',
    name_pt: 'Professional',
    type: 'professional',
    target_audience: 'personal',
    price_monthly: 49,
    price_yearly: 490,
    features: [
      'Biblioteca completa',
      '40 alunos',
      '50+ templates',
      'Chat em tempo real',
      'Analytics avançados',
      'White label básico',
      'Relatórios PDF',
      'Agendamento'
    ],
    limits: {
      students: 40,
      templates: 50,
      workouts: 200,
      messages_per_month: 500,
      analytics_days: 90,
      white_label: true,
      api_access: false,
      webhooks: false
    },
    is_popular: true,
    is_active: true,
    trial_days: 14,
    description: 'Most popular choice for professionals',
    description_pt: 'Escolha mais popular para profissionais'
  },
  {
    id: 'expert',
    name: 'Expert',
    name_pt: 'Expert',
    type: 'expert',
    target_audience: 'personal',
    price_monthly: 99,
    price_yearly: 990,
    features: [
      'Tudo do Professional',
      'Alunos ilimitados',
      'Templates ilimitados',
      'White label completo',
      'API access',
      'Webhooks',
      'Suporte prioritário'
    ],
    limits: {
      students: -1,
      templates: -1,
      workouts: -1,
      messages_per_month: -1,
      analytics_days: 365,
      white_label: true,
      api_access: true,
      webhooks: true
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'For established professionals',
    description_pt: 'Para profissionais estabelecidos'
  },
  // Academies
  {
    id: 'basic-academy',
    name: 'Basic Academy',
    name_pt: 'Academia Básica',
    type: 'basic',
    target_audience: 'academy',
    price_monthly: 199,
    price_yearly: 1990,
    features: [
      '200 alunos',
      '5 instrutores',
      'Biblioteca completa',
      'Dashboard básico'
    ],
    limits: {
      students: 200,
      instructors: 5,
      templates: 100,
      workouts: 500,
      messages_per_month: 1000,
      analytics_days: 30,
      white_label: false,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'Perfect for small academies',
    description_pt: 'Perfeito para academias pequenas'
  },
  {
    id: 'business-academy',
    name: 'Business Academy',
    name_pt: 'Academia Business',
    type: 'business',
    target_audience: 'academy',
    price_monthly: 399,
    price_yearly: 3990,
    features: [
      '500 alunos',
      '15 instrutores',
      'Analytics avançados',
      'White label',
      'Relatórios personalizados'
    ],
    limits: {
      students: 500,
      instructors: 15,
      templates: 200,
      workouts: 1000,
      messages_per_month: 2000,
      analytics_days: 90,
      white_label: true,
      api_access: false,
      webhooks: false
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'For growing academies',
    description_pt: 'Para academias em crescimento'
  },
  {
    id: 'enterprise-academy',
    name: 'Enterprise Academy',
    name_pt: 'Academia Enterprise',
    type: 'enterprise',
    target_audience: 'academy',
    price_monthly: 799,
    price_yearly: 7990,
    features: [
      'Alunos ilimitados',
      'Instrutores ilimitados',
      'Tudo ilimitado',
      'Suporte dedicado',
      'Integrações customizadas'
    ],
    limits: {
      students: -1,
      instructors: -1,
      templates: -1,
      workouts: -1,
      messages_per_month: -1,
      analytics_days: 365,
      white_label: true,
      api_access: true,
      webhooks: true
    },
    is_popular: false,
    is_active: true,
    trial_days: 14,
    description: 'For large academy chains',
    description_pt: 'Para grandes redes de academias'
  }
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [userType, setUserType] = useState<UserType>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [suggestedPlan, setSuggestedPlan] = useState<Plan | null>(null);

  // Filtrar planos por tipo de usuário
  const filteredPlans = filterPlansByUserType(MOCK_PLANS, userType);
  const sortedPlans = sortPlansByPrice(filteredPlans, billingCycle);

  const handleSelectPlan = async (planId: string, cycle: BillingCycle) => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de seleção de plano
      // Por exemplo, redirecionar para checkout ou chamar API
      console.log('Selected plan:', planId, cycle);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em produção, redirecionaria para checkout
      alert(`Redirecionando para checkout do plano ${planId}`);
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = (current: Plan, suggested: Plan) => {
    setCurrentPlan(current);
    setSuggestedPlan(suggested);
    setShowUpgradeModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Planos e Preços
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Escolha o plano ideal para o seu negócio
            </p>

            {/* User Type Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setUserType('personal')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    userType === 'personal'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Personal Trainers
                </button>
                <button
                  onClick={() => setUserType('academy')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    userType === 'academy'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Academias
                </button>
              </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Anual
                  <span className="ml-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs">
                    -17%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {sortedPlans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isPopular={plan.is_popular}
              currentPlan={currentPlan?.id}
              onSelectPlan={handleSelectPlan}
              billingCycle={billingCycle}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Juntamente com milhares de profissionais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">5.000+</div>
                <div className="text-gray-600">Personal Trainers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">200+</div>
                <div className="text-gray-600">Academias</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">50.000+</div>
                <div className="text-gray-600">Alunos Atendidos</div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Perguntas Frequentes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas adicionais.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Há período de teste?
              </h3>
              <p className="text-gray-600">
                Todos os planos pagos incluem 14 dias de teste grátis. Sem compromisso!
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso fazer upgrade/downgrade?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode alterar seu plano a qualquer momento. Upgrades são aplicados imediatamente.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">
                Quais formas de pagamento aceitam?
              </h3>
              <p className="text-gray-600">
                Aceitamos cartões de crédito, PIX e boleto bancário através do Mercado Pago.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Comece hoje mesmo
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Junte-se a milhares de profissionais que já revolucionaram seus treinos
            </p>
            <button
              onClick={() => window.location.href = '/signup'}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Criar Conta Grátis
            </button>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && currentPlan && suggestedPlan && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          currentPlan={currentPlan}
          suggestedPlan={suggestedPlan}
          reason="student_limit"
          currentUsage={{
            students: 8,
            templates: 12,
            workouts: 25
          }}
        />
      )}
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plan, BillingCycle, UserType } from '@/types/pricing';
import { formatPrice, calculateYearlyDiscount, getPlanPrice } from '@/lib/pricing';
import { usePricing } from '@/hooks/usePricing';

export default function PlansPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [userType, setUserType] = useState<UserType>('personal');
  
  // Usar o hook de pricing
  const { 
    plans, 
    currentPlan, 
    isLoading, 
    error, 
    selectPlan 
  } = usePricing({ 
    userType,
    userId: 'demo-user' // Em produção, viria do contexto de auth
  });

  const handleSubscribe = async (planId: string) => {
    try {
      await selectPlan(planId, billingCycle);
      alert('Plano selecionado! Redirecionando para pagamento...');
      // TODO: Redirecionar para checkout
    } catch (error) {
      console.error('Erro ao selecionar plano:', error);
      alert('Erro ao selecionar plano. Tente novamente.');
    }
  };

  const getSavings = (plan: Plan) => {
    if (billingCycle === 'yearly') {
      return calculateYearlyDiscount(plan.price_monthly, plan.price_yearly);
    }
    return 0;
  };

  const filteredPlans = plans.filter(plan => 
    plan.target_audience === userType || plan.target_audience === 'personal'
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu negócio. Todos os planos incluem 14 dias de teste gratuito.
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setUserType('personal')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  userType === 'personal'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Personal Trainers
              </button>
              <button
                onClick={() => setUserType('academy')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  userType === 'academy'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Academias
              </button>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <div className="flex">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual
                {billingCycle === 'yearly' && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    -17%
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando planos...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p className="font-bold">Erro ao carregar planos</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {!isLoading && !error && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredPlans.map((plan) => {
              const isCurrentPlan = currentPlan?.id === plan.id;
              const price = getPlanPrice(plan, billingCycle);
              const savings = getSavings(plan);
              
              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl shadow-lg border-2 p-8 relative ${
                    plan.is_popular ? 'border-blue-500' : 'border-gray-200'
                  } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
                >
                  {plan.is_popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Mais Popular
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-4 right-4">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Plano Atual
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name_pt}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(price)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && savings > 0 && (
                      <div className="text-green-600 text-sm font-medium">
                        Economia de {savings}%
                      </div>
                    )}
                    {plan.trial_days > 0 && (
                      <div className="text-blue-600 text-sm font-medium mt-2">
                        {plan.trial_days} dias de teste gratuito
                      </div>
                    )}
                  </div>

                  <div className="mb-8">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                      isCurrentPlan
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : plan.is_popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {isCurrentPlan ? 'Plano Atual' : plan.is_popular ? 'Começar Agora' : 'Escolher Plano'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-sm border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Perguntas Frequentes</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-600">Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas adicionais.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Há período de teste?</h3>
              <p className="text-gray-600">Oferecemos 14 dias de teste gratuito em todos os planos pagos.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Posso mudar de plano?</h3>
              <p className="text-gray-600">Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Que métodos de pagamento aceitam?</h3>
              <p className="text-gray-600">Aceitamos cartões de crédito internacionais (Stripe) e PIX + cartões Brasil (Mercado Pago).</p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="text-center mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Precisa de um plano personalizado?
          </h3>
          <p className="text-gray-600 mb-6">
            Entre em contato conosco para discutir suas necessidades específicas.
          </p>
          <Link
            href="/dashboard/contact"
            className="bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Falar com Vendas
          </Link>
        </div>
      </div>
    </div>
  );
}

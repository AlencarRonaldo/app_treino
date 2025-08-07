'use client';

import { useState } from 'react';
import { PricingCardProps, BillingCycle } from '@/types/pricing';
import { getPlanPrice, formatPrice, calculateYearlyDiscount } from '@/lib/pricing';

export default function PricingCard({
  plan,
  isPopular = false,
  currentPlan,
  onSelectPlan,
  billingCycle,
  isLoading = false
}: PricingCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const price = getPlanPrice(plan, billingCycle);
  const yearlyDiscount = calculateYearlyDiscount(plan.price_monthly, plan.price_yearly);
  const isCurrentPlan = currentPlan === plan.id;

  const getFeatureIcon = (feature: string) => {
    if (feature.includes('alunos')) return '👥';
    if (feature.includes('templates')) return '📋';
    if (feature.includes('Chat')) return '💬';
    if (feature.includes('Analytics')) return '📊';
    if (feature.includes('White label')) return '🏷️';
    if (feature.includes('API')) return '🔌';
    if (feature.includes('Webhooks')) return '🔗';
    if (feature.includes('Suporte')) return '🎧';
    if (feature.includes('Dashboard')) return '📈';
    if (feature.includes('Biblioteca')) return '📚';
    if (feature.includes('Relatórios')) return '📄';
    if (feature.includes('Agendamento')) return '📅';
    return '✅';
  };

  return (
    <div
      className={`relative group transition-all duration-300 ${
        isPopular ? 'scale-105' : 'scale-100'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge Popular */}
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
            ⭐ Mais Popular
          </div>
        </div>
      )}

      {/* Card Principal */}
      <div
        className={`
          relative overflow-hidden rounded-2xl p-8 h-full
          ${isPopular 
            ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-xl' 
            : 'bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg'
          }
          ${isHovered ? 'shadow-2xl transform -translate-y-1' : ''}
          transition-all duration-300 ease-out
        `}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-pink-400 to-red-600 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            {plan.name_pt}
          </h3>
          <p className="text-gray-600 text-sm mb-6">
            {plan.description_pt}
          </p>

          {/* Preço */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center">
              <span className="text-4xl font-bold text-gray-900">
                {formatPrice(price)}
              </span>
              <span className="text-gray-500 ml-2">
                /{billingCycle === 'yearly' ? 'ano' : 'mês'}
              </span>
            </div>
            
            {/* Desconto Anual */}
            {billingCycle === 'yearly' && yearlyDiscount > 0 && (
              <div className="mt-2">
                <span className="text-sm text-green-600 font-medium">
                  {yearlyDiscount}% de desconto
                </span>
              </div>
            )}

            {/* Trial Info */}
            {plan.trial_days > 0 && (
              <div className="mt-2">
                <span className="text-sm text-blue-600 font-medium">
                  {plan.trial_days} dias grátis
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 mb-8">
          <ul className="space-y-3">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-lg mr-3 mt-0.5">
                  {getFeatureIcon(feature)}
                </span>
                <span className="text-gray-700 text-sm">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <div className="relative z-10">
          <button
            onClick={() => onSelectPlan(plan.id, billingCycle)}
            disabled={isLoading || isCurrentPlan}
            className={`
              w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300
              ${isCurrentPlan
                ? 'bg-gray-400 cursor-not-allowed'
                : isPopular
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
              }
              ${isHovered && !isCurrentPlan ? 'transform scale-105' : ''}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processando...
              </div>
            ) : isCurrentPlan ? (
              'Plano Atual'
            ) : (
              'Escolher Plano'
            )}
          </button>
        </div>

        {/* Current Plan Badge */}
        {isCurrentPlan && (
          <div className="absolute top-4 right-4">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              Plano Atual
            </div>
          </div>
        )}

        {/* Hover Effect Overlay */}
        {isHovered && !isCurrentPlan && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl transition-all duration-300"></div>
        )}
      </div>

      {/* Glow Effect */}
      {isPopular && (
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-2xl blur-xl -z-10"></div>
      )}
    </div>
  );
} 
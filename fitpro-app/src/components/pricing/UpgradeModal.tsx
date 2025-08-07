'use client';

import { useState } from 'react';
import { UpgradeModalProps, BillingCycle } from '@/types/pricing';
import { getPlanPrice, formatPrice, calculateProration, isUpgrade } from '@/lib/pricing';

export default function UpgradeModal({
  isOpen,
  onClose,
  currentPlan,
  suggestedPlan,
  reason,
  currentUsage
}: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const currentPrice = getPlanPrice(currentPlan, billingCycle);
  const suggestedPrice = getPlanPrice(suggestedPlan, billingCycle);
  const isUpgradePlan = isUpgrade(currentPlan, suggestedPlan, billingCycle);
  const priceDifference = suggestedPrice - currentPrice;

  const getReasonMessage = () => {
    switch (reason) {
      case 'student_limit':
        return `Você atingiu o limite de ${currentPlan.limits.students} alunos no seu plano atual.`;
      case 'feature_request':
        return 'Você solicitou acesso a recursos que não estão disponíveis no seu plano atual.';
      case 'manual':
        return 'Você pode fazer upgrade do seu plano para acessar mais recursos.';
      default:
        return 'Faça upgrade para acessar mais recursos.';
    }
  };

  const getFeatureComparison = () => {
    const features = [
      { name: 'Alunos', current: currentPlan.limits.students, suggested: suggestedPlan.limits.students },
      { name: 'Templates', current: currentPlan.limits.templates, suggested: suggestedPlan.limits.templates },
      { name: 'Treinos', current: currentPlan.limits.workouts, suggested: suggestedPlan.limits.workouts },
      { name: 'Chat', current: currentPlan.limits.messages_per_month > 0, suggested: suggestedPlan.limits.messages_per_month > 0 },
      { name: 'Analytics', current: currentPlan.limits.analytics_days > 0, suggested: suggestedPlan.limits.analytics_days > 0 },
      { name: 'White Label', current: currentPlan.limits.white_label, suggested: suggestedPlan.limits.white_label }
    ];

    return features;
  };

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Aqui você implementaria a lógica de upgrade
      // Por exemplo, redirecionar para checkout ou chamar API
      console.log('Upgrading to:', suggestedPlan.id, billingCycle);
      
      // Simular delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fechar modal após sucesso
      onClose();
    } catch (error) {
      console.error('Erro no upgrade:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Upgrade do Plano
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {getReasonMessage()}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Usage */}
          {currentUsage && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Uso Atual</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Alunos:</span>
                  <span className="ml-2 font-medium">{currentUsage.students}</span>
                </div>
                <div>
                  <span className="text-gray-600">Templates:</span>
                  <span className="ml-2 font-medium">{currentUsage.templates}</span>
                </div>
                <div>
                  <span className="text-gray-600">Treinos:</span>
                  <span className="ml-2 font-medium">{currentUsage.workouts}</span>
                </div>
              </div>
            </div>
          )}

          {/* Plan Comparison */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Current Plan */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Plano Atual</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(currentPrice)}
                <span className="text-sm font-normal text-gray-500">
                  /{billingCycle === 'yearly' ? 'ano' : 'mês'}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                {currentPlan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Plan */}
            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
              <div className="absolute -top-3 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                Recomendado
              </div>
              <h3 className="font-semibold text-gray-900 mb-3">{suggestedPlan.name_pt}</h3>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {formatPrice(suggestedPrice)}
                <span className="text-sm font-normal text-gray-500">
                  /{billingCycle === 'yearly' ? 'ano' : 'mês'}
                </span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                {suggestedPlan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Feature Comparison Table */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Comparação de Recursos</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2">Recurso</th>
                    <th className="text-center py-2">Atual</th>
                    <th className="text-center py-2">Novo</th>
                  </tr>
                </thead>
                <tbody>
                  {getFeatureComparison().map((feature, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 font-medium">{feature.name}</td>
                      <td className="py-2 text-center">
                        {typeof feature.current === 'boolean' 
                          ? (feature.current ? '✓' : '✗')
                          : feature.current === -1 
                            ? 'Ilimitado' 
                            : feature.current
                        }
                      </td>
                      <td className="py-2 text-center">
                        {typeof feature.suggested === 'boolean' 
                          ? (feature.suggested ? '✓' : '✗')
                          : feature.suggested === -1 
                            ? 'Ilimitado' 
                            : feature.suggested
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciclo de Faturamento
            </label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Anual (2 meses grátis)
              </button>
            </div>
          </div>

          {/* Price Difference */}
          {isUpgradePlan && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Diferença de preço:</span>
                <span className="text-lg font-semibold text-green-600">
                  +{formatPrice(priceDifference)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                O valor será cobrado proporcionalmente ao período restante
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processando...
                </div>
              ) : (
                `Fazer Upgrade para ${suggestedPlan.name_pt}`
              )}
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            Você pode cancelar a qualquer momento. Sem taxas ocultas.
          </p>
        </div>
      </div>
    </div>
  );
} 
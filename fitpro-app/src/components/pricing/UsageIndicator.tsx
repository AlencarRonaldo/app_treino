'use client';

import { UsageIndicatorProps } from '@/types/pricing';
import { calculateUsagePercentage, getUsageColor, formatUsage } from '@/lib/pricing';

export default function UsageIndicator({
  label,
  current,
  limit,
  warningThreshold = 80,
  criticalThreshold = 90,
  unit = ''
}: UsageIndicatorProps) {
  const percentage = calculateUsagePercentage(current, limit);
  const color = getUsageColor(percentage);
  const isUnlimited = limit === -1;
  const isWarning = percentage >= warningThreshold && percentage < criticalThreshold;
  const isCritical = percentage >= criticalThreshold;

  const getColorClasses = () => {
    if (isUnlimited) return 'text-green-600';
    if (isCritical) return 'text-red-600';
    if (isWarning) return 'text-orange-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (isUnlimited) return 'bg-green-500';
    if (isCritical) return 'bg-red-500';
    if (isWarning) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getProgressWidth = () => {
    if (isUnlimited) return 'w-0'; // Sem barra para ilimitado
    return `w-[${Math.min(percentage, 100)}%]`;
  };

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label}
        </span>
        <span className={`text-sm font-semibold ${getColorClasses()}`}>
          {formatUsage(current, limit)}
          {unit && ` ${unit}`}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        {!isUnlimited && (
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()} ${getProgressWidth()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        )}
      </div>

      {/* Status Indicators */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {isUnlimited ? 'Ilimitado' : `${percentage.toFixed(0)}% usado`}
        </span>
        
        {isWarning && (
          <span className="text-orange-600 font-medium">
            ⚠️ Aproximando do limite
          </span>
        )}
        
        {isCritical && (
          <span className="text-red-600 font-medium">
            🚨 Limite atingido
          </span>
        )}
        
        {isUnlimited && (
          <span className="text-green-600 font-medium">
            ✅ Sem limites
          </span>
        )}
      </div>

      {/* Usage Details */}
      {!isUnlimited && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-500">Usado:</span>
              <span className="ml-1 font-medium text-gray-700">
                {current.toLocaleString()}
                {unit && ` ${unit}`}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Limite:</span>
              <span className="ml-1 font-medium text-gray-700">
                {limit.toLocaleString()}
                {unit && ` ${unit}`}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
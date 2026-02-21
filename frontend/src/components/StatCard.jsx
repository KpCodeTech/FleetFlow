

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * @param {object} props
 * @param {React.ReactNode} props.icon - Lucide icon element
 * @param {string}  props.label      - Card label
 * @param {string|number} props.value - Main value
 * @param {string}  [props.trend]    - 'up' | 'down' | 'neutral'
 * @param {string}  [props.trendText]- e.g. "+12% vs last week"
 * @param {string}  [props.accentName] - e.g. "blue", "green", "amber", "red", "purple" (to apply light theme matched colours from TW)
 * @param {string}  [props.sub]      - Small subtitle text
 */
export default function StatCard({ icon, label, value, trend, trendText, accentName = 'blue', sub }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  // Replace the custom accent logic with Tailwind friendly safe-listed arbitrary values or structured classes.
  // We'll use maps to grab full valid Tailwind classes for text/bg colors:
  const iconColorMap = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    red: 'text-red-500',
    amber: 'text-yellow-500',
    purple: 'text-purple-500'
  };

  const iconBgMap = {
    blue: 'bg-blue-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    amber: 'bg-yellow-50',
    purple: 'bg-purple-50'
  };

  const trendColorMap = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-500'
  };

  // Border hover maps
  const borderHoverMap = {
    blue: 'hover:border-blue-500',
    green: 'hover:border-green-500',
    red: 'hover:border-red-500',
    amber: 'hover:border-yellow-500',
    purple: 'hover:border-purple-500',
  }

  const textColor = iconColorMap[accentName] || 'text-blue-500';
  const bgColor = iconBgMap[accentName] || 'bg-blue-50';
  const borderHover = borderHoverMap[accentName] || 'hover:border-blue-500';
  const trendColorClass = trendColorMap[trend] || 'text-gray-500';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-colors duration-200 ${borderHover}`}>
      <div className="flex items-start justify-between mb-3.5">
        <span className="text-[0.8rem] font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${bgColor} ${textColor}`}>
          {icon}
        </div>
      </div>

      <div className="text-3xl font-extrabold text-gray-900 tracking-tight leading-none">
        {value}
      </div>

      {sub && (
        <div className="text-xs text-gray-500 mt-1">{sub}</div>
      )}

      {trendText && (
        <div className={`flex items-center gap-1 mt-2.5 text-xs font-medium ${trendColorClass}`}>
          <TrendIcon size={14} />
          {trendText}
        </div>
      )}
    </div>
  );
}
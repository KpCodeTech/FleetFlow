import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * @param {object} props
 * @param {React.ReactNode} props.icon - Lucide icon element
 * @param {string}  props.label      - Card label
 * @param {string|number} props.value - Main value
 * @param {string}  [props.trend]    - 'up' | 'down' | 'neutral'
 * @param {string}  [props.trendText]- e.g. "+12% vs last week"
 * @param {string}  [props.accent]   - CSS color variable name, e.g. 'var(--green)'
 * @param {string}  [props.sub]      - Small subtitle text
 */
export default function StatCard({ icon, label, value, trend, trendText, accent = 'var(--accent)', sub }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text-muted)';

  return (
    <div className="card" style={{ padding: '1.25rem', transition: 'border-color 0.2s' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = accent}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{label}</span>
        <div style={{
          width: '34px', height: '34px', borderRadius: '0.5rem',
          background: `color-mix(in srgb, ${accent} 15%, transparent)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: accent, flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>

      <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>

      {sub && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{sub}</div>
      )}

      {trendText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.625rem', fontSize: '0.75rem', color: trendColor }}>
          <TrendIcon size={13} />
          {trendText}
        </div>
      )}
    </div>
  );
}

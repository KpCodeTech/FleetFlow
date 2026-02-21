import { X, AlertTriangle } from 'lucide-react';

/**
 * Reusable confirmation modal — replaces window.confirm()
 * Props:
 *   open      {boolean}   - show/hide
 *   title     {string}    - modal heading
 *   message   {string}    - body text
 *   onConfirm {Function}  - called on confirm click
 *   onCancel  {Function}  - called on cancel / backdrop click
 *   danger    {boolean}   - use red confirm button (default: true)
 *   confirmLabel {string} - button label (default: 'Confirm')
 */
export default function ConfirmModal({ open, title = 'Are you sure?', message, onConfirm, onCancel, danger = true, confirmLabel = 'Confirm' }) {
  if (!open) return null;

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: '0.75rem', padding: '1.5rem',
          width: '420px', maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: danger ? 'var(--red-bg)' : 'var(--amber-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color={danger ? 'var(--red)' : 'var(--amber)'} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</h3>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.125rem' }}>
            <X size={17} />
          </button>
        </div>

        {/* Message */}
        {message && (
          <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {message}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onCancel} style={{ minWidth: '80px', justifyContent: 'center' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              minWidth: '100px', justifyContent: 'center',
              padding: '0.5rem 1.125rem', borderRadius: '0.5rem', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
              background: danger ? 'var(--red)' : 'var(--accent)',
              color: '#fff',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

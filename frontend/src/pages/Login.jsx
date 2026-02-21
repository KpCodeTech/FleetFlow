import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coreApi } from '../lib/api';
import { Zap, AlertCircle, X, Mail } from 'lucide-react';

export default function Login() {
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot,  setShowForgot]  = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent,  setForgotSent]  = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await coreApi.post('/api/auth/login', form);
      localStorage.setItem('fleetflow_token', data.token);
      localStorage.setItem('fleetflow_user',  JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'var(--bg-base)',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.08) 0%, transparent 60%)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 1.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #58a6ff, #388bfd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(88,166,255,0.3)',
          }}>
            <Zap size={28} color="#0d1117" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
            FleetFlow
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Sign in to your fleet command center
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '1.75rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="parth@fleetflow.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', backgroundColor: 'var(--red-bg)', borderRadius: '0.5rem', color: 'var(--red)', fontSize: '0.8125rem' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.6875rem', marginTop: '0.5rem' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to FleetFlow'}
            </button>

            <button
              type="button"
              onClick={() => { setShowForgot(true); setForgotSent(false); setForgotEmail(''); }}
              style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.25rem', padding: '0.25rem' }}
            >
              Forgot password?
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', padding: '0.875rem', backgroundColor: 'var(--bg-surface)', borderRadius: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Demo accounts:</strong>
            <div style={{ marginTop: '0.375rem', display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <span>parth@fleetflow.com – Manager</span>
              <span>pal@fleetflow.com – Dispatcher</span>
              <span>jay@fleetflow.com – Finance</span>
              <span style={{ color: 'var(--accent)', marginTop: '0.125rem' }}>Password: password123</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setShowForgot(false)}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem',
            padding: '1.75rem', width: '380px', maxWidth: '90vw',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                <Mail size={18} color="var(--accent)" /> Reset Password
              </div>
              <button onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            {forgotSent ? (
              <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--green)', fontSize: '0.9rem' }}>
                ✓ Reset link sent! Check your inbox at <strong>{forgotEmail}</strong>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Enter your work email and we'll send a password reset link.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input" type="email" placeholder="you@company.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => { if (forgotEmail) setForgotSent(true); }}
                  disabled={!forgotEmail}
                >
                  Send Reset Link
                </button>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.75rem' }}>
                  (Demo: no actual email is sent)
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

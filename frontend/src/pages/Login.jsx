// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { coreApi } from '../lib/api';
// import { Zap, AlertCircle, X, Mail } from 'lucide-react';

// export default function Login() {
//   const [form, setForm]   = useState({ email: '', password: '' });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [showForgot,  setShowForgot]  = useState(false);
//   const [forgotEmail, setForgotEmail] = useState('');
//   const [forgotSent,  setForgotSent]  = useState(false);
//   const navigate = useNavigate();

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     try {
//       const { data } = await coreApi.post('/api/auth/login', form);
//       localStorage.setItem('fleetflow_token', data.token);
//       localStorage.setItem('fleetflow_user',  JSON.stringify(data.user));
//       navigate('/');
//     } catch (err) {
//       setError(err.response?.data?.error || 'Login failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleForgotSubmit = async () => {
//     if (!forgotEmail) return;
//     setLoading(true);
//     try {
//       const { data } = await coreApi.post('/api/auth/forgot-password', { email: forgotEmail });
//       setForgotSent(data.resetToken); // Store token temporarily for demo link
//     } catch (err) {
//       alert(err.response?.data?.error || 'Failed to send reset request');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{
//       minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
//       backgroundColor: 'var(--bg-base)',
//       backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.08) 0%, transparent 60%)',
//     }}>
//       <div style={{ width: '100%', maxWidth: '380px', padding: '0 1.5rem' }}>
//         {/* Logo */}
//         <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
//           <div style={{
//             width: '52px', height: '52px', borderRadius: '14px',
//             background: 'linear-gradient(135deg, #58a6ff, #388bfd)',
//             display: 'flex', alignItems: 'center', justifyContent: 'center',
//             margin: '0 auto 1rem',
//             boxShadow: '0 8px 32px rgba(88,166,255,0.3)',
//           }}>
//             <Zap size={28} color="#0d1117" strokeWidth={2.5} />
//           </div>
//           <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>
//             FleetFlow
//           </h1>
//           <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
//             Sign in to your fleet command center
//           </p>
//         </div>

//         {/* Card */}
//         <div className="card" style={{ padding: '1.75rem' }}>
//           <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//             <div>
//               <label className="form-label">Email address</label>
//               <input
//                 type="email"
//                 className="form-input"
//                 placeholder="parth@fleetflow.com"
//                 value={form.email}
//                 onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 required
//               />
//             </div>
//             <div>
//               <label className="form-label">Password</label>
//               <input
//                 type="password"
//                 className="form-input"
//                 placeholder="••••••••"
//                 value={form.password}
//                 onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 required
//               />
//             </div>

//             {error && (
//               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', backgroundColor: 'var(--red-bg)', borderRadius: '0.5rem', color: 'var(--red)', fontSize: '0.8125rem' }}>
//                 <AlertCircle size={15} /> {error}
//               </div>
//             )}

//             <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.6875rem', marginTop: '0.5rem' }} disabled={loading}>
//               {loading ? 'Signing in...' : 'Sign in to FleetFlow'}
//             </button>

//             <button
//               type="button"
//               onClick={() => { setShowForgot(true); setForgotSent(null); setForgotEmail(''); }}
//               style={{ width: '100%', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.25rem', padding: '0.25rem' }}
//             >
//               Forgot password?
//             </button>

//             <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '1rem', textAlign: 'center' }}>
//               <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
//                 Don't have an account? <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Create one</Link>
//               </p>
//             </div>
//           </form>

//         </div>
//       </div>

//       {/* Forgot Password Modal */}
//       {showForgot && (
//         <div style={{
//           position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
//           display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
//         }} onClick={() => setShowForgot(false)}>
//           <div style={{
//             background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '0.75rem',
//             padding: '1.75rem', width: '380px', maxWidth: '90vw',
//           }} onClick={e => e.stopPropagation()}>
//             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
//               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
//                 <Mail size={18} color="var(--accent)" /> Reset Password
//               </div>
//               <button onClick={() => setShowForgot(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
//                 <X size={18} />
//               </button>
//             </div>
//             {forgotSent ? (
//               <div style={{ textAlign: 'center', padding: '1rem 0' }}>
//                 <div style={{ color: 'var(--green)', fontSize: '0.9rem', marginBottom: '1rem' }}>
//                   ✓ Reset link generated! In a real app, this would be sent to your email.
//                 </div>
//                 <Link 
//                   to={`/reset-password?token=${forgotSent}`}
//                   onClick={() => setShowForgot(false)}
//                   style={{ display: 'block', padding: '0.75rem', background: 'var(--accent-glow)', border: '1px solid var(--accent)', borderRadius: '0.5rem', color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}
//                 >
//                   Click Here to Reset Password (Demo)
//                 </Link>
//               </div>
//             ) : (
//               <>
//                 <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
//                   Enter your work email and we'll send a password reset link.
//                 </p>
//                 <div style={{ marginBottom: '1rem' }}>
//                   <label className="form-label">Email Address</label>
//                   <input
//                     className="form-input" type="email" placeholder="you@company.com"
//                     value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
//                   />
//                 </div>
//                 <button
//                   className="btn-primary"
//                   style={{ width: '100%', justifyContent: 'center' }}
//                   onClick={handleForgotSubmit}
//                   disabled={loading || !forgotEmail}
//                 >
//                   {loading ? 'Sending...' : 'Send Reset Link'}
//                 </button>
//               </>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { coreApi } from '../lib/api';
import { Truck, AlertCircle, X, Mail } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await coreApi.post('/api/auth/login', form);
      localStorage.setItem('fleetflow_token', data.token);
      localStorage.setItem('fleetflow_user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async () => {
    if (!forgotEmail) return;
    setLoading(true);
    try {
      const { data } = await coreApi.post('/api/auth/forgot-password', { email: forgotEmail });
      setForgotSent(data.resetToken); // Store token temporarily for demo link
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send reset request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[380px] px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex w-[48px] h-[48px] items-center justify-center rounded-2xl bg-[#1a73e8] mx-auto mb-4 shadow-[0_4px_14px_rgba(26,115,232,0.4)]">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            FleetFlow
          </h1>
          <p className="text-gray-500 text-sm m-0">
            Sign in to your fleet command center
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-7 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="parth@fleetflow.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 rounded-lg text-red-600 text-sm border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button type="submit" className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 flex justify-center items-center" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to FleetFlow'}
            </button>

            <button
              type="button"
              onClick={() => { setShowForgot(true); setForgotSent(null); setForgotEmail(''); }}
              className="w-full bg-transparent border-none text-gray-500 text-sm cursor-pointer mt-1 p-1 hover:text-blue-600 transition-colors"
            >
              Forgot password?
            </button>

            <div className="border-t border-gray-100 mt-2 pt-4 text-center">
              <p className="text-sm text-gray-500 m-0">
                Don't have an account? <Link to="/signup" className="text-blue-600 no-underline font-semibold hover:text-blue-700">Create one</Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-[1000]" onClick={() => setShowForgot(false)}>
          <div className="bg-white border border-gray-200 rounded-2xl p-7 w-[380px] max-w-[90vw] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 font-semibold text-gray-900">
                <Mail size={18} className="text-blue-600" /> Reset Password
              </div>
              <button onClick={() => setShowForgot(false)} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            {forgotSent ? (
              <div className="text-center py-4">
                <div className="text-green-600 text-sm mb-4 font-medium flex items-center justify-center gap-1">
                  ✓ Reset link generated!
                </div>
                <Link
                  to={`/reset-password?token=${forgotSent}`}
                  onClick={() => setShowForgot(false)}
                  className="block p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 no-underline font-semibold hover:bg-blue-100 transition-colors"
                >
                  Click Here to Reset Password (Demo)
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Enter your work email and we'll send a password reset link.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" type="email" placeholder="you@company.com"
                    value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  />
                </div>
                <button
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={handleForgotSubmit}
                  disabled={loading || !forgotEmail}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
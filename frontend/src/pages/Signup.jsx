// import { useState } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { coreApi } from '../lib/api';
// import { Truck, AlertCircle, User, Mail, Lock, Shield } from 'lucide-react';

// export default function Signup() {
//   const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DISPATCHER' });
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const ROLES = [
//     { value: 'MANAGER', label: 'Fleet Manager' },
//     { value: 'DISPATCHER', label: 'Dispatcher' },
//     { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
//     { value: 'FINANCE', label: 'Finance' },
//   ];

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError('');
//     try {
//       const { data } = await coreApi.post('/api/auth/register', form);
//       localStorage.setItem('fleetflow_token', data.token);
//       localStorage.setItem('fleetflow_user', JSON.stringify(data.user));
//       navigate('/');
//     } catch (err) {
//       setError(err.response?.data?.error || 'Registration failed. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <div className="w-full max-w-[420px] px-6">
//         {/* Logo */}
//         <div className="text-center mb-6">
//           <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary mx-auto mb-4">
//             <Truck className="h-5 w-5 text-primary-foreground" />
//           </div>
//           <h1 className="text-[1.35rem] font-extrabold text-gray-900 m-0">
//             Join FleetFlow
//           </h1>
//           <p className="text-gray-500 text-[0.85rem] mt-1">
//             Create your account to start managing your fleet
//           </p>
//         </div>

//         {/* Card */}
//         <div className="bg-white p-7 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
//           <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
//             <div>
//               <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
//                 <User size={15} className="text-gray-400" /> Full Name
//               </label>
//               <input
//                 type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" placeholder="Parth Gupta"
//                 value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
//                 required
//               />
//             </div>

//             <div>
//               <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
//                 <Mail size={15} className="text-gray-400" /> Email Address
//               </label>
//               <input
//                 type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" placeholder="parth@fleetflow.com"
//                 value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
//                 required
//               />
//             </div>

//             <div>
//               <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
//                 <Lock size={15} className="text-gray-400" /> Password
//               </label>
//               <input
//                 type="password" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" placeholder="••••••••"
//                 value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
//                 required
//               />
//             </div>

//             <div>
//               <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
//                 <Shield size={15} className="text-gray-400" /> Organizational Role
//               </label>
//               <select
//                 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 appearance-auto"
//                 value={form.role}
//                 onChange={(e) => setForm({ ...form, role: e.target.value })}
//               >
//                 {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
//               </select>
//             </div>

//             {error && (
//               <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 rounded-lg text-red-600 text-[0.8125rem] border border-red-100">
//                 <AlertCircle size={15} /> {error}
//               </div>
//             )}

//             <button type="submit" className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
//               {loading ? 'Creating account...' : 'Create Account'}
//             </button>

//             <p className="text-center text-[0.85rem] text-gray-500 mt-4 border-t border-gray-100 pt-4 m-0">
//               Already have an account? <Link to="/login" className="text-blue-600 no-underline font-semibold hover:text-blue-700">Sign In</Link>
//             </p>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { coreApi } from '../lib/api';
import { Truck, AlertCircle, User, Mail, Lock, Shield } from 'lucide-react';

export default function Signup() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'DISPATCHER' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ROLES = [
    { value: 'MANAGER', label: 'Fleet Manager' },
    { value: 'DISPATCHER', label: 'Dispatcher' },
    { value: 'SAFETY_OFFICER', label: 'Safety Officer' },
    { value: 'FINANCE', label: 'Finance' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await coreApi.post('/api/auth/register', form);
      localStorage.setItem('fleetflow_token', data.token);
      localStorage.setItem('fleetflow_user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[420px] px-6">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="flex w-[48px] h-[48px] items-center justify-center rounded-2xl bg-[#1a73e8] mx-auto mb-4 shadow-[0_4px_14px_rgba(26,115,232,0.4)]">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-[1.35rem] font-extrabold text-gray-900 m-0">
            Join FleetFlow
          </h1>
          <p className="text-gray-500 text-[0.85rem] mt-1">
            Create your account to start managing your fleet
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-7 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <User size={15} className="text-gray-400" /> Full Name
              </label>
              <input
                type="text" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" placeholder="Parth Gupta"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Mail size={15} className="text-gray-400" /> Email Address
              </label>
              <input
                type="email" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" placeholder="parth@fleetflow.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Lock size={15} className="text-gray-400" /> Password
              </label>
              <input
                type="password" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-400" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Shield size={15} className="text-gray-400" /> Organizational Role
              </label>
              <select
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 text-gray-900 appearance-none"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 rounded-lg text-red-600 text-[0.8125rem] border border-red-100">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <button type="submit" className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md shadow-blue-600/20 transition-all duration-200 flex justify-center items-center disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>

            <p className="text-center text-[0.85rem] text-gray-500 mt-4 border-t border-gray-100 pt-4 m-0">
              Already have an account? <Link to="/login" className="text-blue-600 no-underline font-semibold hover:text-blue-700">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
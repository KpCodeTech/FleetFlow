
import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Star, Calendar, UserX, UserCheck, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const isAuthorized = ['MANAGER', 'SAFETY_OFFICER'].includes(user.role);
  const isSafetyOfficer = user.role === 'SAFETY_OFFICER';

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await coreApi.get('/api/drivers');
      setDrivers(data);
    } catch (err) {
      setError('Failed to load driver profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED';
    try {
      await coreApi.patch(`/api/drivers/${id}`, { status: newStatus });
      load();
    } catch (err) {
      setError('Status update failed');
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <ShieldAlert size={48} className="mb-4 opacity-50" />
        <h2 className="text-gray-900 mb-2 text-xl font-bold">Access Forbidden</h2>
        <p className="text-sm">Only Safety Officers and Managers can access driver safety profiles.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Driver Performance & Safety Profiles</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">Monitoring {drivers.length} drivers for compliance and safety</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer" onClick={load}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-y-auto overflow-x-auto flex-1">
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading drivers...</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Driver Name</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">License Expiry</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Safety Score</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Completion Rate</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Status</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none">
                    <td className="px-5 py-3.5 text-sm font-semibold text-gray-900 whitespace-nowrap">{d.name}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`${isExpired(d.licenseExpiryDate) ? 'text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded' : 'text-gray-600'}`}>
                          {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}
                        </span>
                        {isExpired(d.licenseExpiryDate) && <ShieldAlert size={14} className="text-red-600" />}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full relative min-w-[80px]">
                          <div
                            className={`absolute left-0 top-0 h-full rounded-full ${d.safetyScore > 80 ? 'bg-green-500' : d.safetyScore > 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${d.safetyScore}%` }}
                          />
                        </div>
                        <span className="text-[0.8125rem] font-semibold text-gray-900 min-w-[32px]">{d.safetyScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className={`text-[0.8125rem] font-semibold ${d.completionRate > 90 ? 'text-green-600' : 'text-gray-900'}`}>
                        {d.completionRate}%
                        <div className="text-[0.7rem] text-gray-500 font-normal mt-0.5">
                          {d.completedTrips} of {d.totalTrips} trips
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap"><StatusBadge status={d.status} /></td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {isSafetyOfficer && (
                        <button
                          onClick={() => handleStatusToggle(d.id, d.status)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${d.status === 'SUSPENDED'
                              ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                              : 'bg-red-50 text-red-700 border border-transparent hover:bg-red-100'
                            }`}
                        >
                          {d.status === 'SUSPENDED' ? (
                            <><UserCheck size={14} /> Reinstate</>
                          ) : (
                            <><UserX size={14} /> Suspend</>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
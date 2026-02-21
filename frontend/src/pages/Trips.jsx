import { useEffect, useState } from 'react';
import { RefreshCw, Route, AlertCircle, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [completing, setCompleting] = useState(null);  // tripId being expanded
  const [odometerMap, setOdometerMap] = useState({});    // { [tripId]: string }
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const canAction = ['MANAGER', 'DISPATCHER'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try { setTrips((await coreApi.get('/api/trips')).data); }
    catch { setError('Failed to load trips. Please refresh.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleComplete = async (tripId) => {
    setError('');
    try {
      const odometer = odometerMap[tripId];
      await coreApi.patch(`/api/trips/${tripId}/complete`, {
        finalOdometer: odometer ? Number(odometer) : undefined,
      });
      setCompleting(null);
      setOdometerMap(prev => { const n = { ...prev }; delete n[tripId]; return n; });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to complete trip.');
    }
  };

  const handleDispatch = async (tripId) => {
    setError('');
    try {
      await coreApi.patch(`/api/trips/${tripId}/dispatch`);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to dispatch draft.');
    }
  };

  const handleCancel = async (tripId) => {
    setError('');
    try { await coreApi.patch(`/api/trips/${tripId}/cancel`); load(); }
    catch (err) { setError(err.response?.data?.error || 'Failed to cancel trip.'); }
  };

  const setOdometer = (tripId, val) =>
    setOdometerMap(prev => ({ ...prev, [tripId]: val }));

  const STATUS_FILTER = ['ALL', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
  const filtered = filter === 'ALL' ? trips : trips.filter(t => t.status === filter);

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Trip History</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">{trips.length} total trips recorded</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer" onClick={load}>
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Inline Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1 font-medium">{error}</span>
          <button onClick={() => setError('')} className="bg-transparent border-none cursor-pointer text-red-500 hover:text-red-700 p-1 flex items-center justify-center rounded-md hover:bg-red-100 transition-colors">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter Tabs — now includes DRAFT */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
        {STATUS_FILTER.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full border-none cursor-pointer text-[0.78rem] font-medium transition-all whitespace-nowrap ${filter === s
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            {s === 'ALL' ? `All (${trips.length})` : s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-400 text-sm">
              Loading trips...
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">#</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Driver</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Cargo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Revenue</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Start Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Status</th>
                  {canAction && <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canAction ? 8 : 7} className="text-center text-gray-400 p-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Route size={32} className="opacity-30 mb-1" />
                        <span className="text-sm">No trips found</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-[0.8rem]">#{t.id}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-[0.8125rem] text-gray-900">
                      {t.vehicle?.nameModel ?? `V#${t.vehicleId}`}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-600">
                      {t.driver?.name ?? `D#${t.driverId}`}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-600">
                      {t.cargoWeight} kg
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[0.8125rem] text-green-600">
                      {fmt(t.revenue)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-500">
                      {new Date(t.startDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={t.status} />
                    </td>
                    {canAction && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {t.status === 'DRAFT' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium rounded text-xs transition-colors cursor-pointer"
                              onClick={() => handleDispatch(t.id)}
                            >
                              Dispatch
                            </button>
                            <button
                              className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-medium rounded text-xs transition-colors cursor-pointer"
                              onClick={() => handleCancel(t.id)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                        {t.status === 'DISPATCHED' && (
                          completing === t.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder="Final odometer (km)"
                                className="w-[150px] px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                                value={odometerMap[t.id] || ''}
                                onChange={e => setOdometer(t.id, e.target.value)}
                              />
                              <button
                                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded text-xs transition-colors cursor-pointer border-none"
                                onClick={() => handleComplete(t.id)}
                              >
                                ✓ Done
                              </button>
                              <button
                                className="px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium rounded text-xs transition-colors cursor-pointer"
                                onClick={() => setCompleting(null)}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded text-xs transition-colors cursor-pointer border-none shadow-sm shadow-blue-600/20"
                                onClick={() => setCompleting(t.id)}
                              >
                                Complete
                              </button>
                              <button
                                className="px-3 py-1.5 bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 font-medium rounded text-xs transition-colors cursor-pointer"
                                onClick={() => handleCancel(t.id)}
                              >
                                Cancel
                              </button>
                            </div>
                          )
                        )}
                      </td>
                    )}
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
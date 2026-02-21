import { useEffect, useState } from 'react';
import { RefreshCw, Route, AlertCircle, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Trips() {
  const [trips,          setTrips]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState('ALL');
  const [completing,     setCompleting]     = useState(null);  // tripId being expanded
  const [odometerMap,    setOdometerMap]    = useState({});    // { [tripId]: string }
  const [error,          setError]          = useState('');

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Trip History</h2>
          <p className="page-subtitle">{trips.length} total trips recorded</p>
        </div>
        <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
      </div>

      {/* Inline Error Banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.625rem',
          padding: '0.75rem 1rem', borderRadius: '0.5rem',
          background: 'var(--red-bg)', color: 'var(--red)',
          border: '1px solid var(--red)', fontSize: '0.875rem',
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', padding: 0 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Filter Tabs — now includes DRAFT */}
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {STATUS_FILTER.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '0.3125rem 0.875rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 500,
            background: filter === s ? 'var(--accent)' : 'var(--bg-card)',
            color: filter === s ? '#0d1117' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            {s === 'ALL' ? `All (${trips.length})` : s}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading trips...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>#</th><th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Revenue</th><th>Start Date</th><th>Status</th>{canAction && <th>Actions</th>}</tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={canAction ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    <Route size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    No trips found
                  </td></tr>
                ) : filtered.map((t) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>#{t.id}</td>
                    <td style={{ fontWeight: 600 }}>{t.vehicle?.nameModel ?? `V#${t.vehicleId}`}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.driver?.name ?? `D#${t.driverId}`}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.cargoWeight} kg</td>
                    <td style={{ fontWeight: 600, color: 'var(--green)' }}>{fmt(t.revenue)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{new Date(t.startDate).toLocaleDateString('en-IN')}</td>
                    <td><StatusBadge status={t.status} /></td>
                    {canAction && (
                      <td>
                        {t.status === 'DISPATCHED' && (
                          completing === t.id ? (
                            <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                              <input
                                type="number" placeholder="Final odometer (km)"
                                className="form-input" style={{ width: '160px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                value={odometerMap[t.id] || ''}
                                onChange={e => setOdometer(t.id, e.target.value)}
                              />
                              <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleComplete(t.id)}>✓ Done</button>
                              <button className="btn-ghost" style={{ padding: '0.3rem 0.625rem', fontSize: '0.8rem' }} onClick={() => setCompleting(null)}>✕</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setCompleting(t.id)}>Complete</button>
                              <button className="btn-danger" style={{ padding: '0.3rem 0.625rem', fontSize: '0.8rem' }} onClick={() => handleCancel(t.id)}>Cancel</button>
                            </div>
                          )
                        )}
                        {t.status === 'DRAFT' && (
                          <button className="btn-danger" style={{ padding: '0.3rem 0.625rem', fontSize: '0.8rem' }} onClick={() => handleCancel(t.id)}>Cancel</button>
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

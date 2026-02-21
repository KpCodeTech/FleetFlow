import { useEffect, useState } from 'react';
import { RefreshCw, Route } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Trips() {
  const [trips,   setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('ALL');
  const [completing, setCompleting] = useState(null);
  const [finalOdometer, setFinalOdometer] = useState('');

  const load = async () => {
    setLoading(true);
    try { setTrips((await coreApi.get('/api/trips')).data); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleComplete = async (tripId) => {
    try {
      await coreApi.patch(`/api/trips/${tripId}/complete`, {
        finalOdometer: finalOdometer ? Number(finalOdometer) : undefined,
      });
      setCompleting(null); setFinalOdometer(''); load();
    } catch (err) { alert(err.response?.data?.error || 'Failed to complete trip'); }
  };

  const handleCancel = async (tripId) => {
    if (!confirm('Cancel this trip?')) return;
    try { await coreApi.patch(`/api/trips/${tripId}/cancel`); load(); }
    catch (err) { alert(err.response?.data?.error || 'Failed to cancel trip'); }
  };

  const STATUS_FILTER = ['ALL', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
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

      {/* Filter Tabs */}
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
                <tr><th>#</th><th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Revenue</th><th>Start Date</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
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
                    <td>
                      {t.status === 'DISPATCHED' && (
                        completing === t.id ? (
                          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                            <input
                              type="number" placeholder="Final odometer"
                              className="form-input" style={{ width: '140px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                              value={finalOdometer} onChange={e => setFinalOdometer(e.target.value)}
                            />
                            <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleComplete(t.id)}>✓</button>
                            <button className="btn-ghost" style={{ padding: '0.3rem 0.625rem', fontSize: '0.8rem' }} onClick={() => setCompleting(null)}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.375rem' }}>
                            <button className="btn-primary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setCompleting(t.id)}>Complete</button>
                            <button className="btn-danger" onClick={() => handleCancel(t.id)}>Cancel</button>
                          </div>
                        )
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

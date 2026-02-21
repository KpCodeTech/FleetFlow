import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Fuel } from 'lucide-react';
import { coreApi } from '../lib/api';

const fmt    = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const EMPTY  = { vehicleId: '', tripId: '', fuelLiters: '', fuelCost: '', date: '' };

export default function Expenses() {
  const [expenses, setExpenses]     = useState([]);
  const [vehicles, setVehicles]     = useState([]);
  const [trips,    setTrips]        = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [form,     setForm]         = useState(EMPTY);
  const [saving,   setSaving]       = useState(false);
  const [error,    setError]        = useState('');
  const [filterVehicle, setFilterV] = useState('ALL');

  const user    = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const canEdit = ['MANAGER', 'DISPATCHER', 'FINANCE'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const [eRes, vRes, tRes] = await Promise.all([
        coreApi.get('/api/expenses'),
        coreApi.get('/api/vehicles'),
        coreApi.get('/api/trips'),
      ]);
      setExpenses(eRes.data);
      setVehicles(vRes.data);
      setTrips(tRes.data.filter(t => t.status === 'COMPLETED' || t.status === 'DISPATCHED'));
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await coreApi.post('/api/expenses', form);
      setShowForm(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to log expense'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this fuel log?')) return;
    try { await coreApi.delete(`/api/expenses/${id}`); load(); }
    catch (err) { setError(err.response?.data?.error || 'Delete failed'); }
  };

  // Compute per-vehicle totals
  const vehicleTotals = vehicles.reduce((acc, v) => {
    const vExp = expenses.filter(e => e.vehicleId === v.id);
    acc[v.id] = {
      fuelLiters: vExp.reduce((s, e) => s + e.fuelLiters, 0).toFixed(1),
      fuelCost:   vExp.reduce((s, e) => s + e.fuelCost, 0),
    };
    return acc;
  }, {});

  const totalFuel = expenses.reduce((s, e) => s + e.fuelLiters, 0).toFixed(1);
  const totalCost = expenses.reduce((s, e) => s + e.fuelCost, 0);

  const filtered = filterVehicle === 'ALL'
    ? expenses
    : expenses.filter(e => e.vehicleId === Number(filterVehicle));

  const availableVehicles = vehicles.filter(v => ['AVAILABLE', 'IN_SHOP', 'ON_TRIP'].includes(v.status));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Fuel & Expense Logs</h2>
          <p className="page-subtitle">
            {expenses.length} records · {totalFuel} L consumed · Total: <span style={{ color: 'var(--amber)' }}>{fmt(totalCost)}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
          {canEdit && (
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={15} />Log Fuel</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: '0.8125rem', background: 'var(--red-bg)', padding: '0.625rem 0.875rem', borderRadius: '0.375rem' }}>{error}</div>
      )}

      {/* KPI Row — per-vehicle summary */}
      {!loading && vehicles.filter(v => vehicleTotals[v.id]?.fuelCost > 0).length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {vehicles.filter(v => vehicleTotals[v.id]?.fuelCost > 0).map(v => (
            <div key={v.id} className="card" style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.nameModel}</div>
              <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--amber)' }}>{fmt(vehicleTotals[v.id].fuelCost)}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{vehicleTotals[v.id].fuelLiters} L total</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Fuel Log Form */}
      {showForm && canEdit && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Log Fuel Expense</h3>
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.875rem' }}>
            <div>
              <label className="form-label">Vehicle</label>
              <select className="form-input" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
                <option value="">Select vehicle</option>
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.nameModel} · {v.licensePlate}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Trip (optional)</label>
              <select className="form-input" value={form.tripId} onChange={e => setForm({...form, tripId: e.target.value})}>
                <option value="">No trip link</option>
                {trips.filter(t => !form.vehicleId || t.vehicleId === Number(form.vehicleId)).map(t => (
                  <option key={t.id} value={t.id}>#{t.id} · {t.vehicle?.nameModel || ''} ({t.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Fuel (Liters)</label>
              <input type="number" step="0.1" className="form-input" placeholder="50.5" value={form.fuelLiters} onChange={e => setForm({...form, fuelLiters: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Cost (₹)</label>
              <input type="number" step="0.01" className="form-input" placeholder="4700" value={form.fuelCost} onChange={e => setForm({...form, fuelCost: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', gridColumn: 'span 2' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                <Fuel size={14} />{saving ? 'Saving...' : 'Log Expense'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle filter */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
        <button onClick={() => setFilterV('ALL')} style={{
          padding: '0.3125rem 0.875rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
          fontSize: '0.78rem', fontWeight: 500,
          background: filterVehicle === 'ALL' ? 'var(--accent)' : 'var(--bg-card)',
          color: filterVehicle === 'ALL' ? '#0d1117' : 'var(--text-secondary)',
        }}>
          All ({expenses.length})
        </button>
        {vehicles.filter(v => vehicleTotals[v.id]?.fuelCost > 0).map(v => (
          <button key={v.id} onClick={() => setFilterV(String(v.id))} style={{
            padding: '0.3125rem 0.875rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 500,
            background: filterVehicle === String(v.id) ? 'var(--amber)' : 'var(--bg-card)',
            color: filterVehicle === String(v.id) ? '#0d1117' : 'var(--text-secondary)',
          }}>
            {v.nameModel.split(' ')[0]} ({expenses.filter(e => e.vehicleId === v.id).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading expenses...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th><th>Trip</th><th>Fuel (L)</th>
                  <th>Fuel Cost</th><th>Rate (₹/L)</th><th>Date</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    <Fuel size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    No fuel logs found. Log your first fuel expense above.
                  </td></tr>
                ) : filtered.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div>{e.vehicle?.nameModel ?? `V#${e.vehicleId}`}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.vehicle?.licensePlate}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {e.trip ? <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '0.125rem 0.375rem', borderRadius: '0.25rem' }}>#{e.tripId}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{e.fuelLiters.toFixed(1)} L</td>
                    <td style={{ fontWeight: 600, color: 'var(--amber)' }}>{fmt(e.fuelCost)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {e.fuelLiters > 0 ? `₹${(e.fuelCost / e.fuelLiters).toFixed(1)}/L` : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                      {new Date(e.date).toLocaleDateString('en-IN')}
                    </td>
                    {canEdit && (
                      <td>
                        <button className="btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem' }} onClick={() => handleDelete(e.id)}>
                          Delete
                        </button>
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

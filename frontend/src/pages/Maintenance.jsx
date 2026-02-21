import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Wrench } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const EMPTY = { vehicleId: '', description: '', cost: '', date: '' };

export default function Maintenance() {
  const [logs,     setLogs]     = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [lRes, vRes] = await Promise.all([coreApi.get('/api/maintenance'), coreApi.get('/api/vehicles')]);
      setLogs(lRes.data);
      setVehicles(vRes.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await coreApi.post('/api/maintenance', form);
      setShowForm(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create log'); }
    finally { setSaving(false); }
  };

  const totalCost = logs.reduce((s, l) => s + l.cost, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Maintenance Logs</h2>
          <p className="page-subtitle">{logs.length} records · Total cost: <span style={{ color: 'var(--amber)' }}>{fmt(totalCost)}</span></p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={15} />Log Maintenance</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            Create Maintenance Log <span style={{ fontSize: '0.75rem', color: 'var(--amber)', fontWeight: 400 }}>(Vehicle will be set to IN_SHOP automatically)</span>
          </h3>
          {error && <div style={{ color: 'var(--red)', fontSize: '0.8125rem', marginBottom: '0.75rem', background: 'var(--red-bg)', padding: '0.5rem 0.875rem', borderRadius: '0.375rem' }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.875rem' }}>
            <div>
              <label className="form-label">Vehicle</label>
              <select className="form-input" value={form.vehicleId} onChange={e => setForm({...form, vehicleId: e.target.value})} required>
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.nameModel} · {v.licensePlate}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="e.g. Engine overhaul, tyre replacement..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Cost (₹)</label>
              <input type="number" className="form-input" placeholder="35000" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-input" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', gridColumn: 'span 2' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Saving...' : 'Create Log'}</button>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading maintenance logs...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Vehicle</th><th>Plate</th><th>Description</th><th>Cost</th><th>Date</th><th>Vehicle Status</th></tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    <Wrench size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    No maintenance records
                  </td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>{l.vehicle?.nameModel ?? `V#${l.vehicleId}`}</td>
                    <td><code style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{l.vehicle?.licensePlate ?? '—'}</code></td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '300px' }}>{l.description}</td>
                    <td style={{ fontWeight: 600, color: 'var(--amber)' }}>{fmt(l.cost)}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{new Date(l.date).toLocaleDateString('en-IN')}</td>
                    <td>{l.vehicle && <StatusBadge status={l.vehicle.status} />}</td>
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

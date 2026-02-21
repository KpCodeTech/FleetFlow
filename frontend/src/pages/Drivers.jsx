import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Users } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const EMPTY = { name: '', licenseExpiryDate: '', safetyScore: 100 };

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const load = async () => {
    setLoading(true);
    try { setDrivers((await coreApi.get('/api/drivers')).data); }
    catch { setError('Failed to load drivers'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await coreApi.post('/api/drivers', form);
      setShowForm(false); setForm(EMPTY); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to create driver'); }
    finally { setSaving(false); }
  };

  const isExpired = (date) => new Date(date) < new Date();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Driver Management</h2>
          <p className="page-subtitle">{drivers.length} registered drivers</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}><Plus size={15} />Add Driver</button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Register New Driver</h3>
          {error && <div style={{ color: 'var(--red)', fontSize: '0.8125rem', marginBottom: '0.75rem', background: 'var(--red-bg)', padding: '0.5rem 0.875rem', borderRadius: '0.375rem' }}>{error}</div>}
          <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
            <div><label className="form-label">Full Name</label><input className="form-input" placeholder="Ramesh Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="form-label">License Expiry Date</label><input type="date" className="form-input" value={form.licenseExpiryDate} onChange={e => setForm({...form, licenseExpiryDate: e.target.value})} required /></div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>{saving ? 'Saving...' : 'Register Driver'}</button>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading drivers...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>License Expiry</th><th>Safety Score</th><th>Status</th></tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    <Users size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    No drivers registered
                  </td></tr>
                ) : drivers.map((d) => {
                  const expired = isExpired(d.licenseExpiryDate);
                  return (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>
                        <span style={{ color: expired ? 'var(--red)' : 'var(--text-secondary)', fontWeight: expired ? 600 : 400 }}>
                          {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}
                          {expired && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', background: 'var(--red-bg)', color: 'var(--red)', padding: '0.1rem 0.375rem', borderRadius: '4px' }}>EXPIRED</span>}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--bg-hover)', borderRadius: '3px', maxWidth: '80px' }}>
                            <div style={{ width: `${d.safetyScore}%`, height: '100%', borderRadius: '3px', background: d.safetyScore >= 85 ? 'var(--green)' : d.safetyScore >= 70 ? 'var(--amber)' : 'var(--red)' }} />
                          </div>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{d.safetyScore}</span>
                        </div>
                      </td>
                      <td><StatusBadge status={d.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

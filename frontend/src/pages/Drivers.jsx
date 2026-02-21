import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Users, Pencil } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const EMPTY = { name: '', licenseExpiryDate: '', safetyScore: 100 };
const STATUSES = ['AVAILABLE', 'ON_DUTY', 'SUSPENDED'];

export default function Drivers() {
  const [drivers,  setDrivers]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const user    = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const canEdit = ['MANAGER', 'SAFETY_OFFICER'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try { setDrivers((await coreApi.get('/api/drivers')).data); }
    catch { setError('Failed to load drivers'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setError(''); setShowForm(true); };
  const openEdit   = (d) => {
    setEditId(d.id);
    setForm({
      name: d.name,
      licenseExpiryDate: d.licenseExpiryDate.split('T')[0],
      safetyScore: d.safetyScore,
    });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId) {
        await coreApi.patch(`/api/drivers/${editId}`, form);
      } else {
        await coreApi.post('/api/drivers', form);
      }
      setShowForm(false); setForm(EMPTY); setEditId(null); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save driver'); }
    finally { setSaving(false); }
  };

  const handleStatusChange = async (driverId, newStatus) => {
    try { await coreApi.patch(`/api/drivers/${driverId}`, { status: newStatus }); load(); }
    catch (err) { setError(err.response?.data?.error || 'Status update failed'); }
  };

  const isExpired = (date) => new Date(date) < new Date();

  const statusColor = {
    AVAILABLE: { bg: 'var(--green-bg)',  color: 'var(--green)' },
    ON_DUTY:   { bg: 'var(--blue-bg)',   color: 'var(--accent)' },
    SUSPENDED: { bg: 'var(--red-bg)',    color: 'var(--red)' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Driver Management</h2>
          <p className="page-subtitle">{drivers.length} registered drivers</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
          {canEdit && (
            <button className="btn-primary" onClick={openCreate}><Plus size={15} />Add Driver</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: '0.8125rem', background: 'var(--red-bg)', padding: '0.625rem 0.875rem', borderRadius: '0.375rem' }}>{error}</div>
      )}

      {/* Add / Edit Form */}
      {showForm && canEdit && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
            {editId ? 'Edit Driver Profile' : 'Register New Driver'}
          </h3>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Ramesh Kumar" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">License Expiry Date</label>
              <input type="date" className="form-input" value={form.licenseExpiryDate} onChange={e => setForm({...form, licenseExpiryDate: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Safety Score (0–100)</label>
              <input type="number" className="form-input" min="0" max="100" placeholder="100" value={form.safetyScore} onChange={e => setForm({...form, safetyScore: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', gridColumn: 'span 3' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
                {saving ? 'Saving...' : editId ? 'Update Driver' : 'Register Driver'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading drivers...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th><th>License Expiry</th><th>Safety Score</th><th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr><td colSpan={canEdit ? 5 : 4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
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
                      {canEdit && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            {/* Status toggle buttons */}
                            {STATUSES.map(s => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(d.id, s)}
                                disabled={d.status === s}
                                style={{
                                  padding: '0.2rem 0.5rem', fontSize: '0.72rem', border: 'none',
                                  borderRadius: '0.3rem', cursor: d.status === s ? 'default' : 'pointer',
                                  background: d.status === s ? statusColor[s].bg : 'var(--bg-hover)',
                                  color: d.status === s ? statusColor[s].color : 'var(--text-muted)',
                                  fontWeight: d.status === s ? 700 : 400,
                                  opacity: d.status === s ? 1 : 0.8,
                                  transition: 'all 0.15s',
                                }}
                              >
                                {s.replace('_', ' ')}
                              </button>
                            ))}
                            <button
                              className="btn-ghost"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => openEdit(d)}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          </div>
                        </td>
                      )}
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

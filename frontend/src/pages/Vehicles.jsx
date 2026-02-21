import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Truck, Pencil, Trash2, XCircle, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const EMPTY = { nameModel: '', licensePlate: '', maxCapacityKg: '', acquisitionCost: '', odometer: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [filter,   setFilter]   = useState('ALL');

  // ConfirmModal state
  const [confirm, setConfirm] = useState({ open: false, vehicleId: null });

  const user    = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const canEdit = ['MANAGER', 'DISPATCHER'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try { setVehicles((await coreApi.get('/api/vehicles')).data); }
    catch { setError('Failed to load vehicles'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setError(''); setShowForm(true); };
  const openEdit   = (v) => {
    setEditId(v.id);
    setForm({ nameModel: v.nameModel, licensePlate: v.licensePlate, maxCapacityKg: v.maxCapacityKg, acquisitionCost: v.acquisitionCost, odometer: v.odometer });
    setError('');
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editId) {
        await coreApi.patch(`/api/vehicles/${editId}`, form);
      } else {
        await coreApi.post('/api/vehicles', form);
      }
      setShowForm(false); setForm(EMPTY); setEditId(null); load();
    } catch (err) { setError(err.response?.data?.error || 'Failed to save vehicle'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    const id = confirm.vehicleId;
    setConfirm({ open: false, vehicleId: null });
    setError('');
    try { await coreApi.delete(`/api/vehicles/${id}`); load(); }
    catch (err) { setError(err.response?.data?.error || 'Delete failed'); }
  };

  const toggleRetired = async (v) => {
    const newStatus = v.status === 'RETIRED' ? 'AVAILABLE' : 'RETIRED';
    try { await coreApi.patch(`/api/vehicles/${v.id}`, { status: newStatus }); load(); }
    catch (err) { setError(err.response?.data?.error || 'Status update failed'); }
  };

  const statusOptions = ['ALL', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
  const filtered = filter === 'ALL' ? vehicles : vehicles.filter(v => v.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirm.open}
        title="Delete Vehicle"
        message="Permanently delete this vehicle? This cannot be undone. You cannot delete a vehicle that has linked trips, maintenance logs, or expenses."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, vehicleId: null })}
      />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Vehicle Registry</h2>
          <p className="page-subtitle">{vehicles.length} vehicles registered in your fleet</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
          {canEdit && (
            <button className="btn-primary" onClick={openCreate}><Plus size={15} />Add Vehicle</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ color: 'var(--red)', fontSize: '0.8125rem', background: 'var(--red-bg)', padding: '0.625rem 0.875rem', borderRadius: '0.375rem' }}>{error}</div>
      )}

      {/* Add / Edit Vehicle Form */}
      {showForm && canEdit && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
            {editId ? 'Edit Vehicle' : 'Register New Vehicle'}
          </h3>
          <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.875rem' }}>
            <div>
              <label className="form-label">Model Name</label>
              <input className="form-input" placeholder="e.g. Toyota HiAce" value={form.nameModel} onChange={e => setForm({...form, nameModel: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">License Plate</label>
              <input className="form-input" placeholder="e.g. MH01AB1234" value={form.licensePlate} onChange={e => setForm({...form, licensePlate: e.target.value})} required disabled={!!editId} style={{ opacity: editId ? 0.6 : 1 }} />
            </div>
            <div>
              <label className="form-label">Max Capacity (kg)</label>
              <input type="number" className="form-input" placeholder="1500" value={form.maxCapacityKg} onChange={e => setForm({...form, maxCapacityKg: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Acquisition Cost (₹)</label>
              <input type="number" className="form-input" placeholder="800000" value={form.acquisitionCost} onChange={e => setForm({...form, acquisitionCost: e.target.value})} required />
            </div>
            <div>
              <label className="form-label">Current Odometer (km)</label>
              <input type="number" className="form-input" placeholder="0" value={form.odometer} onChange={e => setForm({...form, odometer: e.target.value})} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>
                {saving ? 'Saving...' : editId ? 'Update Vehicle' : 'Register Vehicle'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setShowForm(false); setError(''); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.375rem' }}>
        {statusOptions.map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '0.3125rem 0.875rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
            fontSize: '0.78rem', fontWeight: 500,
            background: filter === s ? 'var(--accent)' : 'var(--bg-card)',
            color: filter === s ? '#0d1117' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            {s === 'ALL' ? `All (${vehicles.length})` : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading vehicles...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Model</th><th>License Plate</th><th>Capacity</th>
                  <th>Odometer</th><th>Acquisition Cost</th><th>Status</th>
                  {canEdit && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={canEdit ? 7 : 6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2.5rem' }}>
                    <Truck size={32} style={{ display: 'block', margin: '0 auto 0.5rem', opacity: 0.3 }} />
                    No vehicles found
                  </td></tr>
                ) : filtered.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{v.nameModel}</td>
                    <td><code style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-surface)', padding: '0.2rem 0.5rem', borderRadius: '0.25rem' }}>{v.licensePlate}</code></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.maxCapacityKg.toLocaleString()} kg</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{v.odometer.toLocaleString()} km</td>
                    <td style={{ fontWeight: 600, color: 'var(--amber)' }}>{fmt(v.acquisitionCost)}</td>
                    <td><StatusBadge status={v.status} /></td>
                    {canEdit && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                          <button
                            className="btn-ghost"
                            style={{ padding: '0.25rem 0.625rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            onClick={() => openEdit(v)} title="Edit vehicle"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => toggleRetired(v)}
                            title={v.status === 'RETIRED' ? 'Restore vehicle' : 'Mark as Out of Service'}
                            style={{
                              padding: '0.25rem 0.625rem', fontSize: '0.78rem', border: 'none', cursor: 'pointer',
                              borderRadius: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.25rem',
                              background: v.status === 'RETIRED' ? 'var(--green-bg)' : 'var(--amber-bg)',
                              color: v.status === 'RETIRED' ? 'var(--green)' : 'var(--amber)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {v.status === 'RETIRED'
                              ? <><CheckCircle size={13} /> Restore</>
                              : <><XCircle size={13} /> Retire</>
                            }
                          </button>
                          {user.role === 'MANAGER' && (
                            <button
                              className="btn-danger"
                              style={{ padding: '0.25rem 0.625rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              onClick={() => setConfirm({ open: true, vehicleId: v.id })}
                              title="Delete vehicle permanently"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
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

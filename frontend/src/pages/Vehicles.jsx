import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Truck, Pencil, Trash2, XCircle, CheckCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const EMPTY = { nameModel: '', licensePlate: '', maxCapacityKg: '', acquisitionCost: '', odometer: '' };

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  // ConfirmModal state
  const [confirm, setConfirm] = useState({ open: false, vehicleId: null });

  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const canEdit = ['MANAGER', 'DISPATCHER'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try { setVehicles((await coreApi.get('/api/vehicles')).data); }
    catch { setError('Failed to load vehicles'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(EMPTY); setError(''); setShowForm(true); };
  const openEdit = (v) => {
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
    <div className="flex flex-col gap-5 h-full">

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
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Vehicle Registry</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">{vehicles.length} vehicles registered in your fleet</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer" onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
          {canEdit && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm shadow-sm shadow-blue-600/20 cursor-pointer border-none" onClick={openCreate}>
              <Plus size={15} />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[0.8125rem] font-medium shrink-0">
          {error}
        </div>
      )}

      {/* Add / Edit Vehicle Form */}
      {showForm && canEdit && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 shrink-0">
          <h3 className="text-[0.9375rem] font-bold text-gray-900 m-0 mb-4">
            {editId ? 'Edit Vehicle' : 'Register New Vehicle'}
          </h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Model Name</label>
              <input
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                placeholder="e.g. Toyota HiAce"
                value={form.nameModel}
                onChange={e => setForm({ ...form, nameModel: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">License Plate</label>
              <input
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="e.g. MH01AB1234"
                value={form.licensePlate}
                onChange={e => setForm({ ...form, licensePlate: e.target.value })}
                required
                disabled={!!editId}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Max Capacity (kg)</label>
              <input
                type="number"
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                placeholder="1500"
                value={form.maxCapacityKg}
                onChange={e => setForm({ ...form, maxCapacityKg: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Acquisition Cost (₹)</label>
              <input
                type="number"
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                placeholder="800000"
                value={form.acquisitionCost}
                onChange={e => setForm({ ...form, acquisitionCost: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Current Odometer (km)</label>
              <input
                type="number"
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                placeholder="0"
                value={form.odometer}
                onChange={e => setForm({ ...form, odometer: e.target.value })}
              />
            </div>
            <div className="flex items-end gap-2 mt-1.5 md:mt-0">
              <button
                type="submit"
                className="flex-1 flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm shadow-sm shadow-blue-600/20 cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving...' : editId ? 'Update Vehicle' : 'Register Vehicle'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer"
                onClick={() => { setShowForm(false); setError(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0">
        {statusOptions.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3.5 py-1.5 rounded-full border-none cursor-pointer text-[0.78rem] font-medium transition-all whitespace-nowrap ${filter === s
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            {s === 'ALL' ? `All (${vehicles.length})` : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-400 text-sm">
              Loading vehicles...
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Model</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">License Plate</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Capacity</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Odometer</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Acquisition Cost</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Status</th>
                  {canEdit && <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="text-center text-gray-400 p-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Truck size={32} className="opacity-30 mb-1" />
                        <span className="text-sm">No vehicles found</span>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-[0.8125rem] text-gray-900">
                      {v.nameModel}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="font-mono text-[0.7rem] bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {v.licensePlate}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-600">
                      {v.maxCapacityKg.toLocaleString()} kg
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-600">
                      {v.odometer.toLocaleString()} km
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[0.8125rem] text-yellow-600">
                      {fmt(v.acquisitionCost)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <StatusBadge status={v.status} />
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium rounded text-[0.78rem] transition-colors cursor-pointer"
                            onClick={() => openEdit(v)}
                            title="Edit vehicle"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          <button
                            onClick={() => toggleRetired(v)}
                            title={v.status === 'RETIRED' ? 'Restore vehicle' : 'Mark as Out of Service'}
                            className={`flex items-center gap-1 px-2.5 py-1.5 font-medium rounded text-[0.78rem] transition-colors cursor-pointer border-none ${v.status === 'RETIRED'
                                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                              }`}
                          >
                            {v.status === 'RETIRED' ? <><CheckCircle size={13} /> Restore</> : <><XCircle size={13} /> Retire</>}
                          </button>
                          {user.role === 'MANAGER' && (
                            <button
                              className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-transparent hover:border-red-200 font-medium rounded text-[0.78rem] transition-colors cursor-pointer"
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

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Fuel } from 'lucide-react';
import { coreApi } from '../lib/api';
import ConfirmModal from '../components/ConfirmModal';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const EMPTY = { vehicleId: '', tripId: '', fuelLiters: '', fuelCost: '', date: '' };

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterVehicle, setFilterV] = useState('ALL');
  const [confirm, setConfirm] = useState({ open: false, expenseId: null });

  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
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

  const handleDelete = async () => {
    const id = confirm.expenseId;
    setConfirm({ open: false, expenseId: null });
    try { await coreApi.delete(`/api/expenses/${id}`); load(); }
    catch (err) { setError(err.response?.data?.error || 'Delete failed'); }
  };

  // Compute per-vehicle totals
  const vehicleTotals = vehicles.reduce((acc, v) => {
    const vExp = expenses.filter(e => e.vehicleId === v.id);
    acc[v.id] = {
      fuelLiters: vExp.reduce((s, e) => s + e.fuelLiters, 0).toFixed(1),
      fuelCost: vExp.reduce((s, e) => s + e.fuelCost, 0),
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
    <div className="flex flex-col gap-5 h-full">
      <ConfirmModal
        open={confirm.open}
        title="Delete Fuel Log"
        message="Permanently delete this fuel expense record? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, expenseId: null })}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Fuel & Expense Logs</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            {expenses.length} records · {totalFuel} L consumed · Total: <span className="text-yellow-600 font-medium">{fmt(totalCost)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer" onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
          {canEdit && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm cursor-pointer" onClick={() => setShowForm(!showForm)}>
              <Plus size={15} />
              Log Fuel
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-700 text-[0.8125rem] bg-red-50 px-3.5 py-2.5 rounded-lg border border-red-200 font-medium">
          {error}
        </div>
      )}

      {/* KPI Row — per-vehicle summary */}
      {!loading && vehicles.filter(v => vehicleTotals[v.id]?.fuelCost > 0).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {vehicles.filter(v => vehicleTotals[v.id]?.fuelCost > 0).map(v => (
            <div key={v.id} className="bg-white border border-gray-100 rounded-xl shadow-sm p-3.5 flex flex-col gap-1">
              <div className="text-[0.78rem] text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{v.nameModel}</div>
              <div className="text-lg font-bold text-yellow-600 leading-tight">{fmt(vehicleTotals[v.id].fuelCost)}</div>
              <div className="text-xs text-gray-400 font-medium">{vehicleTotals[v.id].fuelLiters} L total</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Fuel Log Form */}
      {showForm && canEdit && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 pb-6">
          <h3 className="mb-4 font-semibold text-[0.9375rem] text-gray-900 mt-0">Log Fuel Expense</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Vehicle</label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">Select vehicle</option>
                {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.nameModel} · {v.licensePlate}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Trip (optional)</label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none" value={form.tripId} onChange={e => setForm({ ...form, tripId: e.target.value })}>
                <option value="">No trip link</option>
                {trips.filter(t => !form.vehicleId || t.vehicleId === Number(form.vehicleId)).map(t => (
                  <option key={t.id} value={t.id}>#{t.id} · {t.vehicle?.nameModel || ''} ({t.status})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Fuel (Liters)</label>
              <input type="number" step="0.1" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="50.5" value={form.fuelLiters} onChange={e => setForm({ ...form, fuelLiters: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Cost (₹)</label>
              <input type="number" step="0.01" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" placeholder="4700" value={form.fuelCost} onChange={e => setForm({ ...form, fuelCost: e.target.value })} required />
            </div>
            <div>
              <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Date</label>
              <input type="date" className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="flex items-end gap-2 md:col-span-3 lg:col-span-2 pt-2">
              <button type="submit" className="flex-1 flex justify-center items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm cursor-pointer disabled:opacity-50" disabled={saving}>
                <Fuel size={14} />{saving ? 'Saving...' : 'Log Expense'}
              </button>
              <button type="button" className="flex justify-center items-center px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm cursor-pointer" onClick={() => { setShowForm(false); setError(''); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicle filter */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setFilterV('ALL')} className={`px-3.5 py-1.5 rounded-full border-none cursor-pointer text-xs font-medium transition-colors ${filterVehicle === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
          All ({expenses.length})
        </button>
        {vehicles.filter(v => vehicleTotals[v.id]?.fuelCost > 0).map(v => (
          <button key={v.id} onClick={() => setFilterV(String(v.id))} className={`px-3.5 py-1.5 rounded-full border-none cursor-pointer text-xs font-medium transition-colors ${filterVehicle === String(v.id) ? 'bg-yellow-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {v.nameModel.split(' ')[0]} ({expenses.filter(e => e.vehicleId === v.id).length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="overflow-y-auto overflow-x-auto flex-1">
          {loading ? (
            <div className="text-center p-12 text-gray-500">Loading expenses...</div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Trip</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Fuel (L)</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Fuel Cost</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Rate (₹/L)</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Date</th>
                  {canEdit && <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 7 : 6} className="text-center text-gray-500 p-10">
                      <Fuel size={32} className="block mx-auto mb-2 opacity-30" />
                      No fuel logs found. Log your first fuel expense above.
                    </td>
                  </tr>
                ) : filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none">
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-sm text-gray-900">{e.vehicle?.nameModel ?? `V#${e.vehicleId}`}</div>
                      <div className="text-[0.7rem] text-gray-500 mt-0.5">{e.vehicle?.licensePlate}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                      {e.trip ? <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-medium">#{e.tripId}</span> : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-blue-600 text-sm">{e.fuelLiters.toFixed(1)} L</td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-yellow-600 text-sm">{fmt(e.fuelCost)}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-[0.8125rem] font-medium">
                      {e.fuelLiters > 0 ? `₹${(e.fuelCost / e.fuelLiters).toFixed(1)}/L` : '—'}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 text-[0.8125rem]">
                      {new Date(e.date).toLocaleDateString('en-IN')}
                    </td>
                    {canEdit && (
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <button className="px-3 py-1 bg-red-50 text-red-700 hover:bg-red-100 transition-colors rounded-lg text-xs font-medium cursor-pointer" onClick={() => setConfirm({ open: true, expenseId: e.id })}>
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
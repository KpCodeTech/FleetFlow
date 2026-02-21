import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Wrench } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
const EMPTY = { vehicleId: '', description: '', cost: '', date: '' };

export default function Maintenance() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const canEdit = ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'].includes(user.role);

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
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Maintenance Logs</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">
            {logs.length} records · Total cost: <span className="font-semibold text-yellow-600">{fmt(totalCost)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer" onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
          {canEdit && (
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm shadow-sm shadow-blue-600/20 cursor-pointer border-none" onClick={() => setShowForm(!showForm)}>
              <Plus size={15} />
              Log Maintenance
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 shrink-0">
          <h3 className="text-[0.9375rem] font-bold text-gray-900 m-0 mb-4 flex items-center gap-2">
            Create Maintenance Log
            <span className="text-xs font-normal text-yellow-600">(Vehicle will be set to IN_SHOP automatically)</span>
          </h3>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-[0.8125rem] font-medium mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Vehicle</label>
              <select
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={form.vehicleId}
                onChange={e => setForm({ ...form, vehicleId: e.target.value })}
                required
              >
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.nameModel} · {v.licensePlate}</option>)}
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Description</label>
              <input
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                placeholder="e.g. Engine overhaul, tyre replacement..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Cost (₹)</label>
              <input
                type="number"
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm placeholder:text-gray-400"
                placeholder="35000"
                value={form.cost}
                onChange={e => setForm({ ...form, cost: e.target.value })}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-semibold text-gray-700">Date</label>
              <input
                type="date"
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            <div className="md:col-span-2 flex items-end gap-2 mt-1.5 md:mt-0">
              <button
                type="submit"
                className="flex-1 flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all text-sm shadow-sm shadow-blue-600/20 cursor-pointer border-none disabled:opacity-70 disabled:cursor-not-allowed"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Create Log'}
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

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-gray-400 text-sm">
              Loading maintenance logs...
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Plate</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Description</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Cost</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Date</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-gray-400 p-10">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Wrench size={32} className="opacity-30 mb-1" />
                        <span className="text-sm">No maintenance records found</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap font-semibold text-[0.8125rem] text-gray-900">
                      {l.vehicle?.nameModel ?? `V#${l.vehicleId}`}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <code className="font-mono text-[0.7rem] bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {l.vehicle?.licensePlate ?? '—'}
                      </code>
                    </td>
                    <td className="px-5 py-3.5 text-[0.8125rem] text-gray-600 max-w-[300px] truncate" title={l.description}>
                      {l.description}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[0.8125rem] text-yellow-600">
                      {fmt(l.cost)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-500">
                      {new Date(l.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {l.vehicle && <StatusBadge status={l.vehicle.status} />}
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
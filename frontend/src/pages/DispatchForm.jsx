
import { useEffect, useState } from 'react';
import { Send, AlertCircle, CheckCircle, AlertTriangle, Truck, Users } from 'lucide-react';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function DispatchForm() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [form, setForm] = useState({ vehicleId: '', driverId: '', cargoWeight: '', revenue: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [result, setResult] = useState(null); // { type: 'success'|'error', message }

  useEffect(() => {
    const init = async () => {
      try {
        const [vRes, dRes] = await Promise.all([coreApi.get('/api/vehicles'), coreApi.get('/api/drivers')]);
        // Only show AVAILABLE vehicles and drivers (business rule enforced on frontend too)
        setVehicles(vRes.data.filter(v => v.status === 'AVAILABLE'));
        setDrivers(dRes.data.filter(d => d.status === 'AVAILABLE'));
      } catch { setResult({ type: 'error', message: 'Failed to load vehicles/drivers.' }); }
      finally { setLoading(false); }
    };
    init();
  }, []);

  const selectedVehicle = vehicles.find(v => v.id === Number(form.vehicleId));
  const selectedDriver = drivers.find(d => d.id === Number(form.driverId));
  const overloaded = selectedVehicle && form.cargoWeight && Number(form.cargoWeight) > selectedVehicle.maxCapacityKg;
  const isExpiredDriver = selectedDriver && new Date(selectedDriver.licenseExpiryDate) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setResult(null);
    try {
      const { data } = await coreApi.post('/api/trips/dispatch', {
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
        cargoWeight: Number(form.cargoWeight),
        revenue: Number(form.revenue || 0),
      });
      setResult({ type: 'success', message: `✅ Trip #${data.trip.id} dispatched! ${data.trip.vehicle.nameModel} → ${data.trip.driver.name}` });
      setForm({ vehicleId: '', driverId: '', cargoWeight: '', revenue: '' });
      // Refresh available lists
      const [vRes, dRes] = await Promise.all([coreApi.get('/api/vehicles'), coreApi.get('/api/drivers')]);
      setVehicles(vRes.data.filter(v => v.status === 'AVAILABLE'));
      setDrivers(dRes.data.filter(d => d.status === 'AVAILABLE'));
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Dispatch failed.' });
    } finally { setSubmitting(false); }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true); setResult(null);
    try {
      const { data } = await coreApi.post('/api/trips', {
        vehicleId: Number(form.vehicleId),
        driverId: Number(form.driverId),
        cargoWeight: Number(form.cargoWeight),
        revenue: Number(form.revenue || 0),
      });
      setResult({ type: 'success', message: `📝 Trip #${data.trip.id} saved as draft!` });
      setForm({ vehicleId: '', driverId: '', cargoWeight: '', revenue: '' });
    } catch (err) {
      setResult({ type: 'error', message: err.response?.data?.error || 'Failed to save draft.' });
    } finally { setSavingDraft(false); }
  };

  const canSubmit = form.vehicleId && form.driverId && form.cargoWeight && !overloaded && !isExpiredDriver;

  return (
    <div className="flex flex-col gap-5 max-w-[760px]">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Dispatch Center</h2>
        <p className="text-sm text-gray-500 mt-1 mb-0">Assign an available vehicle and driver to a new trip</p>
      </div>

      {/* Result Banner */}
      {result && (
        <div className={`flex items-start gap-2.5 px-4 py-3.5 rounded-lg text-sm font-medium border ${result.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
          {result.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {result.message}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6">
        {loading ? (
          <div className="text-center p-8 text-gray-500">Loading fleet data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Vehicle Select */}
            <div>
              <label className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-gray-700 mb-1.5">
                <Truck size={14} /> Vehicle <span className="text-green-600 text-[0.7rem] font-bold">({vehicles.length} available)</span>
              </label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">-- Select an available vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.nameModel} · {v.licensePlate} · Cap: {v.maxCapacityKg} kg
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <div className="mt-2 px-3.5 py-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 flex gap-6">
                  <span>📦 Max Capacity: <strong className="text-gray-900 font-semibold">{selectedVehicle.maxCapacityKg} kg</strong></span>
                  <span>🛣 Odometer: <strong className="text-gray-900 font-semibold">{selectedVehicle.odometer.toLocaleString()} km</strong></span>
                </div>
              )}
            </div>

            {/* Driver Select */}
            <div>
              <label className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-gray-700 mb-1.5">
                <Users size={14} /> Driver <span className="text-green-600 text-[0.7rem] font-bold">({drivers.length} available)</span>
              </label>
              <select className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all appearance-none" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })} required>
                <option value="">-- Select an available driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} · Safety: {d.safetyScore} · Expires: {new Date(d.licenseExpiryDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {isExpiredDriver && (
                <div className="mt-2 flex items-center gap-2 text-red-600 text-xs font-medium">
                  <AlertCircle size={14} /> License expired on {new Date(selectedDriver.licenseExpiryDate).toLocaleDateString()} — cannot dispatch
                </div>
              )}
            </div>

            {/* Cargo & Revenue */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Cargo Weight (kg)</label>
                <input type="number"
                  className={`w-full bg-gray-50 border ${overloaded ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500'} text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:outline-none transition-all`}
                  placeholder="e.g. 1200" min="1"
                  value={form.cargoWeight} onChange={e => setForm({ ...form, cargoWeight: e.target.value })} required
                />
                {overloaded && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-red-600 text-xs font-medium">
                    <AlertTriangle size={14} />
                    Exceeds vehicle max capacity!
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[0.8125rem] font-medium text-gray-700 mb-1.5">Expected Revenue (₹)</label>
                <input type="number"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg px-3.5 py-2.5 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                  placeholder="e.g. 15000" min="0"
                  value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button type="submit"
                className={`flex justify-center items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all sm:w-auto w-full ${(!canSubmit || submitting || savingDraft) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canSubmit || submitting || savingDraft}
              >
                <Send size={16} />
                {submitting ? 'Dispatching...' : 'Dispatch Trip'}
              </button>

              <button type="button"
                className={`flex justify-center items-center px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all sm:w-auto w-full ${(!canSubmit || submitting || savingDraft) ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canSubmit || submitting || savingDraft} onClick={handleSaveDraft}
              >
                {savingDraft ? 'Saving...' : 'Save as Draft'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
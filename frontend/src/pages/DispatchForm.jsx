import { useEffect, useState } from 'react';
import { Send, AlertCircle, CheckCircle, AlertTriangle, Truck, Users } from 'lucide-react';
import { coreApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function DispatchForm() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers,  setDrivers]  = useState([]);
  const [form, setForm] = useState({ vehicleId: '', driverId: '', cargoWeight: '', revenue: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
  const selectedDriver  = drivers.find(d => d.id === Number(form.driverId));
  const overloaded = selectedVehicle && form.cargoWeight && Number(form.cargoWeight) > selectedVehicle.maxCapacityKg;
  const isExpiredDriver = selectedDriver && new Date(selectedDriver.licenseExpiryDate) < new Date();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setResult(null);
    try {
      const { data } = await coreApi.post('/api/trips/dispatch', {
        vehicleId:   Number(form.vehicleId),
        driverId:    Number(form.driverId),
        cargoWeight: Number(form.cargoWeight),
        revenue:     Number(form.revenue || 0),
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

  const canSubmit = form.vehicleId && form.driverId && form.cargoWeight && !overloaded && !isExpiredDriver;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '760px' }}>
      <div>
        <h2 className="page-title">Dispatch Center</h2>
        <p className="page-subtitle">Assign an available vehicle and driver to a new trip</p>
      </div>

      {/* Result Banner */}
      {result && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.875rem 1rem',
          borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 500,
          background: result.type === 'success' ? 'var(--green-bg)' : 'var(--red-bg)',
          color:      result.type === 'success' ? 'var(--green)'    : 'var(--red)',
          border: `1px solid ${result.type === 'success' ? 'var(--green)' : 'var(--red)'}`,
        }}>
          {result.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {result.message}
        </div>
      )}

      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading fleet data...</div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Vehicle Select */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Truck size={14} /> Vehicle <span style={{ color: 'var(--green)', fontSize: '0.7rem', fontWeight: 600 }}>({vehicles.length} available)</span>
              </label>
              <select className="form-input" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })} required>
                <option value="">-- Select an available vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.nameModel} · {v.licensePlate} · Cap: {v.maxCapacityKg} kg
                  </option>
                ))}
              </select>
              {selectedVehicle && (
                <div style={{ marginTop: '0.5rem', padding: '0.625rem 0.875rem', background: 'var(--bg-surface)', borderRadius: '0.375rem', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem' }}>
                  <span>📦 Max Capacity: <strong style={{ color: 'var(--text-primary)' }}>{selectedVehicle.maxCapacityKg} kg</strong></span>
                  <span>🛣 Odometer: <strong style={{ color: 'var(--text-primary)' }}>{selectedVehicle.odometer.toLocaleString()} km</strong></span>
                </div>
              )}
            </div>

            {/* Driver Select */}
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Users size={14} /> Driver <span style={{ color: 'var(--green)', fontSize: '0.7rem', fontWeight: 600 }}>({drivers.length} available)</span>
              </label>
              <select className="form-input" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })} required>
                <option value="">-- Select an available driver --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} · Safety: {d.safetyScore} · Expires: {new Date(d.licenseExpiryDate).toLocaleDateString()}
                  </option>
                ))}
              </select>
              {isExpiredDriver && (
                <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--red)', fontSize: '0.8rem' }}>
                  <AlertCircle size={14} /> License expired on {new Date(selectedDriver.licenseExpiryDate).toLocaleDateString()} — cannot dispatch
                </div>
              )}
            </div>

            {/* Cargo & Revenue */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Cargo Weight (kg)</label>
                <input type="number" className="form-input" placeholder="e.g. 1200" min="1"
                  value={form.cargoWeight} onChange={e => setForm({ ...form, cargoWeight: e.target.value })} required
                  style={{ borderColor: overloaded ? 'var(--red)' : undefined }}
                />
                {overloaded && (
                  <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--red)', fontSize: '0.79rem' }}>
                    <AlertTriangle size={14} />
                    Exceeds vehicle max capacity of {selectedVehicle.maxCapacityKg} kg!
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">Expected Revenue (₹)</label>
                <input type="number" className="form-input" placeholder="e.g. 15000" min="0"
                  value={form.revenue} onChange={e => setForm({ ...form, revenue: e.target.value })}
                />
              </div>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary" disabled={!canSubmit || submitting}
              style={{ alignSelf: 'flex-start', padding: '0.6875rem 1.75rem', fontSize: '0.9375rem', opacity: (!canSubmit || submitting) ? 0.5 : 1 }}
            >
              <Send size={16} />
              {submitting ? 'Dispatching...' : 'Dispatch Trip'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

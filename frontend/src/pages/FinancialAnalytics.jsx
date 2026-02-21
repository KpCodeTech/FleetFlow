import { useEffect, useState } from 'react';
import { Download, RefreshCw, TrendingUp, Fuel, BarChart3 } from 'lucide-react';
import { analyticsApi } from '../lib/api';

const fmt   = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);
const pct   = (n) => `${n != null ? n.toFixed(2) : '—'}%`;

export default function FinancialAnalytics() {
  const [roiData,  setRoiData]  = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [exporting, setExporting] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [roiRes, fuelRes] = await Promise.all([
        analyticsApi.get('/analytics/all-roi'),
        analyticsApi.get('/analytics/fuel-efficiency'),
      ]);
      setRoiData(roiRes.data);
      setFuelData(fuelRes.data);
    } catch (e) {
      setError('Analytics API unavailable. Ensure backend-analytics is running on port 8000.');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res   = await analyticsApi.get('/analytics/export', { responseType: 'blob' });
      const url   = window.URL.createObjectURL(new Blob([res.data]));
      const link  = document.createElement('a');
      link.href   = url;
      link.setAttribute('download', `fleetflow_audit_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { alert('Export failed. Is the analytics API running?'); }
    finally { setExporting(false); }
  };

  const totalRevenue = roiData.reduce((s, r) => s + (r.totalRevenue || 0), 0);
  const totalCosts   = roiData.reduce((s, r) => s + (r.totalCosts   || 0), 0);
  const totalProfit  = roiData.reduce((s, r) => s + (r.netProfit    || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 className="page-title">Financial Analytics</h2>
          <p className="page-subtitle">ROI, fuel efficiency, and fleet audit · Powered by FastAPI (port 8000)</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
          <button className="btn-primary" onClick={handleExport} disabled={exporting}>
            <Download size={15} />{exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: '0.5rem', color: 'var(--amber)', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        /* Summary Row */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Revenue', value: fmt(totalRevenue), color: 'var(--green)',  icon: <TrendingUp size={18} /> },
            { label: 'Total Costs',   value: fmt(totalCosts),   color: 'var(--red)',    icon: <BarChart3 size={18} /> },
            { label: 'Net Profit',    value: fmt(totalProfit),  color: totalProfit >= 0 ? 'var(--green)' : 'var(--red)', icon: <TrendingUp size={18} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className="card" style={{ padding: '1.125rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: '1.375rem', fontWeight: 800, color, letterSpacing: '-0.025em' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-Column Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* ROI Table */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Vehicle ROI</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div> : (
              <table className="data-table">
                <thead><tr><th>Vehicle</th><th>Revenue</th><th>Costs</th><th>ROI</th></tr></thead>
                <tbody>
                  {roiData.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No data available</td></tr>
                  ) : roiData.map((r) => (
                    <tr key={r.vehicleId}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8375rem' }}>{r.nameModel}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{r.licensePlate}</div>
                      </td>
                      <td style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.8375rem' }}>{fmt(r.totalRevenue)}</td>
                      <td style={{ color: 'var(--red)', fontSize: '0.8375rem' }}>{fmt(r.totalCosts)}</td>
                      <td>
                        <span style={{
                          fontWeight: 700, fontSize: '0.875rem',
                          color: r.roiPercent >= 0 ? 'var(--green)' : 'var(--red)',
                        }}>
                          {pct(r.roiPercent)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Fuel Efficiency Table */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fuel size={16} style={{ color: 'var(--amber)' }} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Fuel Efficiency</span>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div> : (
              <table className="data-table">
                <thead><tr><th>Vehicle</th><th>Fuel Used</th><th>Fuel Cost</th><th>km/L</th></tr></thead>
                <tbody>
                  {fuelData.length === 0 ? (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No fuel data</td></tr>
                  ) : fuelData.map((f) => (
                    <tr key={f.vehicleId}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8375rem' }}>{f.nameModel}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{f.licensePlate}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8375rem' }}>{f.totalFuelLiters} L</td>
                      <td style={{ color: 'var(--amber)', fontSize: '0.8375rem' }}>{fmt(f.totalFuelCost)}</td>
                      <td>
                        <span style={{ fontWeight: 700, color: f.kmPerLiter ? (f.kmPerLiter >= 12 ? 'var(--green)' : f.kmPerLiter >= 8 ? 'var(--amber)' : 'var(--red)') : 'var(--text-muted)' }}>
                          {f.kmPerLiter != null ? `${f.kmPerLiter} km/L` : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

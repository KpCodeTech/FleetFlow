import { useEffect, useState } from 'react';
import { 
  Download, FileText, RefreshCw, TrendingUp, Fuel, 
  BarChart3, Users, AlertTriangle, PackageSearch, 
  ChevronRight, ArrowUpRight, History
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { analyticsApi } from '../lib/api';

const fmt   = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);
const pct   = (n) => `${n != null ? n.toFixed(2) : '—'}%`;

export default function FinancialAnalytics() {
  const [roiData,  setRoiData]     = useState([]);
  const [fuelData, setFuelData]    = useState([]);
  const [deadStock, setDeadStock]  = useState([]);
  const [summary, setSummary]      = useState(null);
  const [loading,  setLoading]     = useState(true);
  const [error,    setError]       = useState('');
  
  const [exporting,        setExporting]       = useState(false);
  const [exportingPdf,     setExportingPdf]    = useState(false);
  const [exportingPayroll, setExportingPayroll]= useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [roiRes, fuelRes, deadRes, sumRes] = await Promise.all([
        analyticsApi.get('/analytics/all-roi'),
        analyticsApi.get('/analytics/fuel-efficiency'),
        analyticsApi.get('/analytics/dead-stock'),
        analyticsApi.get('/analytics/summary'),
      ]);
      setRoiData(roiRes.data);
      setFuelData(fuelRes.data);
      setDeadStock(deadRes.data);
      setSummary(sumRes.data);
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
    } catch { setError('Export failed.'); }
    finally { setExporting(false); }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const res  = await analyticsApi.get('/analytics/export-pdf', { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `fleetflow_audit_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { setError('PDF export failed.'); }
    finally { setExportingPdf(false); }
  };

  const handleExportPayroll = async () => {
    setExportingPayroll(true);
    try {
      const res  = await analyticsApi.get('/analytics/export-payroll', { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `fleetflow_payroll_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { setError('Payroll export failed.'); }
    finally { setExportingPayroll(false); }
  };

  // Preparation for charts
  const topRoiData = [...roiData]
    .sort((a, b) => b.roiPercent - a.roiPercent)
    .slice(0, 5)
    .map(d => ({ name: d.nameModel.split(' ')[0], roi: d.roiPercent, full: d.nameModel }));

  const topFuelData = [...fuelData]
    .filter(f => f.kmPerLiter != null)
    .sort((a, b) => b.kmPerLiter - a.kmPerLiter)
    .slice(0, 5)
    .map(d => ({ name: d.nameModel.split(' ')[0], economy: d.kmPerLiter, full: d.nameModel }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', overflowY: 'auto', paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 className="page-title">Executive Analytics</h2>
          <p className="page-subtitle">Data-driven fleet intelligence & financial performance</p>
        </div>
        <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh Data</button>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--amber-bg)', border: '1px solid var(--amber)', borderRadius: '0.5rem', color: 'var(--amber)', fontSize: '0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Main KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Total Revenue', value: fmt(summary?.financials?.totalRevenue), color: 'var(--green)', icon: <TrendingUp size={18} /> },
              { label: 'Net Profit',    value: fmt(summary?.financials?.netProfit),  color: 'var(--accent)', icon: <ArrowUpRight size={18} /> },
              { label: 'Fuel Costs',    value: fmt(summary?.financials?.totalFuelCost),   color: 'var(--amber)', icon: <Fuel size={18} /> },
              { label: 'Idle Fleet',    value: summary?.fleet?.deadStockCount || 0, color: 'var(--red)', icon: <PackageSearch size={18} />, unit: 'Vehicles' },
            ].map(({ label, value, color, icon, unit }) => (
              <div key={label} className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '0.75rem', background: `color-mix(in srgb, ${color} 12%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, marginBottom: '0.125rem' }}>{label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                    {value} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>{unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            {/* Charts Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* ROI Leaderboard Chart */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TrendingUp size={16} style={{ color: 'var(--green)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Top ROI Vehicles (%)</span>
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topRoiData} layout="vertical" margin={{ left: -20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <Tooltip 
                          cursor={{ fill: 'var(--bg-card)', opacity: 0.4 }}
                          contentStyle={{ background: '#161b22', border: '1px solid var(--border)', borderRadius: '8px' }}
                          labelStyle={{ color: 'var(--text-muted)', fontSize: '10px' }}
                        />
                        <Bar dataKey="roi" radius={[0, 4, 4, 0]} barSize={20}>
                          {topRoiData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.roi > 50 ? 'var(--green)' : 'var(--accent)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fuel efficiency Leaderboard Chart */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Fuel size={16} style={{ color: 'var(--amber)' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fuel Efficiency (km/L)</span>
                    </div>
                  </div>
                  <div style={{ height: '220px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFuelData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <Tooltip 
                          cursor={{ fill: 'var(--bg-card)', opacity: 0.4 }}
                          contentStyle={{ background: '#161b22', border: '1px solid var(--border)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="economy" fill="var(--amber)" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* All Data Tables (Simplified) */}
              <div className="card" style={{ padding: '0 1.25rem' }}>
                <div style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={16} style={{ color: 'var(--text-muted)' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Fleet Performance Audit</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead><tr><th>Vehicle</th><th>Revenue</th><th>Fuel Econ</th><th>ROI Status</th></tr></thead>
                    <tbody>
                      {roiData.slice(0, 10).map((r) => {
                        const f = fuelData.find(x => x.vehicleId === r.vehicleId);
                        return (
                          <tr key={r.vehicleId}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{r.nameModel}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{r.licensePlate}</div>
                            </td>
                            <td style={{ fontSize: '0.8125rem' }}>{fmt(r.totalRevenue)}</td>
                            <td style={{ fontSize: '0.8125rem' }}>{f?.kmPerLiter ? `${f.kmPerLiter} km/L` : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '40px', height: '6px', background: 'var(--bg-card)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${Math.min(100, Math.max(0, r.roiPercent))}%`, height: '100%', background: r.roiPercent > 0 ? 'var(--green)' : 'var(--red)' }}></div>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.75rem', color: r.roiPercent >= 0 ? 'var(--green)' : 'var(--red)' }}>{pct(r.roiPercent)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Alerts & Report Center */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Dead Stock Alert Panel */}
              <div className="card" style={{ border: '1px solid var(--red-bg)', background: 'color-mix(in srgb, var(--red) 3%, #0d1117)' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.625rem', color: 'var(--red)' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Dead Stock Alerts</span>
                  <span style={{ marginLeft: 'auto', background: 'var(--red)', color: 'white', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{deadStock.length}</span>
                </div>
                <div style={{ padding: '0.5rem' }}>
                  {deadStock.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Fleet is fully utilized.</div>
                  ) : deadStock.map(v => (
                    <div key={v.vehicleId} style={{ padding: '0.75rem', borderRadius: '6px', marginBottom: '0.25rem', transition: 'background 0.2s' }} className="hover-target">
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{v.nameModel}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{v.licensePlate}</span>
                        <span style={{ color: 'var(--red)', fontSize: '0.75rem', fontWeight: 600 }}>{v.daysIdle === 999 ? 'Never Dispatched' : `Idle ${v.daysIdle} days`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Reports Command Center */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={14} /> GENERATE REPORTS
                </h3>
                
                <button 
                  onClick={handleExportPdf} disabled={exportingPdf}
                  style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--accent)', color: '#0d1117', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'transform 0.2s', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileText size={20} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{exportingPdf ? 'Generating...' : 'Monthly Audit PDF'}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Full financial & status breakdown</div>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <button 
                    onClick={handleExportPayroll} disabled={exportingPayroll}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    className="btn-card-hover"
                  >
                    <Users size={20} style={{ color: 'var(--purple)' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Payroll CSV</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Driver statistics</div>
                  </button>

                  <button 
                    onClick={handleExport} disabled={exporting}
                    style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', borderRadius: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    className="btn-card-hover"
                  >
                    <History size={20} style={{ color: 'var(--green)' }} />
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Fleet Audit CSV</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Inventory logs</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


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

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);
const pct = (n) => `${n != null ? n.toFixed(2) : '—'}%`;

export default function FinancialAnalytics() {
  const [roiData, setRoiData] = useState([]);
  const [fuelData, setFuelData] = useState([]);
  const [deadStock, setDeadStock] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingPayroll, setExportingPayroll] = useState(false);

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
      const res = await analyticsApi.get('/analytics/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
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
      const res = await analyticsApi.get('/analytics/export-pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
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
      const res = await analyticsApi.get('/analytics/export-payroll', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
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
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-8">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight m-0">Executive Analytics</h2>
          <p className="text-sm text-gray-500 mt-1 mb-0">Data-driven fleet intelligence & financial performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all text-sm shadow-sm cursor-pointer" onClick={load}>
          <RefreshCw size={15} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Main KPI Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: fmt(summary?.financials?.totalRevenue), colorClass: 'text-green-600', bgClass: 'bg-green-50', icon: <TrendingUp size={18} /> },
              { label: 'Net Profit', value: fmt(summary?.financials?.netProfit), colorClass: 'text-blue-600', bgClass: 'bg-blue-50', icon: <ArrowUpRight size={18} /> },
              { label: 'Fuel Costs', value: fmt(summary?.financials?.totalFuelCost), colorClass: 'text-yellow-600', bgClass: 'bg-yellow-50', icon: <Fuel size={18} /> },
              { label: 'Idle Fleet', value: summary?.fleet?.deadStockCount || 0, colorClass: 'text-red-600', bgClass: 'bg-red-50', icon: <PackageSearch size={18} />, unit: 'Vehicles' },
            ].map(({ label, value, colorClass, bgClass, icon, unit }) => (
              <div key={label} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgClass} ${colorClass}`}>
                  {icon}
                </div>
                <div>
                  <div className="text-[0.78rem] text-gray-500 font-medium mb-0.5">{label}</div>
                  <div className="text-xl font-bold text-gray-900 tracking-tight">
                    {value} {unit && <span className="text-xs font-normal text-gray-500">{unit}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Charts Section - Takes up 2/3 width on xl screens */}
            <div className="xl:col-span-2 flex flex-col gap-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* ROI Leaderboard Chart */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-green-600" />
                      <span className="font-semibold text-sm text-gray-900">Top ROI Vehicles (%)</span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topRoiData} layout="vertical" margin={{ left: -20, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <Tooltip
                          cursor={{ fill: '#f9fafb' }}
                          contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                          labelStyle={{ color: '#4b5563', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}
                          itemStyle={{ color: '#111827', fontSize: '12px' }}
                        />
                        <Bar dataKey="roi" radius={[0, 4, 4, 0]} barSize={20}>
                          {topRoiData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.roi > 50 ? '#10b981' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Fuel efficiency Leaderboard Chart */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Fuel size={16} className="text-yellow-600" />
                      <span className="font-semibold text-sm text-gray-900">Fuel Efficiency (km/L)</span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topFuelData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                        <Tooltip
                          cursor={{ fill: '#f9fafb' }}
                          contentStyle={{ background: '#ffffff', border: '1px solid #f3f4f6', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
                          labelStyle={{ color: '#4b5563', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}
                          itemStyle={{ color: '#111827', fontSize: '12px' }}
                        />
                        <Bar dataKey="economy" fill="#eab308" radius={[4, 4, 0, 0]} barSize={25} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* All Data Tables (Simplified) */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm pb-1">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <BarChart3 size={16} className="text-gray-400" />
                  <span className="font-semibold text-sm text-gray-900">Fleet Performance Audit</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Revenue</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Fuel Econ</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">ROI Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roiData.slice(0, 10).map((r) => {
                        const f = fuelData.find(x => x.vehicleId === r.vehicleId);
                        return (
                          <tr key={r.vehicleId} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="font-semibold text-[0.8125rem] text-gray-900">{r.nameModel}</div>
                              <div className="text-gray-500 text-[0.7rem]">{r.licensePlate}</div>
                            </td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-700">{fmt(r.totalRevenue)}</td>
                            <td className="px-5 py-3.5 whitespace-nowrap text-[0.8125rem] text-gray-700">{f?.kmPerLiter ? `${f.kmPerLiter} km/L` : '—'}</td>
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${r.roiPercent > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, r.roiPercent))}%` }}></div>
                                </div>
                                <span className={`font-bold text-xs ${r.roiPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{pct(r.roiPercent)}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Fuel Efficiency Table (Restored) */}
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm pb-1">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                  <Fuel size={16} className="text-yellow-600" />
                  <span className="font-semibold text-sm text-gray-900">Detailed Fuel Efficiency</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Fuel Used</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Fuel Cost</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">km/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fuelData.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-gray-500 p-8">No fuel data</td></tr>
                      ) : fuelData.map((f) => (
                        <tr key={f.vehicleId} className="border-b border-gray-50 last:border-none hover:bg-gray-50/50">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="font-semibold text-[0.8125rem] text-gray-900">{f.nameModel}</div>
                            <div className="text-gray-500 text-[0.7rem]">{f.licensePlate}</div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 text-[0.8125rem]">{f.totalFuelLiters} L</td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-yellow-600 font-medium text-[0.8125rem]">{fmt(f.totalFuelCost)}</td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className={`font-bold text-[0.8125rem] ${f.kmPerLiter ? (f.kmPerLiter >= 12 ? 'text-green-600' : f.kmPerLiter >= 8 ? 'text-yellow-600' : 'text-red-600') : 'text-gray-400'}`}>
                              {f.kmPerLiter != null ? `${f.kmPerLiter} km/L` : '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar Alerts & Report Center - Takes up 1/3 width on xl screens */}
            <div className="flex flex-col gap-5">
              {/* Dead Stock Alert Panel */}
              <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-red-100 flex items-center gap-2.5 text-red-700">
                  <AlertTriangle size={18} />
                  <span className="font-bold text-[0.85rem]">Dead Stock Alerts</span>
                  <span className="ml-auto bg-red-600 text-white px-1.5 py-0.5 rounded text-[0.7rem] font-medium">{deadStock.length}</span>
                </div>
                <div className="p-2">
                  {deadStock.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-[0.8rem]">Fleet is fully utilized.</div>
                  ) : deadStock.map(v => (
                    <div key={v.vehicleId} className="p-3 bg-white/60 hover:bg-white rounded-lg mb-1 transition-colors border border-transparent hover:border-red-100">
                      <div className="font-semibold text-[0.8125rem] text-gray-900">{v.nameModel}</div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-gray-500 text-xs">{v.licensePlate}</span>
                        <span className="text-red-600 text-xs font-semibold">{v.daysIdle === 999 ? 'Never Dispatched' : `Idle ${v.daysIdle} days`}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Reports Command Center */}
              <div className="flex flex-col gap-3">
                <h3 className="text-[0.85rem] font-bold text-gray-500 ml-1 flex items-center gap-2 uppercase tracking-wide">
                  <FileText size={14} /> GENERATE REPORTS
                </h3>

                <button
                  onClick={handleExportPdf} disabled={exportingPdf}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 text-white border-none cursor-pointer text-left transition-all shadow-sm shadow-blue-600/20"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-[0.9rem]">{exportingPdf ? 'Generating...' : 'Monthly Audit PDF'}</div>
                    <div className="text-[0.7rem] text-blue-100 mt-0.5">Full financial & status breakdown</div>
                  </div>
                  <ChevronRight size={18} className="text-blue-200" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleExportPayroll} disabled={exportingPayroll}
                    className="flex flex-col gap-2 p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer text-left transition-all group"
                  >
                    <Users size={20} className="text-purple-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-[0.8rem] text-gray-900">Payroll CSV</div>
                      <div className="text-[0.65rem] text-gray-500 mt-0.5">Driver statistics</div>
                    </div>
                  </button>

                  <button
                    onClick={handleExport} disabled={exporting}
                    className="flex flex-col gap-2 p-4 rounded-xl bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm cursor-pointer text-left transition-all group"
                  >
                    <History size={20} className="text-green-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold text-[0.8rem] text-gray-900">Fleet Audit CSV</div>
                      <div className="text-[0.65rem] text-gray-500 mt-0.5">Inventory logs</div>
                    </div>
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
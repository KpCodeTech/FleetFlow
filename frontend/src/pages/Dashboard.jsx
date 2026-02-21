
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Users, Route, Wrench, TrendingUp, AlertTriangle, Send, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { coreApi, analyticsApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [allTrips, setAllTrips] = useState([]);
  const [maint, setMaint] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tripFilter, setTripFilter] = useState('ALL');

  useEffect(() => {
    const load = async () => {
      try {
        const [sumRes, tripRes, maintRes] = await Promise.all([
          analyticsApi.get('/analytics/summary').catch(() => ({ data: null })),
          coreApi.get('/api/trips'),
          coreApi.get('/api/maintenance'),
        ]);
        setSummary(sumRes.data);
        setAllTrips(tripRes.data);
        setMaint(maintRes.data.slice(0, 4));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const fleet = summary?.fleet || {};
  const fin = summary?.financials || {};
  const drv = summary?.drivers || {};
  const trp = summary?.trips || {};

  const TRIP_STATUSES = ['ALL', 'DISPATCHED', 'COMPLETED', 'DRAFT', 'CANCELLED'];
  const trips = tripFilter === 'ALL' ? allTrips.slice(0, 8) : allTrips.filter(t => t.status === tripFilter).slice(0, 8);

  if (loading) return (
    <div className="flex w-full h-[60%] items-center justify-center text-gray-500">
      <Activity size={20} className="mr-2 animate-spin" /> Loading fleet data...
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck size={18} />} label="Active Fleet" value={fleet.active ?? '—'}
          sub={`${fleet.total ?? 0} total vehicles`}
          trend="up" trendText={`${fleet.utilizationRate ?? 0}% utilization`}
          accentName="blue"
        />
        <StatCard
          icon={<Wrench size={18} />} label="Maintenance Alerts" value={fleet.inShop ?? '—'}
          sub={`${fleet.available ?? 0} currently available`}
          accentName="amber"
        />
        <StatCard
          icon={<Activity size={18} />} label="Utilization Rate" value={`${fleet.utilizationRate ?? 0}%`}
          sub={`${drv.onDuty ?? 0} drivers on duty`}
          trend={fleet.utilizationRate >= 50 ? 'up' : 'down'}
          trendText={`Avg safety: ${drv.avgSafetyScore ?? '—'}`}
          accentName="green"
        />
        <StatCard
          icon={<Route size={18} />} label="Pending Cargo" value={trp.pendingCargo ?? '—'}
          sub={`${trp.active ?? 0} dispatched · ${trp.completed ?? 0} completed`}
          accentName="purple"
        />
      </div>

      {/* Main Content: Recent Trips + Maintenance Alerts */}
      <div className="flex flex-col lg:flex-row gap-4 min-h-0">

        {/* Recent Trips Table */}
        <div className="flex-1 bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col min-w-0">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div>
              <div className="font-semibold text-gray-900 text-[0.9375rem]">Recent Trips</div>
              <div className="text-xs text-gray-500 mt-0.5">{allTrips.length} total · filter by status</div>
            </div>
            <Link to="/trips" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors shrink-0">View all →</Link>
          </div>

          {/* Status Filter Pills */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0 hide-scrollbar">
            {TRIP_STATUSES.map(s => (
              <button key={s} onClick={() => setTripFilter(s)} className={`px-3 py-1.5 rounded-full border-none cursor-pointer text-xs font-medium whitespace-nowrap transition-all duration-200 ${tripFilter === s ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {s === 'ALL' ? `All (${allTrips.length})` : s}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto overflow-x-auto flex-1 bg-white">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Vehicle</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Driver</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Cargo</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Revenue</th>
                  <th className="sticky top-0 bg-white z-10 px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan={5} className="text-center text-gray-500 p-8">No trips found</td></tr>
                ) : trips.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-none">
                    <td className="px-5 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{t.vehicle?.nameModel ?? `V#${t.vehicleId}`}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{t.driver?.name ?? `D#${t.driverId}`}</td>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">{t.cargoWeight} kg</td>
                    <td className="px-5 py-3 text-sm font-semibold text-green-600 whitespace-nowrap">{fmt(t.revenue)}</td>
                    <td className="px-5 py-3 whitespace-nowrap"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="w-full lg:w-[360px] bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
            <div className="font-semibold text-[0.9375rem] text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-500" /> Maintenance
            </div>
            <Link to="/maintenance" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors shrink-0">View all →</Link>
          </div>

          <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
            {maint.length === 0 ? (
              <div className="text-center text-gray-500 p-8 text-sm">No maintenance records</div>
            ) : maint.map((m) => (
              <div key={m.id} className="p-3.5 rounded-lg bg-gray-50 border-l-4 border-yellow-400 shrink-0">
                <div className="font-semibold text-sm text-gray-900 mb-1 leading-none">
                  {m.vehicle?.nameModel ?? `Vehicle #${m.vehicleId}`}
                </div>
                <div className="text-[0.8125rem] text-gray-600 mb-2 leading-relaxed">
                  {m.description}
                </div>
                <div className="flex justify-between items-center text-xs mt-auto">
                  <span className="text-gray-500 font-medium">{new Date(m.date).toLocaleDateString()}</span>
                  <span className="text-yellow-600 font-bold">{fmt(m.cost)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Dispatch CTA */}
          <div className="p-3.5 border-t border-gray-100 shrink-0 bg-gray-50/50">
            <Link to="/dispatch" className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium text-sm transition-colors shadow-sm shadow-blue-600/20">
              <Send size={15} /> Quick Dispatch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
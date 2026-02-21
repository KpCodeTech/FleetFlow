import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, Users, Route, Wrench, TrendingUp, AlertTriangle, Send, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { coreApi, analyticsApi } from '../lib/api';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const [summary,    setSummary]   = useState(null);
  const [allTrips,   setAllTrips]  = useState([]);
  const [maint,      setMaint]     = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [tripFilter, setTripFilter]= useState('ALL');

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
  const fin   = summary?.financials || {};
  const drv   = summary?.drivers || {};
  const trp   = summary?.trips || {};

  const TRIP_STATUSES = ['ALL', 'DISPATCHED', 'COMPLETED', 'DRAFT', 'CANCELLED'];
  const trips = tripFilter === 'ALL' ? allTrips.slice(0, 8) : allTrips.filter(t => t.status === tripFilter).slice(0, 8);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60%', color: 'var(--text-muted)' }}>
      <Activity size={20} style={{ marginRight: '0.5rem' }} /> Loading fleet data...
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <StatCard
          icon={<Truck size={18} />} label="Active Fleet" value={fleet.active ?? '—'}
          sub={`${fleet.total ?? 0} total vehicles`}
          trend="up" trendText={`${fleet.utilizationRate ?? 0}% utilization`}
          accent="var(--accent)"
        />
        <StatCard
          icon={<Wrench size={18} />} label="Maintenance Alerts" value={fleet.inShop ?? '—'}
          sub={`${fleet.available ?? 0} currently available`}
          accent="var(--amber)"
        />
        <StatCard
          icon={<Activity size={18} />} label="Utilization Rate" value={`${fleet.utilizationRate ?? 0}%`}
          sub={`${drv.onDuty ?? 0} drivers on duty`}
          trend={fleet.utilizationRate >= 50 ? 'up' : 'down'}
          trendText={`Avg safety: ${drv.avgSafetyScore ?? '—'}`}
          accent="var(--green)"
        />
        <StatCard
          icon={<Route size={18} />} label="Pending Cargo" value={trp.pendingCargo ?? '—'}
          sub={`${trp.active ?? 0} dispatched · ${trp.completed ?? 0} completed`}
          accent="var(--purple)"
        />
      </div>

      {/* Main Content: Recent Trips + Maintenance Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1rem', minHeight: 0 }}>
        {/* Recent Trips Table */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Recent Trips</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{allTrips.length} total · filter by status</div>
            </div>
            <Link to="/trips" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          {/* Status Filter Pills */}
          <div style={{ padding: '0.625rem 1rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
            {TRIP_STATUSES.map(s => (
              <button key={s} onClick={() => setTripFilter(s)} style={{
                padding: '0.2rem 0.625rem', borderRadius: '999px', border: 'none', cursor: 'pointer',
                fontSize: '0.72rem', fontWeight: 500,
                background: tripFilter === s ? 'var(--accent)' : 'var(--bg-surface)',
                color: tripFilter === s ? '#0d1117' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
                {s === 'ALL' ? `All (${allTrips.length})` : s}
              </button>
            ))}
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Revenue</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No trips found</td></tr>
                ) : trips.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.vehicle?.nameModel ?? `V#${t.vehicleId}`}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.driver?.name ?? `D#${t.driverId}`}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.cargoWeight} kg</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(t.revenue)}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maintenance Alerts */}
        <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--amber)' }} /> Maintenance
            </div>
            <Link to="/maintenance" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div style={{ overflowY: 'auto', flex: 1, padding: '0.75rem' }}>
            {maint.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem', fontSize: '0.875rem' }}>No maintenance records</div>
            ) : maint.map((m) => (
              <div key={m.id} style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: 'var(--bg-surface)', marginBottom: '0.5rem', borderLeft: '3px solid var(--amber)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8375rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {m.vehicle?.nameModel ?? `Vehicle #${m.vehicleId}`}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>{m.description}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{new Date(m.date).toLocaleDateString()}</span>
                  <span style={{ color: 'var(--amber)', fontWeight: 600 }}>{fmt(m.cost)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Dispatch CTA */}
          <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <Link to="/dispatch" className="btn-primary" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Send size={15} /> Quick Dispatch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

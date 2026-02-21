import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, Star, Calendar, UserX, UserCheck, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { coreApi } from '../lib/api';

export default function DriverProfiles() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');
  const isAuthorized = ['MANAGER', 'SAFETY_OFFICER'].includes(user.role);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await coreApi.get('/api/drivers');
      setDrivers(data);
    } catch (err) {
      setError('Failed to load driver profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED';
    try {
      await coreApi.patch(`/api/drivers/${id}`, { status: newStatus });
      load();
    } catch (err) {
      setError('Status update failed');
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
        <ShieldAlert size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Forbidden</h2>
        <p>Only Safety Officers and Managers can access driver safety profiles.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <h2 className="page-title">Driver Performance & Safety Profiles</h2>
          <p className="page-subtitle">Monitoring {drivers.length} drivers for compliance and safety</p>
        </div>
        <button className="btn-ghost" onClick={load}><RefreshCw size={15} />Refresh</button>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: 'var(--red-bg)', color: 'var(--red)', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading drivers...</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>License Expiry</th>
                  <th>Safety Score</th>
                  <th>Completion Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ 
                          color: isExpired(d.licenseExpiryDate) ? 'var(--red)' : 'var(--text-secondary)',
                          fontWeight: isExpired(d.licenseExpiryDate) ? 700 : 400,
                          padding: isExpired(d.licenseExpiryDate) ? '0.2rem 0.5rem' : '0',
                          background: isExpired(d.licenseExpiryDate) ? 'var(--red-bg)' : 'transparent',
                          borderRadius: '4px'
                        }}>
                          {new Date(d.licenseExpiryDate).toLocaleDateString('en-IN')}
                        </span>
                        {isExpired(d.licenseExpiryDate) && <ShieldAlert size={14} color="var(--red)" />}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-surface)', borderRadius: '3px', position: 'relative', minWidth: '80px' }}>
                          <div style={{ 
                            position: 'absolute', left: 0, top: 0, height: '100%', 
                            width: `${d.safetyScore}%`, borderRadius: '3px',
                            background: d.safetyScore > 80 ? 'var(--green)' : d.safetyScore > 60 ? 'var(--amber)' : 'var(--red)'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, minWidth: '32px' }}>{d.safetyScore}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: d.completionRate > 90 ? 'var(--green)' : 'var(--text-primary)' }}>
                        {d.completionRate}%
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {d.completedTrips} of {d.totalTrips} trips
                        </div>
                      </div>
                    </td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <button 
                        onClick={() => handleStatusToggle(d.id, d.status)}
                        className={d.status === 'SUSPENDED' ? 'btn-ghost' : 'btn-danger'}
                        style={{ padding: '0.3125rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                      >
                        {d.status === 'SUSPENDED' ? (
                          <><UserCheck size={14} /> Reinstate</>
                        ) : (
                          <><UserX size={14} /> Suspend</>
                        )}
                      </button>
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

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Route, Send,
  Wrench, BarChart3, LogOut, Zap, Fuel,
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard, end: true,  roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE'] },
  { to: '/vehicles',    label: 'Vehicles',    icon: Truck,                        roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/drivers',     label: 'Drivers',     icon: Users,                        roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/trips',       label: 'Trips',       icon: Route,                        roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE'] },
  { to: '/dispatch',    label: 'Dispatch',    icon: Send,                         roles: ['MANAGER', 'DISPATCHER'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench,                       roles: ['MANAGER'] },
  { to: '/expenses',    label: 'Fuel & Costs',icon: Fuel,                         roles: ['MANAGER', 'DISPATCHER', 'FINANCE'] },
  { to: '/analytics',   label: 'Analytics',   icon: BarChart3,                    roles: ['MANAGER', 'FINANCE'] },
];

export default function Sidebar() {
  const navigate  = useNavigate();
  const user      = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');

  const navItems = ALL_NAV_ITEMS.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    localStorage.removeItem('fleetflow_token');
    localStorage.removeItem('fleetflow_user');
    navigate('/login');
  };

  const roleBadgeColor = {
    MANAGER:        { bg: 'rgba(88,166,255,0.15)',  color: '#58a6ff'  },
    DISPATCHER:     { bg: 'rgba(63,185,80,0.15)',   color: '#3fb950'  },
    SAFETY_OFFICER: { bg: 'rgba(227,179,65,0.15)',  color: '#e3b341'  },
    FINANCE:        { bg: 'rgba(188,140,255,0.15)', color: '#bc8cff'  },
  };
  const badge = roleBadgeColor[user.role] || { bg: 'var(--bg-surface)', color: 'var(--text-muted)' };

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #58a6ff, #388bfd)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="#0d1117" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              FleetFlow
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '0.75rem 0.625rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.5rem 0.5rem' }}>
          Navigation
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.625rem',
              padding: '0.5625rem 0.75rem',
              borderRadius: '0.5rem',
              marginBottom: '0.125rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
              transition: 'all 0.15s',
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.getAttribute('aria-current')) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--purple), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.8rem', fontWeight: 700, color: '#fff',
            flexShrink: 0,
          }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </div>
            <div style={{
              display: 'inline-block', fontSize: '0.65rem', fontWeight: 600,
              padding: '0.1rem 0.4rem', borderRadius: '4px', marginTop: '0.125rem',
              background: badge.bg, color: badge.color,
            }}>
              {user?.role?.replace('_', ' ') || 'Guest'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            width: '100%', padding: '0.4375rem 0.625rem',
            backgroundColor: 'transparent', border: 'none',
            color: 'var(--text-muted)', borderRadius: '0.375rem',
            cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

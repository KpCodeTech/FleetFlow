import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const PAGE_TITLES = {
  '/':            { title: 'Dashboard',          subtitle: 'Fleet command center overview' },
  '/vehicles':    { title: 'Vehicle Registry',   subtitle: 'Manage your fleet assets' },
  '/drivers':     { title: 'Driver Management',  subtitle: 'Driver profiles and status' },
  '/trips':       { title: 'Trip History',        subtitle: 'All dispatched and completed trips' },
  '/dispatch':    { title: 'Dispatch Center',    subtitle: 'Assign vehicles and drivers to trips' },
  '/maintenance': { title: 'Maintenance Logs',   subtitle: 'Vehicle service records' },
  '/analytics':   { title: 'Financial Analytics','subtitle': 'ROI, fuel efficiency, and reporting' },
};

export default function Header() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'FleetFlow', subtitle: '' };

  return (
    <header style={{
      height: '60px',
      minHeight: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
          {page.title}
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
          {page.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            placeholder="Search..."
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '0.375rem',
              padding: '0.375rem 0.75rem 0.375rem 2rem',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              outline: 'none',
              width: '180px',
            }}
          />
        </div>

        {/* Notification Bell */}
        <button style={{
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '0.5rem',
          padding: '0.4375rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center',
          color: 'var(--text-secondary)',
        }}>
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: '4px', right: '4px',
            width: '7px', height: '7px',
            borderRadius: '50%', background: 'var(--red)',
          }} className="pulse-dot" />
        </button>

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem', color: 'var(--green)' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block' }} className="pulse-dot" />
          Live
        </div>
      </div>
    </header>
  );
}

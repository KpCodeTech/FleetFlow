const STATUS_MAP = {
  // Vehicle
  AVAILABLE: { label: 'Available', color: 'var(--green)',  bg: 'var(--green-bg)'  },
  ON_TRIP:   { label: 'On Trip',   color: 'var(--blue)',   bg: 'var(--blue-bg)'   },
  IN_SHOP:   { label: 'In Shop',   color: 'var(--amber)',  bg: 'var(--amber-bg)'  },
  RETIRED:   { label: 'Retired',   color: 'var(--text-muted)', bg: 'var(--bg-hover)' },
  // Driver
  ON_DUTY:   { label: 'On Duty',   color: 'var(--blue)',   bg: 'var(--blue-bg)'   },
  SUSPENDED: { label: 'Suspended', color: 'var(--red)',    bg: 'var(--red-bg)'    },
  // Trip
  DRAFT:      { label: 'Draft',      color: 'var(--text-muted)', bg: 'var(--bg-hover)' },
  DISPATCHED: { label: 'Dispatched', color: 'var(--blue)',   bg: 'var(--blue-bg)'  },
  COMPLETED:  { label: 'Completed',  color: 'var(--green)',  bg: 'var(--green-bg)' },
  CANCELLED:  { label: 'Cancelled',  color: 'var(--red)',    bg: 'var(--red-bg)'   },
  // Maintenance priority
  HIGH:   { label: 'High',   color: 'var(--red)',   bg: 'var(--red-bg)'   },
  MEDIUM: { label: 'Medium', color: 'var(--amber)', bg: 'var(--amber-bg)' },
  LOW:    { label: 'Low',    color: 'var(--green)', bg: 'var(--green-bg)' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_MAP[status] || { label: status, color: 'var(--text-secondary)', bg: 'var(--bg-hover)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.2rem 0.625rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: cfg.color,
      backgroundColor: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

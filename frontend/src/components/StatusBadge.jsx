
const STATUS_MAP = {
  // Vehicle
  AVAILABLE: { label: 'Available', color: 'green' },
  ON_TRIP: { label: 'On Trip', color: 'blue' },
  IN_SHOP: { label: 'In Shop', color: 'amber' },
  RETIRED: { label: 'Retired', color: 'slate' },
  // Driver
  ON_DUTY: { label: 'On Duty', color: 'indigo' },
  OFF_DUTY: { label: 'Off Duty', color: 'slate' },
  SUSPENDED: { label: 'Suspended', color: 'red' },
  // Trip
  DRAFT: { label: 'Draft', color: 'slate' },
  DISPATCHED: { label: 'Dispatched', color: 'blue' },
  COMPLETED: { label: 'Completed', color: 'emerald' },
  CANCELLED: { label: 'Cancelled', color: 'rose' },
  // Maintenance priority
  HIGH: { label: 'High', color: 'rose' },
  MEDIUM: { label: 'Medium', color: 'orange' },
  LOW: { label: 'Low', color: 'emerald' },
};

// Color Shades Mapping for better maintenance
const colorClasses = {
  green:   "bg-green-50/50 text-green-700 border-green-200/60 dot-bg-green-500 shadow-green-100",
  blue:    "bg-blue-50/50 text-blue-700 border-blue-200/60 dot-bg-blue-500 shadow-blue-100",
  amber:   "bg-amber-50/50 text-amber-700 border-amber-200/60 dot-bg-amber-500 shadow-amber-100",
  slate:   "bg-slate-50/50 text-slate-600 border-slate-200/60 dot-bg-slate-400 shadow-slate-100",
  indigo:  "bg-indigo-50/50 text-indigo-700 border-indigo-200/60 dot-bg-indigo-500 shadow-indigo-100",
  red:     "bg-red-50/50 text-red-700 border-red-200/60 dot-bg-red-500 shadow-red-100",
  emerald: "bg-emerald-50/50 text-emerald-700 border-emerald-200/60 dot-bg-emerald-500 shadow-emerald-100",
  rose:    "bg-rose-50/50 text-rose-700 border-rose-200/60 dot-bg-rose-500 shadow-rose-100",
  orange:  "bg-orange-50/50 text-orange-700 border-orange-200/60 dot-bg-orange-500 shadow-orange-100",
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] || { label: status, color: 'slate' };
  const theme = colorClasses[config.color];

  // Logic to extract dot color from custom class string
  const dotColor = theme.split(' ').find(c => c.startsWith('dot-bg-')).replace('dot-bg-', 'bg-');

  return (
    <span className={`
      inline-flex items-center gap-2 
      px-3 py-1 
      rounded-lg border 
      text-[11px] font-bold tracking-wide uppercase
      transition-all duration-200 ease-in-out
      shadow-sm backdrop-blur-sm
      ${theme}
    `}>
      {/* Dynamic Pulse Effect on Dot */}
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-40 ${dotColor}`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}></span>
      </span>
      
      {config.label}
    </span>
  );
}
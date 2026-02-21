
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, Route, Send,
  Wrench, BarChart3, LogOut, Fuel,
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE'] },
  { to: '/vehicles', label: 'Vehicles', icon: Truck, roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/drivers', label: 'Drivers', icon: Users, roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER'] },
  { to: '/trips', label: 'Trips', icon: Route, roles: ['MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE'] },
  { to: '/dispatch', label: 'Dispatch', icon: Send, roles: ['MANAGER', 'DISPATCHER'] },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['MANAGER'] },
  { to: '/expenses', label: 'Fuel & Costs', icon: Fuel, roles: ['MANAGER', 'DISPATCHER', 'FINANCE'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['MANAGER', 'FINANCE'] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('fleetflow_user') || '{}');

  const navItems = ALL_NAV_ITEMS
    .filter(item => item.roles.includes(user.role))
    .map(item => {
      if (item.to === '/drivers' && (user.role === 'SAFETY_OFFICER' || user.role === 'MANAGER')) {
        return { ...item, label: 'Safety Profiles' };
      }
      return item;
    });

  const handleLogout = () => {
    localStorage.removeItem('fleetflow_token');
    localStorage.removeItem('fleetflow_user');
    navigate('/login');
  };

  const roleBadgeStyle = {
    MANAGER: 'bg-[#58a6ff]/15 text-[#58a6ff]',
    DISPATCHER: 'bg-[#3fb950]/15 text-[#3fb950]',
    SAFETY_OFFICER: 'bg-[#e3b341]/15 text-[#e3b341]',
    FINANCE: 'bg-[#bc8cff]/15 text-[#bc8cff]',
  };
  const badgeClass = roleBadgeStyle[user.role] || 'bg-[#161b22] text-[#484f58]';

  return (
    <aside className="w-[240px] min-w-[240px] h-screen flex flex-col bg-[#161b22] border-r border-[#30363d] overflow-hidden">
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-[#30363d]">
        <div className="flex items-center gap-2.5">
          <div className="flex w-[38px] h-[38px] rounded-[10px] bg-[#1a73e8] items-center justify-center shadow-[0_4px_10px_rgba(26,115,232,0.35)] shrink-0">
            <Truck size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-base text-[#e6edf3] tracking-tight">
              FleetFlow
            </div>
            <div className="text-[0.7rem] text-[#484f58] font-medium">
              Command Center
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2.5 py-3 overflow-y-auto">
        <div className="text-[0.7rem] font-semibold text-[#484f58] uppercase tracking-wider px-2 pb-2">
          Navigation
        </div>
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 no-underline text-sm transition-all duration-150 ` +
              (isActive
                ? `font-semibold text-[#58a6ff] bg-[rgba(88,166,255,0.15)]`
                : `font-normal text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]`)
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-3.5 border-t border-[#30363d]">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bc8cff] to-[#58a6ff] flex items-center justify-center text-[0.8rem] font-bold text-white shrink-0">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-[0.8125rem] font-semibold text-[#e6edf3] whitespace-nowrap overflow-hidden text-ellipsis">
              {user?.name || 'User'}
            </div>
            <div className={`inline-block text-[0.65rem] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${badgeClass}`}>
              {user?.role?.replace('_', ' ') || 'Guest'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2.5 py-1.5 bg-transparent border-none text-[#484f58] rounded-md cursor-pointer text-[0.8125rem] font-medium transition-all duration-150 hover:bg-[rgba(248,81,73,0.15)] hover:text-[#f85149]"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
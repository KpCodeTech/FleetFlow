
import { useLocation } from 'react-router-dom';
import { Bell, Search } from 'lucide-react';

const PAGE_TITLES = {
  '/': { title: 'Dashboard', subtitle: 'Fleet command center overview' },
  '/vehicles': { title: 'Vehicle Registry', subtitle: 'Manage your fleet assets' },
  '/drivers': { title: 'Driver Management', subtitle: 'Driver profiles and status' },
  '/trips': { title: 'Trip History', subtitle: 'All dispatched and completed trips' },
  '/dispatch': { title: 'Dispatch Center', subtitle: 'Assign vehicles and drivers to trips' },
  '/maintenance': { title: 'Maintenance Logs', subtitle: 'Vehicle service records' },
  '/analytics': { title: 'Financial Analytics', 'subtitle': 'ROI, fuel efficiency, and reporting' },
};

export default function Header() {
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'FleetFlow', subtitle: '' };

  return (
    <header className="h-[70px] min-h-[70px] flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0">
      {/* Page Title */}
      <div>
        <h1 className="text-base font-bold text-gray-900 m-0 leading-tight">
          {page.title}
        </h1>
        <p className="text-xs text-gray-500 m-0 mt-0.5">
          {page.subtitle}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            placeholder="Search..."
            className="bg-gray-50 border border-gray-200 rounded-md py-1.5 pr-3 pl-8 text-gray-900 text-[0.8125rem] outline-none w-[180px] focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Notification Bell */}
        <button className="relative bg-white border border-gray-200 rounded-lg p-1.5 cursor-pointer flex items-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 pulse-dot" />
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium ml-1">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block pulse-dot" />
          Live
        </div>
      </div>
    </header>
  );
}
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard' },
  { to: '/projects', label: 'Project List' },
  { to: '/backlog', label: 'Backlog' },
  { to: '/reports', label: 'Reports' },
  { to: '/timelogs', label: 'Time Logs' },
];

export function Layout({ children }) {
  return (
    <div className="flex h-screen">
      <nav className="w-56 border-r border-gray-200 p-4 flex flex-col">
        <div className="text-lg font-semibold mb-6">DevTrack</div>
        <div className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `block px-3 py-2 rounded text-sm border-t border-gray-100 pt-3 ${
              isActive ? 'text-blue-700' : 'text-gray-700 hover:bg-gray-50'
            }`
          }
        >
          Settings
        </NavLink>
      </nav>
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}

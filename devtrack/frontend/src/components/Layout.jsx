import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, ListTodo, BarChart3, Clock, Settings2, Search,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/backlog', label: 'Backlog', icon: ListTodo },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/timelogs', label: 'Time Logs', icon: Clock },
];

function navClass({ isActive }) {
  return [
    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
    isActive
      ? 'bg-tile text-fg font-medium'
      : 'text-fg-muted hover:text-fg hover:bg-card-hover',
  ].join(' ');
}

/** Eyebrow above each page title. Derived from the route so pages don't each
 *  have to pass one down. */
function sectionLabel(pathname) {
  if (pathname === '/') return 'Dashboard';
  const first = pathname.split('/')[1] ?? '';
  const match = NAV_ITEMS.find((i) => i.to === `/${first}`);
  if (match) return match.label;
  return first ? first.replace(/[-_]/g, ' ') : 'DevTrack';
}

export function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="flex h-screen bg-app text-fg">
      <nav className="w-60 shrink-0 bg-panel border-r border-line flex flex-col">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-line">
          <div className="w-8 h-8 rounded-lg bg-accent grid place-items-center shrink-0">
            <span className="text-white text-sm font-bold">D</span>
          </div>
          <span className="text-[15px] font-semibold tracking-tight">DevTrack</span>
        </div>

        <div className="px-5 pt-5 pb-2">
          <span className="text-[10px] font-semibold tracking-[0.12em] text-fg-faint">
            MENU
          </span>
        </div>

        <div className="px-3 space-y-1 flex-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navClass}>
              <Icon size={17} strokeWidth={1.75} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>

        <div className="px-3 py-4 border-t border-line">
          <NavLink to="/settings" className={navClass}>
            <Settings2 size={17} strokeWidth={1.75} className="shrink-0" />
            Settings
          </NavLink>
        </div>
      </nav>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 bg-panel border-b border-line flex items-center gap-4 px-6">
          {/* Deliberately inert: there is no search endpoint, so this reads as
              a disabled affordance rather than an input that silently does
              nothing once you type in it. */}
          <div className="flex-1 max-w-md">
            <div
              className="flex items-center gap-2 h-9 px-3 rounded-lg bg-tile border border-line text-fg-faint text-sm select-none"
              title="Search is not implemented yet"
            >
              <Search size={15} strokeWidth={1.75} />
              <span>Search…</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight hidden sm:block">
              <div className="text-sm font-medium">DevTrack</div>
              <div className="text-xs text-fg-muted">Personal workspace</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-accent-soft border border-line-strong grid place-items-center text-sm font-semibold text-accent">
              D
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          <div className="text-[10px] font-semibold tracking-[0.12em] text-fg-faint uppercase mb-1">
            {sectionLabel(pathname)}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

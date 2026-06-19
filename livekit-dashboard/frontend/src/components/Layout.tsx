import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Users,
  MessageSquare,
  Puzzle,
  ScrollText,
  Settings,
  Activity,
  ChevronRight,
  Search,
  Bell,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/agents', icon: Bot, label: 'Agents' },
  { to: '/rooms', icon: Users, label: 'Rooms' },
  { to: '/transcription', icon: MessageSquare, label: 'Transcript' },
  { to: '/plugins', icon: Puzzle, label: 'Plugins' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function Breadcrumbs() {
  const location = useLocation();
  const path = location.pathname;
  const segments = path.split('/').filter(Boolean);

  const segmentLabels: Record<string, string> = {
    agents: 'Agents',
    rooms: 'Rooms',
    transcription: 'Transcript',
    plugins: 'Plugins',
    logs: 'Logs',
    settings: 'Settings',
  };

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <span className="text-foreground font-medium">Dashboard</span>
      {segments.map((seg) => (
        <span key={seg} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">{segmentLabels[seg] || seg}</span>
        </span>
      ))}
    </div>
  );
}

export default function Layout() {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-[220px] bg-background border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none">LiveKit</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-1">Agents</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-border">
          <div className="text-[11px] text-muted-foreground text-center">
            SDK v1.6.1
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b border-border flex items-center justify-between px-6">
          <Breadcrumbs />
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="input pl-9 h-9 w-64 text-sm"
              />
            </div>
            <button className="btn-ghost btn-sm relative">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

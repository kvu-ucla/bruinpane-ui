import { Link, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  Monitor,
  Box,
  MapPin,
  Wrench,
  FolderGit2,
  Zap,
  Bell,
  BarChart3,
  Users,
  Server,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
// import ConnectionStatus from './ConnectionStatus';

const navigationItems = [
  { name: 'Systems', path: '/systems', icon: Monitor },
  // { name: 'Modules', path: '/modules', icon: Box },
  // { name: 'Zones', path: '/zones', icon: MapPin },
  // { name: 'Drivers', path: '/drivers', icon: Wrench },
  // { name: 'Repositories', path: '/repositories', icon: FolderGit2 },
  // { name: 'Triggers', path: '/triggers', icon: Zap },
  // { name: 'Alerts', path: '/alerts', icon: Bell },
  // { name: 'Metrics', path: '/metrics', icon: BarChart3 },
  // { name: 'Users', path: '/users', icon: Users },
  // { name: 'Domains', path: '/domains', icon: Server },
  // { name: 'Manage Instance', path: '/manage', icon: Settings },
];

export default function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-base-100">
      <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-base-200 border-r border-base-300 flex flex-col transition-all duration-300`}>
        <div className={`border-b border-base-300 flex items-center ${isCollapsed ? 'justify-center p-4' : 'justify-between p-4'}`}>
          {!isCollapsed && (
            <h1 className="text-2xl font-bold">
              Place<span className="text-primary">OS</span>
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="btn btn-ghost btn-sm btn-circle"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className={`flex-1 overflow-y-auto ${isCollapsed ? 'px-2 py-4' : 'p-4'}`}>
          <ul className="nav-menu space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                             location.pathname.startsWith(item.path + '/');

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-base-300 ${
                      isActive ? 'bg-primary text-primary-content' : ''
                    } ${isCollapsed ? 'tooltip tooltip-right justify-center' : ''}`}
                    data-tip={isCollapsed ? item.name : undefined}
                  >
                    <Icon size={20} className="flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className={`border-t border-base-300 ${isCollapsed ? 'p-3' : 'p-4'}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className={`avatar placeholder ${isCollapsed ? 'tooltip tooltip-right' : ''}`} data-tip={isCollapsed ? 'KENNETH VU' : undefined}>
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                <span className="text-xs">KV</span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="text-sm font-medium">KENNETH VU</div>
                <div className="text-xs text-base-content/60">Admin</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <div className="border-b border-base-300 px-6 py-3 flex items-center justify-end">
          {/*<ConnectionStatus />*/}
        </div>
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

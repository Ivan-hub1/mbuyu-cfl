import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, NavLink } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { useAuthStore } from '../../store/authStore';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  roles: string[];
}

const NAV: NavItem[] = [
  { to: '/dashboard',              label: 'Overview',            icon: '📊', roles: ['*'] },
  { to: '/dashboard/quotes',       label: 'Quote Requests',      icon: '📝', roles: ['ADMIN'] },
  { to: '/dashboard/users',        label: 'Staff & Users',       icon: '👥', roles: ['ADMIN'] },
  { to: '/dashboard/statements',   label: 'Customer Statements', icon: '📄', roles: ['ADMIN'] },
  { to: '/dashboard/shipments',    label: 'Shipments',           icon: '📦', roles: ['ADMIN', 'HEAD_OFFICE'] },
  { to: '/dashboard/vehicles',     label: 'Vehicles',            icon: '🚚', roles: ['ADMIN', 'HEAD_OFFICE', 'OPERATIONS'] },
  { to: '/dashboard/fleet-live',   label: 'Live Fleet',          icon: '📍', roles: ['ADMIN', 'HEAD_OFFICE', 'OPERATIONS'] },
  { to: '/dashboard/transfers',    label: 'Transfers',           icon: '🔄', roles: ['ADMIN', 'HEAD_OFFICE', 'OPERATIONS'] },
  { to: '/dashboard/maintenance',  label: 'Maintenance',         icon: '🔧', roles: ['ADMIN', 'OPERATIONS'] },
  { to: '/driver/shipments',       label: 'My Shipments',        icon: '📦', roles: ['DRIVER'] },
  { to: '/driver/checklist',       label: 'New Checklist',       icon: '✅', roles: ['DRIVER'] },
  { to: '/driver/journey',         label: 'Start Journey',       icon: '🚀', roles: ['DRIVER'] },
  { to: '/dashboard/my-shipments', label: 'My Shipments',        icon: '📦', roles: ['CUSTOMER'] },
  { to: '/dashboard/my-quotes',    label: 'My Quotes',           icon: '📝', roles: ['CUSTOMER'] },
  { to: '/dashboard/my-statements', label: 'My Statement',       icon: '📄', roles: ['CUSTOMER'] },
];

function effectiveRoleKey(user: { role?: string; staffRole?: string | null } | null): string {
  if (!user) return 'CUSTOMER';
  if (user.role === 'ADMIN') return 'ADMIN';
  if (user.role === 'STAFF') return user.staffRole || 'HEAD_OFFICE';
  return 'CUSTOMER';
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (drawerOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const roleKey = effectiveRoleKey(user);

  const visibleNav = NAV.filter((item) => {
    if (item.roles.includes('*')) return true;
    if (roleKey === 'ADMIN') return true;
    return item.roles.includes(roleKey);
  });

  const isRootDashboard = location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-brand-black">
      <Navbar />

      <div className="md:hidden bg-brand-black-soft border-b border-brand-black-muted">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-brand-orange text-white font-semibold text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
            Menu
          </button>
          <div className="text-right min-w-0">
            <p className="text-xs text-gray-500 leading-none">Signed in</p>
            <p className="text-sm font-semibold text-white truncate max-w-[180px]">
              {user?.name}
            </p>
          </div>
        </div>
      </div>

      {drawerOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="md:hidden fixed top-0 left-0 bottom-0 z-[70] w-[85vw] max-w-sm bg-brand-black-soft border-r border-brand-black-muted flex flex-col"
            style={{ animation: 'slideIn 0.2s ease-out' }}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-brand-black-muted">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Signed in</p>
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-xs text-brand-orange">{roleKey.replace('_', ' ')}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-white text-3xl leading-none p-2 -mr-2"
              >
                ×
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-4 rounded-lg text-base transition ${
                      isActive
                        ? 'bg-brand-orange text-white font-semibold'
                        : 'text-gray-200 hover:text-white hover:bg-brand-black-muted'
                    }`
                  }
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-brand-black-muted">
              <Link
                to="/"
                onClick={() => setDrawerOpen(false)}
                className="block text-center text-sm text-gray-500 hover:text-brand-orange py-2"
              >
                ← Back to main site
              </Link>
            </div>
          </div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-3 md:px-6 py-6 md:py-10 flex gap-8">
        <aside className="hidden md:block w-56 shrink-0">
          <div className="card p-3 sticky top-24">
            <div className="px-3 py-2 mb-2 border-b border-brand-black-muted">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Signed in as</p>
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className="text-xs text-brand-orange">{roleKey.replace('_', ' ')}</p>
            </div>
            <nav className="space-y-1">
              {visibleNav.map((item) => (
                <NavLink
                  key={`${item.to}-${item.label}`}
                  to={item.to}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? 'bg-brand-orange text-white font-semibold'
                        : 'text-gray-400 hover:text-white hover:bg-brand-black-muted'
                    }`
                  }
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {isRootDashboard ? <DashboardOverview /> : <Outlet />}
        </main>
      </div>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function DashboardOverview() {
  const { user } = useAuthStore();
  const roleKey = effectiveRoleKey(user);
  const isAdmin = roleKey === 'ADMIN';
  const isHeadOffice = roleKey === 'HEAD_OFFICE';
  const isOperations = roleKey === 'OPERATIONS';
  const isDriver = roleKey === 'DRIVER';
  const isCustomer = roleKey === 'CUSTOMER';

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-gray-400 mt-1 text-sm">Here's an overview of your activity.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10">
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Active Shipments</p>
          <p className="text-2xl md:text-3xl font-bold text-brand-orange mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Pending Quotes</p>
          <p className="text-2xl md:text-3xl font-bold text-brand-orange mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Delivered</p>
          <p className="text-2xl md:text-3xl font-bold text-green-400 mt-2">0</p>
        </div>
        <div className="card">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Fleet Vehicles</p>
          <p className="text-2xl md:text-3xl font-bold text-brand-orange mt-2">0</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 md:gap-3">
          {isAdmin && (
            <>
              <Link to="/dashboard/shipments" className="btn-outline text-center text-sm">Shipments</Link>
              <Link to="/dashboard/quotes" className="btn-outline text-center text-sm">Quotes</Link>
              <Link to="/dashboard/statements" className="btn-outline text-center text-sm">Statements</Link>
              <Link to="/dashboard/fleet-live" className="btn-outline text-center text-sm">Live Fleet</Link>
              <Link to="/dashboard/transfers" className="btn-outline text-center text-sm">Transfers</Link>
            </>
          )}
          {isHeadOffice && (
            <>
              <Link to="/dashboard/shipments" className="btn-outline text-center text-sm">Shipments</Link>
              <Link to="/dashboard/fleet-live" className="btn-outline text-center text-sm">Live Fleet</Link>
              <Link to="/dashboard/transfers" className="btn-outline text-center text-sm">Transfers</Link>
            </>
          )}
          {isOperations && (
            <>
              <Link to="/dashboard/maintenance" className="btn-primary text-center text-sm">Maintenance</Link>
              <Link to="/dashboard/fleet-live" className="btn-outline text-center text-sm">Live Fleet</Link>
              <Link to="/dashboard/transfers" className="btn-outline text-center text-sm">Transfers</Link>
            </>
          )}
          {isDriver && (
            <>
              <Link to="/driver/checklist" className="btn-primary text-center text-sm">New Checklist</Link>
              <Link to="/driver/journey" className="btn-outline text-center text-sm">Start Journey</Link>
            </>
          )}
          {isCustomer && (
            <>
              <Link to="/dashboard/my-statements" className="btn-primary text-center text-sm">My Statement</Link>
              <Link to="/dashboard/my-quotes" className="btn-outline text-center text-sm">My Quotes</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
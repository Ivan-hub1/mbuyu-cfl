import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Logo from '../ui/Logo';
import { useAuthStore } from '../../store/authStore';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock scroll while mobile menu open
  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close mobile menu on route change (via Link clicks)
  const closeMobile = () => setMobileOpen(false);

  const roleKey = (() => {
    if (!user) return 'GUEST';
    if (user.role === 'ADMIN') return 'ADMIN';
    if (user.role === 'STAFF') return user.staffRole || 'HEAD_OFFICE';
    return 'CUSTOMER';
  })();

  // Dashboard target for logged-in users
  const dashboardHref =
    roleKey === 'DRIVER' ? '/driver/welcome' : '/dashboard';

  const dashboardLabel = roleKey === 'DRIVER' ? 'My Portal' : 'Dashboard';

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-brand-black/95 backdrop-blur-lg border-brand-black-muted shadow-lg'
          : 'bg-brand-black/80 backdrop-blur border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <Link to="/" className="shrink-0" onClick={closeMobile}>
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {!user && (
            <>
              <Link to="/services" className="hover:text-brand-orange transition">
                Services
              </Link>
              <Link to="/track" className="hover:text-brand-orange transition">
                Track Cargo
              </Link>
              <Link to="/quote" className="hover:text-brand-orange transition">
                Request Quote
              </Link>
            </>
          )}

          {user && (
            <>
              <Link
                to={dashboardHref}
                className="hover:text-brand-orange transition font-semibold text-brand-orange"
              >
                {dashboardLabel}
              </Link>

              {roleKey === 'DRIVER' && (
                <>
                  <Link
                    to="/driver/shipments"
                    className="hover:text-brand-orange transition"
                  >
                    My Shipments
                  </Link>
                  <Link
                    to="/driver/checklist"
                    className="hover:text-brand-orange transition"
                  >
                    Checklist
                  </Link>
                </>
              )}

              {roleKey === 'CUSTOMER' && (
                <>
                  <Link
                    to="/dashboard/my-statements"
                    className="hover:text-brand-orange transition"
                  >
                    Statement
                  </Link>
                  <Link
                    to="/track"
                    className="hover:text-brand-orange transition"
                  >
                    Track
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 md:gap-3">
          {user ? (
            <>
              <span className="hidden md:inline text-xs text-gray-500 max-w-[120px] truncate">
                {user.name}
              </span>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="hidden md:inline text-sm text-gray-400 hover:text-brand-orange transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden md:inline text-sm font-medium hover:text-brand-orange transition"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="hidden md:inline btn-primary text-sm px-5 py-2"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile hamburger (always visible on mobile) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-white hover:bg-brand-black-muted transition"
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-brand-black-muted bg-brand-black-soft">
          <div className="px-4 py-4 space-y-1">
            {user && (
              <div className="pb-3 mb-3 border-b border-brand-black-muted">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Signed in</p>
                <p className="text-sm font-semibold truncate">{user.name}</p>
                <p className="text-xs text-brand-orange">{roleKey.replace('_', ' ')}</p>
              </div>
            )}

            {user && (
              <Link
                to={dashboardHref}
                onClick={closeMobile}
                className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-brand-orange hover:bg-brand-black-muted transition"
              >
                <span className="text-lg">📊</span>
                <span>{dashboardLabel}</span>
              </Link>
            )}

            {!user && (
              <>
                <Link
                  to="/services"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">🧭</span>
                  <span>Services</span>
                </Link>
                <Link
                  to="/track"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📍</span>
                  <span>Track Cargo</span>
                </Link>
                <Link
                  to="/quote"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📝</span>
                  <span>Request Quote</span>
                </Link>
              </>
            )}

            {user && roleKey === 'DRIVER' && (
              <>
                <Link
                  to="/driver/shipments"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📦</span>
                  <span>My Shipments</span>
                </Link>
                <Link
                  to="/driver/checklist"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">✅</span>
                  <span>New Checklist</span>
                </Link>
                <Link
                  to="/driver/journey"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">🚀</span>
                  <span>Start Journey</span>
                </Link>
              </>
            )}

            {user && roleKey === 'CUSTOMER' && (
              <>
                <Link
                  to="/dashboard/my-statements"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📄</span>
                  <span>My Statement</span>
                </Link>
                <Link
                  to="/dashboard/my-quotes"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📝</span>
                  <span>My Quotes</span>
                </Link>
                <Link
                  to="/dashboard/my-shipments"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📦</span>
                  <span>My Shipments</span>
                </Link>
                <Link
                  to="/track"
                  onClick={closeMobile}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                >
                  <span className="text-lg">📍</span>
                  <span>Track Shipment</span>
                </Link>
              </>
            )}

            <div className="pt-3 mt-3 border-t border-brand-black-muted">
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    closeMobile();
                    navigate('/');
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg text-base text-red-400 hover:bg-red-500/10 transition"
                >
                  <span className="text-lg">🚪</span>
                  <span>Logout</span>
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base text-gray-200 hover:bg-brand-black-muted transition"
                  >
                    <span className="text-lg">🔑</span>
                    <span>Sign in</span>
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobile}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-base font-semibold text-white bg-brand-orange hover:bg-brand-orange-dark transition mt-2"
                  >
                    <span className="text-lg">✨</span>
                    <span>Get Started</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
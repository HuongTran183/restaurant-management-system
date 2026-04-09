import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuthSession } from '../lib/api';
import { AdminSidebar } from './AdminSidebar';
import { LanguageSwitcher } from './LanguageSwitcher';

type AdminLayoutProps = {
  session: AuthSession | null;
  onLogout: () => void;
};

const BREADCRUMB_MAP: Record<string, { label: string; icon: string }> = {
  '/staff': { label: 'Dashboard', icon: '📊' },
  '/staff/reservations': { label: 'Reservations', icon: '📅' },
  '/staff/floor': { label: 'Floor & Tables', icon: '🏢' },
  '/staff/orders': { label: 'Orders', icon: '📦' },
  '/staff/payments': { label: 'Payments', icon: '💰' },
  '/staff/requests': { label: 'Requests', icon: '📢' },
};

export function AdminLayout({ session, onLogout }: AdminLayoutProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get breadcrumb title based on current path
  const getBreadcrumbInfo = () => {
    const path = location.pathname;
    for (const [route, info] of Object.entries(BREADCRUMB_MAP)) {
      if (path === route || path.startsWith(route + '/')) {
        return info;
      }
    }
    return { label: 'Staff Portal', icon: '🏠' };
  };

  const breadcrumb = getBreadcrumbInfo();

  return (
    <div className="min-h-screen flex flex-col bg-mesh text-ink">
      {/* Admin Header - Compact */}
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/95 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
          {/* Left: Mobile menu + Logo */}
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden p-2 hover:bg-white/60 rounded-lg transition"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/staff" className="flex items-center gap-1.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-xs font-bold text-cream">
                RMS
              </div>
              <span className="hidden sm:block text-xs font-bold text-forest">Staff</span>
            </Link>
          </div>

          {/* Center: Breadcrumb - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate">
            <span>{breadcrumb.icon}</span>
            <span className="font-semibold text-ink">{t(breadcrumb.label)}</span>
          </div>

          {/* Right: Language + User Info */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            
            {/* Desktop User Info */}
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-ink/10">
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-cream">
                  {session?.user.fullName?.charAt(0) || '?'}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="text-xs font-semibold text-slate hover:text-ember transition"
                title="Sign out"
              >
                →
              </button>
            </div>

            {/* Mobile User Avatar Only */}
            <div className="sm:hidden flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-cream">
              {session?.user.fullName?.charAt(0) || '?'}
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AdminSidebar session={session} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={onLogout} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-7xl flex flex-col gap-6 px-3 py-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

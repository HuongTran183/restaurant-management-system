import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AuthSession } from '../lib/api';

type AdminSidebarItem = {
  label: string;
  path: string;
  icon: React.ReactNode;
  requiredRoles?: string[];
};

function DashboardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function TableIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  );
}

function ShoppingCartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

const SIDEBAR_ITEMS: AdminSidebarItem[] = [
  { label: 'Dashboard', path: '/staff', icon: <DashboardIcon />, requiredRoles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { label: 'Reservations', path: '/staff/reservations', icon: <CalendarIcon />, requiredRoles: ['ADMIN', 'MANAGER', 'WAITER'] },
  { label: 'Floor & Tables', path: '/staff/floor', icon: <TableIcon />, requiredRoles: ['ADMIN', 'MANAGER', 'WAITER'] },
  { label: 'Orders', path: '/staff/orders', icon: <ShoppingCartIcon />, requiredRoles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { label: 'Payments', path: '/staff/payments', icon: <CreditCardIcon />, requiredRoles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { label: 'Requests', path: '/staff/requests', icon: <BellIcon />, requiredRoles: ['ADMIN', 'MANAGER', 'WAITER'] },
];

export function AdminSidebar({ session, isOpen, onClose, onLogout }: { session: AuthSession | null; isOpen: boolean; onClose: () => void; onLogout?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();
  const userRoles = session?.user.roles ?? [];

  const visibleItems = SIDEBAR_ITEMS.filter((item) => !item.requiredRoles || item.requiredRoles.some((role) => userRoles.includes(role)));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r border-ink/10 bg-cream/95 backdrop-blur transition-transform duration-300 overflow-y-auto lg:sticky lg:top-16 lg:translate-x-0 lg:bg-cream/80',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {visibleItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/staff' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={clsx(
                  'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition duration-200',
                  isActive
                    ? 'bg-forest text-cream shadow-md'
                    : 'text-slate hover:bg-white/80 hover:text-forest',
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1">{t(item.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile: User info section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-ink/10 bg-white/50 p-4 lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-forest text-sm font-bold text-cream">
              {session?.user.fullName?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold text-ink">{session?.user.fullName}</p>
              <p className="truncate text-xs text-slate">{session?.user.roles?.[0]}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full rounded-lg bg-ember/10 px-3 py-2 text-xs font-semibold text-ember transition hover:bg-ember/20"
          >
            {t('Sign out')}
          </button>
        </div>
      </aside>
    </>
  );
}

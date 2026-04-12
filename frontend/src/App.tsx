import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { authApi, type AuthSession } from './lib/api';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { clearSession, msUntilSessionRefresh, readSession, saveSession, shouldRefreshSession } from './lib/session';
import { AreaManagementPage } from './pages/AreaManagementPage';
import { CategoryManagementPage } from './pages/CategoryManagementPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CustomerManagementPage } from './pages/CustomerManagementPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { DishDetailPage } from './pages/DishDetailPage';
import { MenuItemManagementPage } from './pages/MenuItemManagementPage';
import { QrExperiencePage } from './pages/QrExperiencePage';
import { ReservationManagementPage } from './pages/ReservationManagementPage';
import { ReservationPage } from './pages/ReservationPage';
import { StaffDashboardPage } from './pages/StaffDashboardPage';
import { StaffLoginPage } from './pages/StaffLoginPage';
import { StaffReservationCreatePage } from './pages/StaffReservationCreatePage';
import { StaffRegistrationPage } from './pages/StaffRegistrationPage';
import { StaffServiceRequestCreatePage } from './pages/StaffServiceRequestCreatePage';
import { StaffTableQrPage } from './pages/StaffTableQrPage';
import { TableManagementPage } from './pages/TableManagementPage';
import { UserManagementPage } from './pages/UserManagementPage';

const initialSession = typeof window === 'undefined' ? null : readSession();

export default function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [isSessionReady, setIsSessionReady] = useState(initialSession === null);

  function updateSession(nextSession: AuthSession | null) {
    setSession(nextSession);
    if (nextSession) {
      saveSession(nextSession);
      return;
    }
    clearSession();
  }

  async function refreshCurrentSession(currentSession: AuthSession): Promise<AuthSession | null> {
    try {
      const nextSession = await authApi.refresh(currentSession.refreshToken);
      updateSession(nextSession);
      return nextSession;
    } catch {
      updateSession(null);
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    if (!session) {
      setIsSessionReady(true);
      return () => {
        active = false;
      };
    }

    if (!shouldRefreshSession(session)) {
      setIsSessionReady(true);
      return () => {
        active = false;
      };
    }

    setIsSessionReady(false);
    void refreshCurrentSession(session).finally(() => {
      if (active) {
        setIsSessionReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [session?.accessTokenExpiresAt, session?.refreshToken]);

  useEffect(() => {
    if (!session || shouldRefreshSession(session)) {
      return;
    }

    const delay = msUntilSessionRefresh(session);
    if (delay === null) {
      return;
    }

    const handle = window.setTimeout(() => {
      void refreshCurrentSession(session);
    }, delay);

    return () => {
      window.clearTimeout(handle);
    };
  }, [session?.accessTokenExpiresAt, session?.refreshToken]);

  const appRoutes = (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/menu/items/:menuItemId" element={<DishDetailPage />} />
      <Route path="/login" element={<CustomerLoginPage onSignedIn={updateSession} session={session} isSessionReady={isSessionReady} />} />
      <Route path="/register" element={<CustomerRegisterPage onSignedIn={updateSession} session={session} isSessionReady={isSessionReady} />} />
      <Route path="/book" element={<ReservationPage />} />
      <Route path="/book/manage" element={<ReservationManagementPage />} />
      <Route path="/qr/:token" element={<QrExperiencePage />} />
      <Route path="/staff/login" element={<StaffLoginPage onSignedIn={updateSession} session={session} isSessionReady={isSessionReady} />} />
      <Route path="/staff/register" element={<StaffRegistrationPage session={session} isSessionReady={isSessionReady} />} />
      <Route
        path="/staff"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <StaffDashboardPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/areas"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <AreaManagementPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/tables"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <TableManagementPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/tables/:tableId/qr"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <StaffTableQrPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/users"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <UserManagementPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/customers"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <CustomerManagementPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/categories"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <CategoryManagementPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/menu-items"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <MenuItemManagementPage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/reservations/new"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <StaffReservationCreatePage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/service-requests/new"
        element={
          <ProtectedRoute session={session} isSessionReady={isSessionReady}>
            <StaffServiceRequestCreatePage
              session={session}
              onLogout={() => updateSession(null)}
              onRefreshSession={refreshCurrentSession}
            />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  const isStandaloneRoute =
    location.pathname.startsWith('/book/manage')
    || location.pathname.startsWith('/menu/items/')
    || location.pathname.startsWith('/staff/categories')
    || location.pathname.startsWith('/staff/menu-items')
    || location.pathname.startsWith('/staff/areas')
    || location.pathname.startsWith('/staff/tables')
    || location.pathname.startsWith('/staff/users')
    || location.pathname.startsWith('/staff/customers')
    || location.pathname.startsWith('/staff/reservations/new')
    || location.pathname.startsWith('/staff/service-requests/new');
  if (isStandaloneRoute) {
    return appRoutes;
  }

  return (
    <div className="min-h-screen bg-mesh text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-sm font-bold uppercase tracking-[0.24em] text-cream">
              RMS
            </div>
            <div>
              <p className="font-display text-2xl leading-none">Restaurant OS</p>
              <p className="text-sm text-slate">{t('POS, QR dining, and booking in one orbit')}</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-2 md:flex">
              <TopNavLink to="/menu">{t('Menu')}</TopNavLink>
              <TopNavLink to="/book">{t('Reservations')}</TopNavLink>
              {session ? (
                <>
                  {session.user.roles.includes('CUSTOMER') ? (
                    <button
                      onClick={() => updateSession(null)}
                      className="rounded-full px-4 py-2 text-sm font-medium text-slate transition hover:bg-white/80 hover:text-forest"
                    >
                      {t('Logout')} ({session.user.fullName})
                    </button>
                  ) : (
                    <TopNavLink to="/staff">{t('Dashboard')}</TopNavLink>
                  )}
                </>
              ) : (
                <>
                  <TopNavLink to="/login">{t('Login')}</TopNavLink>
                  <Link to="/register" className="button-primary text-sm">
                    {t('Sign Up')}
                  </Link>
                </>
              )}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {appRoutes}
      </main>
    </div>
  );
}

function ProtectedRoute({
  children,
  isSessionReady,
  session,
}: {
  children: ReactNode;
  isSessionReady: boolean;
  session: AuthSession | null;
}) {
  if (!isSessionReady) {
    return <div className="panel px-6 py-8">Đang làm mới phiên…</div>;
  }

  if (!session) {
    return <Navigate to="/staff/login" replace />;
  }

  return <>{children}</>;
}

function TopNavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-full px-4 py-2 text-sm font-medium text-slate transition hover:bg-white/80 hover:text-forest"
    >
      {children}
    </Link>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AuthSession } from '../../lib/api';
import { staffApi, ApiError } from '../../lib/api';
import { ErrorState, KPIMetric, LoadingState, EmptyMessage } from '../PagePrimitives';
import { Link } from 'react-router-dom';

type AdminDashboardPageProps = {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
};

export function AdminDashboardPage({
  session,
  onLogout,
  onRefreshSession,
}: AdminDashboardPageProps) {
  const { t } = useTranslation();

  const runStaffRequest = async <T,>(requestFn: (token: string) => Promise<T>): Promise<T> => {
    if (!session) throw new ApiError('Session expired', 401);
    try {
      return await requestFn(session.accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshed = await onRefreshSession(session);
        if (!refreshed) {
          onLogout();
          throw new ApiError('Session expired', 401);
        }
        return requestFn(refreshed.accessToken);
      }
      throw error;
    }
  };

  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.dashboard(token, {
      canManageFloor: true,
      canManageBilling: true,
    })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  if (dashboardQuery.isLoading) return <LoadingState label={t('Loading dashboard')} />;
  if (dashboardQuery.error) return <ErrorState error={dashboardQuery.error} />;
  if (!dashboardQuery.data) return <EmptyMessage message={t('No dashboard data')} />;

  const data = dashboardQuery.data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('Dashboard')}</h1>
        <p className="mt-1 text-sm text-slate">{t('Overview of current operations')}</p>
      </div>

      {/* Welcome Section - Reduced Height */}
      <div className="rounded-xl border border-ink/10 bg-gradient-to-br from-forest/5 to-transparent p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-ink">{t('Welcome')}, {session?.user.fullName}</h2>
            <p className="mt-1 text-xs text-slate">{t('Today operations summary')}</p>
          </div>
          <div className="rounded-lg bg-forest/10 px-2 py-1 text-xs font-semibold text-forest">
            {session?.user.roles?.[0]}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPIMetric
          label={t('Today Orders')}
          value={String(data.orders.totalElements ?? 0)}
          tone="forest"
        />
        <KPIMetric
          label={t('Reservations')}
          value={String(data.reservations.totalElements ?? 0)}
          tone="forest"
        />
        <KPIMetric
          label={t('Service Requests')}
          value={String(data.serviceRequests.totalElements ?? 0)}
          tone="ember"
        />
        <KPIMetric
          label={t('Pending Payments')}
          value={String(data.invoices.totalElements ?? 0)}
          tone="slate"
        />
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Reservations */}
        <Link to="/staff/reservations" className="group rounded-lg border border-ink/10 bg-cream/50 p-3 transition hover:border-forest/30 hover:bg-forest/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate">{t('Reservations')}</p>
              <p className="mt-1 text-lg font-bold text-forest">{data.reservations.totalElements ?? 0}</p>
              <p className="text-xs text-slate">{t('Pending confirmation')}</p>
            </div>
            <span className="text-lg transition group-hover:translate-x-0.5">→</span>
          </div>
        </Link>

        {/* Service Requests */}
        <Link to="/staff/requests" className="group rounded-lg border border-ink/10 bg-cream/50 p-3 transition hover:border-amber-300/30 hover:bg-amber-50">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate">{t('Requests')}</p>
              <p className="mt-1 text-lg font-bold text-amber-600">{data.serviceRequests.totalElements ?? 0}</p>
              <p className="text-xs text-slate">{t('Need attention')}</p>
            </div>
            <span className="text-lg transition group-hover:translate-x-0.5">→</span>
          </div>
        </Link>

        {/* Payments */}
        <Link to="/staff/payments" className="group rounded-lg border border-ink/10 bg-cream/50 p-3 transition hover:border-ember/30 hover:bg-ember/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate">{t('Payments')}</p>
              <p className="mt-1 text-lg font-bold text-ember">{data.invoices.totalElements ?? 0}</p>
              <p className="text-xs text-slate">{t('Awaiting collection')}</p>
            </div>
            <span className="text-lg transition group-hover:translate-x-0.5">→</span>
          </div>
        </Link>

        {/* Orders */}
        <Link to="/staff/orders" className="group rounded-lg border border-ink/10 bg-cream/50 p-3 transition hover:border-forest/30 hover:bg-forest/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate">{t('Orders')}</p>
              <p className="mt-1 text-lg font-bold text-forest">{data.orders.totalElements ?? 0}</p>
              <p className="text-xs text-slate">{t('Being processed')}</p>
            </div>
            <span className="text-lg transition group-hover:translate-x-0.5">→</span>
          </div>
        </Link>

        {/* Floor */}
        <Link to="/staff/floor" className="group rounded-lg border border-ink/10 bg-cream/50 p-3 transition hover:border-sky/30 hover:bg-sky/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate">{t('Floor & Tables')}</p>
              <p className="mt-1 text-lg font-bold text-sky">→</p>
              <p className="text-xs text-slate">{t('Manage tables')}</p>
            </div>
            <span className="text-lg transition group-hover:translate-x-0.5">→</span>
          </div>
        </Link>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Link } from 'react-router-dom';
import type { AuthSession } from '../../lib/api';
import type { DashboardOverviewMetric } from '../../lib/staffDashboardMetrics';
import { RoleChip } from '../../lib/staffUtils';
import type { WorkspaceLane } from '../../lib/useStaffDashboard';
import i18n from '../../i18n/i18n';

type StaffDashboardCommandCenterProps = {
  activeLaneBody: string;
  activeLaneTitle: string;
  metrics: DashboardOverviewMetric[];
  onLogout?: () => void;
  onRefreshWorkspace: () => void;
  onWorkspaceLaneChange: (lane: WorkspaceLane) => void;
  session: AuthSession | null;
  showLaneSwitcher: boolean;
  userRoles: AuthSession['user']['roles'];
  workspaceLane: WorkspaceLane;
};

export function StaffDashboardCommandCenter({
  activeLaneBody,
  activeLaneTitle,
  metrics,
  onLogout,
  onRefreshWorkspace,
  onWorkspaceLaneChange,
  session,
  showLaneSwitcher,
  userRoles,
  workspaceLane,
}: StaffDashboardCommandCenterProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const handle = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      window.clearInterval(handle);
    };
  }, []);

  return (
    <section
      className="overflow-hidden rounded-lg border border-ink/10 bg-white px-6 py-6 shadow-[0_20px_46px_-36px_rgba(22,33,29,0.26)] sm:px-8 sm:py-8"
      data-testid="staff-command-center"
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-ink/10 bg-cream px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-slate">
              {i18n.t('Operations command center')}
            </span>
            <span className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs font-semibold text-forest">
              {activeLaneTitle}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold text-ink sm:text-5xl">
            {i18n.t('Run the floor from one live surface, {{name}}.', { name: session?.user.fullName })}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate sm:text-base sm:leading-8">
            {activeLaneBody}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {userRoles.map((role) => (
              <div key={role} className="rounded-full border border-ink/10 bg-white">
                <RoleChip role={role} />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-ink/10 bg-cream/55 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Live snapshot')}</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-3xl font-bold text-forest">{formatTime(now)}</p>
                <p className="mt-1 text-sm text-slate">{formatDate(now)}</p>
              </div>
              <button className="button-ghost-light" onClick={onRefreshWorkspace} type="button">
                <span className="material-symbols-outlined text-lg">refresh</span>
                {i18n.t('Refresh')}
              </button>
            </div>

            {showLaneSwitcher ? (
              <div className="mt-4 inline-flex w-full flex-wrap rounded-md border border-ink/10 bg-white p-1">
                {(['ALL', 'FLOOR', 'BILLING'] as WorkspaceLane[]).map((lane) => (
                  <button
                    key={lane}
                    className={clsx(
                      'flex-1 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition',
                      workspaceLane === lane
                        ? 'bg-forest text-cream'
                        : 'text-slate hover:bg-cream hover:text-ink',
                    )}
                    onClick={() => onWorkspaceLaneChange(lane)}
                    type="button"
                  >
                    {lane === 'ALL'
                      ? i18n.t('All lanes')
                      : lane === 'FLOOR'
                        ? i18n.t('Floor lane')
                        : i18n.t('Billing lane')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Link className="rounded-lg border border-ink/10 bg-white px-4 py-4 transition hover:border-forest/20 hover:bg-cream/35" to="/staff/categories">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{i18n.t('Menu system')}</p>
              <p className="mt-2 text-lg font-semibold text-ink">{i18n.t('Menu Designer')}</p>
            </Link>
            <Link className="rounded-lg border border-ink/10 bg-white px-4 py-4 transition hover:border-forest/20 hover:bg-cream/35" to="/staff/menu-items">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{i18n.t('Dish catalog')}</p>
              <p className="mt-2 text-lg font-semibold text-ink">{i18n.t('Dish Mastery')}</p>
            </Link>
          </div>

          {onLogout ? (
            <button className="button-ghost w-full justify-center" onClick={onLogout} type="button">
              <span className="material-symbols-outlined text-lg">logout</span>
              {i18n.t('Log out')}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {metrics.map((metric) => (
          <article
            key={metric.id}
            className={clsx(
              'rounded-lg border bg-white px-4 py-4 transition',
              metric.tone === 'forest'
                ? 'border-forest/20'
                : metric.tone === 'ember'
                  ? 'border-ember/20'
                  : metric.tone === 'sun'
                    ? 'border-sun/25'
                    : 'border-ink/10',
            )}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate">{metric.label}</p>
            <p
              className={clsx(
                'mt-3 font-display text-3xl font-bold',
                metric.tone === 'forest'
                  ? 'text-forest'
                  : metric.tone === 'ember'
                    ? 'text-ember'
                    : metric.tone === 'sun'
                      ? 'text-ink'
                      : 'text-ink',
              )}
            >
              {metric.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate">{metric.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

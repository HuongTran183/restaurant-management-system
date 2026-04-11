import clsx from 'clsx';
import type { ChartDatum, RevenueHourPoint } from '../../lib/staffDashboardMetrics';
import { formatCurrency } from '../../lib/staffDashboardMetrics';
import i18n from '../../i18n/i18n';
import { ErrorState, LoadingState } from '../../pages/PagePrimitives';

type StaffQuickChartsPanelProps = {
  error: unknown;
  isLoading: boolean;
  kitchenItemBreakdown: ChartDatum[];
  orderStatusBreakdown: ChartDatum[];
  revenueByHour: RevenueHourPoint[];
  todayRevenue: number;
};

export function StaffQuickChartsPanel({
  error,
  isLoading,
  kitchenItemBreakdown,
  orderStatusBreakdown,
  revenueByHour,
  todayRevenue,
}: StaffQuickChartsPanelProps) {
  return (
    <section className="panel px-5 py-6" data-testid="quick-charts-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Quick charts')}</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">{i18n.t('Fast trend read')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate">
            {i18n.t('Keep the visuals short, operational, and readable from a distance.')}
          </p>
        </div>

        <div className="rounded-md border border-ink/10 bg-white px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{i18n.t('Collected today')}</p>
          <p className="mt-2 text-2xl font-bold text-forest">{formatCurrency(todayRevenue)}</p>
        </div>
      </div>

      {isLoading ? <LoadingState label={i18n.t('Loading dashboard charts')} /> : null}
      {error ? <ErrorState error={error} /> : null}

      {!isLoading && !error ? (
        <div className="mt-5 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-lg border border-ink/10 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{i18n.t('Revenue by hour')}</p>
            <div className="mt-5">
              <HourlyBars points={revenueByHour} />
            </div>
          </article>

          <div className="grid gap-4">
            <CompactChartCard
              data={orderStatusBreakdown}
              title={i18n.t('Orders by status')}
            />
            <CompactChartCard
              data={kitchenItemBreakdown}
              title={i18n.t('Kitchen item states')}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CompactChartCard({ data, title }: { data: ChartDatum[]; title: string }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <article className="rounded-lg border border-ink/10 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{title}</p>
      <div className="mt-4 space-y-3">
        {data.map((item) => {
          const width = total === 0 ? 0 : (item.value / total) * 100;

          return (
            <div key={`${title}-${item.label}`}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-ink">{item.label}</p>
                <span className="text-slate">{item.value}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-ink/6">
                <div
                  className={clsx(
                    'h-2 rounded-full',
                    item.tone === 'forest'
                      ? 'bg-forest'
                      : item.tone === 'ember'
                        ? 'bg-ember'
                        : item.tone === 'sun'
                          ? 'bg-sun'
                          : 'bg-slate',
                  )}
                  style={{ width: `${Math.max(width, item.value > 0 ? 8 : 0)}%` }}
                />
              </div>
              {item.helper ? <p className="mt-2 text-xs text-slate">{item.helper}</p> : null}
            </div>
          );
        })}
      </div>
    </article>
  );
}

function HourlyBars({ points }: { points: RevenueHourPoint[] }) {
  const maxAmount = Math.max(...points.map((point) => point.amount), 0);

  return (
    <div className="grid grid-cols-6 gap-3 xl:grid-cols-12">
      {points.map((point) => {
        const height = maxAmount === 0 ? 12 : Math.max((point.amount / maxAmount) * 140, point.amount > 0 ? 20 : 12);

        return (
          <div key={point.hour} className="flex flex-col items-center gap-2">
            <div className="flex h-40 w-full items-end justify-center rounded-md bg-cream/45 px-2 py-2">
              <div
                className={clsx(
                  'w-full rounded transition',
                  point.isCurrentHour ? 'bg-ink' : 'bg-forest/85',
                )}
                style={{ height }}
                title={`${point.label} • ${formatCurrency(point.amount)}`}
              />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate">{point.label}</p>
            <p className="text-[11px] text-slate">{point.count > 0 ? point.count : '0'}</p>
          </div>
        );
      })}
    </div>
  );
}

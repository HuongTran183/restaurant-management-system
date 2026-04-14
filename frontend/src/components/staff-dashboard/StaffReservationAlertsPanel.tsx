import clsx from 'clsx';
import type { Reservation } from '../../lib/api';
import type { ReservationAlert } from '../../lib/staffDashboardMetrics';
import i18n from '../../i18n/i18n';
import { ErrorState, LoadingState } from '../../pages/PagePrimitives';

type StaffReservationAlertsPanelProps = {
  alerts: ReservationAlert[];
  error: unknown;
  isLoading: boolean;
  onOpenReservation: (reservation: Reservation) => void;
};

export function StaffReservationAlertsPanel({
  alerts,
  error,
  isLoading,
  onOpenReservation,
}: StaffReservationAlertsPanelProps) {
  const summary = {
    critical: alerts.filter((alert) => alert.severity === 'critical').length,
    soon: alerts.filter((alert) => alert.severity === 'soon').length,
    upcoming: alerts.filter((alert) => alert.severity === 'upcoming').length,
  };

  return (
    <section className="panel px-5 py-6" data-testid="reservation-alerts-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Arrival pressure')}</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">{i18n.t('Reservation alert board')}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate">
            {i18n.t('Highlight the next bookings before table conflicts start. Stronger cards mean stronger urgency.')}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <SummaryBadge label={i18n.t('Critical')} tone="critical" value={summary.critical} />
          <SummaryBadge label={i18n.t('Soon')} tone="soon" value={summary.soon} />
          <SummaryBadge label={i18n.t('Upcoming')} tone="upcoming" value={summary.upcoming} />
        </div>
      </div>

      {isLoading ? <LoadingState label={i18n.t('Loading reservation alerts')} /> : null}
      {error ? <ErrorState error={error} /> : null}

      {!isLoading && !error ? (
        alerts.length ? (
          <div className="mt-5 grid gap-3">
            {alerts.slice(0, 6).map((alert) => (
              <article
                key={alert.reservation.id}
                className={clsx(
                  'rounded-lg border p-4 transition',
                  alert.severity === 'critical'
                    ? 'border-ember/25 bg-white'
                    : alert.severity === 'soon'
                      ? 'border-sun/35 bg-white'
                      : 'border-ink/10 bg-white',
                )}
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr] xl:flex-1">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{alert.reservation.customerName}</p>
                        <SeverityPill severity={alert.severity} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate">
                        {alert.reservation.reservationCode} • {alert.reservation.partySize} {i18n.t('guests')}
                      </p>
                    </div>
                    <DetailBlock label={i18n.t('Table')} value={alert.tableLabel} />
                    <DetailBlock label={i18n.t('Schedule')} value={`${alert.timeLabel} • ${alert.countdownLabel}`} />
                  </div>

                  <button className="button-chip-primary" onClick={() => onOpenReservation(alert.reservation)} type="button">
                    {i18n.t('Open reservation')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-dashed border-ink/15 bg-white px-4 py-6 text-sm leading-7 text-slate">
            {i18n.t('No reservations are nearing service in the next three hours.')}
          </div>
        )
      ) : null}
    </section>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-cream/35 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function SeverityPill({ severity }: { severity: ReservationAlert['severity'] }) {
  return (
    <span
      className={clsx(
        'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
        severity === 'critical'
          ? 'border-ember/20 bg-ember/10 text-ember'
          : severity === 'soon'
            ? 'border-sun/30 bg-sun/15 text-ink'
            : 'border-slate/15 bg-slate/10 text-slate',
      )}
    >
      {severity === 'critical'
        ? i18n.t('Critical')
        : severity === 'soon'
          ? i18n.t('Soon')
          : i18n.t('Upcoming')}
    </span>
  );
}

function SummaryBadge({
  label,
  tone,
  value,
}: {
  label: string;
  tone: ReservationAlert['severity'];
  value: number;
}) {
  return (
    <div
      className={clsx(
        'rounded-md border px-4 py-3',
        tone === 'critical'
          ? 'border-ember/18 bg-white'
          : tone === 'soon'
            ? 'border-sun/25 bg-white'
            : 'border-ink/10 bg-white',
      )}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className={clsx('mt-2 text-2xl font-bold', tone === 'critical' ? 'text-ember' : tone === 'soon' ? 'text-ink' : 'text-forest')}>{value}</p>
    </div>
  );
}

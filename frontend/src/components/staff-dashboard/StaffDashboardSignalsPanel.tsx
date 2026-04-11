import clsx from 'clsx';
import type { QrOrderInsight } from '../../lib/staffDashboardMetrics';
import { formatCurrency, formatPercent } from '../../lib/staffDashboardMetrics';
import i18n from '../../i18n/i18n';
import { ErrorState, LoadingState } from '../../pages/PagePrimitives';

type StaffQrSignalPanelProps = {
  activeQrOrderCount: number;
  error: unknown;
  isLoading: boolean;
  onOpenOrder: (sessionId: number, orderCode?: string) => void;
  qrOrderInsights: QrOrderInsight[];
  qrOrdersNeedingAttention: number;
  qrSalesShare: number;
  qrTicketValue: number;
};

export function StaffQrSignalPanel({
  activeQrOrderCount,
  error,
  isLoading,
  onOpenOrder,
  qrOrderInsights,
  qrOrdersNeedingAttention,
  qrSalesShare,
  qrTicketValue,
}: StaffQrSignalPanelProps) {
  return (
    <section className="panel px-5 py-6" data-testid="qr-signal-panel">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('QR traffic')}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-ink">{i18n.t('QR order signal')}</h2>
      <p className="mt-2 text-sm leading-7 text-slate">
        {i18n.t('Read QR demand as its own stream instead of hiding it inside general ticket volume.')}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Metric label={i18n.t('Active QR')} value={String(activeQrOrderCount)} />
        <Metric label={i18n.t('Need action')} value={String(qrOrdersNeedingAttention)} />
        <Metric label={i18n.t('Share')} value={formatPercent(qrSalesShare)} />
      </div>

      <div className="mt-3 rounded-md border border-ink/10 bg-cream/35 px-4 py-4">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{i18n.t('Open QR ticket value')}</p>
        <p className="mt-2 text-2xl font-bold text-forest">{formatCurrency(qrTicketValue)}</p>
      </div>

      {isLoading ? <LoadingState label={i18n.t('Loading QR order signal')} /> : null}
      {error ? <ErrorState error={error} /> : null}

      {!isLoading && !error ? (
        qrOrderInsights.length ? (
          <div className="mt-5 space-y-3">
            {qrOrderInsights.slice(0, 4).map((insight) => (
              <article key={insight.order.id} className="rounded-lg border border-ink/10 bg-white p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{insight.order.orderCode}</p>
                      <span
                        className={clsx(
                          'rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]',
                          insight.attentionTone === 'ember'
                            ? 'border-ember/20 bg-ember/10 text-ember'
                            : insight.attentionTone === 'sun'
                              ? 'border-sun/30 bg-sun/12 text-ink'
                              : 'border-forest/20 bg-forest/10 text-forest',
                        )}
                      >
                        {insight.attentionLabel}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate">
                      {insight.sessionLabel} • {insight.itemCount} {i18n.t('items')} • {formatCurrency(insight.order.totalAmount)}
                    </p>
                    {insight.pendingItems > 0 ? (
                      <p className="mt-2 text-sm text-ember">
                        {i18n.t('{{count}} item(s) still NEW and waiting for confirm', { count: insight.pendingItems })}
                      </p>
                    ) : null}
                    {insight.order.paymentRequested ? (
                      <p className="mt-2 text-sm text-slate">{i18n.t('Guest already requested the bill.')}</p>
                    ) : null}
                  </div>

                  {insight.order.tableSessionId !== null ? (
                    <button
                      className="button-chip"
                      onClick={() => onOpenOrder(insight.order.tableSessionId!, insight.order.orderCode)}
                      type="button"
                    >
                      {i18n.t('Open order flow')}
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-md border border-dashed border-ink/15 bg-white px-4 py-6 text-sm leading-7 text-slate">
            {i18n.t('No active QR orders right now.')}
          </div>
        )
      ) : null}
    </section>
  );
}

type StaffFloorPulsePanelProps = {
  openServiceRequestCount: number;
  paymentRequestedOrderCount: number;
  tableStatusSummary: {
    available: number;
    occupied: number;
    reserved: number;
    unavailable: number;
  };
  tablesServingCount: number;
};

export function StaffFloorPulsePanel({
  openServiceRequestCount,
  paymentRequestedOrderCount,
  tableStatusSummary,
  tablesServingCount,
}: StaffFloorPulsePanelProps) {
  return (
    <section className="panel px-5 py-6" data-testid="floor-pulse-panel">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Live floor pulse')}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-ink">{i18n.t('Service pressure')}</h2>
      <p className="mt-2 text-sm leading-7 text-slate">
        {i18n.t('A quick read on where the room is tight before jumping into the deeper workflow dock.')}
      </p>

      <div className="mt-5 grid gap-3">
        <PressureRow label={i18n.t('Open sessions')} tone="forest" value={tablesServingCount} />
        <PressureRow label={i18n.t('Open service requests')} tone="ember" value={openServiceRequestCount} />
        <PressureRow label={i18n.t('Bills requested')} tone="sun" value={paymentRequestedOrderCount} />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label={i18n.t('Available')} value={String(tableStatusSummary.available)} />
        <Metric label={i18n.t('Occupied')} value={String(tableStatusSummary.occupied)} />
        <Metric label={i18n.t('Reserved')} value={String(tableStatusSummary.reserved)} />
        <Metric label={i18n.t('Unavailable')} value={String(tableStatusSummary.unavailable)} />
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-2xl font-bold text-forest">{value}</p>
    </div>
  );
}

function PressureRow({
  label,
  tone,
  value,
}: {
  label: string;
  tone: 'forest' | 'ember' | 'sun';
  value: number;
}) {
  return (
    <div className="rounded-md border border-ink/10 bg-white px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
          <p className="mt-2 text-2xl font-bold text-forest">{value}</p>
        </div>
        <span
          className={clsx(
            'h-3 w-3 rounded-full',
            tone === 'forest' ? 'bg-forest' : tone === 'ember' ? 'bg-ember' : 'bg-sun',
          )}
        />
      </div>
    </div>
  );
}

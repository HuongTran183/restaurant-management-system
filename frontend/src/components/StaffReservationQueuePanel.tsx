import { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { DiningTable, Reservation } from '../lib/api';
import type { ReservationHostFilter, ReservationQueueScope, ReservationQueueSummary, ReservationActionInput } from '../lib/useStaffDashboard';
import { DataPanel, EmptyMessage, MiniQueueStat, reservationStatusTone, formatTableLabel } from '../lib/staffUtils';
import { ErrorState, InfoPair, InlineError, LoadingState, StatusPill } from '../pages/PagePrimitives';
import { formatDateTime } from '../pages/pageUtils';
import i18n from '../i18n/i18n';

// ============================================================================
// StaffReservationQueuePanel
// ============================================================================

type StaffReservationQueuePanelProps = {
  actionError: unknown;
  availableTables: DiningTable[];
  areaFilter: string;
  areaOptions: string[];
  hostFilter: ReservationHostFilter;
  isMutating: boolean;
  onAction: (action: ReservationActionInput) => void;
  onAreaFilterChange: (nextValue: string) => void;
  onClearFilters: () => void;
  onHostFilterChange: (filter: ReservationHostFilter) => void;
  onScopeChange: (scope: ReservationQueueScope) => void;
  onSearchChange: (nextValue: string) => void;
  quickSummary: ReservationQueueSummary;
  reservations: Reservation[];
  reservationsError: unknown;
  reservationsLoading: boolean;
  scope: ReservationQueueScope;
  search: string;
  tableOptionsError: unknown;
  tableOptionsLoading: boolean;
};

export function StaffReservationQueuePanel({
  actionError,
  availableTables,
  areaFilter,
  areaOptions,
  hostFilter,
  isMutating,
  onAction,
  onAreaFilterChange,
  onClearFilters,
  onHostFilterChange,
  onScopeChange,
  onSearchChange,
  quickSummary,
  reservations,
  reservationsError,
  reservationsLoading,
  scope,
  search,
  tableOptionsError,
  tableOptionsLoading,
}: StaffReservationQueuePanelProps) {
  const canClearFilters = search.trim() !== '' || scope !== 'ACTIVE' || hostFilter !== 'ALL' || areaFilter !== 'ALL';

  return (
    <DataPanel
      testId="reservation-queue-panel"
      title={i18n.t('Reservation queue')}
      subtitle={i18n.t('Confirm, seat, and complete reservations directly from the staff surface.')}
    >
      <div className="mb-5 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-end" data-testid="reservation-queue-header">
        <div className="inline-flex w-fit rounded-full border border-ink/10 bg-white/80 p-1">
          {(['ACTIVE', 'HISTORY', 'ALL'] as ReservationQueueScope[]).map((queueScope) => (
            <button
              key={queueScope}
              className={clsx(
                'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition',
                scope === queueScope ? 'bg-forest text-cream' : 'text-slate hover:text-ink',
              )}
              onClick={() => onScopeChange(queueScope)}
              type="button"
            >
              {queueScope === 'ACTIVE'
                ? i18n.t('Active')
                : queueScope === 'HISTORY'
                  ? i18n.t('History')
                  : i18n.t('All')}
            </button>
          ))}
        </div>

        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
            {i18n.t('Search reservations')}
          </span>
          <input
            className="field"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={i18n.t('Code, customer, or phone')}
            value={search}
          />
        </label>

        <button className="button-chip" disabled={!canClearFilters} onClick={onClearFilters} type="button">
          {i18n.t('Clear filters')}
        </button>
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1.2fr_16rem]">
        <div className="flex flex-wrap gap-2">
          {([
            ['ALL', i18n.t('All arrivals')],
            ['NEEDS_TABLE', i18n.t('Need table')],
            ['NEXT_SERVICE', i18n.t('Next 3h')],
            ['LARGE_PARTY', i18n.t('Large party')],
          ] as Array<[ReservationHostFilter, string]>).map(([filterKey, label]) => (
            <button
              key={filterKey}
              className={clsx('button-chip', hostFilter === filterKey && 'border-forest/25 bg-forest/10 text-forest')}
              onClick={() => onHostFilterChange(filterKey)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
            {i18n.t('Area focus')}
          </span>
          <select className="field" onChange={(event) => onAreaFilterChange(event.target.value)} value={areaFilter}>
            <option value="ALL">{i18n.t('All areas')}</option>
            <option value="__ANY__">{i18n.t('Any area')}</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <MiniQueueStat label={i18n.t('Visible')} value={String(quickSummary.total)} helper={i18n.t('after current filters')} />
        <MiniQueueStat
          label={i18n.t('Need table')}
          value={String(quickSummary.needsTable)}
          helper={i18n.t('confirmed parties still unassigned')}
        />
        <MiniQueueStat
          label={i18n.t('Next 3h')}
          value={String(quickSummary.nextService)}
          helper={i18n.t('upcoming arrival pressure')}
        />
      </div>

      {reservationsLoading ? <LoadingState label={i18n.t('Loading reservations')} /> : null}
      {reservationsError ? <ErrorState error={reservationsError} /> : null}
      {tableOptionsLoading ? <LoadingState label={i18n.t('Loading table options')} /> : null}
      {tableOptionsError ? <ErrorState error={tableOptionsError} /> : null}
      {actionError ? (
        <div className="mt-4">
          <InlineError error={actionError} />
        </div>
      ) : null}
      {!reservationsLoading && !reservationsError ? (
        <ReservationList
          availableTables={availableTables}
          isMutating={isMutating}
          onAction={onAction}
          reservations={reservations}
        />
      ) : null}
    </DataPanel>
  );
}

// ============================================================================
// ReservationList (internal to panel)
// ============================================================================

function ReservationList({
  availableTables,
  isMutating,
  onAction,
  reservations,
}: {
  availableTables: DiningTable[];
  isMutating: boolean;
  onAction: (action: ReservationActionInput) => void;
  reservations: Reservation[];
}) {
  const [tableSelections, setTableSelections] = useState<Record<number, string>>({});

  useEffect(() => {
    setTableSelections((current) => {
      const next = { ...current };

      reservations.forEach((reservation) => {
        if (reservation.status === 'CONFIRMED') {
          if (next[reservation.id] === undefined) {
            next[reservation.id] = reservation.assignedTableId === null ? '' : String(reservation.assignedTableId);
          }
        } else {
          delete next[reservation.id];
        }
      });

      return next;
    });
  }, [reservations]);

  if (!reservations.length) {
    return <EmptyMessage message={i18n.t('No reservations yet.')} />;
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          availableTables={availableTables}
          isMutating={isMutating}
          onAction={onAction}
          reservation={reservation}
          selectedTableId={tableSelections[reservation.id] ?? ''}
          onTableSelect={(tableId) => setTableSelections((current) => ({ ...current, [reservation.id]: tableId }))}
        />
      ))}
    </div>
  );
}

// ============================================================================
// ReservationCard
// ============================================================================

function ReservationCard({
  availableTables,
  isMutating,
  onAction,
  reservation,
  selectedTableId,
  onTableSelect,
}: {
  availableTables: DiningTable[];
  isMutating: boolean;
  onAction: (action: ReservationActionInput) => void;
  reservation: Reservation;
  selectedTableId: string;
  onTableSelect: (tableId: string) => void;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <p className="font-semibold text-ink">{reservation.customerName}</p>
              <p className="text-sm text-slate">
                {reservation.reservationCode} • {formatDateTime(reservation.reservationTime)}
              </p>
            </div>
            <StatusPill tone={reservationStatusTone(reservation.status)}>{i18n.t(reservation.status)}</StatusPill>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <InfoPair label={i18n.t('Party size')} value={`${reservation.partySize} ${i18n.t('guests')}`} />
            <InfoPair
              label={i18n.t('Table')}
              value={reservation.assignedTableName ?? reservation.assignedTableCode ?? i18n.t('Unassigned')}
            />
            <InfoPair label={i18n.t('Phone')} value={reservation.phone} />
            <InfoPair label={i18n.t('Area')} value={reservation.requestedArea || i18n.t('Any available')} />
          </div>

          <div className="rounded-[20px] border border-ink/10 bg-white/70 px-4 py-3 text-sm leading-7 text-slate">
            {reservation.status === 'PENDING'
              ? i18n.t('Host action: verify the booking details, then confirm or cancel it.')
              : reservation.status === 'CONFIRMED'
                ? i18n.t('Host action: pick the right table and check the party in when they arrive.')
                : reservation.status === 'CHECKED_IN'
                  ? i18n.t('Waiter action: the party is seated; complete the reservation after service handoff is done.')
                  : i18n.t('History only: no further staff action is required.')}
          </div>

          {reservation.note ? (
            <p className="text-sm leading-7 text-slate">
              {i18n.t('Guest note:')} {reservation.note}
            </p>
          ) : null}

          {reservation.status === 'CONFIRMED' ? (
            <div className="space-y-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
                  {i18n.t('Table for check-in')}
                </span>
                <select
                  className="field"
                  value={selectedTableId}
                  onChange={(event) => onTableSelect(event.target.value)}
                >
                  <option value="">{i18n.t('Choose a table')}</option>
                  {reservation.assignedTableId !== null && !availableTables.some((table) => table.id === reservation.assignedTableId) ? (
                    <option value={String(reservation.assignedTableId)}>
                      {reservation.assignedTableCode ?? i18n.t('Table #{{id}}', { id: reservation.assignedTableId })}{' '}
                      • {reservation.assignedTableName ?? i18n.t('Assigned table')}
                    </option>
                  ) : null}
                  {availableTables.map((table) => (
                    <option key={table.id} value={String(table.id)}>
                      {formatTableLabel(table)} • {table.areaName} • {table.seatCount} {i18n.t('seats')}
                    </option>
                  ))}
                </select>
              </label>
              {availableTables.length === 0 ? (
                <p className="text-sm leading-7 text-slate">{i18n.t('No available tables loaded yet.')}</p>
              ) : null}
            </div>
          ) : null}
        </div>

        <ReservationActions
          isMutating={isMutating}
          onAction={onAction}
          reservation={reservation}
          selectedTableId={selectedTableId}
        />
      </div>
    </div>
  );
}

// ============================================================================
// ReservationActions
// ============================================================================

function ReservationActions({
  isMutating,
  onAction,
  reservation,
  selectedTableId,
}: {
  isMutating: boolean;
  onAction: (action: ReservationActionInput) => void;
  reservation: Reservation;
  selectedTableId: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:items-end">
      {reservation.status === 'PENDING' ? (
        <>
          <button
            className="button-chip-primary"
            disabled={isMutating}
            onClick={() => onAction({ reservationId: reservation.id, kind: 'confirm' })}
            type="button"
          >
            {isMutating ? i18n.t('Saving...') : i18n.t('Confirm booking')}
          </button>
          <button
            className="button-chip"
            disabled={isMutating}
            onClick={() => onAction({ reservationId: reservation.id, kind: 'cancel', note: i18n.t('Cancelled from staff queue') })}
            type="button"
          >
            {isMutating ? i18n.t('Saving...') : i18n.t('Cancel booking')}
          </button>
        </>
      ) : null}

      {reservation.status === 'CONFIRMED' ? (
        <>
          <button
            className="button-chip-primary"
            disabled={isMutating || selectedTableId === ''}
            onClick={() =>
              onAction({
                reservationId: reservation.id,
                kind: 'check-in',
                diningTableId: Number(selectedTableId),
              })
            }
            title={selectedTableId === '' ? i18n.t('Choose a table before check-in') : undefined}
            type="button"
          >
            {isMutating ? i18n.t('Saving...') : i18n.t('Check in party')}
          </button>
          <button
            className="button-chip"
            disabled={isMutating}
            onClick={() => onAction({ reservationId: reservation.id, kind: 'cancel', note: i18n.t('Cancelled from staff queue') })}
            type="button"
          >
            {isMutating ? i18n.t('Saving...') : i18n.t('Cancel booking')}
          </button>
        </>
      ) : null}

      {reservation.status === 'CHECKED_IN' ? (
        <button
          className="button-chip-primary"
          disabled={isMutating}
          onClick={() => onAction({ reservationId: reservation.id, kind: 'complete' })}
          type="button"
        >
          {isMutating ? i18n.t('Saving...') : i18n.t('Complete handoff')}
        </button>
      ) : null}

      {reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED' ? (
        <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate">{i18n.t('No further action')}</span>
      ) : null}
    </div>
  );
}

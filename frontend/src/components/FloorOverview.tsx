import clsx from 'clsx';
import { useDeferredValue, useMemo, useState } from 'react';
import type { DiningTable, Reservation, ReservationStatus, TableSession, TableStatus } from '../lib/api';

export type FloorOverviewActionState = { kind: 'open-session' | 'close-session' | 'seat-walk-in'; tableId: number } | null;

type FloorOverviewProps = {
  actionState?: FloorOverviewActionState;
  onCloseSession?: (session: TableSession, table: DiningTable) => void;
  onJumpToOrder?: (session: TableSession, table: DiningTable) => void;
  onJumpToReservation?: (reservation: Reservation, table: DiningTable) => void;
  onOpenSession?: (table: DiningTable) => void;
  onSeatWalkIn?: (table: DiningTable) => void;
  reservations: Reservation[];
  sessions: TableSession[];
  tables: DiningTable[];
};

const ACTIVE_RESERVATION_STATUSES = new Set<ReservationStatus>(['PENDING', 'CONFIRMED', 'CHECKED_IN']);
const TABLE_STATUSES: Array<'ALL' | TableStatus> = ['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'LOCKED'];

export function FloorOverview({
  actionState = null,
  onCloseSession,
  onJumpToOrder,
  onJumpToReservation,
  onOpenSession,
  onSeatWalkIn,
  reservations,
  sessions,
  tables,
}: FloorOverviewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TableStatus>('ALL');
  const deferredSearch = useDeferredValue(search);

  const sessionByTableId = useMemo(() => {
    return new Map(sessions.map((session) => [session.diningTableId, session] as const));
  }, [sessions]);

  const activeReservationByTableId = useMemo(() => {
    const next = new Map<number, Reservation>();

    reservations
      .filter((reservation) => ACTIVE_RESERVATION_STATUSES.has(reservation.status) && reservation.assignedTableId !== null)
      .sort((left, right) => new Date(left.reservationTime).getTime() - new Date(right.reservationTime).getTime())
      .forEach((reservation) => {
        if (reservation.assignedTableId !== null && !next.has(reservation.assignedTableId)) {
          next.set(reservation.assignedTableId, reservation);
        }
      });

    return next;
  }, [reservations]);

  const filteredTables = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();

    return [...tables]
      .filter((table) => {
        if (statusFilter !== 'ALL' && table.status !== statusFilter) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        const session = sessionByTableId.get(table.id);
        const reservation = activeReservationByTableId.get(table.id);
        const haystack = [
          table.code,
          table.name,
          table.areaName,
          table.status,
          session?.sessionCode,
          reservation?.reservationCode,
          reservation?.customerName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      })
      .sort((left, right) => {
        const areaCompare = left.areaName.localeCompare(right.areaName, 'vi-VN', { sensitivity: 'base' });
        if (areaCompare !== 0) {
          return areaCompare;
        }

        const codeCompare = left.code.localeCompare(right.code, 'vi-VN', { sensitivity: 'base' });
        if (codeCompare !== 0) {
          return codeCompare;
        }

        return left.name.localeCompare(right.name, 'vi-VN', { sensitivity: 'base' });
      });
  }, [activeReservationByTableId, deferredSearch, sessionByTableId, statusFilter, tables]);

  const floorStats = useMemo(() => {
    const withSession = tables.filter((table) => sessionByTableId.has(table.id)).length;
    const withReservation = tables.filter((table) => activeReservationByTableId.has(table.id)).length;

    return {
      total: tables.length,
      withReservation,
      withSession,
    };
  }, [activeReservationByTableId, sessionByTableId, tables]);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr] xl:items-end">
        <div className="flex flex-wrap gap-2">
          <FloorMetric label="Tables" value={String(floorStats.total)} tone="forest" />
          <FloorMetric label="Live sessions" value={String(floorStats.withSession)} tone="ember" />
          <FloorMetric label="Active reservations" value={String(floorStats.withReservation)} tone="slate" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Search</span>
            <input
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Table, area, session, reservation"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Status</span>
            <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | TableStatus)}>
              {TABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? 'All statuses' : status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredTables.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredTables.map((table) => {
            const session = sessionByTableId.get(table.id);
            const reservation = activeReservationByTableId.get(table.id);
            const isBusy = actionState?.tableId === table.id;
            const canOpenSession = session === undefined && table.status !== 'CLEANING' && table.status !== 'LOCKED';
            const canSeatWalkIn = canOpenSession && reservation === undefined && table.status === 'AVAILABLE';
            const actionLabel =
              actionState?.kind === 'seat-walk-in'
                ? 'Seating...'
                : actionState?.kind === 'close-session'
                  ? 'Closing...'
                  : 'Opening...';

            return (
              <article key={table.id} className="rounded-[28px] border border-ink/10 bg-white/75 p-5 shadow-float">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{table.code}</p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{table.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate">{table.areaName}</p>
                  </div>
                  <StatusChip tone={tableStatusTone(table.status)}>{table.status}</StatusChip>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail label="Seats" value={`${table.seatCount}`} />
                  <Detail label="Area" value={table.areaName || 'Unassigned area'} />
                  <Detail
                    label="Session"
                    value={session ? session.sessionCode : 'No open session'}
                    helper={session ? `Opened ${formatDateTime(session.openedAt)}` : 'No table session is currently open'}
                  />
                  <Detail
                    label="Reservation"
                    value={reservation ? reservation.reservationCode : 'No active reservation'}
                    helper={reservation ? `${reservation.customerName} • ${formatDateTime(reservation.reservationTime)}` : 'No reservation assigned'}
                  />
                </div>

                <div className="mt-4 border-t border-ink/10 pt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">Next move</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {canSeatWalkIn ? (
                      <button
                        aria-label={`Seat walk-in for ${table.code}`}
                        className="button-chip-primary"
                        disabled={isBusy}
                        onClick={() => onSeatWalkIn?.(table)}
                        type="button"
                      >
                        {isBusy && actionState?.kind === 'seat-walk-in' ? actionLabel : 'Seat walk-in'}
                      </button>
                    ) : null}

                    {canOpenSession ? (
                      <button
                        aria-label={`Open session for ${table.code}`}
                        className="button-chip"
                        disabled={isBusy}
                        onClick={() => onOpenSession?.(table)}
                        type="button"
                      >
                        {isBusy && actionState?.kind === 'open-session' ? actionLabel : 'Open session'}
                      </button>
                    ) : null}

                    {session ? (
                      <button
                        aria-label={`Open order flow for ${table.code}`}
                        className="button-chip-primary"
                        onClick={() => onJumpToOrder?.(session, table)}
                        type="button"
                      >
                        Open order flow
                      </button>
                    ) : null}

                    {reservation ? (
                      <button
                        aria-label={`Open reservation for ${table.code}`}
                        className="button-chip"
                        onClick={() => onJumpToReservation?.(reservation, table)}
                        type="button"
                      >
                        Open reservation
                      </button>
                    ) : null}

                    {session ? (
                      <button
                        aria-label={`Close session for ${table.code}`}
                        className="button-chip"
                        disabled={isBusy}
                        onClick={() => onCloseSession?.(session, table)}
                        type="button"
                      >
                        {isBusy && actionState?.kind === 'close-session' ? actionLabel : 'Close session'}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">
          No tables match the current filters.
        </div>
      )}
    </div>
  );
}

function FloorMetric({ label, tone, value }: { label: string; tone: 'forest' | 'ember' | 'slate'; value: string }) {
  const gradient =
    tone === 'forest' ? 'from-forest to-forest/80' : tone === 'ember' ? 'from-ember to-ember/75' : 'from-slate to-slate/80';

  return (
    <div className={clsx('rounded-[24px] bg-gradient-to-br p-[1px]', gradient)}>
      <div className="rounded-[23px] bg-white/90 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate">{label}</p>
        <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      </div>
    </div>
  );
}

function Detail({ helper, label, value }: { helper?: string; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-cream/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
      {helper ? <p className="mt-2 text-sm leading-6 text-slate">{helper}</p> : null}
    </div>
  );
}

function StatusChip({ children, tone }: { children: string; tone: 'forest' | 'ember' | 'warm' | 'neutral' }) {
  const styles = {
    forest: 'bg-forest/10 text-forest border-forest/20',
    ember: 'bg-ember/10 text-ember border-ember/20',
    warm: 'bg-ember/10 text-ember border-ember/20',
    neutral: 'bg-slate/10 text-slate border-slate/20',
  }[tone];

  return <span className={clsx('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]', styles)}>{children}</span>;
}

function tableStatusTone(status: TableStatus) {
  switch (status) {
    case 'AVAILABLE':
      return 'forest';
    case 'OCCUPIED':
      return 'ember';
    case 'RESERVED':
      return 'warm';
    case 'CLEANING':
      return 'neutral';
    case 'LOCKED':
      return 'neutral';
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

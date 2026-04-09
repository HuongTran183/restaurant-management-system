import clsx from 'clsx';
import { useDeferredValue, useMemo, useState } from 'react';
import type { DiningTable, Reservation, ReservationStatus, TableSession, TableStatus } from '../lib/api';
import i18n from '../i18n/i18n';

export type FloorOverviewActionState = { kind: 'open-session' | 'close-session' | 'seat-walk-in'; tableId: number } | null;

type FloorOverviewProps = {
  actionState?: FloorOverviewActionState;
  onCloseSession?: (session: TableSession, table: DiningTable) => void;
  onJumpToOrder?: (session: TableSession, table: DiningTable) => void;
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
          <KPILabel label={i18n.t('Tables')} value={String(floorStats.total)} tone="forest" />
          <KPILabel label={i18n.t('Live sessions')} value={String(floorStats.withSession)} tone="ember" />
          <KPILabel label={i18n.t('Active reservations')} value={String(floorStats.withReservation)} tone="slate" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Search')}</span>
            <input
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={i18n.t('Table, area, session, reservation')}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Status')}</span>
            <select className="field" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | TableStatus)}>
              {TABLE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status === 'ALL' ? i18n.t('All statuses') : i18n.t(status)}
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


            return (
              <article key={table.id} className="rounded-[22px] border border-ink/10 bg-white/75 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate">{table.code}</p>
                    <p className="font-semibold text-ink truncate">{table.name}</p>
                    <p className="text-xs text-slate">{table.areaName}</p>
                  </div>
                  <StatusChip tone={tableStatusTone(table.status)}>{i18n.t(table.status)}</StatusChip>
                </div>

                {/* Key info - compact grid */}
                <div className="mt-3 grid gap-2 grid-cols-2 text-xs">
                  <div className="rounded-[16px] border border-ink/10 bg-cream/50 px-2 py-2">
                    <p className="font-bold uppercase tracking-[0.16em] text-slate text-[10px]">{i18n.t('Seats')}</p>
                    <p className="mt-1 font-semibold text-ink">{table.seatCount}</p>
                  </div>
                  <div className="rounded-[16px] border border-ink/10 bg-cream/50 px-2 py-2">
                    <p className="font-bold uppercase tracking-[0.16em] text-slate text-[10px]">{i18n.t('Session')}</p>
                    <p className="mt-1 font-semibold text-ink">{session ? session.sessionCode : '–'}</p>
                  </div>
                </div>

                {/* Reservation pill - if exists */}
                {reservation && (
                  <div className="mt-3 rounded-[16px] border border-forest/15 bg-forest/5 px-3 py-2">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate">
                      {reservation.reservationCode} • {reservation.customerName}
                    </p>
                  </div>
                )}

                {/* Actions - compact row */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {canSeatWalkIn ? (
                    <button
                      aria-label={i18n.t('Seat walk-in for {{code}}', { code: table.code })}
                      className="button-chip-primary flex-1 text-xs"
                      disabled={isBusy}
                      onClick={() => onSeatWalkIn?.(table)}
                      type="button"
                    >
                      {isBusy && actionState?.kind === 'seat-walk-in' ? i18n.t('Starting...') : i18n.t('Seat')}
                    </button>
                  ) : null}

                  {canOpenSession ? (
                    <button
                      aria-label={i18n.t('Open session for {{code}}', { code: table.code })}
                      className="button-chip text-xs"
                      disabled={isBusy}
                      onClick={() => onOpenSession?.(table)}
                      type="button"
                    >
                      {isBusy && actionState?.kind === 'open-session' ? i18n.t('...') : i18n.t('Open')}
                    </button>
                  ) : null}

                  {session ? (
                    <button
                      aria-label={i18n.t('Open order flow for {{code}}', { code: table.code })}
                      className="button-chip-primary text-xs"
                      onClick={() => onJumpToOrder?.(session, table)}
                      type="button"
                    >
                      {i18n.t('Order')}
                    </button>
                  ) : null}

                  {session ? (
                    <button
                      aria-label={i18n.t('Close session for {{code}}', { code: table.code })}
                      className="button-chip text-xs"
                      disabled={isBusy}
                      onClick={() => onCloseSession?.(session, table)}
                      type="button"
                    >
                      {isBusy && actionState?.kind === 'close-session' ? i18n.t('...') : i18n.t('Close')}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">
          {i18n.t('No tables match the current filters.')}
        </div>
      )}
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

function KPILabel({ label, tone, value }: { label: string; tone: 'forest' | 'ember' | 'slate'; value: string }) {
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

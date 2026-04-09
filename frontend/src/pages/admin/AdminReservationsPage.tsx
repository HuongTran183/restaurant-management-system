import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AuthSession, Reservation } from '../../lib/api';
import { staffApi, ApiError, type ReservationStatus } from '../../lib/api';
import { ErrorState, LoadingState, EmptyMessage } from '../PagePrimitives';

const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];
const HISTORY_RESERVATION_STATUSES: ReservationStatus[] = ['COMPLETED', 'CANCELLED'];

type AdminReservationsPageProps = {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
};

export function AdminReservationsPage({
  session,
  onLogout,
  onRefreshSession,
}: AdminReservationsPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [search, setSearch] = useState('');

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

  const loadAllPages = async <T,>(
    requestPage: (token: string, page: number, size: number) => Promise<{ content: T[]; totalPages: number }>,
  ): Promise<T[]> => {
    return runStaffRequest(async (token) => {
      const content: T[] = [];
      let page = 0;
      let totalPages = 1;
      while (page < totalPages) {
        const response = await requestPage(token, page, 100);
        content.push(...response.content);
        totalPages = response.totalPages;
        page += 1;
      }
      return content;
    });
  };

  const reservationsQuery = useQuery({
    queryKey: ['admin', 'reservations', session?.accessToken, scope, search],
    queryFn: () => {
      const statuses = scope === 'ACTIVE' ? ACTIVE_RESERVATION_STATUSES : HISTORY_RESERVATION_STATUSES;
      const keyword = search.trim() || undefined;
      return Promise.all(
        statuses.map((status) =>
          loadAllPages((token, page, size) =>
            staffApi.reservations(token, { page, size, status, query: keyword }),
          ),
        ),
      ).then((pages) =>
        pages
          .flat()
          .filter((res, idx, arr) => arr.findIndex((r) => r.id === res.id) === idx)
          .sort((a, b) => new Date(b.reservationTime).getTime() - new Date(a.reservationTime).getTime()),
      );
    },
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const reservationActionMutation = useMutation({
    mutationFn: (action: { kind: 'confirm' | 'cancel' | 'check-in'; reservationId: number; note?: string; tableId?: number }) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmReservation(token, action.reservationId);
          case 'cancel':
            return staffApi.cancelReservation(token, action.reservationId, { note: action.note });
          case 'check-in':
            return staffApi.checkInReservation(token, action.reservationId, { diningTableId: action.tableId ?? 0 });
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'reservations'] });
    },
  });

  if (reservationsQuery.isLoading) return <LoadingState label={t('Loading reservations')} />;
  if (reservationsQuery.error) return <ErrorState error={reservationsQuery.error} />;

  const reservations = reservationsQuery.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('Reservations')}</h1>
        <p className="mt-1 text-sm text-slate">{t('Manage reservation queue and guest check-ins')}</p>
      </div>

  {/* Filter & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-2">
          {(['ACTIVE', 'HISTORY'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                scope === s
                  ? 'bg-forest text-cream shadow'
                  : 'bg-white/60 text-slate hover:bg-white'
              }`}
            >
              {t(s === 'ACTIVE' ? 'Active' : 'History')}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder={t('Search by name, phone...')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs placeholder:text-slate/50 focus:border-forest focus:outline-none"
        />
      </div>

      {/* Reservations List */}
      {reservations.length === 0 ? (
        <EmptyMessage message={t('No reservations found')} />
      ) : (
        <div className="space-y-3">
          {reservations.map((res) => (
            <ReservationCard
              key={res.id}
              reservation={res}
              onAction={(kind, note, tableId) =>
                reservationActionMutation.mutate({ kind, reservationId: res.id, note, tableId })
              }
              isLoading={reservationActionMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationCard({
  reservation,
  onAction,
  isLoading,
}: {
  reservation: Reservation;
  onAction: (kind: 'confirm' | 'cancel' | 'check-in', note?: string, tableId?: number) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number | null>(reservation.assignedTableId || null);

  const time = new Date(reservation.reservationTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleCheckIn = () => {
    if (!selectedTableId) return;
    onAction('check-in', undefined, selectedTableId);
    setShowCheckInForm(false);
  };

  return (
    <div className={`rounded-lg border p-3 ${
      reservation.status === 'PENDING' ? 'border-amber-300 bg-amber-50' :
      reservation.status === 'CONFIRMED' ? 'border-forest/30 bg-forest/5' :
      'border-ink/10 bg-cream/50'
    }`}>
      <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink">{reservation.customerName}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              reservation.status === 'PENDING' ? 'bg-amber-200 text-amber-900' :
              reservation.status === 'CONFIRMED' ? 'bg-forest/20 text-forest' :
              reservation.status === 'CHECKED_IN' ? 'bg-sky/20 text-sky' :
              'bg-slate/20 text-slate'
            }`}>
              {reservation.status}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:gap-4 text-xs text-slate">
            <div>
              <p className="font-semibold text-slate/70 uppercase tracking-tight">{t('Time')}</p>
              <p className="mt-0.5 font-medium text-ink">{time}</p>
            </div>
            <div>
              <p className="font-semibold text-slate/70 uppercase tracking-tight">{t('Guests')}</p>
              <p className="mt-0.5 font-medium text-ink">{reservation.partySize}</p>
            </div>
            <div>
              <p className="font-semibold text-slate/70 uppercase tracking-tight">{t('Table')}</p>
              <p className="mt-0.5 font-medium text-ink">{reservation.assignedTableCode || '-'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 w-full sm:w-auto flex-wrap">
          {reservation.status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction('confirm')}
                disabled={isLoading}
                className="flex-1 sm:flex-none rounded-lg bg-forest text-cream px-2.5 py-1.5 text-xs font-semibold transition hover:bg-forest/90 disabled:opacity-50 whitespace-nowrap"
              >
                {t('Confirm')}
              </button>
              <button
                onClick={() => onAction('cancel')}
                disabled={isLoading}
                className="flex-1 sm:flex-none rounded-lg bg-ember/10 text-ember px-2.5 py-1.5 text-xs font-semibold transition hover:bg-ember/20 disabled:opacity-50 whitespace-nowrap"
              >
                {t('Cancel')}
              </button>
            </>
          )}
          {reservation.status === 'CONFIRMED' && (
            <button
              onClick={() => setShowCheckInForm(true)}
              disabled={isLoading}
              className="flex-1 sm:flex-none rounded-lg bg-sky text-cream px-2.5 py-1.5 text-xs font-semibold transition hover:bg-sky/90 disabled:opacity-50 whitespace-nowrap"
            >
              {t('Check In')}
            </button>
          )}
        </div>
      </div>

      {/* Check-in Form */}
      {showCheckInForm && reservation.status === 'CONFIRMED' && (
        <div className="mt-3 border-t pt-3 bg-sky/5 rounded p-2">
          <p className="text-xs font-semibold text-slate mb-2">{t('Select table to check in')}</p>
          <input
            type="number"
            placeholder={t('Enter table ID')}
            value={selectedTableId || ''}
            onChange={(e) => setSelectedTableId(e.target.value ? parseInt(e.target.value) : null)}
            className="w-full rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-xs focus:border-sky focus:outline-none mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleCheckIn}
              disabled={isLoading || !selectedTableId}
              className="flex-1 rounded-lg bg-sky text-cream px-2 py-1 text-xs font-semibold transition hover:bg-sky/90 disabled:opacity-50"
            >
              {t('Confirm Check In')}
            </button>
            <button
              onClick={() => setShowCheckInForm(false)}
              disabled={isLoading}
              className="flex-1 rounded-lg bg-slate/10 text-slate px-2 py-1 text-xs font-semibold transition hover:bg-slate/20 disabled:opacity-50"
            >
              {t('Cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AuthSession, DiningTable, TableSession } from '../../lib/api';
import { staffApi, ApiError } from '../../lib/api';
import { ErrorState, LoadingState, EmptyMessage } from '../PagePrimitives';

type AdminFloorPageProps = {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
};

export function AdminFloorPage({
  session,
  onLogout,
  onRefreshSession,
}: AdminFloorPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

  const tablesQuery = useQuery({
    queryKey: ['admin', 'floor-tables', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tables(token, { page, size, active: true })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const sessionsQuery = useQuery({
    queryKey: ['admin', 'table-sessions', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tableSessions(token, { page, size, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const floorActionMutation = useMutation({
    mutationFn: (action: { kind: 'open-session' | 'close-session' | 'seat-walk-in'; table: DiningTable; session?: TableSession }) =>
      runStaffRequest(async (token) => {
        if (action.kind === 'open-session') {
          return staffApi.openTableSession(token, action.table.id);
        } else if (action.kind === 'close-session' && action.session) {
          return staffApi.closeTableSession(token, action.session.id);
        } else if (action.kind === 'seat-walk-in') {
          const sess = await staffApi.openTableSession(token, action.table.id);
          await staffApi.createOrder(token, {
            orderType: 'DINE_IN',
            tableSessionId: sess.id,
            note: `Walk-in at ${action.table.code}`,
          });
          return sess;
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'floor'] });
    },
  });

  if (tablesQuery.isLoading || sessionsQuery.isLoading) return <LoadingState label={t('Loading floor data')} />;
  if (tablesQuery.error) return <ErrorState error={tablesQuery.error} />;

  const tables = tablesQuery.data ?? [];
  const sessions = sessionsQuery.data ?? [];

  // Group tables by area
  const tablesByArea = tables.reduce(
    (acc, table) => {
      const area = table.areaName || 'Uncategorized';
      if (!acc[area]) acc[area] = [];
      acc[area].push(table);
      return acc;
    },
    {} as Record<string, DiningTable[]>,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('Floor & Tables')}</h1>
        <p className="mt-1 text-sm text-slate">
          {t('Manage table sessions and seating')}
        </p>
      </div>

      {/* Tables by Area */}
      {Object.entries(tablesByArea).length === 0 ? (
        <EmptyMessage message={t('No tables available')} />
      ) : (
        Object.entries(tablesByArea).map(([area, areaTables]) => (
          <div key={area} className="space-y-3">
            <h2 className="text-lg font-semibold text-ink">{area}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {areaTables.map((table) => {
                const session = sessions.find((s) => s.diningTableId === table.id);
                return (
                  <FloorTableCard
                    key={table.id}
                    table={table}
                    session={session}
                    onAction={(kind) =>
                      floorActionMutation.mutate({ kind, table, session })
                    }
                    isLoading={floorActionMutation.isPending}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function FloorTableCard({
  table,
  session,
  onAction,
  isLoading,
}: {
  table: DiningTable;
  session?: TableSession;
  onAction: (kind: 'open-session' | 'close-session' | 'seat-walk-in') => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const isOccupied = session?.status === 'OPEN';

  return (
    <div
      className={`rounded-lg border-2 p-3 text-center transition ${
        isOccupied
          ? 'border-forest bg-forest/5'
          : 'border-ink/10 bg-cream/50 hover:border-ink/20'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate">
        {t('Table')}
      </p>
      <p className="mt-1 text-xl font-bold text-ink">{table.code}</p>
      <p className="text-xs text-slate">{table.seatCount} {t('seats')}</p>

      {isOccupied && (
        <button
          onClick={() => onAction('close-session')}
          disabled={isLoading}
          className="mt-2 w-full rounded bg-ember/10 px-2 py-1 text-xs font-semibold text-ember transition hover:bg-ember/20 disabled:opacity-50"
        >
          {t('Close')}
        </button>
      )}

      {!isOccupied && (
        <div className="mt-2 flex gap-1">
          <button
            onClick={() => onAction('open-session')}
            disabled={isLoading}
            className="flex-1 rounded bg-forest/10 px-1.5 py-1 text-xs font-semibold text-forest transition hover:bg-forest/20 disabled:opacity-50"
          >
            {t('Open')}
          </button>
          <button
            onClick={() => onAction('seat-walk-in')}
            disabled={isLoading}
            className="flex-1 rounded bg-sky/10 px-1.5 py-1 text-xs font-semibold text-sky transition hover:bg-sky/20 disabled:opacity-50"
          >
            {t('Walk-in')}
          </button>
        </div>
      )}
    </div>
  );
}

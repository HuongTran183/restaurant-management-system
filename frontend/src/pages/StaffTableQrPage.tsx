import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ApiError, type AuthSession, staffApi } from '../lib/api';
import { ErrorState, LoadingState } from './PagePrimitives';

export function StaffTableQrPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const { t } = useTranslation();
  const { tableId: tableIdParam } = useParams();
  const tableId = Number(tableIdParam);
  const queryClient = useQueryClient();

  const runStaffRequest = async <T,>(requestFn: (token: string) => Promise<T>): Promise<T> => {
    if (!session) {
      throw new ApiError('Session expired. Please sign in again.', 401);
    }
    try {
      return await requestFn(session.accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshedSession = await onRefreshSession(session);
        if (!refreshedSession) {
          onLogout();
          throw new ApiError('Session expired. Please sign in again.', 401);
        }
        return requestFn(refreshedSession.accessToken);
      }
      throw error;
    }
  };

  const tableQuery = useQuery({
    queryKey: ['staff', 'table', tableId, session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.getTable(token, tableId)),
    enabled: Boolean(session?.accessToken) && Number.isFinite(tableId) && tableId > 0,
    retry: false,
  });

  const qrQuery = useQuery({
    queryKey: ['staff', 'table-qr', tableId, session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.getTableQr(token, tableId)),
    enabled: Boolean(session?.accessToken) && Number.isFinite(tableId) && tableId > 0,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: () => runStaffRequest((token) => staffApi.generateTableQr(token, tableId, { expiresAt: null })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', 'table-qr', tableId] });
    },
  });

  if (!Number.isFinite(tableId) || tableId <= 0) {
    return (
      <PageLayout title={t('Table QR')} session={session} onLogout={onLogout} backTo="/staff/tables" backLabel={t('Tables')}>
        <ErrorState message={t('Missing or invalid table id in URL.')} />
      </PageLayout>
    );
  }

  if (tableQuery.isLoading) {
    return (
      <PageLayout title={t('Table QR')} session={session} onLogout={onLogout} backTo="/staff/tables" backLabel={t('Tables')}>
        <LoadingState />
      </PageLayout>
    );
  }

  if (tableQuery.isError) {
    return (
      <PageLayout title={t('Table QR')} session={session} onLogout={onLogout} backTo="/staff/tables" backLabel={t('Tables')}>
        <ErrorState error={tableQuery.error} />
      </PageLayout>
    );
  }

  const table = tableQuery.data!;
  const qr = qrQuery.isSuccess ? qrQuery.data : undefined;

  return (
    <PageLayout
      title={`${t('QR')} · ${table.name}`}
      subtitle={table.code}
      session={session}
      onLogout={onLogout}
      backTo="/staff/tables"
      backLabel={t('Tables')}
      maxWidth="2xl"
    >
      <div className="grid gap-4">
        {qr && qr.active ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{t('Guest link')}</p>
            <a className="mt-2 block break-all text-sm text-sky-700 underline" href={qr.landingUrl} target="_blank" rel="noreferrer">
              {qr.landingUrl}
            </a>
            <p className="mt-3 text-xs text-slate-500">
              {t('Token')}: <span className="font-mono">{qr.token}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">{t('No active QR for this table yet.')}</p>
        )}
        <button
          type="button"
          className="button-primary w-fit"
          disabled={generateMutation.isPending}
          onClick={() => generateMutation.mutate()}
        >
          {generateMutation.isPending ? t('Generating…') : t('Generate or refresh QR')}
        </button>
        {generateMutation.isError ? (
          <p className="text-sm text-rose-600">{(generateMutation.error as Error)?.message}</p>
        ) : null}
        <Link className="text-sm text-sky-700 underline" to="/staff/tables">
          {t('Back to table list')}
        </Link>
      </div>
    </PageLayout>
  );
}

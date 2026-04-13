import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ApiError, type AuthSession, staffApi } from '../lib/api';
import { toDateTimeLocalValue } from '../lib/staffWorkflowUtils';
import { ErrorState, Field, InlineError, LoadingState, StatusPill } from './PagePrimitives';
import { formatDateTime } from './pageUtils';

type QrFormState = {
  expiresAt: string;
  label: string;
};

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
  const queryClient = useQueryClient();
  const { tableId } = useParams<{ tableId: string }>();
  const [formState, setFormState] = useState<QrFormState>({ expiresAt: '', label: '' });
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);

  const parsedTableId = Number(tableId);
  const hasValidTableId = Number.isInteger(parsedTableId) && parsedTableId > 0;
  const userRoles = session?.user.roles ?? [];
  const canViewQr = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canRegenerateQr = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');

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
    queryKey: ['staff', 'table-qr', 'table', parsedTableId, session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.getTable(token, parsedTableId)),
    enabled: Boolean(session?.accessToken) && canViewQr && hasValidTableId,
    retry: false,
  });

  const qrQuery = useQuery({
    queryKey: ['staff', 'table-qr', 'detail', parsedTableId, session?.accessToken],
    queryFn: async () => {
      try {
        return await runStaffRequest((token) => staffApi.getTableQr(token, parsedTableId));
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }

        throw error;
      }
    },
    enabled: Boolean(session?.accessToken) && canViewQr && hasValidTableId,
    retry: false,
  });

  useEffect(() => {
    const nextLabel = qrQuery.data?.label ?? tableQuery.data?.name ?? '';
    const nextExpiresAt = toDateTimeLocalValue(qrQuery.data?.expiresAt);

    if (!nextLabel && !nextExpiresAt) {
      return;
    }

    setFormState({
      expiresAt: nextExpiresAt,
      label: nextLabel,
    });
  }, [qrQuery.data?.expiresAt, qrQuery.data?.label, tableQuery.data?.name]);

  const generateMutation = useMutation({
    mutationFn: () =>
      runStaffRequest((token) =>
        staffApi.generateTableQr(token, parsedTableId, {
          label: formState.label.trim() || undefined,
          expiresAt: formState.expiresAt ? new Date(formState.expiresAt).toISOString() : null,
        })),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['staff', 'table-qr', 'detail', parsedTableId] });
      setClipboardFeedback(t('QR updated successfully.'));
    },
  });

  async function handleCopyLandingUrl() {
    if (!qrQuery.data?.landingUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(qrQuery.data.landingUrl);
      setClipboardFeedback(t('Landing URL copied.'));
    } catch {
      setClipboardFeedback(t('Could not copy the landing URL on this device.'));
    }
  }

  if (!session) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('Please sign in to continue')} />
      </div>
    );
  }

  if (!canViewQr) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  if (!hasValidTableId) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('Invalid table identifier.')} />
      </div>
    );
  }

  const isLoading = tableQuery.isLoading || qrQuery.isLoading;
  const table = tableQuery.data;
  const qr = qrQuery.data;
  const pageTitle = table ? t('QR for {{table}}', { table: table.name }) : t('Table QR');
  const pageSubtitle = table
    ? t('Preview the public dining link, keep the token ready for support, and rotate the code when needed.')
    : t('Load the table and current QR settings.');

  return (
    <PageLayout
      backLabel={t('Tables')}
      backTo="/staff/tables"
      breadcrumb={[
        { label: t('Staff console'), to: '/staff' },
        { label: t('Table management'), to: '/staff/tables' },
        { label: t('QR manager') },
      ]}
      contentClassName="space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      maxWidth="7xl"
      noPadding
      onLogout={onLogout}
      session={session}
      subtitle={pageSubtitle}
      title={pageTitle}
    >
      {isLoading ? <LoadingState message={t('Loading table QR...')} /> : null}
      {tableQuery.error ? <ErrorState error={tableQuery.error} /> : null}
      {qrQuery.error ? <ErrorState error={qrQuery.error} /> : null}

      {!isLoading && !tableQuery.error && !qrQuery.error && table ? (
        <>
          <section className="grid gap-4 lg:grid-cols-4">
            <DetailCard label={t('Table code')} value={table.code} />
            <DetailCard label={t('Area')} value={table.areaName || t('Unassigned')} />
            <DetailCard label={t('Seat count')} value={String(table.seatCount)} />
            <DetailCard
              label={t('Current status')}
              value={t(table.status)}
              valueClassName={
                table.status === 'AVAILABLE'
                  ? 'text-forest'
                  : table.status === 'OCCUPIED'
                    ? 'text-ember'
                    : 'text-slate'
              }
            />
          </section>

          {qr ? (
            <section className="grid gap-6 xl:grid-cols-[340px_1fr]">
              <div className="panel flex flex-col items-center px-6 py-6 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('QR preview')}</p>
                <div className="mt-5 rounded-[28px] border border-ink/10 bg-white p-5 shadow-float">
                  <QRCodeSVG includeMargin size={240} value={qr.landingUrl} />
                </div>
                <p className="mt-4 text-sm text-slate">
                  {t('Customers who scan this code land on the public dining flow for {{table}}.', { table: table.name })}
                </p>
              </div>

              <div className="space-y-6">
                <section className="panel px-6 py-6">
                  <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Current QR')}</p>
                      <h2 className="mt-2 font-display text-3xl font-bold text-ink">{qr.label || table.name}</h2>
                      <p className="mt-2 text-sm leading-7 text-slate">
                        {t('Keep the token handy for support and use the landing URL whenever you need to test the guest flow.')}
                      </p>
                    </div>
                    <StatusPill tone={qr.active ? 'forest' : 'neutral'}>{qr.active ? t('Active') : t('Inactive')}</StatusPill>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <DetailCard label={t('Token')} value={qr.token} valueClassName="font-mono text-xs break-all sm:text-sm" />
                    <DetailCard label={t('Expiry')} value={qr.expiresAt ? formatDateTime(qr.expiresAt) : t('No expiry')} />
                    <DetailCard label={t('Table code')} value={qr.diningTableCode} />
                    <DetailCard label={t('Label')} value={qr.label || table.name} />
                  </div>

                  <div className="mt-4 rounded-[24px] border border-ink/10 bg-cream/40 px-5 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{t('Landing URL')}</p>
                    <p className="mt-2 break-all font-mono text-sm text-ink">{qr.landingUrl}</p>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="button-secondary" onClick={handleCopyLandingUrl} type="button">
                      {t('Copy landing URL')}
                    </button>
                    <a className="button-secondary" href={qr.landingUrl} rel="noreferrer" target="_blank">
                      {t('Open landing URL')}
                    </a>
                  </div>

                  {clipboardFeedback ? <p className="mt-3 text-sm text-forest">{clipboardFeedback}</p> : null}
                </section>

                <QrGenerationPanel
                  canRegenerateQr={canRegenerateQr}
                  error={generateMutation.error}
                  formState={formState}
                  isPending={generateMutation.isPending}
                  onChange={setFormState}
                  onSubmit={() => generateMutation.mutate()}
                />
              </div>
            </section>
          ) : (
            <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="panel px-6 py-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('QR status')}</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('No QR generated yet')}</h2>
                <p className="mt-3 text-sm leading-7 text-slate">
                  {canRegenerateQr
                    ? t('Generate the first QR code to give this table a dedicated public dining link.')
                    : t('Only managers and admins can generate the first QR code for this table.')}
                </p>
              </div>

              <QrGenerationPanel
                canRegenerateQr={canRegenerateQr}
                error={generateMutation.error}
                formState={formState}
                isPending={generateMutation.isPending}
                onChange={setFormState}
                onSubmit={() => generateMutation.mutate()}
              />
            </section>
          )}
        </>
      ) : null}
    </PageLayout>
  );
}

function DetailCard({
  label,
  value,
  valueClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/80 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className={`mt-2 text-sm font-semibold text-ink ${valueClassName}`}>{value}</p>
    </div>
  );
}

function QrGenerationPanel({
  canRegenerateQr,
  error,
  formState,
  isPending,
  onChange,
  onSubmit,
}: {
  canRegenerateQr: boolean;
  error: unknown;
  formState: QrFormState;
  isPending: boolean;
  onChange: React.Dispatch<React.SetStateAction<QrFormState>>;
  onSubmit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="panel px-6 py-6">
      <div className="border-b border-ink/10 pb-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Rotation controls')}</p>
        <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('Generate or regenerate')}</h2>
        <p className="mt-2 text-sm leading-7 text-slate">
          {canRegenerateQr
            ? t('Update the guest-facing label, set an optional expiry, and rotate the token whenever you need a fresh code.')
            : t('You can review the current QR details here, but only managers and admins can rotate the token.')}
        </p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label={t('Label')}>
          <input
            className="field"
            disabled={!canRegenerateQr || isPending}
            maxLength={120}
            onChange={(event) => onChange((current) => ({ ...current, label: event.target.value }))}
            placeholder={t('Table label for internal reference')}
            value={formState.label}
          />
        </Field>

        <Field label={t('Expiry (optional)')}>
          <input
            className="field"
            disabled={!canRegenerateQr || isPending}
            onChange={(event) => onChange((current) => ({ ...current, expiresAt: event.target.value }))}
            type="datetime-local"
            value={formState.expiresAt}
          />
        </Field>
      </div>

      {error ? (
        <div className="mt-4">
          <InlineError error={error} />
        </div>
      ) : null}

      {canRegenerateQr ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="button-primary" disabled={isPending} onClick={onSubmit} type="button">
            {isPending ? t('Generating...') : t('Regenerate QR')}
          </button>
        </div>
      ) : null}
    </section>
  );
}

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import {
  ApiError,
  type AuthSession,
  type ServiceRequestType,
  staffApi,
} from '../lib/api';
import { Field, InlineError, LoadingState } from './PagePrimitives';

const REQUEST_TYPES: ServiceRequestType[] = ['CALL_WAITER', 'REQUEST_BILL', 'WATER', 'OTHER'];

export function StaffServiceRequestCreatePage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const { t } = useTranslation();
  const [requestType, setRequestType] = useState<ServiceRequestType>('CALL_WAITER');
  const [note, setNote] = useState('');
  const [tableSessionId, setTableSessionId] = useState('');
  const [orderId, setOrderId] = useState('');

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

  const sessionsQuery = useQuery({
    queryKey: ['staff', 'service-request-create', 'sessions', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.tableSessions(token, { page: 0, size: 50, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ['staff', 'service-request-create', 'orders', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.orders(token, { page: 0, size: 30 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      runStaffRequest((token) =>
        staffApi.createServiceRequest(token, {
          requestType,
          note: note.trim() || undefined,
          tableSessionId: tableSessionId ? Number(tableSessionId) : undefined,
          orderId: orderId ? Number(orderId) : undefined,
        }),
      ),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <PageLayout
      title={t('New service request')}
      subtitle={t('Log a floor or guest request for the team')}
      session={session}
      onLogout={onLogout}
      backTo="/staff"
      backLabel={t('Staff dashboard')}
      maxWidth="2xl"
    >
      {sessionsQuery.isLoading || ordersQuery.isLoading ? (
        <LoadingState />
      ) : createMutation.isSuccess && createMutation.data ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
          <p className="font-semibold">{t('Request created')}</p>
          <p className="mt-2">#{createMutation.data.id}</p>
          <Link className="mt-3 inline-block text-emerald-800 underline" to="/staff">
            {t('Back to dashboard')}
          </Link>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label={t('Request type')}>
            <select
              className="input"
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as ServiceRequestType)}
            >
              {REQUEST_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Table session (optional)')}>
            <select
              className="input"
              value={tableSessionId}
              onChange={(e) => setTableSessionId(e.target.value)}
            >
              <option value="">{t('None')}</option>
              {(sessionsQuery.data?.content ?? []).map((s) => (
                <option key={s.id} value={String(s.id)}>
                  #{s.id} · {s.tableCode}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Order (optional)')}>
            <select className="input" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
              <option value="">{t('None')}</option>
              {(ordersQuery.data?.content ?? []).map((o) => (
                <option key={o.id} value={String(o.id)}>
                  {o.orderCode} · {o.status}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('Note')}>
            <textarea className="input min-h-[88px]" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          {createMutation.isError ? <InlineError error={createMutation.error} /> : null}
          <button type="submit" className="button-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('Saving…') : t('Submit request')}
          </button>
        </form>
      )}
    </PageLayout>
  );
}

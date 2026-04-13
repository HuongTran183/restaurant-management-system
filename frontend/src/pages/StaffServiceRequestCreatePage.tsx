import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import {
  ApiError,
  type AuthSession,
  type ServiceRequest,
  type ServiceRequestType,
  staffApi,
} from '../lib/api';
import { filterOrdersByTableSession, getActiveServiceRequestOrders } from '../lib/staffWorkflowUtils';
import { formatTableSessionLabel, serviceRequestLabel } from '../lib/staffUtils';
import { Field, InlineError, LoadingState, StatusPill } from './PagePrimitives';
import { formatDateTime, formatMoney } from './pageUtils';

type ServiceRequestFormState = {
  note: string;
  orderId: string;
  requestType: ServiceRequestType;
  tableSessionId: string;
};

function createEmptyForm(): ServiceRequestFormState {
  return {
    note: '',
    orderId: '',
    requestType: 'CALL_WAITER',
    tableSessionId: '',
  };
}

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
  const [formState, setFormState] = useState<ServiceRequestFormState>(createEmptyForm());
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);

  const userRoles = session?.user.roles ?? [];
  const canManageFloor = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');

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

  const tableSessionsQuery = useQuery({
    queryKey: ['staff', 'service-request-create', 'sessions', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.tableSessions(token, { page: 0, size: 100, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && canManageFloor,
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ['staff', 'service-request-create', 'orders', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.orders(token, { page: 0, size: 200 })),
    enabled: Boolean(session?.accessToken) && canManageFloor,
    retry: false,
  });

  const activeOrders = useMemo(
    () => getActiveServiceRequestOrders(ordersQuery.data?.content ?? []),
    [ordersQuery.data?.content],
  );

  const selectedSessionId = formState.tableSessionId ? Number(formState.tableSessionId) : null;
  const filteredOrders = useMemo(
    () => filterOrdersByTableSession(activeOrders, selectedSessionId),
    [activeOrders, selectedSessionId],
  );

  const selectedOrder = useMemo(
    () => activeOrders.find((order) => String(order.id) === formState.orderId) ?? null,
    [activeOrders, formState.orderId],
  );

  const selectedSession = useMemo(
    () => tableSessionsQuery.data?.content.find((sessionItem) => String(sessionItem.id) === formState.tableSessionId) ?? null,
    [formState.tableSessionId, tableSessionsQuery.data?.content],
  );

  useEffect(() => {
    if (!formState.orderId || selectedSessionId === null) {
      return;
    }

    const stillMatches = filteredOrders.some((order) => String(order.id) === formState.orderId);
    if (!stillMatches) {
      setFormState((current) => ({ ...current, orderId: '' }));
    }
  }, [filteredOrders, formState.orderId, selectedSessionId]);

  const createRequestMutation = useMutation({
    mutationFn: () =>
      runStaffRequest((token) =>
        staffApi.createServiceRequest(token, {
          tableSessionId: formState.tableSessionId ? Number(formState.tableSessionId) : undefined,
          orderId: formState.orderId ? Number(formState.orderId) : undefined,
          requestType: formState.requestType,
          note: formState.note.trim() || undefined,
        })),
    onSuccess: (serviceRequest) => {
      setCreatedRequest(serviceRequest);
      setValidationMessage(null);
    },
  });

  function resetWorkflow() {
    setFormState(createEmptyForm());
    setCreatedRequest(null);
    setValidationMessage(null);
    createRequestMutation.reset();
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.tableSessionId && !formState.orderId) {
      setValidationMessage(t('Choose at least a table session or an order before creating the request.'));
      return;
    }

    setValidationMessage(null);
    createRequestMutation.mutate();
  }

  function handleOrderChange(nextOrderId: string) {
    const nextOrder = activeOrders.find((order) => String(order.id) === nextOrderId) ?? null;

    setFormState((current) => ({
      ...current,
      orderId: nextOrderId,
      tableSessionId: nextOrder?.tableSessionId ? String(nextOrder.tableSessionId) : current.tableSessionId,
    }));
  }

  if (!session) {
    return (
      <div className="panel px-6 py-8">
        <InlineError message={t('Please sign in to continue')} />
      </div>
    );
  }

  if (!canManageFloor) {
    return (
      <div className="panel px-6 py-8">
        <InlineError message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  const isLoading = tableSessionsQuery.isLoading || ordersQuery.isLoading;

  return (
    <PageLayout
      backLabel={t('Service queue')}
      backTo="/staff?dock=service"
      breadcrumb={[
        { label: t('Staff console'), to: '/staff' },
        { label: t('Service queue'), to: '/staff?dock=service' },
        { label: t('New service request') },
      ]}
      contentClassName="space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      maxWidth="7xl"
      noPadding
      onLogout={onLogout}
      session={session}
      subtitle={t('Log a waiter call or bill request directly from the staff console when the guest does not use the QR flow.')}
      title={t('New service request')}
    >
      {isLoading ? <LoadingState message={t('Loading sessions and active orders...')} /> : null}
      {tableSessionsQuery.error ? <InlineError error={tableSessionsQuery.error} /> : null}
      {ordersQuery.error ? <InlineError error={ordersQuery.error} /> : null}

      {!isLoading && !tableSessionsQuery.error && !ordersQuery.error ? (
        createdRequest ? (
          <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="panel px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Request logged')}</p>
              <h2 className="mt-2 font-display text-4xl font-bold text-ink">#{createdRequest.id}</h2>
              <p className="mt-3 text-sm leading-7 text-slate">
                {t('The request now appears in the live service queue for staff follow-up.')}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <StatusPill tone={createdRequest.status === 'OPEN' ? 'warm' : 'neutral'}>
                  {t(createdRequest.status)}
                </StatusPill>
                <span className="text-sm font-semibold text-ink">{serviceRequestLabel(createdRequest.requestType)}</span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link className="button-primary" to="/staff?dock=service">
                  {t('Open service queue')}
                </Link>
                <button className="button-secondary" onClick={resetWorkflow} type="button">
                  {t('Create another')}
                </button>
              </div>
            </div>

            <div className="panel px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Request snapshot')}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <RequestDetail label={t('Type')} value={serviceRequestLabel(createdRequest.requestType)} />
                <RequestDetail label={t('Requested at')} value={formatDateTime(createdRequest.requestedAt)} />
                <RequestDetail
                  label={t('Table session')}
                  value={selectedSession ? formatTableSessionLabel(selectedSession) : createdRequest.tableSessionId ? `#${createdRequest.tableSessionId}` : t('None')}
                />
                <RequestDetail label={t('Order')} value={selectedOrder ? selectedOrder.orderCode : createdRequest.orderId ? `#${createdRequest.orderId}` : t('None')} />
              </div>

              {createdRequest.note ? (
                <div className="mt-4 rounded-[24px] border border-ink/10 bg-white/80 px-5 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{t('Notes')}</p>
                  <p className="mt-2 text-sm leading-7 text-ink">{createdRequest.note}</p>
                </div>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
            <form className="panel px-6 py-6" onSubmit={handleSubmit}>
              <div className="border-b border-ink/10 pb-5">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Manual request')}</p>
                <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('Link the request')}</h2>
                <p className="mt-2 text-sm leading-7 text-slate">
                  {t('Attach the request to an open table session, an active order, or both. Order selection can auto-fill the linked session.')}
                </p>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Field label={t('Table session')}>
                  <select
                    className="field"
                    disabled={createRequestMutation.isPending}
                    onChange={(event) => setFormState((current) => ({ ...current, tableSessionId: event.target.value }))}
                    value={formState.tableSessionId}
                  >
                    <option value="">{t('Select an open session')}</option>
                    {(tableSessionsQuery.data?.content ?? []).map((sessionItem) => (
                      <option key={sessionItem.id} value={sessionItem.id}>
                        {formatTableSessionLabel(sessionItem)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('Order')}>
                  <select
                    className="field"
                    disabled={createRequestMutation.isPending}
                    onChange={(event) => handleOrderChange(event.target.value)}
                    value={formState.orderId}
                  >
                    <option value="">{t('Select an active order')}</option>
                    {filteredOrders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderCode} · {t(order.status)} · {formatMoney(order.totalAmount)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('Request type')} required>
                  <select
                    className="field"
                    disabled={createRequestMutation.isPending}
                    onChange={(event) => setFormState((current) => ({ ...current, requestType: event.target.value as ServiceRequestType }))}
                    required
                    value={formState.requestType}
                  >
                    <option value="CALL_WAITER">{t('Call waiter')}</option>
                    <option value="REQUEST_BILL">{t('Request bill')}</option>
                    <option value="WATER">{t('Water refill')}</option>
                    <option value="OTHER">{t('Other request')}</option>
                  </select>
                </Field>

                <Field label={t('Notes')}>
                  <input
                    className="field"
                    disabled={createRequestMutation.isPending}
                    onChange={(event) => setFormState((current) => ({ ...current, note: event.target.value }))}
                    placeholder={t('Guest preference or extra context')}
                    value={formState.note}
                  />
                </Field>
              </div>

              {validationMessage ? (
                <div className="mt-4">
                  <InlineError message={validationMessage} />
                </div>
              ) : null}
              {createRequestMutation.error ? (
                <div className="mt-4">
                  <InlineError error={createRequestMutation.error} />
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button className="button-primary" disabled={createRequestMutation.isPending} type="submit">
                  {createRequestMutation.isPending ? t('Creating...') : t('Create service request')}
                </button>
                <button className="button-secondary" onClick={resetWorkflow} type="button">
                  {t('Reset form')}
                </button>
              </div>
            </form>

            <aside className="space-y-6">
              <section className="panel px-6 py-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Current draft')}</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <RequestDetail
                    label={t('Selected session')}
                    value={selectedSession ? formatTableSessionLabel(selectedSession) : t('None selected')}
                  />
                  <RequestDetail
                    label={t('Selected order')}
                    value={selectedOrder ? selectedOrder.orderCode : t('None selected')}
                  />
                  <RequestDetail label={t('Type')} value={serviceRequestLabel(formState.requestType)} />
                  <RequestDetail label={t('Matching orders')} value={String(filteredOrders.length)} />
                </div>
              </section>

              <section className="panel px-6 py-6">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Live sources')}</p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <RequestDetail label={t('Open sessions')} value={String((tableSessionsQuery.data?.content ?? []).length)} />
                  <RequestDetail label={t('Active orders')} value={String(activeOrders.length)} />
                </div>
                <p className="mt-4 text-sm leading-7 text-slate">
                  {t('When you pick a session first, the order list narrows to that session. Picking an order first can also fill the session automatically.')}
                </p>
              </section>
            </aside>
          </section>
        )
      ) : null}
    </PageLayout>
  );
}

function RequestDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/80 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

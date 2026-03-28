import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ApiError,
  type PaymentMethod,
  publicApi,
  staffApi,
  type AuthSession,
  type DiningTable,
  type Reservation,
  type ReservationStatus,
  type TableSession,
  type ServiceRequest,
  type ServiceRequestStatus,
} from '../lib/api';
import { FloorOverview, type FloorOverviewActionState } from '../components/FloorOverview';
import { StaffOperationsWorkbenchPanel } from '../components/StaffOperationsWorkbenchPanel';
import i18n from '../i18n/i18n';
import { ErrorState, InfoPair, InlineError, LoadingState, MetricCard, StatusPill } from './PagePrimitives';
import { formatDateTime } from './pageUtils';

type ReservationActionInput =
  | { reservationId: number; kind: 'confirm'; internalNote?: string }
  | { reservationId: number; kind: 'cancel'; note?: string }
  | { reservationId: number; kind: 'check-in'; diningTableId: number; internalNote?: string }
  | { reservationId: number; kind: 'complete' };

type OrderActionInput = { orderId: number; kind: 'confirm' | 'cancel' };

type PaymentInput = { invoiceId: number; amount: number; method: PaymentMethod; note?: string };

type InvoiceCreationInput = { orderId: number; orderCode: string };

type FloorActionInput =
  | { kind: 'open-session'; table: DiningTable }
  | { kind: 'close-session'; session: TableSession; table: DiningTable }
  | { kind: 'seat-walk-in'; table: DiningTable };

type ReservationQueueScope = 'ACTIVE' | 'HISTORY' | 'ALL';
type ReservationHostFilter = 'ALL' | 'NEEDS_TABLE' | 'NEXT_SERVICE' | 'LARGE_PARTY';
type WorkspaceLane = 'ALL' | 'FLOOR' | 'BILLING';

const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];
const HISTORY_RESERVATION_STATUSES: ReservationStatus[] = ['COMPLETED', 'CANCELLED'];
const ALL_RESERVATION_STATUSES: ReservationStatus[] = [...ACTIVE_RESERVATION_STATUSES, ...HISTORY_RESERVATION_STATUSES];

export function StaffDashboardPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  useTranslation();
  const queryClient = useQueryClient();
  const userRoles = session?.user.roles ?? [];
  const canManageFloor = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canManageBilling = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'CASHIER');
  const [workspaceLane, setWorkspaceLane] = useState<WorkspaceLane>(
    canManageFloor && canManageBilling ? 'ALL' : canManageFloor ? 'FLOOR' : 'BILLING',
  );
  const [reservationQueueScope, setReservationQueueScope] = useState<ReservationQueueScope>('ACTIVE');
  const [reservationHostFilter, setReservationHostFilter] = useState<ReservationHostFilter>('ALL');
  const [reservationAreaFilter, setReservationAreaFilter] = useState('ALL');
  const [reservationSearch, setReservationSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSessionFilter, setOrderSessionFilter] = useState<number | null>(null);
  const [floorActionState, setFloorActionState] = useState<FloorOverviewActionState>(null);
  const reservationPanelRef = useRef<HTMLDivElement | null>(null);
  const workbenchPanelRef = useRef<HTMLDivElement | null>(null);
  const showLaneSwitcher = canManageFloor && canManageBilling;
  const showFloorLane = canManageFloor && workspaceLane !== 'BILLING';
  const showBillingLane = canManageBilling && workspaceLane !== 'FLOOR';
  const activeLaneTitle = describeWorkspaceLane(workspaceLane, canManageFloor, canManageBilling);
  const activeLaneBody = describeWorkspaceLaneBody(workspaceLane, canManageFloor, canManageBilling);
  const workbenchTitle = showFloorLane && showBillingLane
    ? i18n.t('Operations workbench')
    : showFloorLane
      ? i18n.t('Floor workbench')
      : i18n.t('Billing workbench');
  const workbenchSubtitle = showFloorLane && showBillingLane
    ? i18n.t('Handle order confirmations and billing actions from one surface.')
    : showFloorLane
      ? i18n.t('Keep dine-in tickets, sessions, and floor follow-up moving from one place.')
      : i18n.t('Collect payment, reconcile invoices, and close the cashier loop from one place.');

  useEffect(() => {
    setWorkspaceLane((current) => {
      if (canManageFloor && canManageBilling) {
        return current === 'FLOOR' || current === 'BILLING' || current === 'ALL' ? current : 'ALL';
      }

      if (canManageFloor) {
        return 'FLOOR';
      }

      if (canManageBilling) {
        return 'BILLING';
      }

      return 'ALL';
    });
  }, [canManageBilling, canManageFloor]);

  const scrollToPanel = (ref: { current: HTMLDivElement | null }) => {
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const focusReservationWorkflow = (reservation: Reservation) => {
    setReservationQueueScope(
      reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'
        ? 'HISTORY'
        : 'ACTIVE',
    );
    setReservationHostFilter('ALL');
    setReservationAreaFilter('ALL');
    setReservationSearch(reservation.reservationCode);
    scrollToPanel(reservationPanelRef);
  };

  const focusOrderWorkflow = (options: { orderCode?: string; sessionId: number }) => {
    setOrderSessionFilter(options.sessionId);
    setOrderSearch(options.orderCode ?? '');
    scrollToPanel(workbenchPanelRef);
  };

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

  const loadAllPages = async <T,>(
    requestPage: (token: string, page: number, size: number) => Promise<{ content: T[]; totalPages: number }>,
    pageSize = 100,
  ): Promise<T[]> => {
    return runStaffRequest(async (token) => {
      const content: T[] = [];
      let page = 0;
      let totalPages = 1;

      while (page < totalPages) {
        const response = await requestPage(token, page, pageSize);
        content.push(...response.content);
        totalPages = Math.max(response.totalPages, page + 1);
        page += 1;
      }

      return content;
    });
  };

  const loadReservationsByStatuses = async (
    statuses: ReservationStatus[],
    query?: string,
    scope: ReservationQueueScope = 'ACTIVE',
  ): Promise<Reservation[]> => {
    const keyword = query?.trim() || undefined;
    const pages = await Promise.all(
      statuses.map((status) =>
        loadAllPages((token, page, size) => staffApi.reservations(token, { page, size, status, query: keyword })),
      ),
    );

    const direction = scope === 'HISTORY' ? -1 : 1;
    return pages
      .flat()
      .filter((reservation, index, reservations) => reservations.findIndex((candidate) => candidate.id === reservation.id) === index)
      .sort(
        (left, right) =>
          direction * (new Date(left.reservationTime).getTime() - new Date(right.reservationTime).getTime()),
      );
  };

  const dashboardQuery = useQuery({
    queryKey: ['staff', 'dashboard', session?.accessToken, showFloorLane, showBillingLane],
    queryFn: () => runStaffRequest((token) => staffApi.dashboard(token, { canManageFloor: showFloorLane, canManageBilling: showBillingLane })),
    enabled: Boolean(session?.accessToken) && (showFloorLane || showBillingLane),
    retry: false,
  });

  const reservationsQuery = useQuery({
    queryKey: ['staff', 'reservations', session?.accessToken, reservationQueueScope, reservationSearch],
    queryFn: () => {
      const statuses =
        reservationQueueScope === 'ACTIVE'
          ? ACTIVE_RESERVATION_STATUSES
          : reservationQueueScope === 'HISTORY'
            ? HISTORY_RESERVATION_STATUSES
            : ALL_RESERVATION_STATUSES;
      return loadReservationsByStatuses(statuses, reservationSearch, reservationQueueScope);
    },
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const floorReservationsQuery = useQuery({
    queryKey: ['staff', 'floor-reservations', session?.accessToken],
    queryFn: () => loadReservationsByStatuses(ACTIVE_RESERVATION_STATUSES),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ['staff', 'service-requests', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.serviceRequests(token, { size: 20, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const staffMenuQuery = useQuery({
    queryKey: ['staff', 'menu-items'],
    queryFn: publicApi.menu,
    enabled: showFloorLane,
    retry: false,
  });

  const tablesQuery = useQuery({
    queryKey: ['staff', 'tables', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tables(token, { page, size, active: true, status: 'AVAILABLE' })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const floorTablesQuery = useQuery({
    queryKey: ['staff', 'floor-tables', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tables(token, { page, size, active: true })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const tableSessionsQuery = useQuery({
    queryKey: ['staff', 'table-sessions', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tableSessions(token, { page, size, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ['staff', 'orders', session?.accessToken, orderSearch, orderSessionFilter],
    queryFn: () =>
      runStaffRequest((token) =>
        staffApi.orders(token, {
          size: orderSessionFilter === null && orderSearch.trim() === '' ? 12 : 30,
          tableSessionId: orderSessionFilter ?? undefined,
          query: orderSearch.trim() || undefined,
        }),
      ),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const invoicesQuery = useQuery({
    queryKey: ['staff', 'invoices', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.invoices(token, { size: 10 })),
    enabled: Boolean(session?.accessToken) && showBillingLane,
    retry: false,
  });

  const paymentsQuery = useQuery({
    queryKey: ['staff', 'payments', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.payments(token, { size: 10 })),
    enabled: Boolean(session?.accessToken) && showBillingLane,
    retry: false,
  });

  const [invoicePresenceByOrderId, setInvoicePresenceByOrderId] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!showBillingLane) {
      setInvoicePresenceByOrderId({});
      return;
    }

    const visibleOrders = ordersQuery.data?.content ?? [];
    if (!visibleOrders.length) {
      setInvoicePresenceByOrderId({});
      return;
    }

    const recentInvoiceOrderIds = new Set((invoicesQuery.data?.content ?? []).map((invoice) => invoice.orderId));
    const ordersNeedingLookup = visibleOrders.filter((order) => !recentInvoiceOrderIds.has(order.id));
    let active = true;

    void Promise.all(
      ordersNeedingLookup.map(async (order) => {
        const existingInvoices = await runStaffRequest((token) => staffApi.invoices(token, { size: 1, orderId: order.id }));
        return [order.id, existingInvoices.content.some((invoice) => invoice.orderId === order.id)] as const;
      }),
    )
      .then((results) => {
        if (!active) {
          return;
        }

        const nextPresence: Record<number, boolean> = {};
        visibleOrders.forEach((order) => {
          nextPresence[order.id] = recentInvoiceOrderIds.has(order.id);
        });
        results.forEach(([orderId, hasInvoice]) => {
          nextPresence[orderId] = hasInvoice;
        });
        setInvoicePresenceByOrderId(nextPresence);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setInvoicePresenceByOrderId((current) => {
          const nextPresence: Record<number, boolean> = {};
          visibleOrders.forEach((order) => {
            if (recentInvoiceOrderIds.has(order.id)) {
              nextPresence[order.id] = true;
            } else if (current[order.id] !== undefined) {
              nextPresence[order.id] = current[order.id];
            }
          });
          return nextPresence;
        });
      });

    return () => {
      active = false;
    };
  }, [showBillingLane, invoicesQuery.data, ordersQuery.data]);

  const reservationActionMutation = useMutation({
    mutationFn: (action: ReservationActionInput) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmReservation(token, action.reservationId, { internalNote: action.internalNote });
          case 'cancel':
            return staffApi.cancelReservation(token, action.reservationId, { note: action.note });
          case 'check-in':
            return staffApi.checkInReservation(token, action.reservationId, {
              diningTableId: action.diningTableId,
              internalNote: action.internalNote,
            });
          case 'complete':
            return staffApi.completeReservation(token, action.reservationId);
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const floorActionMutation = useMutation({
    mutationFn: (action: FloorActionInput) =>
      runStaffRequest(async (token) => {
        switch (action.kind) {
          case 'open-session': {
            const sessionResponse = await staffApi.openTableSession(token, action.table.id);
            return { kind: action.kind, session: sessionResponse, table: action.table } as const;
          }
          case 'close-session': {
            const sessionResponse = await staffApi.closeTableSession(token, action.session.id);
            return { kind: action.kind, session: sessionResponse, table: action.table } as const;
          }
          case 'seat-walk-in': {
            const sessionResponse = await staffApi.openTableSession(token, action.table.id);
            const order = await staffApi.createOrder(token, {
              orderType: 'DINE_IN',
              tableSessionId: sessionResponse.id,
              note: i18n.t('Walk-in started from {{tableCode}}', { tableCode: action.table.code }),
            });
            return { kind: action.kind, order, session: sessionResponse, table: action.table } as const;
          }
        }
      }),
    onMutate: (action) => {
      setFloorActionState({ kind: action.kind, tableId: action.table.id });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });

      if (result.kind === 'close-session') {
        setOrderSessionFilter((current) => (current === result.session.id ? null : current));
        return;
      }

      if (result.kind === 'open-session') {
        focusOrderWorkflow({ sessionId: result.session.id });
        return;
      }

      focusOrderWorkflow({ orderCode: result.order.orderCode, sessionId: result.session.id });
    },
    onSettled: () => {
      setFloorActionState(null);
    },
  });

  const createStaffOrderMutation = useMutation({
    mutationFn: (payload: { note?: string; tableSessionId: number }) =>
      runStaffRequest((token) =>
        staffApi.createOrder(token, {
          orderType: 'DINE_IN',
          tableSessionId: payload.tableSessionId,
          note: payload.note,
        }),
      ),
    onSuccess: (order, payload) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      focusOrderWorkflow({ orderCode: order.orderCode, sessionId: order.tableSessionId ?? payload.tableSessionId });
    },
  });

  const serviceRequestMutation = useMutation({
    mutationFn: (requestId: number) => runStaffRequest((token) => staffApi.resolveServiceRequest(token, requestId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const orderActionMutation = useMutation({
    mutationFn: (action: OrderActionInput) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmOrder(token, action.orderId);
          case 'cancel':
            return staffApi.cancelOrder(token, action.orderId);
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const orderItemMutation = useMutation({
    mutationFn: (
      action:
        | { kind: 'add'; orderId: number; menuItemId: number; quantity: number; note?: string }
        | { kind: 'update'; orderId: number; orderItemId: number; quantity?: number; note?: string; cancelled?: boolean },
    ) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'add':
            return staffApi.addOrderItem(token, action.orderId, {
              menuItemId: action.menuItemId,
              quantity: action.quantity,
              note: action.note,
            });
          case 'update':
            return staffApi.updateOrderItem(token, action.orderId, action.orderItemId, {
              quantity: action.quantity,
              note: action.note,
              cancelled: action.cancelled,
            });
        }
      }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      if (order.tableSessionId !== null) {
        focusOrderWorkflow({ orderCode: order.orderCode, sessionId: order.tableSessionId });
      }
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (order: InvoiceCreationInput) =>
      runStaffRequest(async (token) => {
        const existingInvoices = await staffApi.invoices(token, { size: 1, orderId: order.orderId });
        return existingInvoices.content.find((invoice) => invoice.orderId === order.orderId)
          ?? await staffApi.createInvoice(token, order.orderId);
      }),
    onSuccess: (invoice) => {
      setInvoicePresenceByOrderId((current) => ({ ...current, [invoice.orderId]: true }));
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (payload: PaymentInput) => runStaffRequest((token) => staffApi.recordPayment(token, payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const refreshWorkspace = () => {
    void queryClient.invalidateQueries({ queryKey: ['staff'] });
  };

  const activeSession = orderSessionFilter === null
    ? null
    : tableSessionsQuery.data?.find((sessionItem) => sessionItem.id === orderSessionFilter) ?? null;
  const visibleOrders = ordersQuery.data?.content ?? [];
  const workbenchBusy = orderActionMutation.isPending
    || orderItemMutation.isPending
    || createInvoiceMutation.isPending
    || createStaffOrderMutation.isPending
    || recordPaymentMutation.isPending;
  const workbenchOrderError = orderActionMutation.error ?? orderItemMutation.error;
  const reservationAreaOptions = useMemo(() => {
    const labels = new Set<string>();
    (reservationsQuery.data ?? []).forEach((reservation) => {
      if (reservation.requestedArea) {
        labels.add(reservation.requestedArea);
      }
    });
    return [...labels].sort((left, right) => left.localeCompare(right));
  }, [reservationsQuery.data]);
  const visibleReservations = useMemo(
    () => filterReservationQueue(reservationsQuery.data ?? [], reservationHostFilter, reservationAreaFilter),
    [reservationAreaFilter, reservationHostFilter, reservationsQuery.data],
  );
  const reservationHostSummary = useMemo(
    () => summarizeReservationQueue(visibleReservations),
    [visibleReservations],
  );
  const sessionLabelById = useMemo(() => {
    const labels: Record<number, string> = {};
    (tableSessionsQuery.data ?? []).forEach((sessionItem) => {
      labels[sessionItem.id] = `${sessionItem.tableCode} • ${sessionItem.tableName}`;
    });
    return labels;
  }, [tableSessionsQuery.data]);

  return (
    <div className="space-y-8">
      <StaffWorkspaceHero
        activeLaneBody={activeLaneBody}
        activeLaneTitle={activeLaneTitle}
        onLogout={onLogout}
        onRefreshWorkspace={refreshWorkspace}
        onWorkspaceLaneChange={(lane) => setWorkspaceLane(lane)}
        session={session}
        showLaneSwitcher={showLaneSwitcher}
        userRoles={userRoles}
        workspaceLane={workspaceLane}
      />

      {dashboardQuery.isLoading ? <LoadingState label={i18n.t('Loading dashboard summary')} /> : null}
      {dashboardQuery.error ? <ErrorState error={dashboardQuery.error} /> : null}

      {dashboardQuery.data ? (
        <section className={clsx('grid gap-4 md:grid-cols-2', showFloorLane && showBillingLane ? 'xl:grid-cols-5' : showFloorLane ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
          {showFloorLane ? <MetricCard label={i18n.t('Orders')} value={String(dashboardQuery.data.orders.totalElements)} tone="forest" /> : null}
          {showFloorLane ? <MetricCard label={i18n.t('Reservations')} value={String(dashboardQuery.data.reservations.totalElements)} tone="ember" /> : null}
          {showFloorLane ? <MetricCard label={i18n.t('Service requests')} value={String(dashboardQuery.data.serviceRequests.totalElements)} tone="slate" /> : null}
          {showBillingLane ? <MetricCard label={i18n.t('Invoices')} value={String(dashboardQuery.data.invoices.totalElements)} tone="forest" /> : null}
          {showBillingLane ? <MetricCard label={i18n.t('Payments')} value={String(dashboardQuery.data.payments.totalElements)} tone="ember" /> : null}
        </section>
      ) : null}

      {!showFloorLane && !showBillingLane ? (
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyMessage message={i18n.t('No workspace sections are available for the current role.')} />
        </section>
      ) : null}

      {showFloorLane ? (
        <DataPanel
          testId="floor-overview-panel"
          title={i18n.t('Floor overview')}
          subtitle={i18n.t('Scan the room by table, session, and active reservation before making seating moves.')}
        >
          {floorTablesQuery.isLoading ? <LoadingState label={i18n.t('Loading floor tables')} /> : null}
          {floorTablesQuery.error ? <ErrorState error={floorTablesQuery.error} /> : null}
          {tableSessionsQuery.isLoading ? <LoadingState label={i18n.t('Loading table sessions')} /> : null}
          {tableSessionsQuery.error ? <ErrorState error={tableSessionsQuery.error} /> : null}
          {floorReservationsQuery.isLoading ? <LoadingState label={i18n.t('Loading active reservations')} /> : null}
          {floorReservationsQuery.error ? <ErrorState error={floorReservationsQuery.error} /> : null}
          {floorActionMutation.error ? <div className="mt-4"><InlineError error={floorActionMutation.error} /></div> : null}
          {floorTablesQuery.data && tableSessionsQuery.data && floorReservationsQuery.data ? (
            <FloorOverview
              actionState={floorActionState}
              onCloseSession={(sessionItem, table) => floorActionMutation.mutate({ kind: 'close-session', session: sessionItem, table })}
              onJumpToOrder={(sessionItem) => focusOrderWorkflow({ sessionId: sessionItem.id })}
              onJumpToReservation={(reservation) => focusReservationWorkflow(reservation)}
              onOpenSession={(table) => floorActionMutation.mutate({ kind: 'open-session', table })}
              onSeatWalkIn={(table) => floorActionMutation.mutate({ kind: 'seat-walk-in', table })}
              reservations={floorReservationsQuery.data}
              sessions={tableSessionsQuery.data}
              tables={floorTablesQuery.data}
            />
          ) : null}
        </DataPanel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2" data-testid="staff-dashboard-grid">
        {showFloorLane ? (
          <>
            <div ref={reservationPanelRef}>
              <StaffReservationQueuePanel
                actionError={reservationActionMutation.error}
                availableTables={tablesQuery.data ?? []}
                areaFilter={reservationAreaFilter}
                areaOptions={reservationAreaOptions}
                hostFilter={reservationHostFilter}
                isMutating={reservationActionMutation.isPending}
                onAction={(action) => reservationActionMutation.mutate(action)}
                onAreaFilterChange={setReservationAreaFilter}
                onClearFilters={() => {
                  setReservationQueueScope('ACTIVE');
                  setReservationHostFilter('ALL');
                  setReservationAreaFilter('ALL');
                  setReservationSearch('');
                }}
                onHostFilterChange={setReservationHostFilter}
                onScopeChange={setReservationQueueScope}
                onSearchChange={setReservationSearch}
                quickSummary={reservationHostSummary}
                reservations={visibleReservations}
                reservationsError={reservationsQuery.error}
                reservationsLoading={reservationsQuery.isLoading}
                scope={reservationQueueScope}
                search={reservationSearch}
                tableOptionsError={tablesQuery.error}
                tableOptionsLoading={tablesQuery.isLoading}
              />
            </div>

            <StaffServiceRequestsPanel
              actionError={serviceRequestMutation.error}
              isLoading={serviceRequestsQuery.isLoading}
              isMutating={serviceRequestMutation.isPending}
              onResolve={(requestId) => serviceRequestMutation.mutate(requestId)}
              requests={serviceRequestsQuery.data?.content ?? []}
              requestsError={serviceRequestsQuery.error}
            />
          </>
        ) : null}

        {showFloorLane || showBillingLane ? (
          <div ref={workbenchPanelRef} className={clsx(showFloorLane && showBillingLane ? 'xl:col-span-2' : undefined)}>
            <StaffOperationsWorkbenchPanel
              activeSession={activeSession}
              canRenderWorkbench={(!showFloorLane || Boolean(ordersQuery.data)) && (!showBillingLane || Boolean(invoicesQuery.data && paymentsQuery.data))}
              createStaffOrderError={createStaffOrderMutation.error}
              createStaffOrderPending={createStaffOrderMutation.isPending}
              invoices={invoicesQuery.data?.content ?? []}
              invoicesError={invoicesQuery.error}
              invoicesLoading={invoicesQuery.isLoading}
              invoiceError={createInvoiceMutation.error}
              invoicePresenceByOrderId={invoicePresenceByOrderId}
              isBusy={workbenchBusy}
              menuItems={staffMenuQuery.data?.items ?? []}
              menuItemsLoadFailed={Boolean(staffMenuQuery.error)}
              onAddOrderItem={(payload) => orderItemMutation.mutate({ kind: 'add', ...payload })}
              onCancelOrder={(orderId) => orderActionMutation.mutate({ kind: 'cancel', orderId })}
              onClearOrderFocus={() => {
                setOrderSearch('');
                setOrderSessionFilter(null);
              }}
              onConfirmOrder={(orderId) => orderActionMutation.mutate({ kind: 'confirm', orderId })}
              onCreateInvoice={(order) => createInvoiceMutation.mutate({ orderId: order.id, orderCode: order.orderCode })}
              onCreateStaffOrder={(payload) => createStaffOrderMutation.mutate(payload)}
              onRecordPayment={(payload) => recordPaymentMutation.mutate(payload)}
              onReleaseSessionFocus={() => setOrderSessionFilter(null)}
              onUpdateOrderItem={(payload) => orderItemMutation.mutate({ kind: 'update', ...payload })}
              onUpdateOrderSearch={setOrderSearch}
              orderSearch={orderSearch}
              orderSessionFilter={orderSessionFilter}
              orders={ordersQuery.data?.content ?? []}
              ordersError={ordersQuery.error}
              ordersLoading={ordersQuery.isLoading}
              payments={paymentsQuery.data?.content ?? []}
              paymentsError={paymentsQuery.error}
              paymentsLoading={paymentsQuery.isLoading}
              paymentError={recordPaymentMutation.error}
              sessionLabelById={sessionLabelById}
              showBillingLane={showBillingLane}
              showFloorLane={showFloorLane}
              staffMenuError={staffMenuQuery.error}
              staffMenuLoading={staffMenuQuery.isLoading}
              title={workbenchTitle}
              visibleOrderCount={visibleOrders.length}
              workbenchOrderError={workbenchOrderError}
              subtitle={workbenchSubtitle}
            />
          </div>
        ) : null}

        {showFloorLane ? (
          <div className="xl:col-span-2">
            <StaffOpenTableSessionsPanel
              isLoading={tableSessionsQuery.isLoading}
              sessions={tableSessionsQuery.data ?? []}
              sessionsError={tableSessionsQuery.error}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

type ReservationQueueSummary = {
  total: number;
  needsTable: number;
  largeParty: number;
  nextService: number;
};

function StaffWorkspaceHero({
  activeLaneBody,
  activeLaneTitle,
  onLogout,
  onRefreshWorkspace,
  onWorkspaceLaneChange,
  session,
  showLaneSwitcher,
  userRoles,
  workspaceLane,
}: {
  activeLaneBody: string;
  activeLaneTitle: string;
  onLogout: () => void;
  onRefreshWorkspace: () => void;
  onWorkspaceLaneChange: (lane: WorkspaceLane) => void;
  session: AuthSession | null;
  showLaneSwitcher: boolean;
  userRoles: AuthSession['user']['roles'];
  workspaceLane: WorkspaceLane;
}) {
  return (
    <section className="panel overflow-hidden px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Staff workspace')}</p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            {i18n.t('Welcome back, {{name}}.', { name: session?.user.fullName })}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate">{activeLaneBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {userRoles.map((role) => (
              <RoleChip key={role} role={role} />
            ))}
          </div>
        </div>
          <div className="space-y-3">
            <div className="rounded-[24px] border border-ink/10 bg-white/70 px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Active lane')}</p>
              <p className="mt-2 font-semibold text-ink">{activeLaneTitle}</p>
            {showLaneSwitcher ? (
              <div className="mt-3 inline-flex flex-wrap rounded-full border border-ink/10 bg-cream/70 p-1">
                {(['ALL', 'FLOOR', 'BILLING'] as WorkspaceLane[]).map((lane) => (
                  <button
                    key={lane}
                    className={clsx(
                      'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition',
                      workspaceLane === lane ? 'bg-forest text-cream' : 'text-slate hover:text-ink',
                    )}
                    onClick={() => onWorkspaceLaneChange(lane)}
                    type="button"
                  >
                    {lane === 'ALL'
                      ? i18n.t('All lanes')
                      : lane === 'FLOOR'
                        ? i18n.t('Floor lane')
                        : i18n.t('Billing lane')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="button-secondary" to="/staff/categories">
              {i18n.t('Menu Designer')}
            </Link>
            <Link className="button-secondary" to="/staff/menu-items">
              {i18n.t('Dish Mastery')}
            </Link>
            <button className="button-secondary" onClick={onRefreshWorkspace} type="button">
              {i18n.t('Refresh workspace')}
            </button>
            <button className="button-secondary" onClick={onLogout} type="button">
              {i18n.t('Log out')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StaffReservationQueuePanel({
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
}: {
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
}) {
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

function StaffServiceRequestsPanel({
  actionError,
  isLoading,
  isMutating,
  onResolve,
  requests,
  requestsError,
}: {
  actionError: unknown;
  isLoading: boolean;
  isMutating: boolean;
  onResolve: (requestId: number) => void;
  requests: ServiceRequest[];
  requestsError: unknown;
}) {
  return (
    <DataPanel
      testId="service-requests-panel"
      title={i18n.t('Open service requests')}
      subtitle={i18n.t('Resolve waiter calls and bill requests as soon as they land.')}
    >
      {isLoading ? <LoadingState label={i18n.t('Loading service requests')} /> : null}
      {requestsError ? <ErrorState error={requestsError} /> : null}
      {actionError ? (
        <div className="mt-4">
          <InlineError error={actionError} />
        </div>
      ) : null}
      {!isLoading && !requestsError ? (
        <ServiceRequestList isMutating={isMutating} onResolve={onResolve} requests={requests} />
      ) : null}
    </DataPanel>
  );
}

function StaffOpenTableSessionsPanel({
  isLoading,
  sessions,
  sessionsError,
}: {
  isLoading: boolean;
  sessions: TableSession[];
  sessionsError: unknown;
}) {
  return (
    <DataPanel
      testId="open-table-sessions-panel"
      title={i18n.t('Open table sessions')}
      subtitle={i18n.t('See which tables already have a live session before seating or check-in.')}
    >
      {isLoading ? <LoadingState label={i18n.t('Loading table sessions')} /> : null}
      {sessionsError ? <ErrorState error={sessionsError} /> : null}
      {!isLoading && !sessionsError ? <TableSessionList sessions={sessions} /> : null}
    </DataPanel>
  );
}

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
        <div key={reservation.id} className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
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
                      value={tableSelections[reservation.id] ?? ''}
                      onChange={(event) => setTableSelections((current) => ({ ...current, [reservation.id]: event.target.value }))}
                    >
                          <option value="">{i18n.t('Choose a table')}</option>
                      {reservation.assignedTableId !== null && !availableTables.some((table) => table.id === reservation.assignedTableId) ? (
                        <option value={String(reservation.assignedTableId)}>
                            {reservation.assignedTableCode ??
                              i18n.t('Table #{{id}}', { id: reservation.assignedTableId })}{' '}
                            •{' '}
                            {reservation.assignedTableName ?? i18n.t('Assigned table')}
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
                    disabled={isMutating || (tableSelections[reservation.id] ?? '') === ''}
                    onClick={() =>
                      onAction({
                        reservationId: reservation.id,
                        kind: 'check-in',
                        diningTableId: Number(tableSelections[reservation.id]),
                      })
                    }
                    title={(tableSelections[reservation.id] ?? '') === '' ? i18n.t('Choose a table before check-in') : undefined}
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
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceRequestList({
  isMutating,
  onResolve,
  requests,
}: {
  isMutating: boolean;
  onResolve: (requestId: number) => void;
  requests: ServiceRequest[];
}) {
  if (!requests.length) {
    return <EmptyMessage message={i18n.t('No service requests yet.')} />;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="font-semibold text-ink">{serviceRequestLabel(request.requestType)}</p>
                  <p className="text-sm text-slate">
                    {i18n.t('Order #')} {request.orderId ?? i18n.t('n/a')} • {i18n.t('Session #')} {request.tableSessionId ?? i18n.t('n/a')} •{' '}
                    {formatDateTime(request.requestedAt)}
                  </p>
                </div>
                <StatusPill tone={serviceRequestStatusTone(request.status)}>{i18n.t(request.status)}</StatusPill>
              </div>

              {request.note ? <p className="text-sm leading-7 text-slate">{request.note}</p> : null}
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <button
                className="button-chip-primary"
                disabled={isMutating || request.status !== 'OPEN'}
                onClick={() => onResolve(request.id)}
                title={request.status !== 'OPEN' ? i18n.t('Only open requests can be resolved') : undefined}
                type="button"
              >
                {isMutating ? i18n.t('Resolving...') : i18n.t('Resolve')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function TableSessionList({ sessions }: { sessions: TableSession[] }) {
  if (!sessions.length) {
    return <EmptyMessage message={i18n.t('No open table sessions yet.')} />;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="data-row">
          <div>
            <p className="font-semibold text-ink">{formatTableSessionLabel(session)}</p>
            <p className="text-sm text-slate">
              {session.tableCode} • {i18n.t(session.status)} • {i18n.t('Opened')} {formatDateTime(session.openedAt)}
            </p>
          </div>
          <StatusPill tone={session.status === 'OPEN' ? 'forest' : 'neutral'}>{i18n.t(session.status)}</StatusPill>
        </div>
      ))}
    </div>
  );
}

function describeWorkspaceLane(lane: WorkspaceLane, canManageFloor: boolean, canManageBilling: boolean) {
  if (!canManageFloor && canManageBilling) {
    return i18n.t('Cashier lane');
  }

  if (canManageFloor && !canManageBilling) {
    return i18n.t('Floor lane');
  }

  if (lane === 'FLOOR') {
    return i18n.t('Floor lane');
  }

  if (lane === 'BILLING') {
    return i18n.t('Billing lane');
  }

  return i18n.t('Control lane');
}

function describeWorkspaceLaneBody(lane: WorkspaceLane, canManageFloor: boolean, canManageBilling: boolean) {
  if (!canManageFloor && canManageBilling) {
    return i18n.t('Collect payment, reconcile invoices, and stay focused on cashier handoff without floor-only noise.');
  }

  if (canManageFloor && !canManageBilling) {
    return i18n.t('Keep reservations moving, clear service requests, and manage live tables without cashier-only distractions.');
  }

  if (lane === 'FLOOR') {
    return i18n.t('Focus on reservations, sessions, and live table action while billing stays out of the way.');
  }

  if (lane === 'BILLING') {
    return i18n.t('Focus on invoices and payments while floor operations stay out of the way.');
  }

  return i18n.t('Keep reservations moving, clear service requests, and monitor back-office activity without leaving the floor console.');
}

function RoleChip({ role }: { role: AuthSession['user']['roles'][number] }) {
  return (
    <span className="rounded-full border border-ink/10 bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate">
      {role.toLowerCase()}
    </span>
  );
}

function MiniQueueStat({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-white/75 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{helper}</p>
    </div>
  );
}

function filterReservationQueue(
  reservations: Reservation[],
  quickFilter: ReservationHostFilter,
  areaFilter: string,
) {
  const now = Date.now();
  const nextServiceCutoff = now + 3 * 60 * 60 * 1000;

  return reservations.filter((reservation) => {
    const reservationTimestamp = new Date(reservation.reservationTime).getTime();
    const matchesArea = areaFilter === 'ALL'
      ? true
      : areaFilter === '__ANY__'
        ? reservation.requestedArea === null
        : reservation.requestedArea === areaFilter;

    if (!matchesArea) {
      return false;
    }

    switch (quickFilter) {
      case 'NEEDS_TABLE':
        return reservation.status === 'CONFIRMED' && reservation.assignedTableId === null;
      case 'NEXT_SERVICE':
        return reservationTimestamp >= now && reservationTimestamp <= nextServiceCutoff;
      case 'LARGE_PARTY':
        return reservation.partySize >= 6;
      case 'ALL':
      default:
        return true;
    }
  });
}

function summarizeReservationQueue(reservations: Reservation[]) {
  const now = Date.now();
  const nextServiceCutoff = now + 3 * 60 * 60 * 1000;

  return reservations.reduce(
    (summary, reservation) => {
      const reservationTimestamp = new Date(reservation.reservationTime).getTime();
      summary.total += 1;

      if (reservation.status === 'CONFIRMED' && reservation.assignedTableId === null) {
        summary.needsTable += 1;
      }

      if (reservation.partySize >= 6) {
        summary.largeParty += 1;
      }

      if (reservationTimestamp >= now && reservationTimestamp <= nextServiceCutoff) {
        summary.nextService += 1;
      }

      return summary;
    },
    { total: 0, needsTable: 0, largeParty: 0, nextService: 0 },
  );
}

function DataPanel({ children, subtitle, title, testId }: { children: ReactNode; subtitle: string; title: string; testId?: string }) {
  return (
    <section className="panel px-5 py-6" data-testid={testId}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function EmptyMessage({ message }: { message: string }) {
  return <div className="rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">{message}</div>;
}

function reservationStatusTone(status: ReservationStatus) {
  switch (status) {
    case 'PENDING':
      return 'ember';
    case 'CONFIRMED':
    case 'CHECKED_IN':
      return 'forest';
    case 'COMPLETED':
      return 'neutral';
    case 'CANCELLED':
      return 'warm';
  }
}

function serviceRequestStatusTone(status: ServiceRequestStatus) {
  switch (status) {
    case 'OPEN':
      return 'ember';
    case 'RESOLVED':
      return 'neutral';
    case 'CANCELLED':
      return 'warm';
  }
}

function serviceRequestLabel(requestType: ServiceRequest['requestType']) {
  switch (requestType) {
    case 'CALL_WAITER':
      return i18n.t('Call waiter');
    case 'REQUEST_BILL':
      return i18n.t('Request bill');
    case 'WATER':
      return i18n.t('Water refill');
    case 'OTHER':
      return i18n.t('Other request');
  }
}

function formatTableLabel(table: DiningTable) {
  return `${table.code} • ${table.name}`;
}

function formatTableSessionLabel(session: TableSession) {
  return `${session.sessionCode} • ${session.tableName}`;
}

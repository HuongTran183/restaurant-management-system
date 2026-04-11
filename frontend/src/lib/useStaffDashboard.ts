import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiError,
  publicApi,
  staffApi,
  type AuthSession,
  type DiningTable,
  type PaymentMethod,
  type Reservation,
  type ReservationStatus,
  type TableSession,
} from './api';
import type { FloorOverviewActionState } from '../components/FloorOverview';
import i18n from '../i18n/i18n';
import {
  type DashboardOverviewMetric,
  buildKitchenItemBreakdown,
  buildOrderStatusBreakdown,
  buildQrOrderInsights,
  buildReservationAlerts,
  buildRevenueByHour,
  countKitchenItems,
  countPendingOrders,
  formatCurrency,
  formatPercent,
  getTodayRevenue,
} from './staffDashboardMetrics';

// ============================================================================
// Types
// ============================================================================

export type ReservationActionInput =
  | { reservationId: number; kind: 'confirm'; internalNote?: string }
  | { reservationId: number; kind: 'cancel'; note?: string }
  | { reservationId: number; kind: 'check-in'; diningTableId: number; internalNote?: string }
  | { reservationId: number; kind: 'complete' };

export type OrderActionInput = { orderId: number; kind: 'confirm' | 'cancel' };

export type PaymentInput = { invoiceId: number; amount: number; method: PaymentMethod; note?: string };

export type InvoiceCreationInput = { orderId: number; orderCode: string };

export type FloorActionInput =
  | { kind: 'open-session'; table: DiningTable }
  | { kind: 'close-session'; session: TableSession; table: DiningTable }
  | { kind: 'seat-walk-in'; table: DiningTable };

export type ReservationQueueScope = 'ACTIVE' | 'HISTORY' | 'ALL';
export type ReservationHostFilter = 'ALL' | 'NEEDS_TABLE' | 'NEXT_SERVICE' | 'LARGE_PARTY';
export type WorkspaceLane = 'ALL' | 'FLOOR' | 'BILLING';

export type ReservationQueueSummary = {
  total: number;
  needsTable: number;
  largeParty: number;
  nextService: number;
};

// ============================================================================
// Constants
// ============================================================================

export const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];
export const HISTORY_RESERVATION_STATUSES: ReservationStatus[] = ['COMPLETED', 'CANCELLED'];
export const ALL_RESERVATION_STATUSES: ReservationStatus[] = [...ACTIVE_RESERVATION_STATUSES, ...HISTORY_RESERVATION_STATUSES];

// ============================================================================
// Utility Functions
// ============================================================================

export function filterReservationQueue(
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

export function summarizeReservationQueue(reservations: Reservation[]): ReservationQueueSummary {
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

export function describeWorkspaceLane(lane: WorkspaceLane, canManageFloor: boolean, canManageBilling: boolean) {
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

export function describeWorkspaceLaneBody(lane: WorkspaceLane, canManageFloor: boolean, canManageBilling: boolean) {
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

// ============================================================================
// Main Hook
// ============================================================================

export function useStaffDashboard(
  session: AuthSession | null,
  onLogout: () => void,
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>,
) {
  const queryClient = useQueryClient();
  const userRoles = session?.user.roles ?? [];
  const canManageFloor = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canManageBilling = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'CASHIER');

  // UI State
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
  const [invoicePresenceByOrderId, setInvoicePresenceByOrderId] = useState<Record<number, boolean>>({});

  // Derived state
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

  // Sync workspace lane with capabilities
  useEffect(() => {
    setWorkspaceLane((current) => {
      if (canManageFloor && canManageBilling) {
        return current === 'FLOOR' || current === 'BILLING' || current === 'ALL' ? current : 'ALL';
      }
      if (canManageFloor) return 'FLOOR';
      if (canManageBilling) return 'BILLING';
      return 'ALL';
    });
  }, [canManageBilling, canManageFloor]);

  const focusReservationWorkflow = (reservation: Reservation) => {
    setReservationQueueScope(
      reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED' ? 'HISTORY' : 'ACTIVE',
    );
    setReservationHostFilter('ALL');
    setReservationAreaFilter('ALL');
    setReservationSearch(reservation.reservationCode);
  };

  const focusOrderWorkflow = (options: { orderCode?: string; sessionId: number }) => {
    setOrderSessionFilter(options.sessionId);
    setOrderSearch(options.orderCode ?? '');
  };

  // API Request wrapper with auto-refresh
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

  // ============================================================================
  // Queries
  // ============================================================================

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
    enabled: Boolean(session?.accessToken) && canManageFloor,
    retry: false,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ['staff', 'service-requests', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.serviceRequests(token, { size: 20, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && canManageFloor,
    retry: false,
  });

  const staffMenuQuery = useQuery({
    queryKey: ['staff', 'menu-items'],
    queryFn: () => publicApi.menu(),
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
    enabled: Boolean(session?.accessToken) && canManageFloor,
    retry: false,
  });

  const tableSessionsQuery = useQuery({
    queryKey: ['staff', 'table-sessions', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tableSessions(token, { page, size, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && canManageFloor,
    retry: false,
  });

  const summaryOrdersQuery = useQuery({
    queryKey: ['staff', 'orders-summary', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.orders(token, { page, size })),
    enabled: Boolean(session?.accessToken) && canManageFloor,
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

  const paymentHistoryQuery = useQuery({
    queryKey: ['staff', 'payments-history', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.payments(token, { page, size })),
    enabled: Boolean(session?.accessToken) && canManageBilling,
    retry: false,
  });

  // Invoice presence tracking
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
        if (!active) return;

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
        if (!active) return;

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

  // ============================================================================
  // Mutations
  // ============================================================================

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

  // ============================================================================
  // Derived Values
  // ============================================================================

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

  const summaryOrders = summaryOrdersQuery.data ?? [];
  const activeSummaryOrders = useMemo(
    () => summaryOrders.filter((order) => order.status === 'DRAFT' || order.status === 'CONFIRMED'),
    [summaryOrders],
  );
  const paymentHistory = paymentHistoryQuery.data ?? [];

  const sessionLabelById = useMemo(() => {
    const labels: Record<number, string> = {};
    (tableSessionsQuery.data ?? []).forEach((sessionItem) => {
      labels[sessionItem.id] = `${sessionItem.tableCode} • ${sessionItem.tableName}`;
    });
    return labels;
  }, [tableSessionsQuery.data]);

  const tablesServingCount = tableSessionsQuery.data?.length ?? 0;
  const pendingOrderCount = useMemo(() => countPendingOrders(activeSummaryOrders), [activeSummaryOrders]);
  const kitchenItemCount = useMemo(() => countKitchenItems(activeSummaryOrders), [activeSummaryOrders]);
  const todayRevenue = useMemo(() => getTodayRevenue(paymentHistory), [paymentHistory]);
  const reservationAlerts = useMemo(() => buildReservationAlerts(floorReservationsQuery.data ?? []), [floorReservationsQuery.data]);
  const qrOrderInsights = useMemo(() => buildQrOrderInsights(activeSummaryOrders, sessionLabelById), [activeSummaryOrders, sessionLabelById]);
  const revenueByHour = useMemo(() => buildRevenueByHour(paymentHistory), [paymentHistory]);
  const orderStatusBreakdown = useMemo(() => buildOrderStatusBreakdown(summaryOrders), [summaryOrders]);
  const kitchenItemBreakdown = useMemo(() => buildKitchenItemBreakdown(activeSummaryOrders), [activeSummaryOrders]);

  const tableStatusSummary = useMemo(() => {
    const tables = floorTablesQuery.data ?? [];

    return {
      available: tables.filter((table) => table.status === 'AVAILABLE').length,
      occupied: tables.filter((table) => table.status === 'OCCUPIED').length,
      reserved: tables.filter((table) => table.status === 'RESERVED').length,
      unavailable: tables.filter((table) => table.status === 'CLEANING' || table.status === 'LOCKED').length,
    };
  }, [floorTablesQuery.data]);

  const openServiceRequestCount = serviceRequestsQuery.data?.totalElements ?? serviceRequestsQuery.data?.content.length ?? 0;
  const paymentRequestedOrderCount = useMemo(
    () => activeSummaryOrders.filter((order) => order.paymentRequested).length,
    [activeSummaryOrders],
  );
  const activeQrOrderCount = qrOrderInsights.length;
  const qrOrdersNeedingAttention = qrOrderInsights.filter((item) => item.needsAttention).length;
  const qrSalesShare = activeSummaryOrders.length === 0 ? 0 : activeQrOrderCount / activeSummaryOrders.length;
  const qrTicketValue = qrOrderInsights.reduce((total, item) => total + item.order.totalAmount, 0);

  const overviewMetrics = useMemo(() => {
    const metrics: DashboardOverviewMetric[] = [];

    if (canManageFloor) {
      metrics.push(
        {
          helper: `${tableStatusSummary.occupied} occupied tables live`,
          id: 'tables-serving',
          label: i18n.t('Tables serving'),
          tone: 'forest',
          value: String(tablesServingCount),
        },
        {
          helper: `${pendingOrderCount} tickets need confirmation`,
          id: 'pending-orders',
          label: i18n.t('Pending orders'),
          tone: 'ember',
          value: String(pendingOrderCount),
        },
        {
          helper: `${kitchenItemCount} NEW item(s) in active tickets`,
          id: 'kitchen-items',
          label: i18n.t('Kitchen load'),
          tone: 'sun',
          value: String(kitchenItemCount),
        },
      );
    }

    if (canManageBilling) {
      metrics.push({
        helper: i18n.t('Completed payments collected today'),
        id: 'today-revenue',
        label: i18n.t('Today revenue'),
        tone: 'slate',
        value: formatCurrency(todayRevenue),
      });
    }

    if (canManageFloor) {
      metrics.push({
        helper: activeSummaryOrders.length === 0
          ? i18n.t('No active tickets')
          : i18n.t('{{share}} of live tickets', { share: formatPercent(qrSalesShare) }),
        id: 'qr-orders',
        label: i18n.t('QR orders'),
        tone: 'forest',
        value: String(activeQrOrderCount),
      });
    }

    return metrics;
  }, [
    activeQrOrderCount,
    activeSummaryOrders.length,
    canManageBilling,
    canManageFloor,
    kitchenItemCount,
    pendingOrderCount,
    qrSalesShare,
    tableStatusSummary.occupied,
    tablesServingCount,
    todayRevenue,
  ]);

  const missionControlLoading = (canManageFloor && (
    summaryOrdersQuery.isLoading
    || floorReservationsQuery.isLoading
    || floorTablesQuery.isLoading
    || tableSessionsQuery.isLoading
  )) || (canManageBilling && paymentHistoryQuery.isLoading);

  const missionControlErrors = [
    canManageFloor ? summaryOrdersQuery.error : null,
    canManageFloor ? floorReservationsQuery.error : null,
    canManageFloor ? floorTablesQuery.error : null,
    canManageFloor ? tableSessionsQuery.error : null,
    canManageBilling ? paymentHistoryQuery.error : null,
  ].filter(Boolean);

  const refreshWorkspace = () => {
    void queryClient.invalidateQueries({ queryKey: ['staff'] });
  };

  // ============================================================================
  // Return
  // ============================================================================

  return {
    // Session & Roles
    session,
    userRoles,
    canManageFloor,
    canManageBilling,

    // Workspace Lane
    workspaceLane,
    setWorkspaceLane,
    showLaneSwitcher,
    showFloorLane,
    showBillingLane,
    activeLaneTitle,
    activeLaneBody,
    workbenchTitle,
    workbenchSubtitle,

    // Reservation Filters
    reservationQueueScope,
    setReservationQueueScope,
    reservationHostFilter,
    setReservationHostFilter,
    reservationAreaFilter,
    setReservationAreaFilter,
    reservationSearch,
    setReservationSearch,
    reservationAreaOptions,
    visibleReservations,
    reservationHostSummary,

    // Order Filters
    orderSearch,
    setOrderSearch,
    orderSessionFilter,
    setOrderSessionFilter,

    // Floor Action State
    floorActionState,

    // Focus Helpers
    focusReservationWorkflow,
    focusOrderWorkflow,

    // Queries
    reservationsQuery,
    floorReservationsQuery,
    serviceRequestsQuery,
    staffMenuQuery,
    tablesQuery,
    floorTablesQuery,
    tableSessionsQuery,
    summaryOrdersQuery,
    ordersQuery,
    invoicesQuery,
    paymentsQuery,
    paymentHistoryQuery,

    // Mutations
    reservationActionMutation,
    floorActionMutation,
    createStaffOrderMutation,
    serviceRequestMutation,
    orderActionMutation,
    orderItemMutation,
    createInvoiceMutation,
    recordPaymentMutation,

    // Derived
    activeSession,
    visibleOrders,
    workbenchBusy,
    workbenchOrderError,
    invoicePresenceByOrderId,
    sessionLabelById,
    missionControlLoading,
    missionControlErrors,
    overviewMetrics,
    reservationAlerts,
    revenueByHour,
    orderStatusBreakdown,
    kitchenItemBreakdown,
    tableStatusSummary,
    tablesServingCount,
    pendingOrderCount,
    kitchenItemCount,
    todayRevenue,
    activeQrOrderCount,
    qrOrderInsights,
    qrOrdersNeedingAttention,
    qrSalesShare,
    qrTicketValue,
    openServiceRequestCount,
    paymentRequestedOrderCount,

    // Actions
    refreshWorkspace,
  };
}

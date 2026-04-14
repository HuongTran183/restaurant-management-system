import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { StaffDashboardCommandCenter } from '../components/staff-dashboard/StaffDashboardCommandCenter';
import { StaffFloorPulsePanel, StaffQrSignalPanel } from '../components/staff-dashboard/StaffDashboardSignalsPanel';
import { StaffOperationsDock, type OperationsDockTab } from '../components/staff-dashboard/StaffOperationsDock';
import { StaffQuickChartsPanel } from '../components/staff-dashboard/StaffQuickChartsPanel';
import { StaffReservationAlertsPanel } from '../components/staff-dashboard/StaffReservationAlertsPanel';
import { Modal } from '../components/ui';
import type { AuthSession } from '../lib/api';
import { useStaffDashboard } from '../lib/useStaffDashboard';
import { EmptyMessage } from '../lib/staffUtils';
import { ErrorState, LoadingState } from './PagePrimitives';
import i18n from '../i18n/i18n';

export function StaffDashboardPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const dashboard = useStaffDashboard(session, onLogout, onRefreshSession);
  const [operationsTab, setOperationsTab] = useState<OperationsDockTab>('orders');
  const [isWorkflowModalOpen, setWorkflowModalOpen] = useState(false);

  const {
    activeLaneBody,
    activeLaneTitle,
    activeQrOrderCount,
    activeSession,
    canManageBilling,
    canManageFloor,
    createInvoiceMutation,
    createStaffOrderMutation,
    floorActionMutation,
    floorActionState,
    floorReservationsQuery,
    floorTablesQuery,
    focusOrderWorkflow,
    focusReservationWorkflow,
    invoicePresenceByOrderId,
    invoicesQuery,
    kitchenItemBreakdown,
    missionControlErrors,
    missionControlLoading,
    openServiceRequestCount,
    orderActionMutation,
    orderItemMutation,
    orderSessionFilter,
    orderSearch,
    orderStatusBreakdown,
    ordersQuery,
    overviewMetrics,
    paymentHistoryQuery,
    paymentRequestedOrderCount,
    paymentsQuery,
    qrOrderInsights,
    qrOrdersNeedingAttention,
    qrSalesShare,
    qrTicketValue,
    recordPaymentMutation,
    reservationActionMutation,
    reservationAlerts,
    reservationAreaFilter,
    reservationAreaOptions,
    reservationHostFilter,
    reservationHostSummary,
    reservationQueueScope,
    reservationSearch,
    reservationsQuery,
    revenueByHour,
    serviceRequestMutation,
    serviceRequestsQuery,
    sessionLabelById,
    setOrderSearch,
    setOrderSessionFilter,
    setReservationAreaFilter,
    setReservationHostFilter,
    setReservationQueueScope,
    setReservationSearch,
    setWorkspaceLane,
    showBillingLane,
    showFloorLane,
    showLaneSwitcher,
    staffMenuQuery,
    tablesQuery,
    tableSessionsQuery,
    tablesServingCount,
    tableStatusSummary,
    todayRevenue,
    userRoles,
    visibleOrders,
    visibleReservations,
    workbenchBusy,
    workbenchOrderError,
    workbenchSubtitle,
    workbenchTitle,
    workspaceLane,
    refreshWorkspace,
  } = dashboard;

  useEffect(() => {
    const nextTab = showFloorLane && showBillingLane
      ? 'orders'
      : showFloorLane
        ? 'reservations'
        : 'orders';

    setOperationsTab((current) => {
      if ((current === 'floor' || current === 'service' || current === 'reservations') && !showFloorLane) {
        return nextTab;
      }
      if (current === 'orders' && !showFloorLane && !showBillingLane) {
        return nextTab;
      }
      return current;
    });
  }, [showBillingLane, showFloorLane]);

  const revealFloorWorkflow = () => {
    if (!showFloorLane && canManageFloor) {
      setWorkspaceLane(canManageBilling ? 'ALL' : 'FLOOR');
    }
  };

  const openWorkflowDrawer = (tab: OperationsDockTab) => {
    revealFloorWorkflow();
    setOperationsTab(tab);
    setWorkflowModalOpen(true);
  };

  const openReservationDesk = (reservation: (typeof visibleReservations)[number]) => {
    revealFloorWorkflow();
    setOperationsTab('reservations');
    focusReservationWorkflow(reservation);
    setWorkflowModalOpen(true);
  };

  const openOrderDesk = (sessionId: number, orderCode?: string) => {
    revealFloorWorkflow();
    setOperationsTab('orders');
    focusOrderWorkflow({ orderCode, sessionId });
    setWorkflowModalOpen(true);
  };

  const canOpenWorkflow = canManageFloor || canManageBilling;
  const dockParam = searchParams.get('dock');

  useEffect(() => {
    if (!canOpenWorkflow || !dockParam) {
      return;
    }

    if (dockParam !== 'orders' && dockParam !== 'reservations' && dockParam !== 'service' && dockParam !== 'floor') {
      return;
    }

    if (!showFloorLane && canManageFloor) {
      setWorkspaceLane(canManageBilling ? 'ALL' : 'FLOOR');
    }
    setOperationsTab(dockParam);
    setWorkflowModalOpen(true);
  }, [canManageBilling, canManageFloor, canOpenWorkflow, dockParam, setWorkspaceLane, showFloorLane]);

  return (
    <PageLayout
      backLabel={t('Staff console')}
      backTo="/staff"
      breadcrumb={[
        { label: t('Staff console'), to: '/staff' },
        { label: t('Staff dashboard') },
      ]}
      contentClassName="space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      headerActions={
        canOpenWorkflow ? (
          <button className="button-secondary py-2.5" onClick={() => openWorkflowDrawer(operationsTab)} type="button">
            <span className="material-symbols-outlined text-lg">open_in_full</span>
            {t('Operations dock')}
          </button>
        ) : null
      }
      maxWidth="7xl"
      noPadding
      onLogout={onLogout}
      session={session}
      subtitle={t('Run the floor from one live surface, {{name}}.', { name: session?.user.fullName })}
      title={t('Staff dashboard')}
    >
      <StaffDashboardCommandCenter
        activeLaneBody={activeLaneBody}
        activeLaneTitle={activeLaneTitle}
        metrics={overviewMetrics}
        onRefreshWorkspace={refreshWorkspace}
        onWorkspaceLaneChange={setWorkspaceLane}
        session={session}
        showLaneSwitcher={showLaneSwitcher}
        userRoles={userRoles}
        workspaceLane={workspaceLane}
      />

      {(canManageFloor || canManageBilling) ? (
        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]" data-testid="staff-shortcuts-grid">
          <div className="rounded-lg border border-ink/10 bg-white px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{t('Control shortcuts')}</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('Deep workflow access')}</h2>
            <p className="mt-3 text-sm leading-7 text-slate">
              {t('Jump straight to floor configuration, live booking intake, and issue logging without leaving the dashboard.')}
            </p>

            {canOpenWorkflow ? (
              <button className="button-primary mt-5" onClick={() => openWorkflowDrawer(operationsTab)} type="button">
                <span className="material-symbols-outlined text-lg">open_in_full</span>
                {t('Operations dock')}
              </button>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {canManageFloor ? (
              <>
                <DashboardShortcutLink
                  description={t('Manage dining areas and zones')}
                  icon="grid_view"
                  label={t('Area Management')}
                  to="/staff/areas"
                />
                <DashboardShortcutLink
                  description={t('Manage dining tables and seating')}
                  icon="table_restaurant"
                  label={t('Table Management')}
                  to="/staff/tables"
                />
                <DashboardShortcutLink
                  description={t('Create an internal reservation for walk-ins, phone calls, and host-desk bookings.')}
                  icon="event_available"
                  label={t('New reservation')}
                  to="/staff/reservations/new"
                />
                <DashboardShortcutLink
                  description={t('Log a service request for an active table session or an in-flight order.')}
                  icon="room_service"
                  label={t('New service request')}
                  to="/staff/service-requests/new"
                />
              </>
            ) : null}

            {canOpenWorkflow ? (
              <DashboardShortcutButton
                className={canManageFloor ? 'md:col-span-2' : ''}
                description={t('Open the full reservation, order, service, and floor workflow in one modal.')}
                icon="space_dashboard"
                label={t('Operations dock')}
                onClick={() => openWorkflowDrawer(operationsTab)}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {missionControlLoading ? <LoadingState label={i18n.t('Loading command center')} /> : null}
      {missionControlErrors[0] ? <ErrorState error={missionControlErrors[0]} /> : null}

      {!canManageFloor && !canManageBilling ? (
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyMessage message={i18n.t('No workspace sections are available for the current role.')} />
        </section>
      ) : null}

      {canManageFloor ? (
        <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]" data-testid="staff-dashboard-grid">
          <StaffReservationAlertsPanel
            alerts={reservationAlerts}
            error={floorReservationsQuery.error}
            isLoading={floorReservationsQuery.isLoading}
            onOpenReservation={openReservationDesk}
          />

          <div className="space-y-5">
            <StaffQrSignalPanel
              activeQrOrderCount={activeQrOrderCount}
              error={dashboard.summaryOrdersQuery.error}
              isLoading={dashboard.summaryOrdersQuery.isLoading}
              onOpenOrder={openOrderDesk}
              qrOrderInsights={qrOrderInsights}
              qrOrdersNeedingAttention={qrOrdersNeedingAttention}
              qrSalesShare={qrSalesShare}
              qrTicketValue={qrTicketValue}
            />

            <StaffFloorPulsePanel
              openServiceRequestCount={openServiceRequestCount}
              paymentRequestedOrderCount={paymentRequestedOrderCount}
              tableStatusSummary={tableStatusSummary}
              tablesServingCount={tablesServingCount}
            />
          </div>
        </section>
      ) : null}

      {(canManageFloor || canManageBilling) ? (
        <div className="space-y-5">
          <StaffQuickChartsPanel
            error={canManageBilling ? paymentHistoryQuery.error : dashboard.summaryOrdersQuery.error}
            isLoading={canManageBilling ? paymentHistoryQuery.isLoading : dashboard.summaryOrdersQuery.isLoading}
            kitchenItemBreakdown={kitchenItemBreakdown}
            orderStatusBreakdown={orderStatusBreakdown}
            revenueByHour={revenueByHour}
            todayRevenue={todayRevenue}
          />
        </div>
      ) : null}

      <Modal
        isOpen={isWorkflowModalOpen}
        onClose={() => setWorkflowModalOpen(false)}
        size="2xl"
        title={t('Operations dock')}
      >
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate">
            {t('The operations dock now opens as a large modal so the team can work through reservations, orders, service, and floor actions without losing dashboard context.')}
          </p>

          <div className="max-h-[78vh] overflow-y-auto pr-1">
            <StaffOperationsDock
              activeSession={activeSession}
              activeTab={operationsTab}
              canRenderWorkbench={(!showFloorLane || Boolean(ordersQuery.data)) && (!showBillingLane || Boolean(invoicesQuery.data && paymentsQuery.data))}
              createInvoiceMutationError={createInvoiceMutation.error}
              createStaffOrderError={createStaffOrderMutation.error}
              createStaffOrderPending={createStaffOrderMutation.isPending}
              floorActionError={floorActionMutation.error}
              floorActionState={floorActionState}
              floorReservations={floorReservationsQuery.data ?? []}
              floorReservationsError={floorReservationsQuery.error}
              floorReservationsLoading={floorReservationsQuery.isLoading}
              floorTables={floorTablesQuery.data ?? []}
              floorTablesError={floorTablesQuery.error}
              floorTablesLoading={floorTablesQuery.isLoading}
              focusOrderWorkflow={focusOrderWorkflow}
              focusReservationWorkflow={focusReservationWorkflow}
              invoicePresenceByOrderId={invoicePresenceByOrderId}
              invoices={invoicesQuery.data?.content ?? []}
              invoicesError={invoicesQuery.error}
              invoicesLoading={invoicesQuery.isLoading}
              isBusy={workbenchBusy}
              menuItems={staffMenuQuery.data?.items ?? []}
              menuItemsLoadFailed={Boolean(staffMenuQuery.error)}
              onAddOrderItem={(payload) => orderItemMutation.mutate({ kind: 'add', ...payload })}
              onCancelOrder={(orderId) => orderActionMutation.mutate({ kind: 'cancel', orderId })}
              onClearOrderFocus={() => {
                setOrderSearch('');
                setOrderSessionFilter(null);
              }}
              onClearReservationFilters={() => {
                setReservationQueueScope('ACTIVE');
                setReservationHostFilter('ALL');
                setReservationAreaFilter('ALL');
                setReservationSearch('');
              }}
              onCloseSession={(sessionItem, table) => floorActionMutation.mutate({ kind: 'close-session', session: sessionItem, table })}
              onConfirmOrder={(orderId) => orderActionMutation.mutate({ kind: 'confirm', orderId })}
              onCreateInvoice={(order) => createInvoiceMutation.mutate({ orderId: order.id, orderCode: order.orderCode })}
              onCreateStaffOrder={(payload) => createStaffOrderMutation.mutate(payload)}
              onReservationAction={(action) => reservationActionMutation.mutate(action)}
              onReservationAreaFilterChange={setReservationAreaFilter}
              onReservationHostFilterChange={setReservationHostFilter}
              onResolveServiceRequest={(requestId) => serviceRequestMutation.mutate(requestId)}
              onOpenSession={(table) => floorActionMutation.mutate({ kind: 'open-session', table })}
              onRecordPayment={(payload) => recordPaymentMutation.mutate(payload)}
              onReleaseSessionFocus={() => setOrderSessionFilter(null)}
              onScopeChange={setReservationQueueScope}
              onSearchChange={setReservationSearch}
              onSeatWalkIn={(table) => floorActionMutation.mutate({ kind: 'seat-walk-in', table })}
              onServiceTabChange={setOperationsTab}
              onUpdateOrderItem={(payload) => orderItemMutation.mutate({ kind: 'update', ...payload })}
              onUpdateOrderSearch={setOrderSearch}
              orderSearch={orderSearch}
              orderSessionFilter={orderSessionFilter}
              orders={ordersQuery.data?.content ?? []}
              ordersError={ordersQuery.error}
              ordersLoading={ordersQuery.isLoading}
              paymentError={recordPaymentMutation.error}
              payments={paymentsQuery.data?.content ?? []}
              paymentsError={paymentsQuery.error}
              paymentsLoading={paymentsQuery.isLoading}
              quickSummary={reservationHostSummary}
              reservationActionError={reservationActionMutation.error}
              reservationActionPending={reservationActionMutation.isPending}
              reservationAreaFilter={reservationAreaFilter}
              reservationAreaOptions={reservationAreaOptions}
              reservationHostFilter={reservationHostFilter}
              reservationQueueScope={reservationQueueScope}
              reservationSearch={reservationSearch}
              reservations={visibleReservations}
              reservationsError={reservationsQuery.error}
              reservationsLoading={reservationsQuery.isLoading}
              serviceRequestActionError={serviceRequestMutation.error}
              serviceRequests={serviceRequestsQuery.data?.content ?? []}
              serviceRequestsError={serviceRequestsQuery.error}
              serviceRequestsLoading={serviceRequestsQuery.isLoading}
              serviceRequestsMutating={serviceRequestMutation.isPending}
              sessionLabelById={sessionLabelById}
              showBillingLane={showBillingLane}
              showFloorLane={showFloorLane}
              staffMenuError={staffMenuQuery.error}
              staffMenuLoading={staffMenuQuery.isLoading}
              surface="flat"
              tablesForCheckIn={tablesQuery.data ?? []}
              tableOptionsError={tablesQuery.error}
              tableOptionsLoading={tablesQuery.isLoading}
              tableSessions={tableSessionsQuery.data ?? []}
              tableSessionsError={tableSessionsQuery.error}
              tableSessionsLoading={tableSessionsQuery.isLoading}
              title={workbenchTitle}
              visibleOrderCount={visibleOrders.length}
              workbenchOrderError={workbenchOrderError}
              workbenchSubtitle={workbenchSubtitle}
            />
          </div>
        </div>
      </Modal>
    </PageLayout>
  );
}

function DashboardShortcutLink({
  description,
  icon,
  label,
  to,
}: {
  description: string;
  icon: string;
  label: string;
  to: string;
}) {
  return (
    <Link
      className="group rounded-lg border border-ink/10 bg-white px-5 py-5 transition hover:-translate-y-0.5 hover:border-forest/20 hover:bg-cream/40"
      to={to}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-full border border-ink/10 bg-cream/70 p-3 text-forest transition group-hover:border-forest/20 group-hover:bg-white">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate">{i18n.t('Open')}</span>
      </div>
      <p className="mt-4 text-lg font-semibold text-ink">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{description}</p>
    </Link>
  );
}

function DashboardShortcutButton({
  className = '',
  description,
  icon,
  label,
  onClick,
}: {
  className?: string;
  description: string;
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`group rounded-lg border border-ink/10 bg-white px-5 py-5 text-left transition hover:-translate-y-0.5 hover:border-forest/20 hover:bg-cream/40 ${className}`}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-full border border-ink/10 bg-cream/70 p-3 text-forest transition group-hover:border-forest/20 group-hover:bg-white">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate">{i18n.t('Open')}</span>
      </div>
      <p className="mt-4 text-lg font-semibold text-ink">{label}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{description}</p>
    </button>
  );
}

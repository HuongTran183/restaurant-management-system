import clsx from 'clsx';
import type { ReactNode } from 'react';
import { DataPanel, EmptyMessage } from '../../lib/staffUtils';
import { FloorOverview } from '../FloorOverview';
import { StaffOperationsWorkbenchPanel } from '../StaffOperationsWorkbenchPanel';
import { StaffReservationQueuePanel } from '../StaffReservationQueuePanel';
import { StaffOpenTableSessionsPanel, StaffServiceRequestsPanel } from '../StaffServicePanels';
import i18n from '../../i18n/i18n';

export type OperationsDockTab = 'orders' | 'reservations' | 'service' | 'floor';

type StaffOperationsDockProps = {
  activeSession: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['activeSession'];
  activeTab: OperationsDockTab;
  canRenderWorkbench: boolean;
  createInvoiceMutationError: unknown;
  createStaffOrderError: unknown;
  createStaffOrderPending: boolean;
  floorActionError: unknown;
  floorActionState: Parameters<typeof FloorOverview>[0]['actionState'];
  floorReservations: Parameters<typeof FloorOverview>[0]['reservations'];
  floorReservationsError: unknown;
  floorReservationsLoading: boolean;
  floorTables: Parameters<typeof FloorOverview>[0]['tables'];
  floorTablesError: unknown;
  floorTablesLoading: boolean;
  focusOrderWorkflow: (options: { orderCode?: string; sessionId: number }) => void;
  focusReservationWorkflow: (reservation: Parameters<typeof StaffReservationQueuePanel>[0]['reservations'][number]) => void;
  invoicePresenceByOrderId: Record<number, boolean>;
  invoices: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['invoices'];
  invoicesError: unknown;
  invoicesLoading: boolean;
  isBusy: boolean;
  menuItems: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['menuItems'];
  menuItemsLoadFailed: boolean;
  onAddOrderItem: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onAddOrderItem'];
  onCancelOrder: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onCancelOrder'];
  onClearOrderFocus: () => void;
  onClearReservationFilters: () => void;
  onCloseSession: NonNullable<Parameters<typeof FloorOverview>[0]['onCloseSession']>;
  onConfirmOrder: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onConfirmOrder'];
  onCreateInvoice: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onCreateInvoice'];
  onCreateStaffOrder: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onCreateStaffOrder'];
  onReservationAreaFilterChange: (value: string) => void;
  onReservationHostFilterChange: Parameters<typeof StaffReservationQueuePanel>[0]['onHostFilterChange'];
  onOpenSession: NonNullable<Parameters<typeof FloorOverview>[0]['onOpenSession']>;
  onRecordPayment: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onRecordPayment'];
  onReleaseSessionFocus: () => void;
  onReservationAction: Parameters<typeof StaffReservationQueuePanel>[0]['onAction'];
  onResolveServiceRequest: (requestId: number) => void;
  onScopeChange: Parameters<typeof StaffReservationQueuePanel>[0]['onScopeChange'];
  onSearchChange: Parameters<typeof StaffReservationQueuePanel>[0]['onSearchChange'];
  onSeatWalkIn: NonNullable<Parameters<typeof FloorOverview>[0]['onSeatWalkIn']>;
  onServiceTabChange: (tab: OperationsDockTab) => void;
  onUpdateOrderItem: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['onUpdateOrderItem'];
  onUpdateOrderSearch: (value: string) => void;
  orderSearch: string;
  orderSessionFilter: number | null;
  orders: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['orders'];
  ordersError: unknown;
  ordersLoading: boolean;
  paymentError: unknown;
  payments: Parameters<typeof StaffOperationsWorkbenchPanel>[0]['payments'];
  paymentsError: unknown;
  paymentsLoading: boolean;
  quickSummary: Parameters<typeof StaffReservationQueuePanel>[0]['quickSummary'];
  reservationActionError: unknown;
  reservationActionPending: boolean;
  reservationAreaFilter: string;
  reservationAreaOptions: string[];
  reservationHostFilter: Parameters<typeof StaffReservationQueuePanel>[0]['hostFilter'];
  reservationQueueScope: Parameters<typeof StaffReservationQueuePanel>[0]['scope'];
  reservationSearch: string;
  reservations: Parameters<typeof StaffReservationQueuePanel>[0]['reservations'];
  reservationsError: unknown;
  reservationsLoading: boolean;
  sessionLabelById: Record<number, string>;
  serviceRequestActionError: unknown;
  serviceRequests: Parameters<typeof StaffServiceRequestsPanel>[0]['requests'];
  serviceRequestsError: unknown;
  serviceRequestsLoading: boolean;
  serviceRequestsMutating: boolean;
  showBillingLane: boolean;
  showFloorLane: boolean;
  staffMenuError: unknown;
  staffMenuLoading: boolean;
  tablesForCheckIn: Parameters<typeof StaffReservationQueuePanel>[0]['availableTables'];
  tableOptionsError: unknown;
  tableOptionsLoading: boolean;
  tableSessions: Parameters<typeof StaffOpenTableSessionsPanel>[0]['sessions'];
  tableSessionsError: unknown;
  tableSessionsLoading: boolean;
  title: string;
  visibleOrderCount: number;
  workbenchOrderError: unknown;
  workbenchSubtitle: string;
  surface?: 'panel' | 'flat';
};

export function StaffOperationsDock({
  activeSession,
  activeTab,
  canRenderWorkbench,
  createInvoiceMutationError,
  createStaffOrderError,
  createStaffOrderPending,
  floorActionError,
  floorActionState,
  floorReservations,
  floorReservationsError,
  floorReservationsLoading,
  floorTables,
  floorTablesError,
  floorTablesLoading,
  focusOrderWorkflow,
  focusReservationWorkflow,
  invoicePresenceByOrderId,
  invoices,
  invoicesError,
  invoicesLoading,
  isBusy,
  menuItems,
  menuItemsLoadFailed,
  onAddOrderItem,
  onCancelOrder,
  onClearOrderFocus,
  onClearReservationFilters,
  onCloseSession,
  onConfirmOrder,
  onCreateInvoice,
  onCreateStaffOrder,
  onReservationAreaFilterChange,
  onReservationHostFilterChange,
  onOpenSession,
  onRecordPayment,
  onReleaseSessionFocus,
  onReservationAction,
  onResolveServiceRequest,
  onScopeChange,
  onSearchChange,
  onSeatWalkIn,
  onServiceTabChange,
  onUpdateOrderItem,
  onUpdateOrderSearch,
  orderSearch,
  orderSessionFilter,
  orders,
  ordersError,
  ordersLoading,
  paymentError,
  payments,
  paymentsError,
  paymentsLoading,
  quickSummary,
  reservationActionError,
  reservationActionPending,
  reservationAreaFilter,
  reservationAreaOptions,
  reservationHostFilter,
  reservationQueueScope,
  reservationSearch,
  reservations,
  reservationsError,
  reservationsLoading,
  sessionLabelById,
  serviceRequestActionError,
  serviceRequests,
  serviceRequestsError,
  serviceRequestsLoading,
  serviceRequestsMutating,
  showBillingLane,
  showFloorLane,
  staffMenuError,
  staffMenuLoading,
  tablesForCheckIn,
  tableOptionsError,
  tableOptionsLoading,
  tableSessions,
  tableSessionsError,
  tableSessionsLoading,
  title,
  visibleOrderCount,
  workbenchOrderError,
  workbenchSubtitle,
  surface = 'panel',
}: StaffOperationsDockProps) {
  const tabs = [
    showFloorLane ? { id: 'reservations' as const, label: i18n.t('Reservation desk') } : null,
    (showFloorLane || showBillingLane) ? { id: 'orders' as const, label: showBillingLane ? i18n.t('Order and billing') : i18n.t('Order desk') } : null,
    showFloorLane ? { id: 'service' as const, label: i18n.t('Service queue') } : null,
    showFloorLane ? { id: 'floor' as const, label: i18n.t('Floor live') } : null,
  ].filter(Boolean) as Array<{ id: OperationsDockTab; label: string }>;

  const resolvedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id;
  const isFlat = surface === 'flat';
  const wrapperClass = isFlat ? 'space-y-5' : 'panel px-5 py-6';

  return (
    <section className={wrapperClass} data-testid="operations-dock">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Operations dock')}</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-ink">{i18n.t('Deep workflow access')}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate">
            {i18n.t('The dashboard above is for scanning. This dock is where the team executes the detailed workflow without leaving the page.')}
          </p>
        </div>

        {tabs.length ? (
          <div className="inline-flex flex-wrap rounded-md border border-ink/10 bg-cream/60 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={clsx(
                  'rounded-md px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition',
                  resolvedTab === tab.id ? 'bg-forest text-cream' : 'text-slate hover:bg-white hover:text-ink',
                )}
                onClick={() => onServiceTabChange(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-5">
        {!tabs.length ? <EmptyMessage message={i18n.t('No workflow dock sections are available for the current role.')} /> : null}
        {resolvedTab === 'reservations' ? (
          <StaffReservationQueuePanel
            actionError={reservationActionError}
            availableTables={tablesForCheckIn}
            areaFilter={reservationAreaFilter}
            areaOptions={reservationAreaOptions}
            hostFilter={reservationHostFilter}
            isMutating={reservationActionPending}
            onAction={onReservationAction}
            onAreaFilterChange={onReservationAreaFilterChange}
            onClearFilters={onClearReservationFilters}
            onHostFilterChange={onReservationHostFilterChange}
            onScopeChange={onScopeChange}
            onSearchChange={onSearchChange}
            quickSummary={quickSummary}
            reservations={reservations}
            reservationsError={reservationsError}
            reservationsLoading={reservationsLoading}
            scope={reservationQueueScope}
            search={reservationSearch}
            tableOptionsError={tableOptionsError}
            tableOptionsLoading={tableOptionsLoading}
          />
        ) : null}

        {resolvedTab === 'orders' ? (
          <StaffOperationsWorkbenchPanel
            activeSession={activeSession}
            canRenderWorkbench={canRenderWorkbench}
            createStaffOrderError={createStaffOrderError}
            createStaffOrderPending={createStaffOrderPending}
            invoices={invoices}
            invoicesError={invoicesError}
            invoicesLoading={invoicesLoading}
            invoiceError={createInvoiceMutationError}
            invoicePresenceByOrderId={invoicePresenceByOrderId}
            isBusy={isBusy}
            menuItems={menuItems}
            menuItemsLoadFailed={menuItemsLoadFailed}
            onAddOrderItem={onAddOrderItem}
            onCancelOrder={onCancelOrder}
            onClearOrderFocus={onClearOrderFocus}
            onConfirmOrder={onConfirmOrder}
            onCreateInvoice={onCreateInvoice}
            onCreateStaffOrder={onCreateStaffOrder}
            onRecordPayment={onRecordPayment}
            onReleaseSessionFocus={onReleaseSessionFocus}
            onUpdateOrderItem={onUpdateOrderItem}
            onUpdateOrderSearch={onUpdateOrderSearch}
            orderSearch={orderSearch}
            orderSessionFilter={orderSessionFilter}
            orders={orders}
            ordersError={ordersError}
            ordersLoading={ordersLoading}
            payments={payments}
            paymentsError={paymentsError}
            paymentsLoading={paymentsLoading}
            paymentError={paymentError}
            sessionLabelById={sessionLabelById}
            showBillingLane={showBillingLane}
            showFloorLane={showFloorLane}
            staffMenuError={staffMenuError}
            staffMenuLoading={staffMenuLoading}
            subtitle={workbenchSubtitle}
            title={title}
            visibleOrderCount={visibleOrderCount}
            workbenchOrderError={workbenchOrderError}
          />
        ) : null}

        {resolvedTab === 'service' ? (
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <StaffServiceRequestsPanel
              actionError={serviceRequestActionError}
              isLoading={serviceRequestsLoading}
              isMutating={serviceRequestsMutating}
              onResolve={onResolveServiceRequest}
              requests={serviceRequests}
              requestsError={serviceRequestsError}
            />
            <StaffOpenTableSessionsPanel
              isLoading={tableSessionsLoading}
              sessions={tableSessions}
              sessionsError={tableSessionsError}
            />
          </div>
        ) : null}

        {resolvedTab === 'floor' ? (
          <DataPanel
            testId="floor-overview-panel"
            title={i18n.t('Floor live')}
            subtitle={i18n.t('Open sessions, seat walk-ins, and jump straight into the workflow that needs attention.')}
          >
            {floorTablesLoading ? <LoadingSurface>{i18n.t('Loading floor tables')}</LoadingSurface> : null}
            {floorTablesError ? <ErrorSurface>{String((floorTablesError as Error)?.message ?? floorTablesError)}</ErrorSurface> : null}
            {tableSessionsLoading ? <LoadingSurface>{i18n.t('Loading table sessions')}</LoadingSurface> : null}
            {tableSessionsError ? <ErrorSurface>{String((tableSessionsError as Error)?.message ?? tableSessionsError)}</ErrorSurface> : null}
            {floorReservationsLoading ? <LoadingSurface>{i18n.t('Loading active reservations')}</LoadingSurface> : null}
            {floorReservationsError ? <ErrorSurface>{String((floorReservationsError as Error)?.message ?? floorReservationsError)}</ErrorSurface> : null}
            {floorActionError ? <ErrorSurface>{String((floorActionError as Error)?.message ?? floorActionError)}</ErrorSurface> : null}
            {floorTables.length || tableSessions.length || floorReservations.length ? (
              <FloorOverview
                actionState={floorActionState}
                onCloseSession={onCloseSession}
                onJumpToOrder={(sessionItem) => {
                  onServiceTabChange('orders');
                  focusOrderWorkflow({ sessionId: sessionItem.id });
                }}
                onJumpToReservation={(reservation) => {
                  onServiceTabChange('reservations');
                  focusReservationWorkflow(reservation);
                }}
                onOpenSession={onOpenSession}
                onSeatWalkIn={onSeatWalkIn}
                reservations={floorReservations}
                sessions={tableSessions}
                tables={floorTables}
              />
            ) : (
              <div className="rounded-md border border-dashed border-ink/15 bg-white px-4 py-5 text-sm leading-7 text-slate">
                {i18n.t('No floor data is available right now.')}
              </div>
            )}
          </DataPanel>
        ) : null}
      </div>
    </section>
  );
}

function ErrorSurface({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded-md border border-ember/20 bg-white px-4 py-4 text-sm text-ember">{children}</div>;
}

function LoadingSurface({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded-md border border-ink/10 bg-white px-4 py-4 text-sm text-slate">{children}...</div>;
}

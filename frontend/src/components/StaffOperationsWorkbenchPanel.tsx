import type { Invoice, MenuItem, Order, Payment, PaymentMethod, TableSession } from '../lib/api';
import { ApiError } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { CashierWorkbench } from './CashierWorkbench';

type StaffOperationsWorkbenchPanelProps = {
  activeSession: TableSession | null;
  canRenderWorkbench: boolean;
  createStaffOrderError: unknown;
  createStaffOrderPending: boolean;
  invoices: Invoice[];
  invoicesError: unknown;
  invoicesLoading: boolean;
  invoiceError: unknown;
  invoicePresenceByOrderId: Record<number, boolean>;
  isBusy: boolean;
  menuItems: MenuItem[];
  menuItemsLoadFailed: boolean;
  onAddOrderItem: (payload: { orderId: number; menuItemId: number; quantity: number; note?: string }) => void;
  onCancelOrder: (orderId: number) => void;
  onClearOrderFocus: () => void;
  onConfirmOrder: (orderId: number) => void;
  onCreateInvoice: (order: Order) => void;
  onCreateStaffOrder: (payload: { note?: string; tableSessionId: number }) => void;
  onRecordPayment: (payload: { invoiceId: number; amount: number; method: PaymentMethod; note?: string }) => void;
  onReleaseSessionFocus: () => void;
  onUpdateOrderItem: (payload: { orderId: number; orderItemId: number; quantity?: number; note?: string; cancelled?: boolean }) => void;
  onUpdateOrderSearch: (value: string) => void;
  orderSearch: string;
  orderSessionFilter: number | null;
  orders: Order[];
  ordersError: unknown;
  ordersLoading: boolean;
  payments: Payment[];
  paymentsError: unknown;
  paymentsLoading: boolean;
  paymentError: unknown;
  sessionLabelById: Record<number, string>;
  showBillingLane: boolean;
  showFloorLane: boolean;
  staffMenuError: unknown;
  staffMenuLoading: boolean;
  subtitle: string;
  title: string;
  visibleOrderCount: number;
  workbenchOrderError: unknown;
};

type Translate = ReturnType<typeof useTranslation>['t'];

export function StaffOperationsWorkbenchPanel({
  activeSession,
  canRenderWorkbench,
  createStaffOrderError,
  createStaffOrderPending,
  invoices,
  invoicesError,
  invoicesLoading,
  invoiceError,
  invoicePresenceByOrderId,
  isBusy,
  menuItems,
  menuItemsLoadFailed,
  onAddOrderItem,
  onCancelOrder,
  onClearOrderFocus,
  onConfirmOrder,
  onCreateInvoice,
  onCreateStaffOrder,
  onRecordPayment,
  onReleaseSessionFocus,
  onUpdateOrderItem,
  onUpdateOrderSearch,
  orderSearch,
  orderSessionFilter,
  orders,
  ordersError,
  ordersLoading,
  payments,
  paymentsError,
  paymentsLoading,
  paymentError,
  sessionLabelById,
  showBillingLane,
  showFloorLane,
  staffMenuError,
  staffMenuLoading,
  subtitle,
  title,
  visibleOrderCount,
  workbenchOrderError,
}: StaffOperationsWorkbenchPanelProps) {
  const { t } = useTranslation();

  return (
    <section className="panel px-5 py-6" data-testid="operations-workbench">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{subtitle}</p>
      <div className="mt-5">
        {showFloorLane ? (
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
                {t('Search orders')}
              </span>
              <input
                className="field"
                onChange={(event) => onUpdateOrderSearch(event.target.value)}
                placeholder={t('Order code or note')}
                value={orderSearch}
              />
            </label>

            <button
              className="button-chip"
              disabled={orderSearch.trim() === '' && orderSessionFilter === null}
              onClick={onClearOrderFocus}
              type="button"
            >
              {t('Clear order focus')}
            </button>
          </div>
        ) : null}

        {activeSession ? (
          <div className="mb-5 rounded-[24px] border border-forest/15 bg-forest/5 px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-forest">
                  {t('Focused session')}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  {activeSession.tableCode} • {activeSession.tableName} • {t('Opened')} {formatDateTime(activeSession.openedAt)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleOrderCount === 0 ? (
                  <button
                    className="button-chip-primary"
                    disabled={createStaffOrderPending}
                    onClick={() =>
                      onCreateStaffOrder({
                        note: `${t('Staff order started from')} ${activeSession.tableCode}`,
                        tableSessionId: activeSession.id,
                      })
                    }
                    type="button"
                  >
                    {createStaffOrderPending ? t('Starting...') : t('Create dine-in order')}
                  </button>
                ) : null}
                <button className="button-chip" onClick={onReleaseSessionFocus} type="button">
                  {t('Release focus')}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showFloorLane && ordersLoading ? <LoadingState label={t('Loading orders')} /> : null}
        {showFloorLane && ordersError ? <ErrorState message={getErrorMessage(ordersError, t)} /> : null}
        {showFloorLane && staffMenuLoading ? <LoadingState label={t('Loading menu items for POS')} /> : null}
        {showFloorLane && staffMenuError ? <ErrorState message={getErrorMessage(staffMenuError, t)} /> : null}
        {showBillingLane && invoicesLoading ? <LoadingState label={t('Loading invoices')} /> : null}
        {showBillingLane && invoicesError ? <ErrorState message={getErrorMessage(invoicesError, t)} /> : null}
        {showBillingLane && paymentsLoading ? <LoadingState label={t('Loading payments')} /> : null}
        {showBillingLane && paymentsError ? <ErrorState message={getErrorMessage(paymentsError, t)} /> : null}
        {createStaffOrderError ? (
          <div className="mb-4">
            <InlineError message={getErrorMessage(createStaffOrderError, t)} />
          </div>
        ) : null}
        {canRenderWorkbench ? (
          <CashierWorkbench
            orders={orders}
            invoices={invoices}
            payments={payments}
            menuItems={menuItems}
            menuItemsLoadFailed={menuItemsLoadFailed}
            sessionLabelById={sessionLabelById}
            isBusy={isBusy}
            orderError={workbenchOrderError}
            invoiceError={invoiceError}
            paymentError={paymentError}
            showOrderOperations={showFloorLane}
            showBillingOperations={showBillingLane}
            invoicePresenceByOrderId={invoicePresenceByOrderId}
            onAddOrderItem={onAddOrderItem}
            onCancelOrder={onCancelOrder}
            onConfirmOrder={onConfirmOrder}
            onCreateInvoice={onCreateInvoice}
            onRecordPayment={onRecordPayment}
            onUpdateOrderItem={onUpdateOrderItem}
          />
        ) : null}
      </div>
    </section>
  );
}

function LoadingState({ label }: { label: string }) {
  return <div className="mt-6 rounded-[24px] border border-ink/10 bg-white/70 px-4 py-4 text-sm text-slate">{label}...</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div className="mt-6 rounded-[24px] border border-ember/20 bg-ember/10 px-4 py-4 text-sm text-ember">{message}</div>;
}

function InlineError({ message }: { message: string }) {
  return <p className="text-sm text-ember">{message}</p>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, t: Translate) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return t('Something went wrong.');
}

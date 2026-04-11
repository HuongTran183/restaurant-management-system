import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Invoice, MenuItem, Order, OrderItemStatus, Payment, PaymentMethod } from '../lib/api';

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'E_WALLET'];
type Translate = ReturnType<typeof useTranslation>['t'];

type CashierWorkbenchProps = {
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  menuItems: MenuItem[];
  menuItemsLoadFailed: boolean;
  sessionLabelById: Record<number, string>;
  isBusy: boolean;
  orderError: unknown;
  invoiceError: unknown;
  paymentError: unknown;
  showOrderOperations: boolean;
  showBillingOperations: boolean;
  invoicePresenceByOrderId: Record<number, boolean>;
  onAddOrderItem: (payload: { orderId: number; menuItemId: number; quantity: number; note?: string }) => void;
  onConfirmOrder: (orderId: number) => void;
  onCancelOrder: (orderId: number) => void;
  onCreateInvoice: (order: Order) => void;
  onRecordPayment: (payload: { invoiceId: number; amount: number; method: PaymentMethod; note?: string }) => void;
  onUpdateOrderItem: (payload: { orderId: number; orderItemId: number; quantity?: number; note?: string; cancelled?: boolean }) => void;
};

type PaymentFormState = {
  invoiceId: string;
  amount: string;
  method: PaymentMethod;
  note: string;
};

export function CashierWorkbench({
  orders,
  invoices,
  payments,
  menuItems,
  menuItemsLoadFailed,
  sessionLabelById,
  isBusy,
  orderError,
  invoiceError,
  paymentError,
  showOrderOperations,
  showBillingOperations,
  invoicePresenceByOrderId,
  onAddOrderItem,
  onConfirmOrder,
  onCancelOrder,
  onCreateInvoice,
  onRecordPayment,
  onUpdateOrderItem,
}: CashierWorkbenchProps) {
  const { t } = useTranslation();
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    invoiceId: '',
    amount: '',
    method: 'CASH',
    note: '',
  });

  const invoiceByOrderId = useMemo(() => new Map(invoices.map((invoice) => [invoice.orderId, invoice])), [invoices]);
  const paymentsByInvoiceId = useMemo(() => {
    const entries = new Map<number, Payment[]>();
    payments.forEach((payment) => {
      const existing = entries.get(payment.invoiceId) ?? [];
      existing.push(payment);
      entries.set(payment.invoiceId, existing);
    });
    return entries;
  }, [payments]);
  const openInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === 'OPEN' && invoice.totalAmount > invoice.paidAmount), [invoices]);
  const orderGroups = useMemo(() => {
    const groups = new Map<string, {
      key: string;
      label: string;
      helper: string;
      orderCount: number;
      totalAmount: number;
      needsAttention: boolean;
      paymentRequested: boolean;
    }>();

    orders.forEach((order) => {
      const key = order.tableSessionId === null ? 'detached' : `session-${order.tableSessionId}`;
      const label = order.tableSessionId === null
        ? t('Counter / detached order')
        : sessionLabelById[order.tableSessionId] ?? t('Session #{{id}}', { id: order.tableSessionId });
      const helper = order.tableSessionId === null
        ? t('No live table session is attached')
        : t('Session #{{id}}', { id: order.tableSessionId });
      const group = groups.get(key) ?? {
        key,
        label,
        helper,
        orderCount: 0,
        totalAmount: 0,
        needsAttention: false,
        paymentRequested: false,
      };

      group.orderCount += 1;
      group.totalAmount += order.totalAmount;
      group.needsAttention = group.needsAttention || order.status === 'DRAFT' || order.items.some((item) => item.status === 'NEW');
      group.paymentRequested = group.paymentRequested || order.paymentRequested;
      groups.set(key, group);
    });

    return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
  }, [orders, sessionLabelById, t]);

  useEffect(() => {
    if (!showBillingOperations) {
      setPaymentForm({ invoiceId: '', amount: '', method: 'CASH', note: '' });
      return;
    }

    if (!openInvoices.length) {
      setPaymentForm((current) => ({ ...current, invoiceId: '', amount: '' }));
      return;
    }

    setPaymentForm((current) => {
      const currentInvoiceId = Number(current.invoiceId);
      const selectedInvoice = openInvoices.find((invoice) => invoice.id === currentInvoiceId) ?? openInvoices[0];
      const remaining = selectedInvoice.totalAmount - selectedInvoice.paidAmount;
      const currentAmount = Number(current.amount);
      const shouldReuseAmount = currentInvoiceId === selectedInvoice.id
        && current.amount
        && !Number.isNaN(currentAmount)
        && currentAmount > 0
        && currentAmount <= remaining;
      return {
        ...current,
        invoiceId: String(selectedInvoice.id),
        amount: shouldReuseAmount ? current.amount : remaining.toFixed(2),
      };
    });
  }, [openInvoices, showBillingOperations]);

  function selectInvoice(invoiceId: number) {
    const invoice = openInvoices.find((candidate) => candidate.id === invoiceId);
    if (!invoice) {
      return;
    }

    setPaymentForm({
      invoiceId: String(invoice.id),
      amount: (invoice.totalAmount - invoice.paidAmount).toFixed(2),
      method: 'CASH',
      note: '',
    });
  }

  function submitPayment() {
    const invoiceId = Number(paymentForm.invoiceId);
    const amount = Number(paymentForm.amount);
    if (!invoiceId || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    onRecordPayment({
      invoiceId,
      amount,
      method: paymentForm.method,
      note: paymentForm.note.trim() || undefined,
    });
  }

  function submitAddOrderItem(event: FormEvent<HTMLFormElement>, orderId: number) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const menuItemId = Number(formData.get('menuItemId'));
    const quantity = Number(formData.get('quantity'));
    const note = String(formData.get('note') ?? '').trim();

    if (!menuItemId || Number.isNaN(quantity) || quantity <= 0) {
      return;
    }

    onAddOrderItem({
      orderId,
      menuItemId,
      quantity,
      note: note || undefined,
    });
  }

  function submitOrderItemUpdate(event: FormEvent<HTMLFormElement>, orderId: number, orderItemId: number) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const quantity = Number(formData.get('quantity'));
    const note = String(formData.get('note') ?? '').trim();

    if (Number.isNaN(quantity) || quantity <= 0) {
      return;
    }

    onUpdateOrderItem({
      orderId,
      orderItemId,
      quantity,
      note: note || undefined,
      cancelled: false,
    });
  }

  const layoutClass = showOrderOperations && showBillingOperations
    ? 'grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'
    : 'grid gap-6';

  return (
    <div className={layoutClass}>
      {showOrderOperations ? (
        <section className="space-y-4 rounded-[28px] border border-ink/10 bg-white/65 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Order operations')}</p>
              <h3 className="mt-2 font-display text-2xl text-ink">{t('Confirm live tickets and keep the floor moving')}</h3>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">
              {orders.length} {t('recent orders')}
            </span>
          </div>

          {orderError ? <ErrorPill error={orderError} t={t} /> : null}
          {invoiceError && showBillingOperations ? <ErrorPill error={invoiceError} t={t} /> : null}

          {orderGroups.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {orderGroups.map((group) => (
                <article key={group.key} className="rounded-[22px] border border-ink/10 bg-cream/55 px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{t('Session lane')}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{group.label}</p>
                      {group.needsAttention ? <Badge tone="ember">{t('Needs attention')}</Badge> : null}
                      {group.paymentRequested ? <Badge tone="warm">{t('Payment requested')}</Badge> : null}
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate">
                      {group.helper} • {group.orderCount} {t('order(s)')} • {formatMoney(group.totalAmount)}
                  </p>
                </article>
              ))}
            </div>
          ) : null}

          <div className="space-y-3">
            {orders.length ? (
              orders.map((order) => {
                const invoice = invoiceByOrderId.get(order.id);
                const orderPayments = invoice ? paymentsByInvoiceId.get(invoice.id) ?? [] : [];
                const hasKnownInvoice = Boolean(invoice) || invoicePresenceByOrderId[order.id] === true;
                const hasPendingNewItems = order.items.some((item) => item.status === 'NEW');
                const invoiceStatusKnown = Boolean(invoice) || invoicePresenceByOrderId[order.id] !== undefined;
                const canConfirm = order.status === 'DRAFT' || (order.status === 'CONFIRMED' && hasPendingNewItems);
                const canCancel = order.status === 'DRAFT' || order.status === 'CONFIRMED';
                const canCreateInvoice = showBillingOperations && invoiceStatusKnown && !hasKnownInvoice
                  && (order.status === 'CONFIRMED' || order.status === 'COMPLETED');
                const timeline = buildOrderTimeline(order, invoice, orderPayments, t);
                const sessionLabel = order.tableSessionId === null
                  ? t('Counter / detached order')
                  : sessionLabelById[order.tableSessionId] ?? t('Session #{{id}}', { id: order.tableSessionId });

                return (
                  <article key={order.id} className="rounded-[24px] border border-ink/10 bg-white/85 p-4 shadow-float">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-semibold text-ink">{order.orderCode}</p>
                          <Badge tone={order.status === 'CANCELLED' ? 'warm' : order.status === 'COMPLETED' ? 'neutral' : order.status === 'CONFIRMED' ? 'forest' : 'ember'}>
                            {t(order.status)}
                          </Badge>
                          <Badge tone={order.sourceChannel === 'QR' ? 'forest' : 'neutral'}>{t(order.sourceChannel)}</Badge>
                        </div>
                        <p className="text-sm leading-7 text-slate">
                          {order.items.length} {t('item(s)')} • {sessionLabel}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoPair label={t('Subtotal')} value={formatMoney(order.subtotal)} />
                          <InfoPair label={t('Total')} value={formatMoney(order.totalAmount)} />
                        </div>
                        {order.note ? (
                          <div className="rounded-[20px] border border-ink/10 bg-white/75 px-4 py-3 text-sm leading-7 text-slate">
                            {t('Order note:')} {order.note}
                          </div>
                        ) : null}
                        <div className="rounded-[22px] border border-ink/10 bg-white/75 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Timeline')}</p>
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate">
                              {timeline.length} {t('checkpoints')}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {timeline.map((entry) => (
                              <span
                                key={`${order.id}-${entry.label}`}
                                className={clsx(
                                  'rounded-full border px-3 py-2 text-xs font-semibold',
                                  entry.tone === 'forest'
                                    ? 'border-forest/20 bg-forest/10 text-forest'
                                    : entry.tone === 'ember'
                                      ? 'border-ember/20 bg-ember/10 text-ember'
                                      : entry.tone === 'warm'
                                        ? 'border-sun/30 bg-sun/10 text-sun'
                                        : 'border-slate/15 bg-slate/10 text-slate',
                                )}
                              >
                                {entry.detail ? `${entry.label} • ${entry.detail}` : entry.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3 rounded-[22px] border border-ink/10 bg-cream/50 px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Ticket items')}</p>
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate">
                              {order.items.length} {t('line(s)')}
                            </span>
                          </div>

                          {order.items.length ? (
                            <div className="space-y-3">
                              {order.items.map((item) => (
                                <div key={item.id} className="rounded-[20px] border border-ink/10 bg-white/80 px-4 py-4">
                                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                    <div className="space-y-2">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold text-ink">{item.itemName}</p>
                                          <Badge tone={orderItemTone(item.status)}>{t(item.status)}</Badge>
                                      </div>
                                      <p className="text-sm leading-7 text-slate">
                                        {item.quantity} x {formatMoney(item.unitPrice)} = {formatMoney(item.lineTotal)}
                                      </p>
                                      {item.note ? (
                                        <p className="text-sm leading-7 text-slate">
                                          {t('Note:')} {item.note}
                                        </p>
                                      ) : null}
                                    </div>

                                    {order.status === 'DRAFT' && item.status !== 'CANCELLED' ? (
                                      <form
                                        className="grid gap-3 rounded-[20px] border border-ink/10 bg-white/75 p-3 md:min-w-[24rem]"
                                        onSubmit={(event) => submitOrderItemUpdate(event, order.id, item.id)}
                                      >
                                        <label className="block">
                                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate">{t('Quantity')}</span>
                                          <div className="flex items-center gap-2">
                                            <button
                                              type="button"
                                              className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink/10 bg-white font-semibold text-slate hover:bg-slate/10 hover:text-ink disabled:opacity-50"
                                              onClick={(e) => {
                                                const input = e.currentTarget.nextElementSibling as HTMLInputElement;
                                                const newValue = Math.max(1, parseInt(input.value) - 1);
                                                input.value = String(newValue);
                                              }}
                                              disabled={isBusy}
                                            >
                                              −
                                            </button>
                                            <input
                                              aria-label={t('Quantity for {{itemName}} on {{orderCode}}', {
                                                itemName: item.itemName,
                                                orderCode: order.orderCode,
                                              })}
                                              className="field flex-1 text-center"
                                              defaultValue={String(item.quantity)}
                                              min="1"
                                              name="quantity"
                                              step="1"
                                              type="number"
                                              disabled={isBusy}
                                            />
                                            <button
                                              type="button"
                                              className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink/10 bg-white font-semibold text-slate hover:bg-slate/10 hover:text-ink disabled:opacity-50"
                                              onClick={(e) => {
                                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                const newValue = parseInt(input.value) + 1;
                                                input.value = String(newValue);
                                              }}
                                              disabled={isBusy}
                                            >
                                              +
                                            </button>
                                          </div>
                                        </label>
                                        <label className="block">
                                          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate">{t('Line note')}</span>
                                          <textarea
                                            aria-label={t('Line note for {{itemName}} on {{orderCode}}', {
                                              itemName: item.itemName,
                                              orderCode: order.orderCode,
                                            })}
                                            className="field min-h-[4rem] resize-y"
                                            defaultValue={item.note ?? ''}
                                            name="note"
                                            placeholder={t('Guest preference, allergy, special request...')}
                                            disabled={isBusy}
                                            rows={2}
                                          />
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                          <button className="button-chip-primary flex-1" disabled={isBusy} type="submit">
                                            {isBusy ? t('Saving...') : t('Update line')}
                                          </button>
                                          <button
                                            className="button-chip border-ember/20 text-ember hover:bg-ember/10"
                                            disabled={isBusy}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              if (window.confirm(t('Cancel this line item? This action cannot be undone.'))) {
                                                onUpdateOrderItem({ orderId: order.id, orderItemId: item.id, cancelled: true });
                                              }
                                            }}
                                            type="button"
                                          >
                                            {isBusy ? t('Saving...') : t('Cancel line')}
                                          </button>
                                        </div>
                                      </form>
                                    ) : null}

                                    {item.status === 'CANCELLED' && (
                                      <div className="rounded-lg bg-slate/10 px-4 py-3 text-sm text-slate">
                                        <span className="font-semibold">{t('⚠ Line cancelled')}</span>
                                        <p className="mt-1 text-xs">{t('This item will not be prepared or charged.')}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <EmptyState message={t('No line items yet. Start the ticket by adding the first dish.')} />
                          )}

                          {order.status === 'DRAFT' || order.status === 'CONFIRMED' ? (
                            menuItems.length ? (
                              <form
                                className="grid gap-3 rounded-[22px] border border-forest/15 bg-forest/5 p-4 lg:grid-cols-[minmax(0,1fr)_6.5rem_minmax(0,1fr)_auto] xl:gap-4"
                                data-testid={`cashier-add-item-form-${order.id}`}
                                onSubmit={(event) => submitAddOrderItem(event, order.id)}
                              >
                                <label className="block">
                                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate">{t('Menu item')}</span>
                                  <select
                                    aria-label={t('Add menu item for {{orderCode}}', { orderCode: order.orderCode })}
                                    className="field"
                                    defaultValue={String(menuItems[0]?.id ?? '')}
                                    name="menuItemId"
                                  >
                                    {menuItems.map((menuItem) => (
                                      <option key={menuItem.id} value={menuItem.id}>
                                        {menuItem.name} • {formatMoney(menuItem.price)}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate">{t('Qty')}</span>
                                  <input
                                    aria-label={t('Add quantity for {{orderCode}}', { orderCode: order.orderCode })}
                                    className="field"
                                    defaultValue="1"
                                    min="1"
                                    name="quantity"
                                    step="1"
                                    type="number"
                                  />
                                </label>
                                <label className="block">
                                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-slate">{t('Note')}</span>
                                  <input
                                    aria-label={t('Add note for {{orderCode}}', { orderCode: order.orderCode })}
                                    className="field"
                                    name="note"
                                    placeholder={t('Course, allergy, rush...')}
                                  />
                                </label>
                                <div className="flex items-end lg:justify-end">
                                  <button className="button-chip-primary w-full justify-center" disabled={isBusy} type="submit">
                                    {isBusy ? t('Saving...') : t('Add item')}
                                  </button>
                                </div>
                              </form>
                            ) : menuItemsLoadFailed ? (
                              <div className="rounded-[20px] border border-dashed border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-7 text-slate">
                                {t('Menu items could not be loaded right now. Existing order and billing actions remain available.')}
                              </div>
                            ) : (
                              <div className="rounded-[20px] border border-dashed border-ink/15 bg-white/70 px-4 py-3 text-sm leading-7 text-slate">
                                {t('No active menu items are available to add right now.')}
                              </div>
                            )
                          ) : null}
                        </div>
                        {hasPendingNewItems && order.status === 'CONFIRMED' ? (
                          <div className="rounded-[20px] border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-7 text-slate">
                            {t('This confirmed order still has newly added items waiting for a final confirm.')}
                          </div>
                        ) : null}
                        {invoice ? (
                          <div className="rounded-[20px] border border-forest/15 bg-forest/5 px-4 py-3 text-sm leading-7 text-slate">
                            {t('Invoice {{invoiceNumber}} is {{status}}. Paid {{paidAmount}} of {{totalAmount}}.', {
                              invoiceNumber: invoice.invoiceNumber,
                              status: t(invoice.status),
                              paidAmount: formatMoney(invoice.paidAmount),
                              totalAmount: formatMoney(invoice.totalAmount),
                            })}
                          </div>
                        ) : null}
                        {!invoice && showBillingOperations && !invoiceStatusKnown ? (
                          <div className="rounded-[20px] border border-ink/10 bg-white/75 px-4 py-3 text-sm leading-7 text-slate">
                            {t('Checking whether this order already has an invoice...')}
                          </div>
                        ) : null}
                        {!invoice && hasKnownInvoice ? (
                          <div className="rounded-[20px] border border-forest/15 bg-forest/5 px-4 py-3 text-sm leading-7 text-slate">
                            {t('An invoice already exists for this order.')}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end">
                        {canConfirm ? (
                          <button className="button-chip-primary" disabled={isBusy} onClick={() => onConfirmOrder(order.id)} type="button">
                            {isBusy ? t('Saving...') : t('Confirm')}
                          </button>
                        ) : null}
                        {canCancel ? (
                          <button className="button-chip" disabled={isBusy} onClick={() => onCancelOrder(order.id)} type="button">
                            {isBusy ? t('Saving...') : t('Cancel')}
                          </button>
                        ) : null}
                        {canCreateInvoice ? (
                          <button className="button-chip" disabled={isBusy} onClick={() => onCreateInvoice(order)} type="button">
                            {isBusy ? t('Saving...') : t('Create invoice')}
                          </button>
                        ) : null}
                        {showBillingOperations && invoice && invoice.status === 'OPEN' ? (
                          <button className="button-chip" disabled={isBusy} onClick={() => selectInvoice(invoice.id)} type="button">
                          {t('Use for payment')}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState message={t('No recent orders yet.')} />
            )}
          </div>
        </section>
      ) : null}

      {showBillingOperations ? (
        <section className="space-y-4 rounded-[28px] border border-ink/10 bg-white/65 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Invoices and payments')}</p>
              <h3 className="mt-2 font-display text-2xl text-ink">{t('Collect payment against open invoices')}</h3>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">
              {openInvoices.length} {t('payable invoices')}
            </span>
          </div>

          {paymentError ? <ErrorPill error={paymentError} t={t} /> : null}

          <div className="rounded-[24px] border border-ink/10 bg-white/85 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Payment form')}</p>
                <p className="mt-2 text-sm leading-7 text-slate">
                  {t('Choose an open invoice, enter the amount, and record the payment immediately.')}
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Invoice')}</span>
                <select className="field" value={paymentForm.invoiceId} onChange={(event) => selectInvoice(Number(event.target.value))}>
                  {openInvoices.length ? null : <option value="">{t('No open invoices available')}</option>}
                  {openInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} • {formatMoney(invoice.totalAmount - invoice.paidAmount)} {t('remaining')}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Amount')}</span>
                  <input
                    className="field"
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={paymentForm.amount}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))}
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Method')}</span>
                  <select
                    className="field"
                    value={paymentForm.method}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as PaymentMethod }))}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabel(method, t)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Note')}</span>
                <textarea
                  className="field min-h-24"
                  value={paymentForm.note}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder={t('Optional receipt or cashier note')}
                />
              </label>
              <button className="button-primary w-full justify-center" disabled={isBusy || openInvoices.length === 0} onClick={submitPayment} type="button">
                {isBusy ? t('Recording...') : t('Record payment')}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Recent invoices')}</p>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">
                {invoices.length} {t('shown')}
              </span>
            </div>
            {invoices.length ? (
              invoices.map((invoice) => {
                const remaining = invoice.totalAmount - invoice.paidAmount;
                return (
                  <article key={invoice.id} className="rounded-[24px] border border-ink/10 bg-white/85 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-ink">{invoice.invoiceNumber}</p>
                      <Badge tone={invoice.status === 'PAID' ? 'forest' : invoice.status === 'VOID' ? 'warm' : 'ember'}>{t(invoice.status)}</Badge>
                      </div>
                    <p className="text-sm leading-7 text-slate">{t('Order #')} {invoice.orderId}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                      <InfoPair label={t('Paid')} value={formatMoney(invoice.paidAmount)} />
                      <InfoPair label={t('Remaining')} value={formatMoney(Math.max(remaining, 0))} />
                      </div>
                      {invoice.status === 'OPEN' && remaining > 0 ? (
                        <button className="button-chip-primary self-start" disabled={isBusy} onClick={() => selectInvoice(invoice.id)} type="button">
                        {t('Pay now')}
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState message={t('No invoices recorded yet.')} />
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Recent payments')}</p>
            {payments.length ? (
              payments.map((payment) => (
                <article key={payment.id} className="rounded-[24px] border border-ink/10 bg-white/85 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{payment.paymentCode}</p>
                      <p className="text-sm text-slate">{t('Invoice #')} {payment.invoiceId} • {paymentMethodLabel(payment.method, t)}</p>
                    </div>
                    <Badge tone={payment.status === 'COMPLETED' ? 'forest' : 'neutral'}>{t(payment.status)}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate">{formatMoney(payment.amount)}</p>
                  {payment.note ? <p className="mt-2 text-sm leading-7 text-slate">{payment.note}</p> : null}
                </article>
              ))
            ) : (
              <EmptyState message={t('No payments recorded yet.')} />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function paymentMethodLabel(method: PaymentMethod, t: Translate) {
  switch (method) {
    case 'CASH':
      return t('Cash');
    case 'CARD':
      return t('Card');
    case 'BANK_TRANSFER':
      return t('Bank transfer');
    case 'E_WALLET':
      return t('E-wallet');
  }
}

function ErrorPill({ error, t }: { error: unknown; t: Translate }) {
  return <div className="rounded-[20px] border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-7 text-ember">{getErrorMessage(error, t)}</div>;
}

function Badge({ children, tone }: { children: ReactNode; tone: 'forest' | 'ember' | 'warm' | 'neutral' }) {
  const styles = {
    forest: 'bg-forest/10 text-forest border-forest/20',
    ember: 'bg-ember/10 text-ember border-ember/20',
    warm: 'bg-ember/10 text-ember border-ember/20',
    neutral: 'bg-slate/10 text-slate border-slate/20',
  }[tone];

  return <span className={clsx('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]', styles)}>{children}</span>;
}

function orderItemTone(status: OrderItemStatus): 'forest' | 'ember' | 'warm' | 'neutral' {
  switch (status) {
    case 'NEW':
      return 'ember';
    case 'CONFIRMED':
      return 'forest';
    case 'CANCELLED':
      return 'warm';
  }
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-cream/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">{message}</div>;
}

function buildOrderTimeline(order: Order, invoice: Invoice | undefined, payments: Payment[], t: Translate) {
  const checkpoints: Array<{ label: string; detail?: string; tone: 'forest' | 'ember' | 'warm' | 'neutral' }> = [
    {
      label: t('Ticket open'),
      detail: order.orderType === 'DINE_IN' ? t('Dining room') : t(order.orderType),
      tone: 'neutral',
    },
  ];

  if (order.status === 'DRAFT') {
    checkpoints.push({ label: t('Needs confirm'), tone: 'ember' });
  }

  if (order.status === 'CONFIRMED') {
    checkpoints.push({ label: t('Confirmed'), tone: 'forest' });
  }

  if (order.items.some((item) => item.status === 'NEW')) {
    checkpoints.push({ label: t('New line items'), tone: 'ember' });
  }

  if (order.paymentRequested) {
    checkpoints.push({ label: t('Guest requested bill'), tone: 'warm' });
  }

  if (invoice) {
    checkpoints.push({
      label: invoice.status === 'PAID' ? t('Invoice closed') : t('Invoice issued'),
      detail: formatMoment(invoice.issuedAt),
      tone: invoice.status === 'PAID' ? 'forest' : 'neutral',
    });
  }

  if (invoice && invoice.paidAmount > 0 && invoice.paidAmount < invoice.totalAmount) {
    checkpoints.push({
      label: t('Partial payment'),
      detail: t('{{amount}} collected', { amount: formatMoney(invoice.paidAmount) }),
      tone: 'warm',
    });
  }

  if (payments.length) {
    const latestPayment = [...payments]
      .sort((left, right) => (new Date(right.paidAt ?? 0).getTime() - new Date(left.paidAt ?? 0).getTime()))[0];
    checkpoints.push({
      label: invoice?.status === 'PAID' ? t('Paid in full') : t('Payment logged'),
      detail: latestPayment?.paidAt ? formatMoment(latestPayment.paidAt) : undefined,
      tone: invoice?.status === 'PAID' ? 'forest' : 'neutral',
    });
  }

  if (order.status === 'COMPLETED') {
    checkpoints.push({ label: t('Service completed'), tone: 'forest' });
  }

  if (order.status === 'CANCELLED') {
    checkpoints.push({ label: t('Ticket cancelled'), tone: 'warm' });
  }

  return checkpoints;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatMoment(value: string | null) {
  if (!value) {
    return undefined;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, t: Translate) {
  if (error instanceof Error) {
    return error.message;
  }

  return t('Something went wrong.');
}


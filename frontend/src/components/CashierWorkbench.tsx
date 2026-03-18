import clsx from 'clsx';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Invoice, Order, Payment, PaymentMethod } from '../lib/api';

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'E_WALLET'];

type CashierWorkbenchProps = {
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  isBusy: boolean;
  orderError: unknown;
  invoiceError: unknown;
  paymentError: unknown;
  showOrderOperations: boolean;
  showBillingOperations: boolean;
  invoicePresenceByOrderId: Record<number, boolean>;
  onConfirmOrder: (orderId: number) => void;
  onCancelOrder: (orderId: number) => void;
  onCreateInvoice: (order: Order) => void;
  onRecordPayment: (payload: { invoiceId: number; amount: number; method: PaymentMethod; note?: string }) => void;
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
  isBusy,
  orderError,
  invoiceError,
  paymentError,
  showOrderOperations,
  showBillingOperations,
  invoicePresenceByOrderId,
  onConfirmOrder,
  onCancelOrder,
  onCreateInvoice,
  onRecordPayment,
}: CashierWorkbenchProps) {
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    invoiceId: '',
    amount: '',
    method: 'CASH',
    note: '',
  });

  const invoiceByOrderId = useMemo(() => new Map(invoices.map((invoice) => [invoice.orderId, invoice])), [invoices]);
  const openInvoices = useMemo(() => invoices.filter((invoice) => invoice.status === 'OPEN' && invoice.totalAmount > invoice.paidAmount), [invoices]);

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

  const layoutClass = showOrderOperations && showBillingOperations
    ? 'grid gap-6 xl:grid-cols-[1.05fr_0.95fr]'
    : 'grid gap-6';

  return (
    <div className={layoutClass}>
      {showOrderOperations ? (
        <section className="space-y-4 rounded-[28px] border border-ink/10 bg-white/65 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Order operations</p>
              <h3 className="mt-2 font-display text-2xl text-ink">Confirm live tickets and keep the floor moving</h3>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{orders.length} recent orders</span>
          </div>

          {orderError ? <ErrorPill error={orderError} /> : null}
          {invoiceError && showBillingOperations ? <ErrorPill error={invoiceError} /> : null}

          <div className="space-y-3">
            {orders.length ? (
              orders.map((order) => {
                const invoice = invoiceByOrderId.get(order.id);
                const hasKnownInvoice = Boolean(invoice) || invoicePresenceByOrderId[order.id] === true;
                const hasPendingNewItems = order.items.some((item) => item.status === 'NEW');
                const invoiceStatusKnown = Boolean(invoice) || invoicePresenceByOrderId[order.id] !== undefined;
                const canConfirm = order.status === 'DRAFT' || (order.status === 'CONFIRMED' && hasPendingNewItems);
                const canCancel = order.status === 'DRAFT' || order.status === 'CONFIRMED';
                const canCreateInvoice = showBillingOperations && invoiceStatusKnown && !hasKnownInvoice
                  && (order.status === 'CONFIRMED' || order.status === 'COMPLETED');

                return (
                  <article key={order.id} className="rounded-[24px] border border-ink/10 bg-white/85 p-4 shadow-float">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-semibold text-ink">{order.orderCode}</p>
                          <Badge tone={order.status === 'CANCELLED' ? 'warm' : order.status === 'COMPLETED' ? 'neutral' : order.status === 'CONFIRMED' ? 'forest' : 'ember'}>
                            {order.status}
                          </Badge>
                          <Badge tone={order.sourceChannel === 'QR' ? 'forest' : 'neutral'}>{order.sourceChannel}</Badge>
                        </div>
                        <p className="text-sm leading-7 text-slate">
                          {order.items.length} item(s) • {order.tableSessionId ? `Session #${order.tableSessionId}` : 'No table session'}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <InfoPair label="Subtotal" value={formatMoney(order.subtotal)} />
                          <InfoPair label="Total" value={formatMoney(order.totalAmount)} />
                        </div>
                        {hasPendingNewItems && order.status === 'CONFIRMED' ? (
                          <div className="rounded-[20px] border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-7 text-slate">
                            This confirmed order still has newly added items waiting for a final confirm.
                          </div>
                        ) : null}
                        {invoice ? (
                          <div className="rounded-[20px] border border-forest/15 bg-forest/5 px-4 py-3 text-sm leading-7 text-slate">
                            Invoice {invoice.invoiceNumber} is {invoice.status}. Paid {formatMoney(invoice.paidAmount)} of {formatMoney(invoice.totalAmount)}.
                          </div>
                        ) : null}
                        {!invoice && showBillingOperations && !invoiceStatusKnown ? (
                          <div className="rounded-[20px] border border-ink/10 bg-white/75 px-4 py-3 text-sm leading-7 text-slate">
                            Checking whether this order already has an invoice...
                          </div>
                        ) : null}
                        {!invoice && hasKnownInvoice ? (
                          <div className="rounded-[20px] border border-forest/15 bg-forest/5 px-4 py-3 text-sm leading-7 text-slate">
                            An invoice already exists for this order.
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end">
                        {canConfirm ? (
                          <button className="button-chip-primary" disabled={isBusy} onClick={() => onConfirmOrder(order.id)} type="button">
                            {isBusy ? 'Saving...' : 'Confirm'}
                          </button>
                        ) : null}
                        {canCancel ? (
                          <button className="button-chip" disabled={isBusy} onClick={() => onCancelOrder(order.id)} type="button">
                            {isBusy ? 'Saving...' : 'Cancel'}
                          </button>
                        ) : null}
                        {canCreateInvoice ? (
                          <button className="button-chip" disabled={isBusy} onClick={() => onCreateInvoice(order)} type="button">
                            {isBusy ? 'Saving...' : 'Create invoice'}
                          </button>
                        ) : null}
                        {showBillingOperations && invoice && invoice.status === 'OPEN' ? (
                          <button className="button-chip" disabled={isBusy} onClick={() => selectInvoice(invoice.id)} type="button">
                            Use for payment
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState message="No recent orders yet." />
            )}
          </div>
        </section>
      ) : null}

      {showBillingOperations ? (
        <section className="space-y-4 rounded-[28px] border border-ink/10 bg-white/65 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Invoices and payments</p>
              <h3 className="mt-2 font-display text-2xl text-ink">Collect payment against open invoices</h3>
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{openInvoices.length} payable invoices</span>
          </div>

          {paymentError ? <ErrorPill error={paymentError} /> : null}

          <div className="rounded-[24px] border border-ink/10 bg-white/85 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Payment form</p>
                <p className="mt-2 text-sm leading-7 text-slate">Choose an open invoice, enter the amount, and record the payment immediately.</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Invoice</span>
                <select className="field" value={paymentForm.invoiceId} onChange={(event) => selectInvoice(Number(event.target.value))}>
                  {openInvoices.length ? null : <option value="">No open invoices available</option>}
                  {openInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceNumber} • {formatMoney(invoice.totalAmount - invoice.paidAmount)} remaining
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Amount</span>
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
                  <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Method</span>
                  <select
                    className="field"
                    value={paymentForm.method}
                    onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as PaymentMethod }))}
                  >
                    {PAYMENT_METHOD_OPTIONS.map((method) => (
                      <option key={method} value={method}>
                        {paymentMethodLabel(method)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Note</span>
                <textarea
                  className="field min-h-24"
                  value={paymentForm.note}
                  onChange={(event) => setPaymentForm((current) => ({ ...current, note: event.target.value }))}
                  placeholder="Optional receipt or cashier note"
                />
              </label>
              <button className="button-primary w-full justify-center" disabled={isBusy || openInvoices.length === 0} onClick={submitPayment} type="button">
                {isBusy ? 'Recording...' : 'Record payment'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Recent invoices</p>
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{invoices.length} shown</span>
            </div>
            {invoices.length ? (
              invoices.map((invoice) => {
                const remaining = invoice.totalAmount - invoice.paidAmount;
                return (
                  <article key={invoice.id} className="rounded-[24px] border border-ink/10 bg-white/85 p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold text-ink">{invoice.invoiceNumber}</p>
                        <Badge tone={invoice.status === 'PAID' ? 'forest' : invoice.status === 'VOID' ? 'warm' : 'ember'}>{invoice.status}</Badge>
                      </div>
                      <p className="text-sm leading-7 text-slate">Order #{invoice.orderId}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <InfoPair label="Paid" value={formatMoney(invoice.paidAmount)} />
                        <InfoPair label="Remaining" value={formatMoney(Math.max(remaining, 0))} />
                      </div>
                      {invoice.status === 'OPEN' && remaining > 0 ? (
                        <button className="button-chip-primary self-start" disabled={isBusy} onClick={() => selectInvoice(invoice.id)} type="button">
                          Pay now
                        </button>
                      ) : null}
                    </div>
                  </article>
                );
              })
            ) : (
              <EmptyState message="No invoices recorded yet." />
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Recent payments</p>
            {payments.length ? (
              payments.map((payment) => (
                <article key={payment.id} className="rounded-[24px] border border-ink/10 bg-white/85 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{payment.paymentCode}</p>
                      <p className="text-sm text-slate">Invoice #{payment.invoiceId} • {paymentMethodLabel(payment.method)}</p>
                    </div>
                    <Badge tone={payment.status === 'COMPLETED' ? 'forest' : 'neutral'}>{payment.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate">{formatMoney(payment.amount)}</p>
                  {payment.note ? <p className="mt-2 text-sm leading-7 text-slate">{payment.note}</p> : null}
                </article>
              ))
            ) : (
              <EmptyState message="No payments recorded yet." />
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case 'CASH':
      return 'Cash';
    case 'CARD':
      return 'Card';
    case 'BANK_TRANSFER':
      return 'Bank transfer';
    case 'E_WALLET':
      return 'E-wallet';
  }
}

function ErrorPill({ error }: { error: unknown }) {
  return <div className="rounded-[20px] border border-ember/20 bg-ember/10 px-4 py-3 text-sm leading-7 text-ember">{getErrorMessage(error)}</div>;
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

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}


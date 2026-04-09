import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { AuthSession, PaymentMethod } from '../../lib/api';
import { staffApi, ApiError } from '../../lib/api';
import { ErrorState, LoadingState, EmptyMessage } from '../PagePrimitives';

type AdminPaymentsPageProps = {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
};

export function AdminPaymentsPage({
  session,
  onLogout,
  onRefreshSession,
}: AdminPaymentsPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'open' | 'partial' | 'paid'>('all');

  const runStaffRequest = async <T,>(requestFn: (token: string) => Promise<T>): Promise<T> => {
    if (!session) throw new ApiError('Session expired', 401);
    try {
      return await requestFn(session.accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshed = await onRefreshSession(session);
        if (!refreshed) {
          onLogout();
          throw new ApiError('Session expired', 401);
        }
        return requestFn(refreshed.accessToken);
      }
      throw error;
    }
  };

  const invoicesQuery = useQuery({
    queryKey: ['admin', 'invoices', session?.accessToken],
    queryFn: () =>
      runStaffRequest((token) => staffApi.invoices(token, { size: 50 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const paymentsQuery = useQuery({
    queryKey: ['admin', 'payments', session?.accessToken],
    queryFn: () =>
      runStaffRequest((token) => staffApi.payments(token, { size: 50 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const paymentMutation = useMutation({
    mutationFn: ({ invoiceId, amount, method }: { invoiceId: number; amount: number; method: PaymentMethod }) =>
      runStaffRequest((token) =>
        staffApi.recordPayment(token, { invoiceId, amount, method }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
    },
  });

  if (invoicesQuery.isLoading) return <LoadingState label={t('Loading invoices')} />;
  if (invoicesQuery.error) return <ErrorState error={invoicesQuery.error} />;

  const invoices = invoicesQuery.data?.content ?? [];
  const payments = paymentsQuery.data?.content ?? [];

  // Filter invoices
  const filtered = invoices.filter((inv) => {
    const amountDue = (inv.totalAmount || 0) - (inv.paidAmount || 0);
    const partialPaymentAmount = inv.paidAmount || 0;
    if (filter === 'open') return amountDue > 0 && !partialPaymentAmount;
    if (filter === 'partial') return partialPaymentAmount > 0 && amountDue > 0;
    if (filter === 'paid') return amountDue === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('Payments')}</h1>
        <p className="mt-1 text-sm text-slate">
          {t('Manage invoices and payment collection')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'open', 'partial', 'paid'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filter === f
                ? 'bg-forest text-cream'
                : 'bg-white/60 text-slate hover:bg-white'
            }`}
          >
            {t(
              f === 'all'
                ? 'All'
                : f === 'open'
                  ? 'Unpaid'
                  : f === 'partial'
                    ? 'Partial'
                    : 'Paid',
            )}
          </button>
        ))}
      </div>

      {/* Invoices List */}
      {filtered.length === 0 ? (
        <EmptyMessage message={t('No invoices found')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={invoice}
              onPayment={(amount, method) =>
                paymentMutation.mutate({ invoiceId: invoice.id, amount, method })
              }
              isLoading={paymentMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="mt-8 space-y-3 border-t border-ink/10 pt-6">
          <h2 className="text-lg font-semibold text-ink">{t('Recent Payments')}</h2>
          {payments.slice(0, 5).map((payment) => (
            <div key={payment.id} className="rounded-lg border border-ink/10 bg-cream/50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-ink">Invoice #{payment.invoiceId}</span>
                <span className="font-semibold text-forest">
                  +{payment.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                </span>
              </div>
              <p className="text-xs text-slate">
                {payment.paidAt ? new Date(payment.paidAt).toLocaleString() : 'N/A'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceCard({
  invoice,
  onPayment,
  isLoading,
}: {
  invoice: any;
  onPayment: (amount: number, method: PaymentMethod) => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();
  const amountDue = (invoice.totalAmount || 0) - (invoice.paidAmount || 0);
  const [paymentAmount, setPaymentAmount] = useState(Math.max(0, amountDue));
  const [method, setMethod] = useState<PaymentMethod>('CASH');

  const isPaid = amountDue <= 0;
  const isPartial = (invoice.paidAmount || 0) > 0 && amountDue > 0;
  const statusColor = isPaid ? 'forest' : isPartial ? 'sky' : 'ember';

  return (
    <div className="rounded-lg border border-ink/10 bg-cream/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink">Invoice #{invoice.invoiceNumber}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                statusColor === 'forest'
                  ? 'bg-forest/10 text-forest'
                  : statusColor === 'sky'
                    ? 'bg-sky/10 text-sky'
                    : 'bg-ember/10 text-ember'
              }`}
            >
              {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Unpaid'}
            </span>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 text-sm text-slate">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Total')}
              </p>
              <p className="mt-0.5 font-bold text-ink">
                {(invoice.totalAmount || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Paid')}
              </p>
              <p className="mt-0.5 font-bold text-forest">
                {(invoice.paidAmount || 0).toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Due')}
              </p>
              <p className="mt-0.5 font-bold text-ember">
                {amountDue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Issued')}
              </p>
              <p className="mt-0.5 text-xs font-medium text-ink">
                {new Date(invoice.issuedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {!isPaid && (
          <div className="flex flex-col gap-2">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                setPaymentAmount(Math.min(val, amountDue));
              }}
              max={amountDue}
              className="w-32 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm focus:border-forest focus:outline-none"
              disabled={isLoading}
            />
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className="w-32 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm focus:border-forest focus:outline-none"
              disabled={isLoading}
            >
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="BANK_TRANSFER">Transfer</option>
            </select>
            <button
              onClick={() => onPayment(paymentAmount, method)}
              disabled={isLoading || paymentAmount <= 0 || paymentAmount > amountDue}
              title={paymentAmount > amountDue ? `Payment exceeds due amount of ${amountDue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}` : ''}
              className="rounded-lg bg-forest px-3 py-2 text-xs font-semibold text-cream transition hover:bg-forest/90 disabled:opacity-50"
            >
              {t('Collect')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

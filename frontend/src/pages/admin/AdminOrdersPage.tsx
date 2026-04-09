import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import type { AuthSession } from '../../lib/api';
import { staffApi, ApiError } from '../../lib/api';
import { ErrorState, LoadingState, EmptyMessage } from '../PagePrimitives';

type AdminOrdersPageProps = {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
};

export function AdminOrdersPage({
  session,
  onLogout,
  onRefreshSession,
}: AdminOrdersPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

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

  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', session?.accessToken, search],
    queryFn: () =>
      runStaffRequest((token) =>
        staffApi.orders(token, {
          size: 30,
          query: search.trim() || undefined,
        }),
      ),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const orderActionMutation = useMutation({
    mutationFn: (action: { kind: 'confirm' | 'cancel'; orderId: number }) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmOrder(token, action.orderId);
          case 'cancel':
            return staffApi.cancelOrder(token, action.orderId);
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });

  if (ordersQuery.isLoading) return <LoadingState label={t('Loading orders')} />;
  if (ordersQuery.error) return <ErrorState error={ordersQuery.error} />;

  const orders = ordersQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('Orders')}</h1>
        <p className="mt-1 text-sm text-slate">
          {t('Track and manage active orders')}
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder={t('Search orders...')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-lg border border-ink/10 bg-white px-4 py-2 text-sm placeholder:text-slate/50 focus:border-forest focus:outline-none"
      />

      {/* Orders List */}
      {orders.length === 0 ? (
        <EmptyMessage message={t('No orders found')} />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={(kind) =>
                orderActionMutation.mutate({ kind, orderId: order.id })
              }
              isLoading={orderActionMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAction,
  isLoading,
}: {
  order: any;
  onAction: (kind: 'confirm' | 'cancel') => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-lg border border-ink/10 bg-cream/50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink">Order #{order.orderCode}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              order.status === 'CONFIRMED' ? 'bg-forest/10 text-forest' :
              order.status === 'COMPLETED' ? 'bg-sky/10 text-sky' :
              order.status === 'CANCELLED' ? 'bg-ember/10 text-ember' :
              'bg-slate/10 text-slate'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4 text-sm text-slate">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Items')}
              </p>
              <p className="mt-0.5 font-medium text-ink">{order.items?.length ?? 0}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Type')}
              </p>
              <p className="mt-0.5 font-medium text-ink">{order.orderType?.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate/60">
                {t('Total')}
              </p>
              <p className="mt-0.5 font-medium text-ink">
                {order.totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {order.status === 'PENDING' && (
            <>
              <button
                onClick={() => onAction('confirm')}
                disabled={isLoading}
                className="rounded-lg bg-forest/10 px-3 py-2 text-xs font-semibold text-forest transition hover:bg-forest/20 disabled:opacity-50"
              >
                {t('Confirm')}
              </button>
              <button
                onClick={() => onAction('cancel')}
                disabled={isLoading}
                className="rounded-lg bg-ember/10 px-3 py-2 text-xs font-semibold text-ember transition hover:bg-ember/20 disabled:opacity-50"
              >
                {t('Cancel')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

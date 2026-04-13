import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '../components/layout/PageLayout';
import type { AuthSession, KitchenItem } from '../lib/api';
import { staffApi } from '../lib/api';
import { useKitchenWebSocket, type WebSocketEvent } from '../lib/websocket';

export function KitchenDisplayPage({
  session,
  onLogout,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const token = session?.accessToken ?? '';

  const queueQuery = useQuery({
    queryKey: ['kitchen-queue'],
    queryFn: () => staffApi.kitchenQueue(token),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const onWsEvent = useCallback((_event: WebSocketEvent) => {
    queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] });
  }, [queryClient]);

  useKitchenWebSocket(onWsEvent, !!token);

  const prepareMutation = useMutation({
    mutationFn: (itemId: number) => staffApi.kitchenStartPreparing(token, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] }),
  });

  const readyMutation = useMutation({
    mutationFn: (itemId: number) => staffApi.kitchenMarkReady(token, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] }),
  });

  const servedMutation = useMutation({
    mutationFn: (itemId: number) => staffApi.kitchenMarkServed(token, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['kitchen-queue'] }),
  });

  const items = queueQuery.data ?? [];

  // Group items by order code
  const orderGroups = items.reduce<Record<string, KitchenItem[]>>((acc, item) => {
    const key = item.orderCode;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const orderCodes = Object.keys(orderGroups);

  const confirmedCount = items.filter((i) => i.status === 'CONFIRMED').length;
  const preparingCount = items.filter((i) => i.status === 'PREPARING').length;

  return (
    <PageLayout
      title={t('Kitchen Display')}
      subtitle={`${confirmedCount} ${t('waiting')} · ${preparingCount} ${t('preparing')}`}
      session={session}
      onLogout={onLogout}
      headerActions={
        <button
          onClick={() => queueQuery.refetch()}
          className="button-ghost py-2 text-sm"
          disabled={queueQuery.isFetching}
        >
          <span className="material-symbols-outlined text-xl">refresh</span>
        </button>
      }
    >
      {queueQuery.isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-forest border-t-transparent" />
        </div>
      )}

      {queueQuery.isError && (
        <div className="panel px-6 py-8 text-center text-ember">
          {t('Failed to load kitchen queue')}
          <button onClick={() => queueQuery.refetch()} className="button-ghost ml-4">
            {t('Retry')}
          </button>
        </div>
      )}

      {!queueQuery.isLoading && orderCodes.length === 0 && (
        <div className="panel px-6 py-20 text-center">
          <span className="material-symbols-outlined text-5xl text-slate/40 mb-4">restaurant</span>
          <p className="text-lg text-slate">{t('No items in queue')}</p>
          <p className="text-sm text-slate/60 mt-1">{t('New orders will appear here automatically')}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {orderCodes.map((orderCode) => {
          const orderItems = orderGroups[orderCode];
          const tableId = orderItems[0]?.tableSessionId;
          const allPreparing = orderItems.every((i) => i.status === 'PREPARING');
          const hasPreparing = orderItems.some((i) => i.status === 'PREPARING');

          return (
            <div
              key={orderCode}
              className={`panel p-4 border-l-4 ${
                allPreparing
                  ? 'border-l-amber-500'
                  : hasPreparing
                    ? 'border-l-amber-300'
                    : 'border-l-forest'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-mono text-sm font-bold text-ink">
                    {orderCode}
                  </span>
                  {tableId && (
                    <span className="ml-2 text-xs text-slate">
                      Table #{tableId}
                    </span>
                  )}
                </div>
                <ElapsedTimer since={orderItems[0]?.createdAt} />
              </div>

              <div className="space-y-2">
                {orderItems.map((item) => (
                  <KitchenItemCard
                    key={item.id}
                    item={item}
                    onPrepare={() => prepareMutation.mutate(item.id)}
                    onReady={() => readyMutation.mutate(item.id)}
                    onServed={() => servedMutation.mutate(item.id)}
                    isBusy={
                      prepareMutation.isPending ||
                      readyMutation.isPending ||
                      servedMutation.isPending
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </PageLayout>
  );
}

function KitchenItemCard({
  item,
  onPrepare,
  onReady,
  isBusy,
}: {
  item: KitchenItem;
  onPrepare: () => void;
  onReady: () => void;
  onServed: () => void;
  isBusy: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-cream/60 px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink truncate">{item.itemName}</span>
          <span className="shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-xs font-bold">
            ×{item.quantity}
          </span>
        </div>
        {item.note && (
          <p className="mt-0.5 text-xs text-slate italic truncate">{item.note}</p>
        )}
      </div>

      <div className="shrink-0">
        {item.status === 'CONFIRMED' && (
          <button
            onClick={onPrepare}
            disabled={isBusy}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-amber-600 disabled:opacity-50"
          >
            {t('Start')}
          </button>
        )}
        {item.status === 'PREPARING' && (
          <button
            onClick={onReady}
            disabled={isBusy}
            className="rounded-lg bg-forest px-3 py-1.5 text-xs font-bold text-cream shadow-sm transition hover:bg-forest/90 disabled:opacity-50"
          >
            {t('Ready')}
          </button>
        )}
      </div>
    </div>
  );
}

function ElapsedTimer({ since }: { since: string | undefined }) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!since) return;

    function update() {
      const diff = Math.floor((Date.now() - new Date(since!).getTime()) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [since]);

  if (!elapsed) return null;

  return (
    <span className="font-mono text-xs tabular-nums text-slate">
      {elapsed}
    </span>
  );
}

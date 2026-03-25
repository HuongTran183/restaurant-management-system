import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { type ServiceRequestType, publicApi } from '../lib/api';
import { ErrorState, InfoCard, InlineError, LoadingState } from './PagePrimitives';
import { filterMenuItems, findMenuItemName, formatMoney, selectedMenuItems } from './pageUtils';

export function QrExperiencePage() {
  const { t } = useTranslation();
  const { token = '' } = useParams();
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [activeOrderCode, setActiveOrderCode] = useState('');
  const deferredSearch = useDeferredValue(search);

  const tableQuery = useQuery({
    queryKey: ['qr-table', token],
    queryFn: () => publicApi.qrTable(token),
    enabled: token.length > 0,
  });
  const menuQuery = useQuery({ queryKey: ['public-menu'], queryFn: publicApi.menu });
  const orderQuery = useQuery({
    queryKey: ['public-order', activeOrderCode],
    queryFn: () => publicApi.getOrder(activeOrderCode),
    enabled: activeOrderCode.length > 0,
    refetchInterval: 10_000,
  });

  const submitOrderMutation = useMutation({
    mutationFn: () =>
      publicApi.submitQrOrder(token, {
        note,
        items: selectedMenuItems(menuQuery.data?.items ?? [], quantities),
      }),
    onSuccess: (order) => {
      setActiveOrderCode(order.orderCode);
      setQuantities({});
    },
  });

  const serviceRequestMutation = useMutation({
    mutationFn: (requestType: ServiceRequestType) =>
      publicApi.requestService(token, {
        orderCode: activeOrderCode || undefined,
        requestType,
        note: requestType === 'REQUEST_BILL'
          ? t('Customer requested the bill from QR flow')
          : t('Customer requested assistance from QR flow'),
      }),
  });

  const filteredItems = filterMenuItems(menuQuery.data, deferredSearch);
  const cartItems = selectedMenuItems(menuQuery.data?.items ?? [], quantities);
  const currentOrder = orderQuery.data ?? submitOrderMutation.data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-5 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('QR dining')}</p>
            <h1 className="mt-2 font-display text-4xl text-ink">{t('Table-side ordering, without waiting for a paper pad.')}</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate">
              {t('Resolve the QR token, open a table session on first interaction, stack dishes into the active QR order, then call for service or the bill.')}
            </p>
          </div>
          <label className="block lg:w-[20rem]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Filter dishes')}</span>
            <input className="field" onChange={(event) => setSearch(event.target.value)} placeholder={t('Find noodles, tea, desserts...')} value={search} />
          </label>
        </div>

        {tableQuery.isLoading || menuQuery.isLoading ? <LoadingState label={t('Loading QR menu')} /> : null}
        {tableQuery.error ? <ErrorState error={tableQuery.error} /> : null}
        {menuQuery.error ? <ErrorState error={menuQuery.error} /> : null}

        {tableQuery.data ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard detail={tableQuery.data.tableCode} label={t('Table')} value={tableQuery.data.tableName} />
            <InfoCard detail={tableQuery.data.tableStatus} label={t('Area')} value={tableQuery.data.areaName} />
            <InfoCard
              detail={t('Auto-opened on demand')}
              label={t('Session')}
              value={tableQuery.data.openTableSessionId ? `#${tableQuery.data.openTableSessionId}` : t('Will open on first order')}
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const quantity = quantities[item.id] ?? 0;
            return (
              <article key={item.id} className="rounded-[28px] border border-ink/10 bg-white/75 p-5 shadow-float">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-ember">{item.categoryName}</p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{item.name}</h3>
                  </div>
                  <span className="rounded-full bg-sun/30 px-3 py-1 text-sm font-semibold text-forest">{formatMoney(item.price)}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate">{item.description || t('Built for quick table-side ordering.')}</p>
                <div className="mt-5 flex items-center justify-between gap-3 rounded-[20px] border border-ink/10 bg-cream/70 px-3 py-2">
                  <button className="counter-button" onClick={() => setQuantities({ ...quantities, [item.id]: Math.max(0, quantity - 1) })} type="button">
                    -
                  </button>
                  <span className="text-lg font-semibold text-ink">{quantity}</span>
                  <button className="counter-button" onClick={() => setQuantities({ ...quantities, [item.id]: quantity + 1 })} type="button">
                    +
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel sticky top-24 flex h-fit flex-col gap-5 px-5 py-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Current cart')}</p>
          <h2 className="mt-2 font-display text-3xl text-ink">{t('Ready for the kitchen')}</h2>
        </div>

        <div className="space-y-3">
          {cartItems.length ? (
            cartItems.map((item) => (
              <div key={item.menuItemId} className="rounded-[22px] border border-ink/10 bg-white/75 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{findMenuItemName(menuQuery.data?.items ?? [], item.menuItemId)}</p>
                  <span className="text-sm text-slate">x{item.quantity}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">
              {t('Add items to the cart to create or extend the QR order.')}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Order note')}</span>
          <textarea
            className="field min-h-28"
            onChange={(event) => setNote(event.target.value)}
            placeholder={t('Less spicy, split plates, no peanuts...')}
            value={note}
          />
        </label>

        <button className="button-primary w-full justify-center" disabled={!cartItems.length || submitOrderMutation.isPending} onClick={() => submitOrderMutation.mutate()} type="button">
          {submitOrderMutation.isPending ? t('Sending...') : t('Send QR order')}
        </button>
        {submitOrderMutation.error ? <InlineError error={submitOrderMutation.error} /> : null}

        {currentOrder ? (
          <div className="rounded-[24px] bg-forest p-5 text-cream shadow-float">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cream/70">{t('Active order')}</p>
            <p className="mt-2 font-display text-2xl">{currentOrder.orderCode}</p>
            <p className="mt-2 text-sm text-cream/80">
              {t('Status:')} {t(currentOrder.status)}
            </p>
            <p className="mt-4 text-sm text-cream/80">
              {t('Total:')} {formatMoney(currentOrder.totalAmount)}
            </p>
            <div className="mt-5 grid gap-3">
              <button className="button-ghost-light" onClick={() => serviceRequestMutation.mutate('CALL_WAITER')} type="button">
                {t('Call waiter')}
              </button>
              <button className="button-ghost-light" onClick={() => serviceRequestMutation.mutate('REQUEST_BILL')} type="button">
                {t('Request bill')}
              </button>
            </div>
            {serviceRequestMutation.isSuccess ? <p className="mt-4 text-sm text-cream/80">{t('Service request sent.')}</p> : null}
            {serviceRequestMutation.error ? <InlineError error={serviceRequestMutation.error} light /> : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}

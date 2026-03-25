import { useDeferredValue, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { publicApi } from '../lib/api';
import { ErrorState, LoadingState, MetricCard, ShortcutCard } from './PagePrimitives';
import { filterMenuItems, formatMoney } from './pageUtils';

export function HomePage() {
  const { t } = useTranslation();
  const menuQuery = useQuery({ queryKey: ['public-menu'], queryFn: publicApi.menu });
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const filteredItems = filterMenuItems(menuQuery.data, deferredSearch);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="panel overflow-hidden px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-forest/15 bg-forest/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-forest">
              {t('Floor control without the clipboard chaos')}
            </span>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              {t('A restaurant cockpit for the dining room, the QR table, and the host desk.')}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate">
              {t('The backend is now wired for public menu browsing, QR orders, service requests, and reservation workflows. This frontend gives the team one place to demo those flows end-to-end.')}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" to="/book">
                {t('Book a table')}
              </Link>
              <Link className="button-secondary" to="/staff/login">
                {t('Staff console')}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <MetricCard label={t('Categories')} value={String(menuQuery.data?.categories.length ?? 0)} tone="forest" />
            <MetricCard label={t('Live dishes')} value={String(menuQuery.data?.items.length ?? 0)} tone="ember" />
            <div className="rounded-[28px] border border-ink/10 bg-white/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">API health</p>
              <p className="mt-3 font-display text-2xl text-ink">{menuQuery.data?.restaurantName ?? t('Connecting...')}</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                {t('Public menu endpoint: {{state}}.', {
                  state: menuQuery.isSuccess ? t('connected') : menuQuery.isPending ? t('loading') : t('needs backend'),
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="panel px-6 py-8 sm:px-8">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Demo shortcuts')}</p>
            <h2 className="mt-2 font-display text-3xl text-ink">{t('Try the MVP loops')}</h2>
          </div>
          <div className="grid gap-4">
            <ShortcutCard
              title={t('Public booking')}
              body={t('Create, lookup, and cancel a reservation through the same public contract the mobile site will use.')}
              to="/book"
            />
            <ShortcutCard
              title={t('Staff dashboard')}
              body={t('Login with the seeded admin account and inspect orders, reservations, service requests, invoices, and payments.')}
              to="/staff/login"
            />
            <div className="rounded-[28px] border border-dashed border-forest/25 bg-forest/5 p-5 text-sm leading-7 text-slate">
              {t('For the QR flow, seed a table, menu items, and a QR entry first; generated QR landing URLs should point at')}
              {' '}
              <code>/qr/&lt;token&gt;</code>.
            </div>
          </div>
        </div>
      </aside>

      <section className="panel px-6 py-8 sm:px-8 lg:col-span-2">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Public menu')}</p>
            <h2 className="mt-2 font-display text-3xl text-ink">{t('Signature dishes ready for QR ordering')}</h2>
          </div>
          <label className="relative block lg:w-[22rem]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Search')}</span>
            <input
              className="field"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('Search for dishes or categories')}
              value={search}
            />
          </label>
        </div>

        {menuQuery.isLoading ? <LoadingState label={t('Loading menu')} /> : null}
        {menuQuery.error ? <ErrorState error={menuQuery.error} /> : null}

        {menuQuery.data ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-3">
              {menuQuery.data.categories.map((category) => (
                <div key={category.id} className="rounded-[22px] border border-ink/10 bg-white/65 px-4 py-3">
                  <p className="font-semibold text-ink">{category.name}</p>
                  <p className="text-sm leading-6 text-slate">
                    {category.description || t('A curated station for the dining room.')}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-[28px] border border-ink/10 bg-white/75 p-5 shadow-float">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-ember">{item.categoryName}</p>
                      <h3 className="mt-2 font-display text-2xl text-ink">{item.name}</h3>
                    </div>
                    <span className="rounded-full bg-sun/30 px-3 py-1 text-sm font-semibold text-forest">{formatMoney(item.price)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate">
                    {item.description || t('Built for quick service, QR browsing, and direct cashier handoff.')}
                  </p>
                </article>
              ))}
              {!filteredItems.length ? (
                <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/65 p-6 text-sm leading-7 text-slate md:col-span-2 xl:col-span-3">
                  {t('No dishes match this search yet.')}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MenuItem } from '../../lib/api';
import { resolveMenuItemImage } from '../../lib/publicMenu';
import { formatMoney } from '../../pages/pageUtils';

type PublicMenuCollectionsProps = {
  featuredItems: MenuItem[];
  newItems: MenuItem[];
  promotionalItems: MenuItem[];
};

type CollectionTab = 'FEATURED' | 'PROMOTIONAL' | 'NEW';

export function PublicMenuCollections({
  featuredItems,
  newItems,
  promotionalItems,
}: PublicMenuCollectionsProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CollectionTab>('FEATURED');

  const collections = useMemo(
    () => [
      {
        id: 'FEATURED' as const,
        items: featuredItems,
        label: t('Featured'),
        subtitle: t('Highlighted picks the restaurant wants guests to notice first.'),
      },
      {
        id: 'PROMOTIONAL' as const,
        items: promotionalItems,
        label: t('Promotion'),
        subtitle: t('Current promotional dishes or limited offers available on the public menu.'),
      },
      {
        id: 'NEW' as const,
        items: newItems,
        label: t('New dish'),
        subtitle: t('Recently published dishes derived from the latest menu updates.'),
      },
    ],
    [featuredItems, newItems, promotionalItems, t],
  );

  const currentCollection = collections.find((collection) => collection.id === activeTab) ?? collections[0];

  return (
    <section className="rounded-lg border border-ink/10 bg-white px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Recommended')}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink">{t('Curated picks')}</h2>
          <p className="mt-2 text-sm leading-6 text-slate">{currentCollection.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {collections.map((collection) => (
            <button
              key={collection.id}
              className={`rounded-md border px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === collection.id
                  ? 'border-forest/20 bg-forest/5 text-forest'
                  : 'border-ink/10 bg-white text-ink hover:bg-cream/35'
              }`}
              onClick={() => setActiveTab(collection.id)}
              type="button"
            >
              <span>{collection.label}</span>
              <span className={`ml-2 text-xs ${activeTab === collection.id ? 'text-forest/70' : 'text-slate'}`}>
                {collection.items.length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {currentCollection.items.slice(0, 3).map((item) => (
          <article key={`${currentCollection.id}-${item.id}`} className="rounded-lg border border-ink/10 bg-white p-4">
            <div className="aspect-[4/3] overflow-hidden rounded-lg bg-white/65">
              {resolveMenuItemImage(item) ? (
                <img alt={item.name} className="h-full w-full object-cover" src={resolveMenuItemImage(item)!} />
              ) : (
                <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#edf4f0,#f8eee1)] text-center">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate">{item.categoryName}</p>
                    <p className="mt-2 font-display text-2xl text-ink">{item.name}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{item.name}</p>
                <p className="mt-1 truncate text-sm text-slate">{item.categoryName}</p>
              </div>
              <p className="shrink-0 text-sm font-semibold text-forest">{formatMoney(item.price)}</p>
            </div>
          </article>
        ))}

        {!currentCollection.items.length ? (
          <div className="rounded-md border border-dashed border-ink/15 bg-white px-4 py-5 text-sm leading-7 text-slate md:col-span-2 xl:col-span-3">
            {t('No dishes are marked for this collection yet.')}
          </div>
        ) : null}
      </div>
    </section>
  );
}

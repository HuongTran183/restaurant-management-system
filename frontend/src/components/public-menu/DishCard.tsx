import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { MenuItem } from '../../lib/api';
import { isNewMenuItem, resolveMenuItemImage } from '../../lib/publicMenu';
import { formatMoney } from '../../pages/pageUtils';

type DishCardProps = {
  item: MenuItem;
};

export function DishCard({ item }: DishCardProps) {
  const { t } = useTranslation();
  const imageUrl = resolveMenuItemImage(item);

  return (
    <Link
      className={clsx(
        'block overflow-hidden rounded-lg border border-ink/10 bg-white transition hover:border-forest/20',
        !item.available ? 'opacity-95' : '',
      )}
      to={`/menu/items/${item.id}`}
    >
      <div className="relative aspect-[4/3] bg-[linear-gradient(135deg,#edf4f0,#f9efe1)]">
        {imageUrl ? (
          <img alt={item.name} className={clsx('h-full w-full object-cover', !item.available ? 'grayscale-[0.15]' : '')} src={imageUrl} />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(241,198,109,0.28),transparent_38%),linear-gradient(135deg,#edf4f0_0%,#f8f1e5_100%)] px-8 text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{item.categoryName}</p>
              <p className="mt-3 font-display text-2xl text-ink">{item.name}</p>
            </div>
          </div>
        )}

        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-2">
          {item.featured ? <Badge tone="forest">{t('Featured')}</Badge> : null}
          {item.promotional ? <Badge tone="sun">{t('Promotion')}</Badge> : null}
          {isNewMenuItem(item) ? <Badge tone="ink">{t('New dish')}</Badge> : null}
        </div>

        <div className="absolute bottom-4 left-4">
          <AvailabilityBadge available={item.available} />
        </div>
      </div>

      <div className="space-y-2.5 px-3.5 py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{item.categoryName}</p>
            <h3 className="mt-1 font-display text-lg font-bold text-ink">{item.name}</h3>
          </div>
          <p className="shrink-0 text-base font-bold text-forest">{formatMoney(item.price)}</p>
        </div>

        <p className="text-sm leading-5 text-slate">
          {item.description?.trim() || t('This dish does not have a public description yet.')}
        </p>
      </div>
    </Link>
  );
}

function Badge({ children, tone }: { children: ReactNode; tone: 'forest' | 'sun' | 'ink' }) {
  return (
    <span
      className={clsx(
        'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm',
        tone === 'forest'
          ? 'bg-forest text-cream'
          : tone === 'sun'
            ? 'bg-sun text-ink'
            : 'bg-ink text-cream',
      )}
    >
      {children}
    </span>
  );
}

function AvailabilityBadge({ available }: { available: boolean }) {
  const { t } = useTranslation();

  return (
    <span
      className={clsx(
        'rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]',
        available ? 'bg-white/92 text-forest' : 'bg-ember text-white',
      )}
    >
      {available ? t('Available now') : t('Sold out')}
    </span>
  );
}

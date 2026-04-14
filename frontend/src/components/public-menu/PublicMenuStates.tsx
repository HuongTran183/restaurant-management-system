import { useTranslation } from 'react-i18next';

export function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-[28px] bg-white/80 shadow-[0_18px_45px_rgba(22,33,29,0.06)]">
          <div className="aspect-[4/3] animate-pulse bg-cream/90" />
          <div className="space-y-3 px-5 py-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-cream/80" />
            <div className="h-7 w-2/3 animate-pulse rounded-full bg-cream/80" />
            <div className="h-4 w-full animate-pulse rounded-full bg-cream/70" />
            <div className="h-4 w-5/6 animate-pulse rounded-full bg-cream/70" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState() {
  const { t } = useTranslation();

  return (
    <div className="rounded-[32px] bg-white/82 px-6 py-10 text-center shadow-[0_18px_45px_rgba(22,33,29,0.06)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Public menu')}</p>
      <h3 className="mt-3 font-display text-3xl text-ink">{t('No dishes are published yet')}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate">
        {t('The restaurant has not published any public menu items yet. Please check back soon.')}
      </p>
    </div>
  );
}

export function NoResultState({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="rounded-[32px] bg-white/82 px-6 py-10 text-center shadow-[0_18px_45px_rgba(22,33,29,0.06)]">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('No results')}</p>
      <h3 className="mt-3 font-display text-3xl text-ink">{t('No dishes match the current filters')}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate">
        {t('Try another keyword, switch category, or return to the full menu.')}
      </p>
      <button className="button-secondary mt-6" onClick={onReset} type="button">
        {t('Clear menu filters')}
      </button>
    </div>
  );
}

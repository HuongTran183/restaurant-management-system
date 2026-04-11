import { useTranslation } from 'react-i18next';

type PublicMenuHeaderProps = {
  availableCount: number;
  categoryCount: number;
  restaurantName?: string;
  soldOutCount: number;
};

export function PublicMenuHeader({
  availableCount,
  categoryCount,
  restaurantName,
  soldOutCount,
}: PublicMenuHeaderProps) {
  const { t } = useTranslation();

  return (
    <section className="py-1">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.26em] text-forest/70">{t('Public menu')}</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">
            {restaurantName || t('Explore the menu before you arrive')}
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate">
            {t('Browse dishes quickly, filter what matters, and check availability before you visit.')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <MetaPill label={t('Categories')} value={String(categoryCount)} />
          <MetaPill label={t('Available now')} value={String(availableCount)} />
          <MetaPill label={t('Sold out')} value={String(soldOutCount)} />
        </div>
      </div>
    </section>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/55 px-3 py-2 text-ink backdrop-blur-[2px]">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate">{label}</span>
      <span className="ml-2 text-sm font-bold text-forest">{value}</span>
    </div>
  );
}

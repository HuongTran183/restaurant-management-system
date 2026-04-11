import { useTranslation } from 'react-i18next';
import type { MenuItem } from '../../lib/api';
import { ErrorState } from '../../pages/PagePrimitives';
import { DishGrid } from './DishGrid';
import { EmptyState, LoadingSkeleton, NoResultState } from './PublicMenuStates';

type PublicMenuResultsProps = {
  error: unknown;
  filteredItems: MenuItem[];
  hasActiveFilters: boolean;
  hasItems: boolean;
  isError: boolean;
  isLoading: boolean;
  onReset: () => void;
  resultCount: number;
};

export function PublicMenuResults({
  error,
  filteredItems,
  hasActiveFilters,
  hasItems,
  isError,
  isLoading,
  onReset,
  resultCount,
}: PublicMenuResultsProps) {
  const { t } = useTranslation();

  const hasResults = filteredItems.length > 0;
  const showEmpty = !isLoading && !isError && !hasItems;
  const showNoResult = !isLoading && !isError && hasItems && !hasResults;
  const showResults = !isLoading && !isError && hasResults;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-ink/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Dish library')}</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-ink">{t('Browse the full public menu')}</h2>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate">
          <span>{t('{{count}} dishes shown', { count: resultCount })}</span>
          {hasActiveFilters ? (
            <button className="button-chip" onClick={onReset} type="button">
              {t('Reset filters')}
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? <LoadingSkeleton /> : null}
      {isError ? <ErrorState error={error} /> : null}
      {showEmpty ? <EmptyState /> : null}
      {showNoResult ? <NoResultState onReset={onReset} /> : null}
      {showResults ? <DishGrid items={filteredItems} /> : null}
    </section>
  );
}

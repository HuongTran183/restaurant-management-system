import { useTranslation } from 'react-i18next';
import type { MenuSpotlightFilter } from '../../lib/publicMenu';
import { CategoryFilter } from './CategoryFilter';

type CategoryFilterOption = {
  count: number;
  id: string;
  label: string;
};

type SpotlightOption = {
  count: number;
  id: MenuSpotlightFilter;
  label: string;
};

type ActiveFilterChip = {
  id: string;
  label: string;
  onRemove?: () => void;
};

type PublicMenuToolbarProps = {
  activeCategory: string;
  activeFilters: ActiveFilterChip[];
  categoryOptions: CategoryFilterOption[];
  hasActiveFilters: boolean;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
  onSpotlightChange: (value: MenuSpotlightFilter) => void;
  spotlight: MenuSpotlightFilter;
  spotlightOptions: SpotlightOption[];
};

export function PublicMenuToolbar({
  activeCategory,
  activeFilters,
  categoryOptions,
  hasActiveFilters,
  onCategoryChange,
  onReset,
  onSpotlightChange,
  spotlight,
  spotlightOptions,
}: PublicMenuToolbarProps) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-ink/10 bg-white px-4 py-4 sm:px-5">
      <div className="space-y-5">
        <CategoryFilter
          activeCategory={activeCategory}
          onChange={onCategoryChange}
          options={categoryOptions}
        />

        <div className="space-y-3 border-t border-ink/8 pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Quick filters')}</p>
            {hasActiveFilters ? (
              <button className="button-chip" onClick={onReset} type="button">
                {t('Clear menu filters')}
              </button>
            ) : null}
          </div>

          <div className="space-y-2">
            {spotlightOptions.map((option) => (
              <button
                key={option.id}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition ${
                  spotlight === option.id
                    ? 'border-forest/20 bg-forest/5 text-forest'
                    : 'border-ink/10 bg-white text-ink hover:bg-cream/35'
                }`}
                onClick={() => onSpotlightChange(option.id)}
                type="button"
              >
                <span className={`text-sm font-semibold ${spotlight === option.id ? 'text-forest' : 'text-ink'}`}>
                  {option.label}
                </span>
                <span className={`text-xs font-bold uppercase tracking-[0.2em] ${spotlight === option.id ? 'text-forest/70' : 'text-slate'}`}>
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="space-y-3 border-t border-ink/8 pt-4">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{t('Active filters')}</span>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filter) => (
                <span key={filter.id} className="inline-flex items-center gap-2 rounded-full bg-cream/86 px-3 py-2 text-sm text-ink">
                  <span>{filter.label}</span>
                  {filter.onRemove ? (
                    <button
                      aria-label={`${t('Remove filter')}: ${filter.label}`}
                      className="text-slate transition hover:text-ink"
                      onClick={filter.onRemove}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

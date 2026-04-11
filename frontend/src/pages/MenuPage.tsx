import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicMenuCollections } from '../components/public-menu/PublicMenuCollections';
import { PublicMenuHeader } from '../components/public-menu/PublicMenuHeader';
import { PublicMenuResults } from '../components/public-menu/PublicMenuResults';
import { PublicMenuToolbar } from '../components/public-menu/PublicMenuToolbar';
import { SearchBar } from '../components/public-menu/SearchBar';
import type { MenuSpotlightFilter } from '../lib/publicMenu';
import { usePublicMenuCatalog } from '../lib/usePublicMenuCatalog';

export function MenuPage() {
  const { t } = useTranslation();
  const {
    activeCategory,
    availableCount,
    categoryOptions,
    featuredItems,
    filteredItems,
    hasActiveFilters,
    items,
    menuQuery,
    newItems,
    promotionalItems,
    search,
    setActiveCategory,
    setSearch,
    setSpotlight,
    soldOutCount,
    spotlight,
  } = usePublicMenuCatalog();

  const isLoading = menuQuery.isLoading;
  const isError = Boolean(menuQuery.error);
  const hasItems = items.length > 0;
  const showCollections = !isLoading && !isError && hasItems && !hasActiveFilters;

  const spotlightLabels = useMemo<Record<MenuSpotlightFilter, string>>(
    () => ({
      ALL: t('All dishes'),
      FEATURED: t('Featured'),
      PROMOTIONAL: t('Promotion'),
      NEW: t('New dish'),
      AVAILABLE: t('Available now'),
      SOLD_OUT: t('Sold out'),
    }),
    [t],
  );

  const spotlightOptions: Array<{
    count: number;
    id: MenuSpotlightFilter;
    label: string;
  }> = [
    { id: 'ALL', label: spotlightLabels.ALL, count: items.length },
    { id: 'FEATURED', label: spotlightLabels.FEATURED, count: featuredItems.length },
    { id: 'PROMOTIONAL', label: spotlightLabels.PROMOTIONAL, count: promotionalItems.length },
    { id: 'NEW', label: spotlightLabels.NEW, count: newItems.length },
    { id: 'SOLD_OUT', label: spotlightLabels.SOLD_OUT, count: soldOutCount },
  ];

  const activeCategoryLabel = categoryOptions.find((option) => option.id === activeCategory)?.label;

  const clearFilters = () => {
    setSearch('');
    setActiveCategory('ALL');
    setSpotlight('ALL');
  };

  const activeFilters = [
    search.trim()
      ? {
          id: 'search',
          label: `${t('Search')}: ${search.trim()}`,
          onRemove: () => setSearch(''),
        }
      : null,
    activeCategory !== 'ALL' && activeCategoryLabel
      ? {
          id: 'category',
          label: `${t('Categories')}: ${activeCategoryLabel}`,
          onRemove: () => setActiveCategory('ALL'),
        }
      : null,
    spotlight !== 'ALL'
      ? {
          id: 'spotlight',
          label: `${t('Quick filters')}: ${spotlightLabels[spotlight]}`,
          onRemove: () => setSpotlight('ALL'),
        }
      : null,
  ].filter(Boolean) as Array<{ id: string; label: string; onRemove: () => void }>;

  return (
    <div className="-mx-4 -mt-6 bg-[linear-gradient(180deg,#f7f3ec_0%,#f4f7f3_52%,#f8f4ed_100%)] text-ink sm:-mx-6 lg:-mx-8">
      <section className="px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-5">
          <PublicMenuHeader
            availableCount={availableCount}
            categoryCount={categoryOptions.length}
            restaurantName={menuQuery.data?.restaurantName}
            soldOutCount={soldOutCount}
          />

          <div className="grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-8">
            <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
              <PublicMenuToolbar
                activeCategory={activeCategory}
                activeFilters={activeFilters}
                categoryOptions={categoryOptions}
                hasActiveFilters={hasActiveFilters}
                onCategoryChange={setActiveCategory}
                onReset={clearFilters}
                onSpotlightChange={setSpotlight}
                spotlight={spotlight}
                spotlightOptions={spotlightOptions}
              />
            </aside>

            <div className="space-y-5">
              <SearchBar onChange={setSearch} value={search} />

              <PublicMenuResults
                error={menuQuery.error}
                filteredItems={filteredItems}
                hasActiveFilters={hasActiveFilters}
                hasItems={hasItems}
                isError={isError}
                isLoading={isLoading}
                onReset={clearFilters}
                resultCount={filteredItems.length}
              />

              {showCollections ? (
                <PublicMenuCollections
                  featuredItems={featuredItems}
                  newItems={newItems}
                  promotionalItems={promotionalItems}
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

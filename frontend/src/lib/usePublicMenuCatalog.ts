import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { publicApi } from './api';
import { filterPublicMenuItems, isNewMenuItem, type MenuSpotlightFilter } from './publicMenu';

const ALL_CATEGORIES = 'ALL';

export function usePublicMenuCatalog() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES);
  const [spotlight, setSpotlight] = useState<MenuSpotlightFilter>('ALL');
  const deferredSearch = useDeferredValue(search);

  const menuQuery = useQuery({
    queryKey: ['public-menu', 'catalog', { includeUnavailable: true }],
    queryFn: () => publicApi.menu({ includeUnavailable: true }),
  });

  const items = menuQuery.data?.items ?? [];
  const categories = menuQuery.data?.categories ?? [];
  const referenceDate = useMemo(() => new Date(), [menuQuery.dataUpdatedAt]);

  const featuredItems = useMemo(
    () => items.filter((item) => item.featured),
    [items],
  );
  const promotionalItems = useMemo(
    () => items.filter((item) => item.promotional),
    [items],
  );
  const newItems = useMemo(
    () => items.filter((item) => isNewMenuItem(item, referenceDate)),
    [items, referenceDate],
  );

  const filteredItems = useMemo(
    () =>
      filterPublicMenuItems(items, {
        search: deferredSearch,
        categoryId: activeCategory === ALL_CATEGORIES ? null : Number(activeCategory),
        spotlight,
        referenceDate,
      }),
    [activeCategory, deferredSearch, items, referenceDate, spotlight],
  );

  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        id: String(category.id),
        label: category.name,
        count: items.filter((item) => item.categoryId === category.id).length,
      })),
    [categories, items],
  );

  const soldOutCount = useMemo(() => items.filter((item) => !item.available).length, [items]);
  const availableCount = items.length - soldOutCount;
  const hasActiveFilters = search.trim().length > 0 || activeCategory !== ALL_CATEGORIES || spotlight !== 'ALL';

  return {
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
  };
}

import type { Category, MenuItem } from './api';

export const MENU_NEW_WINDOW_DAYS = 14;

export type MenuSpotlightFilter = 'ALL' | 'FEATURED' | 'PROMOTIONAL' | 'NEW' | 'AVAILABLE' | 'SOLD_OUT';

export function matchesMenuSearch(item: MenuItem, search: string) {
  const keyword = search.trim().toLowerCase();
  if (!keyword) {
    return true;
  }

  return [item.name, item.categoryName, item.description ?? '', item.code]
    .join(' ')
    .toLowerCase()
    .includes(keyword);
}

export function isNewMenuItem(item: MenuItem, referenceDate = new Date()) {
  const createdAt = new Date(item.createdAt).getTime();
  if (Number.isNaN(createdAt)) {
    return false;
  }

  const ageMs = referenceDate.getTime() - createdAt;
  return ageMs >= 0 && ageMs <= MENU_NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function matchesSpotlight(item: MenuItem, spotlight: MenuSpotlightFilter, referenceDate = new Date()) {
  switch (spotlight) {
    case 'FEATURED':
      return item.featured;
    case 'PROMOTIONAL':
      return item.promotional;
    case 'NEW':
      return isNewMenuItem(item, referenceDate);
    case 'AVAILABLE':
      return item.available;
    case 'SOLD_OUT':
      return !item.available;
    default:
      return true;
  }
}

export function filterPublicMenuItems(
  items: MenuItem[],
  options: {
    search?: string;
    categoryId?: number | null;
    spotlight?: MenuSpotlightFilter;
    referenceDate?: Date;
  } = {},
) {
  const { search = '', categoryId = null, spotlight = 'ALL', referenceDate = new Date() } = options;

  return items.filter((item) => {
    if (categoryId !== null && item.categoryId !== categoryId) {
      return false;
    }

    if (!matchesSpotlight(item, spotlight, referenceDate)) {
      return false;
    }

    return matchesMenuSearch(item, search);
  });
}

export function resolveMenuItemImage(item: MenuItem) {
  return item.images.find((image) => image.primaryImage)?.imageUrl ?? item.images[0]?.imageUrl ?? null;
}

export function groupMenuItemsByCategory(items: MenuItem[], categories: Category[]) {
  return categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.categoryId === category.id),
    }))
    .filter((entry) => entry.items.length > 0);
}

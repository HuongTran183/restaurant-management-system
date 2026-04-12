import { ApiError, type MenuItem, type PublicMenu } from '../lib/api';
import { formatCurrencyVnd } from '../lib/currency';
import i18n from '../i18n/i18n';

export function filterMenuItems(menu: PublicMenu | undefined, search: string) {
  if (!menu) {
    return [] as MenuItem[];
  }

  if (!search.trim()) {
    return menu.items;
  }

  const keyword = search.trim().toLowerCase();
  return menu.items.filter((item) => item.name.toLowerCase().includes(keyword)
    || item.categoryName.toLowerCase().includes(keyword)
    || (item.description ?? '').toLowerCase().includes(keyword));
}

export function selectedMenuItems(items: MenuItem[], quantities: Record<number, number>) {
  return items
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      menuItemId: item.id,
      quantity: Number(quantities[item.id]),
      note: '',
    }));
}

export function findMenuItemName(items: MenuItem[], menuItemId: number) {
  return items.find((item) => item.id === menuItemId)?.name ?? i18n.t('Item #{{id}}', { id: menuItemId });
}

export function formatMoney(value: number) {
  return formatCurrencyVnd(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function nextReservationSlot() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(19, 0, 0, 0);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const hours = String(next.getHours()).padStart(2, '0');
  const minutes = String(next.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('Something went wrong.');
}

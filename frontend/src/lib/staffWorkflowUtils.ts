import type { Order } from './api';

export function toDateTimeLocalValue(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

export function isFutureDateTimeInput(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

export function getActiveServiceRequestOrders(orders: Order[]): Order[] {
  return orders.filter((order) => order.status === 'DRAFT' || order.status === 'CONFIRMED');
}

export function filterOrdersByTableSession(orders: Order[], tableSessionId: number | null): Order[] {
  if (tableSessionId === null) {
    return orders;
  }

  return orders.filter((order) => order.tableSessionId === tableSessionId);
}

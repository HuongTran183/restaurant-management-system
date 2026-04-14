import {
  filterOrdersByTableSession,
  getActiveServiceRequestOrders,
  isFutureDateTimeInput,
  toDateTimeLocalValue,
} from './staffWorkflowUtils';
import type { Order } from './api';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    orderCode: 'ORD-001',
    tableSessionId: 11,
    customerId: null,
    orderType: 'DINE_IN',
    sourceChannel: 'STAFF',
    status: 'DRAFT',
    subtotal: 12,
    serviceFee: 0,
    vatAmount: 0,
    discountAmount: 0,
    totalAmount: 12,
    paymentRequested: false,
    note: null,
    items: [],
    ...overrides,
  };
}

describe('staffWorkflowUtils', () => {
  it('keeps only draft and confirmed orders for service requests', () => {
    const orders = [
      makeOrder({ id: 1, status: 'DRAFT' }),
      makeOrder({ id: 2, status: 'CONFIRMED' }),
      makeOrder({ id: 3, status: 'COMPLETED' }),
      makeOrder({ id: 4, status: 'CANCELLED' }),
    ];

    expect(getActiveServiceRequestOrders(orders).map((order) => order.id)).toEqual([1, 2]);
  });

  it('filters orders by the selected table session', () => {
    const orders = [
      makeOrder({ id: 1, tableSessionId: 11 }),
      makeOrder({ id: 2, tableSessionId: 22 }),
      makeOrder({ id: 3, tableSessionId: null }),
    ];

    expect(filterOrdersByTableSession(orders, 11).map((order) => order.id)).toEqual([1]);
    expect(filterOrdersByTableSession(orders, null).map((order) => order.id)).toEqual([1, 2, 3]);
  });

  it('converts ISO timestamps into datetime-local input values', () => {
    expect(toDateTimeLocalValue('2026-04-11T10:30:00.000Z')).toMatch(/2026-04-11T/);
    expect(toDateTimeLocalValue(null)).toBe('');
  });

  it('accepts only future local datetime values', () => {
    const future = toDateTimeLocalValue(new Date(Date.now() + 60 * 60 * 1000).toISOString());
    const past = toDateTimeLocalValue(new Date(Date.now() - 60 * 60 * 1000).toISOString());

    expect(isFutureDateTimeInput(future)).toBe(true);
    expect(isFutureDateTimeInput(past)).toBe(false);
  });
});

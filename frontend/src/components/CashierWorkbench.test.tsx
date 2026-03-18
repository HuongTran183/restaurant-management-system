import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { CashierWorkbench } from './CashierWorkbench';
import type { Invoice, MenuItem, Order, Payment } from '../lib/api';

function makeMenuItem(overrides: Partial<MenuItem> = {}): MenuItem {
  return {
    id: 91,
    code: 'PHO-001',
    name: 'Pho Beef',
    description: 'House broth',
    price: 14,
    available: true,
    active: true,
    categoryId: 7,
    categoryName: 'Noodles',
    images: [],
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    orderCode: 'ORD-001',
    tableSessionId: 11,
    customerId: null,
    orderType: 'DINE_IN',
    sourceChannel: 'STAFF',
    status: 'CONFIRMED',
    subtotal: 12.5,
    serviceFee: 0,
    vatAmount: 0,
    discountAmount: 0,
    totalAmount: 12.5,
    paymentRequested: false,
    note: null,
    items: [],
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: 101,
    invoiceNumber: 'INV-001',
    orderId: 1,
    status: 'OPEN',
    totalAmount: 25,
    paidAmount: 5,
    issuedAt: '2026-03-18T10:00:00.000Z',
    closedAt: null,
    ...overrides,
  };
}

function renderWorkbench(overrides: Partial<ComponentProps<typeof CashierWorkbench>> = {}) {
  const onConfirmOrder = vi.fn();
  const onCancelOrder = vi.fn();
  const onCreateInvoice = vi.fn();
  const onRecordPayment = vi.fn();

  render(
    <CashierWorkbench
      orders={[makeOrder()]}
      invoices={[makeInvoice()]}
      payments={[] satisfies Payment[]}
      isBusy={false}
      orderError={null}
      invoiceError={null}
      paymentError={null}
    showOrderOperations
    showBillingOperations
    invoicePresenceByOrderId={{ 1: true }}
    menuItems={[makeMenuItem()]}
    onAddOrderItem={vi.fn()}
    onConfirmOrder={onConfirmOrder}
    onCancelOrder={onCancelOrder}
    onCreateInvoice={onCreateInvoice}
    onRecordPayment={onRecordPayment}
    onUpdateOrderItem={vi.fn()}
    {...overrides}
  />,
  );

  return { onConfirmOrder, onCancelOrder, onCreateInvoice, onRecordPayment };
}

describe('CashierWorkbench', () => {
  it('prefills the first open invoice and remaining amount in the payment form', () => {
    renderWorkbench();

    expect(screen.getByLabelText(/invoice/i)).toHaveValue('101');
    expect(screen.getByLabelText(/amount/i)).toHaveValue(20);
  });

  it('routes pay-now invoice selection into the payment form', async () => {
    const user = userEvent.setup();
    renderWorkbench({
      invoices: [
        makeInvoice({ id: 101, invoiceNumber: 'INV-001', totalAmount: 25, paidAmount: 5 }),
        makeInvoice({ id: 102, invoiceNumber: 'INV-002', orderId: 2, totalAmount: 40, paidAmount: 0 }),
      ],
    });

    await user.click(screen.getAllByRole('button', { name: /pay now/i })[1]);

    expect(screen.getByLabelText(/invoice/i)).toHaveValue('102');
    expect(screen.getByLabelText(/amount/i)).toHaveValue(40);
  });

  it('records a payment with the selected invoice, amount, and method', async () => {
    const user = userEvent.setup();
    const { onRecordPayment } = renderWorkbench();

    await user.selectOptions(screen.getByLabelText(/method/i), 'CARD');
    await user.clear(screen.getByLabelText(/amount/i));
    await user.type(screen.getByLabelText(/amount/i), '18.5');
    await user.type(screen.getByPlaceholderText(/optional receipt or cashier note/i), 'Split payment');
    await user.click(screen.getByRole('button', { name: /record payment/i }));

    expect(onRecordPayment).toHaveBeenCalledWith({
      invoiceId: 101,
      amount: 18.5,
      method: 'CARD',
      note: 'Split payment',
    });
  });

  it('adds a menu item into the selected order ticket', async () => {
    const user = userEvent.setup();
    const onAddOrderItem = vi.fn();

    renderWorkbench({
      onAddOrderItem,
      orders: [makeOrder({ status: 'DRAFT', items: [] })],
      invoicePresenceByOrderId: {},
    });

    await user.selectOptions(screen.getByLabelText(/add menu item for ord-001/i), '91');
    await user.clear(screen.getByLabelText(/add quantity for ord-001/i));
    await user.type(screen.getByLabelText(/add quantity for ord-001/i), '2');
    await user.type(screen.getByLabelText(/add note for ord-001/i), 'No cilantro');
    await user.click(screen.getByRole('button', { name: /add item/i }));

    expect(onAddOrderItem).toHaveBeenCalledWith({
      orderId: 1,
      menuItemId: 91,
      quantity: 2,
      note: 'No cilantro',
    });
  });

  it('updates a draft line item with the entered quantity and note', async () => {
    const user = userEvent.setup();
    const onUpdateOrderItem = vi.fn();

    renderWorkbench({
      onUpdateOrderItem,
      orders: [
        makeOrder({
          status: 'DRAFT',
          items: [
            {
              id: 44,
              menuItemId: 91,
              itemName: 'Pho Beef',
              quantity: 1,
              unitPrice: 14,
              lineTotal: 14,
              note: null,
              status: 'NEW',
            },
          ],
        }),
      ],
      invoicePresenceByOrderId: {},
    });

    await user.clear(screen.getByLabelText(/quantity for pho beef on ord-001/i));
    await user.type(screen.getByLabelText(/quantity for pho beef on ord-001/i), '3');
    await user.type(screen.getByLabelText(/line note for pho beef on ord-001/i), 'Extra hot');
    await user.click(screen.getByRole('button', { name: /update line/i }));

    expect(onUpdateOrderItem).toHaveBeenCalledWith({
      orderId: 1,
      orderItemId: 44,
      quantity: 3,
      note: 'Extra hot',
      cancelled: false,
    });
  });
});

import { expect, test } from '@playwright/test';
import { getDemoQrToken, loginAsAdmin } from './helpers';
import { API_BASE_URL } from './runtime';

type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type OrderResponse = {
  id: number;
  orderCode: string;
  paymentRequested: boolean;
};

type InvoiceResponse = {
  id: number;
  orderId: number;
  status: string;
  totalAmount: number | string;
  paidAmount: number | string;
};

type PaymentResponse = {
  id: number;
  paymentCode: string;
  invoiceId: number;
  method: string;
  status: string;
  amount: number | string;
};

function toNumber(v: number | string): number {
  if (typeof v === 'number') return v;
  return Number(v);
}

test('qr order + request bill -> invoice and payment persist', async ({ page, request }) => {
  const token = await getDemoQrToken(request);

  // 1) UI: tạo QR order và request bill
  // Force Vietnamese UI for deterministic selectors.
  await page.addInitScript(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });

  await page.goto(`/qr/${token}`);

  // i18n initializes on first load; reload after forcing language.
  await page.evaluate(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
  await page.reload();

  await expect(page.getByText(/gọi món tại bàn/i)).toBeVisible();

  await page.getByRole('button', { name: '+' }).first().click();
  await page.getByRole('button', { name: /gửi đơn qr/i }).click();

  await expect(page.getByText(/Đơn đang hoạt động/i)).toBeVisible();
  await expect(page.getByText(/ORD-/)).toBeVisible();

  const ordText = await page.getByText(/ORD-/).first().innerText();
  // Một số trường hợp UI hiển thị dạng "ORD--XXXX"
  const orderCode = ordText.match(/ORD-+[A-Z0-9]+/)?.[0];
  expect(orderCode, `Cannot parse orderCode from: ${ordText}`).toBeTruthy();

  await page.getByRole('button', { name: /yêu cầu hóa đơn/i }).click();
  await expect(page.getByText(/đã gửi yêu cầu phục vụ/i)).toBeVisible();

  // 2) API: lấy orderId từ orderCode để tạo invoice/payment đúng bản ghi
  const orderResp = await request.get(`${API_BASE_URL}/api/public/orders/${orderCode}`);
  expect(orderResp.ok()).toBeTruthy();
  const order = (await orderResp.json()) as OrderResponse;

  expect(order.id).toBeTruthy();
  expect(order.paymentRequested).toBeTruthy();

  // 3) API: tạo invoice từ orderId và ghi payment cho invoice đó
  const accessToken = await loginAsAdmin(request);
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // 3.1) Một số test có thể chạy trên DB "không sạch", nên invoice có thể đã tồn tại cho order.
  //      Ưu tiên lấy invoice OPEN hiện có; nếu chưa có thì confirm order và tạo invoice.
  const invoicesPageResp = await request.get(`${API_BASE_URL}/api/invoices?orderId=${order.id}&size=20&page=0`, {
    headers: authHeaders,
  });
  expect(invoicesPageResp.ok()).toBeTruthy();
  const invoicesPage = (await invoicesPageResp.json()) as PageResponse<InvoiceResponse>;

  let invoice: InvoiceResponse | null = null;
  invoice = invoicesPage.content?.find((i) => i.status === 'OPEN') ?? null;

  if (!invoice) {
    // InvoiceService chỉ cho phép invoicing khi order đã được confirm/completed.
    await request.post(`${API_BASE_URL}/api/orders/${order.id}/confirm`, {
      headers: authHeaders,
    });

    const invoiceCreateResp = await request.post(`${API_BASE_URL}/api/invoices`, {
      headers: authHeaders,
      data: { orderId: order.id },
    });
    if (!invoiceCreateResp.ok()) {
      const bodyText = await invoiceCreateResp.text();
      throw new Error(`Failed to create invoice. status=${invoiceCreateResp.status()} body=${bodyText}`);
    }

    invoice = (await invoiceCreateResp.json()) as InvoiceResponse;
  }

  const remainingAmount = toNumber(invoice.totalAmount) - toNumber(invoice.paidAmount);

  let payment: PaymentResponse | null = null;
  if (remainingAmount > 0) {
    const paymentResp = await request.post(`${API_BASE_URL}/api/payments`, {
      headers: authHeaders,
      data: {
        invoiceId: invoice.id,
        method: 'CASH',
        amount: remainingAmount,
        note: `e2e payment for ${orderCode}`,
      },
    });
    expect(paymentResp.ok()).toBeTruthy();
    payment = (await paymentResp.json()) as PaymentResponse;
    expect(payment.status).toBe('COMPLETED');
  }

  // 4) Xác nhận persistence trong DB qua API
  const paymentsPageResp = await request.get(`${API_BASE_URL}/api/payments?invoiceId=${invoice.id}&size=20&page=0`, {
    headers: authHeaders,
  });
  expect(paymentsPageResp.ok()).toBeTruthy();
  const paymentsPage = (await paymentsPageResp.json()) as PageResponse<PaymentResponse>;

  expect(paymentsPage.totalElements).toBeGreaterThan(0);
  expect(paymentsPage.content[0]?.invoiceId).toBe(invoice.id);
  expect(paymentsPage.content.some((p) => p.status === 'COMPLETED')).toBeTruthy();
});

import { expect, test } from '@playwright/test';
import { loginToStaffDashboard, seedPendingBillScenario } from './helpers';

test('staff resolves service request -> invoice -> payment (UI only)', async ({ page, request }) => {
  const scenario = await seedPendingBillScenario(request);
  expect(scenario.orderCode).toBeTruthy();

  await loginToStaffDashboard(page);

  // Chờ staff nhìn thấy đúng order được seed từ backend scenario.
  const orderCodeLabel = page.getByText(scenario.orderCode!, { exact: true }).first();
  await expect(orderCodeLabel).toBeVisible({ timeout: 30_000 });
  const orderCard = page.locator('article').filter({ has: orderCodeLabel }).first();
  await expect(orderCard).toBeVisible();

  const resolveButton = page.getByRole('button', { name: /xử lý/i }).first();
  await expect(resolveButton).toBeVisible();
  await expect(resolveButton).toBeEnabled({ timeout: 30_000 });
  await resolveButton.click();

  // 4) Đảm bảo order đã sẵn sàng để tạo invoice (thường cần confirm trước)
  const confirmButton = orderCard.getByRole('button', { name: /xác nhận/i }).first();
  if (await confirmButton.isVisible().catch(() => false)) {
    await expect(confirmButton).toBeEnabled({ timeout: 30_000 });
    await confirmButton.click();
  }

  const createInvoiceButton = orderCard.getByRole('button', { name: /tạo hóa đơn/i }).first();
  const invoiceCard = page.locator('article').filter({ has: page.getByText(/INV-/i) }).first();
  await expect
    .poll(async () => {
      if (await invoiceCard.isVisible().catch(() => false)) {
        return 'invoice-ready';
      }
      if (await createInvoiceButton.isVisible().catch(() => false)) {
        return (await createInvoiceButton.isEnabled().catch(() => false)) ? 'ready-to-create' : 'waiting';
      }
      return 'waiting';
    }, { timeout: 30_000, message: 'expected the seeded order to expose a ready invoice or a create-invoice action' })
    .not.toBe('waiting');

  if (!(await invoiceCard.isVisible().catch(() => false))) {
    await expect(createInvoiceButton).toBeEnabled({ timeout: 30_000 });
    await createInvoiceButton.click();
  }

  // 5) Record payment / Pay now (tất cả bằng UI)
  await expect(invoiceCard).toBeVisible({ timeout: 30_000 });
  const payNowButton = invoiceCard.getByRole('button', { name: /thanh toán ngay|pay now/i }).first();
  if (await payNowButton.isVisible().catch(() => false)) {
    await expect(payNowButton).toBeEnabled({ timeout: 30_000 });
    await payNowButton.click();
  }

  const invoiceSelect = page.getByRole('combobox', { name: /^hóa đơn$/i });
  await expect(invoiceSelect).not.toContainText(/không có hóa đơn đang mở/i, {
    timeout: 30_000,
  });
  const recordPaymentButton = page.getByRole('button', { name: /ghi nhận thanh toán/i }).first();
  await expect(recordPaymentButton).toBeVisible({ timeout: 30_000 });
  await expect(recordPaymentButton).toBeEnabled({ timeout: 30_000 });
  await recordPaymentButton.click({ force: true });

  // 6) Xác nhận UI đã ghi payment (thường sẽ hiện mã PAY- và state Paid)
  await expect(page.getByText(/PAY-/i).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/đã thanh toán/i).first()).toBeVisible();
});


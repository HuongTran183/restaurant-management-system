import { expect, test } from '@playwright/test';
import { getDemoQrToken } from './helpers';

test('customer can submit a QR order and request the bill', async ({ page, request }) => {
  const token = await getDemoQrToken(request);

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

  // Debug/assert: ensure localStorage was actually set.
  const storedLang = await page.evaluate(() => window.localStorage.getItem('h-restaurant-management-system:lang'));
  expect(storedLang).toBe('vi');

  await expect(page.getByText(/gọi món tại bàn/i)).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  // Chờ state giỏ cập nhật trước khi gửi (tránh race payload).
  await expect(page.getByText(/x1/i)).toBeVisible({ timeout: 10_000 });

  const sendQrButton = page.getByRole('button', { name: /gửi đơn qr/i });
  await expect(sendQrButton).toBeEnabled({ timeout: 10_000 });
  const submitRespPromise = page.waitForResponse((resp) => {
    return resp.request().method() === 'POST' && resp.url().includes('/api/public/qr/') && resp.url().includes('/orders');
  });
  await sendQrButton.click();
  const submitResp = await submitRespPromise;
  if (!submitResp.ok()) {
    const bodyText = await submitResp.text();
    throw new Error(`Submit QR order failed: status=${submitResp.status()} body=${bodyText}`);
  }

  await expect(page.getByText(/Đơn đang hoạt động/i)).toBeVisible();
  await expect(page.getByText(/ORD-/)).toBeVisible();

  await page.getByRole('button', { name: /yêu cầu hóa đơn/i }).click();
  await expect(page.getByText(/đã gửi yêu cầu phục vụ/i)).toBeVisible();
});

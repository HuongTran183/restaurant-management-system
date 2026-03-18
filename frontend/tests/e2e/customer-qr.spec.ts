import { expect, test } from '@playwright/test';
import { getDemoQrToken } from './helpers';

test('customer can submit a QR order and request the bill', async ({ page, request }) => {
  const token = await getDemoQrToken(request);

  await page.goto(`/qr/${token}`);

  await expect(page.getByText(/table-side ordering/i)).toBeVisible();
  await page.getByRole('button', { name: '+' }).first().click();
  await page.getByRole('button', { name: /send qr order/i }).click();

  await expect(page.getByText(/Active order/i)).toBeVisible();
  await expect(page.getByText(/ORD-/)).toBeVisible();

  await page.getByRole('button', { name: /request bill/i }).click();
  await expect(page.getByText(/Service request sent/i)).toBeVisible();
});

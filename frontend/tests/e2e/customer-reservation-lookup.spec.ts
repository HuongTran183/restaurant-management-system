import { expect, test } from '@playwright/test';
import { nextReservationDateTimeLocal } from './helpers';

test('customer can create, lookup by code, and cancel reservation', async ({ page }) => {
  const unique = Date.now();

  // Force Vietnamese UI for deterministic selectors.
  await page.addInitScript(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });

  await page.goto('/book');

  // i18n initializes on first load; reload after forcing language.
  await page.evaluate(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
  await page.reload();

  // Create
  await page.getByLabel('Họ tên').fill(`Lookup Guest ${unique}`);
  await page.getByLabel('Điện thoại').fill(`09${String(unique).slice(-8)}`);
  await page.getByLabel('Email').fill(`lookup${unique}@example.com`);
  await page.getByLabel('Số lượng khách').fill('3');
  await page.getByLabel('Thời gian đến').fill(nextReservationDateTimeLocal());
  await page.getByLabel('Khu vực ưu tiên').fill('Demo Hall');
  await page.getByLabel('Ghi chú').fill('Window seat if possible');
  await page.getByRole('button', { name: /tạo đặt chỗ/i }).click();

  await expect(page.getByText(/RES-/)).toBeVisible();
  await expect(page.getByText(/Đang chờ/i)).toBeVisible();

  const codeField = page.getByPlaceholder('RES-XXXX');
  await expect(codeField).toHaveValue(/RES-/);
  const reservationCode = await codeField.inputValue();
  expect(reservationCode).toMatch(/^RES-/);

  // Reload + Lookup
  await page.reload();

  await expect(page.getByLabel('Họ tên')).toBeVisible();
  await codeField.fill(reservationCode);
  await page.getByRole('button', { name: /tìm/i }).click();

  await expect(page.getByText(/Đang chờ/i)).toBeVisible();

  // Cancel
  await page.getByLabel('Ghi chú hủy').fill(`Lookup cancel ${unique}`);
  await page.getByRole('button', { name: /hủy đặt chỗ/i }).click();
  await expect(page.getByText(/Đã hủy/i)).toBeVisible();
});


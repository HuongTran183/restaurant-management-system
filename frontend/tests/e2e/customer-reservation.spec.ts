import { expect, test } from '@playwright/test';
import { nextReservationDateTimeLocal } from './helpers';

test('customer can create and cancel a reservation', async ({ page }) => {
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

  await page.getByLabel('Họ tên').fill(`Guest ${unique}`);
  await page.getByLabel('Điện thoại').fill(`09${String(unique).slice(-8)}`);
  await page.getByLabel('Email').fill(`guest${unique}@example.com`);
  await page.getByLabel('Số lượng khách').fill('3');
  await page.getByLabel('Thời gian đến').fill(nextReservationDateTimeLocal());
  await page.getByLabel('Khu vực ưu tiên').fill('Demo Hall');
  await page.getByLabel('Ghi chú').fill('Window seat if possible');
  await page.getByRole('button', { name: /tạo đặt chỗ/i }).click();

  await expect(page.getByText(/RES-/)).toBeVisible();
  await expect(page.getByTestId('public-reservation-status')).toHaveText(/Trạng thái đặt chỗ:\s*Đang chờ/i);

  await page.getByLabel('Ghi chú hủy').fill('Plan changed');
  await page.getByRole('button', { name: /hủy đặt chỗ/i }).click();

  await expect(page.getByTestId('public-reservation-status')).toHaveText(/Trạng thái đặt chỗ:\s*Đã hủy/i);
});

import { expect, test } from '@playwright/test';
import { nextReservationDateTimeLocal } from './helpers';

test('customer can create and cancel a reservation', async ({ page }) => {
  const unique = Date.now();

  await page.goto('/book');

  await page.getByLabel('Guest name').fill(`Guest ${unique}`);
  await page.getByLabel('Phone').fill(`09${String(unique).slice(-8)}`);
  await page.getByLabel('Email').fill(`guest${unique}@example.com`);
  await page.getByLabel('Party size').fill('3');
  await page.getByLabel('Arrival time').fill(nextReservationDateTimeLocal());
  await page.getByLabel('Preferred area').fill('Demo Hall');
  await page.getByLabel('Notes').fill('Window seat if possible');
  await page.getByRole('button', { name: /create reservation/i }).click();

  await expect(page.getByText(/RES-/)).toBeVisible();
  await expect(page.getByText('PENDING')).toBeVisible();

  await page.getByLabel('Cancel note').fill('Plan changed');
  await page.getByRole('button', { name: /cancel reservation/i }).click();

  await expect(page.getByText('CANCELLED')).toBeVisible();
});

import { expect, test } from '@playwright/test';

test('staff can enter the floor workspace and continue a table flow', async ({ page }) => {
  await page.goto('/staff/login');

  await page.getByLabel('Username').fill('admin');
  await page.getByLabel('Password').fill('Admin@123456');
  await page.getByRole('button', { name: /open staff dashboard/i }).click();

  await expect(page.getByText(/Welcome back/i)).toBeVisible();

  const seatWalkInButton = page.getByRole('button', { name: /seat walk-in/i }).first();
  const openOrderFlowButton = page.getByRole('button', { name: /open order flow/i }).first();
  const openSessionButton = page.getByRole('button', { name: /open session/i }).first();

  await expect
    .poll(async () => {
      return (await seatWalkInButton.count()) + (await openOrderFlowButton.count()) + (await openSessionButton.count());
    }, { message: 'expected at least one floor action to become available' })
    .toBeGreaterThan(0);

  if (await seatWalkInButton.isVisible().catch(() => false)) {
    await seatWalkInButton.click();
  } else if (await openOrderFlowButton.isVisible().catch(() => false)) {
    await openOrderFlowButton.click();
  } else {
    await openSessionButton.click();
  }

  const workbench = page.getByTestId('operations-workbench');
  await expect(workbench).toBeVisible();
  await expect(workbench.getByText(/Focused session/i)).toBeVisible();

  const orderCode = workbench.getByText(/ORD-/).first();
  const createOrderButton = workbench.getByRole('button', { name: /create dine-in order/i }).first();

  await expect
    .poll(async () => {
      if (await orderCode.isVisible().catch(() => false)) {
        return 'order-ready';
      }

      if (await createOrderButton.isVisible().catch(() => false)) {
        return 'create-available';
      }

      return 'waiting';
    }, { message: 'expected the focused session to expose an existing order or a create-order action' })
    .not.toBe('waiting');
});

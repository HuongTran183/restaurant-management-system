import { expect, test } from '@playwright/test';

test('staff can enter the floor workspace and continue a table flow', async ({ page }) => {
  // Force Vietnamese UI for deterministic selectors.
  await page.addInitScript(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });

  await page.goto('/staff/login');

  // i18n initializes on first load; reload after forcing language.
  await page.evaluate(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
  await page.reload();

  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Admin@123456');
  await page.getByRole('button', { name: /mở bảng điều khiển nhân viên/i }).click();

  await expect(page.getByText(/Chào mừng bạn quay lại/i)).toBeVisible();

  const seatWalkInButton = page.getByRole('button', { name: /cho khách vãng lai ngồi/i }).first();
  const openOrderFlowButton = page.getByRole('button', { name: /mở luồng đơn/i }).first();
  const openSessionButton = page.getByRole('button', { name: /mở ca/i }).first();

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
  await expect(workbench.getByText(/Ca bàn đang tập trung/i)).toBeVisible();

  const orderCode = workbench.getByText(/ORD-/).first();
  const createOrderButton = workbench.getByRole('button', { name: /tạo đơn ăn tại chỗ/i }).first();

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

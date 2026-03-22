import { expect, test } from '@playwright/test';
import { ensureDemoTableHasDraftOrder, loginToStaffDashboard, openAnyFloorAction } from './helpers';

test('staff workbench degrades gracefully when menu loading fails', async ({ page, request }) => {
  await page.route('**/api/public/menu', async (route) => {
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'menu unavailable in e2e' }),
    });
  });

  await ensureDemoTableHasDraftOrder(request);
  await loginToStaffDashboard(page);
  const workbench = await openAnyFloorAction(page);
  const outageMessage = workbench.getByText(
    /chưa thể tải danh sách món lúc này\. các thao tác đơn và thanh toán hiện có vẫn dùng được\./i,
  ).first();

  await expect(workbench.getByText(/^thao tác đơn$/i).first()).toBeVisible();
  await expect(workbench.getByText(/^hóa đơn và thanh toán$/i).first()).toBeVisible();
  await expect(outageMessage).toBeVisible({ timeout: 30_000 });
});

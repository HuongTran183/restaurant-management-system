import { expect, test, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import { ensureDemoTableHasDraftOrder, loginToStaffDashboard, openAnyFloorAction } from './helpers';

async function openStaffLayout(page: Page, request: APIRequestContext) {
  await ensureDemoTableHasDraftOrder(request);
  await loginToStaffDashboard(page);
  await openAnyFloorAction(page);
}

function dynamicMasks(page: Page): Locator[] {
  return [
    page.getByText(/TS-/i),
    page.getByText(/ORD-/i),
    page.getByText(/INV-/i),
    page.getByText(/PAY-/i),
    page.getByText(/Ca\s+#\d+/i),
    page.getByText(/Đã mở\s+\d{1,2}:\d{2}/i),
    page.getByText(/Opened\s+\d{1,2}:\d{2}/i),
  ];
}

test('staff layout stays stable on desktop', async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openStaffLayout(page, request);

  const reservationQueueHeader = page.getByTestId('reservation-queue-header');
  await reservationQueueHeader.scrollIntoViewIfNeeded();
  await expect(reservationQueueHeader).toHaveScreenshot('reservation-queue-header-desktop.png');

  const addItemForm = page.getByTestId('operations-workbench').locator('[data-testid^="cashier-add-item-form-"]').first();
  await addItemForm.scrollIntoViewIfNeeded();
  await expect(addItemForm).toHaveScreenshot('cashier-add-item-form-desktop.png');

  const dashboardGrid = page.getByTestId('staff-dashboard-grid');
  await dashboardGrid.scrollIntoViewIfNeeded();
  await expect(dashboardGrid).toHaveScreenshot('staff-dashboard-grid-desktop.png', {
    mask: dynamicMasks(page),
    maxDiffPixels: 900,
  });
});

test('staff layout stays stable on narrow mobile viewport', async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStaffLayout(page, request);

  const reservationQueueHeader = page.getByTestId('reservation-queue-header');
  await reservationQueueHeader.scrollIntoViewIfNeeded();
  await expect(reservationQueueHeader).toHaveScreenshot('reservation-queue-header-mobile.png');

  const addItemForm = page.getByTestId('operations-workbench').locator('[data-testid^="cashier-add-item-form-"]').first();
  await addItemForm.scrollIntoViewIfNeeded();
  await expect(addItemForm).toHaveScreenshot('cashier-add-item-form-mobile.png');

  const dashboardGrid = page.getByTestId('staff-dashboard-grid');
  await dashboardGrid.scrollIntoViewIfNeeded();
  await expect(dashboardGrid).toHaveScreenshot('staff-dashboard-grid-mobile.png', {
    mask: dynamicMasks(page),
    maxDiffPixels: 900,
  });
});

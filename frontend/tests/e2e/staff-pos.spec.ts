import { expect, test, type Locator, type Page } from '@playwright/test';
import { ensureFocusedSessionHasOrder, loginToStaffDashboard, openAnyFloorAction } from './helpers';

function boxesOverlap(left: { x: number; y: number; width: number; height: number }, right: { x: number; y: number; width: number; height: number }) {
  return left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
}

async function expectBoxWithinViewport(page: Page, locator: Locator) {
  const viewport = page.viewportSize();
  const box = await locator.boundingBox();

  expect(viewport).not.toBeNull();
  expect(box).not.toBeNull();

  const safeViewport = viewport!;
  const safeBox = box!;
  expect(safeBox.x).toBeGreaterThanOrEqual(0);
  expect(safeBox.y).toBeGreaterThanOrEqual(0);
  expect(safeBox.x + safeBox.width).toBeLessThanOrEqual(safeViewport.width + 1);
  expect(safeBox.y + safeBox.height).toBeLessThanOrEqual(safeViewport.height + 1_000);

  return safeBox;
}

test('staff can enter the floor workspace and continue a table flow', async ({ page }) => {
  await loginToStaffDashboard(page);
  await openAnyFloorAction(page);
  await ensureFocusedSessionHasOrder(page);
});

test('staff keeps reservation filters and add-item form separated on a narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await loginToStaffDashboard(page);
  await openAnyFloorAction(page);
  const { workbench } = await ensureFocusedSessionHasOrder(page);

  const reservationSearch = page.getByRole('textbox', { name: /tìm đặt chỗ/i });
  const clearFiltersButton = page.getByRole('button', { name: /xóa bộ lọc/i });
  const addItemField = workbench.getByLabel(/thêm món cho đơn/i).first();
  const quantityField = workbench.getByLabel(/thêm số lượng cho đơn/i).first();
  const noteField = workbench.getByLabel(/thêm ghi chú cho đơn/i).first();
  const addItemButton = workbench.getByRole('button', { name: /^thêm món$/i }).first();

  await expect(reservationSearch).toBeVisible();
  await expect(clearFiltersButton).toBeVisible();
  await expect(addItemField).toBeVisible();
  await expect(quantityField).toBeVisible();
  await expect(noteField).toBeVisible();
  await expect(addItemButton).toBeVisible();

  await reservationSearch.scrollIntoViewIfNeeded();
  await clearFiltersButton.scrollIntoViewIfNeeded();
  const reservationSearchBox = await expectBoxWithinViewport(page, reservationSearch);
  const clearFiltersBox = await expectBoxWithinViewport(page, clearFiltersButton);

  await addItemField.scrollIntoViewIfNeeded();
  await quantityField.scrollIntoViewIfNeeded();
  await noteField.scrollIntoViewIfNeeded();
  await addItemButton.scrollIntoViewIfNeeded();
  const addItemFieldBox = await expectBoxWithinViewport(page, addItemField);
  const quantityFieldBox = await expectBoxWithinViewport(page, quantityField);
  const noteFieldBox = await expectBoxWithinViewport(page, noteField);
  const addItemButtonBox = await expectBoxWithinViewport(page, addItemButton);

  expect(boxesOverlap(reservationSearchBox, clearFiltersBox)).toBeFalsy();
  expect(boxesOverlap(addItemFieldBox, addItemButtonBox)).toBeFalsy();
  expect(boxesOverlap(quantityFieldBox, addItemButtonBox)).toBeFalsy();
  expect(boxesOverlap(noteFieldBox, addItemButtonBox)).toBeFalsy();
});

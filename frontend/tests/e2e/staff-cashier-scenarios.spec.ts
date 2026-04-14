import { expect, test } from '@playwright/test';
import { loginToStaffDashboard, seedOpenInvoiceScenario, seedPaymentHistoryScenario } from './helpers';

test('staff sees an actionable open invoice from backend scenario', async ({ page, request }) => {
  const scenario = await seedOpenInvoiceScenario(request);
  expect(scenario.invoiceNumber).toBeTruthy();

  await loginToStaffDashboard(page);

  await expect(page.getByText(scenario.invoiceNumber!, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('combobox', { name: /^hóa đơn$/i })).not.toContainText(/không có hóa đơn đang mở/i, {
    timeout: 30_000,
  });
});

test('staff sees seeded paid invoice and payment history from backend scenario', async ({ page, request }) => {
  const scenario = await seedPaymentHistoryScenario(request);
  expect(scenario.invoiceNumber).toBeTruthy();
  expect(scenario.paymentCode).toBeTruthy();

  await loginToStaffDashboard(page);

  await expect(page.getByText(scenario.invoiceNumber!, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(scenario.paymentCode!, { exact: true }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/đã thanh toán/i).first()).toBeVisible();
});

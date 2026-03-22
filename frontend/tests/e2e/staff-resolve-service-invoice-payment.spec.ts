import { expect, test } from '@playwright/test';
import { getDemoQrToken } from './helpers';

function extractFirstOrderCode(text: string): string | null {
  // Một số trạng thái UI hiển thị dạng "ORD--XXXX" (double hyphen)
  const match = text.match(/\bORD-[A-Z0-9-]+\b/);
  return match?.[0] ?? null;
}

test('staff resolves service request -> invoice -> payment (UI only)', async ({ page, request }) => {
  // 1) Tạo QR order và request bill (phần này dùng UI, staff sẽ xử lý sau)
  const token = await getDemoQrToken(request);

  // Force Vietnamese UI for deterministic selectors.
  await page.addInitScript(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });

  await page.goto(`/qr/${token}`);

  // i18n initializes on first load; reload after forcing language.
  await page.evaluate(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
  await page.reload();

  await expect(page.getByText(/gọi món tại bàn/i)).toBeVisible();

  await page.getByRole('button', { name: '+' }).first().click();
  await page.getByRole('button', { name: /gửi đơn qr/i }).click();

  await expect(page.getByText(/Đơn đang hoạt động/i)).toBeVisible();
  await expect(page.getByText(/ORD-/i)).toBeVisible();

  const ordText = await page.getByText(/ORD-/).first().innerText();
  const orderCode = extractFirstOrderCode(ordText);
  expect(orderCode, `Cannot parse order code from: ${ordText}`).toBeTruthy();

  await page.getByRole('button', { name: /yêu cầu hóa đơn/i }).click();
  await expect(page.getByText(/đã gửi yêu cầu phục vụ/i)).toBeVisible();

  // 2) Staff login
  await page.goto('/staff/login');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Admin@123456');
  await page.getByRole('button', { name: /mở bảng điều khiển nhân viên/i }).click();
  await expect(page.getByText(/Chào mừng bạn quay lại/i)).toBeVisible();

  // 3) Chờ staff nhìn thấy order và tiến hành resolve
  //    (đảm bảo chúng ta đang xử lý đúng order vừa tạo từ luồng QR)
  await expect(page.getByText(orderCode!, { exact: true }).first()).toBeVisible({ timeout: 30_000 });

  const resolveButton = page.getByRole('button', { name: /xử lý/i }).first();
  await expect(resolveButton).toBeVisible();
  await resolveButton.click();

  // 4) Đảm bảo order đã sẵn sàng để tạo invoice (thường cần confirm trước)
  const confirmButton = page.getByRole('button', { name: /xác nhận/i }).first();
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }

  const createInvoiceButton = page.getByRole('button', { name: /tạo hóa đơn/i }).first();
  // Nếu DB không sạch hoặc đã có invoice cho order, nút này có thể không xuất hiện.
  if (await createInvoiceButton.isVisible().catch(() => false)) {
    await createInvoiceButton.click();
  }

  // 5) Record payment / Pay now (tất cả bằng UI)
  const recordPaymentButton = page.getByRole('button', { name: /ghi nhận thanh toán/i }).first();
  await expect(recordPaymentButton).toBeVisible({ timeout: 30_000 });
  await recordPaymentButton.click({ force: true });

  // 6) Xác nhận UI đã ghi payment (thường sẽ hiện mã PAY- và state Paid)
  await expect(page.getByText(/PAY-/i).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/đã thanh toán/i).first()).toBeVisible();
});


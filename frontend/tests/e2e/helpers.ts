import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { API_BASE_URL } from './runtime';

type AuthPayload = {
  accessToken: string;
};

type DevScenarioResponse = {
  scenario: string;
  tableId: number;
  tableCode: string;
  qrToken: string;
  qrLandingUrl: string;
  tableSessionId: number | null;
  tableSessionCode: string | null;
  orderId: number | null;
  orderCode: string | null;
  serviceRequestId: number | null;
  serviceRequestType: string | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  paymentId: number | null;
  paymentCode: string | null;
  paymentStatus: string | null;
};

type DevResetResponse = {
  status: string;
  message: string;
};

async function parseJson<T>(response: Awaited<ReturnType<APIRequestContext['get']>>): Promise<T> {
  if (!response.ok()) {
    throw new Error(`Request failed: ${response.status()} ${response.url()}`);
  }

  return (await response.json()) as T;
}

export async function loginAsAdmin(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
    data: {
      username: 'admin',
      password: 'Admin@123456',
    },
  });
  const payload = await parseJson<AuthPayload>(response);
  return payload.accessToken;
}

async function callDevScenario(
  request: APIRequestContext,
  scenario: 'baseline' | 'draft-order' | 'pending-bill' | 'open-invoice' | 'payment-history',
): Promise<DevScenarioResponse> {
  const accessToken = await loginAsAdmin(request);
  return parseJson<DevScenarioResponse>(await request.post(`${API_BASE_URL}/api/dev/scenarios/${scenario}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }));
}

export async function resetDevState(request: APIRequestContext): Promise<DevResetResponse> {
  const accessToken = await loginAsAdmin(request);
  return parseJson<DevResetResponse>(await request.post(`${API_BASE_URL}/api/dev/reset`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }));
}

export async function seedBaselineScenario(request: APIRequestContext): Promise<DevScenarioResponse> {
  return callDevScenario(request, 'baseline');
}

export async function seedPendingBillScenario(request: APIRequestContext): Promise<DevScenarioResponse> {
  return callDevScenario(request, 'pending-bill');
}

export async function seedOpenInvoiceScenario(request: APIRequestContext): Promise<DevScenarioResponse> {
  return callDevScenario(request, 'open-invoice');
}

export async function seedPaymentHistoryScenario(request: APIRequestContext): Promise<DevScenarioResponse> {
  return callDevScenario(request, 'payment-history');
}

export async function getDemoQrToken(request: APIRequestContext): Promise<string> {
  return (await seedBaselineScenario(request)).qrToken;
}

export async function ensureDemoTableHasDraftOrder(request: APIRequestContext): Promise<void> {
  await callDevScenario(request, 'draft-order');
}

export async function forceVietnameseUi(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
}

export async function loginToStaffDashboard(page: Page) {
  await forceVietnameseUi(page);
  await page.goto('/staff/login', { waitUntil: 'domcontentloaded' });

  const usernameField = page.getByLabel(/Tên đăng nhập|Username/i);
  const passwordField = page.getByLabel(/Mật khẩu|Password/i);
  const openDashboardButton = page.getByRole('button', { name: /mở bảng điều khiển nhân viên|open staff dashboard/i });

  await expect(usernameField).toBeVisible();
  await usernameField.fill('admin');
  await passwordField.fill('Admin@123456');
  await openDashboardButton.click();
  await expect(page.getByText(/Chào mừng bạn quay lại|Welcome back/i)).toBeVisible();
}

export async function openAnyFloorAction(page: Page) {
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
  return workbench;
}

export async function ensureFocusedSessionHasOrder(page: Page) {
  const workbench = page.getByTestId('operations-workbench');
  const orderCode = workbench.getByText(/ORD-/).first();
  const createOrderButton = workbench.getByRole('button', { name: /tạo đơn ăn tại chỗ/i }).first();
  const addItemField = workbench.getByLabel(/thêm món cho đơn/i).first();

  await expect
    .poll(async () => {
      if (await addItemField.isVisible().catch(() => false)) {
        return 'form-ready';
      }

      if (await orderCode.isVisible().catch(() => false)) {
        return 'order-ready';
      }

      if (await createOrderButton.isVisible().catch(() => false)) {
        return 'create-available';
      }

      return 'waiting';
    }, { message: 'expected the focused session to expose an existing order or a create-order action' })
    .not.toBe('waiting');

  if (!(await orderCode.isVisible().catch(() => false))) {
    const latestCreateOrderButton = workbench.getByRole('button', { name: /tạo đơn ăn tại chỗ/i }).first();

    if (await latestCreateOrderButton.isVisible().catch(() => false)) {
      await expect(latestCreateOrderButton).toBeVisible();
      await latestCreateOrderButton.click({ force: true });
    }

    await expect(addItemField).toBeVisible({ timeout: 30_000 });
  }

  return { addItemField, createOrderButton, orderCode, workbench };
}

export function nextReservationDateTimeLocal(): string {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(19, 0, 0, 0);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const hours = String(next.getHours()).padStart(2, '0');
  const minutes = String(next.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

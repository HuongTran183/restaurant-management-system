import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { API_BASE_URL } from './runtime';

type AuthPayload = {
  accessToken: string;
};

type PageResponse<T> = {
  content: T[];
};

type DiningTable = {
  id: number;
  code: string;
  name: string;
};

type TableQr = {
  landingUrl: string;
  token: string;
};

type TableSession = {
  id: number;
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

export async function findDemoTable(request: APIRequestContext, accessToken: string): Promise<DiningTable> {
  const response = await request.get(`${API_BASE_URL}/api/tables?size=20&active=true&query=T-01`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const payload = await parseJson<PageResponse<DiningTable>>(response);
  const table = payload.content[0];

  if (!table) {
    throw new Error('Demo table T-01 was not found');
  }

  return table;
}

export async function getDemoQrToken(request: APIRequestContext): Promise<string> {
  const accessToken = await loginAsAdmin(request);
  const table = await findDemoTable(request, accessToken);
  const qrResponse = await request.get(`${API_BASE_URL}/api/tables/${table.id}/qr`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const qr = await parseJson<TableQr>(qrResponse);
  return qr.token;
}

export async function ensureDemoTableHasDraftOrder(request: APIRequestContext): Promise<void> {
  const accessToken = await loginAsAdmin(request);
  const table = await findDemoTable(request, accessToken);
  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
  };

  const sessionsResponse = await request.get(
    `${API_BASE_URL}/api/table-sessions?diningTableId=${table.id}&status=OPEN&size=20&page=0`,
    { headers: authHeaders },
  );
  const sessionsPage = await parseJson<PageResponse<TableSession>>(sessionsResponse);

  const openSession = sessionsPage.content[0]
    ?? await parseJson<TableSession>(await request.post(`${API_BASE_URL}/api/table-sessions`, {
      headers: authHeaders,
      data: {
        diningTableId: table.id,
      },
    }));

  const ordersResponse = await request.get(
    `${API_BASE_URL}/api/orders?tableSessionId=${openSession.id}&status=DRAFT&size=20&page=0`,
    { headers: authHeaders },
  );
  const ordersPage = await parseJson<PageResponse<{ id: number }>>(ordersResponse);

  if (ordersPage.content.length > 0) {
    return;
  }

  await parseJson(
    await request.post(`${API_BASE_URL}/api/orders`, {
      headers: authHeaders,
      data: {
        orderType: 'DINE_IN',
        tableSessionId: openSession.id,
        note: `e2e outage seed for ${table.code}`,
      },
    }),
  );
}

export async function forceVietnameseUi(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
}

export async function loginToStaffDashboard(page: Page) {
  await forceVietnameseUi(page);
  await page.goto('/staff/login');
  await page.evaluate(() => {
    window.localStorage.setItem('h-restaurant-management-system:lang', 'vi');
  });
  await page.reload();

  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('Admin@123456');
  await page.getByRole('button', { name: /mở bảng điều khiển nhân viên/i }).click();
  await expect(page.getByText(/Chào mừng bạn quay lại/i)).toBeVisible();
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

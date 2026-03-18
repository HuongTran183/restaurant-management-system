import type { APIRequestContext } from '@playwright/test';

const API_BASE_URL = (process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://127.0.0.1:18080').replace(/\/$/, '');

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

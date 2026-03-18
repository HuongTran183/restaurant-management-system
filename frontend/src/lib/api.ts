export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type UserProfile = {
  id: number;
  username: string;
  fullName: string;
  email: string;
  active: boolean;
  roles: string[];
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: UserProfile;
};

export type Category = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  active: boolean;
};

export type MenuItemImage = {
  id: number;
  imageUrl: string;
  altText: string | null;
  primary: boolean;
};

export type MenuItem = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  price: number;
  available: boolean;
  active: boolean;
  categoryId: number;
  categoryName: string;
  images: MenuItemImage[];
};

export type PublicMenu = {
  restaurantName: string;
  categories: Category[];
  items: MenuItem[];
};

export type QrTable = {
  tableId: number;
  tableCode: string;
  tableName: string;
  areaName: string;
  tableStatus: string;
  openTableSessionId: number | null;
  qrToken: string;
  qrActive: boolean;
  qrExpiresAt: string | null;
};

export type OrderItem = {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  note: string | null;
  status: string;
};

export type Order = {
  id: number;
  orderCode: string;
  tableSessionId: number | null;
  customerId: number | null;
  orderType: string;
  sourceChannel: string;
  status: string;
  subtotal: number;
  serviceFee: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentRequested: boolean;
  note: string | null;
  items: OrderItem[];
};

export type Reservation = {
  id: number;
  reservationCode: string;
  customerName: string;
  phone: string;
  email: string | null;
  partySize: number;
  reservationTime: string;
  status: string;
  requestedArea: string | null;
  assignedTableId: number | null;
  assignedTableCode: string | null;
  assignedTableName: string | null;
  note: string | null;
  internalNote: string | null;
  confirmedAt: string | null;
  cancelledAt: string | null;
  checkedInAt: string | null;
  completedAt: string | null;
};

export type ServiceRequest = {
  id: number;
  tableSessionId: number | null;
  orderId: number | null;
  requestType: string;
  note: string | null;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
};

export type Invoice = {
  id: number;
  invoiceNumber: string;
  orderId: number;
  status: string;
  totalAmount: number;
  paidAmount: number;
  issuedAt: string;
  closedAt: string | null;
};

export type Payment = {
  id: number;
  paymentCode: string;
  invoiceId: number;
  method: string;
  status: string;
  amount: number;
  paidAt: string | null;
  note: string | null;
};

export type DashboardData = {
  orders: PageResponse<Order>;
  reservations: PageResponse<Reservation>;
  serviceRequests: PageResponse<ServiceRequest>;
  invoices: PageResponse<Invoice>;
  payments: PageResponse<Payment>;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '');

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload?.detail ?? payload?.title ?? 'Request failed';
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const publicApi = {
  menu: () => request<PublicMenu>('/api/public/menu'),
  qrTable: (token: string) => request<QrTable>(`/api/public/qr/${token}`),
  submitQrOrder: (token: string, payload: { note: string; items: Array<{ menuItemId: number; quantity: number; note?: string }> }) =>
    request<Order>(`/api/public/qr/${token}/orders`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getOrder: (orderCode: string) => request<Order>(`/api/public/orders/${orderCode}`),
  requestService: (token: string, payload: { orderCode?: string; requestType: string; note?: string }) =>
    request<ServiceRequest>(`/api/public/qr/${token}/service-requests`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createReservation: (payload: {
    customerName: string;
    phone: string;
    email?: string;
    partySize: number;
    reservationTime: string;
    requestedArea?: string;
    note?: string;
  }) =>
    request<Reservation>('/api/public/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getReservation: (code: string) => request<Reservation>(`/api/public/reservations/${code}`),
  cancelReservation: (code: string, note: string) =>
    request<Reservation>(`/api/public/reservations/${code}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
};

export const authApi = {
  login: (payload: { username: string; password: string }) =>
    request<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  refresh: (refreshToken: string) =>
    request<AuthSession>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
  me: (token: string) => request<UserProfile>('/api/auth/me', {}, token),
};

export const staffApi = {
  dashboard: async (token: string): Promise<DashboardData> => {
    const [orders, reservations, serviceRequests, invoices, payments] = await Promise.all([
      request<PageResponse<Order>>('/api/orders?size=6', {}, token),
      request<PageResponse<Reservation>>('/api/reservations?size=6', {}, token),
      request<PageResponse<ServiceRequest>>('/api/service-requests?size=6', {}, token),
      request<PageResponse<Invoice>>('/api/invoices?size=6', {}, token),
      request<PageResponse<Payment>>('/api/payments?size=6', {}, token),
    ]);

    return { orders, reservations, serviceRequests, invoices, payments };
  },
};

export { ApiError };


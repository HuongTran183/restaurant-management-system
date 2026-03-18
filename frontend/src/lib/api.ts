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

export type TableStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'LOCKED';
export type TableSessionStatus = 'OPEN' | 'CLOSED';

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
  status: OrderItemStatus;
};

export type Order = {
  id: number;
  orderCode: string;
  tableSessionId: number | null;
  customerId: number | null;
  orderType: OrderType;
  sourceChannel: OrderSourceChannel;
  status: OrderStatus;
  subtotal: number;
  serviceFee: number;
  vatAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentRequested: boolean;
  note: string | null;
  items: OrderItem[];
};

export type OrderItemStatus = 'NEW' | 'CONFIRMED' | 'CANCELLED';
export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type OrderSourceChannel = 'STAFF' | 'QR';
export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export type Reservation = {
  id: number;
  reservationCode: string;
  customerName: string;
  phone: string;
  email: string | null;
  partySize: number;
  reservationTime: string;
  status: ReservationStatus;
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
  requestType: ServiceRequestType;
  note: string | null;
  status: ServiceRequestStatus;
  requestedAt: string;
  resolvedAt: string | null;
};

export type Invoice = {
  id: number;
  invoiceNumber: string;
  orderId: number;
  status: InvoiceStatus;
  totalAmount: number;
  paidAmount: number;
  issuedAt: string;
  closedAt: string | null;
};

export type InvoiceStatus = 'OPEN' | 'PAID' | 'VOID';

export type Payment = {
  id: number;
  paymentCode: string;
  invoiceId: number;
  method: PaymentMethod;
  status: PaymentStatus;
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

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED';
export type ServiceRequestStatus = 'OPEN' | 'RESOLVED' | 'CANCELLED';
export type ServiceRequestType = 'CALL_WAITER' | 'REQUEST_BILL' | 'WATER' | 'OTHER';
export type PaymentStatus = 'COMPLETED' | 'FAILED' | 'PENDING' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'E_WALLET';

export type DiningTable = {
  id: number;
  code: string;
  name: string;
  seatCount: number;
  status: TableStatus;
  active: boolean;
  areaId: number | null;
  areaName: string;
};

export type TableSession = {
  id: number;
  sessionCode: string;
  diningTableId: number;
  tableCode: string;
  tableName: string;
  status: TableSessionStatus;
  openedAt: string;
  closedAt: string | null;
};

type QueryValue = string | number | boolean | null | undefined;

function buildQueryString(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString.length > 0 ? `?${queryString}` : '';
}

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
  requestService: (token: string, payload: { orderCode?: string; requestType: ServiceRequestType; note?: string }) =>
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

function emptyPageResponse<T>(): PageResponse<T> {
  return {
    content: [],
    page: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
  };
}

export const staffApi = {
  dashboard: async (
    token: string,
    capabilities: { canManageFloor: boolean; canManageBilling: boolean },
  ): Promise<DashboardData> => {
    const [orders, reservations, serviceRequests, invoices, payments] = await Promise.all([
      capabilities.canManageFloor
        ? request<PageResponse<Order>>('/api/orders?size=6', {}, token)
        : Promise.resolve(emptyPageResponse<Order>()),
      capabilities.canManageFloor
        ? request<PageResponse<Reservation>>('/api/reservations?size=6', {}, token)
        : Promise.resolve(emptyPageResponse<Reservation>()),
      capabilities.canManageFloor
        ? request<PageResponse<ServiceRequest>>('/api/service-requests?size=6', {}, token)
        : Promise.resolve(emptyPageResponse<ServiceRequest>()),
      capabilities.canManageBilling
        ? request<PageResponse<Invoice>>('/api/invoices?size=6', {}, token)
        : Promise.resolve(emptyPageResponse<Invoice>()),
      capabilities.canManageBilling
        ? request<PageResponse<Payment>>('/api/payments?size=6', {}, token)
        : Promise.resolve(emptyPageResponse<Payment>()),
    ]);

    return { orders, reservations, serviceRequests, invoices, payments };
  },
  orders: (
    token: string,
    params: { page?: number; size?: number; status?: OrderStatus; sourceChannel?: OrderSourceChannel; tableSessionId?: number; query?: string } = {},
  ) =>
    request<PageResponse<Order>>(
      `/api/orders${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        status: params.status,
        sourceChannel: params.sourceChannel,
        tableSessionId: params.tableSessionId,
        query: params.query,
      })}`,
      {},
      token,
    ),
  invoices: (
    token: string,
    params: { page?: number; size?: number; status?: InvoiceStatus; orderId?: number; query?: string } = {},
  ) =>
    request<PageResponse<Invoice>>(
      `/api/invoices${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        status: params.status,
        orderId: params.orderId,
        query: params.query,
      })}`,
      {},
      token,
    ),
  payments: (
    token: string,
    params: { page?: number; size?: number; invoiceId?: number; method?: PaymentMethod; query?: string } = {},
  ) =>
    request<PageResponse<Payment>>(
      `/api/payments${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        invoiceId: params.invoiceId,
        method: params.method,
        query: params.query,
      })}`,
      {},
      token,
    ),
  confirmOrder: (token: string, orderId: number) =>
    request<Order>(
      `/api/orders/${orderId}/confirm`,
      {
        method: 'POST',
      },
      token,
    ),
  cancelOrder: (token: string, orderId: number) =>
    request<Order>(
      `/api/orders/${orderId}/cancel`,
      {
        method: 'POST',
      },
      token,
    ),
  createOrder: (
    token: string,
    payload: { orderType: OrderType; tableSessionId?: number; customerId?: number; note?: string },
  ) =>
    request<Order>(
      '/api/orders',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),
  addOrderItem: (
    token: string,
    orderId: number,
    payload: { menuItemId: number; quantity: number; note?: string },
  ) =>
    request<Order>(
      `/api/orders/${orderId}/items`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),
  updateOrderItem: (
    token: string,
    orderId: number,
    orderItemId: number,
    payload: { quantity?: number; note?: string; cancelled?: boolean },
  ) =>
    request<Order>(
      `/api/orders/${orderId}/items/${orderItemId}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
      },
      token,
    ),
  createInvoice: (token: string, orderId: number) =>
    request<Invoice>(
      '/api/invoices',
      {
        method: 'POST',
        body: JSON.stringify({ orderId }),
      },
      token,
    ),
  recordPayment: (
    token: string,
    payload: { invoiceId: number; amount: number; method: PaymentMethod; note?: string },
  ) =>
    request<Payment>(
      '/api/payments',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),
  reservations: (
    token: string,
    params: { page?: number; size?: number; status?: ReservationStatus; query?: string } = {},
  ) =>
    request<PageResponse<Reservation>>(
      `/api/reservations${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        status: params.status,
        query: params.query,
      })}`,
      {},
      token,
    ),
  serviceRequests: (
    token: string,
    params: { page?: number; size?: number; status?: ServiceRequestStatus; requestType?: ServiceRequestType; query?: string } = {},
  ) =>
    request<PageResponse<ServiceRequest>>(
      `/api/service-requests${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        status: params.status,
        requestType: params.requestType,
        query: params.query,
      })}`,
      {},
      token,
    ),
  tables: (
    token: string,
    params: { page?: number; size?: number; areaId?: number; status?: TableStatus; active?: boolean; query?: string } = {},
  ) =>
    request<PageResponse<DiningTable>>(
      `/api/tables${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        areaId: params.areaId,
        status: params.status,
        active: params.active,
        query: params.query,
      })}`,
      {},
      token,
    ),
  tableSessions: (
    token: string,
    params: { page?: number; size?: number; status?: TableSessionStatus; diningTableId?: number; query?: string } = {},
  ) =>
    request<PageResponse<TableSession>>(
      `/api/table-sessions${buildQueryString({
        page: params.page ?? 0,
        size: params.size ?? 20,
        status: params.status,
        diningTableId: params.diningTableId,
        query: params.query,
      })}`,
      {},
      token,
    ),
  openTableSession: (token: string, diningTableId: number) =>
    request<TableSession>(
      '/api/table-sessions',
      {
        method: 'POST',
        body: JSON.stringify({ diningTableId }),
      },
      token,
    ),
  closeTableSession: (token: string, sessionId: number) =>
    request<TableSession>(
      `/api/table-sessions/${sessionId}/close`,
      {
        method: 'POST',
      },
      token,
    ),
  confirmReservation: (token: string, reservationId: number, payload?: { internalNote?: string }) =>
    request<Reservation>(
      `/api/reservations/${reservationId}/confirm`,
      {
        method: 'POST',
        body: JSON.stringify(payload ?? {}),
      },
      token,
    ),
  checkInReservation: (token: string, reservationId: number, payload: { diningTableId: number; internalNote?: string }) =>
    request<Reservation>(
      `/api/reservations/${reservationId}/check-in`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      token,
    ),
  cancelReservation: (token: string, reservationId: number, payload?: { note?: string }) =>
    request<Reservation>(
      `/api/reservations/${reservationId}/cancel`,
      {
        method: 'POST',
        body: JSON.stringify(payload ?? {}),
      },
      token,
    ),
  completeReservation: (token: string, reservationId: number) =>
    request<Reservation>(
      `/api/reservations/${reservationId}/complete`,
      {
        method: 'POST',
      },
      token,
    ),
  resolveServiceRequest: (token: string, requestId: number) =>
    request<ServiceRequest>(
      `/api/service-requests/${requestId}/resolve`,
      {
        method: 'POST',
      },
      token,
    ),
};

export { ApiError };


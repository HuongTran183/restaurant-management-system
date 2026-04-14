import type { Order, Payment, Reservation } from './api';
import { formatCurrencyVnd } from './currency';

export type DashboardMetricTone = 'forest' | 'ember' | 'sun' | 'slate';

export type DashboardOverviewMetric = {
  id: 'tables-serving' | 'pending-orders' | 'kitchen-items' | 'today-revenue' | 'qr-orders';
  label: string;
  value: string;
  helper: string;
  tone: DashboardMetricTone;
};

export type ReservationAlertSeverity = 'critical' | 'soon' | 'upcoming';

export type ReservationAlert = {
  reservation: Reservation;
  countdownLabel: string;
  minutesUntil: number;
  severity: ReservationAlertSeverity;
  tableLabel: string;
  timeLabel: string;
};

export type QrOrderInsight = {
  attentionLabel: string;
  attentionTone: DashboardMetricTone;
  itemCount: number;
  needsAttention: boolean;
  order: Order;
  pendingItems: number;
  sessionLabel: string;
};

export type ChartDatum = {
  helper?: string;
  label: string;
  tone: DashboardMetricTone;
  value: number;
};

export type RevenueHourPoint = {
  amount: number;
  count: number;
  hour: number;
  isCurrentHour: boolean;
  label: string;
};

const UPCOMING_RESERVATION_WINDOW_MINUTES = 180;
const CRITICAL_RESERVATION_MINUTES = 20;
const SOON_RESERVATION_MINUTES = 60;

export function countPendingOrders(orders: Order[]) {
  return orders.filter((order) => order.status === 'DRAFT' || order.items.some((item) => item.status === 'NEW')).length;
}

export function countKitchenItems(orders: Order[]) {
  return orders.reduce((total, order) => {
    if (order.status === 'CANCELLED') {
      return total;
    }

    return total + order.items
      .filter((item) => item.status === 'NEW')
      .reduce((orderTotal, item) => orderTotal + item.quantity, 0);
  }, 0);
}

export function formatCurrency(value: number) {
  return formatCurrencyVnd(value);
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function getTodayRevenue(payments: Payment[], referenceDate = new Date()) {
  const referenceDay = toLocalDayKey(referenceDate);

  return payments.reduce((total, payment) => {
    if (payment.status !== 'COMPLETED' || !payment.paidAt) {
      return total;
    }

    return toLocalDayKey(payment.paidAt) === referenceDay ? total + payment.amount : total;
  }, 0);
}

export function buildReservationAlerts(
  reservations: Reservation[],
  referenceDate = new Date(),
) {
  const now = referenceDate.getTime();

  return reservations
    .filter((reservation) => reservation.status === 'PENDING' || reservation.status === 'CONFIRMED')
    .map((reservation) => {
      const reservationTime = new Date(reservation.reservationTime).getTime();
      const minutesUntil = Math.round((reservationTime - now) / 60_000);

      return {
        countdownLabel: formatCountdown(minutesUntil),
        minutesUntil,
        reservation,
        severity: getReservationAlertSeverity(minutesUntil),
        tableLabel: formatReservationTableLabel(reservation),
        timeLabel: new Intl.DateTimeFormat('vi-VN', {
          hour: 'numeric',
          minute: '2-digit',
        }).format(new Date(reservation.reservationTime)),
      } satisfies ReservationAlert;
    })
    .filter((alert) => alert.minutesUntil >= -30 && alert.minutesUntil <= UPCOMING_RESERVATION_WINDOW_MINUTES)
    .sort((left, right) => left.minutesUntil - right.minutesUntil);
}

export function buildQrOrderInsights(
  orders: Order[],
  sessionLabelById: Record<number, string>,
) {
  return orders
    .filter((order) => order.sourceChannel === 'QR')
    .map((order) => {
      const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
      const pendingItems = order.items
        .filter((item) => item.status === 'NEW')
        .reduce((total, item) => total + item.quantity, 0);
      const requiresConfirmation = order.status === 'DRAFT' || pendingItems > 0;
      const needsAttention = requiresConfirmation || order.paymentRequested;

      return {
        attentionLabel: requiresConfirmation
          ? 'Chờ xác nhận'
          : order.paymentRequested
            ? 'Khách gọi thanh toán'
            : 'Ổn định',
        attentionTone: requiresConfirmation ? 'ember' : order.paymentRequested ? 'sun' : 'forest',
        itemCount,
        needsAttention,
        order,
        pendingItems,
        sessionLabel: order.tableSessionId === null
          ? 'Đơn tại quầy / không gắn bàn'
          : sessionLabelById[order.tableSessionId] ?? `Ca #${order.tableSessionId}`,
      } satisfies QrOrderInsight;
    })
    .sort((left, right) => {
      const leftWeight = left.needsAttention ? 1 : 0;
      const rightWeight = right.needsAttention ? 1 : 0;
      return rightWeight - leftWeight;
    });
}

export function buildRevenueByHour(
  payments: Payment[],
  referenceDate = new Date(),
) {
  const hours = Array.from({ length: 12 }, (_, index) => index + 10);
  const referenceDay = toLocalDayKey(referenceDate);
  const currentHour = referenceDate.getHours();
  const bucket = new Map<number, { amount: number; count: number }>();

  payments.forEach((payment) => {
    if (payment.status !== 'COMPLETED' || !payment.paidAt) {
      return;
    }

    if (toLocalDayKey(payment.paidAt) !== referenceDay) {
      return;
    }

    const paidAt = new Date(payment.paidAt);
    const hour = paidAt.getHours();
    const current = bucket.get(hour) ?? { amount: 0, count: 0 };
    current.amount += payment.amount;
    current.count += 1;
    bucket.set(hour, current);
  });

  return hours.map((hour) => {
    const point = bucket.get(hour) ?? { amount: 0, count: 0 };

    return {
      amount: point.amount,
      count: point.count,
      hour,
      isCurrentHour: hour === currentHour,
      label: `${String(hour).padStart(2, '0')}:00`,
    } satisfies RevenueHourPoint;
  });
}

export function buildOrderStatusBreakdown(orders: Order[]): ChartDatum[] {
  return [
    {
      helper: 'phiếu đang ở trạng thái nháp',
      label: 'Nháp',
      tone: 'ember',
      value: orders.filter((order) => order.status === 'DRAFT').length,
    },
    {
      helper: 'phiếu đã xác nhận',
      label: 'Đã xác nhận',
      tone: 'forest',
      value: orders.filter((order) => order.status === 'CONFIRMED').length,
    },
    {
      helper: 'phiếu đã thanh toán và đóng',
      label: 'Hoàn tất',
      tone: 'slate',
      value: orders.filter((order) => order.status === 'COMPLETED').length,
    },
    {
      helper: 'phiếu đã hủy',
      label: 'Đã hủy',
      tone: 'sun',
      value: orders.filter((order) => order.status === 'CANCELLED').length,
    },
  ];
}

export function buildKitchenItemBreakdown(orders: Order[]): ChartDatum[] {
  const items = orders.flatMap((order) => order.items);

  return [
    {
      helper: 'món đang chờ xác nhận',
      label: 'Mới',
      tone: 'ember',
      value: items
        .filter((item) => item.status === 'NEW')
        .reduce((total, item) => total + item.quantity, 0),
    },
    {
      helper: 'món đã xác nhận để phục vụ',
      label: 'Đã xác nhận',
      tone: 'forest',
      value: items
        .filter((item) => item.status === 'CONFIRMED')
        .reduce((total, item) => total + item.quantity, 0),
    },
    {
      helper: 'món đã hủy',
      label: 'Đã hủy',
      tone: 'sun',
      value: items
        .filter((item) => item.status === 'CANCELLED')
        .reduce((total, item) => total + item.quantity, 0),
    },
  ];
}

function formatReservationTableLabel(reservation: Reservation) {
  if (reservation.assignedTableCode || reservation.assignedTableName) {
    return [reservation.assignedTableCode, reservation.assignedTableName].filter(Boolean).join(' • ');
  }

  if (reservation.requestedArea) {
    return `Chưa gán • ${reservation.requestedArea}`;
  }

  return 'Bàn chưa gán';
}

function formatCountdown(minutesUntil: number) {
  if (minutesUntil < 0) {
    return `Trễ ${Math.abs(minutesUntil)} phút`;
  }

  if (minutesUntil < 60) {
    return `Còn ${minutesUntil} phút`;
  }

  const hours = Math.floor(minutesUntil / 60);
  const minutes = minutesUntil % 60;
  return minutes === 0 ? `Còn ${hours} giờ` : `Còn ${hours} giờ ${minutes} phút`;
}

function getReservationAlertSeverity(minutesUntil: number): ReservationAlertSeverity {
  if (minutesUntil <= CRITICAL_RESERVATION_MINUTES) {
    return 'critical';
  }

  if (minutesUntil <= SOON_RESERVATION_MINUTES) {
    return 'soon';
  }

  return 'upcoming';
}

function toLocalDayKey(value: Date | string) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

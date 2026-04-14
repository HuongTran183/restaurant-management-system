import { render, screen } from '@testing-library/react';
import { FloorOverview } from './FloorOverview';
import type { DiningTable, Reservation, TableSession } from '../lib/api';

function makeTable(overrides: Partial<DiningTable> = {}): DiningTable {
  return {
    id: 1,
    code: 'T-01',
    name: 'Table 01',
    seatCount: 4,
    status: 'AVAILABLE',
    active: true,
    areaId: 1,
    areaName: 'Demo Hall',
    ...overrides,
  };
}

function makeSession(overrides: Partial<TableSession> = {}): TableSession {
  return {
    id: 10,
    sessionCode: 'SES-001',
    diningTableId: 1,
    tableCode: 'T-01',
    tableName: 'Table 01',
    status: 'OPEN',
    openedAt: '2026-03-18T09:00:00.000Z',
    closedAt: null,
    ...overrides,
  };
}

function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 20,
    reservationCode: 'RES-001',
    customerName: 'Nguyen Van A',
    phone: '0900000000',
    email: null,
    partySize: 2,
    reservationTime: '2026-03-18T12:00:00.000Z',
    status: 'CONFIRMED',
    requestedArea: 'Demo Hall',
    assignedTableId: 1,
    assignedTableCode: 'T-01',
    assignedTableName: 'Table 01',
    note: null,
    internalNote: null,
    confirmedAt: '2026-03-18T08:00:00.000Z',
    cancelledAt: null,
    checkedInAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe('FloorOverview', () => {
  it('shows walk-in controls for a free table with no live session', () => {
    render(<FloorOverview reservations={[]} sessions={[]} tables={[makeTable()]} />);

    expect(screen.getByRole('button', { name: /cho khách vãng lai ngồi/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mở ca/i })).toBeInTheDocument();
  });

  it('shows order and reservation shortcuts when a table is already engaged', () => {
    render(
      <FloorOverview
        reservations={[makeReservation()]}
        sessions={[makeSession()]}
        tables={[makeTable({ status: 'OCCUPIED' })]}
      />,
    );

    expect(screen.getByRole('button', { name: /mở luồng đơn/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mở đặt chỗ/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đóng ca/i })).toBeInTheDocument();
  });
});

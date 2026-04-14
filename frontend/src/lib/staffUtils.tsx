import type { ReactNode } from 'react';
import type {
  AuthSession,
  DiningTable,
  ReservationStatus,
  ServiceRequest,
  ServiceRequestStatus,
  TableSession,
} from './api';
import i18n from '../i18n/i18n';

// ============================================================================
// Status Tone Utilities
// ============================================================================

export function reservationStatusTone(status: ReservationStatus): 'forest' | 'ember' | 'warm' | 'neutral' {
  switch (status) {
    case 'PENDING':
      return 'ember';
    case 'CONFIRMED':
    case 'CHECKED_IN':
      return 'forest';
    case 'COMPLETED':
      return 'neutral';
    case 'CANCELLED':
      return 'warm';
  }
}

export function serviceRequestStatusTone(status: ServiceRequestStatus): 'forest' | 'ember' | 'warm' | 'neutral' {
  switch (status) {
    case 'OPEN':
      return 'ember';
    case 'RESOLVED':
      return 'neutral';
    case 'CANCELLED':
      return 'warm';
  }
}

// ============================================================================
// Label Formatters
// ============================================================================

export function serviceRequestLabel(requestType: ServiceRequest['requestType']): string {
  switch (requestType) {
    case 'CALL_WAITER':
      return i18n.t('Call waiter');
    case 'REQUEST_BILL':
      return i18n.t('Request bill');
    case 'WATER':
      return i18n.t('Water refill');
    case 'OTHER':
      return i18n.t('Other request');
  }
}

export function formatTableLabel(table: DiningTable): string {
  return `${table.code} • ${table.name}`;
}

export function formatTableSessionLabel(session: TableSession): string {
  return `${session.sessionCode} • ${session.tableName}`;
}

// ============================================================================
// UI Components (Small, reusable primitives)
// ============================================================================

export function RoleChip({ role }: { role: AuthSession['user']['roles'][number] }) {
  return (
    <span className="rounded-full border border-ink/10 bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate">
      {role.toLowerCase()}
    </span>
  );
}

export function MiniQueueStat({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-md border border-ink/10 bg-white px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-forest">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{helper}</p>
    </div>
  );
}

export function DataPanel({ children, subtitle, title, testId }: { children: ReactNode; subtitle: string; title: string; testId?: string }) {
  return (
    <section className="panel px-5 py-6" data-testid={testId}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function EmptyMessage({ message }: { message: string }) {
  return <div className="rounded-md border border-dashed border-ink/15 bg-white px-4 py-5 text-sm leading-7 text-slate">{message}</div>;
}

import type { ServiceRequest, TableSession } from '../lib/api';
import { DataPanel, EmptyMessage, serviceRequestLabel, serviceRequestStatusTone, formatTableSessionLabel } from '../lib/staffUtils';
import { ErrorState, InlineError, LoadingState, StatusPill } from '../pages/PagePrimitives';
import { formatDateTime } from '../pages/pageUtils';
import i18n from '../i18n/i18n';

// ============================================================================
// StaffServiceRequestsPanel
// ============================================================================

type StaffServiceRequestsPanelProps = {
  actionError: unknown;
  isLoading: boolean;
  isMutating: boolean;
  onResolve: (requestId: number) => void;
  requests: ServiceRequest[];
  requestsError: unknown;
};

export function StaffServiceRequestsPanel({
  actionError,
  isLoading,
  isMutating,
  onResolve,
  requests,
  requestsError,
}: StaffServiceRequestsPanelProps) {
  return (
    <DataPanel
      testId="service-requests-panel"
      title={i18n.t('Open service requests')}
      subtitle={i18n.t('Resolve waiter calls and bill requests as soon as they land.')}
    >
      {isLoading ? <LoadingState label={i18n.t('Loading service requests')} /> : null}
      {requestsError ? <ErrorState error={requestsError} /> : null}
      {actionError ? (
        <div className="mt-4">
          <InlineError error={actionError} />
        </div>
      ) : null}
      {!isLoading && !requestsError ? (
        <ServiceRequestList isMutating={isMutating} onResolve={onResolve} requests={requests} />
      ) : null}
    </DataPanel>
  );
}

// ============================================================================
// ServiceRequestList
// ============================================================================

function ServiceRequestList({
  isMutating,
  onResolve,
  requests,
}: {
  isMutating: boolean;
  onResolve: (requestId: number) => void;
  requests: ServiceRequest[];
}) {
  if (!requests.length) {
    return <EmptyMessage message={i18n.t('No service requests yet.')} />;
  }

  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <div key={request.id} className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="font-semibold text-ink">{serviceRequestLabel(request.requestType)}</p>
                  <p className="text-sm text-slate">
                    {i18n.t('Order #')} {request.orderId ?? i18n.t('n/a')} • {i18n.t('Session #')} {request.tableSessionId ?? i18n.t('n/a')} •{' '}
                    {formatDateTime(request.requestedAt)}
                  </p>
                </div>
                <StatusPill tone={serviceRequestStatusTone(request.status)}>{i18n.t(request.status)}</StatusPill>
              </div>

              {request.note ? <p className="text-sm leading-7 text-slate">{request.note}</p> : null}
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <button
                className="button-chip-primary"
                disabled={isMutating || request.status !== 'OPEN'}
                onClick={() => onResolve(request.id)}
                title={request.status !== 'OPEN' ? i18n.t('Only open requests can be resolved') : undefined}
                type="button"
              >
                {isMutating ? i18n.t('Resolving...') : i18n.t('Resolve')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// StaffOpenTableSessionsPanel
// ============================================================================

type StaffOpenTableSessionsPanelProps = {
  isLoading: boolean;
  sessions: TableSession[];
  sessionsError: unknown;
};

export function StaffOpenTableSessionsPanel({
  isLoading,
  sessions,
  sessionsError,
}: StaffOpenTableSessionsPanelProps) {
  return (
    <DataPanel
      testId="open-table-sessions-panel"
      title={i18n.t('Open table sessions')}
      subtitle={i18n.t('See which tables already have a live session before seating or check-in.')}
    >
      {isLoading ? <LoadingState label={i18n.t('Loading table sessions')} /> : null}
      {sessionsError ? <ErrorState error={sessionsError} /> : null}
      {!isLoading && !sessionsError ? <TableSessionList sessions={sessions} /> : null}
    </DataPanel>
  );
}

// ============================================================================
// TableSessionList
// ============================================================================

function TableSessionList({ sessions }: { sessions: TableSession[] }) {
  if (!sessions.length) {
    return <EmptyMessage message={i18n.t('No open table sessions yet.')} />;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="data-row">
          <div>
            <p className="font-semibold text-ink">{formatTableSessionLabel(session)}</p>
            <p className="text-sm text-slate">
              {session.tableCode} • {i18n.t(session.status)} • {i18n.t('Opened')} {formatDateTime(session.openedAt)}
            </p>
          </div>
          <StatusPill tone={session.status === 'OPEN' ? 'forest' : 'neutral'}>{i18n.t(session.status)}</StatusPill>
        </div>
      ))}
    </div>
  );
}

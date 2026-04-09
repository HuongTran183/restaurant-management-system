import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import type { AuthSession, ServiceRequest } from '../../lib/api';
import { staffApi, ApiError } from '../../lib/api';
import { ErrorState, LoadingState, EmptyMessage } from '../PagePrimitives';

type AdminRequestsPageProps = {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
};

export function AdminRequestsPage({
  session,
  onLogout,
  onRefreshSession,
}: AdminRequestsPageProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const runStaffRequest = async <T,>(requestFn: (token: string) => Promise<T>): Promise<T> => {
    if (!session) throw new ApiError('Session expired', 401);
    try {
      return await requestFn(session.accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshed = await onRefreshSession(session);
        if (!refreshed) {
          onLogout();
          throw new ApiError('Session expired', 401);
        }
        return requestFn(refreshed.accessToken);
      }
      throw error;
    }
  };

  const requestsQuery = useQuery({
    queryKey: ['admin', 'service-requests', session?.accessToken],
    queryFn: () =>
      runStaffRequest((token) =>
        staffApi.serviceRequests(token, { size: 50, status: 'OPEN' }),
      ),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const resolveRequestMutation = useMutation({
    mutationFn: (requestId: number) =>
      runStaffRequest((token) => staffApi.resolveServiceRequest(token, requestId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'service-requests'] });
    },
  });

  if (requestsQuery.isLoading) return <LoadingState label={t('Loading requests')} />;
  if (requestsQuery.error) return <ErrorState error={requestsQuery.error} />;

  const requests = requestsQuery.data?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-ink">{t('Service Requests')}</h1>
        <p className="mt-1 text-sm text-slate">
          {t('Handle guest service requests and special needs')}
        </p>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <EmptyMessage message={t('No service requests')} />
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onResolve={() => resolveRequestMutation.mutate(req.id)}
              isLoading={resolveRequestMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RequestCard({
  request,
  onResolve,
  isLoading,
}: {
  request: ServiceRequest;
  onResolve: () => void;
  isLoading: boolean;
}) {
  const { t } = useTranslation();

  const typeIcons: Record<string, string> = {
    ASSISTANCE: '🆘',
    MEAL_ISSUE: '🍽️',
    PAYMENT: '💳',
    SPECIAL_REQUEST: '⭐',
  };

  const icon = typeIcons[request.requestType] || '📞';
  const requestedAt = new Date(request.requestedAt);
  const waitTime = Math.round((Date.now() - requestedAt.getTime()) / 60000); // minutes

  return (
    <div className="rounded-lg border-2 border-amber-300/50 bg-amber-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{icon}</span>
            <div>
              <h3 className="font-semibold text-ink">{request.requestType}</h3>
              <p className="text-xs text-slate">
                {waitTime}m ago
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-ink">{request.note}</p>
        </div>

        <button
          onClick={onResolve}
          disabled={isLoading}
          className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-forest/90 disabled:opacity-50"
        >
          {t('Resolved')}
        </button>
      </div>
    </div>
  );
}

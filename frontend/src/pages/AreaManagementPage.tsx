import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ApiError,
  type AuthSession,
  staffApi,
} from '../lib/api';
import { ErrorState, Field, InlineError, LoadingState } from './PagePrimitives';

type Area = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type AreaFormState = {
  code: string;
  name: string;
  description: string;
  active: boolean;
};

function createEmptyForm(): AreaFormState {
  return {
    code: '',
    name: '',
    description: '',
    active: true,
  };
}

export function AreaManagementPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'HIDDEN'>('ALL');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [formState, setFormState] = useState<AreaFormState>(createEmptyForm());

  const userRoles = session?.user.roles ?? [];
  const canViewAreas = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canEditAreas = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');

  const runStaffRequest = async <T,>(requestFn: (token: string) => Promise<T>): Promise<T> => {
    if (!session) {
      throw new ApiError('Session expired. Please sign in again.', 401);
    }

    try {
      return await requestFn(session.accessToken);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        const refreshedSession = await onRefreshSession(session);
        if (!refreshedSession) {
          onLogout();
          throw new ApiError('Session expired. Please sign in again.', 401);
        }

        return requestFn(refreshedSession.accessToken);
      }

      throw error;
    }
  };

  const areasQuery = useQuery({
    queryKey: ['staff', 'area-management', 'areas', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.areas(token, { page: 0, size: 100 })),
    enabled: Boolean(session?.accessToken) && canViewAreas,
    retry: false,
  });

  const areaMutation = useMutation({
    mutationFn: (payload: { mode: 'create' | 'edit'; areaId?: number; form: AreaFormState }) =>
      runStaffRequest((token) => {
        const request = {
          code: payload.form.code.trim().toUpperCase(),
          name: payload.form.name.trim(),
          description: payload.form.description.trim() || undefined,
          active: payload.form.active,
        };

        return payload.mode === 'create'
          ? staffApi.createArea(token, request)
          : staffApi.updateArea(token, payload.areaId!, request);
      }),
    onSuccess: () => {
      setFormMode(null);
      setEditingArea(null);
      setFormState(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['staff', 'area-management', 'areas'] });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: (area: Area) =>
      runStaffRequest((token) =>
        staffApi.updateArea(token, area.id, {
          code: area.code,
          name: area.name,
          description: area.description ?? undefined,
          active: !area.active,
        })),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff', 'area-management', 'areas'] });
    },
  });

  const filteredAreas = useMemo(() => {
    const areas = areasQuery.data?.content ?? [];
    const keyword = search.trim().toLowerCase();

    return areas.filter((area) => {
      if (statusFilter === 'ACTIVE' && !area.active) {
        return false;
      }
      if (statusFilter === 'HIDDEN' && area.active) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [area.code, area.name, area.description].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [areasQuery.data, search, statusFilter]);

  function openCreateForm() {
    setFormMode('create');
    setEditingArea(null);
    setFormState(createEmptyForm());
    areaMutation.reset();
  }

  function openEditForm(area: Area) {
    setFormMode('edit');
    setEditingArea(area);
    setFormState({
      code: area.code,
      name: area.name,
      description: area.description ?? '',
      active: area.active,
    });
    areaMutation.reset();
  }

  function cancelForm() {
    setFormMode(null);
    setEditingArea(null);
    setFormState(createEmptyForm());
    areaMutation.reset();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formState.code.trim() || !formState.name.trim()) {
      return;
    }

    areaMutation.mutate({
      mode: formMode === 'edit' ? 'edit' : 'create',
      areaId: editingArea?.id,
      form: formState,
    });
  }

  if (!session) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('Please sign in to continue')} />
      </div>
    );
  }

  if (!canViewAreas) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  const isLoading = areasQuery.isLoading;
  const hasError = areasQuery.isError;

  return (
    <div className="min-h-screen bg-mesh text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/staff" className="text-sm text-slate hover:text-forest">
              ← {t('Back to Dashboard')}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate">{session.user.fullName}</span>
            <button onClick={onLogout} className="text-sm text-ember hover:underline">
              {t('Sign out')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold">{t('Area Management')}</h1>
            <p className="mt-2 text-slate">{t('Manage dining areas and zones')}</p>
          </div>
          {canEditAreas && (
            <button
              onClick={openCreateForm}
              disabled={formMode !== null}
              className="button-primary"
            >
              {t('Add Area')}
            </button>
          )}
        </div>

        {formMode && (
          <div className="panel mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {formMode === 'create' ? t('Create New Area') : t('Edit Area')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Area Code')} required>
                  <input
                    type="text"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    placeholder="VIP-01"
                    required
                    minLength={2}
                    maxLength={40}
                    className="field"
                    disabled={areaMutation.isPending}
                  />
                </Field>

                <Field label={t('Area Name')} required>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder={t('VIP Hall')}
                    required
                    minLength={2}
                    maxLength={120}
                    className="field"
                    disabled={areaMutation.isPending}
                  />
                </Field>
              </div>

              <Field label={t('Description')}>
                <textarea
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder={t('Description (optional)')}
                  rows={3}
                  maxLength={255}
                  className="field"
                  disabled={areaMutation.isPending}
                />
              </Field>

              <Field label={t('Status')}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                    disabled={areaMutation.isPending}
                  />
                  <span>{t('Active')}</span>
                </label>
              </Field>

              {areaMutation.isError && (
                <InlineError
                  message={
                    areaMutation.error instanceof ApiError
                      ? areaMutation.error.message
                      : t('Failed to save area. Please try again.')
                  }
                />
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={areaMutation.isPending}
                  className="button-primary"
                >
                  {areaMutation.isPending ? t('Saving...') : t('Save Area')}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={areaMutation.isPending}
                  className="button-secondary"
                >
                  {t('Cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="panel p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search areas...')}
              className="field flex-1"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'HIDDEN')}
              className="field"
            >
              <option value="ALL">{t('All Areas')}</option>
              <option value="ACTIVE">{t('Active Only')}</option>
              <option value="HIDDEN">{t('Hidden Only')}</option>
            </select>
          </div>

          {isLoading && <LoadingState message={t('Loading areas...')} />}

          {hasError && (
            <ErrorState
              message={
                areasQuery.error instanceof ApiError
                  ? areasQuery.error.message
                  : t('Failed to load areas')
              }
            />
          )}

          {!isLoading && !hasError && filteredAreas.length === 0 && (
            <div className="py-12 text-center text-slate">
              {search ? t('No areas match your search') : t('No areas yet. Create one to get started.')}
            </div>
          )}

          {!isLoading && !hasError && filteredAreas.length > 0 && (
            <div className="space-y-3">
              {filteredAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-forest/10 px-2 py-1 font-mono text-sm font-semibold text-forest">
                        {area.code}
                      </span>
                      <h3 className="font-semibold">{area.name}</h3>
                      {!area.active && (
                        <span className="rounded bg-slate/20 px-2 py-1 text-xs text-slate">
                          {t('Hidden')}
                        </span>
                      )}
                    </div>
                    {area.description && (
                      <p className="mt-1 text-sm text-slate">{area.description}</p>
                    )}
                  </div>

                  {canEditAreas && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(area)}
                        disabled={formMode !== null || visibilityMutation.isPending}
                        className="rounded px-3 py-1 text-sm font-medium text-forest hover:bg-forest/10"
                      >
                        {t('Edit')}
                      </button>
                      <button
                        onClick={() => visibilityMutation.mutate(area)}
                        disabled={formMode !== null || visibilityMutation.isPending}
                        className="rounded px-3 py-1 text-sm font-medium text-slate hover:bg-slate/10"
                      >
                        {area.active ? t('Hide') : t('Show')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ApiError,
  type AuthSession,
  type DiningTable,
  type TableStatus,
  staffApi,
} from '../lib/api';
import { ErrorState, Field, InlineError, LoadingState } from './PagePrimitives';

type TableFormState = {
  code: string;
  name: string;
  seatCount: string;
  areaId: string;
  status: TableStatus;
  active: boolean;
};

function createEmptyForm(): TableFormState {
  return {
    code: '',
    name: '',
    seatCount: '4',
    areaId: '',
    status: 'AVAILABLE',
    active: true,
  };
}

export function TableManagementPage({
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
  const [areaFilter, setAreaFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [formState, setFormState] = useState<TableFormState>(createEmptyForm());

  const userRoles = session?.user.roles ?? [];
  const canViewTables = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canEditTables = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');

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

  const tablesQuery = useQuery({
    queryKey: ['staff', 'table-management', 'tables', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.tables(token, { page: 0, size: 200 })),
    enabled: Boolean(session?.accessToken) && canViewTables,
    retry: false,
  });

  const areasQuery = useQuery({
    queryKey: ['staff', 'table-management', 'areas', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.areas(token, { page: 0, size: 100 })),
    enabled: Boolean(session?.accessToken) && canViewTables,
    retry: false,
  });

  const tableMutation = useMutation({
    mutationFn: (payload: { mode: 'create' | 'edit'; tableId?: number; form: TableFormState }) =>
      runStaffRequest((token) => {
        const request = {
          code: payload.form.code.trim().toUpperCase(),
          name: payload.form.name.trim(),
          seatCount: Number(payload.form.seatCount),
          areaId: Number(payload.form.areaId),
          status: payload.form.status,
          active: payload.form.active,
        };

        return payload.mode === 'create'
          ? staffApi.createTable(token, request)
          : staffApi.updateTable(token, payload.tableId!, request);
      }),
    onSuccess: () => {
      setFormMode(null);
      setEditingTable(null);
      setFormState(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['staff', 'table-management', 'tables'] });
    },
  });

  const filteredTables = useMemo(() => {
    const tables = tablesQuery.data?.content ?? [];
    const keyword = search.trim().toLowerCase();

    return tables.filter((table) => {
      if (areaFilter !== 'ALL' && String(table.areaId) !== areaFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && table.status !== statusFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [table.code, table.name, table.areaName].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(keyword);
    });
  }, [tablesQuery.data, search, areaFilter, statusFilter]);

  function openCreateForm() {
    const areas = areasQuery.data?.content ?? [];
    const firstAreaId = areas.length > 0 ? String(areas[0].id) : '';
    
    setFormMode('create');
    setEditingTable(null);
    setFormState({
      ...createEmptyForm(),
      areaId: firstAreaId,
    });
    tableMutation.reset();
  }

  function openEditForm(table: DiningTable) {
    setFormMode('edit');
    setEditingTable(table);
    setFormState({
      code: table.code,
      name: table.name,
      seatCount: String(table.seatCount),
      areaId: table.areaId ? String(table.areaId) : '',
      status: table.status,
      active: table.active,
    });
    tableMutation.reset();
  }

  function cancelForm() {
    setFormMode(null);
    setEditingTable(null);
    setFormState(createEmptyForm());
    tableMutation.reset();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formState.code.trim() || !formState.name.trim() || !formState.areaId) {
      return;
    }

    tableMutation.mutate({
      mode: formMode === 'edit' ? 'edit' : 'create',
      tableId: editingTable?.id,
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

  if (!canViewTables) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  const isLoading = tablesQuery.isLoading || areasQuery.isLoading;
  const hasError = tablesQuery.isError || areasQuery.isError;
  const areas = areasQuery.data?.content ?? [];

  const tableStatusOptions: TableStatus[] = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'LOCKED'];

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
            <h1 className="font-display text-4xl font-bold">{t('Table Management')}</h1>
            <p className="mt-2 text-slate">{t('Manage dining tables and seating')}</p>
          </div>
          {canEditTables && (
            <button
              onClick={openCreateForm}
              disabled={formMode !== null || areas.length === 0}
              className="button-primary"
              title={areas.length === 0 ? t('Create an area first') : ''}
            >
              {t('Add Table')}
            </button>
          )}
        </div>

        {areas.length === 0 && !areasQuery.isLoading && (
          <div className="panel mb-6 p-6">
            <p className="text-center text-slate">
              {t('No areas available. Please create an area first.')}{' '}
              <Link to="/staff/areas" className="text-forest underline">
                {t('Go to Areas')}
              </Link>
            </p>
          </div>
        )}

        {formMode && (
          <div className="panel mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {formMode === 'create' ? t('Create New Table') : t('Edit Table')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Table Code')} required>
                  <input
                    type="text"
                    value={formState.code}
                    onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                    placeholder="T-01"
                    required
                    minLength={2}
                    maxLength={40}
                    className="field"
                    disabled={tableMutation.isPending}
                  />
                </Field>

                <Field label={t('Table Name')} required>
                  <input
                    type="text"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                    placeholder={t('Table 1')}
                    required
                    minLength={2}
                    maxLength={120}
                    className="field"
                    disabled={tableMutation.isPending}
                  />
                </Field>

                <Field label={t('Seat Count')} required>
                  <input
                    type="number"
                    value={formState.seatCount}
                    onChange={(e) => setFormState({ ...formState, seatCount: e.target.value })}
                    required
                    min={1}
                    max={50}
                    className="field"
                    disabled={tableMutation.isPending}
                  />
                </Field>

                <Field label={t('Area')} required>
                  <select
                    value={formState.areaId}
                    onChange={(e) => setFormState({ ...formState, areaId: e.target.value })}
                    required
                    className="field"
                    disabled={tableMutation.isPending}
                  >
                    <option value="">{t('Select area...')}</option>
                    {areas.filter(a => a.active).map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name} ({area.code})
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('Status')} required>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as TableStatus })}
                    required
                    className="field"
                    disabled={tableMutation.isPending}
                  >
                    {tableStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {t(status)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={t('Active Status')}>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formState.active}
                      onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                      disabled={tableMutation.isPending}
                    />
                    <span>{t('Active')}</span>
                  </label>
                </Field>
              </div>

              {tableMutation.isError && (
                <InlineError
                  message={
                    tableMutation.error instanceof ApiError
                      ? tableMutation.error.message
                      : t('Failed to save table. Please try again.')
                  }
                />
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={tableMutation.isPending}
                  className="button-primary"
                >
                  {tableMutation.isPending ? t('Saving...') : t('Save Table')}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={tableMutation.isPending}
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
              placeholder={t('Search tables...')}
              className="field flex-1"
            />

            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="field"
            >
              <option value="ALL">{t('All Areas')}</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="field"
            >
              <option value="ALL">{t('All Status')}</option>
              {tableStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {t(status)}
                </option>
              ))}
            </select>
          </div>

          {isLoading && <LoadingState message={t('Loading tables...')} />}

          {hasError && (
            <ErrorState
              message={
                tablesQuery.error instanceof ApiError
                  ? tablesQuery.error.message
                  : t('Failed to load tables')
              }
            />
          )}

          {!isLoading && !hasError && filteredTables.length === 0 && (
            <div className="py-12 text-center text-slate">
              {search || areaFilter !== 'ALL' || statusFilter !== 'ALL'
                ? t('No tables match your filters')
                : t('No tables yet. Create one to get started.')}
            </div>
          )}

          {!isLoading && !hasError && filteredTables.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredTables.map((table) => (
                <div
                  key={table.id}
                  className="flex flex-col rounded-lg border border-ink/10 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-forest/10 px-2 py-1 font-mono text-sm font-semibold text-forest">
                          {table.code}
                        </span>
                        {!table.active && (
                          <span className="rounded bg-slate/20 px-2 py-1 text-xs text-slate">
                            {t('Inactive')}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold">{table.name}</h3>
                      <p className="text-sm text-slate">{table.areaName}</p>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <span className="text-slate">{table.seatCount} {t('seats')}</span>
                        <span>•</span>
                        <span className={
                          table.status === 'AVAILABLE' ? 'text-green-600' :
                          table.status === 'OCCUPIED' ? 'text-ember' :
                          table.status === 'RESERVED' ? 'text-sun' :
                          'text-slate'
                        }>
                          {t(table.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-ink/10 pt-3">
                    <Link
                      className="flex-1 rounded px-3 py-1 text-center text-sm font-medium text-forest hover:bg-forest/10"
                      to={`/staff/tables/${table.id}/qr`}
                    >
                      {t('QR')}
                    </Link>
                    {canEditTables ? (
                      <button
                        onClick={() => openEditForm(table)}
                        disabled={formMode !== null}
                        className="flex-1 rounded px-3 py-1 text-sm font-medium text-forest hover:bg-forest/10"
                      >
                        {t('Edit')}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

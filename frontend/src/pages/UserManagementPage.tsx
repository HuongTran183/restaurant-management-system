import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ApiError,
  type AuthSession,
  type UserProfile,
  staffApi,
} from '../lib/api';
import { ErrorState, Field, InlineError, LoadingState } from './PagePrimitives';

type UserFormState = {
  username: string;
  password: string;
  fullName: string;
  email: string;
  active: boolean;
  roles: string[];
};

function createEmptyForm(): UserFormState {
  return {
    username: '',
    password: '',
    fullName: '',
    email: '',
    active: true,
    roles: ['WAITER'],
  };
}

const AVAILABLE_ROLES = [
  { value: 'ADMIN', label: 'Administrator', color: 'text-ember bg-ember/10' },
  { value: 'MANAGER', label: 'Manager', color: 'text-sun bg-sun/10' },
  { value: 'WAITER', label: 'Waiter', color: 'text-forest bg-forest/10' },
  { value: 'CASHIER', label: 'Cashier', color: 'text-slate bg-slate/10' },
];

export function UserManagementPage({
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
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formState, setFormState] = useState<UserFormState>(createEmptyForm());
  const [showPassword, setShowPassword] = useState(false);

  const userRoles = session?.user.roles ?? [];
  const canViewUsers = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');
  const canEditUsers = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');

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

  const usersQuery = useQuery({
    queryKey: ['staff', 'user-management', 'users', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.users(token, { page: 0, size: 100 })),
    enabled: Boolean(session?.accessToken) && canViewUsers,
    retry: false,
  });

  const userMutation = useMutation({
    mutationFn: (payload: { mode: 'create' | 'edit'; userId?: number; form: UserFormState }) =>
      runStaffRequest((token) => {
        const request: any = {
          username: payload.form.username.trim(),
          fullName: payload.form.fullName.trim(),
          email: payload.form.email.trim(),
          active: payload.form.active,
          roles: payload.form.roles,
        };

        if (payload.mode === 'create') {
          request.password = payload.form.password;
          return staffApi.createUser(token, request);
        } else {
          // For edit, only include password if it's not empty
          if (payload.form.password.trim()) {
            request.password = payload.form.password;
          }
          return staffApi.updateUser(token, payload.userId!, request);
        }
      }),
    onSuccess: () => {
      setFormMode(null);
      setEditingUser(null);
      setFormState(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['staff', 'user-management', 'users'] });
    },
  });

  const filteredUsers = useMemo(() => {
    const users = usersQuery.data?.content ?? [];
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      if (statusFilter === 'ACTIVE' && !user.active) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && user.active) {
        return false;
      }
      if (roleFilter !== 'ALL' && !user.roles.includes(roleFilter)) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [user.username, user.fullName, user.email, ...user.roles]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [usersQuery.data, search, statusFilter, roleFilter]);

  function openCreateForm() {
    setFormMode('create');
    setEditingUser(null);
    setFormState(createEmptyForm());
    setShowPassword(false);
    userMutation.reset();
  }

  function openEditForm(user: UserProfile) {
    setFormMode('edit');
    setEditingUser(user);
    setFormState({
      username: user.username,
      password: '', // Don't pre-fill password for security
      fullName: user.fullName,
      email: user.email,
      active: user.active,
      roles: user.roles,
    });
    setShowPassword(false);
    userMutation.reset();
  }

  function cancelForm() {
    setFormMode(null);
    setEditingUser(null);
    setFormState(createEmptyForm());
    setShowPassword(false);
    userMutation.reset();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formState.username.trim() || !formState.fullName.trim() || !formState.email.trim()) {
      return;
    }

    // Password is required for create, optional for edit
    if (formMode === 'create' && !formState.password.trim()) {
      return;
    }

    if (formState.roles.length === 0) {
      return;
    }

    userMutation.mutate({
      mode: formMode === 'edit' ? 'edit' : 'create',
      userId: editingUser?.id,
      form: formState,
    });
  }

  function toggleRole(role: string) {
    const hasRole = formState.roles.includes(role);
    if (hasRole) {
      setFormState({
        ...formState,
        roles: formState.roles.filter((r) => r !== role),
      });
    } else {
      setFormState({
        ...formState,
        roles: [...formState.roles, role],
      });
    }
  }

  function validatePassword(password: string): string | null {
    if (!password) return null;
    if (password.length < 8) {
      return t('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      return t('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      return t('Password must contain at least one number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return t('Password must contain at least one special character');
    }
    return null;
  }

  const passwordError = formMode === 'create' ? validatePassword(formState.password) : null;

  if (!session) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('Please sign in to continue')} />
      </div>
    );
  }

  if (!canViewUsers) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  const isLoading = usersQuery.isLoading;
  const hasError = usersQuery.isError;

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
            <h1 className="font-display text-4xl font-bold">{t('User Management')}</h1>
            <p className="mt-2 text-slate">{t('Manage staff accounts and permissions')}</p>
          </div>
          {canEditUsers && (
            <button onClick={openCreateForm} disabled={formMode !== null} className="button-primary">
              {t('Add User')}
            </button>
          )}
        </div>

        {formMode && (
          <div className="panel mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {formMode === 'create' ? t('Create New User') : t('Edit User')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Username')} required>
                  <input
                    type="text"
                    value={formState.username}
                    onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                    placeholder="john.doe"
                    required
                    minLength={3}
                    maxLength={80}
                    className="field"
                    disabled={userMutation.isPending || formMode === 'edit'}
                  />
                  {formMode === 'edit' && (
                    <p className="mt-1 text-xs text-slate">{t('Username cannot be changed')}</p>
                  )}
                </Field>

                <Field label={t('Full Name')} required>
                  <input
                    type="text"
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    placeholder={t('John Doe')}
                    required
                    minLength={2}
                    maxLength={120}
                    className="field"
                    disabled={userMutation.isPending}
                  />
                </Field>
              </div>

              <Field label={t('Email')} required>
                <input
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  placeholder="john.doe@restaurant.com"
                  required
                  maxLength={160}
                  className="field"
                  disabled={userMutation.isPending}
                />
              </Field>

              <Field
                label={formMode === 'create' ? t('Password') : t('Password (leave empty to keep current)')}
                required={formMode === 'create'}
              >
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formState.password}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    placeholder={formMode === 'create' ? t('Minimum 8 characters') : t('Optional - leave empty')}
                    required={formMode === 'create'}
                    minLength={8}
                    className="field pr-24"
                    disabled={userMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate hover:text-forest"
                  >
                    {showPassword ? t('Hide') : t('Show')}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-sm text-ember">{passwordError}</p>}
                {formMode === 'create' && !passwordError && formState.password && (
                  <p className="mt-1 text-xs text-slate">
                    {t('✓ Strong password')}
                  </p>
                )}
              </Field>

              <Field label={t('Roles')} required>
                <div className="grid gap-2 sm:grid-cols-2">
                  {AVAILABLE_ROLES.map((role) => (
                    <label key={role.value} className="flex items-center gap-2 rounded border border-ink/10 p-3 hover:bg-white/50">
                      <input
                        type="checkbox"
                        checked={formState.roles.includes(role.value)}
                        onChange={() => toggleRole(role.value)}
                        disabled={userMutation.isPending}
                      />
                      <span className={`rounded px-2 py-1 text-sm font-medium ${role.color}`}>
                        {t(role.label)}
                      </span>
                    </label>
                  ))}
                </div>
                {formState.roles.length === 0 && (
                  <p className="mt-1 text-sm text-ember">{t('Select at least one role')}</p>
                )}
              </Field>

              <Field label={t('Status')}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                    disabled={userMutation.isPending}
                  />
                  <span>{t('Active')}</span>
                </label>
              </Field>

              {userMutation.isError && (
                <InlineError
                  message={
                    userMutation.error instanceof ApiError
                      ? userMutation.error.message
                      : t('Failed to save user. Please try again.')
                  }
                />
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={userMutation.isPending || (formMode === 'create' && !!passwordError)}
                  className="button-primary"
                >
                  {userMutation.isPending ? t('Saving...') : t('Save User')}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={userMutation.isPending}
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
              placeholder={t('Search users...')}
              className="field flex-1"
            />

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="field"
            >
              <option value="ALL">{t('All Roles')}</option>
              {AVAILABLE_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(role.label)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="field"
            >
              <option value="ALL">{t('All Users')}</option>
              <option value="ACTIVE">{t('Active Only')}</option>
              <option value="INACTIVE">{t('Inactive Only')}</option>
            </select>
          </div>

          {isLoading && <LoadingState message={t('Loading users...')} />}

          {hasError && (
            <ErrorState
              message={
                usersQuery.error instanceof ApiError ? usersQuery.error.message : t('Failed to load users')
              }
            />
          )}

          {!isLoading && !hasError && filteredUsers.length === 0 && (
            <div className="py-12 text-center text-slate">
              {search || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                ? t('No users match your filters')
                : t('No users yet. Create one to get started.')}
            </div>
          )}

          {!isLoading && !hasError && filteredUsers.length > 0 && (
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-forest/10 px-2 py-1 font-mono text-sm font-semibold text-forest">
                        {user.username}
                      </span>
                      {!user.active && (
                        <span className="rounded bg-slate/20 px-2 py-1 text-xs text-slate">
                          {t('Inactive')}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 font-semibold">{user.fullName}</h3>
                    <p className="text-sm text-slate">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.roles.map((roleCode) => {
                        const roleInfo = AVAILABLE_ROLES.find((r) => r.value === roleCode);
                        return (
                          <span
                            key={roleCode}
                            className={`rounded px-2 py-1 text-xs font-medium ${roleInfo?.color ?? 'text-slate bg-slate/10'}`}
                          >
                            {t(roleInfo?.label ?? roleCode)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {canEditUsers && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(user)}
                        disabled={formMode !== null}
                        className="rounded px-3 py-1 text-sm font-medium text-forest hover:bg-forest/10"
                      >
                        {t('Edit')}
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

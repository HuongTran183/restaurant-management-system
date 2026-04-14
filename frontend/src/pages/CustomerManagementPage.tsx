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

type Customer = {
  id: number;
  code: string;
  fullName: string;
  phone: string;
  email: string;
  active: boolean;
};

type CustomerFormState = {
  fullName: string;
  phone: string;
  email: string;
  active: boolean;
};

function createEmptyForm(): CustomerFormState {
  return {
    fullName: '',
    phone: '',
    email: '',
    active: true,
  };
}

export function CustomerManagementPage({
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
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formState, setFormState] = useState<CustomerFormState>(createEmptyForm());

  const userRoles = session?.user.roles ?? [];
  const canViewCustomers = userRoles.some((role) => ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'].includes(role));
  const canEditCustomers = userRoles.some((role) => ['ADMIN', 'MANAGER', 'WAITER'].includes(role));

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

  const customersQuery = useQuery({
    queryKey: ['staff', 'customer-management', 'customers', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.customers(token, { page: 0, size: 100 })),
    enabled: Boolean(session?.accessToken) && canViewCustomers,
    retry: false,
  });

  const customerMutation = useMutation({
    mutationFn: (payload: { mode: 'create' | 'edit'; customerId?: number; form: CustomerFormState }) =>
      runStaffRequest((token) => {
        if (payload.mode === 'create') {
          return staffApi.createCustomer(token, payload.form);
        } else {
          return staffApi.updateCustomer(token, payload.customerId!, payload.form);
        }
      }),
    onSuccess: () => {
      setFormMode(null);
      setEditingCustomer(null);
      setFormState(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['staff', 'customer-management', 'customers'] });
    },
  });

  const filteredCustomers = useMemo(() => {
    const customers = customersQuery.data?.content ?? [];
    const keyword = search.trim().toLowerCase();

    return customers.filter((customer) => {
      if (statusFilter === 'ACTIVE' && !customer.active) {
        return false;
      }
      if (statusFilter === 'INACTIVE' && customer.active) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      const haystack = [customer.fullName, customer.phone, customer.email, customer.code]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [customersQuery.data, search, statusFilter]);

  function openCreateForm() {
    setFormMode('create');
    setEditingCustomer(null);
    setFormState(createEmptyForm());
    customerMutation.reset();
  }

  function openEditForm(customer: Customer) {
    setFormMode('edit');
    setEditingCustomer(customer);
    setFormState({
      fullName: customer.fullName,
      phone: customer.phone,
      email: customer.email,
      active: customer.active,
    });
    customerMutation.reset();
  }

  function cancelForm() {
    setFormMode(null);
    setEditingCustomer(null);
    setFormState(createEmptyForm());
    customerMutation.reset();
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!formState.fullName.trim() || !formState.phone.trim() || !formState.email.trim()) {
      return;
    }

    customerMutation.mutate({
      mode: formMode === 'edit' ? 'edit' : 'create',
      customerId: editingCustomer?.id,
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

  if (!canViewCustomers) {
    return (
      <div className="panel px-6 py-8">
        <ErrorState message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  const isLoading = customersQuery.isLoading;
  const hasError = customersQuery.isError;

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
            <h1 className="font-display text-4xl font-bold">{t('Customer Management')}</h1>
            <p className="mt-2 text-slate">{t('Manage customer profiles and contact information')}</p>
          </div>
          {canEditCustomers && (
            <button onClick={openCreateForm} disabled={formMode !== null} className="button-primary">
              {t('Add Customer')}
            </button>
          )}
        </div>

        {formMode && (
          <div className="panel mb-6 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              {formMode === 'create' ? t('Create New Customer') : t('Edit Customer')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={customerMutation.isPending}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t('Phone Number')} required>
                  <input
                    type="tel"
                    value={formState.phone}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="+84 123 456 789"
                    required
                    minLength={8}
                    maxLength={20}
                    className="field"
                    disabled={customerMutation.isPending}
                  />
                </Field>

                <Field label={t('Email')} required>
                  <input
                    type="email"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="customer@example.com"
                    required
                    maxLength={160}
                    className="field"
                    disabled={customerMutation.isPending}
                  />
                </Field>
              </div>

              <Field label={t('Status')}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formState.active}
                    onChange={(e) => setFormState({ ...formState, active: e.target.checked })}
                    disabled={customerMutation.isPending}
                  />
                  <span>{t('Active')}</span>
                </label>
              </Field>

              {customerMutation.isError && (
                <InlineError
                  message={
                    customerMutation.error instanceof ApiError
                      ? customerMutation.error.message
                      : t('Failed to save customer. Please try again.')
                  }
                />
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={customerMutation.isPending}
                  className="button-primary"
                >
                  {customerMutation.isPending ? t('Saving...') : t('Save Customer')}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  disabled={customerMutation.isPending}
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
              placeholder={t('Search by name, phone, or email...')}
              className="field flex-1"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="field"
            >
              <option value="ALL">{t('All Customers')}</option>
              <option value="ACTIVE">{t('Active Only')}</option>
              <option value="INACTIVE">{t('Inactive Only')}</option>
            </select>
          </div>

          {isLoading && <LoadingState message={t('Loading customers...')} />}

          {hasError && (
            <ErrorState
              message={
                customersQuery.error instanceof ApiError ? customersQuery.error.message : t('Failed to load customers')
              }
            />
          )}

          {!isLoading && !hasError && filteredCustomers.length === 0 && (
            <div className="py-12 text-center text-slate">
              {search || statusFilter !== 'ALL'
                ? t('No customers match your filters')
                : t('No customers yet. Create one to get started.')}
            </div>
          )}

          {!isLoading && !hasError && filteredCustomers.length > 0 && (
            <div className="space-y-3">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border border-ink/10 bg-white p-4 transition hover:shadow-md"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-forest/10 px-2 py-1 font-mono text-sm font-semibold text-forest">
                        {customer.code}
                      </span>
                      {!customer.active && (
                        <span className="rounded bg-slate/20 px-2 py-1 text-xs text-slate">
                          {t('Inactive')}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold">{customer.fullName}</h3>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate">
                      <span>📞 {customer.phone}</span>
                      <span>✉️ {customer.email}</span>
                    </div>
                  </div>

                  {canEditCustomers && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditForm(customer)}
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

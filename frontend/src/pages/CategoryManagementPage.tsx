import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ApiError,
  type AuthSession,
  type Category,
  staffApi,
} from '../lib/api';
import { ErrorState, InlineError, LoadingState } from './PagePrimitives';
import { Button, Modal, ModalBody, ModalFooter } from '../components/ui';
import { FormField, FormGrid, Input, Textarea, Checkbox } from '../components/ui';

const CATEGORY_PREVIEW_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDx-U359Ht-KWnRXTwapHU1apNPYJNDbvLB5UdAb4ejtoPiD_ECP5IUJ7jjd-AE7QBSUPLoGSonsbRpJHHGxBkRJwDMMgXUnfHI6Wl8afXgNkgfAYjctnSJwThANNEtUwrrQ_yMldYv8Cw0Jl1KDmtwQE0ClfsTwQhVPvC3m2heOLjf9bOeFn3AbRYybLjMqvNN9eMWwO2L28jDOfBjqhha-9fdDsCk0Uwh1jpmf62NWcGDnpQXcgNQPEZnyoODyJZgOxlYfsvtSYA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB53QYCh_1x-zxfDFPe_v7gSH1DtZIumpyjKEp5VtTltZfCvSOvJDOXQ0rDqXRhnxr9NqZTLPZNJJVKXVghyYCWI-rMOnNa0XoxrFfPSVyN0mpEVLsKOp_cXcUJj1zss0nVb4C_LSYFmtYrjLpqJQyyluF2Dsvjo2pxop_jl8IV1L2S864etoMWgDFHkZA9eEYhazrBkeQ8oPIXUhcCEJXgA68i61ZrkSQHcje7KU0USmByMZu_-7s0HBTju-4YT1IU4l73uzZC9yA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDmDvfabw3YrX09Ejzw92wnQzn026Lrq195awzjplD82QsFKmjYJZyXGRTtFxOSfNQiIrSCOokJY0KcLFzjJI6cez7Rxq46gJHSUyQNPVFTXk86sO_g6bBOqeL8Bk0rIVEWlJZkKy37FmKHoKJopbcu2v_qrXiofFSvj42UmEFl4zToSyRaE4Zo2tpOxaoE2u9ZeA4zfBrDnLrY3NFXdqcgIuE7F_Y5E9AbhZMvZywBuUTsks78VTYBpFXaR8MR6vI9CJO5asN7zrU',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAG9jWx7wLk_SKpUerz7MFsupeF6oqAi6J6MjpjQKjVnaseDR6Q8PQ8BCvLcdmo-7g_zHVwAReGYAoGfkfZWEYDjac7XBZlbXEYlK1jU1jikMI64-PMBWp9kY9i6I_VEk22TnrZqokQ6X8hrpvZEPvYEIbdm3pW2149D-p-1tvneH2p1TXVm4OJkNI7hNgAApKkk0i74tO99696z8-Itwyl6h8TEv7gnu3DADKoolPoAPgQDqRvLt-RdwfgouVtrVwlEf5RRvKazlA',
];

type CategoryFormState = {
  code: string;
  name: string;
  description: string;
  sortOrder: string;
  active: boolean;
};

function createEmptyForm(): CategoryFormState {
  return {
    code: '',
    name: '',
    description: '',
    sortOrder: '0',
    active: true,
  };
}

export function CategoryManagementPage({
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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>(createEmptyForm());

  const userRoles = session?.user.roles ?? [];
  const canViewCategories = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canEditCategories = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');

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

  const loadAllPages = async <T,>(
    requestPage: (token: string, page: number, size: number) => Promise<{ content: T[]; totalPages: number }>,
    pageSize = 100,
  ): Promise<T[]> => {
    return runStaffRequest(async (token) => {
      const content: T[] = [];
      let page = 0;
      let totalPages = 1;

      while (page < totalPages) {
        const response = await requestPage(token, page, pageSize);
        content.push(...response.content);
        totalPages = Math.max(response.totalPages, page + 1);
        page += 1;
      }

      return content;
    });
  };

  const categoriesQuery = useQuery({
    queryKey: ['staff', 'category-management', 'categories', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.categories(token, { page, size, sort: 'sortOrder' })),
    enabled: Boolean(session?.accessToken) && canViewCategories,
    retry: false,
  });

  const menuItemsQuery = useQuery({
    queryKey: ['staff', 'category-management', 'menu-items', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.menuItems(token, { page, size, sort: 'createdAt' })),
    enabled: Boolean(session?.accessToken) && canViewCategories,
    retry: false,
  });

  const categoryMutation = useMutation({
    mutationFn: (payload: { mode: 'create' | 'edit'; categoryId?: number; form: CategoryFormState }) =>
      runStaffRequest((token) => {
        const request = {
          code: payload.form.code.trim().toUpperCase(),
          name: payload.form.name.trim(),
          description: payload.form.description.trim() || undefined,
          sortOrder: Number(payload.form.sortOrder),
          active: payload.form.active,
        };

        return payload.mode === 'create'
          ? staffApi.createCategory(token, request)
          : staffApi.updateCategory(token, payload.categoryId!, request);
      }),
    onSuccess: () => {
      setFormMode(null);
      setEditingCategory(null);
      setDeleteTarget(null);
      setFormState(createEmptyForm());
      void queryClient.invalidateQueries({ queryKey: ['staff', 'category-management', 'categories'] });
    },
  });

  const visibilityMutation = useMutation({
    mutationFn: (category: Category) =>
      runStaffRequest((token) =>
        staffApi.updateCategory(token, category.id, {
          code: category.code,
          name: category.name,
          description: category.description ?? undefined,
          sortOrder: category.sortOrder,
          active: !category.active,
        })),
    onSuccess: () => {
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['staff', 'category-management', 'categories'] });
    },
  });

  const itemCountByCategoryId = useMemo(() => {
    const next = new Map<number, { total: number; published: number }>();
    (menuItemsQuery.data ?? []).forEach((item) => {
      const current = next.get(item.categoryId) ?? { total: 0, published: 0 };
      current.total += 1;
      if (item.active && item.available) {
        current.published += 1;
      }
      next.set(item.categoryId, current);
    });
    return next;
  }, [menuItemsQuery.data]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return (categoriesQuery.data ?? [])
      .filter((category) => {
        if (statusFilter === 'ACTIVE' && !category.active) {
          return false;
        }
        if (statusFilter === 'HIDDEN' && category.active) {
          return false;
        }
        if (!keyword) {
          return true;
        }

        return [category.code, category.name, category.description ?? ''].join(' ').toLowerCase().includes(keyword);
      })
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  }, [categoriesQuery.data, search, statusFilter]);

  const totalCategories = categoriesQuery.data?.length ?? 0;
  const publishedItems = menuItemsQuery.data?.filter((item) => item.active && item.available).length ?? 0;
  const userInitials = (session?.user.fullName ?? 'RS')
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const latestCategoryUpdate = useMemo(() => {
    return (categoriesQuery.data ?? []).reduce<string | null>((latest, category) => {
      if (!latest) {
        return category.updatedAt;
      }
      return new Date(category.updatedAt).getTime() > new Date(latest).getTime() ? category.updatedAt : latest;
    }, null);
  }, [categoriesQuery.data]);

  const isBusy = categoryMutation.isPending || visibilityMutation.isPending;
  const modalError = categoryMutation.error ?? visibilityMutation.error;

  const openCreateModal = () => {
    setFormMode('create');
    setEditingCategory(null);
    setDeleteTarget(null);
    setFormState({
      ...createEmptyForm(),
      sortOrder: String(totalCategories),
    });
  };

  const openEditModal = (category: Category) => {
    setFormMode('edit');
    setEditingCategory(category);
    setDeleteTarget(null);
    setFormState({
      code: category.code,
      name: category.name,
      description: category.description ?? '',
      sortOrder: String(category.sortOrder),
      active: category.active,
    });
  };

  const closeModal = () => {
    setFormMode(null);
    setEditingCategory(null);
    setDeleteTarget(null);
    setFormState(createEmptyForm());
  };

  const submitCategory = () => {
    if (!formMode) {
      return;
    }

    categoryMutation.mutate({
      mode: formMode,
      categoryId: editingCategory?.id,
      form: formState,
    });
  };

  if (!canViewCategories) {
    return (
      <div className="min-h-screen bg-cream px-6 py-12">
        <div className="mx-auto max-w-3xl panel p-8">
          <p className="label-text text-sun">{t('Menu Designer')}</p>
          <h1 className="heading-1 mt-4">{t('Category Management')}</h1>
          <p className="body-text-lg mt-4 max-w-2xl">
            {t('Your current role does not have access to category management.')}
          </p>
          <Link className="button-primary mt-8" to="/staff">
            {t('Back to Dashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-cream/80 border-r border-ink/10 py-8 lg:flex">
        <div className="px-8 pb-8">
          <h1 className="font-display text-lg text-ink">Reserve &amp; Gilt</h1>
          <p className="mt-1 label-text">Culinary Concierge</p>
        </div>

        <nav className="flex-1 space-y-1">
          <ShellNavLink icon="dashboard" label={t('Dashboard')} to="/staff" />
          <ShellNavLink active icon="restaurant_menu" label={t('Menu Designer')} to="/staff/categories" />
          <ShellNavLink icon="event_available" label={t('Reservations')} to="/book" />
          <ShellPlaceholder icon="badge" label={t('Staffing')} />
          <ShellPlaceholder icon="inventory_2" label={t('Inventory')} />
          <ShellPlaceholder icon="insights" label={t('Analytics')} />
        </nav>

        <div className="mt-auto border-t border-ink/10 px-8 pt-8">
          <ShellUtility icon="help_outline" label={t('Support')} />
          <ShellUtility icon="tune" label={t('Settings')} />
        </div>
      </aside>

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/90 px-6 py-4 backdrop-blur-md lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-display text-2xl text-ink">{t('Menu Designer')}</h2>
                <span className="text-slate/50">/</span>
                <span className="text-sm font-semibold text-sun">{t('Category Management')}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 lg:hidden">
                <ShellCompactLink label={t('Dashboard')} to="/staff" />
                <ShellCompactLink active label={t('Categories')} to="/staff/categories" />
                <ShellCompactLink label={t('Dish Mastery')} to="/staff/menu-items" />
                <ShellCompactLink label={t('Reservations')} to="/book" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="button-icon relative" type="button">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-sun" />
              </button>
              <button className="button-icon" type="button">
                <span className="material-symbols-outlined">settings</span>
              </button>
              <button
                className="button-chip hidden md:inline-flex"
                onClick={onLogout}
                type="button"
              >
                {t('Log out')}
              </button>
              <Link className="button-chip hidden xl:inline-flex" to="/staff/menu-items">
                {t('Dish Mastery')}
              </Link>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-forest text-sm font-semibold text-cream">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-12">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <p className="label-text text-sun">{t('Menu Designer')}</p>
              <h3 className="heading-1">{t('Curated Categories')}</h3>
              <p className="font-display text-lg text-slate">
                {t('Refine the architecture of your culinary offering.')}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="block sm:w-72">
                <span className="label-text mb-2 block">{t('Search')}</span>
                <input
                  className="field"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('Search by code, name, or description')}
                  value={search}
                />
              </label>
              <label className="block sm:w-44">
                <span className="label-text mb-2 block">{t('Status')}</span>
                <select
                  className="field"
                  onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'ACTIVE' | 'HIDDEN')}
                  value={statusFilter}
                >
                  <option value="ALL">{t('All statuses')}</option>
                  <option value="ACTIVE">{t('Active')}</option>
                  <option value="HIDDEN">{t('Hidden')}</option>
                </select>
              </label>
              <Button
                disabled={!canEditCategories}
                onClick={openCreateModal}
              >
                <span className="material-symbols-outlined">add</span>
                <span>{t('Create New Category')}</span>
              </Button>
            </div>
          </div>

          {!canEditCategories ? (
            <div className="mt-6 panel px-5 py-4 body-text">
              {t('You can inspect category architecture from this role, but only admins and managers can create or update categories.')}
            </div>
          ) : null}

          {categoriesQuery.isLoading || menuItemsQuery.isLoading ? <LoadingState label={t('Loading categories')} /> : null}
          {categoriesQuery.error ? <ErrorState error={categoriesQuery.error} /> : null}
          {menuItemsQuery.error ? <ErrorState error={menuItemsQuery.error} /> : null}

          {!categoriesQuery.isLoading && !categoriesQuery.error ? (
            <div className="mt-10 list-spacing">
              {filteredCategories.map((category, index) => {
                const preview = CATEGORY_PREVIEW_IMAGES[index % CATEGORY_PREVIEW_IMAGES.length];
                const counts = itemCountByCategoryId.get(category.id) ?? { total: 0, published: 0 };
                const hidden = !category.active;

                return (
                  <article
                    key={category.id}
                    className={`group relative flex flex-col gap-6 overflow-hidden rounded-[22px] p-6 shadow-sm transition-shadow md:flex-row md:items-center ${
                      hidden ? 'bg-slate/5 opacity-80 grayscale-[0.2]' : 'bg-white hover:shadow-md'
                    }`}
                  >
                    <div className={`absolute inset-y-0 left-0 w-1 transition-opacity ${hidden ? 'bg-slate' : 'bg-sun opacity-0 group-hover:opacity-100'}`} />
                    <div className="mr-2 self-start text-slate/50 transition group-hover:text-slate">
                      <span className="material-symbols-outlined">drag_indicator</span>
                    </div>
                    <div className="h-24 w-24 overflow-hidden rounded-lg bg-cream">
                      <img alt={category.name} className="h-full w-full object-cover" src={preview} />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className={`heading-2 ${hidden ? 'text-slate' : ''}`}>{category.name}</h4>
                        <span className={`badge ${hidden ? 'badge-neutral' : 'badge-warning'}`}>
                          {hidden ? t('Hidden') : t('Active')}
                        </span>
                        <span className="badge badge-neutral">
                          {category.code}
                        </span>
                      </div>
                      <p className={`mt-2 max-w-2xl body-text ${hidden ? 'text-slate/60' : ''}`}>
                        {category.description || t('No category description yet. Add one to guide menu curation and staff publishing decisions.')}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-5 label-text">
                        <span>{t('{{count}} Items', { count: counts.total })}</span>
                        <span>{t('{{count}} Published', { count: counts.published })}</span>
                        <span>{t('Sort {{sort}}', { sort: category.sortOrder })}</span>
                        <span>{t('Last Updated: {{value}}', { value: formatRelativeTime(category.updatedAt) })}</span>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 transition-opacity ${canEditCategories ? 'md:opacity-0 md:group-hover:opacity-100' : ''}`}>
                      {canEditCategories ? (
                        <>
                          <CategoryIconButton icon="edit" label={t('Edit category')} onClick={() => openEditModal(category)} tone="neutral" />
                          <CategoryIconButton
                            icon={hidden ? 'visibility_off' : 'visibility'}
                            label={hidden ? t('Show category') : t('Hide category')}
                            onClick={() => visibilityMutation.mutate(category)}
                            tone={hidden ? 'secondary' : 'neutral'}
                          />
                          <CategoryIconButton icon="delete" label={t('Delete category')} onClick={() => setDeleteTarget(category)} tone="danger" />
                        </>
                      ) : (
                        <span className="badge badge-neutral">
                          {t('View only')}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}

              {!filteredCategories.length && categoriesQuery.data?.length ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined text-4xl">filter_alt_off</span>
                  <p>{t('No categories match the current filters.')}</p>
                </div>
              ) : null}

              {!filteredCategories.length && !categoriesQuery.data?.length ? (
                <div className="empty-state">
                  <span className="material-symbols-outlined text-4xl">category</span>
                  <p>{t('No categories exist yet. Create the first one to start organizing the menu.')}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <SummaryCard label={t('Total Categories')} value={String(totalCategories)} />
            <SummaryCard label={t('Published Items')} value={String(publishedItems)} />
            <SummaryCard italic label={t('Last Deployment')} value={latestCategoryUpdate ? formatRelativeTime(latestCategoryUpdate) : t('Awaiting first publish')} />
          </div>
        </section>

        <footer className="mt-auto flex flex-col gap-4 border-t border-ink/10 bg-cream/50 px-6 py-6 label-text lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <span>© 2024 Reserve &amp; Gilt Gastronomy Group</span>
          <div className="flex flex-wrap gap-6">
            <span>{t('Privacy Policy')}</span>
            <span>{t('Terms of Service')}</span>
            <span>{t('Technical Support')}</span>
            <span>{t('Documentation')}</span>
          </div>
        </footer>

        {/* Create/Edit Modal */}
        <Modal
          isOpen={formMode !== null}
          onClose={closeModal}
          title={formMode === 'create' ? t('Create New Category') : t('Refine Category')}
          size="lg"
        >
          <ModalBody>
            <p className="body-text mb-6">
              {formMode === 'create'
                ? t('Shape a new category for the menu designer and make it visible to the dining room when ready.')
                : t('Adjust the presentation, visibility, and ordering of this category without leaving the designer.')}
            </p>

            <FormGrid>
              <FormField label={t('Category code')}>
                <Input
                  onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value.toUpperCase() }))}
                  placeholder={t('STARTERS')}
                  value={formState.code}
                />
              </FormField>
              <FormField label={t('Display name')}>
                <Input
                  onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                  placeholder={t('Signature Starters')}
                  value={formState.name}
                />
              </FormField>
              <div className="md:col-span-2">
                <FormField label={t('Description')}>
                  <Textarea
                    onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
                    placeholder={t('Describe the intent and placement of this category on the menu.')}
                    value={formState.description}
                    rows={4}
                  />
                </FormField>
              </div>
              <FormField label={t('Sort order')}>
                <Input
                  min="0"
                  onChange={(event) => setFormState((current) => ({ ...current, sortOrder: event.target.value }))}
                  type="number"
                  value={formState.sortOrder}
                />
              </FormField>
              <div className="flex items-end">
                <Checkbox
                  checked={formState.active}
                  onChange={(event) => setFormState((current) => ({ ...current, active: event.target.checked }))}
                  label={formState.active ? t('Publish immediately - Visible to public') : t('Save as hidden')}
                />
              </div>
            </FormGrid>

            {modalError ? <InlineError error={modalError} /> : null}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={closeModal}>
              {t('Cancel')}
            </Button>
            <Button
              disabled={isBusy || formState.code.trim() === '' || formState.name.trim() === '' || formState.sortOrder.trim() === ''}
              loading={isBusy}
              onClick={submitCategory}
            >
              {formMode === 'create' ? t('Create Category') : t('Save Changes')}
            </Button>
          </ModalFooter>
        </Modal>

        {/* Delete Confirmation */}
        <Modal
          isOpen={deleteTarget !== null}
          onClose={closeModal}
          title={t('Delete Category?')}
          size="sm"
          showCloseButton={false}
        >
          <ModalBody className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ember/10 text-ember">
              <span className="material-symbols-outlined text-4xl">warning</span>
            </div>
            <p className="body-text-lg mt-4">
              {t('The current backend does not expose a hard-delete category endpoint yet. You can hide this category immediately so it disappears from the active menu architecture while preserving its data.')}
            </p>
            {modalError ? <InlineError error={modalError} /> : null}
          </ModalBody>
          <ModalFooter className="flex-col">
            {deleteTarget?.active ? (
              <Button
                variant="danger"
                fullWidth
                disabled={isBusy}
                loading={isBusy}
                onClick={() => deleteTarget && visibilityMutation.mutate(deleteTarget)}
              >
                {t('Hide Instead')}
              </Button>
            ) : null}
            <Button variant="secondary" fullWidth onClick={closeModal}>
              {deleteTarget?.active ? t('Cancel') : t('Close')}
            </Button>
          </ModalFooter>
        </Modal>
      </main>
    </div>
  );
}

function ShellNavLink({ active = false, icon, label, to }: { active?: boolean; icon: string; label: string; to: string }) {
  return (
    <Link
      className={`flex items-center gap-3 py-3 pl-4 pr-6 transition-all ${
        active ? 'border-l-4 border-sun bg-ink/5 font-bold text-ink' : 'text-slate hover:text-ink'
      }`}
      to={to}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-sm tracking-[0.02em]">{label}</span>
    </Link>
  );
}

function ShellPlaceholder({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex cursor-not-allowed items-center gap-3 py-3 pl-4 pr-6 text-slate/50">
      <span className="material-symbols-outlined">{icon}</span>
      <span className="text-sm tracking-[0.02em]">{label}</span>
    </div>
  );
}

function ShellUtility({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center gap-3 py-2 text-slate transition hover:text-ink" type="button">
      <span className="material-symbols-outlined">{icon}</span>
      <span className="label-text">{label}</span>
    </button>
  );
}

function ShellCompactLink({ active = false, label, to }: { active?: boolean; label: string; to: string }) {
  return (
    <Link className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${active ? 'bg-forest text-cream' : 'bg-ink/5 text-slate'}`} to={to}>
      {label}
    </Link>
  );
}

function CategoryIconButton({
  icon,
  label,
  onClick,
  tone,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  tone: 'neutral' | 'secondary' | 'danger';
}) {
  const toneClass = tone === 'danger'
    ? 'text-ember hover:bg-ember/10'
    : tone === 'secondary'
      ? 'text-sun hover:bg-sun/10'
      : 'text-slate hover:bg-ink/5';

  return (
    <button
      aria-label={label}
      className={`button-icon ${toneClass}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}

function SummaryCard({ italic = false, label, value }: { italic?: boolean; label: string; value: string }) {
  return (
    <div className="card">
      <p className="label-text">{label}</p>
      <h5 className={`font-display text-ink mt-2 ${italic ? 'text-2xl' : 'text-3xl'}`}>{value}</h5>
    </div>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Unknown';
  }

  const diffMinutes = Math.round((Date.now() - timestamp) / 60_000);
  if (diffMinutes < 1) {
    return 'Just now';
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

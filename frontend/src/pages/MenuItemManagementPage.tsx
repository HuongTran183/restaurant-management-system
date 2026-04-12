import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ApiError, type AuthSession, type Category, type StaffMenuItem, staffApi } from '../lib/api';
import { formatCurrencyVnd } from '../lib/currency';
import { ErrorState, LoadingState } from './PagePrimitives';

const DISH_PREVIEW_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCy19vX4uslvu3HvVOyGyn0WVRcPUVe0rasMjUaYJnj5xLetrbTlGegh0oFtnjI70ZW0g6iGI2J1Av0l0y3nB6yj00d52rXAjM3XeRoM3YdQ-RhFwyk3cKCszLIZAUWlXfuy9DfiiNvvGSnLD-OdT6-F1-7eQu80i9yvkCDLPW7W-IxKX2F1mPp_wbPT7pFLVMy8ApBMrB82947z46bcjPx7-blQDoJ_aejsXWpj5-N9sgxR06jRBrGc6-RzFs4_Xd0mlM0sZhufTI',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB7a6dYvtURo4zmLswQNl2RwE4cmaeamcxH_MR4VKvLWUBznKRlKpjXfCJpeY8NVxgzsY1g2vWcu6ksvrkxclhHhSwM6qu2y4k-S0fdXU3wJVQhU1LR-jW0jsiWMvjPk0YlC1g07kenfxtozP8WfTM5cEeD6jDSZGWH7KFjL815bvqHs2sgDhRfUD_3Ql6RxBWmSnSsLi5KX8gzL_CFjBEFkfyyZhVfwm3AM9fWBVASJM6G21pfNbd4JuOlSq0ocMmqAgNoxIOXFKI',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCn-ohoOijvEsSfBAmTFFyos8y3bnawacW-DWcUchF9WwzD1Kj2_v_S_tqXe85cVVMb7CLU4FVtzHIW99WHalCvyhq_eJ6PaB9X-bDRn9Yqiue-xjo8lgQohHLoSNL_-6CwaomAOSfgOf1Y6LJkoLuBNqeBDJ_fZ4sRLNxeYaDlNpctKIeiwstp8UyiBBz25xfuAgRHc-NKTBIuomwdXxBIy-uPwqvOuZ96eL-RHunn1KR_ZHSzqqFPm_Ve3NSHfYuB2kyXTMjAWfw',
];

type DishFormState = {
  code: string;
  name: string;
  description: string;
  price: string;
  categoryId: string;
  available: boolean;
  active: boolean;
  featured: boolean;
  promotional: boolean;
  trackStock: boolean;
  prepTime: number;
};

function createEmptyDishForm(categories: Category[]): DishFormState {
  return {
    code: '',
    name: '',
    description: '',
    price: '',
    categoryId: categories[0] ? String(categories[0].id) : '',
    available: true,
    active: true,
    featured: false,
    promotional: false,
    trackStock: false,
    prepTime: 15,
  };
}

function buildDishForm(item: StaffMenuItem): DishFormState {
  return {
    code: item.code,
    name: item.name,
    description: item.description ?? '',
    price: String(item.price),
    categoryId: String(item.categoryId),
    available: item.available,
    active: item.active,
    featured: item.featured,
    promotional: item.promotional,
    trackStock: false,
    prepTime: 15,
  };
}

export function MenuItemManagementPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<number | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [formState, setFormState] = useState<DishFormState>(createEmptyDishForm([]));

  const userRoles = session?.user.roles ?? [];
  const canViewMenuItems = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canEditMenuItems = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER');
  const userInitials = (session?.user.fullName ?? 'RS')
    .split(' ')
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
    queryKey: ['staff', 'menu-item-management', 'categories', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.categories(token, { page, size, sort: 'sortOrder' })),
    enabled: Boolean(session?.accessToken) && canViewMenuItems,
    retry: false,
  });

  const menuItemsQuery = useQuery({
    queryKey: ['staff', 'menu-item-management', 'menu-items', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.menuItems(token, { page, size, sort: 'updatedAt' })),
    enabled: Boolean(session?.accessToken) && canViewMenuItems,
    retry: false,
  });

  const imageUploadMutation = useMutation({
    mutationFn: (payload: { menuItemId: number; file: File }) =>
      runStaffRequest((token) => staffApi.uploadMenuItemImage(token, payload.menuItemId, payload.file)),
    onSuccess: () => {
      setPendingImageFile(null);
      setPreviewUrl(null);
      void queryClient.invalidateQueries({ queryKey: ['staff', 'menu-item-management', 'menu-items'] });
    },
  });

  const saveMenuItemMutation = useMutation({
    mutationFn: (payload: { menuItemId?: number; form: DishFormState }) =>
      runStaffRequest((token) => {
        const request = {
          code: payload.form.code.trim().toUpperCase(),
          name: payload.form.name.trim(),
          description: payload.form.description.trim() || undefined,
          price: Number(payload.form.price),
          available: payload.form.available,
          active: payload.form.active,
          featured: payload.form.featured,
          promotional: payload.form.promotional,
          categoryId: Number(payload.form.categoryId),
        };

        return payload.menuItemId
          ? staffApi.updateMenuItem(token, payload.menuItemId, request)
          : staffApi.createMenuItem(token, request);
      }),
    onSuccess: (savedItem) => {
      setIsCreatingNew(false);
      setSelectedMenuItemId(savedItem.id);
      void queryClient.invalidateQueries({ queryKey: ['staff', 'menu-item-management'] });

      if (pendingImageFile) {
        imageUploadMutation.mutate({ menuItemId: savedItem.id, file: pendingImageFile });
      } else {
        setPreviewUrl(null);
      }
    },
  });

  const categories = useMemo(
    () => [...(categoriesQuery.data ?? [])].sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)),
    [categoriesQuery.data],
  );
  const menuItems = useMemo(
    () =>
      [...(menuItemsQuery.data ?? [])].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [menuItemsQuery.data],
  );

  useEffect(() => {
    if (isCreatingNew || selectedMenuItemId !== null || !menuItems.length) {
      return;
    }

    setSelectedMenuItemId(menuItems[0].id);
  }, [isCreatingNew, menuItems, selectedMenuItemId]);

  const filteredMenuItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      if (!keyword) {
        return true;
      }

      return [item.name, item.code, item.categoryName, item.description ?? ''].join(' ').toLowerCase().includes(keyword);
    });
  }, [menuItems, search]);

  const selectedMenuItem = useMemo(() => {
    if (isCreatingNew) {
      return null;
    }

    return menuItems.find((item) => item.id === selectedMenuItemId) ?? null;
  }, [isCreatingNew, menuItems, selectedMenuItemId]);

  useEffect(() => {
    if (isCreatingNew) {
      setFormState(createEmptyDishForm(categories));
      return;
    }

    if (!selectedMenuItem) {
      return;
    }

    setFormState(buildDishForm(selectedMenuItem));
  }, [categories, isCreatingNew, selectedMenuItem]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const currentItemLabel = isCreatingNew ? 'Món mới' : selectedMenuItem?.name ?? 'Chọn món';
  const primaryImage = previewUrl ?? resolveMenuItemPreview(selectedMenuItem, menuItems.findIndex((item) => item.id === selectedMenuItem?.id));
  const summary = useMemo(() => {
    const total = menuItems.length;
    const published = menuItems.filter((item) => item.active && item.available).length;
    const categoriesUsed = new Set(menuItems.map((item) => item.categoryId)).size;
    const latestUpdate = menuItems.reduce<string | null>((latest, item) => {
      if (!latest) {
        return item.updatedAt;
      }

      return new Date(item.updatedAt).getTime() > new Date(latest).getTime() ? item.updatedAt : latest;
    }, null);

    return { total, published, categoriesUsed, latestUpdate };
  }, [menuItems]);
  const isBusy = saveMenuItemMutation.isPending || imageUploadMutation.isPending;
  const actionError = saveMenuItemMutation.error ?? imageUploadMutation.error;
  const priceValue = Number(formState.price);
  const canSubmit = canEditMenuItems
    && categories.length > 0
    && formState.name.trim() !== ''
    && formState.code.trim() !== ''
    && formState.categoryId !== ''
    && Number.isFinite(priceValue)
    && priceValue >= 0;

  const handleCreateNew = () => {
    setIsCreatingNew(true);
    setSelectedMenuItemId(null);
    setPendingImageFile(null);
    setPreviewUrl(null);
    setFormState(createEmptyDishForm(categories));
  };

  const handleSelectMenuItem = (menuItemId: number) => {
    setIsCreatingNew(false);
    setSelectedMenuItemId(menuItemId);
    setPendingImageFile(null);
    setPreviewUrl(null);
  };

  const handleDiscard = () => {
    if (selectedMenuItem) {
      setFormState(buildDishForm(selectedMenuItem));
    } else {
      setFormState(createEmptyDishForm(categories));
    }

    setPendingImageFile(null);
    setPreviewUrl(null);
  };

  const handleSave = () => {
    if (!canSubmit) {
      return;
    }

    saveMenuItemMutation.mutate({
      menuItemId: selectedMenuItem?.id,
      form: formState,
    });
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPendingImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    event.target.value = '';
  };

  if (!canViewMenuItems) {
    return (
      <div className="min-h-screen bg-cream px-6 py-12">
        <div className="mx-auto max-w-3xl panel p-8">
          <p className="label-text text-sun">Menu Designer</p>
          <h1 className="heading-1 mt-4">Quản trị món ăn</h1>
          <p className="body-text-lg mt-4 max-w-2xl">
            Vai trò hiện tại của bạn chưa có quyền truy cập khu biên tập món ăn.
          </p>
          <Link className="button-primary mt-8" to="/staff">
            Quay lại dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh text-ink">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-cream/80 border-r border-ink/10 py-8 lg:flex">
        <div className="px-8 pb-8">
          <h1 className="font-display text-lg text-ink">Reserve &amp; Gilt</h1>
          <p className="mt-1 label-text">Điều phối ẩm thực</p>
        </div>

        <nav className="flex-1 space-y-2">
          <ShellNavLink icon="dashboard" label="Bảng điều khiển" to="/staff" />
          <ShellNavLink active icon="restaurant_menu" label="Thiết kế thực đơn" to="/staff/menu-items" />
          <ShellNavLink icon="view_cozy" label="Danh mục món" to="/staff/categories" />
          <ShellNavLink icon="event_available" label="Đặt chỗ" to="/book" />
          <ShellPlaceholder icon="badge" label="Nhân sự" />
          <ShellPlaceholder icon="inventory_2" label="Tồn kho" />
          <ShellPlaceholder icon="insights" label="Phân tích" />
        </nav>

        <div className="mt-auto space-y-4 border-t border-ink/10 px-8 pt-8">
          <button
            className="button-primary w-full justify-center"
            disabled={!canEditMenuItems || categories.length === 0}
            onClick={handleCreateNew}
            type="button"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>Tạo món mới</span>
          </button>
          <div className="space-y-2 pb-4">
            <ShellUtility icon="help_outline" label="Hỗ trợ" />
            <ShellUtility icon="tune" label="Thiết lập" />
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-72">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-cream/90 border-b border-ink/10 px-6 py-4 backdrop-blur-md lg:px-12 lg:py-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-display text-2xl text-ink">Biên tập món ăn</span>
            <span className="text-slate/50">/</span>
            <span className="text-sm font-medium text-slate">{currentItemLabel}</span>
          </div>

          <div className="flex items-center gap-4">
            <Link className="button-chip hidden md:inline-flex" to="/staff/categories">
              Danh mục món
            </Link>
            <button className="button-icon" type="button">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="button-icon" type="button">
              <span className="material-symbols-outlined">settings</span>
            </button>
            <button className="button-chip hidden md:inline-flex" onClick={onLogout} type="button">
              Đăng xuất
            </button>
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-forest text-cream ring-2 ring-sun/30">
              <span className="text-sm font-semibold">{userInitials}</span>
            </div>
          </div>
        </header>

        <div className="mx-auto flex max-w-7xl flex-1 flex-col px-6 py-10 lg:px-12">
          <div className="mb-12 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <h2 className="heading-1">Làm chủ món ăn</h2>
              <p className="body-text-lg max-w-2xl">
                Tinh chỉnh hình ảnh, giá bán, câu chuyện món và trạng thái phục vụ để thực đơn của nhà hàng luôn nhất quán.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button className="button-ghost" onClick={handleDiscard} type="button">
                Hoàn tác
              </button>
              <button
                className="button-primary"
                disabled={!canSubmit || isBusy}
                onClick={handleSave}
                type="button"
              >
                {saveMenuItemMutation.isPending || imageUploadMutation.isPending ? 'Đang lưu...' : 'Lưu món ăn'}
              </button>
            </div>
          </div>

          <div className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem_auto] lg:items-end">
            <div className="panel-solid p-6">
              <p className="label-text">Thư viện món ăn</p>
              <p className="body-text mt-2 max-w-2xl">
                Chọn món đang có để chỉnh sửa nhanh, hoặc tạo món mới rồi hoàn thiện giá bán, hình ảnh và mô tả bằng tiếng Việt.
              </p>
            </div>

            <label className="block panel-solid p-6">
              <span className="label-text mb-2 block">Tìm món</span>
              <input
                className="dish-field"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tên món, mã món, danh mục"
                value={search}
              />
            </label>

            <button
              className="button-primary"
              disabled={!canEditMenuItems || categories.length === 0}
              onClick={handleCreateNew}
              type="button"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              <span>Tạo món mới</span>
            </button>
          </div>

          <div className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Tổng số món" value={String(summary.total)} />
            <SummaryCard label="Đang phục vụ" value={String(summary.published)} />
            <SummaryCard label="Danh mục đang dùng" value={String(summary.categoriesUsed)} />
            <SummaryCard label="Cập nhật gần nhất" value={summary.latestUpdate ? formatRelativeTime(summary.latestUpdate) : 'Chưa có'} />
          </div>

          {categoriesQuery.isLoading || menuItemsQuery.isLoading ? <LoadingState label="Đang tải biên tập món ăn" /> : null}
          {categoriesQuery.error ? <ErrorState error={categoriesQuery.error} /> : null}
          {menuItemsQuery.error ? <ErrorState error={menuItemsQuery.error} /> : null}

          {!categoriesQuery.isLoading && !menuItemsQuery.isLoading && categories.length === 0 ? (
            <section className="panel p-8">
              <p className="label-text text-sun">Thiếu dữ liệu nền</p>
              <h3 className="heading-2 mt-4">Bạn cần tạo danh mục trước</h3>
              <p className="body-text mt-4 max-w-3xl">
                Mỗi món ăn phải thuộc về một danh mục. Hãy tạo danh mục trước rồi quay lại màn biên tập món để tiếp tục.
              </p>
              <Link className="button-primary mt-8" to="/staff/categories">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                <span>Mở quản trị danh mục</span>
              </Link>
            </section>
          ) : null}

          {!categoriesQuery.isLoading && !menuItemsQuery.isLoading && categories.length > 0 ? (
            <>
              <div className="mb-10 overflow-x-auto pb-2">
                <div className="flex min-w-max gap-4">
                  {filteredMenuItems.map((item, index) => (
                    <button
                      key={item.id}
                      className={`flex min-w-[240px] flex-col rounded-xl border p-4 text-left transition ${
                        !isCreatingNew && selectedMenuItemId === item.id
                          ? 'border-sun bg-sun/10 shadow-sm'
                          : 'border-slate/30 bg-white hover:border-slate/50'
                      }`}
                      onClick={() => handleSelectMenuItem(item.id)}
                      type="button"
                    >
                      <div className="mb-3 h-28 overflow-hidden rounded-lg bg-slate/20">
                        <img alt={item.name} className="h-full w-full object-cover" src={resolveMenuItemPreview(item, index)} />
                      </div>
                      <p className="font-display text-xl text-ink">{item.name}</p>
                      <p className="label-text mt-1">{item.code}</p>
                      <div className="mt-3 flex items-center justify-between label-text">
                        <span>{item.categoryName}</span>
                        <span>{item.available ? 'Còn hàng' : 'Tạm hết'}</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between label-text">
                        <span>{formatCurrencyVnd(item.price)}</span>
                        <span>{formatRelativeTime(item.updatedAt)}</span>
                      </div>
                    </button>
                  ))}

                  {filteredMenuItems.length === 0 ? (
                    <div className="flex min-h-[220px] min-w-[280px] items-center rounded-xl border border-dashed border-slate/30 bg-white px-6 text-sm leading-7 text-slate">
                      Không có món nào khớp với từ khóa hiện tại.
                    </div>
                  ) : null}
                </div>
              </div>

              {actionError ? (
                <div className="mb-6 rounded-xl border border-ember/30 bg-ember/10 px-5 py-4 text-sm text-ember">
                  {actionError instanceof Error ? actionError.message : 'Không thể lưu dữ liệu món ăn.'}
                </div>
              ) : null}

              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 space-y-8 lg:col-span-8">
                  <section className="space-y-8 panel-solid p-8">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <h3 className="heading-3">Thông tin tổng quan</h3>
                      <div className="flex items-center gap-3 rounded-full border border-slate/20 bg-white px-4 py-2">
                        <span className="label-text">Trạng thái:</span>
                        <div className="flex items-center gap-2">
                          <span className={`label-text ${formState.available ? 'text-forest' : 'text-ember'}`}>
                            {formState.available ? 'Còn hàng' : 'Tạm hết hàng'}
                          </span>
                          <ToggleSwitch
                            checked={formState.available}
                            disabled={!canEditMenuItems}
                            onChange={() => setFormState((current) => ({ ...current, available: !current.available }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <FormField label="Tên món">
                        <input className="dish-field" onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))} type="text" value={formState.name} />
                      </FormField>
                      <FormField label="Mã món / SKU">
                        <input className="dish-field" onChange={(event) => setFormState((current) => ({ ...current, code: event.target.value.toUpperCase() }))} type="text" value={formState.code} />
                      </FormField>
                      <FormField label="Danh mục">
                        <select className="dish-field" onChange={(event) => setFormState((current) => ({ ...current, categoryId: event.target.value }))} value={formState.categoryId}>
                          <option value="">Chọn danh mục</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Giá bán (VND)">
                        <input className="dish-field" min="0" onChange={(event) => setFormState((current) => ({ ...current, price: event.target.value }))} step="0.01" type="number" value={formState.price} />
                      </FormField>
                      <div className="col-span-2 space-y-2">
                        <label className="label-text ml-1">Câu chuyện món / mô tả</label>
                        <textarea className="dish-field min-h-32 resize-none" onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))} rows={4} value={formState.description} />
                      </div>
                    </div>
                  </section>

                  <section className="space-y-8 panel-solid p-8">
                    <h3 className="heading-3">Cấu hình món ăn</h3>

                    <div className="space-y-6">
                      <div>
                        <label className="label-text mb-3 ml-1 block">Topping &amp; cộng thêm</label>
                        <div className="flex flex-wrap gap-2">
                          <AddonPill label="Thêm nấm truffle" price={120000} />
                          <AddonPill label="Trứng cá muối" price={150000} />
                          <button className="button-chip" disabled type="button">
                            <span className="material-symbols-outlined text-sm">add</span>
                            <span>Thêm nữa</span>
                          </button>
                        </div>
                        <p className="body-text mt-3">
                          Phần topping đang đóng vai trò demo UI. Backend cho tùy chọn món và phụ phí hiện chưa hoàn chỉnh.
                        </p>
                      </div>

                      <div>
                        <label className="label-text mb-3 ml-1 block">Thuộc tính món</label>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <AttributeChip icon="eco" label="Thuần chay" />
                          <AttributeChip icon="local_fire_department" label="Cay" />
                          <AttributeChip icon="set_meal" label="Không gluten" />
                          <AttributeChip active icon="star" label="Chef chọn" />
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                <div className="col-span-12 space-y-8 lg:col-span-4">
                  <section className="space-y-6 panel-solid p-8">
                    <h3 className="heading-3">Hình ảnh món ăn</h3>

                    <label className="relative block aspect-square cursor-pointer overflow-hidden rounded-xl bg-slate/30">
                      <img alt="Xem trước món ăn" className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" src={primaryImage} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-forest/60 p-6 text-white opacity-0 transition-opacity hover:opacity-100">
                        <span className="material-symbols-outlined mb-2 text-4xl">cloud_upload</span>
                        <span className="label-text text-white">Cập nhật ảnh</span>
                        <p className="body-text mt-2 text-center text-white/80">
                          Tỷ lệ 1:1, ảnh sắc nét
                        </p>
                      </div>
                      <input accept="image/*" className="sr-only" onChange={handleImageChange} type="file" />
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      {buildThumbnailStrip(selectedMenuItem, primaryImage).map((image, index) => (
                        <div key={`${image}-${index}`} className={`aspect-square overflow-hidden rounded-lg border-2 ${index === 0 ? 'border-white shadow-sm' : 'border-slate/30 opacity-70'}`}>
                          <img alt={`Hình phụ ${index + 1}`} className="h-full w-full object-cover" src={image} />
                        </div>
                      ))}
                    </div>

                    {pendingImageFile ? (
                      <p className="body-text">
                        Ảnh mới đã sẵn sàng. Hãy bấm lưu món ăn để tải ảnh lên hệ thống.
                      </p>
                    ) : null}
                  </section>

                  <section className="space-y-6 panel-solid p-8">
                    <h3 className="heading-3">Vận hành &amp; tồn kho</h3>

                    <div className="space-y-4">
                      <ToggleRow
                        checked={formState.active}
                        description="Ẩn hoặc hiện món trên menu công khai."
                        disabled={!canEditMenuItems}
                        label="Công bố trên menu"
                        onChange={() => setFormState((current) => ({ ...current, active: !current.active }))}
                      />
                      <ToggleRow
                        checked={formState.trackStock}
                        description="Giao diện đã sẵn sàng, đang chờ backend tồn kho."
                        disabled
                        label="Theo dõi tồn kho"
                        onChange={() => undefined}
                      />
                      <ToggleRow
                        checked={formState.featured}
                        description="Đưa món này vào nhóm nổi bật trên menu công khai."
                        disabled={!canEditMenuItems}
                        label="Món nổi bật"
                        onChange={() => setFormState((current) => ({ ...current, featured: !current.featured }))}
                      />
                      <ToggleRow
                        checked={formState.promotional}
                        description="Đánh dấu món đang chạy ưu đãi hoặc cần được nhấn mạnh ở public menu."
                        disabled={!canEditMenuItems}
                        label="Món khuyến mãi"
                        onChange={() => setFormState((current) => ({ ...current, promotional: !current.promotional }))}
                      />

                      <div className="pt-4">
                        <label className="label-text mb-2 ml-1 block">Thời gian chuẩn bị</label>
                        <div className="flex items-center gap-3">
                          <input className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-slate/30 accent-sun" max="60" min="5" onChange={(event) => setFormState((current) => ({ ...current, prepTime: Number(event.target.value) }))} type="range" value={formState.prepTime} />
                          <span className="min-w-[45px] text-sm font-bold text-ink">{formState.prepTime}m</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="rounded-r-xl border-l-4 border-sun bg-sun/10 p-6">
                    <p className="font-display italic leading-relaxed text-ink">
                      "Một món ăn xuất sắc không chỉ ngon miệng, mà còn truyền tải được cá tính của nhà hàng ngay từ ánh nhìn đầu tiên."
                    </p>
                    <span className="label-text mt-2 block text-sun">
                      - Tiêu chuẩn ẩm thực
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        <footer className="mt-auto border-t border-ink/10 bg-cream/80 px-6 py-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 label-text lg:flex-row lg:items-center lg:justify-between">
            <p>© 2024 Reserve &amp; Gilt Gastronomy Group</p>
            <div className="flex flex-wrap gap-8">
              <span>Chính sách bảo mật</span>
              <span>Điều khoản dịch vụ</span>
              <span>Hỗ trợ kỹ thuật</span>
              <span>Tài liệu</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

function ShellNavLink({ active = false, icon, label, to }: { active?: boolean; icon: string; label: string; to: string }) {
  return (
    <Link className={`flex items-center gap-3 py-3 pl-8 pr-6 transition-all ${active ? 'border-l-4 border-sun bg-sun/10 font-bold text-ink' : 'text-slate hover:bg-ink/5 hover:text-ink'}`} to={to}>
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function ShellPlaceholder({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex cursor-not-allowed items-center gap-3 py-3 pl-8 pr-6 text-slate/60">
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function ShellUtility({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex items-center gap-3 text-sm text-slate transition hover:text-ink" type="button">
      <span className="material-symbols-outlined text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function FormField({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="col-span-2 space-y-2 md:col-span-1">
      <label className="label-text ml-1">{label}</label>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button className={`relative inline-flex h-5 w-10 items-center rounded-full transition ${checked ? 'bg-forest' : 'bg-slate/40'} ${disabled ? 'cursor-not-allowed opacity-60' : ''}`} disabled={disabled} onClick={onChange} type="button">
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );
}

function ToggleRow({
  checked,
  description,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-ink/10 py-3 last:border-b-0">
      <div className="pr-4">
        <span className="block text-sm font-bold text-ink">{label}</span>
        <span className="body-text mt-1 block">{description}</span>
      </div>
      <ToggleSwitch checked={checked} disabled={disabled} onChange={onChange} />
    </div>
  );
}

function AttributeChip({ active = false, icon, label }: { active?: boolean; icon: string; label: string }) {
  return (
    <button
      className={`flex flex-col items-center justify-center rounded-xl border-2 p-4 transition-all ${
        active ? 'border-sun bg-sun/10 text-ink' : 'border-slate/30 bg-white text-slate hover:border-sun/50 hover:text-ink'
      }`}
      disabled
      type="button"
    >
      <span className="material-symbols-outlined mb-2">{icon}</span>
      <span className="label-text">{label}</span>
    </button>
  );
}

function AddonPill({ label, price }: { label: string; price: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate/30 bg-white px-4 py-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs font-bold text-sun">+{formatCurrencyVnd(price)}</span>
      <span className="material-symbols-outlined text-sm text-slate">close</span>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel-solid p-6">
      <p className="label-text">{label}</p>
      <p className="heading-2 mt-2">{value}</p>
    </div>
  );
}

function resolveMenuItemPreview(item: StaffMenuItem | null | undefined, index = 0) {
  const candidate = item?.images.find((image) => image.primaryImage)?.imageUrl
    ?? item?.images[0]?.imageUrl
    ?? item?.images.find((image) => image.primaryImage)?.path
    ?? item?.images[0]?.path;
  if (candidate && (/^https?:\/\//i.test(candidate) || candidate.startsWith('/'))) {
    return candidate;
  }

  return DISH_PREVIEW_IMAGES[Math.abs(index) % DISH_PREVIEW_IMAGES.length];
}

function buildThumbnailStrip(item: StaffMenuItem | null, primaryImage: string) {
  const persisted = (item?.images ?? [])
    .map((image) => image.imageUrl || image.path)
    .filter((path) => /^https?:\/\//i.test(path) || path.startsWith('/'));
  return [...new Set([primaryImage, ...persisted, ...DISH_PREVIEW_IMAGES])].slice(0, 3);
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return 'Vừa cập nhật';
  }

  const diffInMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffInMinutes < 1) {
    return 'Vừa xong';
  }
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.round(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(timestamp));
}

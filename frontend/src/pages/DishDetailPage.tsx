import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { publicApi } from '../lib/api';
import { isNewMenuItem, resolveMenuItemImage } from '../lib/publicMenu';
import { ErrorState, LoadingState } from './PagePrimitives';
import { formatDateTime, formatMoney } from './pageUtils';

function DishDetailNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-3" to="/">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-xs font-bold uppercase tracking-[0.24em] text-white">
            TCA
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight text-slate-900">The Culinary Architect</p>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Chi tiết sản phẩm</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link className="text-sm font-medium text-slate-600 transition hover:text-emerald-700" to="/menu">Thực đơn</Link>
          <Link className="text-sm font-medium text-slate-600 transition hover:text-emerald-700" to="/book">Đặt bàn</Link>
          <a className="text-sm font-medium text-slate-600 transition hover:text-emerald-700" href="#product-meta">Thông tin</a>
          <a className="text-sm font-medium text-slate-600 transition hover:text-emerald-700" href="#product-timeline">Dòng thời gian</a>
        </nav>

        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700" type="button">
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
          </button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700" type="button">
            <span className="material-symbols-outlined text-[20px]">person</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: 'emerald' | 'slate' | 'amber' | 'rose' }) {
  const toneClass = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-200 bg-slate-100 text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
  }[tone];

  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClass}`}>{label}</span>;
}

export function DishDetailPage() {
  const params = useParams<{ menuItemId: string }>();
  const menuItemId = Number(params.menuItemId);

  const dishQuery = useQuery({
    queryKey: ['public-menu-item', menuItemId],
    queryFn: () => publicApi.menuItem(menuItemId),
    enabled: Number.isFinite(menuItemId),
  });

  const item = dishQuery.data;
  const imageUrl = item ? resolveMenuItemImage(item) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <DishDetailNav />

      <main className="mx-auto max-w-7xl px-4 pb-14 pt-28 sm:px-6 lg:px-8">
        {dishQuery.isLoading ? <LoadingState label="Đang tải chi tiết sản phẩm" /> : null}
        {dishQuery.error ? <ErrorState error={dishQuery.error} /> : null}

        {item ? (
          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <section className="space-y-5 lg:col-span-7">
              <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
                {imageUrl ? (
                  <img alt={item.name} className="aspect-[4/3] w-full object-cover" src={imageUrl} />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_38%),linear-gradient(135deg,#ffffff_0%,#f0fdf4_52%,#ecfeff_100%)] px-8 text-center">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.categoryName}</p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{item.name}</p>
                    </div>
                  </div>
                )}

                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  {item.featured ? <StatusBadge label="Nổi bật" tone="emerald" /> : null}
                  {item.promotional ? <StatusBadge label="Khuyến mãi" tone="amber" /> : null}
                  {isNewMenuItem(item) ? <StatusBadge label="Món mới" tone="slate" /> : null}
                </div>
              </div>

              <div id="product-meta" className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MetaCard label="ID" value={String(item.id)} />
                <MetaCard label="Mã món" value={item.code} />
                <MetaCard label="Danh mục" value={item.categoryName} />
                <MetaCard label="Giá bán" value={formatMoney(item.price)} />
              </div>
            </section>

            <section className="space-y-5 lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">{item.categoryName}</p>
                <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{item.name}</h1>
                <p className="mt-4 text-3xl font-bold text-emerald-700">{formatMoney(item.price)}</p>
                <p className="mt-5 text-sm leading-7 text-slate-600">
                  {item.description?.trim() || 'Sản phẩm hiện chưa có mô tả công khai.'}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <StatusBadge label={item.available ? 'Đang phục vụ' : 'Tạm hết món'} tone={item.available ? 'emerald' : 'rose'} />
                  <StatusBadge label={item.active ? 'Đang hiển thị' : 'Ngừng hiển thị'} tone={item.active ? 'slate' : 'rose'} />
                  {item.featured ? <StatusBadge label="Featured" tone="emerald" /> : null}
                  {item.promotional ? <StatusBadge label="Promotion" tone="amber" /> : null}
                </div>
              </div>

              <div id="product-timeline" className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Dòng thời gian</p>
                <div className="mt-4 space-y-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tạo lúc</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cập nhật gần nhất</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatDateTime(item.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}

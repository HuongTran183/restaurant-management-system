import clsx from 'clsx';
import type { FormEvent, ReactNode } from 'react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import {
  ApiError,
  authApi,
  type PaymentMethod,
  publicApi,
  staffApi,
  type AuthSession,
  type DiningTable,
  type MenuItem,
  type PublicMenu,
  type Reservation,
  type ReservationStatus,
  type ServiceRequestType,
  type TableSession,
  type ServiceRequest,
  type ServiceRequestStatus,
} from './lib/api';
import { CashierWorkbench } from './components/CashierWorkbench';
import { FloorOverview, type FloorOverviewActionState } from './components/FloorOverview';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { clearSession, msUntilSessionRefresh, readSession, saveSession, shouldRefreshSession } from './lib/session';
import i18n from './i18n/i18n';

const initialSession = typeof window === 'undefined' ? null : readSession();

export default function App() {
  const { t } = useTranslation();
  const [session, setSession] = useState<AuthSession | null>(initialSession);
  const [isSessionReady, setIsSessionReady] = useState(initialSession === null);

  function updateSession(nextSession: AuthSession | null) {
    setSession(nextSession);
    if (nextSession) {
      saveSession(nextSession);
      return;
    }
    clearSession();
  }

  async function refreshCurrentSession(currentSession: AuthSession): Promise<AuthSession | null> {
    try {
      const nextSession = await authApi.refresh(currentSession.refreshToken);
      updateSession(nextSession);
      return nextSession;
    } catch {
      updateSession(null);
      return null;
    }
  }

  useEffect(() => {
    let active = true;

    if (!session) {
      setIsSessionReady(true);
      return () => {
        active = false;
      };
    }

    if (!shouldRefreshSession(session)) {
      setIsSessionReady(true);
      return () => {
        active = false;
      };
    }

    setIsSessionReady(false);
    void refreshCurrentSession(session).finally(() => {
      if (active) {
        setIsSessionReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, [session?.accessTokenExpiresAt, session?.refreshToken]);

  useEffect(() => {
    if (!session || shouldRefreshSession(session)) {
      return;
    }

    const delay = msUntilSessionRefresh(session);
    if (delay === null) {
      return;
    }

    const handle = window.setTimeout(() => {
      void refreshCurrentSession(session);
    }, delay);

    return () => {
      window.clearTimeout(handle);
    };
  }, [session?.accessTokenExpiresAt, session?.refreshToken]);

  return (
    <div className="min-h-screen bg-mesh text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-sm font-bold uppercase tracking-[0.24em] text-cream">
              RMS
            </div>
            <div>
              <p className="font-display text-2xl leading-none">Restaurant OS</p>
              <p className="text-sm text-slate">{t('POS, QR dining, and booking in one orbit')}</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-2 md:flex">
              <TopNavLink to="/">{t('Menu')}</TopNavLink>
              <TopNavLink to="/book">{t('Reservations')}</TopNavLink>
              <TopNavLink to="/staff">{t('STAFF')}</TopNavLink>
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/book" element={<ReservationPage />} />
          <Route path="/qr/:token" element={<QrExperiencePage />} />
          <Route path="/staff/login" element={<StaffLoginPage onSignedIn={updateSession} session={session} isSessionReady={isSessionReady} />} />
          <Route
            path="/staff"
            element={
              <ProtectedRoute session={session} isSessionReady={isSessionReady}>
                <StaffDashboardPage
                  session={session}
                  onLogout={() => updateSession(null)}
                  onRefreshSession={refreshCurrentSession}
                />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function HomePage() {
  useTranslation();
  const menuQuery = useQuery({ queryKey: ['public-menu'], queryFn: publicApi.menu });
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const filteredItems = filterMenuItems(menuQuery.data, deferredSearch);

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="panel overflow-hidden px-6 py-8 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="space-y-5">
            <span className="inline-flex rounded-full border border-forest/15 bg-forest/5 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-forest">
              {i18n.t('Floor control without the clipboard chaos')}
            </span>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              {i18n.t('A restaurant cockpit for the dining room, the QR table, and the host desk.')}
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate">
              {i18n.t(
                'The backend is now wired for public menu browsing, QR orders, service requests, and reservation workflows. This frontend gives the team one place to demo those flows end-to-end.',
              )}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" to="/book">
                {i18n.t('Book a table')}
              </Link>
              <Link className="button-secondary" to="/staff/login">
                {i18n.t('Staff console')}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <MetricCard label={i18n.t('Categories')} value={String(menuQuery.data?.categories.length ?? 0)} tone="forest" />
            <MetricCard label={i18n.t('Live dishes')} value={String(menuQuery.data?.items.length ?? 0)} tone="ember" />
            <div className="rounded-[28px] border border-ink/10 bg-white/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">API health</p>
              <p className="mt-3 font-display text-2xl text-ink">{menuQuery.data?.restaurantName ?? i18n.t('Connecting...')}</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                {i18n.t('Public menu endpoint: {{state}}.', {
                  state: menuQuery.isSuccess ? i18n.t('connected') : menuQuery.isPending ? i18n.t('loading') : i18n.t('needs backend'),
                })}
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="panel px-6 py-8 sm:px-8">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Demo shortcuts')}</p>
            <h2 className="mt-2 font-display text-3xl text-ink">{i18n.t('Try the MVP loops')}</h2>
          </div>
          <div className="grid gap-4">
            <ShortcutCard
              title={i18n.t('Public booking')}
              body={i18n.t(
                'Create, lookup, and cancel a reservation through the same public contract the mobile site will use.',
              )}
              to="/book"
            />
            <ShortcutCard
              title={i18n.t('Staff dashboard')}
              body={i18n.t(
                'Login with the seeded admin account and inspect orders, reservations, service requests, invoices, and payments.',
              )}
              to="/staff/login"
            />
            <div className="rounded-[28px] border border-dashed border-forest/25 bg-forest/5 p-5 text-sm leading-7 text-slate">
              {i18n.t(
                'For the QR flow, seed a table, menu items, and a QR entry first; generated QR landing URLs should point at',
              )}
              {' '}
              <code>/qr/&lt;token&gt;</code>.
            </div>
          </div>
        </div>
      </aside>

      <section className="panel px-6 py-8 sm:px-8 lg:col-span-2">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Public menu')}</p>
            <h2 className="mt-2 font-display text-3xl text-ink">{i18n.t('Signature dishes ready for QR ordering')}</h2>
          </div>
          <label className="relative block lg:w-[22rem]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Search')}</span>
            <input
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={i18n.t('Search for dishes or categories')}
            />
          </label>
        </div>

        {menuQuery.isLoading ? <LoadingState label={i18n.t('Loading menu')} /> : null}
        {menuQuery.error ? <ErrorState error={menuQuery.error} /> : null}

        {menuQuery.data ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-3">
              {menuQuery.data.categories.map((category) => (
                <div key={category.id} className="rounded-[22px] border border-ink/10 bg-white/65 px-4 py-3">
                  <p className="font-semibold text-ink">{category.name}</p>
                  <p className="text-sm leading-6 text-slate">
                    {category.description || i18n.t('A curated station for the dining room.')}
                  </p>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article key={item.id} className="rounded-[28px] border border-ink/10 bg-white/75 p-5 shadow-float">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-ember">{item.categoryName}</p>
                      <h3 className="mt-2 font-display text-2xl text-ink">{item.name}</h3>
                    </div>
                    <span className="rounded-full bg-sun/30 px-3 py-1 text-sm font-semibold text-forest">{formatMoney(item.price)}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate">
                    {item.description || i18n.t('Built for quick service, QR browsing, and direct cashier handoff.')}
                  </p>
                </article>
              ))}
              {!filteredItems.length ? (
                <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/65 p-6 text-sm leading-7 text-slate md:col-span-2 xl:col-span-3">
                  {i18n.t('No dishes match this search yet.')}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
function ReservationPage() {
  useTranslation();
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    partySize: '2',
    reservationTime: nextReservationSlot(),
    requestedArea: '',
    note: '',
  });
  const [lookupInput, setLookupInput] = useState('');
  const [activeLookup, setActiveLookup] = useState('');
  const [cancelNote, setCancelNote] = useState('');

  const createReservationMutation = useMutation({
    mutationFn: () =>
      publicApi.createReservation({
        customerName: form.customerName,
        phone: form.phone,
        email: form.email || undefined,
        partySize: Number(form.partySize),
        reservationTime: new Date(form.reservationTime).toISOString(),
        requestedArea: form.requestedArea || undefined,
        note: form.note || undefined,
      }),
    onSuccess: (reservation) => {
      setActiveLookup(reservation.reservationCode);
      setLookupInput(reservation.reservationCode);
      setCancelNote('');
    },
  });

  const lookupQuery = useQuery({
    queryKey: ['reservation-lookup', activeLookup],
    queryFn: () => publicApi.getReservation(activeLookup),
    enabled: activeLookup.length > 0,
  });

  const cancelReservationMutation = useMutation({
    mutationFn: () => publicApi.cancelReservation(activeLookup, cancelNote || i18n.t('Cancelled from public app')),
    onSuccess: () => {
      void lookupQuery.refetch();
    },
  });

  function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createReservationMutation.mutate();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="panel px-6 py-8 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Public booking flow')}</p>
        <h1 className="mt-3 font-display text-4xl text-ink">{i18n.t('Reserve a table without calling the host stand.')}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
          {i18n.t(
            'This screen speaks directly to the new public reservation endpoints: create a reservation, pull it back by code, and cancel it when plans change.',
          )}
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={submitReservation}>
          <Field label={i18n.t('Guest name')}>
            <input className="field" required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
          </Field>
          <Field label={i18n.t('Phone')}>
            <input className="field" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label={i18n.t('Email')}>
            <input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label={i18n.t('Party size')}>
            <input className="field" min="1" type="number" value={form.partySize} onChange={(event) => setForm({ ...form, partySize: event.target.value })} />
          </Field>
          <Field label={i18n.t('Arrival time')}>
            <input className="field" required type="datetime-local" value={form.reservationTime} onChange={(event) => setForm({ ...form, reservationTime: event.target.value })} />
          </Field>
          <Field label={i18n.t('Preferred area')}>
            <input
              className="field"
              value={form.requestedArea}
              onChange={(event) => setForm({ ...form, requestedArea: event.target.value })}
              placeholder={i18n.t('Patio, bar, private room...')}
            />
          </Field>
          <Field label={i18n.t('Notes')} className="md:col-span-2">
            <textarea className="field min-h-28" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button className="button-primary" disabled={createReservationMutation.isPending} type="submit">
              {createReservationMutation.isPending ? i18n.t('Creating...') : i18n.t('Create reservation')}
            </button>
            {createReservationMutation.error ? <InlineError error={createReservationMutation.error} /> : null}
          </div>
        </form>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Lookup and cancel')}</p>
        <h2 className="mt-3 font-display text-3xl text-ink">{i18n.t('Keep the code, manage the booking.')}</h2>
        <div className="mt-6 flex gap-3">
          <input
            className="field"
            value={lookupInput}
            onChange={(event) => setLookupInput(event.target.value.toUpperCase())}
            placeholder={i18n.t('RES-XXXX')}
          />
          <button className="button-secondary" onClick={() => setActiveLookup(lookupInput.trim())} type="button">
            {i18n.t('Find')}
          </button>
        </div>

        {lookupQuery.isLoading ? <LoadingState label={i18n.t('Looking up reservation')} /> : null}
        {lookupQuery.error ? <ErrorState error={lookupQuery.error} /> : null}

        {lookupQuery.data ? (
          <div className="mt-6 space-y-4 rounded-[28px] border border-ink/10 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-forest">{lookupQuery.data.reservationCode}</p>
                <h3 className="mt-2 font-display text-2xl text-ink">{lookupQuery.data.customerName}</h3>
              </div>
              <StatusPill tone={lookupQuery.data.status === 'CANCELLED' ? 'warm' : lookupQuery.data.status === 'COMPLETED' ? 'neutral' : 'forest'}>
                {i18n.t(lookupQuery.data.status)}
              </StatusPill>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoPair label={i18n.t('Arrival')} value={formatDateTime(lookupQuery.data.reservationTime)} />
              <InfoPair label={i18n.t('Party')} value={`${lookupQuery.data.partySize} ${i18n.t('guests')}`} />
              <InfoPair label={i18n.t('Phone')} value={lookupQuery.data.phone} />
              <InfoPair label={i18n.t('Requested area')} value={lookupQuery.data.requestedArea || i18n.t('No preference')} />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Cancel note')}</span>
              <textarea className="field min-h-24" value={cancelNote} onChange={(event) => setCancelNote(event.target.value)} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="button-primary"
                disabled={lookupQuery.data.status === 'CANCELLED' || lookupQuery.data.status === 'COMPLETED' || lookupQuery.data.status === 'CHECKED_IN' || cancelReservationMutation.isPending}
                onClick={() => cancelReservationMutation.mutate()}
                type="button"
              >
                {cancelReservationMutation.isPending ? i18n.t('Cancelling...') : i18n.t('Cancel reservation')}
              </button>
              {cancelReservationMutation.error ? <InlineError error={cancelReservationMutation.error} /> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function QrExperiencePage() {
  useTranslation();
  const { token = '' } = useParams();
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [activeOrderCode, setActiveOrderCode] = useState('');
  const deferredSearch = useDeferredValue(search);

  const tableQuery = useQuery({
    queryKey: ['qr-table', token],
    queryFn: () => publicApi.qrTable(token),
    enabled: token.length > 0,
  });
  const menuQuery = useQuery({ queryKey: ['public-menu'], queryFn: publicApi.menu });
  const orderQuery = useQuery({
    queryKey: ['public-order', activeOrderCode],
    queryFn: () => publicApi.getOrder(activeOrderCode),
    enabled: activeOrderCode.length > 0,
    refetchInterval: 10000,
  });

  const submitOrderMutation = useMutation({
    mutationFn: () =>
      publicApi.submitQrOrder(token, {
        note,
        items: selectedMenuItems(menuQuery.data?.items ?? [], quantities),
      }),
    onSuccess: (order) => {
      setActiveOrderCode(order.orderCode);
      setQuantities({});
    },
  });

  const serviceRequestMutation = useMutation({
    mutationFn: (requestType: ServiceRequestType) =>
      publicApi.requestService(token, {
        orderCode: activeOrderCode || undefined,
        requestType,
        note:
          requestType === 'REQUEST_BILL'
            ? i18n.t('Customer requested the bill from QR flow')
            : i18n.t('Customer requested assistance from QR flow'),
      }),
  });

  const filteredItems = filterMenuItems(menuQuery.data, deferredSearch);
  const cartItems = selectedMenuItems(menuQuery.data?.items ?? [], quantities);
  const currentOrder = orderQuery.data ?? submitOrderMutation.data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <section className="panel px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-5 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('QR dining')}</p>
            <h1 className="mt-2 font-display text-4xl text-ink">{i18n.t('Table-side ordering, without waiting for a paper pad.')}</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate">
              {i18n.t(
                'Resolve the QR token, open a table session on first interaction, stack dishes into the active QR order, then call for service or the bill.',
              )}
            </p>
          </div>
          <label className="block lg:w-[20rem]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Filter dishes')}</span>
            <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={i18n.t('Find noodles, tea, desserts...')} />
          </label>
        </div>

        {tableQuery.isLoading || menuQuery.isLoading ? <LoadingState label={i18n.t('Loading QR menu')} /> : null}
        {tableQuery.error ? <ErrorState error={tableQuery.error} /> : null}
        {menuQuery.error ? <ErrorState error={menuQuery.error} /> : null}

        {tableQuery.data ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard label={i18n.t('Table')} value={tableQuery.data.tableName} detail={tableQuery.data.tableCode} />
            <InfoCard label={i18n.t('Area')} value={tableQuery.data.areaName} detail={tableQuery.data.tableStatus} />
            <InfoCard
              label={i18n.t('Session')}
              value={tableQuery.data.openTableSessionId ? `#${tableQuery.data.openTableSessionId}` : i18n.t('Will open on first order')}
              detail={i18n.t('Auto-opened on demand')}
            />
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const quantity = quantities[item.id] ?? 0;
            return (
              <article key={item.id} className="rounded-[28px] border border-ink/10 bg-white/75 p-5 shadow-float">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-ember">{item.categoryName}</p>
                    <h3 className="mt-2 font-display text-2xl text-ink">{item.name}</h3>
                  </div>
                  <span className="rounded-full bg-sun/30 px-3 py-1 text-sm font-semibold text-forest">{formatMoney(item.price)}</span>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate">{item.description || i18n.t('Built for quick table-side ordering.')}</p>
                <div className="mt-5 flex items-center justify-between gap-3 rounded-[20px] border border-ink/10 bg-cream/70 px-3 py-2">
                  <button className="counter-button" onClick={() => setQuantities({ ...quantities, [item.id]: Math.max(0, quantity - 1) })} type="button">
                    -
                  </button>
                  <span className="text-lg font-semibold text-ink">{quantity}</span>
                  <button className="counter-button" onClick={() => setQuantities({ ...quantities, [item.id]: quantity + 1 })} type="button">
                    +
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="panel sticky top-24 flex h-fit flex-col gap-5 px-5 py-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Current cart')}</p>
          <h2 className="mt-2 font-display text-3xl text-ink">{i18n.t('Ready for the kitchen')}</h2>
        </div>

        <div className="space-y-3">
          {cartItems.length ? (
            cartItems.map((item) => (
              <div key={item.menuItemId} className="rounded-[22px] border border-ink/10 bg-white/75 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink">{findMenuItemName(menuQuery.data?.items ?? [], item.menuItemId)}</p>
                  <span className="text-sm text-slate">x{item.quantity}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">
              {i18n.t('Add items to the cart to create or extend the QR order.')}
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Order note')}</span>
          <textarea
            className="field min-h-28"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={i18n.t('Less spicy, split plates, no peanuts...')}
          />
        </label>

        <button className="button-primary w-full justify-center" disabled={!cartItems.length || submitOrderMutation.isPending} onClick={() => submitOrderMutation.mutate()} type="button">
          {submitOrderMutation.isPending ? i18n.t('Sending...') : i18n.t('Send QR order')}
        </button>
        {submitOrderMutation.error ? <InlineError error={submitOrderMutation.error} /> : null}

        {currentOrder ? (
          <div className="rounded-[24px] bg-forest p-5 text-cream shadow-float">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cream/70">{i18n.t('Active order')}</p>
            <p className="mt-2 font-display text-2xl">{currentOrder.orderCode}</p>
            <p className="mt-2 text-sm text-cream/80">
              {i18n.t('Status:')} {i18n.t(currentOrder.status)}
            </p>
            <p className="mt-4 text-sm text-cream/80">
              {i18n.t('Total:')} {formatMoney(currentOrder.totalAmount)}
            </p>
            <div className="mt-5 grid gap-3">
              <button className="button-ghost-light" onClick={() => serviceRequestMutation.mutate('CALL_WAITER')} type="button">
                {i18n.t('Call waiter')}
              </button>
              <button className="button-ghost-light" onClick={() => serviceRequestMutation.mutate('REQUEST_BILL')} type="button">
                {i18n.t('Request bill')}
              </button>
            </div>
            {serviceRequestMutation.isSuccess ? <p className="mt-4 text-sm text-cream/80">{i18n.t('Service request sent.')}</p> : null}
            {serviceRequestMutation.error ? <InlineError error={serviceRequestMutation.error} light /> : null}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
function StaffLoginPage({
  onSignedIn,
  session,
  isSessionReady,
}: {
  onSignedIn: (session: AuthSession | null) => void;
  session: AuthSession | null;
  isSessionReady: boolean;
}) {
  useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: 'admin', password: 'Admin@123456' });

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: (nextSession) => {
      onSignedIn(nextSession);
      void navigate('/staff');
    },
  });

  if (session && isSessionReady) {
    return <Navigate to="/staff" replace />;
  }

  return (
    <section className="panel mx-auto max-w-xl px-6 py-8 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Staff access')}</p>
      <h1 className="mt-3 font-display text-4xl text-ink">{i18n.t('Sign in to the floor console.')}</h1>
      <p className="mt-4 text-base leading-8 text-slate">
        {i18n.t('Use the seeded admin account to review the new staff-facing list endpoints from the browser.')}
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          loginMutation.mutate();
        }}
      >
        <Field label={i18n.t('Username')}>
          <input className="field" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </Field>
        <Field label={i18n.t('Password')}>
          <input className="field" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <div className="flex items-center gap-3">
          <button className="button-primary" disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? i18n.t('Signing in...') : i18n.t('Open staff dashboard')}
          </button>
          {loginMutation.error ? <InlineError error={loginMutation.error} /> : null}
        </div>
      </form>
    </section>
  );
}

type ReservationActionInput =
  | { reservationId: number; kind: 'confirm'; internalNote?: string }
  | { reservationId: number; kind: 'cancel'; note?: string }
  | { reservationId: number; kind: 'check-in'; diningTableId: number; internalNote?: string }
  | { reservationId: number; kind: 'complete' };

type OrderActionInput = { orderId: number; kind: 'confirm' | 'cancel' };

type PaymentInput = { invoiceId: number; amount: number; method: PaymentMethod; note?: string };

type InvoiceCreationInput = { orderId: number; orderCode: string };

type FloorActionInput =
  | { kind: 'open-session'; table: DiningTable }
  | { kind: 'close-session'; session: TableSession; table: DiningTable }
  | { kind: 'seat-walk-in'; table: DiningTable };

type ReservationQueueScope = 'ACTIVE' | 'HISTORY' | 'ALL';
type ReservationHostFilter = 'ALL' | 'NEEDS_TABLE' | 'NEXT_SERVICE' | 'LARGE_PARTY';
type WorkspaceLane = 'ALL' | 'FLOOR' | 'BILLING';

const ACTIVE_RESERVATION_STATUSES: ReservationStatus[] = ['PENDING', 'CONFIRMED', 'CHECKED_IN'];
const HISTORY_RESERVATION_STATUSES: ReservationStatus[] = ['COMPLETED', 'CANCELLED'];
const ALL_RESERVATION_STATUSES: ReservationStatus[] = [...ACTIVE_RESERVATION_STATUSES, ...HISTORY_RESERVATION_STATUSES];

function StaffDashboardPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  useTranslation();
  const queryClient = useQueryClient();
  const userRoles = session?.user.roles ?? [];
  const canManageFloor = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');
  const canManageBilling = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'CASHIER');
  const [workspaceLane, setWorkspaceLane] = useState<WorkspaceLane>(
    canManageFloor && canManageBilling ? 'ALL' : canManageFloor ? 'FLOOR' : 'BILLING',
  );
  const [reservationQueueScope, setReservationQueueScope] = useState<ReservationQueueScope>('ACTIVE');
  const [reservationHostFilter, setReservationHostFilter] = useState<ReservationHostFilter>('ALL');
  const [reservationAreaFilter, setReservationAreaFilter] = useState('ALL');
  const [reservationSearch, setReservationSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSessionFilter, setOrderSessionFilter] = useState<number | null>(null);
  const [floorActionState, setFloorActionState] = useState<FloorOverviewActionState>(null);
  const reservationPanelRef = useRef<HTMLDivElement | null>(null);
  const workbenchPanelRef = useRef<HTMLDivElement | null>(null);
  const showLaneSwitcher = canManageFloor && canManageBilling;
  const showFloorLane = canManageFloor && workspaceLane !== 'BILLING';
  const showBillingLane = canManageBilling && workspaceLane !== 'FLOOR';
  const activeLaneTitle = describeWorkspaceLane(workspaceLane, canManageFloor, canManageBilling);
  const activeLaneBody = describeWorkspaceLaneBody(workspaceLane, canManageFloor, canManageBilling);
  const workbenchTitle = showFloorLane && showBillingLane
    ? i18n.t('Operations workbench')
    : showFloorLane
      ? i18n.t('Floor workbench')
      : i18n.t('Billing workbench');
  const workbenchSubtitle = showFloorLane && showBillingLane
    ? i18n.t('Handle order confirmations and billing actions from one surface.')
    : showFloorLane
      ? i18n.t('Keep dine-in tickets, sessions, and floor follow-up moving from one place.')
      : i18n.t('Collect payment, reconcile invoices, and close the cashier loop from one place.');

  useEffect(() => {
    setWorkspaceLane((current) => {
      if (canManageFloor && canManageBilling) {
        return current === 'FLOOR' || current === 'BILLING' || current === 'ALL' ? current : 'ALL';
      }

      if (canManageFloor) {
        return 'FLOOR';
      }

      if (canManageBilling) {
        return 'BILLING';
      }

      return 'ALL';
    });
  }, [canManageBilling, canManageFloor]);

  const scrollToPanel = (ref: { current: HTMLDivElement | null }) => {
    window.requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const focusReservationWorkflow = (reservation: Reservation) => {
    setReservationQueueScope(
      reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED'
        ? 'HISTORY'
        : 'ACTIVE',
    );
    setReservationHostFilter('ALL');
    setReservationAreaFilter('ALL');
    setReservationSearch(reservation.reservationCode);
    scrollToPanel(reservationPanelRef);
  };

  const focusOrderWorkflow = (options: { orderCode?: string; sessionId: number }) => {
    setOrderSessionFilter(options.sessionId);
    setOrderSearch(options.orderCode ?? '');
    scrollToPanel(workbenchPanelRef);
  };

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

  const loadReservationsByStatuses = async (
    statuses: ReservationStatus[],
    query?: string,
    scope: ReservationQueueScope = 'ACTIVE',
  ): Promise<Reservation[]> => {
    const keyword = query?.trim() || undefined;
    const pages = await Promise.all(
      statuses.map((status) =>
        loadAllPages((token, page, size) => staffApi.reservations(token, { page, size, status, query: keyword })),
      ),
    );

    const direction = scope === 'HISTORY' ? -1 : 1;
    return pages
      .flat()
      .filter((reservation, index, reservations) => reservations.findIndex((candidate) => candidate.id === reservation.id) === index)
      .sort(
        (left, right) =>
          direction * (new Date(left.reservationTime).getTime() - new Date(right.reservationTime).getTime()),
      );
  };

  const dashboardQuery = useQuery({
    queryKey: ['staff', 'dashboard', session?.accessToken, showFloorLane, showBillingLane],
    queryFn: () => runStaffRequest((token) => staffApi.dashboard(token, { canManageFloor: showFloorLane, canManageBilling: showBillingLane })),
    enabled: Boolean(session?.accessToken) && (showFloorLane || showBillingLane),
    retry: false,
  });

  const reservationsQuery = useQuery({
    queryKey: ['staff', 'reservations', session?.accessToken, reservationQueueScope, reservationSearch],
    queryFn: () => {
      const statuses =
        reservationQueueScope === 'ACTIVE'
          ? ACTIVE_RESERVATION_STATUSES
          : reservationQueueScope === 'HISTORY'
            ? HISTORY_RESERVATION_STATUSES
            : ALL_RESERVATION_STATUSES;
      return loadReservationsByStatuses(statuses, reservationSearch, reservationQueueScope);
    },
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const floorReservationsQuery = useQuery({
    queryKey: ['staff', 'floor-reservations', session?.accessToken],
    queryFn: () => loadReservationsByStatuses(ACTIVE_RESERVATION_STATUSES),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ['staff', 'service-requests', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.serviceRequests(token, { size: 20, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const staffMenuQuery = useQuery({
    queryKey: ['staff', 'menu-items'],
    queryFn: publicApi.menu,
    enabled: showFloorLane,
    retry: false,
  });

  const tablesQuery = useQuery({
    queryKey: ['staff', 'tables', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tables(token, { page, size, active: true, status: 'AVAILABLE' })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const floorTablesQuery = useQuery({
    queryKey: ['staff', 'floor-tables', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tables(token, { page, size, active: true })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const tableSessionsQuery = useQuery({
    queryKey: ['staff', 'table-sessions', session?.accessToken],
    queryFn: () => loadAllPages((token, page, size) => staffApi.tableSessions(token, { page, size, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ['staff', 'orders', session?.accessToken, orderSearch, orderSessionFilter],
    queryFn: () =>
      runStaffRequest((token) =>
        staffApi.orders(token, {
          size: orderSessionFilter === null && orderSearch.trim() === '' ? 12 : 30,
          tableSessionId: orderSessionFilter ?? undefined,
          query: orderSearch.trim() || undefined,
        }),
      ),
    enabled: Boolean(session?.accessToken) && showFloorLane,
    retry: false,
  });

  const invoicesQuery = useQuery({
    queryKey: ['staff', 'invoices', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.invoices(token, { size: 10 })),
    enabled: Boolean(session?.accessToken) && showBillingLane,
    retry: false,
  });

  const paymentsQuery = useQuery({
    queryKey: ['staff', 'payments', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.payments(token, { size: 10 })),
    enabled: Boolean(session?.accessToken) && showBillingLane,
    retry: false,
  });

  const [invoicePresenceByOrderId, setInvoicePresenceByOrderId] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!showBillingLane) {
      setInvoicePresenceByOrderId({});
      return;
    }

    const visibleOrders = ordersQuery.data?.content ?? [];
    if (!visibleOrders.length) {
      setInvoicePresenceByOrderId({});
      return;
    }

    const recentInvoiceOrderIds = new Set((invoicesQuery.data?.content ?? []).map((invoice) => invoice.orderId));
    const ordersNeedingLookup = visibleOrders.filter((order) => !recentInvoiceOrderIds.has(order.id));
    let active = true;

    void Promise.all(
      ordersNeedingLookup.map(async (order) => {
        const existingInvoices = await runStaffRequest((token) => staffApi.invoices(token, { size: 1, orderId: order.id }));
        return [order.id, existingInvoices.content.some((invoice) => invoice.orderId === order.id)] as const;
      }),
    )
      .then((results) => {
        if (!active) {
          return;
        }

        const nextPresence: Record<number, boolean> = {};
        visibleOrders.forEach((order) => {
          nextPresence[order.id] = recentInvoiceOrderIds.has(order.id);
        });
        results.forEach(([orderId, hasInvoice]) => {
          nextPresence[orderId] = hasInvoice;
        });
        setInvoicePresenceByOrderId(nextPresence);
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setInvoicePresenceByOrderId((current) => {
          const nextPresence: Record<number, boolean> = {};
          visibleOrders.forEach((order) => {
            if (recentInvoiceOrderIds.has(order.id)) {
              nextPresence[order.id] = true;
            } else if (current[order.id] !== undefined) {
              nextPresence[order.id] = current[order.id];
            }
          });
          return nextPresence;
        });
      });

    return () => {
      active = false;
    };
  }, [showBillingLane, invoicesQuery.data, ordersQuery.data]);

  const reservationActionMutation = useMutation({
    mutationFn: (action: ReservationActionInput) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmReservation(token, action.reservationId, { internalNote: action.internalNote });
          case 'cancel':
            return staffApi.cancelReservation(token, action.reservationId, { note: action.note });
          case 'check-in':
            return staffApi.checkInReservation(token, action.reservationId, {
              diningTableId: action.diningTableId,
              internalNote: action.internalNote,
            });
          case 'complete':
            return staffApi.completeReservation(token, action.reservationId);
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const floorActionMutation = useMutation({
    mutationFn: (action: FloorActionInput) =>
      runStaffRequest(async (token) => {
        switch (action.kind) {
          case 'open-session': {
            const sessionResponse = await staffApi.openTableSession(token, action.table.id);
            return { kind: action.kind, session: sessionResponse, table: action.table } as const;
          }
          case 'close-session': {
            const sessionResponse = await staffApi.closeTableSession(token, action.session.id);
            return { kind: action.kind, session: sessionResponse, table: action.table } as const;
          }
          case 'seat-walk-in': {
            const sessionResponse = await staffApi.openTableSession(token, action.table.id);
            const order = await staffApi.createOrder(token, {
              orderType: 'DINE_IN',
              tableSessionId: sessionResponse.id,
              note: `Walk-in started from ${action.table.code}`,
            });
            return { kind: action.kind, order, session: sessionResponse, table: action.table } as const;
          }
        }
      }),
    onMutate: (action) => {
      setFloorActionState({ kind: action.kind, tableId: action.table.id });
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });

      if (result.kind === 'close-session') {
        setOrderSessionFilter((current) => (current === result.session.id ? null : current));
        return;
      }

      if (result.kind === 'open-session') {
        focusOrderWorkflow({ sessionId: result.session.id });
        return;
      }

      focusOrderWorkflow({ orderCode: result.order.orderCode, sessionId: result.session.id });
    },
    onSettled: () => {
      setFloorActionState(null);
    },
  });

  const createStaffOrderMutation = useMutation({
    mutationFn: (payload: { note?: string; tableSessionId: number }) =>
      runStaffRequest((token) =>
        staffApi.createOrder(token, {
          orderType: 'DINE_IN',
          tableSessionId: payload.tableSessionId,
          note: payload.note,
        }),
      ),
    onSuccess: (order, payload) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      focusOrderWorkflow({ orderCode: order.orderCode, sessionId: order.tableSessionId ?? payload.tableSessionId });
    },
  });

  const serviceRequestMutation = useMutation({
    mutationFn: (requestId: number) => runStaffRequest((token) => staffApi.resolveServiceRequest(token, requestId)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const orderActionMutation = useMutation({
    mutationFn: (action: OrderActionInput) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmOrder(token, action.orderId);
          case 'cancel':
            return staffApi.cancelOrder(token, action.orderId);
        }
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const orderItemMutation = useMutation({
    mutationFn: (
      action:
        | { kind: 'add'; orderId: number; menuItemId: number; quantity: number; note?: string }
        | { kind: 'update'; orderId: number; orderItemId: number; quantity?: number; note?: string; cancelled?: boolean },
    ) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'add':
            return staffApi.addOrderItem(token, action.orderId, {
              menuItemId: action.menuItemId,
              quantity: action.quantity,
              note: action.note,
            });
          case 'update':
            return staffApi.updateOrderItem(token, action.orderId, action.orderItemId, {
              quantity: action.quantity,
              note: action.note,
              cancelled: action.cancelled,
            });
        }
      }),
    onSuccess: (order) => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
      if (order.tableSessionId !== null) {
        focusOrderWorkflow({ orderCode: order.orderCode, sessionId: order.tableSessionId });
      }
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (order: InvoiceCreationInput) =>
      runStaffRequest(async (token) => {
        const existingInvoices = await staffApi.invoices(token, { size: 1, orderId: order.orderId });
        return existingInvoices.content.find((invoice) => invoice.orderId === order.orderId)
          ?? await staffApi.createInvoice(token, order.orderId);
      }),
    onSuccess: (invoice) => {
      setInvoicePresenceByOrderId((current) => ({ ...current, [invoice.orderId]: true }));
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (payload: PaymentInput) => runStaffRequest((token) => staffApi.recordPayment(token, payload)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });

  const refreshWorkspace = () => {
    void queryClient.invalidateQueries({ queryKey: ['staff'] });
  };

  const activeSession = orderSessionFilter === null
    ? null
    : tableSessionsQuery.data?.find((sessionItem) => sessionItem.id === orderSessionFilter) ?? null;
  const visibleOrders = ordersQuery.data?.content ?? [];
  const workbenchBusy = orderActionMutation.isPending
    || orderItemMutation.isPending
    || createInvoiceMutation.isPending
    || createStaffOrderMutation.isPending
    || recordPaymentMutation.isPending;
  const workbenchOrderError = orderActionMutation.error ?? orderItemMutation.error;
  const reservationAreaOptions = useMemo(() => {
    const labels = new Set<string>();
    (reservationsQuery.data ?? []).forEach((reservation) => {
      if (reservation.requestedArea) {
        labels.add(reservation.requestedArea);
      }
    });
    return [...labels].sort((left, right) => left.localeCompare(right));
  }, [reservationsQuery.data]);
  const visibleReservations = useMemo(
    () => filterReservationQueue(reservationsQuery.data ?? [], reservationHostFilter, reservationAreaFilter),
    [reservationAreaFilter, reservationHostFilter, reservationsQuery.data],
  );
  const reservationHostSummary = useMemo(
    () => summarizeReservationQueue(visibleReservations),
    [visibleReservations],
  );
  const sessionLabelById = useMemo(() => {
    const labels: Record<number, string> = {};
    (tableSessionsQuery.data ?? []).forEach((sessionItem) => {
      labels[sessionItem.id] = `${sessionItem.tableCode} • ${sessionItem.tableName}`;
    });
    return labels;
  }, [tableSessionsQuery.data]);

  return (
    <div className="space-y-8">
      <StaffWorkspaceHero
        activeLaneBody={activeLaneBody}
        activeLaneTitle={activeLaneTitle}
        onLogout={onLogout}
        onRefreshWorkspace={refreshWorkspace}
        onWorkspaceLaneChange={(lane) => setWorkspaceLane(lane)}
        session={session}
        showLaneSwitcher={showLaneSwitcher}
        userRoles={userRoles}
        workspaceLane={workspaceLane}
      />

      {dashboardQuery.isLoading ? <LoadingState label={i18n.t('Loading dashboard summary')} /> : null}
      {dashboardQuery.error ? <ErrorState error={dashboardQuery.error} /> : null}

      {dashboardQuery.data ? (
        <section className={clsx('grid gap-4 md:grid-cols-2', showFloorLane && showBillingLane ? 'xl:grid-cols-5' : showFloorLane ? 'xl:grid-cols-3' : 'xl:grid-cols-2')}>
          {showFloorLane ? <MetricCard label={i18n.t('Orders')} value={String(dashboardQuery.data.orders.totalElements)} tone="forest" /> : null}
          {showFloorLane ? <MetricCard label={i18n.t('Reservations')} value={String(dashboardQuery.data.reservations.totalElements)} tone="ember" /> : null}
          {showFloorLane ? <MetricCard label={i18n.t('Service requests')} value={String(dashboardQuery.data.serviceRequests.totalElements)} tone="slate" /> : null}
          {showBillingLane ? <MetricCard label={i18n.t('Invoices')} value={String(dashboardQuery.data.invoices.totalElements)} tone="forest" /> : null}
          {showBillingLane ? <MetricCard label={i18n.t('Payments')} value={String(dashboardQuery.data.payments.totalElements)} tone="ember" /> : null}
        </section>
      ) : null}

      {!showFloorLane && !showBillingLane ? (
        <section className="panel px-6 py-8 sm:px-8">
          <EmptyMessage message={i18n.t('No workspace sections are available for the current role.')} />
        </section>
      ) : null}

      {showFloorLane ? (
        <DataPanel
          testId="floor-overview-panel"
          title={i18n.t('Floor overview')}
          subtitle={i18n.t('Scan the room by table, session, and active reservation before making seating moves.')}
        >
          {floorTablesQuery.isLoading ? <LoadingState label={i18n.t('Loading floor tables')} /> : null}
          {floorTablesQuery.error ? <ErrorState error={floorTablesQuery.error} /> : null}
          {tableSessionsQuery.isLoading ? <LoadingState label={i18n.t('Loading table sessions')} /> : null}
          {tableSessionsQuery.error ? <ErrorState error={tableSessionsQuery.error} /> : null}
          {floorReservationsQuery.isLoading ? <LoadingState label={i18n.t('Loading active reservations')} /> : null}
          {floorReservationsQuery.error ? <ErrorState error={floorReservationsQuery.error} /> : null}
          {floorActionMutation.error ? <div className="mt-4"><InlineError error={floorActionMutation.error} /></div> : null}
          {floorTablesQuery.data && tableSessionsQuery.data && floorReservationsQuery.data ? (
            <FloorOverview
              actionState={floorActionState}
              onCloseSession={(sessionItem, table) => floorActionMutation.mutate({ kind: 'close-session', session: sessionItem, table })}
              onJumpToOrder={(sessionItem) => focusOrderWorkflow({ sessionId: sessionItem.id })}
              onJumpToReservation={(reservation) => focusReservationWorkflow(reservation)}
              onOpenSession={(table) => floorActionMutation.mutate({ kind: 'open-session', table })}
              onSeatWalkIn={(table) => floorActionMutation.mutate({ kind: 'seat-walk-in', table })}
              reservations={floorReservationsQuery.data}
              sessions={tableSessionsQuery.data}
              tables={floorTablesQuery.data}
            />
          ) : null}
        </DataPanel>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        {showFloorLane ? (
          <>
            <div ref={reservationPanelRef}>
              <StaffReservationQueuePanel
                actionError={reservationActionMutation.error}
                availableTables={tablesQuery.data ?? []}
                areaFilter={reservationAreaFilter}
                areaOptions={reservationAreaOptions}
                hostFilter={reservationHostFilter}
                isMutating={reservationActionMutation.isPending}
                onAction={(action) => reservationActionMutation.mutate(action)}
                onAreaFilterChange={setReservationAreaFilter}
                onClearFilters={() => {
                  setReservationQueueScope('ACTIVE');
                  setReservationHostFilter('ALL');
                  setReservationAreaFilter('ALL');
                  setReservationSearch('');
                }}
                onHostFilterChange={setReservationHostFilter}
                onScopeChange={setReservationQueueScope}
                onSearchChange={setReservationSearch}
                quickSummary={reservationHostSummary}
                reservations={visibleReservations}
                reservationsError={reservationsQuery.error}
                reservationsLoading={reservationsQuery.isLoading}
                scope={reservationQueueScope}
                search={reservationSearch}
                tableOptionsError={tablesQuery.error}
                tableOptionsLoading={tablesQuery.isLoading}
              />
            </div>

            <StaffServiceRequestsPanel
              actionError={serviceRequestMutation.error}
              isLoading={serviceRequestsQuery.isLoading}
              isMutating={serviceRequestMutation.isPending}
              onResolve={(requestId) => serviceRequestMutation.mutate(requestId)}
              requests={serviceRequestsQuery.data?.content ?? []}
              requestsError={serviceRequestsQuery.error}
            />
          </>
        ) : null}

        {showFloorLane || showBillingLane ? (
          <div ref={workbenchPanelRef} className={clsx(showFloorLane && showBillingLane ? 'xl:col-span-2' : undefined)}>
            <StaffOperationsWorkbenchPanel
              activeSession={activeSession}
              canRenderWorkbench={(!showFloorLane || Boolean(ordersQuery.data)) && (!showBillingLane || Boolean(invoicesQuery.data && paymentsQuery.data))}
              createStaffOrderError={createStaffOrderMutation.error}
              createStaffOrderPending={createStaffOrderMutation.isPending}
              invoices={invoicesQuery.data?.content ?? []}
              invoicesError={invoicesQuery.error}
              invoicesLoading={invoicesQuery.isLoading}
              invoiceError={createInvoiceMutation.error}
              invoicePresenceByOrderId={invoicePresenceByOrderId}
              isBusy={workbenchBusy}
              menuItems={staffMenuQuery.data?.items ?? []}
              menuItemsLoadFailed={Boolean(staffMenuQuery.error)}
              onAddOrderItem={(payload) => orderItemMutation.mutate({ kind: 'add', ...payload })}
              onCancelOrder={(orderId) => orderActionMutation.mutate({ kind: 'cancel', orderId })}
              onClearOrderFocus={() => {
                setOrderSearch('');
                setOrderSessionFilter(null);
              }}
              onConfirmOrder={(orderId) => orderActionMutation.mutate({ kind: 'confirm', orderId })}
              onCreateInvoice={(order) => createInvoiceMutation.mutate({ orderId: order.id, orderCode: order.orderCode })}
              onCreateStaffOrder={(payload) => createStaffOrderMutation.mutate(payload)}
              onRecordPayment={(payload) => recordPaymentMutation.mutate(payload)}
              onReleaseSessionFocus={() => setOrderSessionFilter(null)}
              onUpdateOrderItem={(payload) => orderItemMutation.mutate({ kind: 'update', ...payload })}
              onUpdateOrderSearch={setOrderSearch}
              orderSearch={orderSearch}
              orderSessionFilter={orderSessionFilter}
              orders={ordersQuery.data?.content ?? []}
              ordersError={ordersQuery.error}
              ordersLoading={ordersQuery.isLoading}
              payments={paymentsQuery.data?.content ?? []}
              paymentsError={paymentsQuery.error}
              paymentsLoading={paymentsQuery.isLoading}
              paymentError={recordPaymentMutation.error}
              sessionLabelById={sessionLabelById}
              showBillingLane={showBillingLane}
              showFloorLane={showFloorLane}
              staffMenuError={staffMenuQuery.error}
              staffMenuLoading={staffMenuQuery.isLoading}
              title={workbenchTitle}
              visibleOrderCount={visibleOrders.length}
              workbenchOrderError={workbenchOrderError}
              subtitle={workbenchSubtitle}
            />
          </div>
        ) : null}

        {showFloorLane ? (
          <div className="xl:col-span-2">
            <StaffOpenTableSessionsPanel
              isLoading={tableSessionsQuery.isLoading}
              sessions={tableSessionsQuery.data ?? []}
              sessionsError={tableSessionsQuery.error}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

type ReservationQueueSummary = {
  total: number;
  needsTable: number;
  largeParty: number;
  nextService: number;
};

function StaffWorkspaceHero({
  activeLaneBody,
  activeLaneTitle,
  onLogout,
  onRefreshWorkspace,
  onWorkspaceLaneChange,
  session,
  showLaneSwitcher,
  userRoles,
  workspaceLane,
}: {
  activeLaneBody: string;
  activeLaneTitle: string;
  onLogout: () => void;
  onRefreshWorkspace: () => void;
  onWorkspaceLaneChange: (lane: WorkspaceLane) => void;
  session: AuthSession | null;
  showLaneSwitcher: boolean;
  userRoles: AuthSession['user']['roles'];
  workspaceLane: WorkspaceLane;
}) {
  return (
    <section className="panel overflow-hidden px-6 py-8 sm:px-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Staff workspace')}</p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            {i18n.t('Welcome back, {{name}}.', { name: session?.user.fullName })}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-slate">{activeLaneBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {userRoles.map((role) => (
              <RoleChip key={role} role={role} />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-[24px] border border-ink/10 bg-white/70 px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{i18n.t('Active lane')}</p>
            <p className="mt-2 font-semibold text-ink">{activeLaneTitle}</p>
            {showLaneSwitcher ? (
              <div className="mt-3 inline-flex flex-wrap rounded-full border border-ink/10 bg-cream/70 p-1">
                {(['ALL', 'FLOOR', 'BILLING'] as WorkspaceLane[]).map((lane) => (
                  <button
                    key={lane}
                    className={clsx(
                      'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition',
                      workspaceLane === lane ? 'bg-forest text-cream' : 'text-slate hover:text-ink',
                    )}
                    onClick={() => onWorkspaceLaneChange(lane)}
                    type="button"
                  >
                    {lane === 'ALL'
                      ? i18n.t('All lanes')
                      : lane === 'FLOOR'
                        ? i18n.t('Floor lane')
                        : i18n.t('Billing lane')}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="button-secondary" onClick={onRefreshWorkspace} type="button">
              {i18n.t('Refresh workspace')}
            </button>
            <button className="button-secondary" onClick={onLogout} type="button">
              {i18n.t('Log out')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function StaffReservationQueuePanel({
  actionError,
  availableTables,
  areaFilter,
  areaOptions,
  hostFilter,
  isMutating,
  onAction,
  onAreaFilterChange,
  onClearFilters,
  onHostFilterChange,
  onScopeChange,
  onSearchChange,
  quickSummary,
  reservations,
  reservationsError,
  reservationsLoading,
  scope,
  search,
  tableOptionsError,
  tableOptionsLoading,
}: {
  actionError: unknown;
  availableTables: DiningTable[];
  areaFilter: string;
  areaOptions: string[];
  hostFilter: ReservationHostFilter;
  isMutating: boolean;
  onAction: (action: ReservationActionInput) => void;
  onAreaFilterChange: (nextValue: string) => void;
  onClearFilters: () => void;
  onHostFilterChange: (filter: ReservationHostFilter) => void;
  onScopeChange: (scope: ReservationQueueScope) => void;
  onSearchChange: (nextValue: string) => void;
  quickSummary: ReservationQueueSummary;
  reservations: Reservation[];
  reservationsError: unknown;
  reservationsLoading: boolean;
  scope: ReservationQueueScope;
  search: string;
  tableOptionsError: unknown;
  tableOptionsLoading: boolean;
}) {
  const canClearFilters = search.trim() !== '' || scope !== 'ACTIVE' || hostFilter !== 'ALL' || areaFilter !== 'ALL';

  return (
    <DataPanel
      testId="reservation-queue-panel"
      title={i18n.t('Reservation queue')}
      subtitle={i18n.t('Confirm, seat, and complete reservations directly from the staff surface.')}
    >
      <div className="mb-5 grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-end">
        <div className="inline-flex w-fit rounded-full border border-ink/10 bg-white/80 p-1">
          {(['ACTIVE', 'HISTORY', 'ALL'] as ReservationQueueScope[]).map((queueScope) => (
            <button
              key={queueScope}
              className={clsx(
                'rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition',
                scope === queueScope ? 'bg-forest text-cream' : 'text-slate hover:text-ink',
              )}
              onClick={() => onScopeChange(queueScope)}
              type="button"
            >
              {queueScope === 'ACTIVE'
                ? i18n.t('Active')
                : queueScope === 'HISTORY'
                  ? i18n.t('History')
                  : i18n.t('All')}
            </button>
          ))}
        </div>

        <label className="block min-w-0">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
            {i18n.t('Search reservations')}
          </span>
          <input
            className="field"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={i18n.t('Code, customer, or phone')}
            value={search}
          />
        </label>

        <button className="button-chip" disabled={!canClearFilters} onClick={onClearFilters} type="button">
          {i18n.t('Clear filters')}
        </button>
      </div>

      <div className="mb-5 grid gap-3 xl:grid-cols-[1.2fr_16rem]">
        <div className="flex flex-wrap gap-2">
          {([
            ['ALL', i18n.t('All arrivals')],
            ['NEEDS_TABLE', i18n.t('Need table')],
            ['NEXT_SERVICE', i18n.t('Next 3h')],
            ['LARGE_PARTY', i18n.t('Large party')],
          ] as Array<[ReservationHostFilter, string]>).map(([filterKey, label]) => (
            <button
              key={filterKey}
              className={clsx('button-chip', hostFilter === filterKey && 'border-forest/25 bg-forest/10 text-forest')}
              onClick={() => onHostFilterChange(filterKey)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
            {i18n.t('Area focus')}
          </span>
          <select className="field" onChange={(event) => onAreaFilterChange(event.target.value)} value={areaFilter}>
            <option value="ALL">{i18n.t('All areas')}</option>
            <option value="__ANY__">{i18n.t('Any area')}</option>
            {areaOptions.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <MiniQueueStat label={i18n.t('Visible')} value={String(quickSummary.total)} helper={i18n.t('after current filters')} />
        <MiniQueueStat
          label={i18n.t('Need table')}
          value={String(quickSummary.needsTable)}
          helper={i18n.t('confirmed parties still unassigned')}
        />
        <MiniQueueStat
          label={i18n.t('Next 3h')}
          value={String(quickSummary.nextService)}
          helper={i18n.t('upcoming arrival pressure')}
        />
      </div>

      {reservationsLoading ? <LoadingState label={i18n.t('Loading reservations')} /> : null}
      {reservationsError ? <ErrorState error={reservationsError} /> : null}
      {tableOptionsLoading ? <LoadingState label={i18n.t('Loading table options')} /> : null}
      {tableOptionsError ? <ErrorState error={tableOptionsError} /> : null}
      {actionError ? (
        <div className="mt-4">
          <InlineError error={actionError} />
        </div>
      ) : null}
      {!reservationsLoading && !reservationsError ? (
        <ReservationList
          availableTables={availableTables}
          isMutating={isMutating}
          onAction={onAction}
          reservations={reservations}
        />
      ) : null}
    </DataPanel>
  );
}

function StaffServiceRequestsPanel({
  actionError,
  isLoading,
  isMutating,
  onResolve,
  requests,
  requestsError,
}: {
  actionError: unknown;
  isLoading: boolean;
  isMutating: boolean;
  onResolve: (requestId: number) => void;
  requests: ServiceRequest[];
  requestsError: unknown;
}) {
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

function StaffOperationsWorkbenchPanel({
  activeSession,
  canRenderWorkbench,
  createStaffOrderError,
  createStaffOrderPending,
  invoices,
  invoicesError,
  invoicesLoading,
  invoiceError,
  invoicePresenceByOrderId,
  isBusy,
  menuItems,
  menuItemsLoadFailed,
  onAddOrderItem,
  onCancelOrder,
  onClearOrderFocus,
  onConfirmOrder,
  onCreateInvoice,
  onCreateStaffOrder,
  onRecordPayment,
  onReleaseSessionFocus,
  onUpdateOrderItem,
  onUpdateOrderSearch,
  orderSearch,
  orderSessionFilter,
  orders,
  ordersError,
  ordersLoading,
  payments,
  paymentsError,
  paymentsLoading,
  paymentError,
  sessionLabelById,
  showBillingLane,
  showFloorLane,
  staffMenuError,
  staffMenuLoading,
  subtitle,
  title,
  visibleOrderCount,
  workbenchOrderError,
}: {
  activeSession: TableSession | null;
  canRenderWorkbench: boolean;
  createStaffOrderError: unknown;
  createStaffOrderPending: boolean;
  invoices: Awaited<ReturnType<typeof staffApi.invoices>>['content'];
  invoicesError: unknown;
  invoicesLoading: boolean;
  invoiceError: unknown;
  invoicePresenceByOrderId: Record<number, boolean>;
  isBusy: boolean;
  menuItems: MenuItem[];
  menuItemsLoadFailed: boolean;
  onAddOrderItem: (payload: { orderId: number; menuItemId: number; quantity: number; note?: string }) => void;
  onCancelOrder: (orderId: number) => void;
  onClearOrderFocus: () => void;
  onConfirmOrder: (orderId: number) => void;
  onCreateInvoice: (order: Awaited<ReturnType<typeof staffApi.orders>>['content'][number]) => void;
  onCreateStaffOrder: (payload: { note?: string; tableSessionId: number }) => void;
  onRecordPayment: (payload: { invoiceId: number; amount: number; method: PaymentMethod; note?: string }) => void;
  onReleaseSessionFocus: () => void;
  onUpdateOrderItem: (payload: { orderId: number; orderItemId: number; quantity?: number; note?: string; cancelled?: boolean }) => void;
  onUpdateOrderSearch: (value: string) => void;
  orderSearch: string;
  orderSessionFilter: number | null;
  orders: Awaited<ReturnType<typeof staffApi.orders>>['content'];
  ordersError: unknown;
  ordersLoading: boolean;
  payments: Awaited<ReturnType<typeof staffApi.payments>>['content'];
  paymentsError: unknown;
  paymentsLoading: boolean;
  paymentError: unknown;
  sessionLabelById: Record<number, string>;
  showBillingLane: boolean;
  showFloorLane: boolean;
  staffMenuError: unknown;
  staffMenuLoading: boolean;
  subtitle: string;
  title: string;
  visibleOrderCount: number;
  workbenchOrderError: unknown;
}) {
  return (
    <DataPanel testId="operations-workbench" title={title} subtitle={subtitle}>
      {showFloorLane ? (
        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
              {i18n.t('Search orders')}
            </span>
            <input
              className="field"
              onChange={(event) => onUpdateOrderSearch(event.target.value)}
              placeholder={i18n.t('Order code or note')}
              value={orderSearch}
            />
          </label>

          <button
            className="button-chip"
            disabled={orderSearch.trim() === '' && orderSessionFilter === null}
            onClick={onClearOrderFocus}
            type="button"
          >
            {i18n.t('Clear order focus')}
          </button>
        </div>
      ) : null}

      {activeSession ? (
        <div className="mb-5 rounded-[24px] border border-forest/15 bg-forest/5 px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-forest">
                {i18n.t('Focused session')}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate">
                {activeSession.tableCode} • {activeSession.tableName} • {i18n.t('Opened')} {formatDateTime(activeSession.openedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleOrderCount === 0 ? (
                <button
                  className="button-chip-primary"
                  disabled={createStaffOrderPending}
                  onClick={() =>
                    onCreateStaffOrder({
                      note: `${i18n.t('Staff order started from')} ${activeSession.tableCode}`,
                      tableSessionId: activeSession.id,
                    })
                  }
                  type="button"
                >
                  {createStaffOrderPending ? i18n.t('Starting...') : i18n.t('Create dine-in order')}
                </button>
              ) : null}
              <button className="button-chip" onClick={onReleaseSessionFocus} type="button">
                {i18n.t('Release focus')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showFloorLane && ordersLoading ? <LoadingState label={i18n.t('Loading orders')} /> : null}
      {showFloorLane && ordersError ? <ErrorState error={ordersError} /> : null}
      {showFloorLane && staffMenuLoading ? <LoadingState label={i18n.t('Loading menu items for POS')} /> : null}
      {showFloorLane && staffMenuError ? <ErrorState error={staffMenuError} /> : null}
      {showBillingLane && invoicesLoading ? <LoadingState label={i18n.t('Loading invoices')} /> : null}
      {showBillingLane && invoicesError ? <ErrorState error={invoicesError} /> : null}
      {showBillingLane && paymentsLoading ? <LoadingState label={i18n.t('Loading payments')} /> : null}
      {showBillingLane && paymentsError ? <ErrorState error={paymentsError} /> : null}
      {createStaffOrderError ? (
        <div className="mb-4">
          <InlineError error={createStaffOrderError} />
        </div>
      ) : null}
      {canRenderWorkbench ? (
        <CashierWorkbench
          orders={orders}
          invoices={invoices}
          payments={payments}
          menuItems={menuItems}
          menuItemsLoadFailed={menuItemsLoadFailed}
          sessionLabelById={sessionLabelById}
          isBusy={isBusy}
          orderError={workbenchOrderError}
          invoiceError={invoiceError}
          paymentError={paymentError}
          showOrderOperations={showFloorLane}
          showBillingOperations={showBillingLane}
          invoicePresenceByOrderId={invoicePresenceByOrderId}
          onAddOrderItem={onAddOrderItem}
          onCancelOrder={onCancelOrder}
          onConfirmOrder={onConfirmOrder}
          onCreateInvoice={onCreateInvoice}
          onRecordPayment={onRecordPayment}
          onUpdateOrderItem={onUpdateOrderItem}
        />
      ) : null}
    </DataPanel>
  );
}

function StaffOpenTableSessionsPanel({
  isLoading,
  sessions,
  sessionsError,
}: {
  isLoading: boolean;
  sessions: TableSession[];
  sessionsError: unknown;
}) {
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

function ProtectedRoute({
  children,
  session,
  isSessionReady,
}: {
  children: ReactNode;
  session: AuthSession | null;
  isSessionReady: boolean;
}) {
  const { t } = useTranslation();

  if (!isSessionReady) {
    return <LoadingState label={t('Restoring staff session')} />;
  }

  if (!session) {
    return <Navigate to="/staff/login" replace />;
  }

  return <>{children}</>;
}

function ReservationList({
  availableTables,
  isMutating,
  onAction,
  reservations,
}: {
  availableTables: DiningTable[];
  isMutating: boolean;
  onAction: (action: ReservationActionInput) => void;
  reservations: Reservation[];
}) {
  const [tableSelections, setTableSelections] = useState<Record<number, string>>({});

  useEffect(() => {
    setTableSelections((current) => {
      const next = { ...current };

      reservations.forEach((reservation) => {
        if (reservation.status === 'CONFIRMED') {
          if (next[reservation.id] === undefined) {
            next[reservation.id] = reservation.assignedTableId === null ? '' : String(reservation.assignedTableId);
          }
        } else {
          delete next[reservation.id];
        }
      });

      return next;
    });
  }, [reservations]);

  if (!reservations.length) {
    return <EmptyMessage message={i18n.t('No reservations yet.')} />;
  }

  return (
    <div className="space-y-3">
      {reservations.map((reservation) => (
        <div key={reservation.id} className="rounded-[24px] border border-ink/10 bg-white/75 p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-start gap-3">
                <div>
                  <p className="font-semibold text-ink">{reservation.customerName}</p>
                  <p className="text-sm text-slate">
                    {reservation.reservationCode} • {formatDateTime(reservation.reservationTime)}
                  </p>
                </div>
                    <StatusPill tone={reservationStatusTone(reservation.status)}>{i18n.t(reservation.status)}</StatusPill>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                    <InfoPair label={i18n.t('Party size')} value={`${reservation.partySize} ${i18n.t('guests')}`} />
                    <InfoPair
                      label={i18n.t('Table')}
                      value={reservation.assignedTableName ?? reservation.assignedTableCode ?? i18n.t('Unassigned')}
                    />
                    <InfoPair label={i18n.t('Phone')} value={reservation.phone} />
                    <InfoPair label={i18n.t('Area')} value={reservation.requestedArea || i18n.t('Any available')} />
              </div>

              <div className="rounded-[20px] border border-ink/10 bg-white/70 px-4 py-3 text-sm leading-7 text-slate">
                {reservation.status === 'PENDING'
                      ? i18n.t('Host action: verify the booking details, then confirm or cancel it.')
                  : reservation.status === 'CONFIRMED'
                        ? i18n.t('Host action: pick the right table and check the party in when they arrive.')
                    : reservation.status === 'CHECKED_IN'
                          ? i18n.t('Waiter action: the party is seated; complete the reservation after service handoff is done.')
                          : i18n.t('History only: no further staff action is required.')}
              </div>

                  {reservation.note ? (
                    <p className="text-sm leading-7 text-slate">
                      {i18n.t('Guest note:')} {reservation.note}
                    </p>
                  ) : null}
              {reservation.status === 'CONFIRMED' ? (
                <div className="space-y-2">
                  <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">
                          {i18n.t('Table for check-in')}
                        </span>
                    <select
                      className="field"
                      value={tableSelections[reservation.id] ?? ''}
                      onChange={(event) => setTableSelections((current) => ({ ...current, [reservation.id]: event.target.value }))}
                    >
                          <option value="">{i18n.t('Choose a table')}</option>
                      {reservation.assignedTableId !== null && !availableTables.some((table) => table.id === reservation.assignedTableId) ? (
                        <option value={String(reservation.assignedTableId)}>
                            {reservation.assignedTableCode ??
                              i18n.t('Table #{{id}}', { id: reservation.assignedTableId })}{' '}
                            •{' '}
                            {reservation.assignedTableName ?? i18n.t('Assigned table')}
                        </option>
                      ) : null}
                      {availableTables.map((table) => (
                        <option key={table.id} value={String(table.id)}>
                              {formatTableLabel(table)} • {table.areaName} • {table.seatCount} {i18n.t('seats')}
                        </option>
                      ))}
                    </select>
                  </label>
                      {availableTables.length === 0 ? (
                        <p className="text-sm leading-7 text-slate">{i18n.t('No available tables loaded yet.')}</p>
                      ) : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {reservation.status === 'PENDING' ? (
                <>
                  <button
                    className="button-chip-primary"
                    disabled={isMutating}
                    onClick={() => onAction({ reservationId: reservation.id, kind: 'confirm' })}
                    type="button"
                  >
                    {isMutating ? i18n.t('Saving...') : i18n.t('Confirm booking')}
                  </button>
                  <button
                    className="button-chip"
                    disabled={isMutating}
                    onClick={() => onAction({ reservationId: reservation.id, kind: 'cancel', note: i18n.t('Cancelled from staff queue') })}
                    type="button"
                  >
                    {isMutating ? i18n.t('Saving...') : i18n.t('Cancel booking')}
                  </button>
                </>
              ) : null}

              {reservation.status === 'CONFIRMED' ? (
                <>
                  <button
                    className="button-chip-primary"
                    disabled={isMutating || (tableSelections[reservation.id] ?? '') === ''}
                    onClick={() =>
                      onAction({
                        reservationId: reservation.id,
                        kind: 'check-in',
                        diningTableId: Number(tableSelections[reservation.id]),
                      })
                    }
                    title={(tableSelections[reservation.id] ?? '') === '' ? i18n.t('Choose a table before check-in') : undefined}
                    type="button"
                  >
                    {isMutating ? i18n.t('Saving...') : i18n.t('Check in party')}
                  </button>
                  <button
                    className="button-chip"
                    disabled={isMutating}
                    onClick={() => onAction({ reservationId: reservation.id, kind: 'cancel', note: i18n.t('Cancelled from staff queue') })}
                    type="button"
                  >
                    {isMutating ? i18n.t('Saving...') : i18n.t('Cancel booking')}
                  </button>
                </>
              ) : null}

              {reservation.status === 'CHECKED_IN' ? (
                <button
                  className="button-chip-primary"
                  disabled={isMutating}
                  onClick={() => onAction({ reservationId: reservation.id, kind: 'complete' })}
                  type="button"
                >
                  {isMutating ? i18n.t('Saving...') : i18n.t('Complete handoff')}
                </button>
              ) : null}

              {reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED' ? (
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate">{i18n.t('No further action')}</span>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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

function TopNavLink({ children, to }: { children: ReactNode; to: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        clsx(
          'rounded-full px-4 py-2 text-sm font-semibold transition',
          isActive ? 'bg-forest text-cream' : 'text-slate hover:bg-white/70 hover:text-ink'
        )
      }
      to={to}
    >
      {children}
    </NavLink>
  );
}

function ShortcutCard({ title, body, to }: { title: string; body: string; to: string }) {
  return (
    <Link className="group rounded-[28px] border border-ink/10 bg-white/70 p-5 transition hover:-translate-y-1 hover:border-forest/25 hover:shadow-float" to={to}>
      <p className="font-display text-2xl text-ink transition group-hover:text-forest">{title}</p>
      <p className="mt-3 text-sm leading-7 text-slate">{body}</p>
    </Link>
  );
}

function describeWorkspaceLane(lane: WorkspaceLane, canManageFloor: boolean, canManageBilling: boolean) {
  if (!canManageFloor && canManageBilling) {
    return i18n.t('Cashier lane');
  }

  if (canManageFloor && !canManageBilling) {
    return i18n.t('Floor lane');
  }

  if (lane === 'FLOOR') {
    return i18n.t('Floor lane');
  }

  if (lane === 'BILLING') {
    return i18n.t('Billing lane');
  }

  return i18n.t('Control lane');
}

function describeWorkspaceLaneBody(lane: WorkspaceLane, canManageFloor: boolean, canManageBilling: boolean) {
  if (!canManageFloor && canManageBilling) {
    return i18n.t('Collect payment, reconcile invoices, and stay focused on cashier handoff without floor-only noise.');
  }

  if (canManageFloor && !canManageBilling) {
    return i18n.t('Keep reservations moving, clear service requests, and manage live tables without cashier-only distractions.');
  }

  if (lane === 'FLOOR') {
    return i18n.t('Focus on reservations, sessions, and live table action while billing stays out of the way.');
  }

  if (lane === 'BILLING') {
    return i18n.t('Focus on invoices and payments while floor operations stay out of the way.');
  }

  return i18n.t('Keep reservations moving, clear service requests, and monitor back-office activity without leaving the floor console.');
}

function RoleChip({ role }: { role: AuthSession['user']['roles'][number] }) {
  return (
    <span className="rounded-full border border-ink/10 bg-white/75 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-slate">
      {role.toLowerCase()}
    </span>
  );
}

function MiniQueueStat({ helper, label, value }: { helper: string; label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-white/75 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate">{helper}</p>
    </div>
  );
}

function filterReservationQueue(
  reservations: Reservation[],
  quickFilter: ReservationHostFilter,
  areaFilter: string,
) {
  const now = Date.now();
  const nextServiceCutoff = now + 3 * 60 * 60 * 1000;

  return reservations.filter((reservation) => {
    const reservationTimestamp = new Date(reservation.reservationTime).getTime();
    const matchesArea = areaFilter === 'ALL'
      ? true
      : areaFilter === '__ANY__'
        ? reservation.requestedArea === null
        : reservation.requestedArea === areaFilter;

    if (!matchesArea) {
      return false;
    }

    switch (quickFilter) {
      case 'NEEDS_TABLE':
        return reservation.status === 'CONFIRMED' && reservation.assignedTableId === null;
      case 'NEXT_SERVICE':
        return reservationTimestamp >= now && reservationTimestamp <= nextServiceCutoff;
      case 'LARGE_PARTY':
        return reservation.partySize >= 6;
      case 'ALL':
      default:
        return true;
    }
  });
}

function summarizeReservationQueue(reservations: Reservation[]) {
  const now = Date.now();
  const nextServiceCutoff = now + 3 * 60 * 60 * 1000;

  return reservations.reduce(
    (summary, reservation) => {
      const reservationTimestamp = new Date(reservation.reservationTime).getTime();
      summary.total += 1;

      if (reservation.status === 'CONFIRMED' && reservation.assignedTableId === null) {
        summary.needsTable += 1;
      }

      if (reservation.partySize >= 6) {
        summary.largeParty += 1;
      }

      if (reservationTimestamp >= now && reservationTimestamp <= nextServiceCutoff) {
        summary.nextService += 1;
      }

      return summary;
    },
    { total: 0, needsTable: 0, largeParty: 0, nextService: 0 },
  );
}

function DataPanel({ children, subtitle, title, testId }: { children: ReactNode; subtitle: string; title: string; testId?: string }) {
  return (
    <section className="panel px-5 py-6" data-testid={testId}>
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{title}</p>
      <p className="mt-2 text-sm leading-7 text-slate">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'forest' | 'ember' | 'slate' }) {
  const toneClass = tone === 'forest' ? 'from-forest to-forest/80' : tone === 'ember' ? 'from-ember to-ember/75' : 'from-slate to-slate/80';

  return (
    <div className={clsx('rounded-[28px] bg-gradient-to-br p-[1px] shadow-float', toneClass)}>
      <div className="rounded-[27px] bg-white/90 px-5 py-5">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</p>
        <p className="mt-3 font-display text-4xl text-ink">{value}</p>
      </div>
    </div>
  );
}

function InfoCard({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/70 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</p>
      <p className="mt-2 font-display text-2xl text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate">{detail}</p>
    </div>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-ink/10 bg-cream/60 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function Field({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ children, tone }: { children: ReactNode; tone: 'forest' | 'ember' | 'warm' | 'neutral' }) {
  const styles = {
    forest: 'bg-forest/10 text-forest border-forest/20',
    ember: 'bg-ember/10 text-ember border-ember/20',
    warm: 'bg-ember/10 text-ember border-ember/20',
    neutral: 'bg-slate/10 text-slate border-slate/20',
  }[tone];

  return <span className={clsx('rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]', styles)}>{children}</span>;
}

function EmptyMessage({ message }: { message: string }) {
  return <div className="rounded-[22px] border border-dashed border-ink/15 bg-white/60 px-4 py-5 text-sm leading-7 text-slate">{message}</div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="mt-6 rounded-[24px] border border-ink/10 bg-white/70 px-4 py-4 text-sm text-slate">{label}...</div>;
}

function ErrorState({ error }: { error: unknown }) {
  return <div className="mt-6 rounded-[24px] border border-ember/20 bg-ember/10 px-4 py-4 text-sm text-ember">{getErrorMessage(error)}</div>;
}

function InlineError({ error, light = false }: { error: unknown; light?: boolean }) {
  return <p className={clsx('text-sm', light ? 'text-cream/80' : 'text-ember')}>{getErrorMessage(error)}</p>;
}

function filterMenuItems(menu: PublicMenu | undefined, search: string) {
  if (!menu) {
    return [] as MenuItem[];
  }

  if (!search.trim()) {
    return menu.items;
  }

  const keyword = search.trim().toLowerCase();
  return menu.items.filter((item) => {
    return item.name.toLowerCase().includes(keyword)
      || item.categoryName.toLowerCase().includes(keyword)
      || (item.description ?? '').toLowerCase().includes(keyword);
  });
}

function selectedMenuItems(items: MenuItem[], quantities: Record<number, number>) {
  return items
    .filter((item) => (quantities[item.id] ?? 0) > 0)
    .map((item) => ({
      menuItemId: item.id,
      quantity: Number(quantities[item.id]),
      note: '',
    }));
}

function findMenuItemName(items: MenuItem[], menuItemId: number) {
  return items.find((item) => item.id === menuItemId)?.name ?? i18n.t('Item #{{id}}', { id: menuItemId });
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function reservationStatusTone(status: ReservationStatus) {
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

function serviceRequestStatusTone(status: ServiceRequestStatus) {
  switch (status) {
    case 'OPEN':
      return 'ember';
    case 'RESOLVED':
      return 'neutral';
    case 'CANCELLED':
      return 'warm';
  }
}

function serviceRequestLabel(requestType: ServiceRequest['requestType']) {
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

function formatTableLabel(table: DiningTable) {
  return `${table.code} • ${table.name}`;
}

function formatTableSessionLabel(session: TableSession) {
  return `${session.sessionCode} • ${session.tableName}`;
}

function nextReservationSlot() {
  const next = new Date();
  next.setDate(next.getDate() + 1);
  next.setHours(19, 0, 0, 0);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, '0');
  const day = String(next.getDate()).padStart(2, '0');
  const hours = String(next.getHours()).padStart(2, '0');
  const minutes = String(next.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return i18n.t('Something went wrong.');
}











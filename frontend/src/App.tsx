import clsx from 'clsx';
import type { FormEvent, ReactNode } from 'react';
import { useDeferredValue, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { clearSession, msUntilSessionRefresh, readSession, saveSession, shouldRefreshSession } from './lib/session';

const initialSession = typeof window === 'undefined' ? null : readSession();

export default function App() {
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
              <p className="text-sm text-slate">POS, QR dining, and booking in one orbit</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <TopNavLink to="/">Menu</TopNavLink>
            <TopNavLink to="/book">Reservations</TopNavLink>
            <TopNavLink to="/staff">Staff</TopNavLink>
          </nav>
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
              Floor control without the clipboard chaos
            </span>
            <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
              A restaurant cockpit for the dining room, the QR table, and the host desk.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate">
              The backend is now wired for public menu browsing, QR orders, service requests, and reservation workflows.
              This frontend gives the team one place to demo those flows end-to-end.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" to="/book">
                Book a table
              </Link>
              <Link className="button-secondary" to="/staff/login">
                Staff console
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <MetricCard label="Categories" value={String(menuQuery.data?.categories.length ?? 0)} tone="forest" />
            <MetricCard label="Live dishes" value={String(menuQuery.data?.items.length ?? 0)} tone="ember" />
            <div className="rounded-[28px] border border-ink/10 bg-white/70 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">API health</p>
              <p className="mt-3 font-display text-2xl text-ink">{menuQuery.data?.restaurantName ?? 'Connecting...'}</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                Public menu endpoint: {menuQuery.isSuccess ? 'connected' : menuQuery.isPending ? 'loading' : 'needs backend'}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <aside className="panel px-6 py-8 sm:px-8">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Demo shortcuts</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Try the MVP loops</h2>
          </div>
          <div className="grid gap-4">
            <ShortcutCard
              title="Public booking"
              body="Create, lookup, and cancel a reservation through the same public contract the mobile site will use."
              to="/book"
            />
            <ShortcutCard
              title="Staff dashboard"
              body="Login with the seeded admin account and inspect orders, reservations, service requests, invoices, and payments."
              to="/staff/login"
            />
            <div className="rounded-[28px] border border-dashed border-forest/25 bg-forest/5 p-5 text-sm leading-7 text-slate">
              For the QR flow, seed a table, menu items, and a QR entry first; generated QR landing URLs should point at <code>/qr/&lt;token&gt;</code>.
            </div>
          </div>
        </div>
      </aside>

      <section className="panel px-6 py-8 sm:px-8 lg:col-span-2">
        <div className="flex flex-col gap-4 border-b border-ink/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Public menu</p>
            <h2 className="mt-2 font-display text-3xl text-ink">Signature dishes ready for QR ordering</h2>
          </div>
          <label className="relative block lg:w-[22rem]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Search</span>
            <input
              className="field"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search for dishes or categories"
            />
          </label>
        </div>

        {menuQuery.isLoading ? <LoadingState label="Loading menu" /> : null}
        {menuQuery.error ? <ErrorState error={menuQuery.error} /> : null}

        {menuQuery.data ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-[18rem_1fr]">
            <div className="space-y-3">
              {menuQuery.data.categories.map((category) => (
                <div key={category.id} className="rounded-[22px] border border-ink/10 bg-white/65 px-4 py-3">
                  <p className="font-semibold text-ink">{category.name}</p>
                  <p className="text-sm leading-6 text-slate">{category.description || 'A curated station for the dining room.'}</p>
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
                  <p className="mt-4 text-sm leading-7 text-slate">{item.description || 'Built for quick service, QR browsing, and direct cashier handoff.'}</p>
                </article>
              ))}
              {!filteredItems.length ? (
                <div className="rounded-[28px] border border-dashed border-ink/15 bg-white/65 p-6 text-sm leading-7 text-slate md:col-span-2 xl:col-span-3">
                  No dishes match this search yet.
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
    mutationFn: () => publicApi.cancelReservation(activeLookup, cancelNote || 'Cancelled from public app'),
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
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Public booking flow</p>
        <h1 className="mt-3 font-display text-4xl text-ink">Reserve a table without calling the host stand.</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
          This screen speaks directly to the new public reservation endpoints: create a reservation, pull it back by code,
          and cancel it when plans change.
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={submitReservation}>
          <Field label="Guest name">
            <input className="field" required value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="field" required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </Field>
          <Field label="Email">
            <input className="field" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </Field>
          <Field label="Party size">
            <input className="field" min="1" type="number" value={form.partySize} onChange={(event) => setForm({ ...form, partySize: event.target.value })} />
          </Field>
          <Field label="Arrival time">
            <input className="field" required type="datetime-local" value={form.reservationTime} onChange={(event) => setForm({ ...form, reservationTime: event.target.value })} />
          </Field>
          <Field label="Preferred area">
            <input className="field" value={form.requestedArea} onChange={(event) => setForm({ ...form, requestedArea: event.target.value })} placeholder="Patio, bar, private room..." />
          </Field>
          <Field label="Notes" className="md:col-span-2">
            <textarea className="field min-h-28" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button className="button-primary" disabled={createReservationMutation.isPending} type="submit">
              {createReservationMutation.isPending ? 'Creating...' : 'Create reservation'}
            </button>
            {createReservationMutation.error ? <InlineError error={createReservationMutation.error} /> : null}
          </div>
        </form>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Lookup and cancel</p>
        <h2 className="mt-3 font-display text-3xl text-ink">Keep the code, manage the booking.</h2>
        <div className="mt-6 flex gap-3">
          <input className="field" value={lookupInput} onChange={(event) => setLookupInput(event.target.value.toUpperCase())} placeholder="RES-XXXX" />
          <button className="button-secondary" onClick={() => setActiveLookup(lookupInput.trim())} type="button">
            Find
          </button>
        </div>

        {lookupQuery.isLoading ? <LoadingState label="Looking up reservation" /> : null}
        {lookupQuery.error ? <ErrorState error={lookupQuery.error} /> : null}

        {lookupQuery.data ? (
          <div className="mt-6 space-y-4 rounded-[28px] border border-ink/10 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-forest">{lookupQuery.data.reservationCode}</p>
                <h3 className="mt-2 font-display text-2xl text-ink">{lookupQuery.data.customerName}</h3>
              </div>
              <StatusPill tone={lookupQuery.data.status === 'CANCELLED' ? 'warm' : lookupQuery.data.status === 'COMPLETED' ? 'neutral' : 'forest'}>
                {lookupQuery.data.status}
              </StatusPill>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoPair label="Arrival" value={formatDateTime(lookupQuery.data.reservationTime)} />
              <InfoPair label="Party" value={`${lookupQuery.data.partySize} guests`} />
              <InfoPair label="Phone" value={lookupQuery.data.phone} />
              <InfoPair label="Requested area" value={lookupQuery.data.requestedArea || 'No preference'} />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Cancel note</span>
              <textarea className="field min-h-24" value={cancelNote} onChange={(event) => setCancelNote(event.target.value)} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="button-primary"
                disabled={lookupQuery.data.status === 'CANCELLED' || lookupQuery.data.status === 'COMPLETED' || lookupQuery.data.status === 'CHECKED_IN' || cancelReservationMutation.isPending}
                onClick={() => cancelReservationMutation.mutate()}
                type="button"
              >
                {cancelReservationMutation.isPending ? 'Cancelling...' : 'Cancel reservation'}
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
        note: requestType === 'REQUEST_BILL' ? 'Customer requested the bill from QR flow' : 'Customer requested assistance from QR flow',
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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">QR dining</p>
            <h1 className="mt-2 font-display text-4xl text-ink">Table-side ordering, without waiting for a paper pad.</h1>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate">
              Resolve the QR token, open a table session on first interaction, stack dishes into the active QR order, then call for service or the bill.
            </p>
          </div>
          <label className="block lg:w-[20rem]">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Filter dishes</span>
            <input className="field" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find noodles, tea, desserts..." />
          </label>
        </div>

        {tableQuery.isLoading || menuQuery.isLoading ? <LoadingState label="Loading QR menu" /> : null}
        {tableQuery.error ? <ErrorState error={tableQuery.error} /> : null}
        {menuQuery.error ? <ErrorState error={menuQuery.error} /> : null}

        {tableQuery.data ? (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard label="Table" value={tableQuery.data.tableName} detail={tableQuery.data.tableCode} />
            <InfoCard label="Area" value={tableQuery.data.areaName} detail={tableQuery.data.tableStatus} />
            <InfoCard label="Session" value={tableQuery.data.openTableSessionId ? `#${tableQuery.data.openTableSessionId}` : 'Will open on first order'} detail="Auto-opened on demand" />
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
                <p className="mt-4 text-sm leading-7 text-slate">{item.description || 'Built for quick table-side ordering.'}</p>
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
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Current cart</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Ready for the kitchen</h2>
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
              Add items to the cart to create or extend the QR order.
            </div>
          )}
        </div>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Order note</span>
          <textarea className="field min-h-28" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Less spicy, split plates, no peanuts..." />
        </label>

        <button className="button-primary w-full justify-center" disabled={!cartItems.length || submitOrderMutation.isPending} onClick={() => submitOrderMutation.mutate()} type="button">
          {submitOrderMutation.isPending ? 'Sending...' : 'Send QR order'}
        </button>
        {submitOrderMutation.error ? <InlineError error={submitOrderMutation.error} /> : null}

        {currentOrder ? (
          <div className="rounded-[24px] bg-forest p-5 text-cream shadow-float">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-cream/70">Active order</p>
            <p className="mt-2 font-display text-2xl">{currentOrder.orderCode}</p>
            <p className="mt-2 text-sm text-cream/80">Status: {currentOrder.status}</p>
            <p className="mt-4 text-sm text-cream/80">Total: {formatMoney(currentOrder.totalAmount)}</p>
            <div className="mt-5 grid gap-3">
              <button className="button-ghost-light" onClick={() => serviceRequestMutation.mutate('CALL_WAITER')} type="button">
                Call waiter
              </button>
              <button className="button-ghost-light" onClick={() => serviceRequestMutation.mutate('REQUEST_BILL')} type="button">
                Request bill
              </button>
            </div>
            {serviceRequestMutation.isSuccess ? <p className="mt-4 text-sm text-cream/80">Service request sent.</p> : null}
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
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Staff access</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Sign in to the floor console.</h1>
      <p className="mt-4 text-base leading-8 text-slate">
        Use the seeded admin account to review the new staff-facing list endpoints from the browser.
      </p>

      <form
        className="mt-8 space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          loginMutation.mutate();
        }}
      >
        <Field label="Username">
          <input className="field" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
        </Field>
        <Field label="Password">
          <input className="field" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </Field>
        <div className="flex items-center gap-3">
          <button className="button-primary" disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? 'Signing in...' : 'Open staff dashboard'}
          </button>
          {loginMutation.error ? <InlineError error={loginMutation.error} /> : null}
        </div>
      </form>
    </section>
  );
}

type ReservationActionInput =
  | { reservationId: number; kind: 'confirm'; internalNote?: string }
  | { reservationId: number; kind: 'check-in'; diningTableId: number; internalNote?: string }
  | { reservationId: number; kind: 'complete' };

type OrderActionInput = { orderId: number; kind: 'confirm' | 'cancel' };

type PaymentInput = { invoiceId: number; amount: number; method: PaymentMethod; note?: string };

function StaffDashboardPage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const queryClient = useQueryClient();

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

  const dashboardQuery = useQuery({
    queryKey: ['staff', 'dashboard', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.dashboard(token)),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const reservationsQuery = useQuery({
    queryKey: ['staff', 'reservations', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.reservations(token, { size: 20 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const serviceRequestsQuery = useQuery({
    queryKey: ['staff', 'service-requests', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.serviceRequests(token, { size: 20, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const tablesQuery = useQuery({
    queryKey: ['staff', 'tables', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.tables(token, { size: 50, active: true, status: 'AVAILABLE' })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const tableSessionsQuery = useQuery({
    queryKey: ['staff', 'table-sessions', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.tableSessions(token, { size: 20, status: 'OPEN' })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const ordersQuery = useQuery({
    queryKey: ['staff', 'orders', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.orders(token, { size: 10 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const invoicesQuery = useQuery({
    queryKey: ['staff', 'invoices', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.invoices(token, { size: 10 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const paymentsQuery = useQuery({
    queryKey: ['staff', 'payments', session?.accessToken],
    queryFn: () => runStaffRequest((token) => staffApi.payments(token, { size: 10 })),
    enabled: Boolean(session?.accessToken),
    retry: false,
  });

  const reservationActionMutation = useMutation({
    mutationFn: (action: ReservationActionInput) =>
      runStaffRequest((token) => {
        switch (action.kind) {
          case 'confirm':
            return staffApi.confirmReservation(token, action.reservationId, { internalNote: action.internalNote });
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

  const createInvoiceMutation = useMutation({
    mutationFn: (orderId: number) => runStaffRequest((token) => staffApi.createInvoice(token, orderId)),
    onSuccess: () => {
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

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden px-6 py-8 sm:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">Staff workspace</p>
            <h1 className="mt-3 font-display text-4xl text-ink">Welcome back, {session?.user.fullName}.</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
              Keep reservations moving, clear service requests, and monitor back-office activity without leaving the floor console.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="button-secondary" onClick={refreshWorkspace} type="button">
              Refresh workspace
            </button>
            <button className="button-secondary" onClick={onLogout} type="button">
              Log out
            </button>
          </div>
        </div>
      </section>

      {dashboardQuery.isLoading ? <LoadingState label="Loading dashboard summary" /> : null}
      {dashboardQuery.error ? <ErrorState error={dashboardQuery.error} /> : null}

      {dashboardQuery.data ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Orders" value={String(dashboardQuery.data.orders.totalElements)} tone="forest" />
          <MetricCard label="Reservations" value={String(dashboardQuery.data.reservations.totalElements)} tone="ember" />
          <MetricCard label="Service requests" value={String(dashboardQuery.data.serviceRequests.totalElements)} tone="slate" />
          <MetricCard label="Invoices" value={String(dashboardQuery.data.invoices.totalElements)} tone="forest" />
          <MetricCard label="Payments" value={String(dashboardQuery.data.payments.totalElements)} tone="ember" />
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-2">
        <DataPanel title="Reservation queue" subtitle="Confirm, seat, and complete reservations directly from the staff surface.">
          {reservationsQuery.isLoading ? <LoadingState label="Loading reservations" /> : null}
          {reservationsQuery.error ? <ErrorState error={reservationsQuery.error} /> : null}
          {tablesQuery.isLoading ? <LoadingState label="Loading table options" /> : null}
          {tablesQuery.error ? <ErrorState error={tablesQuery.error} /> : null}
          {reservationActionMutation.error ? <div className="mt-4"><InlineError error={reservationActionMutation.error} /></div> : null}
          {reservationsQuery.data ? (
            <ReservationList
              availableTables={tablesQuery.data?.content ?? []}
              isMutating={reservationActionMutation.isPending}
              onAction={(action) => reservationActionMutation.mutate(action)}
              reservations={reservationsQuery.data.content}
            />
          ) : null}
        </DataPanel>

        <DataPanel title="Open service requests" subtitle="Resolve waiter calls and bill requests as soon as they land.">
          {serviceRequestsQuery.isLoading ? <LoadingState label="Loading service requests" /> : null}
          {serviceRequestsQuery.error ? <ErrorState error={serviceRequestsQuery.error} /> : null}
          {serviceRequestMutation.error ? <div className="mt-4"><InlineError error={serviceRequestMutation.error} /></div> : null}
          {serviceRequestsQuery.data ? (
            <ServiceRequestList
              isMutating={serviceRequestMutation.isPending}
              onResolve={(requestId) => serviceRequestMutation.mutate(requestId)}
              requests={serviceRequestsQuery.data.content}
            />
          ) : null}
        </DataPanel>

        <DataPanel title="Cashier workbench" subtitle="Confirm orders, issue invoices, and record payments from one surface.">
          {ordersQuery.isLoading ? <LoadingState label="Loading orders" /> : null}
          {ordersQuery.error ? <ErrorState error={ordersQuery.error} /> : null}
          {invoicesQuery.isLoading ? <LoadingState label="Loading invoices" /> : null}
          {invoicesQuery.error ? <ErrorState error={invoicesQuery.error} /> : null}
          {paymentsQuery.isLoading ? <LoadingState label="Loading payments" /> : null}
          {paymentsQuery.error ? <ErrorState error={paymentsQuery.error} /> : null}
          {ordersQuery.data && invoicesQuery.data && paymentsQuery.data ? (
            <CashierWorkbench
              orders={ordersQuery.data.content}
              invoices={invoicesQuery.data.content}
              payments={paymentsQuery.data.content}
              isBusy={orderActionMutation.isPending || createInvoiceMutation.isPending || recordPaymentMutation.isPending}
              orderError={orderActionMutation.error}
              invoiceError={createInvoiceMutation.error}
              paymentError={recordPaymentMutation.error}
              onCancelOrder={(orderId) => orderActionMutation.mutate({ kind: 'cancel', orderId })}
              onConfirmOrder={(orderId) => orderActionMutation.mutate({ kind: 'confirm', orderId })}
              onCreateInvoice={(orderId) => createInvoiceMutation.mutate(orderId)}
              onRecordPayment={(payload) => recordPaymentMutation.mutate(payload)}
            />
          ) : null}
        </DataPanel>

        <DataPanel title="Open table sessions" subtitle="See which tables already have a live session before seating or check-in.">
          {tableSessionsQuery.isLoading ? <LoadingState label="Loading table sessions" /> : null}
          {tableSessionsQuery.error ? <ErrorState error={tableSessionsQuery.error} /> : null}
          {tableSessionsQuery.data ? <TableSessionList sessions={tableSessionsQuery.data.content} /> : null}
        </DataPanel>
      </section>
    </div>
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
  if (!isSessionReady) {
    return <LoadingState label="Restoring staff session" />;
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
    return <EmptyMessage message="No reservations yet." />;
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
                <StatusPill tone={reservationStatusTone(reservation.status)}>{reservation.status}</StatusPill>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <InfoPair label="Party size" value={`${reservation.partySize} guests`} />
                <InfoPair label="Table" value={reservation.assignedTableName ?? reservation.assignedTableCode ?? 'Unassigned'} />
                <InfoPair label="Phone" value={reservation.phone} />
                <InfoPair label="Area" value={reservation.requestedArea || 'Any available'} />
              </div>

              {reservation.note ? <p className="text-sm leading-7 text-slate">Guest note: {reservation.note}</p> : null}
              {reservation.status === 'CONFIRMED' ? (
                <div className="space-y-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">Table for check-in</span>
                    <select
                      className="field"
                      value={tableSelections[reservation.id] ?? ''}
                      onChange={(event) => setTableSelections((current) => ({ ...current, [reservation.id]: event.target.value }))}
                    >
                      <option value="">Choose a table</option>
                      {reservation.assignedTableId !== null && !availableTables.some((table) => table.id === reservation.assignedTableId) ? (
                        <option value={String(reservation.assignedTableId)}>
                          {reservation.assignedTableCode ?? `Table #${reservation.assignedTableId}`} • {reservation.assignedTableName ?? 'Assigned table'}
                        </option>
                      ) : null}
                      {availableTables.map((table) => (
                        <option key={table.id} value={String(table.id)}>
                          {formatTableLabel(table)} • {table.areaName} • {table.seatCount} seats
                        </option>
                      ))}
                    </select>
                  </label>
                  {availableTables.length === 0 ? <p className="text-sm leading-7 text-slate">No available tables loaded yet.</p> : null}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              {reservation.status === 'PENDING' ? (
                <button
                  className="button-chip-primary"
                  disabled={isMutating}
                  onClick={() => onAction({ reservationId: reservation.id, kind: 'confirm' })}
                  type="button"
                >
                  {isMutating ? 'Saving...' : 'Confirm'}
                </button>
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
                    title={(tableSelections[reservation.id] ?? '') === '' ? 'Choose a table before check-in' : undefined}
                    type="button"
                  >
                    {isMutating ? 'Saving...' : 'Check in'}
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
                  {isMutating ? 'Saving...' : 'Complete'}
                </button>
              ) : null}

              {reservation.status === 'CANCELLED' || reservation.status === 'COMPLETED' ? (
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate">No further action</span>
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
    return <EmptyMessage message="No service requests yet." />;
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
                    Order #{request.orderId ?? 'n/a'} • Session #{request.tableSessionId ?? 'n/a'} • {formatDateTime(request.requestedAt)}
                  </p>
                </div>
                <StatusPill tone={serviceRequestStatusTone(request.status)}>{request.status}</StatusPill>
              </div>

              {request.note ? <p className="text-sm leading-7 text-slate">{request.note}</p> : null}
            </div>

            <div className="flex flex-col gap-3 lg:items-end">
              <button
                className="button-chip-primary"
                disabled={isMutating || request.status !== 'OPEN'}
                onClick={() => onResolve(request.id)}
                title={request.status !== 'OPEN' ? 'Only open requests can be resolved' : undefined}
                type="button"
              >
                {isMutating ? 'Resolving...' : 'Resolve'}
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
    return <EmptyMessage message="No open table sessions yet." />;
  }

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div key={session.id} className="data-row">
          <div>
            <p className="font-semibold text-ink">{formatTableSessionLabel(session)}</p>
            <p className="text-sm text-slate">
              {session.tableCode} • {session.status} • Opened {formatDateTime(session.openedAt)}
            </p>
          </div>
          <StatusPill tone={session.status === 'OPEN' ? 'forest' : 'neutral'}>{session.status}</StatusPill>
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

function DataPanel({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <section className="panel px-5 py-6">
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
      quantity: quantities[item.id],
      note: '',
    }));
}

function findMenuItemName(items: MenuItem[], menuItemId: number) {
  return items.find((item) => item.id === menuItemId)?.name ?? `Item #${menuItemId}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
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
      return 'Call waiter';
    case 'REQUEST_BILL':
      return 'Request bill';
    case 'WATER':
      return 'Water refill';
    case 'OTHER':
      return 'Other request';
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

  return 'Something went wrong.';
}






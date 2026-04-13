import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TableSelectionStep } from '../components/public-booking/TableSelectionStep';
import type { AuthSession } from '../lib/api';
import { publicApi } from '../lib/api';
import { Field, InlineError, StatusPill } from './PagePrimitives';
import { formatDateTime, nextReservationSlot } from './pageUtils';

function ReservationDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}

export function ReservationPage({ session, isSessionReady }: { session: AuthSession | null; isSessionReady: boolean }) {
  const { t } = useTranslation();
  const isCustomer = session?.user?.roles?.includes('CUSTOMER') ?? false;
  const isLoggedIn = !!session;
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    partySize: '2',
    reservationTime: nextReservationSlot(),
    requestedArea: '',
    selectedTableId: null as string | null,
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
        selectedTableId: form.selectedTableId ? Number(form.selectedTableId) : undefined,
        note: form.note || undefined,
      }, session?.accessToken),
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
    mutationFn: () => publicApi.cancelReservation(activeLookup, cancelNote || t('Cancelled from public app')),
    onSuccess: () => {
      void lookupQuery.refetch();
    },
  });

  function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createReservationMutation.mutate();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('Public booking flow')}</p>
        <div className="mt-3 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{t('Đặt bàn trực tuyến')}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              {t('Chọn thời gian, khu vực và bàn phù hợp trước khi đến nhà hàng.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full border border-slate-200 px-3 py-1">{t('Xem bàn trống theo thời gian thực')}</span>
            <span className="rounded-full border border-slate-200 px-3 py-1">{t('Giữ chỗ trước khi đến')}</span>
          </div>
        </div>

        {!isSessionReady ? (
          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            {t('Đang tải...')}
          </div>
        ) : !isLoggedIn ? (
          <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-amber-800">{t('Bạn cần đăng nhập để đặt bàn.')}</p>
            <div className="mt-3 flex items-center justify-center gap-3">
              <Link to="/login" className="button-primary rounded-md text-sm">
                {t('Đăng nhập')}
              </Link>
              <Link to="/register" className="button-secondary rounded-md text-sm">
                {t('Đăng ký tài khoản')}
              </Link>
            </div>
          </div>
        ) : !isCustomer ? (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-6 text-center">
            <p className="text-sm font-medium text-rose-800">{t('Chỉ tài khoản khách hàng mới có thể đặt bàn. Tài khoản quản trị và nhân viên không được phép đặt bàn qua kênh này.')}</p>
          </div>
        ) : (
        <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={submitReservation}>
          <Field label={t('Guest name')}>
            <input className="field rounded-md" onChange={(event) => setForm({ ...form, customerName: event.target.value })} required value={form.customerName} />
          </Field>
          <Field label={t('Phone')}>
            <input className="field rounded-md" onChange={(event) => setForm({ ...form, phone: event.target.value })} required value={form.phone} />
          </Field>
          <Field label={t('Email')}>
            <input className="field rounded-md" onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" value={form.email} />
          </Field>
          <Field label={t('Party size')}>
            <input className="field rounded-md" min="1" onChange={(event) => setForm({ ...form, partySize: event.target.value })} type="number" value={form.partySize} />
          </Field>
          <Field className="md:col-span-2" label={t('Arrival time')}>
            <input className="field rounded-md" onChange={(event) => setForm({ ...form, reservationTime: event.target.value })} required type="datetime-local" value={form.reservationTime} />
          </Field>

          <div className="md:col-span-2">
            <TableSelectionStep
              onChange={(selection) => setForm((current) => ({ ...current, ...selection }))}
              partySize={Number(form.partySize)}
              requestedArea={form.requestedArea}
              reservationTime={form.reservationTime}
              selectedTableId={form.selectedTableId}
            />
          </div>

          <Field className="md:col-span-2" label={t('Notes')}>
            <textarea className="field min-h-28 rounded-md" onChange={(event) => setForm({ ...form, note: event.target.value })} value={form.note} />
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button className="button-primary rounded-md" disabled={createReservationMutation.isPending} type="submit">
              {createReservationMutation.isPending ? t('Creating...') : t('Create reservation')}
            </button>
            {createReservationMutation.error ? <InlineError error={createReservationMutation.error} /> : null}
          </div>
        </form>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white px-5 py-6 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('Lookup and cancel')}</p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{t('Keep the code, manage the booking.')}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {t('Tra cứu nhanh đặt chỗ đã tạo, kiểm tra bàn đã giữ và hủy khi kế hoạch thay đổi.')}
        </p>

        <div className="mt-6 flex gap-3">
          <input
            className="field rounded-md"
            onChange={(event) => setLookupInput(event.target.value.toUpperCase())}
            placeholder={t('RES-XXXX')}
            value={lookupInput}
          />
          <button className="button-secondary rounded-md" onClick={() => setActiveLookup(lookupInput.trim())} type="button">
            {t('Find')}
          </button>
        </div>

        {lookupQuery.isLoading ? (
          <div className="mt-6 rounded-md border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            {t('Looking up reservation')}...
          </div>
        ) : null}
        {lookupQuery.error ? (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {String(lookupQuery.error instanceof Error ? lookupQuery.error.message : t('Something went wrong.'))}
          </div>
        ) : null}

        {lookupQuery.data ? (
          <div className="mt-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{lookupQuery.data.reservationCode}</p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">{lookupQuery.data.customerName}</h3>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('Reservation status')}</p>
                <StatusPill tone={lookupQuery.data.status === 'CANCELLED' ? 'warm' : lookupQuery.data.status === 'COMPLETED' ? 'neutral' : 'forest'}>
                  {t(lookupQuery.data.status)}
                </StatusPill>
                <p
                  aria-atomic="true"
                  aria-live="polite"
                  className="text-sm font-semibold text-slate"
                  data-testid="public-reservation-status"
                  role="status"
                >
                  {t('Reservation status: {{status}}', { status: t(lookupQuery.data.status) })}
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <ReservationDetail label={t('Arrival')} value={formatDateTime(lookupQuery.data.reservationTime)} />
              <ReservationDetail label={t('Party')} value={`${lookupQuery.data.partySize} ${t('guests')}`} />
              <ReservationDetail label={t('Phone')} value={lookupQuery.data.phone} />
              <ReservationDetail label={t('Requested area')} value={lookupQuery.data.requestedArea || t('No preference')} />
              <ReservationDetail label={t('Assigned table')} value={lookupQuery.data.assignedTableName || t('Unassigned')} />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('Cancel note')}</span>
              <textarea className="field min-h-24 rounded-md" onChange={(event) => setCancelNote(event.target.value)} value={cancelNote} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="button-primary rounded-md"
                disabled={lookupQuery.data.status === 'CANCELLED' || lookupQuery.data.status === 'COMPLETED' || lookupQuery.data.status === 'CHECKED_IN' || cancelReservationMutation.isPending}
                onClick={() => cancelReservationMutation.mutate()}
                type="button"
              >
                {cancelReservationMutation.isPending ? t('Cancelling...') : t('Cancel reservation')}
              </button>
              {cancelReservationMutation.error ? <InlineError error={cancelReservationMutation.error} /> : null}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

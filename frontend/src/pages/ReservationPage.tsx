import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { publicApi } from '../lib/api';
import { ErrorState, Field, InfoPair, InlineError, LoadingState, StatusPill } from './PagePrimitives';
import { formatDateTime, nextReservationSlot } from './pageUtils';

export function ReservationPage() {
  const { t } = useTranslation();
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
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="panel px-6 py-8 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Public booking flow')}</p>
        <h1 className="mt-3 font-display text-4xl text-ink">{t('Reserve a table without calling the host stand.')}</h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate">
          {t('This screen speaks directly to the new public reservation endpoints: create a reservation, pull it back by code, and cancel it when plans change.')}
        </p>

        <form className="mt-8 grid gap-4 md:grid-cols-2" onSubmit={submitReservation}>
          <Field label={t('Guest name')}>
            <input className="field" onChange={(event) => setForm({ ...form, customerName: event.target.value })} required value={form.customerName} />
          </Field>
          <Field label={t('Phone')}>
            <input className="field" onChange={(event) => setForm({ ...form, phone: event.target.value })} required value={form.phone} />
          </Field>
          <Field label={t('Email')}>
            <input className="field" onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" value={form.email} />
          </Field>
          <Field label={t('Party size')}>
            <input className="field" min="1" onChange={(event) => setForm({ ...form, partySize: event.target.value })} type="number" value={form.partySize} />
          </Field>
          <Field label={t('Arrival time')}>
            <input className="field" onChange={(event) => setForm({ ...form, reservationTime: event.target.value })} required type="datetime-local" value={form.reservationTime} />
          </Field>
          <Field label={t('Preferred area')}>
            <input
              className="field"
              onChange={(event) => setForm({ ...form, requestedArea: event.target.value })}
              placeholder={t('Patio, bar, private room...')}
              value={form.requestedArea}
            />
          </Field>
          <Field className="md:col-span-2" label={t('Notes')}>
            <textarea className="field min-h-28" onChange={(event) => setForm({ ...form, note: event.target.value })} value={form.note} />
          </Field>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3 pt-2">
            <button className="button-primary" disabled={createReservationMutation.isPending} type="submit">
              {createReservationMutation.isPending ? t('Creating...') : t('Create reservation')}
            </button>
            {createReservationMutation.error ? <InlineError error={createReservationMutation.error} /> : null}
          </div>
        </form>
      </section>

      <section className="panel px-6 py-8 sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Lookup and cancel')}</p>
        <h2 className="mt-3 font-display text-3xl text-ink">{t('Keep the code, manage the booking.')}</h2>
        <div className="mt-6 flex gap-3">
          <input
            className="field"
            onChange={(event) => setLookupInput(event.target.value.toUpperCase())}
            placeholder={t('RES-XXXX')}
            value={lookupInput}
          />
          <button className="button-secondary" onClick={() => setActiveLookup(lookupInput.trim())} type="button">
            {t('Find')}
          </button>
        </div>

        {lookupQuery.isLoading ? <LoadingState label={t('Looking up reservation')} /> : null}
        {lookupQuery.error ? <ErrorState error={lookupQuery.error} /> : null}

        {lookupQuery.data ? (
          <div className="mt-6 space-y-4 rounded-[28px] border border-ink/10 bg-white/70 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-forest">{lookupQuery.data.reservationCode}</p>
                <h3 className="mt-2 font-display text-2xl text-ink">{lookupQuery.data.customerName}</h3>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Reservation status')}</p>
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
              <InfoPair label={t('Arrival')} value={formatDateTime(lookupQuery.data.reservationTime)} />
              <InfoPair label={t('Party')} value={`${lookupQuery.data.partySize} ${t('guests')}`} />
              <InfoPair label={t('Phone')} value={lookupQuery.data.phone} />
              <InfoPair label={t('Requested area')} value={lookupQuery.data.requestedArea || t('No preference')} />
            </div>
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Cancel note')}</span>
              <textarea className="field min-h-24" onChange={(event) => setCancelNote(event.target.value)} value={cancelNote} />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                className="button-primary"
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

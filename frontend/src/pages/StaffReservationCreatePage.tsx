import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ApiError, type AuthSession, staffApi } from '../lib/api';
import { nextReservationSlot } from './pageUtils';
import { Field, InlineError } from './PagePrimitives';

export function StaffReservationCreatePage({
  session,
  onLogout,
  onRefreshSession,
}: {
  session: AuthSession | null;
  onLogout: () => void;
  onRefreshSession: (session: AuthSession) => Promise<AuthSession | null>;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    email: '',
    partySize: '2',
    reservationTime: nextReservationSlot(),
    requestedArea: '',
    selectedTableId: '',
    note: '',
  });

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

  const createMutation = useMutation({
    mutationFn: () =>
      runStaffRequest((token) =>
        staffApi.createReservation(token, {
          customerName: form.customerName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          partySize: Number(form.partySize),
          reservationTime: new Date(form.reservationTime).toISOString(),
          requestedArea: form.requestedArea.trim() || undefined,
          selectedTableId: form.selectedTableId ? Number(form.selectedTableId) : undefined,
          note: form.note.trim() || undefined,
        }),
      ),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    createMutation.mutate();
  }

  return (
    <PageLayout
      title={t('New reservation')}
      subtitle={t('Create a reservation on behalf of a guest')}
      session={session}
      onLogout={onLogout}
      backTo="/staff"
      backLabel={t('Staff dashboard')}
      maxWidth="2xl"
    >
      {createMutation.isSuccess && createMutation.data ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
          <p className="font-semibold">{t('Reservation created')}</p>
          <p className="mt-2">
            {t('Code')}: <span className="font-mono">{createMutation.data.reservationCode}</span>
          </p>
          <Link className="mt-3 inline-block text-emerald-800 underline" to="/staff">
            {t('Back to dashboard')}
          </Link>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={onSubmit}>
          <Field label={t('Customer name')}>
            <input
              className="input"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              required
            />
          </Field>
          <Field label={t('Phone')}>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              required
            />
          </Field>
          <Field label={t('Email')}>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </Field>
          <Field label={t('Party size')}>
            <input
              type="number"
              min={1}
              className="input"
              value={form.partySize}
              onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))}
              required
            />
          </Field>
          <Field label={t('Reservation time')}>
            <input
              type="datetime-local"
              className="input"
              value={form.reservationTime.slice(0, 16)}
              onChange={(e) => setForm((f) => ({ ...f, reservationTime: e.target.value }))}
              required
            />
          </Field>
          <Field label={t('Requested area')}>
            <input
              className="input"
              value={form.requestedArea}
              onChange={(e) => setForm((f) => ({ ...f, requestedArea: e.target.value }))}
            />
          </Field>
          <Field label={t('Table ID (optional)')}>
            <input
              type="number"
              className="input"
              value={form.selectedTableId}
              onChange={(e) => setForm((f) => ({ ...f, selectedTableId: e.target.value }))}
            />
          </Field>
          <Field label={t('Note')}>
            <textarea
              className="input min-h-[88px]"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            />
          </Field>
          {createMutation.isError ? <InlineError error={createMutation.error} /> : null}
          <button type="submit" className="button-primary" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('Saving…') : t('Create reservation')}
          </button>
        </form>
      )}
    </PageLayout>
  );
}

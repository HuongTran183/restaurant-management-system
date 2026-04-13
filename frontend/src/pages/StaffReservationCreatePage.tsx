import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { TableSelectionStep } from '../components/public-booking/TableSelectionStep';
import { PageLayout } from '../components/layout/PageLayout';
import { ApiError, type AuthSession, type Reservation, staffApi } from '../lib/api';
import { isFutureDateTimeInput } from '../lib/staffWorkflowUtils';
import { Field, InlineError, StatusPill } from './PagePrimitives';
import { formatDateTime, nextReservationSlot } from './pageUtils';

type ReservationFormState = {
  customerName: string;
  email: string;
  note: string;
  partySize: string;
  phone: string;
  requestedArea: string;
  reservationTime: string;
  selectedTableId: string | null;
};

function createEmptyForm(): ReservationFormState {
  return {
    customerName: '',
    email: '',
    note: '',
    partySize: '2',
    phone: '',
    requestedArea: '',
    reservationTime: nextReservationSlot(),
    selectedTableId: null,
  };
}

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
  const [formState, setFormState] = useState<ReservationFormState>(createEmptyForm());
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [createdReservation, setCreatedReservation] = useState<Reservation | null>(null);

  const userRoles = session?.user.roles ?? [];
  const canManageFloor = userRoles.some((role) => role === 'ADMIN' || role === 'MANAGER' || role === 'WAITER');

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

  const createReservationMutation = useMutation({
    mutationFn: () =>
      runStaffRequest((token) =>
        staffApi.createReservation(token, {
          customerName: formState.customerName.trim(),
          phone: formState.phone.trim(),
          email: formState.email.trim() || undefined,
          partySize: Number(formState.partySize),
          reservationTime: new Date(formState.reservationTime).toISOString(),
          requestedArea: formState.requestedArea || undefined,
          selectedTableId: formState.selectedTableId ? Number(formState.selectedTableId) : undefined,
          note: formState.note.trim() || undefined,
        })),
    onSuccess: (reservation) => {
      setCreatedReservation(reservation);
      setValidationMessage(null);
    },
  });

  function resetWorkflow() {
    setFormState(createEmptyForm());
    setCreatedReservation(null);
    setValidationMessage(null);
    createReservationMutation.reset();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.customerName.trim() || !formState.phone.trim()) {
      setValidationMessage(t('Guest name and phone are required.'));
      return;
    }

    if (!Number.isFinite(Number(formState.partySize)) || Number(formState.partySize) < 1) {
      setValidationMessage(t('Party size must be at least 1.'));
      return;
    }

    if (!isFutureDateTimeInput(formState.reservationTime)) {
      setValidationMessage(t('Reservation time must be in the future.'));
      return;
    }

    setValidationMessage(null);
    createReservationMutation.mutate();
  }

  if (!session) {
    return (
      <div className="panel px-6 py-8">
        <InlineError message={t('Please sign in to continue')} />
      </div>
    );
  }

  if (!canManageFloor) {
    return (
      <div className="panel px-6 py-8">
        <InlineError message={t('You do not have permission to view this page')} />
      </div>
    );
  }

  return (
    <PageLayout
      backLabel={t('Staff dashboard')}
      backTo="/staff?dock=reservations"
      breadcrumb={[
        { label: t('Staff console'), to: '/staff' },
        { label: t('Reservation desk'), to: '/staff?dock=reservations' },
        { label: t('New reservation') },
      ]}
      contentClassName="space-y-6 px-4 py-6 sm:px-6 lg:px-8"
      maxWidth="7xl"
      noPadding
      onLogout={onLogout}
      session={session}
      subtitle={t('Create a staffed booking with the same live table availability used in the public booking flow.')}
      title={t('New reservation')}
    >
      {createdReservation ? (
        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel px-6 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Reservation created')}</p>
            <h2 className="mt-2 font-display text-4xl font-bold text-ink">{createdReservation.reservationCode}</h2>
            <p className="mt-3 text-sm leading-7 text-slate">
              {t('The booking is now in the live reservation queue and ready for confirmation or check-in.')}
            </p>
            <div className="mt-5">
              <StatusPill tone={createdReservation.status === 'PENDING' ? 'warm' : 'forest'}>
                {t(createdReservation.status)}
              </StatusPill>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="button-primary" to="/staff?dock=reservations">
                {t('Open reservation desk')}
              </Link>
              <button className="button-secondary" onClick={resetWorkflow} type="button">
                {t('Create another')}
              </button>
            </div>
          </div>

          <div className="panel px-6 py-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Booking snapshot')}</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <ReservationDetail label={t('Guest')} value={createdReservation.customerName} />
              <ReservationDetail label={t('Phone')} value={createdReservation.phone} />
              <ReservationDetail label={t('Arrival')} value={formatDateTime(createdReservation.reservationTime)} />
              <ReservationDetail label={t('Party size')} value={`${createdReservation.partySize} ${t('guests')}`} />
              <ReservationDetail label={t('Requested area')} value={createdReservation.requestedArea || t('No preference')} />
              <ReservationDetail label={t('Assigned table')} value={createdReservation.assignedTableName || t('Unassigned')} />
            </div>

            {createdReservation.note ? (
              <div className="mt-4 rounded-[24px] border border-ink/10 bg-white/80 px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{t('Notes')}</p>
                <p className="mt-2 text-sm leading-7 text-ink">{createdReservation.note}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <form className="panel px-6 py-6" onSubmit={handleSubmit}>
            <div className="border-b border-ink/10 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Staffed booking')}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('Capture guest details')}</h2>
              <p className="mt-2 text-sm leading-7 text-slate">
                {t('Fill out the reservation as the host stand would, then optionally lock a specific table if availability allows.')}
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Field label={t('Guest name')} required>
                <input
                  className="field"
                  disabled={createReservationMutation.isPending}
                  onChange={(event) => setFormState((current) => ({ ...current, customerName: event.target.value }))}
                  required
                  value={formState.customerName}
                />
              </Field>

              <Field label={t('Phone')} required>
                <input
                  className="field"
                  disabled={createReservationMutation.isPending}
                  onChange={(event) => setFormState((current) => ({ ...current, phone: event.target.value }))}
                  required
                  value={formState.phone}
                />
              </Field>

              <Field label={t('Email')}>
                <input
                  className="field"
                  disabled={createReservationMutation.isPending}
                  onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
                  type="email"
                  value={formState.email}
                />
              </Field>

              <Field label={t('Party size')} required>
                <input
                  className="field"
                  disabled={createReservationMutation.isPending}
                  min="1"
                  onChange={(event) => setFormState((current) => ({ ...current, partySize: event.target.value }))}
                  required
                  type="number"
                  value={formState.partySize}
                />
              </Field>

              <Field className="md:col-span-2" label={t('Arrival time')} required>
                <input
                  className="field"
                  disabled={createReservationMutation.isPending}
                  onChange={(event) => setFormState((current) => ({ ...current, reservationTime: event.target.value }))}
                  required
                  type="datetime-local"
                  value={formState.reservationTime}
                />
              </Field>
            </div>

            <div className="mt-5">
              <TableSelectionStep
                onChange={(selection) => setFormState((current) => ({ ...current, ...selection }))}
                partySize={Number(formState.partySize)}
                requestedArea={formState.requestedArea}
                reservationTime={formState.reservationTime}
                selectedTableId={formState.selectedTableId}
              />
            </div>

            <div className="mt-5">
              <Field label={t('Notes')}>
                <textarea
                  className="field min-h-32"
                  disabled={createReservationMutation.isPending}
                  onChange={(event) => setFormState((current) => ({ ...current, note: event.target.value }))}
                  value={formState.note}
                />
              </Field>
            </div>

            {validationMessage ? (
              <div className="mt-4">
                <InlineError message={validationMessage} />
              </div>
            ) : null}
            {createReservationMutation.error ? (
              <div className="mt-4">
                <InlineError error={createReservationMutation.error} />
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button className="button-primary" disabled={createReservationMutation.isPending} type="submit">
                {createReservationMutation.isPending ? t('Creating...') : t('Create reservation')}
              </button>
              <button className="button-secondary" onClick={resetWorkflow} type="button">
                {t('Reset form')}
              </button>
            </div>
          </form>

          <aside className="space-y-6">
            <section className="panel px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('What this flow does')}</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">{t('One staffed booking path')}</h2>
              <p className="mt-2 text-sm leading-7 text-slate">
                {t('This page uses the same live public availability API, so hosts and guests are looking at the same bookable tables.')}
              </p>
            </section>

            <section className="panel px-6 py-6">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Current draft')}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <ReservationDetail label={t('Requested area')} value={formState.requestedArea || t('No preference')} />
                <ReservationDetail label={t('Selected table')} value={formState.selectedTableId || t('Auto-assign later')} />
                <ReservationDetail label={t('Arrival')} value={formState.reservationTime ? formatDateTime(new Date(formState.reservationTime).toISOString()) : t('Choose a time')} />
                <ReservationDetail label={t('Party size')} value={`${formState.partySize || '0'} ${t('guests')}`} />
              </div>
            </section>
          </aside>
        </section>
      )}
    </PageLayout>
  );
}

function ReservationDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-ink/10 bg-white/80 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

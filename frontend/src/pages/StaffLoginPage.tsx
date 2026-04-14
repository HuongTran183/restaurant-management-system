import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { authApi, type AuthSession } from '../lib/api';
import { Field, InlineError } from './PagePrimitives';

export function StaffLoginPage({
  onSignedIn,
  session,
  isSessionReady,
}: {
  onSignedIn: (session: AuthSession | null) => void;
  session: AuthSession | null;
  isSessionReady: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: 'admin', password: 'Admin@123456' });

  const loginMutation = useMutation({
    mutationFn: () => authApi.login(form),
    onSuccess: (nextSession) => {
      onSignedIn(nextSession);
      void navigate('/staff');
    },
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loginMutation.mutate();
  }

  if (session && isSessionReady) {
    return <Navigate replace to="/staff" />;
  }

  return (
    <section className="panel mx-auto max-w-xl px-6 py-8 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Staff access')}</p>
      <h1 className="mt-3 font-display text-4xl text-ink">{t('Sign in to the floor console.')}</h1>
      <p className="mt-4 text-base leading-8 text-slate">
        {t('Use the seeded admin account to review the new staff-facing list endpoints from the browser.')}
      </p>

      <form className="mt-8 space-y-4" onSubmit={submitForm}>
        <Field label={t('Username')}>
          <input className="field" onChange={(event) => setForm({ ...form, username: event.target.value })} value={form.username} />
        </Field>
        <Field label={t('Password')}>
          <input className="field" onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" value={form.password} />
        </Field>
        <div className="flex items-center gap-3">
          <button className="button-primary" disabled={loginMutation.isPending} type="submit">
            {loginMutation.isPending ? t('Signing in...') : t('Open staff dashboard')}
          </button>
          {loginMutation.error ? <InlineError error={loginMutation.error} /> : null}
        </div>
        <p className="text-center text-sm text-slate">
          {t("Don't have an account?")}{' '}
          <a href="/staff/register" className="font-medium text-forest hover:underline">
            {t('Register here')}
          </a>
        </p>
      </form>
    </section>
  );
}

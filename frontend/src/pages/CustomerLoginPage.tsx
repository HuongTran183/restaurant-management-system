import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { ApiError, type AuthSession, authApi } from '../lib/api';
import { Field, InlineError } from './PagePrimitives';

export function CustomerLoginPage({
  session,
  isSessionReady,
  onSignedIn,
}: {
  session: AuthSession | null;
  isSessionReady: boolean;
  onSignedIn: (session: AuthSession) => void;
}) {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ username, password }),
    onSuccess: (data) => {
      onSignedIn(data);
    },
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      return;
    }
    loginMutation.mutate();
  }

  if (session && isSessionReady) {
    // If user is customer, redirect to home; if staff, redirect to staff dashboard
    const isCustomer = session.user.roles.includes('CUSTOMER');
    return <Navigate replace to={isCustomer ? '/' : '/staff'} />;
  }

  return (
    <section className="panel mx-auto max-w-md px-6 py-8 sm:px-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-2xl text-cream">
          👤
        </div>
        <h1 className="font-display text-3xl text-ink">{t('Welcome Back')}</h1>
        <p className="mt-2 text-sm text-slate">
          {t('Sign in to your account to continue')}
        </p>
      </div>

      <form className="space-y-4" onSubmit={submitForm}>
        <Field label={t('Username or Email')} required>
          <input
            className="field"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('Enter your username')}
            required
            disabled={loginMutation.isPending}
            autoComplete="username"
          />
        </Field>

        <Field label={t('Password')} required>
          <div className="relative">
            <input
              className="field pr-16"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('Enter your password')}
              required
              disabled={loginMutation.isPending}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate hover:text-forest"
            >
              {showPassword ? t('Hide') : t('Show')}
            </button>
          </div>
        </Field>

        {loginMutation.isError && (
          <InlineError
            message={
              loginMutation.error instanceof ApiError
                ? loginMutation.error.message
                : t('Login failed. Please check your credentials.')
            }
          />
        )}

        <button
          className="button-primary w-full justify-center"
          disabled={loginMutation.isPending || !username.trim() || !password.trim()}
          type="submit"
        >
          {loginMutation.isPending ? t('Signing in...') : t('Sign In')}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center text-sm">
        <p className="text-slate">
          {t("Don't have an account?")}{' '}
          <Link to="/register" className="font-medium text-forest hover:underline">
            {t('Create one')}
          </Link>
        </p>
        <p className="text-slate">
          {t('Are you staff?')}{' '}
          <Link to="/staff/login" className="font-medium text-forest hover:underline">
            {t('Staff login')}
          </Link>
        </p>
      </div>
    </section>
  );
}

import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate } from 'react-router-dom';
import { ApiError, type AuthSession, authApi } from '../lib/api';
import { Field, InlineError } from './PagePrimitives';

type RegistrationFormState = {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  phone: string;
};

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character';
  return null;
}

function getPasswordStrength(password: string): { strength: number; label: string; color: string } {
  if (!password) return { strength: 0, label: 'None', color: 'bg-slate' };
  
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;

  if (strength <= 2) return { strength: 25, label: 'Weak', color: 'bg-ember' };
  if (strength <= 4) return { strength: 50, label: 'Fair', color: 'bg-sun' };
  if (strength <= 5) return { strength: 75, label: 'Good', color: 'bg-forest' };
  return { strength: 100, label: 'Strong', color: 'bg-forest' };
}

export function CustomerRegisterPage({
  session,
  isSessionReady,
  onSignedIn,
}: {
  session: AuthSession | null;
  isSessionReady: boolean;
  onSignedIn: (session: AuthSession) => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState<RegistrationFormState>({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phone: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const passwordError = form.password ? validatePassword(form.password) : null;
  const passwordStrength = getPasswordStrength(form.password);
  const confirmPasswordError = form.confirmPassword && form.password !== form.confirmPassword
    ? 'Passwords do not match'
    : null;

  const registerMutation = useMutation({
    mutationFn: () => authApi.registerCustomer({
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined,
    }),
    onSuccess: (data) => {
      onSignedIn(data);
    },
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordError || confirmPasswordError) return;
    if (!form.username.trim() || !form.fullName.trim() || !form.email.trim()) return;

    registerMutation.mutate();
  }

  if (session && isSessionReady) {
    return <Navigate replace to="/" />;
  }

  return (
    <section className="panel mx-auto max-w-xl px-6 py-8 sm:px-8">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest text-2xl text-cream">
          ✨
        </div>
        <h1 className="font-display text-3xl text-ink">{t('Create Account')}</h1>
        <p className="mt-2 text-sm text-slate">
          {t('Join us to book tables and order online')}
        </p>
      </div>

      <form className="space-y-4" onSubmit={submitForm}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Username')} required>
            <input
              className="field"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="johndoe"
              required
              minLength={3}
              maxLength={80}
              disabled={registerMutation.isPending}
            />
          </Field>

          <Field label={t('Full Name')} required>
            <input
              className="field"
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="John Doe"
              required
              minLength={2}
              maxLength={120}
              disabled={registerMutation.isPending}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Email')} required>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="john@example.com"
              required
              maxLength={160}
              disabled={registerMutation.isPending}
            />
          </Field>

          <Field label={t('Phone')} required={false}>
            <input
              className="field"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+84 912 345 678"
              maxLength={20}
              disabled={registerMutation.isPending}
            />
          </Field>
        </div>

        <Field label={t('Password')} required>
          <div className="relative">
            <input
              className="field pr-16"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={t('Minimum 8 characters')}
              required
              minLength={8}
              disabled={registerMutation.isPending}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate hover:text-forest"
            >
              {showPassword ? t('Hide') : t('Show')}
            </button>
          </div>
          
          {form.password && (
            <>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate">{t('Password strength:')}</span>
                  <span className={passwordStrength.color.replace('bg-', 'text-')}>
                    {t(passwordStrength.label)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate/20">
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${passwordStrength.strength}%` }}
                  />
                </div>
              </div>
              
              {passwordError && (
                <p className="mt-2 text-sm text-ember">{t(passwordError)}</p>
              )}
            </>
          )}
        </Field>

        <Field label={t('Confirm Password')} required>
          <input
            className="field"
            type={showPassword ? 'text' : 'password'}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            placeholder={t('Re-enter your password')}
            required
            disabled={registerMutation.isPending}
          />
          {confirmPasswordError && (
            <p className="mt-1 text-sm text-ember">{t(confirmPasswordError)}</p>
          )}
          {!confirmPasswordError && form.confirmPassword && (
            <p className="mt-1 text-xs text-forest">{t('✓ Passwords match')}</p>
          )}
        </Field>

        {registerMutation.isError && (
          <InlineError
            message={
              registerMutation.error instanceof ApiError
                ? registerMutation.error.message
                : t('Registration failed. Please try again.')
            }
          />
        )}

        <button
          className="button-primary w-full justify-center"
          disabled={registerMutation.isPending || !!passwordError || !!confirmPasswordError}
          type="submit"
        >
          {registerMutation.isPending ? t('Creating account...') : t('Create Account')}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <p className="text-slate">
          {t('Already have an account?')}{' '}
          <Link to="/login" className="font-medium text-forest hover:underline">
            {t('Sign in')}
          </Link>
        </p>
      </div>
    </section>
  );
}

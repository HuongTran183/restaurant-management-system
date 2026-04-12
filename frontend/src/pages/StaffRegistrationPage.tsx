import type { FormEvent } from 'react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError, type AuthSession, authApi } from '../lib/api';
import { Field, InlineError } from './PagePrimitives';

type StaffRole = 'MANAGER' | 'WAITER' | 'CASHIER';

type RegistrationFormState = {
  username: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  role: StaffRole;
};

function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must contain at least one special character';
  }
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

export function StaffRegistrationPage({
  session,
  isSessionReady,
}: {
  session: AuthSession | null;
  isSessionReady: boolean;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistrationFormState>({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    role: 'WAITER',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const passwordError = form.password ? validatePassword(form.password) : null;
  const passwordStrength = getPasswordStrength(form.password);
  const confirmPasswordError = form.confirmPassword && form.password !== form.confirmPassword
    ? 'Passwords do not match'
    : null;

  const registerMutation = useMutation({
    mutationFn: () => authApi.registerStaff({
      username: form.username.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      email: form.email.trim(),
      role: form.role,
    }),
    onSuccess: () => {
      setRegistrationSuccess(true);
      setTimeout(() => {
        void navigate('/staff/login');
      }, 3000);
    },
  });

  function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordError || confirmPasswordError) {
      return;
    }

    if (!form.username.trim() || !form.fullName.trim() || !form.email.trim()) {
      return;
    }

    registerMutation.mutate();
  }

  if (session && isSessionReady) {
    return <Navigate replace to="/staff" />;
  }

  if (registrationSuccess) {
    return (
      <section className="panel mx-auto max-w-xl px-6 py-8 sm:px-8">
        <div className="rounded-lg bg-forest/10 p-6 text-center">
          <div className="mb-4 text-5xl">✅</div>
          <h2 className="font-display text-2xl font-bold text-forest">{t('Registration Submitted!')}</h2>
          <p className="mt-3 text-slate">
            {t('Your account has been created but requires admin approval before you can log in. You will be notified once approved.')}
          </p>
          <p className="mt-4 text-sm text-slate">
            {t('Redirecting to login page...')}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel mx-auto max-w-xl px-6 py-8 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate">{t('Staff registration')}</p>
      <h1 className="mt-3 font-display text-4xl text-ink">{t('Create your staff account')}</h1>
      <p className="mt-4 text-base leading-8 text-slate">
        {t('Register a new account to access the staff dashboard. Your account will need admin approval before you can log in.')}
      </p>

      <form className="mt-8 space-y-4" onSubmit={submitForm}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('Username')} required>
            <input
              className="field"
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="john.doe"
              required
              minLength={3}
              maxLength={80}
              disabled={registerMutation.isPending}
            />
          </Field>

          <Field label={t('Role')} required>
            <select
              className="field"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
              required
              disabled={registerMutation.isPending}
            >
              <option value="WAITER">{t('Waiter')}</option>
              <option value="CASHIER">{t('Cashier')}</option>
              <option value="MANAGER">{t('Manager')}</option>
            </select>
          </Field>
        </div>

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

        <Field label={t('Email')} required>
          <input
            className="field"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john.doe@restaurant.com"
            required
            maxLength={160}
            disabled={registerMutation.isPending}
          />
        </Field>

        <Field label={t('Password')} required>
          <div className="relative">
            <input
              className="field pr-20"
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
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate hover:text-forest"
            >
              {showPassword ? t('Hide') : t('Show')}
            </button>
          </div>
          
          {form.password && (
            <>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate">{t('Password strength:')}</span>
                  <span className={passwordStrength.color.replace('bg-', 'text-')} >
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
              
              {!passwordError && (
                <p className="mt-2 text-xs text-forest">
                  {t('✓ Password meets all requirements')}
                </p>
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

        <div className="rounded-lg bg-sun/10 p-4 text-sm text-slate">
          <p className="font-semibold">{t('Requirements:')}</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li className={form.password.length >= 8 ? 'text-forest' : ''}>
              {t('At least 8 characters')}
            </li>
            <li className={/[A-Z]/.test(form.password) ? 'text-forest' : ''}>
              {t('At least one uppercase letter')}
            </li>
            <li className={/[0-9]/.test(form.password) ? 'text-forest' : ''}>
              {t('At least one number')}
            </li>
            <li className={/[^A-Za-z0-9]/.test(form.password) ? 'text-forest' : ''}>
              {t('At least one special character')}
            </li>
          </ul>
        </div>

        {registerMutation.isError && (
          <InlineError
            message={
              registerMutation.error instanceof ApiError
                ? registerMutation.error.message
                : t('Registration failed. Please try again.')
            }
          />
        )}

        <div className="flex flex-col gap-3">
          <button
            className="button-primary"
            disabled={registerMutation.isPending || !!passwordError || !!confirmPasswordError}
            type="submit"
          >
            {registerMutation.isPending ? t('Creating account...') : t('Create Account')}
          </button>
          
          <p className="text-center text-sm text-slate">
            {t('Already have an account?')}{' '}
            <Link to="/staff/login" className="font-medium text-forest hover:underline">
              {t('Sign in')}
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}

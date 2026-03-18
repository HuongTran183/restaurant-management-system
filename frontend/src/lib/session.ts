import type { AuthSession } from './api';

const SESSION_KEY = 'restaurant-os-session';
const SESSION_REFRESH_BUFFER_MS = 60_000;

export function readSession(): AuthSession | null {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(SESSION_KEY);
}

export function shouldRefreshSession(session: AuthSession): boolean {
  const expiry = Date.parse(session.accessTokenExpiresAt);
  if (Number.isNaN(expiry)) {
    return true;
  }
  return expiry - Date.now() <= SESSION_REFRESH_BUFFER_MS;
}

export function msUntilSessionRefresh(session: AuthSession): number | null {
  const expiry = Date.parse(session.accessTokenExpiresAt);
  if (Number.isNaN(expiry)) {
    return null;
  }
  return Math.max(0, expiry - Date.now() - SESSION_REFRESH_BUFFER_MS);
}

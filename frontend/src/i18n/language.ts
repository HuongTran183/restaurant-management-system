export type AppLanguage = 'vi' | 'en';

const STORAGE_KEY = 'h-restaurant-management-system:lang';

export const SUPPORTED_LANGUAGES: ReadonlyArray<AppLanguage> = ['vi', 'en'];

function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'vi' || value === 'en';
}

export function getInitialLanguage(): AppLanguage {
  // App is a SPA (no SSR), but keep this guard for tests/edge cases.
  if (typeof window === 'undefined') return 'vi';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // Ignore storage failures and fall back to Vietnamese.
  }

  const nav = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : '';
  if (nav?.startsWith('vi')) return 'vi';

  // Vietnamese first, as requested.
  return 'vi';
}

export function getStoredLanguage(): AppLanguage | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isSupportedLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function setStoredLanguage(lang: AppLanguage) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, lang);
}


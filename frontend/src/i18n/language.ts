export type AppLanguage = 'vi';

const STORAGE_KEY = 'h-restaurant-management-system:lang';

export const SUPPORTED_LANGUAGES: ReadonlyArray<AppLanguage> = ['vi'];

function isSupportedLanguage(value: string | null | undefined): value is AppLanguage {
  return value === 'vi';
}

export function getInitialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'vi';

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    // Ignore storage failures and keep the app in Vietnamese.
  }
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


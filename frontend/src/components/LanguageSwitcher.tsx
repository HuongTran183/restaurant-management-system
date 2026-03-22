import { useEffect, useState } from 'react';

import i18n from '../i18n/i18n';
import type { AppLanguage } from '../i18n/language';
import { setStoredLanguage } from '../i18n/language';

export function LanguageSwitcher({ className }: { className?: string }) {
  const [language, setLanguage] = useState<AppLanguage>(() => (i18n.language === 'en' ? 'en' : 'vi'));

  useEffect(() => {
    const handler = (lng: string) => setLanguage(lng === 'en' ? 'en' : 'vi');
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);

  return (
    <div className={className ?? 'flex items-center'}>
      <label className="sr-only" htmlFor="language-switcher">
        Language
      </label>
      <select
        id="language-switcher"
        className="field w-44"
        value={language}
        onChange={(e) => {
          const next: AppLanguage = e.target.value === 'en' ? 'en' : 'vi';
          setStoredLanguage(next);
          setLanguage(next);
          void i18n.changeLanguage(next);
        }}
      >
        <option value="vi">Tiếng Việt</option>
        <option value="en">English</option>
      </select>
    </div>
  );
}


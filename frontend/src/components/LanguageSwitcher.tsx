import { useEffect } from 'react';

import i18n from '../i18n/i18n';
import { setStoredLanguage } from '../i18n/language';

export function LanguageSwitcher({ className }: { className?: string }) {
  useEffect(() => {
    setStoredLanguage('vi');
    if (i18n.language !== 'vi') {
      void i18n.changeLanguage('vi');
    }
  }, []);

  return (
    <div className={className ?? 'flex items-center'}>
      <div className="rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-slate" aria-label="Ngôn ngữ">
        Tiếng Việt
      </div>
    </div>
  );
}


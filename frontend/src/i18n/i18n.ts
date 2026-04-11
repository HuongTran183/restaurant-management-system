import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import viTranslation from './locales/vi/translation.json';
import { getInitialLanguage } from './language';

export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: viTranslation },
    en: { translation: viTranslation },
  },
  lng: getInitialLanguage(),
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;


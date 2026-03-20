import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import viTranslation from './locales/vi/translation.json';
import { getInitialLanguage } from './language';

export const i18nReady = i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslation },
    vi: { translation: viTranslation },
  },
  lng: getInitialLanguage(),
  // Nếu thiếu key ở `vi`, sẽ hiện lại chuỗi tiếng Anh (key chính là chuỗi tiếng Anh)
  // để giúp phát hiện thiếu bản dịch thay vì "ẩn" lỗi bằng fallback sang `vi`.
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;


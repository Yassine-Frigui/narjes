  import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files (French only for NBrow Studio)
import frTranslation from './locales/fr/translation.json';

// Initialize i18n - French only configuration for NBrow Studio
i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'fr', // French only
    lng: 'fr', // French only
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    resources: {
      fr: {
        translation: frTranslation,
      },
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;

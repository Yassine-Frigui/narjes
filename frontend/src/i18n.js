  import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import frTranslation from './locales/fr/translation.json';
import enTranslation from './locales/en/translation.json';
import arTranslation from './locales/ar/translation.json';

// Configuration for language detection
const detectionOptions = {
  order: ['localStorage', 'navigator', 'htmlTag'],
  caches: ['localStorage'],
  lookupLocalStorage: 'selectedLanguage',
};

// Initialize i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    detection: detectionOptions,
    fallbackLng: 'fr', // French as default/fallback language
    lng: 'fr', // Default language
    debug: process.env.NODE_ENV === 'development',
    
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    
    resources: {
      fr: {
        translation: frTranslation,
      },
      en: {
        translation: enTranslation,
      },
      ar: {
        translation: arTranslation,
      },
    },
    
    // Handle RTL languages
    react: {
      useSuspense: false,
    },
  });

// Function to set RTL/LTR direction based on language
export const setDirection = (language) => {
  const isRTL = language === 'ar';
  document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  document.documentElement.lang = language;
};

// Set initial direction
setDirection(i18n.language);

// Listen for language changes to update direction
i18n.on('languageChanged', (lng) => {
  setDirection(lng);
});

export default i18n;

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'fr');

  const supportedLanguages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      
  // Save to localStorage for persistence
  localStorage.setItem('selectedLanguage', languageCode);

  // Always use LTR in this project (Arabic removed)
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = languageCode;
      
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  useEffect(() => {
    // Ensure document language and direction are set (LTR only)
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

  // RTL disabled - always false
  const isRTL = false;

  const value = {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isRTL,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

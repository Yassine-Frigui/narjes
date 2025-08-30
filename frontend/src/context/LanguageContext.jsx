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
  const [isRTL, setIsRTL] = useState(false);

  const supportedLanguages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      setCurrentLanguage(languageCode);
      
      // Update RTL status
      const isRightToLeft = languageCode === 'ar';
      setIsRTL(isRightToLeft);
      
      // Save to localStorage for persistence
      localStorage.setItem('selectedLanguage', languageCode);
      
      // Update document direction and language
      document.documentElement.dir = isRightToLeft ? 'rtl' : 'ltr';
      document.documentElement.lang = languageCode;
      
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  useEffect(() => {
    // Set initial RTL status
    const isRightToLeft = currentLanguage === 'ar';
    setIsRTL(isRightToLeft);
    
    // Set initial document direction
    document.documentElement.dir = isRightToLeft ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage]);

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

import React, { useState } from 'react';
import { Dropdown } from 'react-bootstrap';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGlobe } from 'react-icons/fa';

const LanguageSwitcher = ({ variant = 'navbar' }) => {
  const { currentLanguage, supportedLanguages, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentLangData = supportedLanguages.find(lang => lang.code === currentLanguage);

  const handleLanguageChange = async (languageCode) => {
    await changeLanguage(languageCode);
    setIsOpen(false);
  };

  if (variant === 'footer') {
    return (
      <div className="language-switcher-footer">
        <h6 className="text-white mb-3">
          <FaGlobe className="me-2" />
          Language
        </h6>
        <div className="d-flex flex-wrap gap-2">
          {supportedLanguages.map((language) => (
            <motion.button
              key={language.code}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`btn btn-sm rounded-pill px-3 ${
                currentLanguage === language.code
                  ? 'btn-light text-dark'
                  : 'btn-outline-light'
              }`}
              onClick={() => handleLanguageChange(language.code)}
            >
              <span className="me-1">{language.flag}</span>
              {language.name}
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Dropdown show={isOpen} onToggle={setIsOpen} align="end">
      <Dropdown.Toggle
        as="button"
        className="btn btn-link text-white p-2 border-0 bg-transparent d-flex align-items-center"
        style={{ textDecoration: 'none' }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="d-flex align-items-center"
        >
          <FaGlobe className="me-2" />
          <span className="me-1">{currentLangData?.flag}</span>
          <span className="d-none d-md-inline">{currentLangData?.name}</span>
        </motion.div>
      </Dropdown.Toggle>

      <AnimatePresence>
        {isOpen && (
          <Dropdown.Menu
            as={motion.div}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="border-0 shadow-lg"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              minWidth: '150px'
            }}
          >
            {supportedLanguages.map((language) => (
              <motion.div
                key={language.code}
                whileHover={{ backgroundColor: 'rgba(46, 77, 76, 0.1)' }}
              >
                <Dropdown.Item
                  onClick={() => handleLanguageChange(language.code)}
                  className={`d-flex align-items-center py-2 px-3 border-0 ${
                    currentLanguage === language.code ? 'fw-bold' : ''
                  }`}
                  style={{ backgroundColor: 'transparent' }}
                >
                  <span className="me-2">{language.flag}</span>
                  {language.name}
                  {currentLanguage === language.code && (
                    <span className="ms-auto text-success">✓</span>
                  )}
                </Dropdown.Item>
              </motion.div>
            ))}
          </Dropdown.Menu>
        )}
      </AnimatePresence>

      <style jsx>{`
        .language-switcher-footer .btn:focus {
          box-shadow: none;
        }
      `}</style>
    </Dropdown>
  );
};

export default LanguageSwitcher;

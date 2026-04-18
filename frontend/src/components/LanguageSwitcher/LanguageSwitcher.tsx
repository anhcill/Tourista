'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export default function LanguageSwitcher({ variant = 'dropdown' }: { variant?: 'dropdown' | 'inline' }) {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('tourista-language', code);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className={styles.inline}>
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            className={`${styles.inlineBtn} ${i18n.language === lang.code ? styles.active : ''}`}
            onClick={() => handleChange(lang.code)}
          >
            <span className={styles.flag}>{lang.flag}</span>
            <span className={styles.label}>{lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Change language"
      >
        <span className={styles.flag}>{currentLang.flag}</span>
        <span className={styles.code}>{currentLang.code.toUpperCase()}</span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.menu}>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`${styles.option} ${i18n.language === lang.code ? styles.selected : ''}`}
                onClick={() => handleChange(lang.code)}
              >
                <span className={styles.flag}>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

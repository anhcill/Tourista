import React, { useState, useRef, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import styles from './HeaderDropdowns.module.css';

const LANGUAGES = [
    { code: 'vi', label: 'Tiếng Việt', region: 'VN' },
    { code: 'en', label: 'English', region: 'US' },
];

const CURRENCIES = [
    { code: 'VND', label: 'Việt Nam Đồng (₫)' },
    { code: 'USD', label: 'US Dollar ($)' },
];

export default function CurrencyLangDropdown() {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectLang = (code) => {
        i18n.changeLanguage(code);
        localStorage.setItem('tourista-language', code);
    };

    const handleSelectCurrency = (code) => {
        localStorage.setItem('tourista-currency', code);
        setIsOpen(false);
    };

    const currentLang = i18n.language || 'vi';
    const currentCurrency = typeof window !== 'undefined'
        ? (localStorage.getItem('tourista-currency') || 'VND')
        : 'VND';

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
                type="button"
                className={styles.triggerBtn}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                {currentCurrency} | {currentLang.toUpperCase()}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h4 className={styles.headerTitle}>Ngôn ngữ</h4>
                    </div>
                    <div>
                        {LANGUAGES.map((l) => (
                            <button
                                key={l.code}
                                className={`${styles.menuItem} ${currentLang === l.code ? styles.active : ''}`}
                                onClick={() => handleSelectLang(l.code)}
                            >
                                <div className={styles.menuItemLeft}>
                                    <span style={{ fontSize: '16px' }}>
                                        {l.code === 'vi' ? '🇻🇳' : '🇺🇸'}
                                    </span>
                                    <span>{l.label}</span>
                                </div>
                                {currentLang === l.code && <FaCheck style={{ color: '#0f7fb6' }} />}
                            </button>
                        ))}
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.header}>
                        <h4 className={styles.headerTitle}>Tiền tệ</h4>
                    </div>
                    <div style={{ paddingBottom: '8px' }}>
                        {CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                className={`${styles.menuItem} ${currentCurrency === c.code ? styles.active : ''}`}
                                onClick={() => handleSelectCurrency(c.code)}
                            >
                                <div className={styles.menuItemLeft}>
                                    <span style={{ fontWeight: 700, width: '32px' }}>{c.code}</span>
                                    <span style={{ color: '#648392' }}>{c.label}</span>
                                </div>
                                {currentCurrency === c.code && <FaCheck style={{ color: '#0f7fb6' }} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

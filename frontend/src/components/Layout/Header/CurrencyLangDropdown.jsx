import React, { useState, useRef, useEffect } from 'react';
import { FaCheck } from 'react-icons/fa';
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
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState('vi');
    const [currency, setCurrency] = useState('VND');
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
        setLang(code);
    };

    const handleSelectCurrency = (code) => {
        setCurrency(code);
        setIsOpen(false); // Đóng menu sau khi chọn xong
    };

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
                type="button" 
                className={styles.triggerBtn}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                {currency} | {lang.toUpperCase()}
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
                                className={`${styles.menuItem} ${lang === l.code ? styles.active : ''}`}
                                onClick={() => handleSelectLang(l.code)}
                            >
                                <div className={styles.menuItemLeft}>
                                    <span style={{ fontSize: '16px' }}>
                                        {l.code === 'vi' ? '🇻🇳' : '🇺🇸'}
                                    </span>
                                    <span>{l.label}</span>
                                </div>
                                {lang === l.code && <FaCheck style={{ color: '#0f7fb6' }} />}
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
                                className={`${styles.menuItem} ${currency === c.code ? styles.active : ''}`}
                                onClick={() => handleSelectCurrency(c.code)}
                            >
                                <div className={styles.menuItemLeft}>
                                    <span style={{ fontWeight: 700, width: '32px' }}>{c.code}</span>
                                    <span style={{ color: '#648392' }}>{c.label}</span>
                                </div>
                                {currency === c.code && <FaCheck style={{ color: '#0f7fb6' }} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

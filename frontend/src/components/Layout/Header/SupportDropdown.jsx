import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaHeadset, FaPhoneAlt, FaEnvelope, FaQuestionCircle, FaInfoCircle } from 'react-icons/fa';
import styles from './HeaderDropdowns.module.css';

export default function SupportDropdown() {
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

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button 
                type="button" 
                className={`${styles.triggerBtn} ${styles.iconOnly}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Hỗ trợ"
                aria-expanded={isOpen}
            >
                <FaHeadset />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h4 className={styles.headerTitle}>Hỗ trợ khách hàng</h4>
                    </div>
                    
                    <div className={styles.content}>
                        <a href="tel:19009999" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                            <div className={styles.menuItemLeft}>
                                <FaPhoneAlt className={styles.menuItemIcon} />
                                <div>
                                    <span>Hotline 24/7</span>
                                    <div className={styles.menuItemDesc}>1900 9999</div>
                                </div>
                            </div>
                        </a>

                        <a href="mailto:support@tourista.vn" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                            <div className={styles.menuItemLeft}>
                                <FaEnvelope className={styles.menuItemIcon} />
                                <div>
                                    <span>Email hỗ trợ</span>
                                    <div className={styles.menuItemDesc}>support@tourista.vn</div>
                                </div>
                            </div>
                        </a>

                        <div className={styles.divider} />

                        <Link href="/faq" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                            <div className={styles.menuItemLeft}>
                                <FaQuestionCircle className={styles.menuItemIcon} />
                                <span>Câu hỏi thường gặp</span>
                            </div>
                        </Link>

                        <Link href="/policy" className={styles.menuItem} onClick={() => setIsOpen(false)}>
                            <div className={styles.menuItemLeft}>
                                <FaInfoCircle className={styles.menuItemIcon} />
                                <span>Chính sách & Điều khoản</span>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

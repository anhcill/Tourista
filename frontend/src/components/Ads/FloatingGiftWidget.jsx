'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaGift, FaTimes } from 'react-icons/fa';
import styles from './FloatingGiftWidget.module.css';

const STORAGE_KEY = 'tv_gift_dismissed';

const FloatingGiftWidget = () => {
    const { isAuthenticated } = useSelector(state => state.auth);
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(() => {
        // Đọc từ localStorage khi khởi tạo
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) === '1';
        }
        return false;
    });

    // Nếu đã đăng nhập thì không hiện widget
    if (isAuthenticated || isDismissed) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem(STORAGE_KEY, '1');
    };

    return (
        <div className={styles.widgetWrapper}>
            {isOpen && (
                <div className={styles.giftTooltip}>
                    <button
                        className={styles.closeTooltip}
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                    >
                        <FaTimes />
                    </button>
                    <h4>Quà tặng bí mật! 🎁</h4>
                    <p>Nhập mã <strong>LUCKY2026</strong> để được giảm ngay 300k cho đơn từ 2 triệu.</p>
                </div>
            )}

            <button
                className={`${styles.giftBox} ${isOpen ? styles.opened : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Mở hộp quà"
            >
                <FaGift className={styles.giftIcon} />
                <span className={styles.notificationDot}></span>
            </button>

            {!isOpen && (
                <button
                    className={styles.dismissBtn}
                    onClick={handleDismiss}
                    aria-label="Ẩn hộp quà"
                >
                    <FaTimes />
                </button>
            )}
        </div>
    );
};

export default FloatingGiftWidget;

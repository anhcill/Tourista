'use client';

import React, { useState } from 'react';
import { FaGift, FaTimes } from 'react-icons/fa';
import styles from './FloatingGiftWidget.module.css';

const FloatingGiftWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    if (isDismissed) return null;

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
                    onClick={() => setIsDismissed(true)}
                    aria-label="Ẩn hộp quà"
                >
                    <FaTimes />
                </button>
            )}
        </div>
    );
};

export default FloatingGiftWidget;

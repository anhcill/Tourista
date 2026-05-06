'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaTimes, FaGift } from 'react-icons/fa';
import styles from './TopAnnouncementBar.module.css';

const STORAGE_KEY = 'tv_announcement_closed';

const TopAnnouncementBar = () => {
    const [isVisible, setIsVisible] = useState(() => {
        // Đọc từ localStorage khi khởi tạo — tránh bị flash khi Next.js re-render
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY) !== '1';
        }
        return true;
    });
    const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 0, seconds: 0 });

    useEffect(() => {
        // Lấy ngày kết thúc ảo: +12 tiếng kể từ lúc mở
        const endTime = new Date().getTime() + 12 * 60 * 60 * 1000;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                clearInterval(timer);
                return;
            }

            setTimeLeft({
                hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((distance % (1000 * 60)) / 1000)
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    if (!isVisible) return null;

    const pad = (num) => num.toString().padStart(2, '0');

    return (
        <div className={styles.announcementBar}>
            <div className={`container ${styles.announcementContent}`}>
                <div className={styles.leftSide}>
                    <span className={styles.badge}>FLASH SALE</span>
                    <span className={styles.message}>
                        Mùa hè rực rỡ - Giảm tới <strong>20%</strong> toàn bộ Tour Phú Quốc. Nhập mã: <strong className={styles.code}>PHUQUOC20</strong>
                    </span>
                </div>

                <div className={styles.rightSide}>
                    <div className={styles.countdown}>
                        <span className={styles.timeBlock}>{pad(timeLeft.hours)}</span>:
                        <span className={styles.timeBlock}>{pad(timeLeft.minutes)}</span>:
                        <span className={styles.timeBlock}>{pad(timeLeft.seconds)}</span>
                    </div>
                    <Link href="/tours" className={styles.ctaButton}>
                        <FaGift className={styles.ctaIcon} /> Đặt ngay
                    </Link>
                    <button
                        className={styles.closeButton}
                        onClick={() => {
                            setIsVisible(false);
                            localStorage.setItem(STORAGE_KEY, '1');
                        }}
                        aria-label="Đóng thông báo"
                    >
                        <FaTimes />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopAnnouncementBar;


'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaTimes } from 'react-icons/fa';
import styles from './PromoPopup.module.css';

const STORAGE_KEY = 'tourista_promo_closed';

const PromoPopup = () => {
    const [isVisible, setIsVisible] = useState(() => {
        // Đọc từ localStorage khi khởi tạo — tránh bị flash khi Next.js re-render
        if (typeof window !== 'undefined') {
            const lastClosed = localStorage.getItem(STORAGE_KEY);
            const now = new Date().getTime();
            if (lastClosed && now - parseInt(lastClosed, 10) < 86400000) {
                return false;
            }
        }
        return false; // mặc định ẩn, chỉ hiện sau 3s
    });

    useEffect(() => {
        const lastClosed = localStorage.getItem(STORAGE_KEY);
        const now = new Date().getTime();
        if (lastClosed && now - parseInt(lastClosed, 10) < 86400000) {
            return;
        }

        const timer = setTimeout(() => setIsVisible(true), 3000);

        const handleMouseLeave = (e) => {
            if (e.clientY <= 0) {
                setIsVisible(true);
            }
        };

        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        localStorage.setItem(STORAGE_KEY, new Date().getTime().toString());
    };

    if (!isVisible) return null;

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
                <button
                    className={styles.closeBtn}
                    onClick={handleClose}
                    aria-label="Đóng popup"
                >
                    <FaTimes />
                </button>

                <div className={styles.imageContainer}>
                    <Image
                        src="/images/promos/promo_popup_voucher_1775811780696.png"
                        alt="Tourista Studio Welcome Voucher"
                        fill
                        className={styles.promoImage}
                        sizes="(max-width: 768px) 100vw, 400px"
                    />
                </div>

                <div className={styles.content}>
                    <h3>Tặng bạn quà xịn! 🎁</h3>
                    <p>Nhận ngay Voucher <strong>500K</strong> cho chuyến đi đầu tiên cùng Tourista Studio. Đừng bỏ lỡ!</p>
                    <button className={styles.claimButton} onClick={handleClose}>
                        Lấy mã ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoPopup;


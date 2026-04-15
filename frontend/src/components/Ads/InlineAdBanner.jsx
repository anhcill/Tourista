'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';
import styles from './InlineAdBanner.module.css';

/**
 * Component hiển thị Banner Quảng Cáo dọc cắt ngang layout.
 * Props:
 * - imageSrc: Đường dẫn hình ảnh
 * - title: Tiêu đề quảng cáo
 * - subtitle: Phụ đề
 * - link: Đường dẫn khi click vào banner
 * - linkText: Text của nút
 * - overlayPosition: 'left' | 'right' | 'center'
 */
const InlineAdBanner = ({ imageSrc, title, subtitle, link = "#", linkText = "Khám phá ngay", overlayPosition = "left" }) => {
    return (
        <section className={`${styles.adBannerSection} my-12`}>
            <div className="container">
                <Link href={link} className={styles.bannerContainer}>
                    <div className={styles.imageWrapper}>
                        <Image 
                            src={imageSrc} 
                            alt={title} 
                            fill 
                            className={styles.bannerImage}
                            sizes="(max-width: 1200px) 100vw, 1200px"
                        />
                        <div className={`${styles.overlay} ${styles[`overlay-${overlayPosition}`]}`}>
                            <div className={styles.textContent}>
                                <h3 className={styles.title}>{title}</h3>
                                {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
                                <span className={styles.actionBtn}>
                                    {linkText} <FaArrowRight className={styles.icon} />
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    );
};

export default InlineAdBanner;

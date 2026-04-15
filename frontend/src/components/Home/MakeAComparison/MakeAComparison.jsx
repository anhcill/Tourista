'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowRight, FaStar } from 'react-icons/fa';
import { MdCompareArrows } from 'react-icons/md';
import styles from './MakeAComparison.module.css';

const COMPARISONS = [
    {
        id: 1,
        title: 'Những ưu đãi được đánh giá cao nhất, minh chứng cho chất lượng dịch vụ tuyệt hảo.',
        category: 'Khách sạn 5★ đã từng ở',
        cover: '/images/promos/luxury_hotel.png',
        badge: 'Đánh Giá Cao Nhất',
        avg_rating: 4.9,
        review_count: 2340,
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        targetUrl: '/articles/kham-pha-bien-xanh-phu-quoc',
    },
    {
        id: 2,
        title: 'Tận hưởng những khoảnh khắc mang tính biểu tượng và trải nghiệm đáng nhớ nhất.',
        category: 'Tour đặc biệt giảm giá sâu',
        cover: '/images/promos/tropical_beach.png',
        badge: 'Trải Nghiệm Đỉnh Cao',
        avg_rating: 4.8,
        review_count: 1876,
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        targetUrl: '/articles/bi-kip-du-lich-chau-au-ngan-sach-thap',
    },
];

export default function MakeAComparison() {
    const router = useRouter();

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.sectionLabel}>
                        <MdCompareArrows className={styles.compareIcon} />
                        <span>So sánh & Chọn lựa</span>
                    </div>
                    <h2 className={styles.title}>So sánh & Đánh giá</h2>
                    <p className={styles.subtitle}>So sánh các ưu đãi được đánh giá cao nhất để đưa ra lựa chọn tốt nhất</p>
                </div>

                <div className={styles.grid}>
                    {COMPARISONS.map(item => (
                        <ComparisonCard key={item.id} item={item} onClick={() => router.push(item.targetUrl || '/')} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function ComparisonCard({ item, onClick }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            <div className={styles.imageWrap}>
                <img loading="lazy" decoding="async"
                    src={item.cover}
                    alt={item.title}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Badge */}
                <div className={styles.badge} style={{ background: item.gradient }}>
                    {item.badge}
                </div>

                {/* Rating */}
                <div className={styles.ratingChip}>
                    <FaStar className={styles.star} />
                    <span>{item.avg_rating}</span>
                    <span className={styles.reviewCount}>({item.review_count.toLocaleString()})</span>
                </div>

                {/* Content overlay */}
                <div className={styles.contentOverlay}>
                    <p className={styles.category}>{item.category}</p>
                    <h3 className={styles.cardTitle}>{item.title}</h3>
                    <button
                        type="button"
                        className={styles.cardBtn}
                        onClick={(event) => {
                            event.stopPropagation();
                            onClick?.();
                        }}
                    >
                        Xem chi tiết <FaArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
}

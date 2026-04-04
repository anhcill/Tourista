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
        title: 'The Past Offers With The Highest Reviews Outshine Others, Standing As A Testament To Their Exceptional Quality.',
        category: 'Khách sạn 5★ đã từng ở',
        cover: 'https://images.unsplash.com/photo-1493243391983-5d3f54abd64c?w=700&q=80',
        badge: 'Best Reviewed',
        avg_rating: 4.9,
        review_count: 2340,
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        targetUrl: '/hotels/search?destination=Da%20Nang',
    },
    {
        id: 2,
        title: 'Ring In The New Year With Iconic Moments And Unforgettable Memories In New York City.',
        category: 'Tour đặc biệt giảm giá sâu',
        cover: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=700&q=80',
        badge: 'Top Experience',
        avg_rating: 4.8,
        review_count: 1876,
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        targetUrl: '/tours',
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
                    <h2 className={styles.title}>Make A Comparison</h2>
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
                <img
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

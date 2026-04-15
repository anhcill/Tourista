'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { useEffect, useState } from 'react';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import homeApi from '@/api/homeApi';
import styles from './Testimonials.module.css';

export default function Testimonials() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await homeApi.getTestimonials({ limit: 3 });
                const data = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response)
                        ? response
                        : [];

                setReviews(data);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Khong the tai testimonials luc nay.';
                setError(message);
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTestimonials();
    }, []);

    return (
        <section className={styles.section}>
            {/* Background image */}
            <div className={styles.bgWrap}>
                <img loading="lazy" decoding="async"
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80"
                    alt="Beach background"
                    className={styles.bgImage}
                />
                <div className={styles.bgOverlay} />
            </div>

            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Khách Hàng Nói Gì Về Chúng Tôi</h2>
                    <p className={styles.subtitle}>Đánh giá thực từ những người đã trải nghiệm dịch vụ Tourista</p>
                </div>

                {loading && <div className={styles.statusBox}>Dang tai danh gia khach hang...</div>}

                {!loading && error && <div className={styles.statusBox}>{error}</div>}

                {!loading && !error && (
                    <div className={styles.grid}>
                        {reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))}
                    </div>
                )}

                {!loading && !error && reviews.length === 0 && (
                    <div className={styles.statusBox}>Chua co danh gia cong khai tu he thong.</div>
                )}
            </div>
        </section>
    );
}

function ReviewCard({ review }) {
    const stars = Math.max(1, Math.min(5, Math.round(Number(review.rating || 0))));

    return (
        <div className={styles.card}>
            <FaQuoteLeft className={styles.quoteIcon} />

            {/* Stars */}
            <div className={styles.stars}>
                {Array.from({ length: stars }).map((_, i) => (
                    <FaStar key={i} className={styles.star} />
                ))}
            </div>

            <p className={styles.content}>&ldquo;{review.content}&rdquo;</p>

            <p className={styles.target}>{review.targetName || '-'}</p>

            <div className={styles.authorRow}>
                <img loading="lazy" decoding="async" src={review.authorAvatar} alt={review.authorName} className={styles.avatar} />
                <div>
                    <div className={styles.authorName}>
                        {review.authorName}
                        {review.verified && <MdVerified className={styles.verifiedIcon} />}
                    </div>
                    <div className={styles.authorProfession}>Du khach · {review.country}</div>
                </div>
            </div>
        </div>
    );
}

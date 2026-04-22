'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import {
    FaStar, FaArrowRight, FaPlane, FaMapMarkerAlt,
    FaHotel, FaBox, FaLeaf, FaCampground, FaBuilding
} from 'react-icons/fa';
import { MdCompare } from 'react-icons/md';
import homeApi from '@/api/homeApi';
import styles from './CompareOffers.module.css';

const ICON_MAP = {
    FaHotel: <FaHotel />,
    FaPlane: <FaPlane />,
    FaBox: <FaBox />,
    FaLeaf: <FaLeaf />,
    FaCampground: <FaCampground />,
    FaBuilding: <FaBuilding />,
    FaMapMarkerAlt: <FaMapMarkerAlt />,
};

const FALLBACK_CATEGORIES = [
    {
        id: 1,
        type: 'HOTEL',
        label: 'Khách sạn',
        icon: <FaHotel />,
        avgRating: 4.7,
        offerCount: 4538,
        cover_image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
        discount: '40%',
        tag: 'Yêu thích nhất',
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    },
    {
        id: 2,
        type: 'TOUR',
        label: 'Tour du lịch',
        icon: <FaPlane />,
        avgRating: 4.5,
        offerCount: 54,
        cover_image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80',
        discount: '35%',
        tag: 'Khám phá ngay',
        gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    },
];

export default function CompareOffers() {
    const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await homeApi.getCompareCategories();
                const data = Array.isArray(res?.data) ? res.data : [];
                if (data.length > 0) {
                    const mapped = data.map((cat) => ({
                        ...cat,
                        icon: ICON_MAP[cat.icon] || <FaHotel />,
                        cover_image: cat.type === 'HOTEL'
                            ? 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80'
                            : 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80',
                    }));
                    setCategories(mapped);
                }
            } catch {
                // keep fallback
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, []);

    return (
        <section className={styles.section}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.sectionLabel}>
                        <MdCompare className={styles.compareIcon} />
                        <span>So sánh ưu đãi</span>
                    </div>
                    <h2 className={styles.title}>Compare The Highest Reviewed Past Offers</h2>
                    <p className={styles.subtitle}>Browse By Type — Chọn loại dịch vụ phù hợp với chuyến đi của bạn</p>
                </div>

                {/* Grid 2 columns for hotel+tour */}
                <div className={styles.grid}>
                    {categories.map((cat) => (
                        <CategoryCard key={cat.id} cat={cat} loading={loading} />
                    ))}
                </div>

                {/* View All */}
                <div className={styles.viewAllWrapper}>
                    <button className={styles.viewAllBtn}>
                        So sánh tất cả ưu đãi
                        <FaArrowRight className={styles.arrowIcon} />
                    </button>
                </div>
            </div>
        </section>
    );
}

/* ── Category Card ── */
function CategoryCard({ cat, loading }) {
    const [hovered, setHovered] = useState(false);

    if (loading) {
        return (
            <div className={styles.skeletonCard}>
                <div className={styles.skeletonImage} />
                <div className={styles.skeletonFooter} />
            </div>
        );
    }

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div className={styles.imageWrap}>
                <img loading="lazy" decoding="async"
                    src={cat.cover_image}
                    alt={cat.label}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Offer count chip */}
                <div className={styles.offerChip}>
                    <span>{cat.offerCount}</span>
                </div>

                {/* Discount badge */}
                <div className={styles.discountBadge} style={{ background: cat.gradient }}>
                    -{cat.discount}
                </div>
            </div>

            {/* Footer */}
            <div className={`${styles.cardFooter} ${hovered ? styles.cardFooterActive : ''}`}
                style={hovered ? { background: cat.gradient } : {}}>
                <div className={styles.footerLeft}>
                    <span className={styles.catIcon}>{cat.icon}</span>
                    <span className={styles.catLabel}>{cat.label}</span>
                </div>
                <div className={styles.footerRight}>
                    <FaStar className={styles.starIcon} />
                    <span className={styles.rating}>{(cat.avgRating || 4.5).toFixed(1)}</span>
                </div>
            </div>
        </div>
    );
}

'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import {
    FaStar, FaArrowRight, FaPlane, FaMapMarkerAlt,
    FaHotel, FaBox, FaLeaf, FaCampground, FaBuilding
} from 'react-icons/fa';
import { MdCompare } from 'react-icons/md';
import styles from './CompareOffers.module.css';

/* ─────────────────────────────────────────────────────────────
   Mock data — khớp DB:
   booking_type ENUM('FLIGHT','LOCATION','HOTEL','PACKAGE',
                     'SEASONAL','CAMPS','BACKPACKING','HOSTELS')
   JOIN promotions, hotels/tours, avg_rating
   ───────────────────────────────────────────────────────────── */
const CATEGORIES = [
    {
        id: 1,
        type: 'FLIGHT',
        label: 'Vé máy bay',
        icon: <FaPlane />,
        avg_rating: 4.5,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&q=80',
        discount: '30%',
        tag: 'Tiết kiệm nhất',
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    },
    {
        id: 2,
        type: 'LOCATION',
        label: 'Theo địa điểm',
        icon: <FaMapMarkerAlt />,
        avg_rating: 4.3,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400&q=80',
        discount: '25%',
        tag: 'Phổ biến',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    },
    {
        id: 3,
        type: 'HOTEL',
        label: 'Khách sạn',
        icon: <FaHotel />,
        avg_rating: 4.7,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
        discount: '40%',
        tag: 'Yêu thích nhất',
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    },
    {
        id: 4,
        type: 'PACKAGE',
        label: 'Gói trọn bộ',
        icon: <FaBox />,
        avg_rating: 4.8,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&q=80',
        discount: '35%',
        tag: 'All Inclusive',
        gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    },
    {
        id: 5,
        type: 'SEASONAL',
        label: 'Theo mùa',
        icon: <FaLeaf />,
        avg_rating: 4.4,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
        discount: '20%',
        tag: 'Mùa lễ hội',
        gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    },
    {
        id: 6,
        type: 'CAMPS',
        label: 'Cắm trại',
        icon: <FaCampground />,
        avg_rating: 4.5,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&q=80',
        discount: '15%',
        tag: 'Thiên nhiên',
        gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    },
    {
        id: 7,
        type: 'BACKPACKING',
        label: 'Phượt bụi',
        icon: <FaMapMarkerAlt />,
        avg_rating: 4.2,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&q=80',
        discount: '10%',
        tag: 'Tự do',
        gradient: 'linear-gradient(135deg, #fda085, #f6d365)',
    },
    {
        id: 8,
        type: 'HOSTELS',
        label: 'Nhà nghỉ',
        icon: <FaBuilding />,
        avg_rating: 4.0,
        offer_count: 123,
        cover_image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400&q=80',
        discount: '50%',
        tag: 'Giá tốt',
        gradient: 'linear-gradient(135deg, #89f7fe, #66a6ff)',
    },
];

export default function CompareOffers() {
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

                {/* Grid 4×2 */}
                <div className={styles.grid}>
                    {CATEGORIES.map((cat) => (
                        <CategoryCard key={cat.id} cat={cat} />
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
function CategoryCard({ cat }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Image */}
            <div className={styles.imageWrap}>
                <img
                    src={cat.cover_image}
                    alt={cat.label}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Offer count chip */}
                <div className={styles.offerChip}>
                    <span>{cat.offer_count}</span>
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
                    <span className={styles.rating}>{cat.avg_rating.toFixed(1)}</span>
                </div>
            </div>
        </div>
    );
}

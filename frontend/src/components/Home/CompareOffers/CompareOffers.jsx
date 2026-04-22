'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaStar, FaArrowRight, FaPlane, FaMapMarkerAlt,
    FaHotel, FaBuilding, FaUmbrellaBeach, FaHome, FaMountain,
    FaShip, FaUtensils, FaCouch, FaSpa
} from 'react-icons/fa';
import { MdCompare } from 'react-icons/md';
import homeApi from '@/api/homeApi';
import styles from './CompareOffers.module.css';

const ICON_MAP = {
    FaHotel: <FaHotel />,
    FaPlane: <FaPlane />,
    FaBuilding: <FaBuilding />,
    FaUmbrellaBeach: <FaUmbrellaBeach />,
    FaHome: <FaHome />,
    FaMountain: <FaMountain />,
    FaShip: <FaShip />,
    FaUtensils: <FaUtensils />,
    FaCouch: <FaCouch />,
    FaSpa: <FaSpa />,
    FaMapMarkerAlt: <FaMapMarkerAlt />,
};

const TYPE_URLS = {
    HOTEL: '/hotels',
    TOUR: '/tours',
    VILLA: '/hotels',
    RESORT: '/hotels',
    HOMESTAY: '/hotels',
    ADVENTURE: '/tours',
    CRUISE: '/tours',
    FOOD_TOUR: '/tours',
};

const FALLBACK_CATEGORIES = [
    {
        type: 'HOTEL',
        label: 'Khách sạn',
        icon: 'FaHotel',
        avgRating: 4.7,
        itemCount: 4538,
        discount: '40%',
        tag: 'Yêu thích nhất',
        gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        coverImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80',
        description: 'Hơn 4500+ khách sạn từ bình dân đến sang trọng',
    },
    {
        type: 'TOUR',
        label: 'Tour du lịch',
        icon: 'FaPlane',
        avgRating: 4.5,
        itemCount: 1234,
        discount: '35%',
        tag: 'Khám phá ngay',
        gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
        coverImage: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&q=80',
        description: 'Tour trong nước & quốc tế chất lượng cao',
    },
    {
        type: 'VILLA',
        label: 'Biệt thự',
        icon: 'FaBuilding',
        avgRating: 4.8,
        itemCount: 520,
        discount: '30%',
        tag: 'Sang trọng',
        gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
        coverImage: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
        description: 'Biệt thự riêng tư, view đẹp, tiện nghi cao cấp',
    },
    {
        type: 'RESORT',
        label: 'Resort',
        icon: 'FaUmbrellaBeach',
        avgRating: 4.9,
        itemCount: 380,
        discount: '45%',
        tag: 'Nghỉ dưỡng',
        gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
        coverImage: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600&q=80',
        description: 'Khu nghỉ dưỡng 5 sao, bãi biển riêng',
    },
    {
        type: 'HOMESTAY',
        label: 'Homestay',
        icon: 'FaHome',
        avgRating: 4.6,
        itemCount: 890,
        discount: '25%',
        tag: 'Ấm cúng',
        gradient: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
        coverImage: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80',
        description: 'Trải nghiệm như người địa phương',
    },
    {
        type: 'ADVENTURE',
        label: 'Mạo hiểm',
        icon: 'FaMountain',
        avgRating: 4.4,
        itemCount: 320,
        discount: '20%',
        tag: 'Phiêu lưu',
        gradient: 'linear-gradient(135deg, #11998e, #38ef7d)',
        coverImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
        description: 'Leo núi, trekking, khám phá thiên nhiên',
    },
    {
        type: 'CRUISE',
        label: 'Du thuyền',
        icon: 'FaShip',
        avgRating: 4.8,
        itemCount: 156,
        discount: '50%',
        tag: 'Đẳng cấp',
        gradient: 'linear-gradient(135deg, #2193b0, #6dd5ed)',
        coverImage: 'https://images.unsplash.com/photo-1548574505-4eaf2a10a0b0?w=600&q=80',
        description: 'Du thuyền cao cấp, view biển tuyệt đẹp',
    },
    {
        type: 'FOOD_TOUR',
        label: 'Tour ẩm thực',
        icon: 'FaUtensils',
        avgRating: 4.5,
        itemCount: 210,
        discount: '15%',
        tag: 'Ẩm thực',
        gradient: 'linear-gradient(135deg, #ee9ca7, #ffdde1)',
        coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
        description: 'Khám phá ẩm thực địa phương đặc sắc',
    },
];

export default function CompareOffers() {
    const router = useRouter();
    const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await homeApi.getDashboardStats(8);
                const stats = res?.data;
                const cats = Array.isArray(stats?.categories) ? stats.categories : [];
                if (cats.length > 0) {
                    const mapped = cats.map((cat) => ({
                        ...cat,
                        icon: cat.icon ? ICON_MAP[cat.icon] || <FaHotel /> : <FaHotel />,
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

    const handleCategoryClick = (cat) => {
        const url = TYPE_URLS[cat.type] || '/hotels';
        router.push(url);
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.sectionLabel}>
                        <MdCompare className={styles.compareIcon} />
                        <span>So sánh ưu đãi</span>
                    </div>
                    <h2 className={styles.title}>Khám Phá Chỗ Ở Tại Các Điểm Đến Thịnh Hành</h2>
                    <p className={styles.subtitle}>
                        Browse By Type — Chọn loại dịch vụ phù hợp với chuyến đi của bạn
                    </p>
                </div>

                {/* Grid 4 columns, 8 items = 2 rows */}
                <div className={styles.grid}>
                    {categories.map((cat) => (
                        <CategoryCard
                            key={cat.type}
                            cat={cat}
                            loading={loading}
                            onClick={() => handleCategoryClick(cat)}
                        />
                    ))}
                </div>

                {/* View All */}
                <div className={styles.viewAllWrapper}>
                    <button className={styles.viewAllBtn} onClick={() => router.push('/hotels')}>
                        So sánh tất cả dịch vụ
                        <FaArrowRight className={styles.arrowIcon} />
                    </button>
                </div>
            </div>
        </section>
    );
}

/* ── Category Card ── */
function CategoryCard({ cat, loading, onClick }) {
    const [hovered, setHovered] = useState(false);

    if (loading) {
        return (
            <div className={styles.card}>
                <div className={styles.skeletonCard}>
                    <div className={styles.skeletonImage} />
                    <div className={styles.skeletonFooter} />
                </div>
            </div>
        );
    }

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
        >
            {/* Image */}
            <div className={styles.imageWrap}>
                <img loading="lazy" decoding="async"
                    src={cat.coverImage || cat.cover_image}
                    alt={cat.label}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Item count chip */}
                <div className={styles.offerChip}>
                    <span>{(cat.itemCount || cat.offerCount || 0).toLocaleString()}</span>
                </div>

                {/* Discount badge */}
                <div className={styles.discountBadge} style={{ background: cat.gradient }}>
                    -{cat.discount}
                </div>

                {/* Tag badge */}
                <div className={styles.tagBadge}>
                    {cat.tag}
                </div>
            </div>

            {/* Footer */}
            <div className={`${styles.cardFooter} ${hovered ? styles.cardFooterActive : ''}`}
                style={hovered ? { background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' } : {}}>
                <div className={styles.footerLeft}>
                    <span className={styles.catIcon}>{cat.icon}</span>
                    <span className={styles.catLabel}>{cat.label}</span>
                    {cat.labelEn && (
                        <span className={styles.labelEn}>/ {cat.labelEn}</span>
                    )}
                </div>
                <div className={styles.footerRight}>
                    <FaStar className={styles.starIcon} />
                    <span className={styles.rating}>{(cat.avgRating || 4.5).toFixed(1)}</span>
                </div>
            </div>

            {/* Description tooltip */}
            {cat.description && (
                <div className={`${styles.descBar} ${hovered ? styles.descBarVisible : ''}`}>
                    <span>{cat.description}</span>
                </div>
            )}
        </div>
    );
}

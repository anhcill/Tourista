'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowRight } from 'react-icons/fa';
import { MdLocalOffer } from 'react-icons/md';
import styles from './SpecialOfferCategories.module.css';

/* ─────────────────────────────────────────────────────────────
   Mock data — khớp promotions.applies_to + discount types trong DB
   ───────────────────────────────────────────────────────────── */
const OFFERS = [
    {
        id: 1,
        title: 'Loyalty Discounts',
        subtitle: 'Ưu đãi dành cho khách hàng thân thiết',
        cover: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=600&q=80',
        discount: '20%',
        color: '#667eea',
        targetUrl: '/hotels/search?destination=Ha%20Noi',
    },
    {
        id: 2,
        title: 'Early Booking Discounts',
        subtitle: 'Đặt sớm — tiết kiệm nhiều hơn',
        cover: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=80',
        discount: '35%',
        color: '#10b981',
        targetUrl: '/hotels/search?destination=Da%20Nang',
    },
    {
        id: 3,
        title: 'Last-Minute Deals',
        subtitle: 'Ưu đãi giờ chót giá sốc',
        cover: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=600&q=80',
        discount: '50%',
        color: '#f43f5e',
        targetUrl: '/hotels/search?destination=Phu%20Quoc',
    },
    {
        id: 4,
        title: 'Family Packages',
        subtitle: 'Trọn gói gia đình — vui vẻ ngay',
        cover: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=600&q=80',
        discount: '25%',
        color: '#f59e0b',
        targetUrl: '/hotels/search?destination=Nha%20Trang',
    },
    {
        id: 5,
        title: 'Birthday & Anniversary Specials',
        subtitle: 'Quà tặng đặc biệt cho ngày trọng đại',
        cover: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&q=80',
        discount: '30%',
        color: '#ec4899',
        targetUrl: '/hotels/search?destination=Hoi%20An',
    },
    {
        id: 6,
        title: 'Referral Programs',
        subtitle: 'Giới thiệu bạn bè — cùng hưởng ưu đãi',
        cover: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&q=80',
        discount: '15%',
        color: '#8b5cf6',
        targetUrl: '/hotels/search?destination=Ha%20Long',
    },
];

export default function SpecialOfferCategories() {
    const router = useRouter();

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.sectionLabel}>
                            <MdLocalOffer />
                            <span>Danh mục ưu đãi</span>
                        </div>
                        <h2 className={styles.title}>Special Offers</h2>
                        <p className={styles.subtitle}>Khám phá các chương trình khuyến mãi độc quyền tại Tourista Studio</p>
                    </div>
                    <button className={styles.viewAllBtn} onClick={() => router.push('/hotels')}>
                        Xem tất cả <FaArrowRight />
                    </button>
                </div>

                <div className={styles.grid}>
                    {OFFERS.map(offer => (
                        <OfferCard key={offer.id} offer={offer} onClick={() => router.push(offer.targetUrl || '/hotels')} />
                    ))}
                </div>
            </div>
        </section>
    );
}

function OfferCard({ offer, onClick }) {
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
                    src={offer.cover}
                    alt={offer.title}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Discount chip */}
                <div className={styles.discountChip} style={{ background: offer.color }}>
                    -{offer.discount}
                </div>
            </div>

            <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{offer.title}</h3>
                <p className={styles.cardSubtitle}>{offer.subtitle}</p>
                <button
                    className={styles.cardBtn}
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onClick?.();
                    }}
                    style={hovered ? { background: offer.color, color: 'white', borderColor: offer.color } : {}}
                >
                    Xem ưu đãi <FaArrowRight />
                </button>
            </div>
        </div>
    );
}

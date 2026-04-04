'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaHotel, FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { MdExplore } from 'react-icons/md';
import hotelApi from '@/api/hotelApi';
import styles from './TrendingDestinations.module.css';

const FALLBACK_DEST_IMAGE = 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80';

const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildSearchUrl = (destination) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const params = new URLSearchParams({
        destination,
        checkIn: toIsoDate(today),
        checkOut: toIsoDate(tomorrow),
        adults: '2',
        children: '0',
        rooms: '1',
    });

    return `/hotels/search?${params.toString()}`;
};

const ITEMS_PER_PAGE = 8;

export default function TrendingDestinations() {
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [destinations, setDestinations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTrendingDestinations = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await hotelApi.getTrendingHotels({ limit: 24 });
                const hotels = Array.isArray(response?.data) ? response.data : [];

                const grouped = new Map();

                hotels.forEach((hotel) => {
                    const cityName = (hotel.city || 'Diem den').trim();
                    const key = cityName.toLowerCase();

                    if (!grouped.has(key)) {
                        grouped.set(key, {
                            id: Number(hotel.id || 0),
                            city: { name_vi: cityName, name_en: cityName },
                            country: { name_en: 'Viet Nam', flag: '🌏' },
                            hotel_count: 0,
                            avg_price_per_night: 0,
                            avg_rating: 0,
                            cover_image: hotel.coverImage || FALLBACK_DEST_IMAGE,
                        });
                    }

                    const current = grouped.get(key);
                    current.hotel_count += 1;
                    current.avg_price_per_night += Number(hotel.minPricePerNight || 0);
                    current.avg_rating += Number(hotel.avgRating || 0);
                    if (!current.cover_image && hotel.coverImage) {
                        current.cover_image = hotel.coverImage;
                    }
                });

                const mapped = Array.from(grouped.values())
                    .map((item) => ({
                        ...item,
                        avg_price_per_night: item.hotel_count > 0
                            ? Math.round(item.avg_price_per_night / item.hotel_count)
                            : 0,
                        avg_rating: item.hotel_count > 0
                            ? Number((item.avg_rating / item.hotel_count).toFixed(1))
                            : 0,
                        cover_image: item.cover_image || FALLBACK_DEST_IMAGE,
                    }))
                    .sort((a, b) => b.hotel_count - a.hotel_count);

                setDestinations(mapped);
                setPage(0);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Khong the tai diem den thinh hanh.';
                setError(message);
                setDestinations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTrendingDestinations();
    }, []);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(destinations.length / ITEMS_PER_PAGE)),
        [destinations.length],
    );

    const visible = useMemo(
        () => destinations.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE),
        [destinations, page],
    );

    return (
        <section className={styles.section}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.sectionLabel}>
                            <MdExplore className={styles.exploreIcon} />
                            <span>Điểm đến thịnh hành</span>
                        </div>
                        <h2 className={styles.title}>Khám Phá Chỗ Ở Tại Các Điểm Đến Thịnh Hành</h2>
                        <p className={styles.subtitle}>Khám phá các điểm đến hot nhất — nơi mà khách du lịch đang chọn lưu trú</p>
                    </div>

                    {/* Pagination arrows */}
                    <div className={styles.paginationBtns}>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <FaChevronLeft />
                        </button>
                        <button
                            className={styles.pageBtn}
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page === totalPages - 1}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>

                {/* Grid 4 cột */}
                {loading && <div className={styles.statusBox}>Dang tai diem den thinh hanh...</div>}

                {!loading && error && (
                    <div className={styles.statusBoxError}>
                        <p>{error}</p>
                        <button className={styles.retryBtn} onClick={() => window.location.reload()}>
                            Tai lai
                        </button>
                    </div>
                )}

                {!loading && !error && visible.length === 0 && (
                    <div className={styles.statusBox}>Chua co du lieu diem den thinh hanh.</div>
                )}

                {!loading && !error && visible.length > 0 && (
                    <div className={styles.grid}>
                        {visible.map((dest) => (
                            <DestinationCard key={`${dest.city.name_en}-${dest.id}`} dest={dest} onExplore={(city) => router.push(buildSearchUrl(city))} />
                        ))}
                    </div>
                )}

                {/* View All */}
                <div className={styles.viewAllWrapper}>
                    <button className={styles.viewAllBtn} onClick={() => router.push('/hotels')}>
                        Xem tất cả điểm đến
                        <FaArrowRight className={styles.arrowIcon} />
                    </button>
                </div>
            </div>
        </section>
    );
}

/* ── Destination Card ── */
function DestinationCard({ dest, onExplore }) {
    const [hovered, setHovered] = useState(false);

    const handleExplore = () => {
        onExplore?.(dest.city.name_vi || dest.city.name_en);
    };

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={handleExplore}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleExplore();
                }
            }}
        >
            {/* Image */}
            <div className={styles.imageWrap}>
                <img
                    src={dest.cover_image}
                    alt={dest.city.name_en}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Rating chip */}
                <div className={styles.ratingChip}>
                    <FaStar className={styles.starIcon} />
                    <span>{dest.avg_rating.toFixed(1)}</span>
                </div>

                {/* City name overlay */}
                <div className={styles.cityOverlay}>
                    <h3 className={styles.cityName}>
                        {dest.city.name_en}
                    </h3>
                    <p className={styles.countryName}>
                        {dest.country.flag} {dest.country.name_en}
                    </p>
                </div>
            </div>

            {/* Body */}
            <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                    <span className={styles.hotelCount}>
                        <FaHotel className={styles.hotelIcon} />
                        {dest.hotel_count.toLocaleString()} khách sạn
                    </span>
                    <div className={styles.locationBadge}>
                        <FaMapMarkerAlt />
                    </div>
                </div>

                <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Từ</span>
                    <span className={styles.price}>{formatVND(dest.avg_price_per_night)}</span>
                    <span className={styles.priceNote}>/đêm</span>
                </div>

                <button
                    className={`${styles.exploreBtn} ${hovered ? styles.exploreBtnActive : ''}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        handleExplore();
                    }}
                >
                    Khám phá ngay <FaArrowRight />
                </button>
            </div>
        </div>
    );
}

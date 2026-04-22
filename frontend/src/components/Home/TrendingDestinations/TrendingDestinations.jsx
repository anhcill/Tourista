'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaStar, FaHotel, FaPlane, FaArrowRight, FaChevronLeft, FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import { MdExplore } from 'react-icons/md';
import homeApi from '@/api/homeApi';
import styles from './TrendingDestinations.module.css';

const FALLBACK_DEST_IMAGE = 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80';

const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price);

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildHotelSearchUrl = (destination) => {
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

const buildTourSearchUrl = (destination) => {
    const today = new Date();
    const params = new URLSearchParams({
        city: destination,
        departureDate: toIsoDate(today),
        adults: '1',
    });
    return `/tours/search?${params.toString()}`;
};

const ITEMS_PER_PAGE = 8;

const getCoverForCity = (cityName) => {
    const covers = {
        'da-nang': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&q=80',
        'nha-trang': 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=600&q=80',
        'phu-quoc': 'https://images.unsplash.com/photo-1528127269322-8d28b6b5f0f8?w=600&q=80',
        'ho-chi-minh': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=600&q=80',
        'ha-noi': 'https://images.unsplash.com/photo-1553054537-0452e1b4f6fa?w=600&q=80',
        'hoi-an': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&q=80',
        'sapa': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&q=80',
        'can-tho': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=600&q=80',
    };
    const key = (cityName || '').toLowerCase().replace(/\s+/g, '-');
    return covers[key] || FALLBACK_DEST_IMAGE;
};

export default function TrendingDestinations() {
    const router = useRouter();
    const [page, setPage] = useState(0);
    const [cities, setCities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTrendingCities = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await homeApi.getDashboardStats(16);
                const stats = response?.data;
                const cityList = Array.isArray(stats?.trendingCities) ? stats.trendingCities : [];
                const mapped = cityList.map((city) => ({
                    ...city,
                    cover_image: city.coverImage || getCoverForCity(city.nameEn || city.nameVi),
                }));
                setCities(mapped);
                setPage(0);
            } catch (err) {
                setError('Không thể tải điểm đến thịnh hành.');
                setCities([]);
            } finally {
                setLoading(false);
            }
        };
        fetchTrendingCities();
    }, []);

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(cities.length / ITEMS_PER_PAGE)),
        [cities.length],
    );

    const visible = useMemo(
        () => cities.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE),
        [cities, page],
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
                {loading && <div className={styles.statusBox}>Đang tải điểm đến thịnh hành...</div>}

                {!loading && error && (
                    <div className={styles.statusBoxError}>
                        <p>{error}</p>
                        <button className={styles.retryBtn} onClick={() => window.location.reload()}>
                            Tải lại
                        </button>
                    </div>
                )}

                {!loading && !error && visible.length === 0 && (
                    <div className={styles.statusBox}>Chưa có dữ liệu điểm đến thịnh hành.</div>
                )}

                {!loading && !error && visible.length > 0 && (
                    <div className={styles.grid}>
                        {visible.map((dest) => (
                            <DestinationCard
                                key={`${dest.nameEn}-${dest.id}`}
                                dest={dest}
                                onExploreHotels={(city) => router.push(buildHotelSearchUrl(city))}
                                onExploreTours={(city) => router.push(buildTourSearchUrl(city))}
                            />
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
function DestinationCard({ dest, onExploreHotels, onExploreTours }) {
    const [hovered, setHovered] = useState(false);
    const cityName = dest.nameVi || dest.nameEn || '';

    const handleExploreHotels = (e) => {
        e.stopPropagation();
        onExploreHotels?.(cityName);
    };

    const handleExploreTours = (e) => {
        e.stopPropagation();
        onExploreTours?.(cityName);
    };

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            role="button"
            tabIndex={0}
        >
            {/* Image */}
            <div className={styles.imageWrap}>
                <img loading="lazy" decoding="async"
                    src={dest.cover_image || FALLBACK_DEST_IMAGE}
                    alt={cityName}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Rating chip */}
                <div className={styles.ratingChip}>
                    <FaStar className={styles.starIcon} />
                    <span>{(dest.avgRating || 0).toFixed(1)}</span>
                </div>

                {/* City name overlay */}
                <div className={styles.cityOverlay}>
                    <h3 className={styles.cityName}>{cityName}</h3>
                    <p className={styles.countryName}>
                        {dest.countryFlag || '🇻🇳'} {dest.countryName || 'Việt Nam'}
                    </p>
                </div>

                {/* Service chips */}
                <div className={styles.serviceChips}>
                    {dest.hotelCount > 0 && (
                        <span className={styles.serviceChip}>
                            <FaHotel /> {dest.hotelCount} KS
                        </span>
                    )}
                    {dest.tourCount > 0 && (
                        <span className={styles.serviceChipTour}>
                            <FaPlane /> {dest.tourCount} Tour
                        </span>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                    <span className={styles.hotelCount}>
                        <FaHotel className={styles.hotelIcon} />
                        {dest.hotelCount || 0} khách sạn
                    </span>
                    {dest.tourCount > 0 && (
                        <span className={styles.tourCount}>
                            <FaPlane className={styles.tourIcon} />
                            {dest.tourCount} tour
                        </span>
                    )}
                </div>

                <div className={styles.priceRow}>
                    <span className={styles.priceLabel}>Từ</span>
                    <span className={styles.price}>{formatVND(dest.avgHotelPrice || 0)}</span>
                    <span className={styles.priceNote}>/đêm</span>
                </div>

                {/* Action buttons */}
                <div className={styles.actionBtns}>
                    <button
                        className={`${styles.exploreBtn} ${hovered ? styles.exploreBtnActive : ''}`}
                        onClick={handleExploreHotels}
                    >
                        <FaHotel /> Khách sạn
                    </button>
                    {dest.tourCount > 0 && (
                        <button
                            className={`${styles.tourBtn} ${hovered ? styles.tourBtnActive : ''}`}
                            onClick={handleExploreTours}
                        >
                            <FaPlane /> Tour
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    FaHotel, FaStar, FaMapMarkerAlt, FaTag, FaArrowRight, FaClock, FaFire
} from 'react-icons/fa';
import hotelApi from '@/api/hotelApi';
import tourApi from '@/api/tourApi';
import styles from './SpecialOffers.module.css';

const TABS = [
    { id: 'ALL', label: 'Tất cả', icon: <FaTag /> },
    { id: 'HOTEL', label: 'Khách sạn', icon: <FaHotel /> },
];

const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price || 0));

const toIsoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const buildHotelDetailUrl = (hotelId) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const params = new URLSearchParams({
        checkIn: toIsoDate(today),
        checkOut: toIsoDate(tomorrow),
        adults: '2',
        children: '0',
        rooms: '1',
    });

    return `/hotels/${hotelId}?${params.toString()}`;
};

const normalizeHotelsFromResponse = (response) => {
    return Array.isArray(response?.data) ? response.data : [];
};

const pickBadge = (isFeatured, isTrending) => {
    if (isFeatured && isTrending) {
        return { badge: 'Siêu hot', badge_color: 'red' };
    }
    if (isTrending) {
        return { badge: 'Xu hướng', badge_color: 'blue' };
    }
    if (isFeatured) {
        return { badge: 'Nổi bật', badge_color: 'gold' };
    }
    return { badge: 'Đề xuất', badge_color: 'purple' };
};

const buildDealsFromApi = (featuredHotels, trendingHotels) => {
    const byId = new Map();

    const upsert = (hotel, source) => {
        if (!hotel?.id) return;
        const current = byId.get(hotel.id) || {
            id: hotel.id,
            target_type: 'HOTEL',
            hotel_id: hotel.id,
            is_featured: false,
            is_trending: false,
            name: hotel.name || 'Khách sạn',
            city: { name_vi: hotel.city || 'Việt Nam' },
            avg_rating: Number(hotel.avgRating || 0),
            review_count: Number(hotel.reviewCount || 0),
            room_type: {
                base_price_per_night: Number(hotel.minPricePerNight || 0),
            },
            cover_image: hotel.coverImage || 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
            nights: 1,
            promotion: null,
            highlight: Number(hotel.availableRoomTypes || 0) > 0
                ? `Còn ${hotel.availableRoomTypes} loại phòng` : 'Kiểm tra phòng trống',
        };

        if (source === 'FEATURED') current.is_featured = true;
        if (source === 'TRENDING') current.is_trending = true;

        byId.set(hotel.id, current);
    };

    featuredHotels.forEach((hotel) => upsert(hotel, 'FEATURED'));
    trendingHotels.forEach((hotel) => upsert(hotel, 'TRENDING'));

    return Array.from(byId.values())
        .map((deal) => ({
            ...deal,
            ...pickBadge(deal.is_featured, deal.is_trending),
        }))
        .sort((a, b) => {
            if (a.is_trending !== b.is_trending) return Number(b.is_trending) - Number(a.is_trending);
            if (a.is_featured !== b.is_featured) return Number(b.is_featured) - Number(a.is_featured);
            return b.avg_rating - a.avg_rating;
        });
};

const buildTourDealsFromApi = (featuredTours) => {
    return featuredTours
        .filter((tour) => Number(tour?.id || 0) > 0)
        .map((tour) => ({
            id: tour.id,
            target_type: 'TOUR',
            tour_id: tour.id,
            is_featured: true,
            is_trending: false,
            title: tour.title || 'Tour du lich',
            city: {
                name_vi: tour.city || 'Viet Nam',
            },
            avg_rating: Number(tour.avgRating || 0),
            review_count: Number(tour.reviewCount || 0),
            cover_image: tour.coverImage || 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
            nights: Number(tour.durationNights || 0),
            promotion: null,
            highlight: Number(tour.availableSlots || 0) > 0
                ? `Còn ${tour.availableSlots} chỗ`
                : 'Tạm hết chỗ',
            duration_days: Number(tour.durationDays || 1),
            difficulty: tour.difficulty || 'EASY',
            price_per_adult: Number(tour.pricePerAdult || 0),
            price_per_child: Number(tour.pricePerChild || 0),
            badge: 'Tour hấp dẫn',
            badge_color: 'blue',
        }))
        .sort((a, b) => b.avg_rating - a.avg_rating);
};

export default function SpecialOffers() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('ALL');
    const [hotelDeals, setHotelDeals] = useState([]);
    const [tourDeals, setTourDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                setLoading(true);
                setError('');

                const [featuredResponse, trendingResponse, featuredToursResponse] = await Promise.all([
                    hotelApi.getFeaturedHotels(),
                    hotelApi.getTrendingHotels(),
                    tourApi.getFeaturedTours({ limit: 6 }),
                ]);

                const featuredHotels = normalizeHotelsFromResponse(featuredResponse);
                const trendingHotels = normalizeHotelsFromResponse(trendingResponse);
                const featuredTours = Array.isArray(featuredToursResponse?.data) ? featuredToursResponse.data : [];
                setHotelDeals(buildDealsFromApi(featuredHotels, trendingHotels));
                setTourDeals(buildTourDealsFromApi(featuredTours));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Không thể tải ưu đãi lúc này.';
                setError(message);
                setHotelDeals([]);
                setTourDeals([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOffers();
    }, []);

    const filtered = useMemo(() => {
        if (activeTab === 'TOUR') {
            return tourDeals;
        }
        if (activeTab === 'HOTEL') {
            return hotelDeals;
        }
        return [...hotelDeals, ...tourDeals]
            .sort((a, b) => Number(b.avg_rating || 0) - Number(a.avg_rating || 0));
    }, [activeTab, hotelDeals, tourDeals]);

    const handleBookFlow = (item) => {
        if (item.target_type === 'TOUR') {
            if (item.tour_id) {
                router.push(`/tours/${item.tour_id}`);
                return;
            }
            router.push('/tours');
            return;
        }

        if (!item.hotel_id) {
            return;
        }

        router.push(buildHotelDetailUrl(item.hotel_id));
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerLeft}>
                        <div className={styles.sectionLabel}>
                            <FaFire className={styles.fireIcon} />
                            <span>Ưu đãi có thời hạn</span>
                        </div>
                        <h2 className={styles.title}>Ưu đãi nổi bật</h2>
                        <p className={styles.subtitle}>
                            Ưu đãi hấp dẫn từ các khách sạn trên Tourista Studio.
                        </p>
                    </div>

                    <div className={styles.tabs}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className={styles.tabIcon}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading && (
                    <div className={styles.statusBox}>Đang tải ưu đãi khách sạn...</div>
                )}

                {!loading && error && (
                    <div className={styles.statusBoxError}>
                        <p>{error}</p>
                        <button className={styles.retryBtn} onClick={() => window.location.reload()}>
                            Tải lại
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className={styles.grid}>
                            {filtered.map((deal) => (
                                <DealCard
                                    key={`${deal.target_type}-${deal.id}`}
                                    deal={deal}
                                    onBook={handleBookFlow}
                                />
                            ))}
                        </div>

                        {filtered.length === 0 && (
                            <div className={styles.statusBox}>
                                {activeTab === 'TOUR'
                                    ? 'Chưa có ưu đãi tour phù hợp.'
                                    : 'Chưa có ưu đãi khách sạn phù hợp.'}
                            </div>
                        )}
                    </>
                )}

                <div className={styles.viewAllWrapper}>
                    <button
                        className={styles.viewAllBtn}
                        onClick={() => router.push(activeTab === 'TOUR' ? '/tours' : '/hotels')}
                    >
                        Xem tất cả ưu đãi
                        <FaArrowRight className={styles.arrowIcon} />
                    </button>
                </div>
            </div>
        </section>
    );
}

function DealCard({ deal, onBook }) {
    const isHotel = deal.target_type === 'HOTEL';

    const basePrice = isHotel
        ? Number(deal?.room_type?.base_price_per_night || 0)
        : Number(deal?.price_per_adult || 0);
    const hasDiscount = false;
    const finalPrice = basePrice;
    const durationText = isHotel
        ? `${Number(deal.nights || 1)} đêm`
        : `${Number(deal.duration_days || 1)} ngày`;
    const priceNote = isHotel ? '/ phòng / đêm' : '/ người lớn';

    const handleBook = () => {
        onBook?.(deal);
    };

    return (
        <div
            className={styles.card}
            role="button"
            tabIndex={0}
            onClick={handleBook}
            onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleBook();
                }
            }}
        >
            <div className={styles.cardImageWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img loading="lazy" decoding="async"
                    src={deal.cover_image}
                    alt={isHotel ? deal.name : deal.title}
                    className={styles.cardImage}
                />

                <span className={`${styles.badge} ${styles[`badge_${deal.badge_color}`]}`}>
                    {deal.badge}
                </span>

                <span className={styles.durationChip}>
                    <FaClock /> {durationText}
                </span>

                <span className={`${styles.typeBadge} ${isHotel ? styles.typeBadgeHotel : styles.typeBadgeTour}`}>
                    {isHotel ? 'Khách sạn' : 'Tour du lịch'}
                </span>
            </div>

            <div className={styles.cardBody}>
                <p className={styles.cardLocation}>
                    <FaMapMarkerAlt className={styles.locationIcon} />
                    {deal?.city?.name_vi || 'Viet Nam'}
                </p>

                <h3 className={styles.cardTitle}>
                    {isHotel ? deal.name : deal.title}
                </h3>

                <div className={styles.ratingRow}>
                    <FaStar className={styles.starIcon} />
                    <span className={styles.ratingValue}>{Number(deal.avg_rating || 0).toFixed(1)}</span>
                    <span className={styles.ratingCount}>({deal.review_count} đánh giá)</span>
                </div>

                <div className={styles.highlightTag}>✓ {deal.highlight}</div>

                <div className={styles.priceRow}>
                    <div>
                        {hasDiscount && <span className={styles.originalPrice}>{formatVND(basePrice)}</span>}
                        <div className={styles.discountPrice}>{formatVND(finalPrice)}</div>
                        <span className={styles.perNight}>{priceNote}</span>
                    </div>
                    <button
                        className={styles.bookBtn}
                        onClick={(event) => {
                            event.stopPropagation();
                            handleBook();
                        }}
                    >
                        Đặt ngay
                    </button>
                </div>
            </div>
        </div>
    );
}

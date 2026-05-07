import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { HotelCardItem } from '../../../types/chat';
import styles from './HotelResultCard.module.css';

interface HotelResultCardProps {
    metadata: string | null | undefined;
}

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(price);
};

const renderStars = (count: number): string => {
    return '★'.repeat(count);
};

const HotelResultCard = ({ metadata }: HotelResultCardProps) => {
    const router = useRouter();

    const hotels: HotelCardItem[] = useMemo(() => {
        if (!metadata) return [];
        try {
            const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            return Array.isArray(parsed) ? (parsed as HotelCardItem[]) : [];
        } catch {
            console.error('Loi parse HotelResultCard metadata:', metadata);
            return [];
        }
    }, [metadata]);

    if (hotels.length === 0) return null;

    return (
        <div className={styles.container}>
            {hotels.map((hotel) => (
                <div key={hotel.id} className={styles.card}>
                    <div className={styles.imageWrapper}>
                        <Image
                            src={
                                typeof hotel.imageUrl === 'string' && hotel.imageUrl.trim()
                                    ? hotel.imageUrl
                                    : '/images/placeholders/hotel-placeholder.jpg'
                            }
                            alt={hotel.name}
                            className={styles.image}
                            fill
                            sizes="(max-width: 400px) 110px, 128px"
                            unoptimized
                        />
                        <div className={styles.ratingBadge}>
                            ⭐ {Number(hotel.avgRating ?? 0).toFixed(1)}{' '}
                            <span>({hotel.reviewCount ?? 0})</span>
                        </div>
                        {hotel.starRating && (
                            <div className={styles.starBadge}>
                                {renderStars(hotel.starRating)}
                            </div>
                        )}
                    </div>

                    <div className={styles.content}>
                        <div className={styles.titleRow}>
                            <h4 className={styles.name} title={hotel.name}>
                                {hotel.name}
                            </h4>

                            <div className={styles.metaInfo}>
                                <span className={styles.metaItem}>
                                    📍 {hotel.cityVi}
                                </span>
                                {hotel.address && (
                                    <span className={styles.metaItem}>
                                        {hotel.address}
                                    </span>
                                )}
                            </div>

                            <div className={styles.ratingRow}>
                                <span className={styles.ratingStars}>
                                    {renderStars(hotel.starRating || 3)}
                                </span>
                                <span className={styles.ratingText}>
                                    {hotel.starRating} sao
                                </span>
                            </div>
                        </div>

                        <div className={styles.priceRow}>
                            <span className={styles.priceLabel}>Từ:</span>
                            <span className={styles.priceValue}>
                                {formatPrice(hotel.minPricePerNight)}
                            </span>
                            <span className={styles.priceUnit}>/đêm</span>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/hotels/${hotel.id}`} className={styles.btnOutline}>
                                Chi tiết
                            </Link>
                            <button
                                onClick={() => router.push(`/hotels/${hotel.id}`)}
                                className={styles.btnPrimary}
                            >
                                Đặt phòng
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HotelResultCard;

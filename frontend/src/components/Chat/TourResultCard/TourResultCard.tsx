import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { TourCardItem } from '../../../types/chat';
import styles from './TourResultCard.module.css';

interface TourResultCardProps {
    metadata: string | null | undefined;
}

const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(price);
};

const TourResultCard = ({ metadata }: TourResultCardProps) => {
    const router = useRouter();

    const tours: TourCardItem[] = useMemo(() => {
        if (!metadata) return [];
        try {
            const parsed = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            return Array.isArray(parsed) ? (parsed as TourCardItem[]) : [];
        } catch {
            console.error('Loi parse TourResultCard metadata:', metadata);
            return [];
        }
    }, [metadata]);

    if (tours.length === 0) return null;

    return (
        <div className={styles.container}>
            {tours.map((tour) => (
                <div key={tour.id} className={styles.card}>
                    <div className={styles.imageWrapper}>
                        <Image
                            src={
                                typeof tour.imageUrl === 'string' && tour.imageUrl.trim()
                                    ? tour.imageUrl
                                    : '/images/placeholders/tour-placeholder.jpg'
                            }
                            alt={tour.title}
                            className={styles.image}
                            fill
                            sizes="(max-width: 400px) 110px, 128px"
                            unoptimized
                        />
                        <div className={styles.ratingBadge}>
                            ⭐ {Number(tour.avgRating ?? 0).toFixed(1)}{' '}
                            <span>({tour.reviewCount ?? 0})</span>
                        </div>
                    </div>

                    <div className={styles.content}>
                        <h4 className={styles.title} title={tour.title}>
                            {tour.title}
                        </h4>

                        <div className={styles.metaInfo}>
                            <span className={styles.metaItem}>📍 {tour.cityVi}</span>
                            <span className={styles.metaItem}>
                                ⏱️ {tour.durationDays}N{tour.durationNights}Đ
                            </span>
                        </div>

                        <div className={styles.priceRow}>
                            <span className={styles.priceLabel}>Chi tu:</span>
                            <span className={styles.priceValue}>{formatPrice(tour.pricePerAdult)}</span>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/tours/${tour.id}`} className={styles.btnOutline}>
                                Chi tiet
                            </Link>
                            <button
                                onClick={() => router.push(`/tours/${tour.id}`)}
                                className={styles.btnPrimary}
                            >
                                Dat ngay
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TourResultCard;

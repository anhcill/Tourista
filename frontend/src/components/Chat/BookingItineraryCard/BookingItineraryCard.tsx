'use client';

import React, { useMemo } from 'react';
import type { BookingDetailsMetadata } from '../../../types/chat';
import styles from './BookingItineraryCard.module.css';

interface StatusConfig {
    label: string;
    color: string;
    bg: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
    CONFIRMED:  { label: 'Da xac nhan',  color: '#51cf66', bg: '#ebfbee' },
    PENDING:    { label: 'Cho xac nhan', color: '#ffd43b', bg: '#fff9db' },
    CHECKED_IN: { label: 'Da check-in',  color: '#339af0', bg: '#e7f5ff' },
    COMPLETED:  { label: 'Hoan thanh',   color: '#868e96', bg: '#f1f3f5' },
    CANCELLED:  { label: 'Da huy',       color: '#ff6b6b', bg: '#fff5f5' },
    REFUNDED:   { label: 'Da hoan tien', color: '#cc5de8', bg: '#f8f0fc' },
};

const formatVND = (amount: number | undefined | null): string => {
    if (!amount) return '—';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount);
};

const formatDate = (dateStr: string | undefined | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

interface BookingItineraryCardProps {
    metadata: string | null | undefined;
}

const BookingItineraryCard = ({ metadata }: BookingItineraryCardProps) => {
    const data: BookingDetailsMetadata | null = useMemo(() => {
        if (!metadata) return null;
        try {
            return typeof metadata === 'string'
                ? (JSON.parse(metadata) as BookingDetailsMetadata)
                : (metadata as BookingDetailsMetadata);
        } catch {
            return null;
        }
    }, [metadata]);

    if (!data) {
        return <div className={styles.error}>⚠️ Khong the hien thi thong tin booking</div>;
    }

    const status = STATUS_CONFIG[data.status] || STATUS_CONFIG.PENDING;
    const isTour = data.bookingType === 'TOUR';

    return (
        <div className={styles.card}>
            {/* ── Header ── */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={styles.typeIcon}>{isTour ? '🗺️' : '🏨'}</span>
                    <div>
                        <div className={styles.bookingCode}>{data.bookingCode}</div>
                        <div className={styles.bookingType}>{isTour ? 'Tour du lich' : 'Khach san'}</div>
                    </div>
                </div>
                <span
                    className={styles.statusBadge}
                    style={{ color: status.color, backgroundColor: status.bg }}
                >
                    {status.label}
                </span>
            </div>

            {/* ── Tour Branch ── */}
            {isTour && (
                <>
                    <div className={styles.section}>
                        <div className={styles.title}>{data.tourTitle}</div>
                        <div className={styles.infoCols}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>📅 Khoi hanh</span>
                                <span className={styles.infoValue}>{formatDate(data.departureDate)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>⏱️ Thoi gian</span>
                                <span className={styles.infoValue}>
                                    {data.durationDays}N{data.durationNights}D
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>👥 So khach</span>
                                <span className={styles.infoValue}>
                                    {data.numAdults} nguoi lon{data.numChildren && data.numChildren > 0
                                        ? `, ${data.numChildren} tre em`
                                        : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Lịch trình Timeline */}
                    {data.itinerary && data.itinerary.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>📍 Lich trinh</div>
                            <div className={styles.timeline}>
                                {data.itinerary.map((day, idx) => (
                                    <div key={idx} className={styles.timelineItem}>
                                        <div className={styles.timelineDot}>
                                            <span className={styles.dayNumber}>N{day.day}</span>
                                        </div>
                                        <div className={styles.timelineContent}>
                                            <div className={styles.dayTitle}>{day.title}</div>
                                            {day.description && (
                                                <div className={styles.dayDesc}>{day.description}</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Bao gồm / Không bao gồm */}
                    {(data.includes || data.excludes) && (
                        <div className={styles.includesRow}>
                            {data.includes && (
                                <div className={styles.includesBlock}>
                                    <div className={styles.includesTitle}>✅ Bao gom</div>
                                    <div className={styles.includesText}>{data.includes}</div>
                                </div>
                            )}
                            {data.excludes && (
                                <div className={styles.excludesBlock}>
                                    <div className={styles.excludesTitle}>❌ Khong bao gom</div>
                                    <div className={styles.excludesText}>{data.excludes}</div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ── Hotel Branch ── */}
            {!isTour && (
                <div className={styles.section}>
                    <div className={styles.title}>{data.hotelName}</div>
                    {data.hotelAddress && (
                        <div className={styles.address}>📍 {data.hotelAddress}</div>
                    )}
                    <div className={styles.infoCols}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>🛏️ Phong</span>
                            <span className={styles.infoValue}>{data.roomTypeName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📥 Check-in</span>
                            <span className={styles.infoValue}>
                                {formatDate(data.checkInDate)}{data.checkInTime ? ` (${data.checkInTime})` : ''}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📤 Check-out</span>
                            <span className={styles.infoValue}>
                                {formatDate(data.checkOutDate)}{data.checkOutTime ? ` (${data.checkOutTime})` : ''}
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>🌙 So dem</span>
                            <span className={styles.infoValue}>
                                {data.nights} dem × {data.numRooms} phong
                            </span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>👥 Khach</span>
                            <span className={styles.infoValue}>
                                {data.adults} nguoi lon{data.children && data.children > 0
                                    ? `, ${data.children} tre em`
                                    : ''}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer: Tong tien + Doi tac ── */}
            <div className={styles.footer}>
                <div className={styles.totalAmount}>
                    <span className={styles.totalLabel}>Tong tien</span>
                    <span className={styles.totalValue}>{formatVND(data.totalAmount)}</span>
                </div>
                {data.partner && (
                    <div className={styles.partnerInfo}>
                        <span className={styles.partnerLabel}>Lien he:</span>
                        <span className={styles.partnerName}>{data.partner.name}</span>
                        {data.partner.phone && (
                            <a
                                className={styles.partnerPhone}
                                href={`tel:${data.partner.phone}`}
                            >
                                📞 {data.partner.phone}
                            </a>
                        )}
                    </div>
                )}
                {data.specialRequests && (
                    <div className={styles.special}>
                        📝 <em>Yeu cau dac biet: {data.specialRequests}</em>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingItineraryCard;

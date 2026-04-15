'use client';

import React, { useMemo } from 'react';
import styles from './BookingItineraryCard.module.css';

/**
 * BookingItineraryCard — Component render thẻ thông tin booking đầy đủ trong Chat.
 * Nhận `metadata` là chuỗi JSON từ ChatMessage, parse ra và hiển thị.
 */
const STATUS_CONFIG = {
    CONFIRMED:   { label: 'Đã xác nhận', color: '#51cf66', bg: '#ebfbee' },
    PENDING:     { label: 'Chờ xác nhận', color: '#ffd43b', bg: '#fff9db' },
    CHECKED_IN:  { label: 'Đã check-in', color: '#339af0', bg: '#e7f5ff' },
    COMPLETED:   { label: 'Hoàn thành', color: '#868e96', bg: '#f1f3f5' },
    CANCELLED:   { label: 'Đã hủy', color: '#ff6b6b', bg: '#fff5f5' },
    REFUNDED:    { label: 'Đã hoàn tiền', color: '#cc5de8', bg: '#f8f0fc' },
};

const formatVND = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency', currency: 'VND',
    }).format(amount);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
};

const BookingItineraryCard = ({ metadata }) => {
    const data = useMemo(() => {
        try { return JSON.parse(metadata); }
        catch { return null; }
    }, [metadata]);

    if (!data) return (
        <div className={styles.error}>⚠️ Không thể hiển thị thông tin booking</div>
    );

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
                        <div className={styles.bookingType}>{isTour ? 'Tour du lịch' : 'Khách sạn'}</div>
                    </div>
                </div>
                <span className={styles.statusBadge} style={{ color: status.color, backgroundColor: status.bg }}>
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
                                <span className={styles.infoLabel}>📅 Khởi hành</span>
                                <span className={styles.infoValue}>{formatDate(data.departureDate)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>⏱️ Thời gian</span>
                                <span className={styles.infoValue}>{data.durationDays}N{data.durationNights}Đ</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>👥 Số khách</span>
                                <span className={styles.infoValue}>{data.numAdults} người lớn{data.numChildren > 0 ? `, ${data.numChildren} trẻ em` : ''}</span>
                            </div>
                        </div>
                    </div>

                    {/* Lịch trình Timeline */}
                    {data.itinerary?.length > 0 && (
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>📍 Lịch trình</div>
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
                                    <div className={styles.includesTitle}>✅ Bao gồm</div>
                                    <div className={styles.includesText}>{data.includes}</div>
                                </div>
                            )}
                            {data.excludes && (
                                <div className={styles.excludesBlock}>
                                    <div className={styles.excludesTitle}>❌ Không bao gồm</div>
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
                    {data.hotelAddress && <div className={styles.address}>📍 {data.hotelAddress}</div>}
                    <div className={styles.infoCols}>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>🛏️ Phòng</span>
                            <span className={styles.infoValue}>{data.roomTypeName}</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📥 Check-in</span>
                            <span className={styles.infoValue}>{formatDate(data.checkInDate)} ({data.checkInTime})</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>📤 Check-out</span>
                            <span className={styles.infoValue}>{formatDate(data.checkOutDate)} ({data.checkOutTime})</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>🌙 Số đêm</span>
                            <span className={styles.infoValue}>{data.nights} đêm × {data.numRooms} phòng</span>
                        </div>
                        <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>👥 Khách</span>
                            <span className={styles.infoValue}>{data.adults} người lớn{data.children > 0 ? `, ${data.children} trẻ em` : ''}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Footer: Tổng tiền + Đối tác ── */}
            <div className={styles.footer}>
                <div className={styles.totalAmount}>
                    <span className={styles.totalLabel}>Tổng tiền</span>
                    <span className={styles.totalValue}>{formatVND(data.totalAmount)}</span>
                </div>
                {data.partner && (
                    <div className={styles.partnerInfo}>
                        <span className={styles.partnerLabel}>Liên hệ:</span>
                        <span className={styles.partnerName}>{data.partner.name}</span>
                        {data.partner.phone && (
                            <a className={styles.partnerPhone} href={`tel:${data.partner.phone}`}>
                                📞 {data.partner.phone}
                            </a>
                        )}
                    </div>
                )}
                {data.specialRequests && (
                    <div className={styles.special}>
                        📝 <em>Yêu cầu đặc biệt: {data.specialRequests}</em>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingItineraryCard;

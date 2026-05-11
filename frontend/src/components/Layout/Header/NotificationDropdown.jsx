import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FaBell, FaCheckDouble, FaGift, FaSuitcase, FaHotel, FaCheckCircle, FaTimesCircle, FaTrophy, FaSpinner } from 'react-icons/fa';
import axiosClient from '../../../api/axiosClient';
import styles from './HeaderDropdowns.module.css';

const TYPE_ICON = {
    booking: <FaCheckCircle style={{ color: '#15803d' }} />,
    reminder: <FaSuitcase style={{ color: '#d97706' }} />,
    cancel: <FaTimesCircle style={{ color: '#dc2626' }} />,
    completed: <FaTrophy style={{ color: '#7c3aed' }} />,
    hotel: <FaHotel />,
    gift: <FaGift />,
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 30) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [readIds, setReadIds] = useState(() => {
        try {
            return new Set(JSON.parse(localStorage.getItem('notif_read_ids') || '[]'));
        } catch {
            return new Set();
        }
    });
    const dropdownRef = useRef(null);
    const hasFetched = useRef(false);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/notifications');
            const list = Array.isArray(res) ? res
                : Array.isArray(res?.data) ? res.data
                : [];
            setNotifications(list);
        } catch {
            // User not logged in or server error — keep existing state
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch once when dropdown first opens
    useEffect(() => {
        if (isOpen && !hasFetched.current) {
            hasFetched.current = true;
            fetchNotifications();
        }
    }, [isOpen, fetchNotifications]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => n.unread && !readIds.has(n.id)).length;

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id);
        const newReadIds = new Set([...readIds, ...allIds]);
        setReadIds(newReadIds);
        try {
            localStorage.setItem('notif_read_ids', JSON.stringify([...newReadIds]));
        } catch { /* noop */ }
    };

    const handleNotifClick = (id) => {
        const newReadIds = new Set([...readIds, id]);
        setReadIds(newReadIds);
        try {
            localStorage.setItem('notif_read_ids', JSON.stringify([...newReadIds]));
        } catch { /* noop */ }
        setIsOpen(false);
    };

    return (
        <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
                type="button"
                className={`${styles.triggerBtn} ${styles.iconOnly}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Thông báo"
                aria-expanded={isOpen}
            >
                <FaBell />
                {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className={`${styles.dropdown} ${styles.dropdownLarge}`}>
                    <div className={styles.header}>
                        <h4 className={styles.headerTitle}>Thông báo</h4>
                        {unreadCount > 0 && (
                            <button className={styles.headerAction} onClick={markAllAsRead}>
                                <FaCheckDouble style={{ marginRight: '4px' }} /> Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    <div className={styles.content}>
                        {loading ? (
                            <div className={styles.emptyState}>
                                <FaSpinner style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
                                <div>Đang tải thông báo...</div>
                            </div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notif) => {
                                const isRead = readIds.has(notif.id) || !notif.unread;
                                return (
                                    <Link
                                        key={notif.id}
                                        href={notif.link || '/profile/bookings'}
                                        className={`${styles.notifItem} ${!isRead ? styles.unread : ''}`}
                                        onClick={() => handleNotifClick(notif.id)}
                                    >
                                        <div className={styles.notifIcon}>
                                            {TYPE_ICON[notif.type] || <FaBell />}
                                        </div>
                                        <div className={styles.notifBody}>
                                            <h5 className={styles.notifTitle}>
                                                {notif.title}
                                                <span className={styles.notifTime}>{timeAgo(notif.createdAt)}</span>
                                            </h5>
                                            <p className={styles.notifText}>{notif.text}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className={styles.emptyState}>
                                <FaBell style={{ fontSize: 24, opacity: 0.3, marginBottom: 8 }} />
                                <div>Không có thông báo nào.</div>
                                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>Đặt tour hoặc khách sạn để nhận thông báo</div>
                            </div>
                        )}
                    </div>

                    <div className={styles.notifFooter}>
                        <Link href="/profile/bookings" className={styles.notifFooterLink} onClick={() => setIsOpen(false)}>
                            Xem tất cả đơn đặt →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

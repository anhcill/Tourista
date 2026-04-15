import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FaBell, FaCheckDouble, FaGift, FaSuitcase, FaHotel } from 'react-icons/fa';
import styles from './HeaderDropdowns.module.css';

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        title: 'Đặt phòng thành công!',
        time: '10 phút trước',
        icon: <FaHotel />,
        text: 'Khách sạn InterContinental Đà Nẵng đã xác nhận đặt phòng của bạn (#B1092).',
        unread: true,
        link: '/profile/bookings'
    },
    {
        id: 2,
        title: 'Ưu đãi ngày Lễ',
        time: '2 giờ trước',
        icon: <FaGift />,
        text: 'Giảm ngay 20% cho các Tour du lịch biển. Áp dụng đến cuối tuần này.',
        unread: true,
        link: '/tours'
    },
    {
        id: 3,
        title: 'Nhắc nhở chuyến đi',
        time: '1 ngày trước',
        icon: <FaSuitcase />,
        text: 'Đừng quên chuyến đi Phú Quốc của bạn sẽ bắt đầu vào ngày mai.',
        unread: false,
        link: '/profile/bookings'
    }
];

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const dropdownRef = useRef(null);

    const unreadCount = notifications.filter(n => n.unread).length;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, unread: false })));
    };

    const handleNotifClick = (id) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, unread: false } : n));
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
                    <span className={styles.badge}>{unreadCount}</span>
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
                        {notifications.length > 0 ? (
                            notifications.map((notif) => (
                                <Link 
                                    key={notif.id} 
                                    href={notif.link} 
                                    className={`${styles.notifItem} ${notif.unread ? styles.unread : ''}`}
                                    onClick={() => handleNotifClick(notif.id)}
                                >
                                    <div className={styles.notifIcon}>
                                        {notif.icon}
                                    </div>
                                    <div className={styles.notifBody}>
                                        <h5 className={styles.notifTitle}>
                                            {notif.title}
                                            <span className={styles.notifTime}>{notif.time}</span>
                                        </h5>
                                        <p className={styles.notifText}>{notif.text}</p>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className={styles.emptyState}>
                                Không có thông báo nào.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

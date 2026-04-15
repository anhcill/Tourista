'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaHeart, FaMapMarkerAlt, FaStar, FaFolderOpen } from 'react-icons/fa';
import { toast } from 'react-toastify';
import favoriteApi from '@/api/favoriteApi';
import styles from './page.module.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80';

const formatPrice = (value) => {
    const amount = Number(value || 0);
    return `${new Intl.NumberFormat('vi-VN').format(amount)}₫`;
};

export default function FavoritesPage() {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state) => state.auth);

    const [activeTab, setActiveTab] = useState('ALL');
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            router.replace('/login');
            return;
        }

        const loadFavorites = async () => {
            setLoading(true);
            try {
                const data = await favoriteApi.getMyFavorites();
                setFavorites(Array.isArray(data) ? data : []);
            } catch (error) {
                toast.error(error?.message || 'Khong the tai danh sach yeu thich.');
            } finally {
                setLoading(false);
            }
        };

        void loadFavorites();
    }, [isAuthenticated, router]);

    const filteredFavorites = useMemo(() => favorites.filter(item => {
        if (activeTab === 'ALL') return true;
        return item.type === activeTab;
    }), [activeTab, favorites]);

    const removeFavorite = async (item) => {
        if (!item || removingId === item.id) return;

        setRemovingId(item.id);
        try {
            await favoriteApi.removeFavorite(item.type, item.targetId);
            setFavorites((prev) => prev.filter((fav) => fav.id !== item.id));
            toast.success('Da xoa khoi danh sach yeu thich.');
        } catch (error) {
            toast.error(error?.message || 'Khong the xoa favorite.');
        } finally {
            setRemovingId(null);
        }
    };

    if (!isAuthenticated) {
        return <div className={styles.container}>Dang chuyen den trang dang nhap...</div>;
    }

    if (loading) {
        return <div className={styles.container}>Dang tai danh sach yeu thich...</div>;
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <FaHeart className={styles.titleIcon} />
                    Danh sách yêu thích
                </h1>
                <p className={styles.subtitle}>
                    Lưu lại những khách sạn và chuyến đi mơ ước của bạn để đặt dễ dàng hơn.
                </p>
            </div>

            <div className={styles.filterTabs}>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'ALL' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('ALL')}
                >
                    Tất cả ({favorites.length})
                </button>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'HOTEL' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('HOTEL')}
                >
                    Khách sạn ({favorites.filter(f => f.type === 'HOTEL').length})
                </button>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'TOUR' ? styles.tabBtnActive : ''}`}
                    onClick={() => setActiveTab('TOUR')}
                >
                    Tour du lịch ({favorites.filter(f => f.type === 'TOUR').length})
                </button>
            </div>

            {filteredFavorites.length > 0 ? (
                <div className={styles.grid}>
                    {filteredFavorites.map(item => (
                        <div key={item.id} className={styles.card}>
                            <div className={styles.cardImageWrap}>
                                <img 
                                    src={item.imageUrl || FALLBACK_IMAGE}
                                    alt={item.title} 
                                    className={styles.cardImg}
                                    onError={(e) => {
                                        e.currentTarget.src = FALLBACK_IMAGE;
                                    }}
                                />
                                <div className={styles.badge}>
                                    {item.type === 'HOTEL' ? 'Khách sạn' : 'Tour'}
                                </div>
                                <button 
                                    className={styles.likeBtn}
                                    onClick={() => void removeFavorite(item)}
                                    aria-label="Xóa khỏi yêu thích"
                                    disabled={removingId === item.id}
                                >
                                    <FaHeart />
                                </button>
                            </div>
                            
                            <div className={styles.cardBody}>
                                <div className={styles.ratingTag}>
                                    <FaStar /> {Number(item.rating || 0).toFixed(1)} ({item.reviewCount || 0})
                                </div>
                                <h3 className={styles.cardTitle}>{item.title}</h3>
                                <div className={styles.cardMeta}>
                                    <FaMapMarkerAlt />
                                    <span>{item.location}</span>
                                </div>

                                <div className={styles.cardFooter}>
                                    <div>
                                        <div className={styles.priceLabel}>Giá từ</div>
                                        <div className={styles.priceValue}>{formatPrice(item.priceFrom)}</div>
                                    </div>
                                    <Link href={item.detailPath || (item.type === 'HOTEL' ? `/hotels/${item.targetId}` : `/tours/${item.targetId}`)}>
                                        <button className={styles.bookBtn}>Xem chi tiết</button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <FaFolderOpen className={styles.emptyIcon} />
                    <h3 className={styles.emptyTitle}>Chưa có mục yêu thích nào</h3>
                    <p className={styles.emptyDesc}>Hãy khám phá các điểm đến tuyệt vời và lưu chúng lại vào danh sách này nhé.</p>
                    <Link href="/" className={styles.exploreBtn}>
                        Khám phá ngay
                    </Link>
                </div>
            )}
        </div>
    );
}

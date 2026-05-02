'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaPlane, FaPlus, FaEdit, FaEye, FaEyeSlash, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import partnerApi from '@/api/partnerApi';
import styles from './page.module.css';

type TourType = {
  id: number;
  name?: string;
  title?: string;
  city?: string;
  coverImage?: string;
  imageUrl?: string;
  isActive: boolean;
  avgRating?: number;
  totalBookings?: number;
  totalRevenue?: number;
  durationDays?: number;
  durationNights?: number;
};

const formatCurrency = (amount: unknown) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} VND`;

export default function PartnerToursPage() {
  const [tours, setTours] = useState<TourType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const data = await partnerApi.getPartnerTours();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setTours(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách tour.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Tour của tôi</h2>
          <p>Quản lý danh sách và trạng thái tour của bạn.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.refreshBtn} onClick={() => void load({ silent: true })} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
          <Link href="/admin/tours/create" className={styles.primaryBtn}>
            <FaPlus /> Thêm tour
          </Link>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Đang tải danh sách tour...</div>
      ) : error ? (
        <div className={styles.errorState}>{error}</div>
      ) : tours.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Bạn chưa có tour nào.</p>
          <Link href="/admin/tours/create" className={styles.primaryBtn}>
            <FaPlus /> Thêm tour đầu tiên
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {tours.map((tour) => (
            <article key={tour.id} className={styles.card}>
              <div className={styles.cardImage}>
                <img
                  src={tour.coverImage || tour.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80'}
                  alt={tour.title || tour.name}
                />
                <div className={`${styles.statusBadge} ${tour.isActive ? styles.active : styles.inactive}`}>
                  {tour.isActive ? <FaEye /> : <FaEyeSlash />}
                  {tour.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{tour.title || tour.name}</h3>
                <p className={styles.cardMeta}>📍 {tour.city || 'N/A'} · {tour.durationDays || 0}N{(tour.durationNights || 0)}D</p>
                <div className={styles.cardStats}>
                  <span>⭐ {Number(tour.avgRating || 0).toFixed(1)}</span>
                  <span>📋 {Number(tour.totalBookings || 0)} đơn</span>
                  <span>💰 {formatCurrency(tour.totalRevenue)}</span>
                </div>
                <div className={styles.cardActions}>
                  <Link href={`/admin/tours/${tour.id}/edit`} className={styles.editBtn}>
                    <FaEdit /> Chỉnh sửa
                  </Link>
                  <Link href={`/tours/${tour.id}`} className={styles.viewBtn} target="_blank">
                    <FaEye /> Xem trên web
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

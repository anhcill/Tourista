'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FaHotel, FaPlus, FaEdit, FaEye, FaEyeSlash, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import partnerApi from '@/api/partnerApi';
import styles from './page.module.css';

type HotelType = {
  id: number;
  name: string;
  city?: string;
  coverImage?: string;
  imageUrl?: string;
  isActive: boolean;
  avgRating?: number;
  totalBookings?: number;
  totalRevenue?: number;
};

const formatCurrency = (amount: unknown) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} VND`;

export default function PartnerHotelsPage() {
  const [hotels, setHotels] = useState<HotelType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const data = await partnerApi.getPartnerHotels();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setHotels(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách khách sạn.');
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
          <h2>Khách sạn của tôi</h2>
          <p>Quản lý danh sách và trạng thái khách sạn của bạn.</p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.refreshBtn} onClick={() => void load({ silent: true })} disabled={refreshing}>
            <FaSyncAlt className={refreshing ? styles.spinning : ''} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </button>
          <Link href="/admin/hotels/create" className={styles.primaryBtn}>
            <FaPlus /> Thêm khách sạn
          </Link>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Đang tải danh sách khách sạn...</div>
      ) : error ? (
        <div className={styles.errorState}>{error}</div>
      ) : hotels.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Bạn chưa có khách sạn nào.</p>
          <Link href="/admin/hotels/create" className={styles.primaryBtn}>
            <FaPlus /> Thêm khách sạn đầu tiên
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {hotels.map((hotel) => (
            <article key={hotel.id} className={styles.card}>
              <div className={styles.cardImage}>
                <img
                  src={hotel.coverImage || hotel.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'}
                  alt={hotel.name}
                />
                <div className={`${styles.statusBadge} ${hotel.isActive ? styles.active : styles.inactive}`}>
                  {hotel.isActive ? <FaEye /> : <FaEyeSlash />}
                  {hotel.isActive ? 'Đang hoạt động' : 'Đã ẩn'}
                </div>
              </div>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{hotel.name}</h3>
                <p className={styles.cardMeta}>📍 {hotel.city || 'N/A'}</p>
                <div className={styles.cardStats}>
                  <span>⭐ {Number(hotel.avgRating || 0).toFixed(1)}</span>
                  <span>📋 {Number(hotel.totalBookings || 0)} đơn</span>
                  <span>💰 {formatCurrency(hotel.totalRevenue)}</span>
                </div>
                <div className={styles.cardActions}>
                  <Link href={`/admin/hotels/${hotel.id}/edit`} className={styles.editBtn}>
                    <FaEdit /> Chỉnh sửa
                  </Link>
                  <Link href={`/hotels/${hotel.id}`} className={styles.viewBtn} target="_blank">
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

'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaHotel, FaPlaneDeparture, FaSyncAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import partnerApi from '@/api/partnerApi';
import styles from './page.module.css';

const STATUS_LABELS = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
};

const PAYMENT_LABELS = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const formatDate = (v: string | number | null | undefined) => {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
};

const formatCurrency = (amount: number | string | null | undefined, currency = 'VND') =>
  `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} ${currency}`;

const STATUS_CLASS = (s: string) => ({
  PENDING: styles.statusPending,
  CONFIRMED: styles.statusConfirmed,
  CHECKED_IN: styles.statusCheckedIn,
  COMPLETED: styles.statusCompleted,
  CANCELLED: styles.statusCancelled,
  REFUNDED: styles.statusRefunded,
}[s] || '');

const PAYMENT_CLASS = (s: string) => ({
  PAID: styles.paymentPaid,
  PENDING: styles.paymentPending,
  FAILED: styles.paymentFailed,
  REFUNDED: styles.paymentRefunded,
}[s] || '');

export default function PartnerBookingsPage() {
  const [activeTab, setActiveTab] = useState<'hotel' | 'tour'>('hotel');

  const [hotelBookings, setHotelBookings] = useState<any[]>([]);
  const [tourBookings, setTourBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [hotelPage, setHotelPage] = useState(0);
  const [tourPage, setTourPage] = useState(0);
  const [hotelTotal, setHotelTotal] = useState(0);
  const [tourTotal, setTourTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');

  const pageSize = 15;

  const loadBookings = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError('');

        const params = { page: activeTab === 'hotel' ? hotelPage : tourPage, size: pageSize, status: statusFilter || undefined };

        if (activeTab === 'hotel') {
          const res = await partnerApi.getPartnerHotelBookings(params);
          const content = res?.result?.content || res?.content || [];
          setHotelBookings(content);
          setHotelTotal(res?.result?.totalElements || res?.totalElements || 0);
        } else {
          const res = await partnerApi.getPartnerTourBookings(params);
          const content = res?.result?.content || res?.content || [];
          setTourBookings(content);
          setTourTotal(res?.result?.totalElements || res?.totalElements || 0);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải bookings.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, hotelPage, tourPage, statusFilter],
  );

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  // Reset page on tab/filter change
  useEffect(() => {
    setHotelPage(0);
    setTourPage(0);
  }, [activeTab, statusFilter]);

  const bookings = activeTab === 'hotel' ? hotelBookings : tourBookings;
  const totalPages = Math.max(1, Math.ceil((activeTab === 'hotel' ? hotelTotal : tourTotal) / pageSize));
  const currentPage = activeTab === 'hotel' ? hotelPage : tourPage;
  const setPage = activeTab === 'hotel' ? setHotelPage : setTourPage;

  const renderRow = (b: any) => (
    <tr key={b.id}>
      <td>
        <div className={styles.bookingCode}>{b.bookingCode}</div>
      </td>
      <td>
        <div className={styles.guestInfo}>
          <strong>{b.guestName || '-'}</strong>
          <span>{b.guestEmail || '-'}</span>
        </div>
      </td>
      <td>
        <strong>{b.serviceName || '-'}</strong>
      </td>
      <td>{formatDate(b.checkIn || b.createdAt)}</td>
      <td>{formatDate(b.checkOut)}</td>
      <td>
        <span className={`${styles.badge} ${STATUS_CLASS(b.status)}`}>
          {STATUS_LABELS[b.status as keyof typeof STATUS_LABELS] || b.status}
        </span>
      </td>
      <td>
        <span className={`${styles.badge} ${PAYMENT_CLASS(b.paymentStatus)}`}>
          {PAYMENT_LABELS[b.paymentStatus as keyof typeof PAYMENT_LABELS] || b.paymentStatus}
        </span>
      </td>
      <td className={styles.amount}>{formatCurrency(b.totalAmount, b.currency)}</td>
    </tr>
  );

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Đơn đặt</h2>
          <p>Xem và quản lý các đơn đặt phòng khách sạn và tour của bạn.</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => void loadBookings({ silent: true })} disabled={refreshing}>
          <FaSyncAlt className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Tab */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'hotel' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('hotel')}
        >
          <FaHotel /> Khách sạn
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'tour' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('tour')}
        >
          <FaPlaneDeparture /> Tour
        </button>
      </div>

      {/* Filter */}
      <div className={styles.filterRow}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {Object.keys(STATUS_LABELS).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s as keyof typeof STATUS_LABELS]}</option>
          ))}
        </select>
        <span className={styles.totalCount}>
          Tổng: {activeTab === 'hotel' ? hotelTotal : tourTotal} đơn
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải đơn đặt...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : bookings.length === 0 ? (
          <div className={styles.emptyState}>Chưa có đơn đặt nào.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Ngày đến</th>
                <th>Ngày về</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
              </tr>
            </thead>
            <tbody>{bookings.map(renderRow)}</tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button className={styles.ghostButton} disabled={currentPage <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
          ← Trước
        </button>
        <span>Trang {currentPage + 1} / {totalPages}</span>
        <button className={styles.ghostButton} disabled={currentPage >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
          Sau →
        </button>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaMoneyCheckAlt,
  FaSearch,
  FaSyncAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import adminApi from '@/api/adminApi';
import type {
  AdminBookingManagementRow,
  AdminBookingsOverview,
  AdminBookingPaymentStatus,
  AdminBookingStatus,
  AdminBookingType,
} from '../types';
import styles from './page.module.css';
import './booking-modal.css';

type BookingStatusFilter = 'ALL' | AdminBookingStatus;
type BookingTypeFilter = 'ALL' | AdminBookingType;
type PaymentStatusFilter = 'ALL' | AdminBookingPaymentStatus;

const STATUS_OPTIONS: BookingStatusFilter[] = [
  'ALL',
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'COMPLETED',
  'CANCELLED',
  'REFUNDED',
];
const TYPE_OPTIONS: BookingTypeFilter[] = ['ALL', 'HOTEL', 'TOUR'];
const PAYMENT_OPTIONS: PaymentStatusFilter[] = ['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'];

const STATUS_LABELS: Record<AdminBookingStatus, string> = {
  PENDING: 'Chờ xử lý',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đã nhận phòng',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  REFUNDED: 'Đã hoàn tiền',
};

const PAYMENT_LABELS: Record<AdminBookingPaymentStatus, string> = {
  PAID: 'Đã thanh toán',
  PENDING: 'Chờ thanh toán',
  FAILED: 'Thất bại',
  REFUNDED: 'Đã hoàn tiền',
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const formatDateOnly = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('vi-VN');
};

const formatAmount = (amount: number, currency: string) => {
  return `${new Intl.NumberFormat('vi-VN').format(Number(amount || 0))} ${currency || 'VND'}`;
};

const bookingDateRange = (booking: AdminBookingManagementRow) => {
  const start = formatDateOnly(booking.startDate);
  const end = formatDateOnly(booking.endDate);
  if (start === '-' && end === '-') return '-';
  if (start === end) return start;
  return `${start} -> ${end}`;
};

export default function AdminBookingsPage() {
  const hasLoadedOnceRef = useRef(false);
  const [overview, setOverview] = useState<AdminBookingsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<BookingTypeFilter>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedBooking, setSelectedBooking] = useState<AdminBookingManagementRow | null>(null);
  const [nextStatus, setNextStatus] = useState<AdminBookingStatus>('CONFIRMED');
  const [updateReason, setUpdateReason] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadBookings = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent || hasLoadedOnceRef.current) setRefreshing(true);
      else setLoading(true);

      const response = (await adminApi.getAdminBookings({
        search: searchQuery,
        status: statusFilter,
        type: typeFilter,
        paymentStatus: paymentFilter,
        page,
        limit: pageSize,
      })) as AdminBookingsOverview;

      setOverview(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt chỗ.';
      setError(message);
    } finally {
      hasLoadedOnceRef.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, paymentFilter, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!selectedBooking) return;
    setNextStatus(selectedBooking.status);
    setUpdateReason('');
  }, [selectedBooking]);

  const totalPages = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }, [overview, pageSize]);

  const totalBookingsText = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return `${total} bookings`;
  }, [overview]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setPaymentFilter('ALL');
    setPage(1);
    void loadBookings();
  };

  const submitStatusUpdate = async () => {
    if (!selectedBooking || updatingStatus) return;

    const trimmedReason = updateReason.trim();
    if (!trimmedReason) {
      toast.error('Vui lòng nhập lý do cập nhật trạng thái đơn đặt chỗ.');
      return;
    }

    try {
      setUpdatingStatus(true);

      await adminApi.updateBookingStatus(selectedBooking.id, nextStatus, trimmedReason);

      setOverview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          bookings: prev.bookings.map((item) =>
            item.id === selectedBooking.id
              ? {
                  ...item,
                  status: nextStatus,
                  note: trimmedReason,
                }
              : item,
          ),
        };
      });

      setSelectedBooking((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              note: trimmedReason,
            }
          : prev,
      );

      toast.success('Đã cập nhật trạng thái đơn đặt chỗ.');
      void loadBookings({ silent: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cập nhật trạng thái đơn đặt chỗ thất bại.';
      toast.error(message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Đơn đặt chỗ</h2>
          <p>Đang tải danh sách đơn đặt chỗ...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Đơn đặt chỗ</h2>
          <p>{error || 'Không có dữ liệu đơn đặt chỗ.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Đơn đặt chỗ</h2>
          <p>Tổng hợp các giao dịch đặt phòng/chuyến đi, theo dõi trạng thái thanh toán và thông tin khách hàng.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalBookingsText}</span>
          <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
            {overview.hasMockFallback ? 'Chế độ dữ liệu mẫu' : 'Chế độ API thực'}
          </span>
        </div>
      </div>

      <article className={styles.panel}>
        <form className={styles.toolbar} onSubmit={submitSearch}>
          <label className={styles.searchBox}>
            <FaSearch />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm theo mã đơn, khách hàng, email, dịch vụ"
            />
          </label>

          <select
            aria-label="Lọc theo trạng thái đơn"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as BookingStatusFilter);
              setPage(1);
              void loadBookings();
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Tất cả trạng thái' : STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo loại đơn"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as BookingTypeFilter);
              setPage(1);
              void loadBookings();
            }}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'Tất cả loại đơn' : type}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo trạng thái thanh toán"
            value={paymentFilter}
            onChange={(event) => {
              setPaymentFilter(event.target.value as PaymentStatusFilter);
              setPage(1);
              void loadBookings();
            }}
          >
            {PAYMENT_OPTIONS.map((paymentStatus) => (
              <option key={paymentStatus} value={paymentStatus}>
                {paymentStatus === 'ALL' ? 'Tất cả trạng thái thanh toán' : PAYMENT_LABELS[paymentStatus]}
              </option>
            ))}
          </select>

          <button className={styles.primaryButton} type="submit">
            <FaSearch />
            Tìm kiếm
          </button>

          <button className={styles.ghostButton} type="button" onClick={resetFilters}>
            <FaSyncAlt />
            Đặt lại
          </button>

          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void loadBookings({ silent: true })}
            disabled={refreshing}
          >
            <FaSyncAlt />
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </form>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Dịch vụ</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Tổng tiền</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {overview.bookings.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={9}>
                    <FaClipboardList />
                    <span>Không có đơn đặt chỗ phù hợp với bộ lọc hiện tại.</span>
                  </td>
                </tr>
              ) : (
                overview.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <div className={styles.bookingCell}>
                        <strong>{booking.bookingCode}</strong>
                        <span>{booking.bookingType}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.guestCell}>
                        <strong>{booking.guestName}</strong>
                        <span>{booking.guestEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.serviceCell}>
                        <strong>{booking.serviceName}</strong>
                        <span>{booking.serviceCity}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.metaInline}>
                        <FaCalendarAlt />
                        <span>{bookingDateRange(booking)}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          booking.status === 'CONFIRMED'
                            ? styles.badgeConfirmed
                            : booking.status === 'CHECKED_IN'
                              ? styles.badgeConfirmed
                            : booking.status === 'COMPLETED'
                              ? styles.badgeCompleted
                              : booking.status === 'REFUNDED'
                                ? styles.badgeRefunded
                              : booking.status === 'CANCELLED'
                                ? styles.badgeCancelled
                                : styles.badgePending
                        }`}
                      >
                        {STATUS_LABELS[booking.status]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          booking.paymentStatus === 'PAID'
                            ? styles.badgePaid
                            : booking.paymentStatus === 'FAILED'
                              ? styles.badgeFailed
                              : booking.paymentStatus === 'REFUNDED'
                                ? styles.badgeRefunded
                                : styles.badgePaymentPending
                        }`}
                      >
                        {PAYMENT_LABELS[booking.paymentStatus]}
                      </span>
                    </td>
                    <td>
                      <div className={styles.metaInline}>
                        <FaMoneyCheckAlt />
                        <span>{formatAmount(booking.totalAmount, booking.currency)}</span>
                      </div>
                    </td>
                    <td>{formatDateTime(booking.createdAt)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.inlineButton}
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <FaCheckCircle />
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trước
          </button>
          <span>
            Trang <strong>{page}</strong> / {totalPages}
          </span>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Sau
          </button>
        </div>
      </article>

      {selectedBooking ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setSelectedBooking(null)} data-modal="bookings">
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết đơn đặt chỗ"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Chi tiết đơn đặt chỗ</h3>

            <div className="admin-modal-body">
              <div>
                <dl className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <dt>Mã đơn</dt>
                    <dd>{selectedBooking.bookingCode}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Loại đơn</dt>
                    <dd>{selectedBooking.bookingType}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Khách hàng</dt>
                    <dd>{selectedBooking.guestName}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Email</dt>
                    <dd>{selectedBooking.guestEmail}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Dịch vụ</dt>
                    <dd>{selectedBooking.serviceName}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Thành phố</dt>
                    <dd>{selectedBooking.serviceCity}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Thời gian</dt>
                    <dd>{bookingDateRange(selectedBooking)}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Ngày tạo</dt>
                    <dd>{formatDateTime(selectedBooking.createdAt)}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Trạng thái</dt>
                    <dd>{STATUS_LABELS[selectedBooking.status]}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Thanh toán</dt>
                    <dd>{PAYMENT_LABELS[selectedBooking.paymentStatus]}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Tổng tiền</dt>
                    <dd>{formatAmount(selectedBooking.totalAmount, selectedBooking.currency)}</dd>
                  </div>
                  <div className="admin-detail-item">
                    <dt>Ghi chú</dt>
                    <dd>{selectedBooking.note || '-'}</dd>
                  </div>
                </dl>
              </div>

              <div className="admin-status-panel">
                <p className="admin-status-panel-title">Cập nhật trạng thái</p>
                <select
                  id="booking-next-status"
                  value={nextStatus}
                  onChange={(event) => setNextStatus(event.target.value as AdminBookingStatus)}
                  disabled={updatingStatus}
                >
                  {STATUS_OPTIONS.filter((status) => status !== 'ALL').map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>

                <label htmlFor="booking-status-reason">
                  Lý do thao tác (bắt buộc)
                </label>
                <textarea
                  id="booking-status-reason"
                  rows={3}
                  value={updateReason}
                  onChange={(event) => setUpdateReason(event.target.value)}
                  placeholder="Ví dụ: Đã liên hệ khách và xác nhận hoàn tiền"
                  disabled={updatingStatus}
                />

                <div className="admin-status-actions">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={submitStatusUpdate}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => setSelectedBooking(null)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

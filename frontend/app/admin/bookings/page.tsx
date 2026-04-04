'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardList,
  FaMoneyCheckAlt,
  FaSearch,
  FaSyncAlt,
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import type {
  AdminBookingManagementRow,
  AdminBookingsOverview,
  AdminBookingPaymentStatus,
  AdminBookingStatus,
  AdminBookingType,
} from '../types';
import styles from './page.module.css';

type BookingStatusFilter = 'ALL' | AdminBookingStatus;
type BookingTypeFilter = 'ALL' | AdminBookingType;
type PaymentStatusFilter = 'ALL' | AdminBookingPaymentStatus;

const STATUS_OPTIONS: BookingStatusFilter[] = ['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const TYPE_OPTIONS: BookingTypeFilter[] = ['ALL', 'HOTEL', 'TOUR'];
const PAYMENT_OPTIONS: PaymentStatusFilter[] = ['ALL', 'PAID', 'PENDING', 'FAILED', 'REFUNDED'];

const STATUS_LABELS: Record<AdminBookingStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const PAYMENT_LABELS: Record<AdminBookingPaymentStatus, string> = {
  PAID: 'Paid',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
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

  const loadBookings = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
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
      const message = err instanceof Error ? err.message : 'Khong the tai danh sach bookings admin.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, paymentFilter, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

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
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Bookings Management</h2>
          <p>Dang tai danh sach bookings...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Bookings Management</h2>
          <p>{error || 'Khong co du lieu bookings.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Bookings Management</h2>
          <p>Day 6: quan ly booking hop nhat hotel/tour, filter giao dich va xem chi tiet.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalBookingsText}</span>
          <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
            {overview.hasMockFallback ? 'Mock fallback mode' : 'API live mode'}
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
              placeholder="Tim theo code, guest, email, service"
            />
          </label>

          <select
            aria-label="Filter by booking status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as BookingStatusFilter);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Tat ca status' : STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by booking type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as BookingTypeFilter);
              setPage(1);
            }}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'Tat ca type' : type}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by payment status"
            value={paymentFilter}
            onChange={(event) => {
              setPaymentFilter(event.target.value as PaymentStatusFilter);
              setPage(1);
            }}
          >
            {PAYMENT_OPTIONS.map((paymentStatus) => (
              <option key={paymentStatus} value={paymentStatus}>
                {paymentStatus === 'ALL' ? 'Tat ca payment' : PAYMENT_LABELS[paymentStatus]}
              </option>
            ))}
          </select>

          <button className={styles.primaryButton} type="submit">
            <FaSearch />
            Search
          </button>

          <button className={styles.ghostButton} type="button" onClick={resetFilters}>
            <FaSyncAlt />
            Reset
          </button>

          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void loadBookings({ silent: true })}
            disabled={refreshing}
          >
            <FaSyncAlt />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </form>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Booking</th>
                <th>Guest</th>
                <th>Service</th>
                <th>Date range</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {overview.bookings.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={9}>
                    <FaClipboardList />
                    <span>Khong co booking phu hop bo loc hien tai.</span>
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
                            : booking.status === 'COMPLETED'
                              ? styles.badgeCompleted
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
                        View detail
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
            Prev
          </button>
          <span>
            Page <strong>{page}</strong> / {totalPages}
          </span>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            Next
          </button>
        </div>
      </article>

      {selectedBooking ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelectedBooking(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Booking detail"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Booking Detail</h3>

            <dl className={styles.detailGrid}>
              <div>
                <dt>Code</dt>
                <dd>{selectedBooking.bookingCode}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{selectedBooking.bookingType}</dd>
              </div>
              <div>
                <dt>Guest</dt>
                <dd>{selectedBooking.guestName}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{selectedBooking.guestEmail}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{selectedBooking.serviceName}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{selectedBooking.serviceCity}</dd>
              </div>
              <div>
                <dt>Date range</dt>
                <dd>{bookingDateRange(selectedBooking)}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDateTime(selectedBooking.createdAt)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{STATUS_LABELS[selectedBooking.status]}</dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>{PAYMENT_LABELS[selectedBooking.paymentStatus]}</dd>
              </div>
              <div>
                <dt>Total amount</dt>
                <dd>{formatAmount(selectedBooking.totalAmount, selectedBooking.currency)}</dd>
              </div>
              <div>
                <dt>Note</dt>
                <dd>{selectedBooking.note || '-'}</dd>
              </div>
            </dl>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={() => setSelectedBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

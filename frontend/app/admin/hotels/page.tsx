'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { FaBan, FaCheckCircle, FaEdit, FaHotel, FaPlusCircle, FaSearch, FaSyncAlt, FaTimesCircle } from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import type { AdminHotelRow, AdminHotelsOverview, AdminHotelStatus } from '../types';
import styles from './page.module.css';

type HotelStatusFilter = 'ALL' | AdminHotelStatus;
type HotelActionStatus = Exclude<AdminHotelStatus, 'PENDING'>;

type ConfirmState = {
  open: boolean;
  userReason: string;
  action: HotelActionStatus | null;
  hotel: AdminHotelRow | null;
};

const STATUS_FILTER_OPTIONS: HotelStatusFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

const STATUS_LABELS: Record<AdminHotelStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SUSPENDED: 'Đình chỉ',
};

const ACTION_LABELS: Record<HotelActionStatus, string> = {
  APPROVED: 'Duyệt',
  REJECTED: 'Từ chối',
  SUSPENDED: 'Đình chỉ',
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const formatRating = (avgRating: number, reviewCount: number) => {
  return `${Number(avgRating || 0).toFixed(1)} (${Number(reviewCount || 0)})`;
};

export default function AdminHotelsPage() {
  const [overview, setOverview] = useState<AdminHotelsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<HotelStatusFilter>('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    userReason: '',
    action: null,
    hotel: null,
  });

  const loadHotels = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      const response = (await adminApi.getAdminHotels({
        search: searchQuery,
        status: statusFilter,
        city: cityFilter,
        page,
        limit: pageSize,
      })) as AdminHotelsOverview;

      setOverview(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách khách sạn.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cityFilter, page, searchQuery, statusFilter]);

  useEffect(() => {
    void loadHotels();
  }, [loadHotels]);

  const totalPages = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }, [overview, pageSize]);

  const totalHotelsText = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return `${total} hotels`;
  }, [overview]);

  const cityOptions = useMemo(() => {
    const allCities = (overview?.hotels || []).map((hotel) => hotel.city).filter(Boolean);
    const uniqueCities = Array.from(new Set(allCities)).sort((a, b) => a.localeCompare(b));
    return ['ALL', ...uniqueCities];
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
    setCityFilter('ALL');
    setPage(1);
  };

  const openConfirmModal = (hotel: AdminHotelRow, action: HotelActionStatus) => {
    setActionError('');
    setActionSuccess('');
    setConfirmState({
      open: true,
      userReason: '',
      action,
      hotel,
    });
  };

  const closeConfirmModal = () => {
    setConfirmState({
      open: false,
      userReason: '',
      action: null,
      hotel: null,
    });
  };

  const patchHotelStatusLocal = (hotelId: string, nextStatus: HotelActionStatus) => {
    setOverview((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        hotels: prev.hotels.map((hotel) => {
          if (String(hotel.id) !== String(hotelId)) return hotel;
          return {
            ...hotel,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    });
  };

  const confirmAction = async () => {
    if (!confirmState.hotel || !confirmState.action) return;

    const reason = confirmState.userReason.trim();
    if (!reason) {
      setActionError('Lý do là bắt buộc cho thao tác kiểm duyệt khách sạn.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      await adminApi.updateHotelStatus(confirmState.hotel.id, confirmState.action, reason);

      patchHotelStatusLocal(confirmState.hotel.id, confirmState.action);
      setActionSuccess(`Đã ${ACTION_LABELS[confirmState.action].toLowerCase()} khách sạn thành công.`);
      closeConfirmModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cập nhật trạng thái khách sạn thất bại.';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Khách sạn</h2>
          <p>Đang tải danh sách khách sạn...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Khách sạn</h2>
          <p>{error || 'Không có dữ liệu khách sạn.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Khách sạn</h2>
          <p>Duyệt nền tảng: Xác nhận, từ chối hoặc đình chỉ khách sạn hoạt động.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalHotelsText}</span>
          <Link href="/admin/hotels/create" className={styles.createButton}>
            <FaPlusCircle />
            Thêm mới
          </Link>
          <span
            className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}
          >
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
              placeholder="Tìm khách sạn theo tên, host, địa chỉ"
            />
          </label>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as HotelStatusFilter);
              setPage(1);
            }}
          >
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Tất cả trạng thái' : STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo thành phố"
            value={cityFilter}
            onChange={(event) => {
              setCityFilter(event.target.value);
              setPage(1);
            }}
          >
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city === 'ALL' ? 'Tất cả thành phố' : city}
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
            onClick={() => void loadHotels({ silent: true })}
            disabled={refreshing}
          >
            <FaSyncAlt />
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </form>

        {actionSuccess ? <div className={styles.successBox}>{actionSuccess}</div> : null}
        {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Khách sạn</th>
                <th>Thành phố</th>
                <th>Chủ nhà</th>
                <th>Đánh giá</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th colSpan={2}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {overview.hotels.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={8}>
                    <FaHotel />
                    <span>Không có khách sạn phù hợp với bộ lọc hiện tại.</span>
                  </td>
                </tr>
              ) : (
                overview.hotels.map((hotel) => (
                  <tr key={hotel.id}>
                    <td>
                      <div className={styles.hotelCell}>
                        <strong>{hotel.name}</strong>
                        <span>{hotel.address}</span>
                        <small>{hotel.starRating} sao</small>
                      </div>
                    </td>
                    <td>{hotel.city}</td>
                    <td>
                      <div className={styles.hostCell}>
                        <strong>{hotel.hostName}</strong>
                        <span>{hotel.hostEmail}</span>
                      </div>
                    </td>
                    <td>{formatRating(hotel.avgRating, hotel.reviewCount)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          hotel.status === 'APPROVED'
                            ? styles.badgeApproved
                            : hotel.status === 'REJECTED'
                              ? styles.badgeRejected
                              : hotel.status === 'SUSPENDED'
                                ? styles.badgeSuspended
                                : styles.badgePending
                        }`}
                      >
                        {STATUS_LABELS[hotel.status]}
                      </span>
                    </td>
                    <td>{formatDateTime(hotel.updatedAt || hotel.createdAt)}</td>
                    <td>
                      <div className={styles.actionsWrap}>
                        <Link href={`/admin/hotels/${hotel.id}/edit`} className={styles.editButton}>
                          <FaEdit />
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${styles.approveButton}`}
                          onClick={() => openConfirmModal(hotel, 'APPROVED')}
                          disabled={hotel.status === 'APPROVED' || actionLoading}
                        >
                          <FaCheckCircle />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${styles.rejectButton}`}
                          onClick={() => openConfirmModal(hotel, 'REJECTED')}
                          disabled={hotel.status === 'REJECTED' || actionLoading}
                        >
                          <FaTimesCircle />
                          Từ chối
                        </button>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${styles.suspendButton}`}
                          onClick={() => openConfirmModal(hotel, 'SUSPENDED')}
                          disabled={hotel.status === 'SUSPENDED' || actionLoading}
                        >
                          <FaBan />
                          Đình chỉ
                        </button>
                      </div>
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

      {confirmState.open && confirmState.hotel && confirmState.action ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirmModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận kiểm duyệt khách sạn"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Xác nhận thao tác kiểm duyệt</h3>
            <p>
              Khách sạn: <strong>{confirmState.hotel.name}</strong>
            </p>
            <p>
              Thao tác: <strong>{ACTION_LABELS[confirmState.action]}</strong>
            </p>

            <label className={styles.reasonField}>
              <span>Lý do thao tác (bắt buộc)</span>
              <textarea
                value={confirmState.userReason}
                onChange={(event) =>
                  setConfirmState((prev) => ({
                    ...prev,
                    userReason: event.target.value,
                  }))
                }
                placeholder="Nhập lý do để lưu nhật ký thao tác"
                rows={4}
              />
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={closeConfirmModal}>
                Hủy
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void confirmAction()}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang thực hiện...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

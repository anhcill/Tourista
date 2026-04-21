'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { FaBan, FaCheckCircle, FaEdit, FaPlusCircle, FaRoute, FaSearch, FaSyncAlt, FaTimesCircle } from 'react-icons/fa';
import Link from 'next/link';
import adminApi from '@/api/adminApi';
import type { AdminTourRow, AdminToursOverview, AdminTourStatus } from '../types';
import styles from './page.module.css';

type TourStatusFilter = 'ALL' | AdminTourStatus;
type TourActionStatus = Exclude<AdminTourStatus, 'PENDING'>;

type ConfirmState = {
  open: boolean;
  userReason: string;
  action: TourActionStatus | null;
  tour: AdminTourRow | null;
};

const STATUS_FILTER_OPTIONS: TourStatusFilter[] = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

const STATUS_LABELS: Record<AdminTourStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SUSPENDED: 'Đình chỉ',
};

const ACTION_LABELS: Record<TourActionStatus, string> = {
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

const formatVnd = (value: number) => {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`;
};

export default function AdminToursPage() {
  const [overview, setOverview] = useState<AdminToursOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TourStatusFilter>('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [operatorFilter, setOperatorFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    userReason: '',
    action: null,
    tour: null,
  });

  const loadTours = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      const response = (await adminApi.getAdminTours({
        search: searchQuery,
        status: statusFilter,
        city: cityFilter,
        operator: operatorFilter,
        page,
        limit: pageSize,
      })) as AdminToursOverview;

      setOverview(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách chuyến đi.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [cityFilter, operatorFilter, page, searchQuery, statusFilter]);

  useEffect(() => {
    void loadTours();
  }, [loadTours]);

  const totalPages = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }, [overview, pageSize]);

  const totalToursText = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return `${total} tours`;
  }, [overview]);

  const cityOptions = useMemo(() => {
    const allCities = (overview?.tours || []).map((tour) => tour.city).filter(Boolean);
    const uniqueCities = Array.from(new Set(allCities)).sort((a, b) => a.localeCompare(b));
    return ['ALL', ...uniqueCities];
  }, [overview]);

  const operatorOptions = useMemo(() => {
    const allOperators = (overview?.tours || []).map((tour) => tour.operatorName).filter(Boolean);
    const uniqueOperators = Array.from(new Set(allOperators)).sort((a, b) => a.localeCompare(b));
    return ['ALL', ...uniqueOperators];
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
    setOperatorFilter('ALL');
    setPage(1);
  };

  const openConfirmModal = (tour: AdminTourRow, action: TourActionStatus) => {
    setActionError('');
    setActionSuccess('');
    setConfirmState({
      open: true,
      userReason: '',
      action,
      tour,
    });
  };

  const closeConfirmModal = () => {
    setConfirmState({
      open: false,
      userReason: '',
      action: null,
      tour: null,
    });
  };

  const patchTourStatusLocal = (tourId: string, nextStatus: TourActionStatus) => {
    setOverview((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        tours: prev.tours.map((tour) => {
          if (String(tour.id) !== String(tourId)) return tour;
          return {
            ...tour,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }),
      };
    });
  };

  const confirmAction = async () => {
    if (!confirmState.tour || !confirmState.action) return;

    const reason = confirmState.userReason.trim();
    if (!reason) {
      setActionError('Lý do là bắt buộc cho thao tác kiểm duyệt chuyến đi.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      await adminApi.updateTourStatus(confirmState.tour.id, confirmState.action, reason);

      patchTourStatusLocal(confirmState.tour.id, confirmState.action);
      setActionSuccess(`Đã ${ACTION_LABELS[confirmState.action].toLowerCase()} chuyến đi thành công.`);
      closeConfirmModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cập nhật trạng thái chuyến đi thất bại.';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Chuyến đi</h2>
          <p>Đang tải danh sách chuyến đi...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Chuyến đi</h2>
          <p>{error || 'Không có dữ liệu chuyến đi.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Chuyến đi</h2>
          <p>Duyệt nền tảng: Xác nhận, từ chối hoặc đình chỉ chuyến đi cùng lý do thao tác.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalToursText}</span>
          <Link href="/admin/tours/create" className={styles.createButton}>
            <FaPlusCircle />
            Thêm chuyến đi mới
          </Link>
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
              placeholder="Tìm chuyến đi theo tên, nhà cung cấp, địa điểm"
            />
          </label>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as TourStatusFilter);
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

          <select
            aria-label="Lọc theo nhà cung cấp"
            value={operatorFilter}
            onChange={(event) => {
              setOperatorFilter(event.target.value);
              setPage(1);
            }}
          >
            {operatorOptions.map((operator) => (
              <option key={operator} value={operator}>
                {operator === 'ALL' ? 'Tất cả nhà cung cấp' : operator}
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
            onClick={() => void loadTours({ silent: true })}
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
                <th>Chuyến đi</th>
                <th>Thành phố</th>
                <th>Nhà cung cấp</th>
                <th>Thời lượng</th>
                <th>Giá vé</th>
                <th>Chỗ trống</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th colSpan={2}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {overview.tours.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={9}>
                    <FaRoute />
                    <span>Không có chuyến đi phù hợp với bộ lọc hiện tại.</span>
                  </td>
                </tr>
              ) : (
                overview.tours.map((tour) => (
                  <tr key={tour.id}>
                    <td>
                      <div className={styles.tourCell}>
                        <strong>{tour.title}</strong>
                        <span>{tour.location}</span>
                      </div>
                    </td>
                    <td>{tour.city}</td>
                    <td>
                      <div className={styles.operatorCell}>
                        <strong>{tour.operatorName}</strong>
                        <span>{tour.operatorEmail}</span>
                      </div>
                    </td>
                    <td>{tour.durationDays} ngày</td>
                    <td>{formatVnd(tour.priceFrom)}</td>
                    <td>
                      {tour.seatsRemaining}/{tour.seatsTotal}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          tour.status === 'APPROVED'
                            ? styles.badgeApproved
                            : tour.status === 'REJECTED'
                              ? styles.badgeRejected
                              : tour.status === 'SUSPENDED'
                                ? styles.badgeSuspended
                                : styles.badgePending
                        }`}
                      >
                        {STATUS_LABELS[tour.status]}
                      </span>
                    </td>
                    <td>{formatDateTime(tour.updatedAt || tour.createdAt)}</td>
                    <td>
                      <div className={styles.actionsWrap}>
                        <Link href={`/admin/tours/${tour.id}/edit`} className={styles.editButton}>
                          <FaEdit />
                          Sửa
                        </Link>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${styles.approveButton}`}
                          onClick={() => openConfirmModal(tour, 'APPROVED')}
                          disabled={tour.status === 'APPROVED' || actionLoading}
                        >
                          <FaCheckCircle />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${styles.rejectButton}`}
                          onClick={() => openConfirmModal(tour, 'REJECTED')}
                          disabled={tour.status === 'REJECTED' || actionLoading}
                        >
                          <FaTimesCircle />
                          Từ chối
                        </button>
                        <button
                          type="button"
                          className={`${styles.inlineButton} ${styles.suspendButton}`}
                          onClick={() => openConfirmModal(tour, 'SUSPENDED')}
                          disabled={tour.status === 'SUSPENDED' || actionLoading}
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

      {confirmState.open && confirmState.tour && confirmState.action ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirmModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận kiểm duyệt chuyến đi"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Xác nhận thao tác kiểm duyệt</h3>
            <p>
              Chuyến đi: <strong>{confirmState.tour.title}</strong>
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

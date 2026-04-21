'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { FaSearch, FaSyncAlt, FaUserCheck, FaUsers } from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import type {
  AdminUserRole,
  AdminUsersOverview,
  AdminUserRow,
  AdminUserStatus,
} from '../types';
import styles from './page.module.css';

type RoleFilter = 'ALL' | AdminUserRole;
type StatusFilter = 'ALL' | AdminUserStatus;
type UpdateActionType = 'role' | 'status';

type ConfirmState = {
  open: boolean;
  actionType: UpdateActionType;
  user: AdminUserRow | null;
  nextValue: string;
  userReason: string;
};

const ROLE_OPTIONS: AdminUserRole[] = ['ADMIN', 'USER', 'HOST'];
const STATUS_OPTIONS: AdminUserStatus[] = ['ACTIVE', 'LOCKED', 'BANNED'];

const ROLE_LABELS: Record<AdminUserRole, string> = {
  ADMIN: 'Quản trị viên',
  USER: 'Người dùng',
  HOST: 'Chủ nhà',
};

const STATUS_LABELS: Record<AdminUserStatus, string> = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Bị khóa',
  BANNED: 'Bị cấm',
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const userKey = (id: string) => String(id);

export default function AdminUsersPage() {
  const [usersOverview, setUsersOverview] = useState<AdminUsersOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [roleDrafts, setRoleDrafts] = useState<Record<string, AdminUserRole>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, AdminUserStatus>>({});

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    actionType: 'role',
    user: null,
    nextValue: '',
    userReason: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadUsers = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      const response = (await adminApi.getAdminUsers({
        search: searchQuery,
        role: roleFilter,
        status: statusFilter,
        page,
        limit: pageSize,
      })) as AdminUsersOverview;

      setUsersOverview(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, roleFilter, searchQuery, statusFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const nextRoleDrafts: Record<string, AdminUserRole> = {};
    const nextStatusDrafts: Record<string, AdminUserStatus> = {};

    usersOverview?.users.forEach((user) => {
      const key = userKey(user.id);
      nextRoleDrafts[key] = user.role;
      nextStatusDrafts[key] = user.status;
    });

    setRoleDrafts(nextRoleDrafts);
    setStatusDrafts(nextStatusDrafts);
  }, [usersOverview]);

  const totalPages = useMemo(() => {
    const total = Number(usersOverview?.meta?.total || 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }, [usersOverview, pageSize]);

  const totalUsersText = useMemo(() => {
    const total = Number(usersOverview?.meta?.total || 0);
    return `${total} users`;
  }, [usersOverview]);

  const openConfirmModal = (
    actionType: UpdateActionType,
    user: AdminUserRow,
    nextValue: string,
  ) => {
    setActionError('');
    setActionSuccess('');
    setConfirmState({
      open: true,
      actionType,
      user,
      nextValue,
      userReason: '',
    });
  };

  const closeConfirmModal = () => {
    setConfirmState((prev) => ({
      ...prev,
      open: false,
      user: null,
      nextValue: '',
      userReason: '',
    }));
  };

  const applyLocalPatch = (userId: string, patch: Partial<AdminUserRow>) => {
    setUsersOverview((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        users: prev.users.map((user) => {
          if (userKey(user.id) !== userKey(userId)) return user;
          return { ...user, ...patch };
        }),
      };
    });
  };

  const confirmUpdate = async () => {
    if (!confirmState.user || !confirmState.nextValue) return;

    const targetUser = confirmState.user;
    const reason = confirmState.userReason.trim();
    if (!reason) {
      setActionError('Lý do là bắt buộc cho thao tác cập nhật người dùng.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      if (confirmState.actionType === 'role') {
        await adminApi.updateUserRole(targetUser.id, confirmState.nextValue, reason);

        const nextRole = confirmState.nextValue as AdminUserRole;
        applyLocalPatch(targetUser.id, { role: nextRole });
        setRoleDrafts((prev) => ({ ...prev, [userKey(targetUser.id)]: nextRole }));
        setActionSuccess('Cập nhật vai trò thành công.');
      }

      if (confirmState.actionType === 'status') {
        await adminApi.updateUserStatus(targetUser.id, confirmState.nextValue, reason);

        const nextStatus = confirmState.nextValue as AdminUserStatus;
        applyLocalPatch(targetUser.id, { status: nextStatus });
        setStatusDrafts((prev) => ({ ...prev, [userKey(targetUser.id)]: nextStatus }));
        setActionSuccess('Cập nhật trạng thái thành công.');
      }

      closeConfirmModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cập nhật người dùng thất bại.';
      setActionError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
    setPage(1);
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Người dùng</h2>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </section>
    );
  }

  if (error || !usersOverview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Người dùng</h2>
          <p>{error || 'Không có dữ liệu người dùng.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Người dùng</h2>
          <p>Tìm kiếm, lọc, đổi vai trò/trạng thái người dùng và xác nhận các thao tác kiểm soát hệ thống.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalUsersText}</span>
          <span
            className={`${styles.dataBadge} ${
              usersOverview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive
            }`}
          >
            {usersOverview.hasMockFallback ? 'Chế độ dữ liệu mẫu' : 'Chế độ API thực'}
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
              placeholder="Tìm theo tên, email, điện thoại"
            />
          </label>

          <select
            aria-label="Lọc theo vai trò"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleFilter);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả vai trò</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
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
            onClick={() => void loadUsers({ silent: true })}
            disabled={refreshing}
          >
            <FaUserCheck />
            {refreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </form>

        {actionSuccess ? <div className={styles.successBox}>{actionSuccess}</div> : null}
        {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Xác thực</th>
                <th>Nguồn</th>
                <th>Đăng nhập cuối</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {usersOverview.users.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    <FaUsers />
                    <span>Không có người dùng phù hợp với bộ lọc hiện tại.</span>
                  </td>
                </tr>
              ) : (
                usersOverview.users.map((user) => {
                  const key = userKey(user.id);
                  const roleDraft = roleDrafts[key] || user.role;
                  const statusDraft = statusDrafts[key] || user.status;
                  const roleChanged = roleDraft !== user.role;
                  const statusChanged = statusDraft !== user.status;

                  return (
                    <tr key={key}>
                      <td>
                        <div className={styles.userCell}>
                          <strong>{user.fullName}</strong>
                          <span>{user.email}</span>
                          <small>{user.phone || '-'}</small>
                        </div>
                      </td>

                      <td>
                        <div className={styles.actionInline}>
                          <select
                            aria-label={`Role for ${user.fullName}`}
                            value={roleDraft}
                            onChange={(event) =>
                              setRoleDrafts((prev) => ({
                                ...prev,
                                [key]: event.target.value as AdminUserRole,
                              }))
                            }
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {ROLE_LABELS[role]}
                              </option>
                            ))}
                          </select>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            disabled={!roleChanged || actionLoading}
                            onClick={() => openConfirmModal('role', user, roleDraft)}
                          >
                            Áp dụng
                          </button>
                        </div>
                      </td>

                      <td>
                        <div className={styles.actionInline}>
                          <select
                            aria-label={`Status for ${user.fullName}`}
                            value={statusDraft}
                            onChange={(event) =>
                              setStatusDrafts((prev) => ({
                                ...prev,
                                [key]: event.target.value as AdminUserStatus,
                              }))
                            }
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </option>
                            ))}
                          </select>
                          <button
                            className={styles.inlineButton}
                            type="button"
                            disabled={!statusChanged || actionLoading}
                            onClick={() => openConfirmModal('status', user, statusDraft)}
                          >
                            Áp dụng
                          </button>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${
                            user.isEmailVerified ? styles.badgeSuccess : styles.badgeWarn
                          }`}
                        >
                          {user.isEmailVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                        </span>
                      </td>
                      <td>{user.authProvider}</td>
                      <td>{formatDateTime(user.lastLoginAt)}</td>
                      <td>{formatDateTime(user.createdAt)}</td>
                    </tr>
                  );
                })
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

      {confirmState.open && confirmState.user ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirmModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm user update"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Xác nhận cập nhật người dùng</h3>
            <p>
              Người dùng: <strong>{confirmState.user.fullName}</strong>
            </p>
            <p>
              {confirmState.actionType === 'role' ? 'Vai trò mới' : 'Trạng thái mới'}:{' '}
              <strong>{confirmState.nextValue}</strong>
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
                onClick={() => void confirmUpdate()}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang cập nhật...' : 'Xác nhận cập nhật'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

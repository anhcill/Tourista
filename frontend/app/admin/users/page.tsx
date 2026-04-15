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
  ADMIN: 'Admin',
  USER: 'User',
  HOST: 'Host',
};

const STATUS_LABELS: Record<AdminUserStatus, string> = {
  ACTIVE: 'Active',
  LOCKED: 'Locked',
  BANNED: 'Banned',
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
      const message = err instanceof Error ? err.message : 'Khong the tai danh sach users.';
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
      setActionError('Ly do la bat buoc cho thao tac cap nhat user.');
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
        setActionSuccess('Cap nhat role thanh cong.');
      }

      if (confirmState.actionType === 'status') {
        await adminApi.updateUserStatus(targetUser.id, confirmState.nextValue, reason);

        const nextStatus = confirmState.nextValue as AdminUserStatus;
        applyLocalPatch(targetUser.id, { status: nextStatus });
        setStatusDrafts((prev) => ({ ...prev, [userKey(targetUser.id)]: nextStatus }));
        setActionSuccess('Cap nhat status thanh cong.');
      }

      closeConfirmModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cap nhat user that bai.';
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
          <h2>Users Management</h2>
          <p>Dang tai danh sach users...</p>
        </div>
      </section>
    );
  }

  if (error || !usersOverview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Users Management</h2>
          <p>{error || 'Khong co du lieu users.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Users Management</h2>
          <p>Day 3: tim kiem, loc, doi role/status va xac nhan thao tac nhay cam.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalUsersText}</span>
          <span
            className={`${styles.dataBadge} ${
              usersOverview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive
            }`}
          >
            {usersOverview.hasMockFallback ? 'Mock fallback mode' : 'API live mode'}
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
              placeholder="Tim theo ten, email, phone"
            />
          </label>

          <select
            aria-label="Filter by role"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleFilter);
              setPage(1);
            }}
          >
            <option value="ALL">Tat ca role</option>
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
          >
            <option value="ALL">Tat ca status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
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
            onClick={() => void loadUsers({ silent: true })}
            disabled={refreshing}
          >
            <FaUserCheck />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </form>

        {actionSuccess ? <div className={styles.successBox}>{actionSuccess}</div> : null}
        {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Provider</th>
                <th>Last login</th>
                <th>Created at</th>
              </tr>
            </thead>
            <tbody>
              {usersOverview.users.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    <FaUsers />
                    <span>Khong co user phu hop bo loc hien tai.</span>
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
                            Apply
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
                            Apply
                          </button>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`${styles.badge} ${
                            user.isEmailVerified ? styles.badgeSuccess : styles.badgeWarn
                          }`}
                        >
                          {user.isEmailVerified ? 'Verified' : 'Unverified'}
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

      {confirmState.open && confirmState.user ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirmModal}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm user update"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Xac nhan cap nhat user</h3>
            <p>
              User: <strong>{confirmState.user.fullName}</strong>
            </p>
            <p>
              {confirmState.actionType === 'role' ? 'Role moi' : 'Status moi'}:{' '}
              <strong>{confirmState.nextValue}</strong>
            </p>

            <label className={styles.reasonField}>
              <span>Ly do thao tac (bat buoc)</span>
              <textarea
                value={confirmState.userReason}
                onChange={(event) =>
                  setConfirmState((prev) => ({
                    ...prev,
                    userReason: event.target.value,
                  }))
                }
                placeholder="Nhap ly do de luu audit log"
                rows={4}
              />
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={closeConfirmModal}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void confirmUpdate()}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : 'Confirm update'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

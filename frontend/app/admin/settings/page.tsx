'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  FaClipboardList,
  FaSearch,
  FaShieldAlt,
  FaStream,
  FaSyncAlt,
  FaUserShield,
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import type { AdminAuditLogRow, AdminAuditLogsOverview } from '../types';
import styles from './page.module.css';

const RESOURCE_OPTIONS = ['ALL', 'USERS', 'HOTELS', 'TOURS', 'BOOKINGS', 'PROMOTIONS'];

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const formatPayload = (value: string) => {
  if (!value) return '-';
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

const compactLabel = (value: string) => {
  if (!value) return '-';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ''))
    .join(' ');
};

const actionTone = (action: string) => {
  const normalized = String(action || '').toUpperCase();
  if (normalized.includes('DELETE') || normalized.includes('SUSPEND') || normalized.includes('BANNED')) {
    return styles.actionDanger;
  }
  if (normalized.includes('CREATE')) {
    return styles.actionSuccess;
  }
  if (normalized.includes('UPDATE')) {
    return styles.actionInfo;
  }
  return styles.actionNeutral;
};

export default function AdminSettingsPage() {
  const [overview, setOverview] = useState<AdminAuditLogsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [resourceFilter, setResourceFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [selectedLog, setSelectedLog] = useState<AdminAuditLogRow | null>(null);

  const loadAuditLogs = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      const response = (await adminApi.getAdminAuditLogs({
        search: searchQuery,
        action: actionFilter,
        resource: resourceFilter,
        page,
        limit: pageSize,
      })) as AdminAuditLogsOverview;

      setOverview(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải nhật ký hệ thống.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actionFilter, page, resourceFilter, searchQuery]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

  const actionOptions = useMemo(() => {
    const values = new Set<string>(['ALL']);
    (overview?.auditLogs || []).forEach((item) => {
      if (item.action) values.add(item.action);
    });
    return Array.from(values);
  }, [overview]);

  const totalPages = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }, [overview, pageSize]);

  const totalLogsText = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return `${total} audit logs`;
  }, [overview]);

  const actorCount = useMemo(() => {
    return new Set((overview?.auditLogs || []).map((item) => item.actorEmail).filter(Boolean)).size;
  }, [overview]);

  const criticalCount = useMemo(() => {
    return (overview?.auditLogs || []).filter((item) => {
      const action = item.action.toUpperCase();
      return action.includes('DELETE') || action.includes('SUSPEND') || action.includes('BANNED');
    }).length;
  }, [overview]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setActionFilter('ALL');
    setResourceFilter('ALL');
    setPage(1);
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Cài đặt & Nhật ký Hệ thống</h2>
          <p>Đang tải dữ liệu nhật ký...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Cài đặt & Nhật ký Hệ thống</h2>
          <p>{error || 'Không có dữ liệu nhật ký.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Cài đặt & Nhật ký Hệ thống</h2>
          <p>Trung tâm giám sát thao tác quản trị với khả năng truy vết rủi ro cao.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalLogsText}</span>
          <span className={styles.inlineStat}>
            <FaUserShield /> {actorCount} người thực hiện
          </span>
          <span className={styles.inlineStat}>
            <FaShieldAlt /> {criticalCount} thao tác rủi ro cao
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
              placeholder="Tìm theo email, thao tác, lý do"
            />
          </label>

          <select
            aria-label="Lọc theo thao tác"
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value);
              setPage(1);
            }}
          >
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? 'Tất cả thao tác' : compactLabel(item)}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo tài nguyên"
            value={resourceFilter}
            onChange={(event) => {
              setResourceFilter(event.target.value);
              setPage(1);
            }}
          >
            {RESOURCE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? 'Tất cả tài nguyên' : item}
              </option>
            ))}
          </select>

          <button className={styles.primaryButton} type="submit">
            <FaSearch />
            Tìm kiếm
          </button>

          <button className={styles.ghostButton} type="button" onClick={resetFilters}>
            <FaStream />
            Đặt lại
          </button>

          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void loadAuditLogs({ silent: true })}
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
                <th>Thời gian</th>
                <th>Người gọi</th>
                <th>Thao tác</th>
                <th>Tài nguyên</th>
                <th>Mã Tài nguyên</th>
                <th>Lý do</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {overview.auditLogs.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    <FaClipboardList />
                    <span>Không có nhật ký nào phù hợp với bộ lọc hiện tại.</span>
                  </td>
                </tr>
              ) : (
                overview.auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatDateTime(log.timestamp)}</td>
                    <td>{log.actorEmail || '-'}</td>
                    <td>
                      <span className={`${styles.actionBadge} ${actionTone(log.action)}`}>
                        {compactLabel(log.action)}
                      </span>
                    </td>
                    <td>{log.resource || '-'}</td>
                    <td>{log.resourceId || '-'}</td>
                    <td className={styles.reasonCell}>{log.reason || '-'}</td>
                    <td>
                      <button className={styles.inlineButton} type="button" onClick={() => setSelectedLog(log)}>
                        Xem
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

      {selectedLog ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelectedLog(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết nhật ký"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Chi tiết Nhật ký Hệ thống</h3>

            <dl className={styles.detailGrid}>
              <div>
                <dt>Thời gian</dt>
                <dd>{formatDateTime(selectedLog.timestamp)}</dd>
              </div>
              <div>
                <dt>Người gọi</dt>
                <dd>{selectedLog.actorEmail || '-'}</dd>
              </div>
              <div>
                <dt>Thao tác</dt>
                <dd>{selectedLog.action || '-'}</dd>
              </div>
              <div>
                <dt>Tài nguyên</dt>
                <dd>
                  {selectedLog.resource || '-'} #{selectedLog.resourceId || '-'}
                </dd>
              </div>
              <div>
                <dt>Lý do</dt>
                <dd>{selectedLog.reason || '-'}</dd>
              </div>
            </dl>

            <div className={styles.payloadWrap}>
              <div>
                <h4>Dữ liệu trước</h4>
                <pre>{formatPayload(selectedLog.beforeData)}</pre>
              </div>
              <div>
                <h4>Dữ liệu sau</h4>
                <pre>{formatPayload(selectedLog.afterData)}</pre>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={() => setSelectedLog(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

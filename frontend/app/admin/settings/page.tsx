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
      const message = err instanceof Error ? err.message : 'Khong the tai audit logs.';
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
          <h2>System Settings & Audit</h2>
          <p>Dang tai du lieu audit logs...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>System Settings & Audit</h2>
          <p>{error || 'Khong co du lieu audit logs.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>System Settings & Audit</h2>
          <p>Day 4: trung tam giam sat thao tac admin voi filter, paging va log detail.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalLogsText}</span>
          <span className={styles.inlineStat}>
            <FaUserShield /> {actorCount} actors
          </span>
          <span className={styles.inlineStat}>
            <FaShieldAlt /> {criticalCount} high-risk actions
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
              placeholder="Tim actor email, action, reason"
            />
          </label>

          <select
            aria-label="Filter by action"
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value);
              setPage(1);
            }}
          >
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? 'Tat ca actions' : compactLabel(item)}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by resource"
            value={resourceFilter}
            onChange={(event) => {
              setResourceFilter(event.target.value);
              setPage(1);
            }}
          >
            {RESOURCE_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item === 'ALL' ? 'Tat ca resources' : item}
              </option>
            ))}
          </select>

          <button className={styles.primaryButton} type="submit">
            <FaSearch />
            Search
          </button>

          <button className={styles.ghostButton} type="button" onClick={resetFilters}>
            <FaStream />
            Reset
          </button>

          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void loadAuditLogs({ silent: true })}
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
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Resource ID</th>
                <th>Reason</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {overview.auditLogs.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={7}>
                    <FaClipboardList />
                    <span>Khong co log nao phu hop bo loc hien tai.</span>
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
                        View
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

      {selectedLog ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelectedLog(null)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Audit log detail"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>Audit Log Detail</h3>

            <dl className={styles.detailGrid}>
              <div>
                <dt>Timestamp</dt>
                <dd>{formatDateTime(selectedLog.timestamp)}</dd>
              </div>
              <div>
                <dt>Actor</dt>
                <dd>{selectedLog.actorEmail || '-'}</dd>
              </div>
              <div>
                <dt>Action</dt>
                <dd>{selectedLog.action || '-'}</dd>
              </div>
              <div>
                <dt>Resource</dt>
                <dd>
                  {selectedLog.resource || '-'} #{selectedLog.resourceId || '-'}
                </dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{selectedLog.reason || '-'}</dd>
              </div>
            </dl>

            <div className={styles.payloadWrap}>
              <div>
                <h4>Before Data</h4>
                <pre>{formatPayload(selectedLog.beforeData)}</pre>
              </div>
              <div>
                <h4>After Data</h4>
                <pre>{formatPayload(selectedLog.afterData)}</pre>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

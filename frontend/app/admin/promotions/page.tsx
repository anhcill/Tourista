'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  FaEdit,
  FaPlusCircle,
  FaPowerOff,
  FaSearch,
  FaSyncAlt,
  FaTicketAlt,
  FaTrashAlt,
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import type {
  AdminPromotionLifecycleStatus,
  AdminPromotionRow,
  AdminPromotionsOverview,
  AdminPromotionType,
} from '../types';
import styles from './page.module.css';

type PromotionStatusFilter = 'ALL' | AdminPromotionLifecycleStatus;
type PromotionTypeFilter = 'ALL' | AdminPromotionType;

type PromotionFormState = {
  code: string;
  name: string;
  description: string;
  type: AdminPromotionType;
  value: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  usageLimit: string;
  startAt: string;
  endAt: string;
  isActive: boolean;
  changeReason: string;
};

type ConfirmAction = 'toggle' | 'delete';

type ConfirmState = {
  open: boolean;
  action: ConfirmAction;
  reason: string;
  promotion: AdminPromotionRow | null;
};

const STATUS_OPTIONS: PromotionStatusFilter[] = ['ALL', 'ACTIVE', 'INACTIVE', 'UPCOMING', 'EXPIRED'];
const TYPE_OPTIONS: PromotionTypeFilter[] = ['ALL', 'PERCENT', 'FIXED'];

const EMPTY_FORM: PromotionFormState = {
  code: '',
  name: '',
  description: '',
  type: 'PERCENT',
  value: '',
  minOrderAmount: '0',
  maxDiscountAmount: '',
  usageLimit: '100',
  startAt: '',
  endAt: '',
  isActive: true,
  changeReason: '',
};

const toLocalInput = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hour}:${minute}`;
};

const toIso = (value: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const asLifecycleStatus = (promotion: AdminPromotionRow): AdminPromotionLifecycleStatus => {
  if (!promotion.isActive) return 'INACTIVE';

  const now = Date.now();
  const start = promotion.startAt ? new Date(promotion.startAt).getTime() : null;
  const end = promotion.endAt ? new Date(promotion.endAt).getTime() : null;

  if (Number.isFinite(start) && start && now < start) return 'UPCOMING';
  if (Number.isFinite(end) && end && now > end) return 'EXPIRED';
  return 'ACTIVE';
};

const formatDateTime = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('vi-VN');
};

const formatAmount = (value: number) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const discountLabel = (promotion: AdminPromotionRow) => {
  if (promotion.type === 'PERCENT') {
    const cap = promotion.maxDiscountAmount ? `, max ${formatAmount(promotion.maxDiscountAmount)} VND` : '';
    return `${promotion.value}%${cap}`;
  }
  return `${formatAmount(promotion.value)} VND`;
};

export default function AdminPromotionsPage() {
  const [overview, setOverview] = useState<AdminPromotionsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PromotionStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<PromotionTypeFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editingPromotionId, setEditingPromotionId] = useState<string | null>(null);
  const [form, setForm] = useState<PromotionFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    action: 'toggle',
    reason: '',
    promotion: null,
  });
  const [actionError, setActionError] = useState('');

  const loadPromotions = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      const response = (await adminApi.getAdminPromotions({
        search: searchQuery,
        status: statusFilter,
        type: typeFilter,
        page,
        limit: pageSize,
      })) as AdminPromotionsOverview;

      setOverview(response);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Khong the tai danh sach promotions.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    void loadPromotions();
  }, [loadPromotions]);

  const totalPages = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return Math.max(1, Math.ceil(total / pageSize));
  }, [overview, pageSize]);

  const totalPromotionsText = useMemo(() => {
    const total = Number(overview?.meta?.total || 0);
    return `${total} promotions`;
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
    setPage(1);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingPromotionId(null);
    setFormError('');
  };

  const startEdit = (promotion: AdminPromotionRow) => {
    setEditingPromotionId(promotion.id);
    setFormError('');
    setFormSuccess('');
    setForm({
      code: promotion.code,
      name: promotion.name || promotion.code,
      description: promotion.description,
      type: promotion.type,
      value: String(promotion.value),
      minOrderAmount: String(promotion.minOrderAmount),
      maxDiscountAmount: promotion.maxDiscountAmount == null ? '' : String(promotion.maxDiscountAmount),
      usageLimit: String(promotion.usageLimit),
      startAt: toLocalInput(promotion.startAt),
      endAt: toLocalInput(promotion.endAt),
      isActive: promotion.isActive,
      changeReason: '',
    });
  };

  const validateForm = () => {
    const code = form.code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{4,20}$/.test(code)) {
      return 'Code phai 4-20 ky tu, chi gom A-Z, 0-9, _ hoac -.';
    }

    if (!form.name.trim()) {
      return 'Name promotion la bat buoc.';
    }

    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) {
      return 'Gia tri khuyen mai phai lon hon 0.';
    }
    if (form.type === 'PERCENT' && value > 100) {
      return 'Khuyen mai theo % khong duoc vuot qua 100.';
    }

    const minOrderAmount = Number(form.minOrderAmount);
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      return 'Don hang toi thieu phai >= 0.';
    }

    const usageLimit = Number(form.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
      return 'So luong su dung phai la so nguyen duong.';
    }

    if (form.maxDiscountAmount) {
      const maxDiscount = Number(form.maxDiscountAmount);
      if (!Number.isFinite(maxDiscount) || maxDiscount <= 0) {
        return 'Max discount phai lon hon 0 neu co nhap.';
      }
    }

    const startAt = toIso(form.startAt);
    const endAt = toIso(form.endAt);
    if (!startAt || !endAt) {
      return 'Bat buoc nhap start date va end date hop le.';
    }
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      return 'End date phai lon hon start date.';
    }

    if (form.changeReason.trim().length < 5) {
      return 'Reason toi thieu 5 ky tu.';
    }

    return '';
  };

  const handleSubmitPromotion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      type: form.type,
      value: Number(form.value),
      minOrderAmount: Number(form.minOrderAmount),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
      usageLimit: Number(form.usageLimit),
      startAt: toIso(form.startAt),
      endAt: toIso(form.endAt),
      isActive: form.isActive,
      reason: form.changeReason.trim(),
    };

    try {
      setSubmitting(true);

      if (editingPromotionId) {
        await adminApi.updateAdminPromotion(editingPromotionId, payload);
        await loadPromotions({ silent: true });

        setFormSuccess('Cap nhat promotion thanh cong.');
      } else {
        await adminApi.createAdminPromotion(payload);
        await loadPromotions({ silent: true });

        setFormSuccess('Tao promotion thanh cong.');
      }

      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Khong the luu promotion.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = (promotion: AdminPromotionRow, action: ConfirmAction) => {
    setActionError('');
    setConfirmState({
      open: true,
      action,
      reason: '',
      promotion,
    });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({
      ...prev,
      open: false,
      reason: '',
      promotion: null,
    }));
  };

  const submitConfirm = async () => {
    if (!confirmState.promotion) return;

    const reason = confirmState.reason.trim();
    if (reason.length < 5) {
      setActionError('Reason toi thieu 5 ky tu.');
      return;
    }

    try {
      if (confirmState.action === 'toggle') {
        const nextActive = !confirmState.promotion.isActive;
        await adminApi.updateAdminPromotionStatus(confirmState.promotion.id, nextActive, reason);
        await loadPromotions({ silent: true });
      }

      if (confirmState.action === 'delete') {
        await adminApi.deleteAdminPromotion(confirmState.promotion.id, reason);
        await loadPromotions({ silent: true });
      }

      closeConfirm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Thao tac promotion that bai.';
      setActionError(message);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Promotions Management</h2>
          <p>Dang tai danh sach promotions...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Promotions Management</h2>
          <p>{error || 'Khong co du lieu promotions.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Promotions Management</h2>
          <p>Day 7: CRUD promotions + validation date range, quantity, discount value.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalPromotionsText}</span>
          <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
            {overview.hasMockFallback ? 'Mock fallback mode' : 'API live mode'}
          </span>
        </div>
      </div>

      <article className={styles.panel}>
        <h3 className={styles.panelTitle}>{editingPromotionId ? 'Edit Promotion' : 'Create Promotion'}</h3>

        <form className={styles.formGrid} onSubmit={handleSubmitPromotion}>
          <label>
            <span>Code</span>
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              placeholder="SUMMER25"
              maxLength={20}
            />
          </label>

          <label>
            <span>Name</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Summer Campaign 2026"
            />
          </label>

          <label>
            <span>Type</span>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as AdminPromotionType }))}
            >
              <option value="PERCENT">PERCENT</option>
              <option value="FIXED">FIXED</option>
            </select>
          </label>

          <label>
            <span>Value</span>
            <input
              type="number"
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              placeholder={form.type === 'PERCENT' ? '15' : '150000'}
              min={0}
            />
          </label>

          <label>
            <span>Min Order Amount</span>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
              min={0}
            />
          </label>

          <label>
            <span>Max Discount Amount</span>
            <input
              type="number"
              value={form.maxDiscountAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
              min={0}
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Usage Limit</span>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
              min={1}
            />
          </label>

          <label>
            <span>Start At</span>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
            />
          </label>

          <label>
            <span>End At</span>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
            />
          </label>

          <label>
            <span>Description</span>
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Mo ta dieu kien promotion"
            />
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            <span>Active</span>
          </label>

          <label className={styles.fullWidth}>
            <span>Reason (required)</span>
            <input
              value={form.changeReason}
              onChange={(event) => setForm((prev) => ({ ...prev, changeReason: event.target.value }))}
              placeholder="Nhap ly do thao tac promotion"
            />
          </label>

          <div className={`${styles.actionsBar} ${styles.fullWidth}`}>
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              <FaPlusCircle />
              {submitting ? 'Saving...' : editingPromotionId ? 'Update promotion' : 'Create promotion'}
            </button>
            <button className={styles.ghostButton} type="button" onClick={resetForm}>
              <FaSyncAlt />
              Reset form
            </button>
          </div>
        </form>

        {formError ? <div className={styles.errorBox}>{formError}</div> : null}
        {formSuccess ? <div className={styles.successBox}>{formSuccess}</div> : null}
      </article>

      <article className={styles.panel}>
        <form className={styles.toolbar} onSubmit={submitSearch}>
          <label className={styles.searchBox}>
            <FaSearch />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tim theo code hoac description"
            />
          </label>

          <select
            aria-label="Filter by promotion status"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as PromotionStatusFilter);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Tat ca status' : status}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by promotion type"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as PromotionTypeFilter);
              setPage(1);
            }}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'Tat ca type' : type}
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
            onClick={() => void loadPromotions({ silent: true })}
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
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Validity</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {overview.promotions.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={8}>
                    <FaTicketAlt />
                    <span>Khong co promotion phu hop bo loc hien tai.</span>
                  </td>
                </tr>
              ) : (
                overview.promotions.map((promotion) => {
                  const lifecycle = asLifecycleStatus(promotion);
                  return (
                    <tr key={promotion.id}>
                      <td>
                        <div className={styles.codeCell}>
                          <strong>{promotion.code}</strong>
                          <span>{promotion.name || '-'}</span>
                          <span>{promotion.description || '-'}</span>
                        </div>
                      </td>
                      <td>{promotion.type}</td>
                      <td>{discountLabel(promotion)}</td>
                      <td>
                        <div className={styles.metaCell}>
                          <span>{formatDateTime(promotion.startAt)}</span>
                          <span>{formatDateTime(promotion.endAt)}</span>
                        </div>
                      </td>
                      <td>{promotion.usedCount}/{promotion.usageLimit}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            lifecycle === 'ACTIVE'
                              ? styles.badgeActive
                              : lifecycle === 'UPCOMING'
                                ? styles.badgeUpcoming
                                : lifecycle === 'EXPIRED'
                                  ? styles.badgeExpired
                                  : styles.badgeInactive
                          }`}
                        >
                          {lifecycle}
                        </span>
                      </td>
                      <td>{formatDateTime(promotion.updatedAt || promotion.createdAt)}</td>
                      <td>
                        <div className={styles.actionsInline}>
                          <button className={styles.inlineButton} type="button" onClick={() => startEdit(promotion)}>
                            <FaEdit />
                            Edit
                          </button>
                          <button className={styles.inlineButton} type="button" onClick={() => openConfirm(promotion, 'toggle')}>
                            <FaPowerOff />
                            {promotion.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button className={`${styles.inlineButton} ${styles.deleteButton}`} type="button" onClick={() => openConfirm(promotion, 'delete')}>
                            <FaTrashAlt />
                            Delete
                          </button>
                        </div>
                      </td>
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

      {confirmState.open && confirmState.promotion ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirm}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm promotion action"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{confirmState.action === 'delete' ? 'Xoa promotion' : 'Doi trang thai promotion'}</h3>
            <p>
              Promotion: <strong>{confirmState.promotion.code}</strong>
            </p>
            <p>
              Action: <strong>{confirmState.action === 'delete' ? 'Delete' : 'Toggle active/inactive'}</strong>
            </p>

            <label className={styles.reasonField}>
              <span>Reason (required)</span>
              <textarea
                value={confirmState.reason}
                onChange={(event) =>
                  setConfirmState((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Nhap ly do thao tac"
              />
            </label>

            {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={closeConfirm}>
                Cancel
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => void submitConfirm()}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

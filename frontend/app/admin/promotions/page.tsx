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
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách khuyến mãi.';
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
      return 'Mã phải từ 4-20 ký tự, chỉ gồm A-Z, 0-9, _ hoặc -.';
    }

    if (!form.name.trim()) {
      return 'Tên khuyến mãi là bắt buộc.';
    }

    const value = Number(form.value);
    if (!Number.isFinite(value) || value <= 0) {
      return 'Giá trị khuyến mãi phải lớn hơn 0.';
    }
    if (form.type === 'PERCENT' && value > 100) {
      return 'Khuyến mãi theo % không được vượt quá 100.';
    }

    const minOrderAmount = Number(form.minOrderAmount);
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0) {
      return 'Đơn hàng tối thiểu phải >= 0.';
    }

    const usageLimit = Number(form.usageLimit);
    if (!Number.isInteger(usageLimit) || usageLimit <= 0) {
      return 'Số lượng sử dụng phải là số nguyên dương.';
    }

    if (form.maxDiscountAmount) {
      const maxDiscount = Number(form.maxDiscountAmount);
      if (!Number.isFinite(maxDiscount) || maxDiscount <= 0) {
        return 'Giảm giá tối đa phải lớn hơn 0 nếu có nhập.';
      }
    }

    const startAt = toIso(form.startAt);
    const endAt = toIso(form.endAt);
    if (!startAt || !endAt) {
      return 'Bắt buộc nhập ngày bắt đầu và ngày kết thúc hợp lệ.';
    }
    if (new Date(startAt).getTime() >= new Date(endAt).getTime()) {
      return 'Ngày kết thúc phải lớn hơn ngày bắt đầu.';
    }

    if (form.changeReason.trim().length < 5) {
      return 'Lý do tối thiểu 5 ký tự.';
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

        setFormSuccess('Cập nhật khuyến mãi thành công.');
      } else {
        await adminApi.createAdminPromotion(payload);
        await loadPromotions({ silent: true });

        setFormSuccess('Tạo khuyến mãi thành công.');
      }

      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu khuyến mãi.';
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
      setActionError('Lý do tối thiểu 5 ký tự.');
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
      const message = err instanceof Error ? err.message : 'Thao tác khuyến mãi thất bại.';
      setActionError(message);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Khuyến mãi</h2>
          <p>Đang tải danh sách khuyến mãi...</p>
        </div>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Khuyến mãi</h2>
          <p>{error || 'Không có dữ liệu khuyến mãi.'}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Khuyến mãi</h2>
          <p>Quản lý các chương trình khuyến mãi, thiết lập số lượng và giá trị giảm giá.</p>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>{totalPromotionsText}</span>
          <span className={`${styles.dataBadge} ${overview.hasMockFallback ? styles.dataBadgeMock : styles.dataBadgeLive}`}>
            {overview.hasMockFallback ? 'Chế độ dữ liệu mẫu' : 'Chế độ API thực'}
          </span>
        </div>
      </div>

      <article className={styles.panel}>
        <h3 className={styles.panelTitle}>{editingPromotionId ? 'Sửa Khuyến mãi' : 'Tạo Khuyến mãi'}</h3>

        <form className={styles.formGrid} onSubmit={handleSubmitPromotion}>
          <label>
            <span>Mã</span>
            <input
              value={form.code}
              onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
              placeholder="SUMMER25"
              maxLength={20}
            />
          </label>

          <label>
            <span>Tên</span>
            <input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Summer Campaign 2026"
            />
          </label>

          <label>
            <span>Loại</span>
            <select
              value={form.type}
              onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as AdminPromotionType }))}
            >
              <option value="PERCENT">PERCENT</option>
              <option value="FIXED">FIXED</option>
            </select>
          </label>

          <label>
            <span>Giá trị</span>
            <input
              type="number"
              value={form.value}
              onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
              placeholder={form.type === 'PERCENT' ? '15' : '150000'}
              min={0}
            />
          </label>

          <label>
            <span>Đơn hàng tối thiểu</span>
            <input
              type="number"
              value={form.minOrderAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, minOrderAmount: event.target.value }))}
              min={0}
            />
          </label>

          <label>
            <span>Giảm giá tối đa</span>
            <input
              type="number"
              value={form.maxDiscountAmount}
              onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
              min={0}
              placeholder="Không bắt buộc"
            />
          </label>

          <label>
            <span>Số lượt kích hoạt</span>
            <input
              type="number"
              value={form.usageLimit}
              onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))}
              min={1}
            />
          </label>

          <label>
            <span>Ngày bắt đầu</span>
            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(event) => setForm((prev) => ({ ...prev, startAt: event.target.value }))}
            />
          </label>

          <label>
            <span>Ngày kết thúc</span>
            <input
              type="datetime-local"
              value={form.endAt}
              onChange={(event) => setForm((prev) => ({ ...prev, endAt: event.target.value }))}
            />
          </label>

          <label>
            <span>Mô tả</span>
            <input
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Mô tả điều kiện khuyến mãi"
            />
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            <span>Kích hoạt</span>
          </label>

          <label className={styles.fullWidth}>
            <span>Lý do thao tác (bắt buộc)</span>
            <input
              value={form.changeReason}
              onChange={(event) => setForm((prev) => ({ ...prev, changeReason: event.target.value }))}
              placeholder="Nhập lý do thao tác khuyến mãi"
            />
          </label>

          <div className={`${styles.actionsBar} ${styles.fullWidth}`}>
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              <FaPlusCircle />
              {submitting ? 'Đang lưu...' : editingPromotionId ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi'}
            </button>
            <button className={styles.ghostButton} type="button" onClick={resetForm}>
              <FaSyncAlt />
              Đặt lại biểu mẫu
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
              placeholder="Tìm theo mã hoặc mô tả"
            />
          </label>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as PromotionStatusFilter);
              setPage(1);
            }}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'Tất cả trạng thái' : status}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc theo loại khuyến mãi"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as PromotionTypeFilter);
              setPage(1);
            }}
          >
            {TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type === 'ALL' ? 'Tất cả loại' : type}
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
            onClick={() => void loadPromotions({ silent: true })}
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
                <th>Mã</th>
                <th>Loại</th>
                <th>Giảm giá</th>
                <th>Áp dụng</th>
                <th>Thời hạn</th>
                <th>Sử dụng</th>
                <th>Trạng thái</th>
                <th>Cập nhật</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {overview.promotions.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={9}>
                    <FaTicketAlt />
                    <span>Không có khuyến mãi phù hợp với bộ lọc hiện tại.</span>
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
                      <td>{promotion.appliesTo || '-'}</td>
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
                            Sửa
                          </button>
                          <button className={styles.inlineButton} type="button" onClick={() => openConfirm(promotion, 'toggle')}>
                            <FaPowerOff />
                            {promotion.isActive ? 'Hủy kích hoạt' : 'Kích hoạt'}
                          </button>
                          <button className={`${styles.inlineButton} ${styles.deleteButton}`} type="button" onClick={() => openConfirm(promotion, 'delete')}>
                            <FaTrashAlt />
                            Xóa
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

      {confirmState.open && confirmState.promotion ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirm}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label="Xác nhận thao tác khuyến mãi"
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{confirmState.action === 'delete' ? 'Xóa khuyến mãi' : 'Thay đổi trạng thái khuyến mãi'}</h3>
            <p>
              Khuyến mãi: <strong>{confirmState.promotion.code}</strong>
            </p>
            <p>
              Thao tác: <strong>{confirmState.action === 'delete' ? 'Xóa' : 'Bật/Tắt kích hoạt'}</strong>
            </p>

            <label className={styles.reasonField}>
              <span>Lý do thao tác (bắt buộc)</span>
              <textarea
                value={confirmState.reason}
                onChange={(event) =>
                  setConfirmState((prev) => ({
                    ...prev,
                    reason: event.target.value,
                  }))
                }
                rows={4}
                placeholder="Nhập lý do thao tác"
              />
            </label>

            {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={closeConfirm}>
                Hủy
              </button>
              <button type="button" className={styles.primaryButton} onClick={() => void submitConfirm()}>
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

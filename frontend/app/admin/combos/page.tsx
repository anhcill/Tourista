'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaEdit,
  FaPlusCircle,
  FaPowerOff,
  FaSearch,
  FaSyncAlt,
  FaTrashAlt,
} from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import type {
  AdminCombosOverview,
  AdminComboRow,
  AdminComboType,
} from '../types';
import styles from './page.module.css';

type ComboStatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';
type ComboTypeFilter = 'ALL' | AdminComboType;

type ComboFormState = {
  name: string;
  description: string;
  imageUrl: string;
  comboType: AdminComboType;
  hotelId: string;
  tourId: string;
  validFrom: string;
  validUntil: string;
  totalSlots: string;
  originalPrice: string;
  comboPrice: string;
  isFeatured: boolean;
  isActive: boolean;
  reason: string;
};

type ConfirmAction = 'toggle' | 'delete';
type ConfirmState = {
  open: boolean;
  action: ConfirmAction;
  reason: string;
  combo: AdminComboRow | null;
};

const COMBO_TYPE_LABELS = {
  HOTEL_PLUS_TOUR: 'Khách sạn + Tour',
  MULTI_HOTEL: 'Nhiều Khách sạn',
  MULTI_TOUR: 'Nhiều Tour',
  HOTEL_AIRPORT_TRANSFER: 'Khách sạn + Đưa đón',
  TOUR_BUNDLE: 'Gói Tour',
};

const COMBO_TYPE_OPTIONS = [
  'HOTEL_PLUS_TOUR',
  'MULTI_HOTEL',
  'MULTI_TOUR',
  'HOTEL_AIRPORT_TRANSFER',
  'TOUR_BUNDLE',
] as AdminComboType[];

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'INACTIVE'] as ComboStatusFilter[];
const TYPE_OPTIONS = ['ALL', ...COMBO_TYPE_OPTIONS] as ComboTypeFilter[];

const EMPTY_FORM: ComboFormState = {
  name: '',
  description: '',
  imageUrl: '',
  comboType: 'HOTEL_PLUS_TOUR',
  hotelId: '',
  tourId: '',
  validFrom: '',
  validUntil: '',
  totalSlots: '50',
  originalPrice: '',
  comboPrice: '',
  isFeatured: true,
  isActive: true,
  reason: '',
};

const toLocalDate = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatAmount = (value: number | null) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('vi-VN').format(value) + ' VND';
};

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('vi-VN');
};

export default function AdminCombosPage() {
  const [overview, setOverview] = useState<AdminCombosOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComboStatusFilter>('ALL');
  const [typeFilter, setTypeFilter] = useState<ComboTypeFilter>('ALL');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ComboFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    action: 'toggle',
    reason: '',
    combo: null,
  });
  const [actionError, setActionError] = useState('');

  const loadCombos = useCallback(async ({ silent = false } = {}) => {
    try {
      setError('');
      if (silent) setRefreshing(true);
      else setLoading(true);

      const data = (await adminApi.getAdminCombos({
        search: searchQuery,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        type: typeFilter === 'ALL' ? undefined : typeFilter,
        page,
        limit: pageSize,
      })) as AdminCombosOverview;

      setOverview(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách combo.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    void loadCombos();
  }, [loadCombos]);

  const totalPages = useMemo(() => {
    const total = overview?.totalElements ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [overview, pageSize]);

  const submitSearch = (event: { preventDefault: () => void }) => {
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
    setEditingId(null);
    setFormError('');
  };

  const startEdit = (combo: AdminComboRow) => {
    setEditingId(combo.id);
    setFormError('');
    setFormSuccess('');
    setForm({
      name: combo.name || '',
      description: combo.description || '',
      imageUrl: combo.imageUrl || '',
      comboType: combo.comboType || 'HOTEL_PLUS_TOUR',
      hotelId: combo.hotelId ? String(combo.hotelId) : '',
      tourId: combo.tourId ? String(combo.tourId) : '',
      validFrom: toLocalDate(combo.validFrom),
      validUntil: toLocalDate(combo.validUntil),
      totalSlots: combo.totalSlots ? String(combo.totalSlots) : '50',
      originalPrice: combo.originalPrice ? String(combo.originalPrice) : '',
      comboPrice: combo.comboPrice ? String(combo.comboPrice) : '',
      isFeatured: combo.isFeatured ?? true,
      isActive: combo.isActive ?? true,
      reason: '',
    });
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Tên combo là bắt buộc.';
    if (!form.originalPrice || Number(form.originalPrice) <= 0) return 'Giá gốc phải > 0.';
    if (!form.comboPrice || Number(form.comboPrice) <= 0) return 'Giá combo phải > 0.';
    if (Number(form.comboPrice) >= Number(form.originalPrice)) {
      return 'Giá combo phải nhỏ hơn giá gốc.';
    }
    if (!form.validFrom || !form.validUntil) return 'Bắt buộc nhập ngày hợp lệ.';
    if (new Date(form.validFrom).getTime() >= new Date(form.validUntil).getTime()) {
      return 'Ngày kết thúc phải lớn hơn ngày bắt đầu.';
    }
    if (form.totalSlots && Number(form.totalSlots) <= 0) return 'Số slot phải > 0.';
    return '';
  };

  const handleSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');

    const validationMessage = validateForm();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl.trim() || null,
      comboType: form.comboType,
      hotelId: form.hotelId ? Number(form.hotelId) : null,
      tourId: form.tourId ? Number(form.tourId) : null,
      validFrom: form.validFrom,
      validUntil: form.validUntil,
      totalSlots: form.totalSlots ? Number(form.totalSlots) : 50,
      remainingSlots: form.totalSlots ? Number(form.totalSlots) : 50,
      originalPrice: Number(form.originalPrice),
      comboPrice: Number(form.comboPrice),
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      reason: form.reason.trim() || 'Cap nhat combo',
    };

    try {
      setSubmitting(true);
      if (editingId) {
        await adminApi.updateAdminCombo(editingId, payload);
        await loadCombos({ silent: true });
        setFormSuccess('Cập nhật combo thành công.');
      } else {
        await adminApi.createAdminCombo(payload);
        await loadCombos({ silent: true });
        setFormSuccess('Tạo combo thành công.');
      }
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu combo.';
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirm = (combo: AdminComboRow, action: ConfirmAction) => {
    setActionError('');
    setConfirmState({ open: true, action, reason: '', combo });
  };

  const closeConfirm = () => {
    setConfirmState((prev) => ({ ...prev, open: false, reason: '', combo: null }));
  };

  const submitConfirm = async () => {
    if (!confirmState.combo) return;
    const reason = confirmState.reason.trim();
    if (reason.length < 5) {
      setActionError('Lý do tối thiểu 5 ký tự.');
      return;
    }
    try {
      if (confirmState.action === 'toggle') {
        const nextActive = !confirmState.combo.isActive;
        await adminApi.updateAdminComboStatus(confirmState.combo.id, nextActive, reason);
        await loadCombos({ silent: true });
      }
      if (confirmState.action === 'delete') {
        await adminApi.deleteAdminCombo(confirmState.combo.id, reason);
        await loadCombos({ silent: true });
      }
      closeConfirm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Thao tác thất bại.';
      setActionError(message);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Combo</h2>
          <p>Đang tải danh sách combo...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Quản lý Combo</h2>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Combo</h2>
          <p>Quản lý các gói combo khách sạn + tour, thiết lập giá và slot.</p>
        </div>
        <div className={styles.heroMeta}>
          <span className={styles.totalBadge}>
            {overview?.totalElements ?? 0} combos
          </span>
        </div>
      </div>

      <article className={styles.panel}>
        <h3 className={styles.panelTitle}>
          {editingId ? 'Sửa Combo' : 'Tạo Combo Mới'}
        </h3>

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <label className={styles.fullWidth}>
            <span>Tên Combo</span>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Combo Đà Nẵng Hè 2026"
            />
          </label>

          <label className={styles.fullWidth}>
            <span>Mô tả</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Mô tả chi tiết combo"
              rows={3}
            />
          </label>

          <label className={styles.fullWidth}>
            <span>URL Hình ảnh</span>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://res.cloudinary.com/..."
            />
          </label>

          <label>
            <span>Loại Combo</span>
            <select
              value={form.comboType}
              onChange={(e) => setForm((p) => ({ ...p, comboType: e.target.value as AdminComboType }))}
            >
              {COMBO_TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>{COMBO_TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>

          <label>
            <span>ID Khách sạn</span>
            <input
              type="number"
              value={form.hotelId}
              onChange={(e) => setForm((p) => ({ ...p, hotelId: e.target.value }))}
              placeholder="1"
            />
          </label>

          <label>
            <span>ID Tour</span>
            <input
              type="number"
              value={form.tourId}
              onChange={(e) => setForm((p) => ({ ...p, tourId: e.target.value }))}
              placeholder="1"
            />
          </label>

          <label>
            <span>Ngày bắt đầu</span>
            <input
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm((p) => ({ ...p, validFrom: e.target.value }))}
            />
          </label>

          <label>
            <span>Ngày kết thúc</span>
            <input
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm((p) => ({ ...p, validUntil: e.target.value }))}
            />
          </label>

          <label>
            <span>Tổng Slot</span>
            <input
              type="number"
              value={form.totalSlots}
              onChange={(e) => setForm((p) => ({ ...p, totalSlots: e.target.value }))}
              min={1}
            />
          </label>

          <label>
            <span>Giá gốc (VND)</span>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value }))}
              placeholder="3000000"
              min={0}
            />
          </label>

          <label>
            <span>Giá Combo (VND)</span>
            <input
              type="number"
              value={form.comboPrice}
              onChange={(e) => setForm((p) => ({ ...p, comboPrice: e.target.value }))}
              placeholder="2500000"
              min={0}
            />
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
            />
            <span>Nổi bật</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            <span>Kích hoạt</span>
          </label>

          <label className={styles.fullWidth}>
            <span>Lý do thao tác</span>
            <input
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              placeholder="Lý do tạo / cập nhật combo"
            />
          </label>

          <div className={`${styles.actionsBar} ${styles.fullWidth}`}>
            <button className={styles.primaryButton} type="submit" disabled={submitting}>
              <FaPlusCircle />
              {submitting ? 'Đang lưu...' : editingId ? 'Cập nhật Combo' : 'Tạo Combo'}
            </button>
            <button className={styles.ghostButton} type="button" onClick={resetForm}>
              <FaSyncAlt /> Đặt lại
            </button>
          </div>

          {formError ? <div className={styles.errorBox}>{formError}</div> : null}
          {formSuccess ? <div className={styles.successBox}>{formSuccess}</div> : null}
        </form>
      </article>

      <article className={styles.panel}>
        <form className={styles.toolbar} onSubmit={submitSearch}>
          <label className={styles.searchBox}>
            <FaSearch />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên combo"
            />
          </label>

          <select
            aria-label="Lọc theo trạng thái"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ComboStatusFilter); setPage(1); }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s === 'ALL' ? 'Tất cả trạng thái' : s}</option>
            ))}
          </select>

          <select
            aria-label="Lọc theo loại"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as ComboTypeFilter); setPage(1); }}
          >
            {TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'Tất cả loại' : COMBO_TYPE_LABELS[t as AdminComboType] ?? t}
              </option>
            ))}
          </select>

          <button className={styles.primaryButton} type="submit">
            <FaSearch /> Tìm kiếm
          </button>
          <button className={styles.ghostButton} type="button" onClick={resetFilters}>
            <FaSyncAlt /> Đặt lại
          </button>
          <button
            className={styles.ghostButton}
            type="button"
            onClick={() => void loadCombos({ silent: true })}
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
                <th>Tên Combo</th>
                <th>Loại</th>
                <th>Giá</th>
                <th>Tiết kiệm</th>
                <th>Thời hạn</th>
                <th>Slot</th>
                <th>Nổi bật</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!overview?.items || overview.items.length === 0 ? (
                <tr>
                  <td className={styles.emptyCell} colSpan={9}>
                    Không có combo nào phù hợp.
                  </td>
                </tr>
              ) : (
                overview.items.map((combo) => (
                  <tr key={combo.id}>
                    <td>
                      <div className={styles.comboCell}>
                        <strong>{combo.name}</strong>
                        <span>
                          KS: {combo.hotelName ?? `ID ${combo.hotelId ?? '-'} | `}
                          Tour: {combo.tourName ?? `ID ${combo.tourId ?? '-'}`}
                        </span>
                      </div>
                    </td>
                    <td>{COMBO_TYPE_LABELS[combo.comboType] ?? combo.comboType}</td>
                    <td>
                      <div>
                        <s>{formatAmount(combo.originalPrice)}</s>
                        <br />
                        <strong style={{ color: '#0077b6' }}>{formatAmount(combo.comboPrice)}</strong>
                      </div>
                    </td>
                    <td>
                      {combo.savingsPercent != null ? (
                        <span className={styles.savingsBadge}>-{combo.savingsPercent}%</span>
                      ) : '-'}
                    </td>
                    <td>
                      <div className={styles.metaCell}>
                        <span>{formatDate(combo.validFrom)}</span>
                        <span>{formatDate(combo.validUntil)}</span>
                      </div>
                    </td>
                    <td>
                      {combo.remainingSlots ?? 0}/{combo.totalSlots ?? 0}
                    </td>
                    <td>
                      {combo.isFeatured ? (
                        <span className={styles.badgeFeatured}>Nổi bật</span>
                      ) : '-'}
                    </td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          combo.isActive ? styles.badgeActive : styles.badgeInactive
                        }`}
                      >
                        {combo.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionsInline}>
                        <button className={styles.inlineButton} type="button" onClick={() => startEdit(combo)}>
                          <FaEdit /> Sửa
                        </button>
                        <button
                          className={styles.inlineButton}
                          type="button"
                          onClick={() => openConfirm(combo, 'toggle')}
                        >
                          <FaPowerOff />
                          {combo.isActive ? 'Tắt' : 'Bật'}
                        </button>
                        <button
                          className={`${styles.inlineButton} ${styles.deleteButton}`}
                          type="button"
                          onClick={() => openConfirm(combo, 'delete')}
                        >
                          <FaTrashAlt /> Xóa
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Trước
          </button>
          <span>Trang <strong>{page}</strong> / {totalPages}</span>
          <button
            type="button"
            className={styles.ghostButton}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Sau
          </button>
        </div>
      </article>

      {confirmState.open && confirmState.combo ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={closeConfirm}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>
              {confirmState.action === 'delete' ? 'Xóa Combo' : 'Thay đổi trạng thái Combo'}
            </h3>
            <p>
              Combo: <strong>{confirmState.combo.name}</strong>
            </p>
            <p>
              Thao tác: <strong>{confirmState.action === 'delete' ? 'Xóa' : 'Bật/Tắt kích hoạt'}</strong>
            </p>

            <label className={styles.reasonField}>
              <span>Lý do (bắt buộc)</span>
              <textarea
                value={confirmState.reason}
                onChange={(e) => setConfirmState((p) => ({ ...p, reason: e.target.value }))}
                rows={4}
                placeholder="Nhập lý do"
              />
            </label>

            {actionError ? <div className={styles.errorBox}>{actionError}</div> : null}

            <div className={styles.modalActions}>
              <button type="button" className={styles.ghostButton} onClick={closeConfirm}>Hủy</button>
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

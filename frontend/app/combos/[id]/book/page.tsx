'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { toast } from 'react-toastify';

type RootState = {
  auth: {
    isAuthenticated: boolean;
    user: { fullName?: string; name?: string; email?: string; phone?: string } | null;
    token: string | null;
    loading: boolean;
    error: string | null;
  };
};

type BookingResultType = {
  bookingCode?: string;
  guestName?: string;
  guestEmail?: string;
  totalAmount?: number;
  paymentMethod?: string;
  paymentUrl?: string;
};

type ComboType = {
  id?: number;
  name?: string;
  hotelName?: string;
  tourName?: string;
  imageUrl?: string;
  hotelImageUrl?: string;
  comboPrice?: number;
  originalPrice?: number;
  savingsPercent?: number;
  remainingSlots?: number;
  validUntil?: string;
};

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
import {
  FaArrowLeft, FaCheckCircle, FaCreditCard, FaUniversity, FaWallet,
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaUsers
} from 'react-icons/fa';
import comboApi from '@/api/comboApi';
import styles from './page.module.css';

const formatVnd = (v: unknown) => new Intl.NumberFormat('vi-VN').format(Number(v || 0));

const PAYMENT_METHODS = [
  {
    id: 'VNPAY',
    icon: <FaCreditCard />,
    title: 'Thẻ ngân hàng (VNPay)',
    subtitle: 'Thanh toán qua cổng VNPay — hỗ trợ ATM / Visa / MasterCard',
    badge: 'Phổ biến',
    enabled: true,
  },
  {
    id: 'COD',
    icon: <FaWallet />,
    title: 'Thanh toán khi nhận phòng (COD)',
    subtitle: 'Đặt trước, thanh toán tại quầy hoặc khi nhận dịch vụ',
    badge: 'Tiện lợi',
    enabled: true,
  },
];

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function ComboBookPage() {
  const { id } = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [combo, setCombo] = useState<ComboType | null>(null);
  const [loadingCombo, setLoadingCombo] = useState(true);
  const [comboError, setComboError] = useState('');
  const [bookingResult, setBookingResult] = useState<BookingResultType | null>(null);

  type FormType = {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    bookingDate: string;
    guestCount: string;
    nights: string;
    paymentMethod: string;
    note: string;
  };

  type ErrorsType = Partial<Record<keyof FormType, string>>;

  const [form, setForm] = useState<FormType>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    bookingDate: getToday(),
    guestCount: '1',
    nights: '1',
    paymentMethod: 'VNPAY',
    note: '',
  });
  const [errors, setErrors] = useState<ErrorsType>({});
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from logged-in user
  useEffect(() => {
    if (user) {
      setForm((f) => ({
        ...f,
        guestName: f.guestName || user.fullName || user.name || '',
        guestEmail: f.guestEmail || user.email || '',
        guestPhone: f.guestPhone || user.phone || '',
      }));
    }
  }, [user]);

  // Load combo details
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoadingCombo(true);
        const data = await comboApi.getComboById(Number(id));
        const item = data?.data || data || null;
        setCombo(item);
      } catch (err) {
        setComboError(err instanceof Error ? err.message : 'Không tải được chi tiết combo.');
      } finally {
        setLoadingCombo(false);
      }
    };
    void load();
  }, [id]);

  const validate = (): boolean => {
    const e: ErrorsType = {};
    if (!form.guestName.trim()) e.guestName = 'Họ tên là bắt buộc.';
    if (!form.guestEmail.trim()) e.guestEmail = 'Email là bắt buộc.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guestEmail)) e.guestEmail = 'Email không hợp lệ.';
    if (!form.guestPhone.trim()) e.guestPhone = 'Số điện thoại là bắt buộc.';
    if (!form.bookingDate) e.bookingDate = 'Ngày đặt là bắt buộc.';
    if (!form.paymentMethod) e.paymentMethod = 'Chọn phương thức thanh toán.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload = {
        comboId: Number(id),
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: form.guestPhone.trim(),
        bookingDate: form.bookingDate,
        guestCount: Number(form.guestCount) || 1,
        nights: Number(form.nights) || 1,
        note: form.note.trim(),
        paymentMethod: form.paymentMethod,
      };

      const data = await comboApi.bookCombo(payload);
      const result = (data?.data || data || {}) as BookingResultType;

      setBookingResult(result);

      // Redirect to VNPay if paymentUrl returned
      if (result.paymentUrl) {
        toast.success('Đang chuyển đến cổng thanh toán...');
        setTimeout(() => {
          window.location.href = String(result.paymentUrl);
        }, 1500);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Đặt combo thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingCombo) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Đang tải thông tin combo...</p>
        </div>
      </div>
    );
  }

  if (comboError || !combo) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>{comboError || 'Không tìm thấy combo.'}</p>
          <button className={styles.btnPrimary} onClick={() => router.back()}>
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (bookingResult) {
    return (
      <div className={styles.page}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}><FaCheckCircle /></div>
          <h2>Đặt Combo Thành Công!</h2>
          <p>Mã đơn: <strong>{bookingResult.bookingCode}</strong></p>
          <p>Khách hàng: {bookingResult.guestName}</p>
          <p>Email: {bookingResult.guestEmail}</p>
          <p>Tổng tiền: <strong>{formatVnd(bookingResult.totalAmount)} VND</strong></p>
          <p className={styles.successNote}>
            {bookingResult.paymentMethod === 'VNPAY' && bookingResult.paymentUrl
              ? 'Đang chuyển đến cổng thanh toán VNPay...'
              : 'Vui lòng thanh toán để xác nhận đơn đặt.'}
          </p>
          <div className={styles.successActions}>
            <button className={styles.btnPrimary} onClick={() => window.location.href = '/'}>
              Về trang chủ
            </button>
            <button className={styles.btnOutline} onClick={() => window.location.href = '/profile/bookings'}>
              Xem đơn của tôi
            </button>
          </div>
        </div>
      </div>
    );
  }

  const savings = (Number(combo.originalPrice) || 0) - (Number(combo.comboPrice) || 0);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* Header */}
        <div className={styles.pageHeader}>
          <button className={styles.backBtn} onClick={() => router.back()}>
            <FaArrowLeft /> Quay lại
          </button>
          <div>
            <h1 className={styles.pageTitle}>Đặt Combo</h1>
            <p className={styles.pageSub}>{combo.name}</p>
          </div>
        </div>

        <div className={styles.layout}>
          {/* Left: Form */}
          <div className={styles.formColumn}>

            {/* Combo Summary Card */}
            <div className={styles.comboSummaryCard}>
              <img
                src={combo.hotelImageUrl || combo.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'}
                alt={combo.hotelName || combo.name}
                className={styles.comboThumb}
              />
              <div className={styles.comboSummaryInfo}>
                <h3>{combo.name}</h3>
                {combo.hotelName && <p>🏨 {combo.hotelName}</p>}
                {combo.tourName && <p>🗺️ {combo.tourName}</p>}
                {combo.savingsPercent && (
                  <span className={styles.savingsBadge}>Tiết kiệm {combo.savingsPercent}%</span>
                )}
              </div>
              <div className={styles.comboSummaryPrice}>
                <span className={styles.priceCombo}>{formatVnd(combo.comboPrice)}</span>
                <span className={styles.priceUnit}>VND / người</span>
              </div>
            </div>

            {/* Guest Info Form */}
            <form className={styles.formCard} onSubmit={handleSubmit}>
              <h2 className={styles.formTitle}><FaUser /> Thông tin khách hàng</h2>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Họ và tên *</span>
                  <input
                    type="text"
                    value={form.guestName}
                    onChange={(e) => setForm((f) => ({ ...f, guestName: e.target.value }))}
                    placeholder="Nguyen Van A"
                    className={errors.guestName ? styles.inputError : ''}
                  />
                  {errors.guestName && <small className={styles.fieldError}>{errors.guestName}</small>}
                </label>

                <label className={styles.field}>
                  <span>Email *</span>
                  <input
                    type="email"
                    value={form.guestEmail}
                    onChange={(e) => setForm((f) => ({ ...f, guestEmail: e.target.value }))}
                    placeholder="email@example.com"
                    className={errors.guestEmail ? styles.inputError : ''}
                  />
                  {errors.guestEmail && <small className={styles.fieldError}>{errors.guestEmail}</small>}
                </label>

                <label className={styles.field}>
                  <span>Số điện thoại *</span>
                  <input
                    type="tel"
                    value={form.guestPhone}
                    onChange={(e) => setForm((f) => ({ ...f, guestPhone: e.target.value }))}
                    placeholder="0901 234 567"
                    className={errors.guestPhone ? styles.inputError : ''}
                  />
                  {errors.guestPhone && <small className={styles.fieldError}>{errors.guestPhone}</small>}
                </label>

                <label className={styles.field}>
                  <span><FaCalendarAlt /> Ngày đặt</span>
                  <input
                    type="date"
                    value={form.bookingDate}
                    min={getToday()}
                    onChange={(e) => setForm((f) => ({ ...f, bookingDate: e.target.value }))}
                    className={errors.bookingDate ? styles.inputError : ''}
                  />
                  {errors.bookingDate && <small className={styles.fieldError}>{errors.bookingDate}</small>}
                </label>

                <label className={styles.field}>
                  <span><FaUsers /> Số khách</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={form.guestCount}
                    onChange={(e) => setForm((f) => ({ ...f, guestCount: e.target.value }))}
                  />
                </label>

                <label className={styles.field}>
                  <span>Số đêm</span>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={form.nights}
                    onChange={(e) => setForm((f) => ({ ...f, nights: e.target.value }))}
                  />
                </label>
              </div>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Ghi chú</span>
                <textarea
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  placeholder="Yêu cầu đặc biệt, lịch trình mong muốn..."
                  rows={3}
                />
              </label>

              {/* Payment Methods */}
              <h2 className={styles.formTitle} style={{ marginTop: 24 }}>
                <FaCreditCard /> Phương thức thanh toán
              </h2>
              <div className={styles.paymentMethods}>
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.id}
                    className={`${styles.paymentMethod} ${form.paymentMethod === pm.id ? styles.paymentMethodActive : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={pm.id}
                      checked={form.paymentMethod === pm.id}
                      onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                      style={{ display: 'none' }}
                    />
                    <div className={styles.paymentIcon}>{pm.icon}</div>
                    <div className={styles.paymentInfo}>
                      <div className={styles.paymentTitle}>
                        {pm.title}
                        {pm.badge && <span className={styles.paymentBadge}>{pm.badge}</span>}
                      </div>
                      <div className={styles.paymentSub}>{pm.subtitle}</div>
                    </div>
                    {form.paymentMethod === pm.id && (
                      <div className={styles.paymentCheck}><FaCheckCircle /></div>
                    )}
                  </label>
                ))}
              </div>
              {errors.paymentMethod && <small className={styles.fieldError}>{errors.paymentMethod}</small>}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? 'Đang xử lý...' : `Đặt ngay · ${formatVnd(combo.comboPrice)} VND`}
              </button>

              <p className={styles.termsNote}>
                Bằng việc đặt, bạn đồng ý với{' '}
                <a href="/terms" target="_blank">Điều khoản sử dụng</a> và{' '}
                <a href="/privacy" target="_blank">Chính sách bảo mật</a>.
              </p>
            </form>
          </div>

          {/* Right: Price Summary */}
          <div className={styles.summaryColumn}>
            <div className={styles.summaryCard}>
              <h3>Tổng quan thanh toán</h3>

              <div className={styles.summaryRow}>
                <span>Giá combo / người</span>
                <strong>{formatVnd(combo.comboPrice)} VND</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Số khách</span>
                <strong>× {form.guestCount || 1}</strong>
              </div>

              <div className={styles.summaryDivider} />

              <div className={styles.summaryTotal}>
                <span>Tổng cộng</span>
                <strong className={styles.totalAmount}>
                  {formatVnd((combo.comboPrice || 0) * (Number(form.guestCount) || 1))} VND
                </strong>
              </div>

              {savings > 0 && (
                <div className={styles.savingsLine}>
                  💰 Tiết kiệm {formatVnd(savings)} VND
                </div>
              )}

              {combo.remainingSlots !== undefined && combo.remainingSlots !== null && (
                <div className={`${styles.slotNote} ${combo.remainingSlots < 5 ? styles.slotLow : ''}`}>
                  📋 Còn {combo.remainingSlots} slot —{' '}
                  {combo.remainingSlots < 5 ? 'nhanh tay đặt ngay!' : 'đặt sớm để có chỗ'}
                </div>
              )}

              <div className={styles.summaryIncludes}>
                <p className={styles.includesTitle}>Gói combo bao gồm:</p>
                <ul>
                  <li><FaCheckCircle color="#059669" /> Khách sạn cao cấp</li>
                  {combo.tourName && <li><FaCheckCircle color="#059669" /> Tour du lịch</li>}
                  <li><FaCheckCircle color="#059669" /> Bữa sáng</li>
                  <li><FaCheckCircle color="#059669" /> Đưa đón</li>
                  <li><FaCheckCircle color="#059669" /> Bảo hiểm du lịch</li>
                </ul>
              </div>

              {combo.validUntil && (
                <p className={styles.validNote}>
                  ⏰ Combo có hiệu lực đến: {new Date(combo.validUntil).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaCalendarAlt, FaCheckCircle,
  FaMapMarkerAlt, FaUsers, FaShieldAlt,
} from 'react-icons/fa';
import tourApi from '@/api/tourApi';
import bookingApi from '@/api/bookingApi';
import PromotionSelector from '@/components/Common/PromotionSelector/PromotionSelector';
import {
  clearTourBookingDraft,
  loadTourBookingDraft,
  saveTourBookingDraft,
} from '@/utils/conversionStorage';
import styles from './page.module.css';

const formatVnd = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const PAYMENT_METHODS = [
  { id: 'vnpay',        emoji: '🔒', title: 'Thẻ ngân hàng (ATM / Visa / MasterCard)', subtitle: 'Thanh toán qua cổng VNPay — hỗ trợ thẻ nội địa & quốc tế', enabled: true },
  { id: 'bank_transfer',emoji: '🏦', title: 'Chuyển khoản ngân hàng',                     subtitle: 'Nhận thông tin CK và xác nhận thanh toán thủ công',           enabled: true },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80';

const DEFAULT_FORM = {
  guestName: '',
  guestEmail: '',
  guestPhone: '',
  specialRequests: '',
    paymentMethod: 'vnpay',
  agreeTerms: false,
};

/* ════════════════════════════════════════════════════════════
   BOOKING INNER
   ════════════════════════════════════════════════════════════ */
function TourBookingInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasDraftLoaded, setHasDraftLoaded] = useState(false);
  const [recoveredDraftAt, setRecoveredDraftAt] = useState(null);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [appliedPromo, setAppliedPromo] = useState(null);

  const query = useMemo(() => ({
    departureId: Number(searchParams.get('departureId') || 0),
    departureDate: searchParams.get('departureDate') || '',
    adults: Math.max(1, Number(searchParams.get('adults') || 1)),
    children: Math.max(0, Number(searchParams.get('children') || 0)),
  }), [searchParams]);

  const draftContext = useMemo(() => ({
    tourId: Number(id || 0),
    departureId: Number(query.departureId || 0),
    departureDate: query.departureDate,
    adults: query.adults,
    children: query.children,
  }), [id, query]);

  const hasDraftableProgress = useMemo(() => {
    return Boolean(
      form.guestName.trim() ||
      form.guestEmail.trim() ||
      form.guestPhone.trim() ||
      form.specialRequests.trim() ||
      form.agreeTerms ||
      form.paymentMethod !== DEFAULT_FORM.paymentMethod,
    );
  }, [form]);

  /* Pre-fill from user profile */
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      guestName: prev.guestName || (user.fullName || '').trim(),
      guestEmail: prev.guestEmail || user.email || '',
      guestPhone: prev.guestPhone || user.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    const draft = loadTourBookingDraft(draftContext);
    if (draft?.form) {
      setForm((prev) => ({ ...prev, ...draft.form }));
      setRecoveredDraftAt(Number(draft.savedAt || Date.now()));
      toast.info('Da khoi phuc ban nhap dat tour gan nhat.');
    } else {
      setRecoveredDraftAt(null);
    }

    setHasDraftLoaded(true);
  }, [draftContext]);

  useEffect(() => {
    if (!hasDraftLoaded || !id) return;

    if (!hasDraftableProgress) {
      clearTourBookingDraft(draftContext);
      return;
    }

    saveTourBookingDraft(draftContext, form);
  }, [draftContext, form, hasDraftLoaded, hasDraftableProgress, id]);

  /* Fetch tour detail */
  useEffect(() => {
    const fetchTour = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await tourApi.getTourDetail(id);
        setTour(response?.data || null);
      } catch (err) {
        setError(err?.message || 'Không thể tải dữ liệu tour.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTour();
  }, [id]);

  /* Resolved departure */
  const selectedDeparture = useMemo(() => {
    const deps = Array.isArray(tour?.departures) ? tour.departures : [];
    if (!deps.length) return null;
    const byId = deps.find((d) => Number(d.departureId) === query.departureId);
    if (byId) return byId;
    return deps.find((d) => Number(d.availableSlots || 0) > 0) || deps[0] || null;
  }, [tour, query.departureId]);

  const adults = query.adults;
  const children = query.children;
  const totalGuests = adults + children;

  const adultPrice = useMemo(() => {
    if (!tour) return 0;
    if (selectedDeparture?.priceOverride != null) return Number(selectedDeparture.priceOverride);
    return Number(tour.pricePerAdult || 0);
  }, [tour, selectedDeparture]);

  const childPrice = Number(tour?.pricePerChild || 0);
  const originalAmount = adultPrice * adults + childPrice * children;
  const promoDiscount = appliedPromo ? Number(appliedPromo.discountAmount || 0) : 0;
  const totalAmount = Math.max(0, originalAmount - promoDiscount);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  /* Validation */
  const validate = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập trước khi đặt tour.');
      const redirect = typeof window !== 'undefined'
        ? `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '';
      router.push(`/login${redirect}`);
      return false;
    }
    if (!tour || !selectedDeparture) { toast.error('Không tìm thấy thông tin khởi hành.'); return false; }
    if (totalGuests < 1) { toast.error('Tổng số khách phải lớn hơn hoặc bằng 1.'); return false; }
    if (Number(selectedDeparture.availableSlots || 0) < totalGuests) {
      toast.error('Không đủ chỗ trong đợt khởi hành này.');
      return false;
    }
    if (!form.guestName || !form.guestEmail || !form.guestPhone) {
      toast.error('Vui lòng nhập đầy đủ họ tên, email và số điện thoại.');
      return false;
    }
    const method = PAYMENT_METHODS.find((m) => m.id === form.paymentMethod);
    if (method && !method.enabled) { toast.error('Phương thức này đang bảo trì, vui lòng chọn phương thức khác.'); return false; }
    if (!form.agreeTerms) { toast.error('Bạn cần đồng ý điều khoản trước khi tiếp tục.'); return false; }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setIsSubmitting(true);
      const payload = {
        tourId: Number(id),
        departureId: Number(selectedDeparture.departureId),
        adults,
        children,
        guestName: form.guestName.trim(),
        guestEmail: form.guestEmail.trim(),
        guestPhone: form.guestPhone.trim(),
        specialRequests: form.specialRequests.trim() || null,
        ...(appliedPromo?.code && { promoCode: appliedPromo.code }),
      };
      const response = await bookingApi.createTourBooking(payload);
      const booking = response?.data;
      if (!booking?.bookingCode) throw new Error('Hệ thống không trả về mã booking. Vui lòng thử lại.');

      // VNPay: tạo payment URL và redirect
      if (form.paymentMethod === 'vnpay') {
        const vnpayRes = await bookingApi.createVnpayPayment({
          bookingCode: booking.bookingCode,
          returnUrl: `${window.location.origin}/payments/vnpay/return`,
        });
        const paymentUrl = vnpayRes?.data?.paymentUrl;
        if (!paymentUrl) throw new Error('Không nhận được URL thanh toán VNPay.');
        clearTourBookingDraft(draftContext);
        window.location.href = paymentUrl;
        return;
      }

      // Bank transfer: redirect sang trang thành công (COD - admin duyệt sau)
      clearTourBookingDraft(draftContext);
      const successParams = new URLSearchParams({
        bookingCode: booking.bookingCode,
        method: form.paymentMethod,
        amount: String(booking.totalAmount || totalAmount),
        status: 'success',
        bookingType: 'TOUR',
        tourId: String(id),
      });
      router.push(`/payments/success?${successParams.toString()}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể tạo booking tour. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearSavedDraft = () => {
    clearTourBookingDraft(draftContext);
    setRecoveredDraftAt(null);
    toast.info('Da xoa ban nhap luu tru cho hanh trinh nay.');
  };

  /* ── STATES ── */
  if (loading) return <div className={styles.statusBox}>⏳ Đang tải trang đặt tour...</div>;
  if (error || !tour || !selectedDeparture) return (
    <div className={styles.statusBoxError}>
      <p>{error || 'Không có dữ liệu đặt tour.'}</p>
      <button className={styles.backBtn} onClick={() => router.back()}>← Quay lại trang chi tiết</button>
    </div>
  );

  const coverImg = Array.isArray(tour.images) && tour.images[0] ? tour.images[0] : FALLBACK_IMAGE;

  return (
    <div className={styles.pageWrapper}>
      {/* ── BREADCRUMB ── */}
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <FaArrowLeft /> Quay lại
          </button>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>Xác nhận đặt tour</span>
        </div>
      </div>

      {/* ── PROGRESS ── */}
      <div className={styles.progressBar}>
        <div className={styles.progressInner}>
          <div className={styles.progressStep}>
            <div className={`${styles.progressStepCircle} ${styles.progressStepCircleDone}`}>✓</div>
            <span className={styles.progressStepLabel}>Chọn tour</span>
          </div>
          <div className={`${styles.progressLine} ${styles.progressLineDone}`} />
          <div className={styles.progressStep}>
            <div className={`${styles.progressStepCircle} ${styles.progressStepCircleActive}`}>2</div>
            <span className={`${styles.progressStepLabel} ${styles.progressStepLabelActive}`}>Xác nhận & Thanh toán</span>
          </div>
          <div className={styles.progressLine} />
          <div className={styles.progressStep}>
            <div className={styles.progressStepCircle}>3</div>
            <span className={styles.progressStepLabel}>Hoàn thành</span>
          </div>
        </div>
      </div>

      <main className={styles.page}>
        <div className={styles.layout}>
          {/* ══════════ LEFT COL ══════════ */}
          <section className={styles.leftCol}>
            {/* Tour summary */}
            <div className={styles.tourSummaryCard}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImg} alt={tour.title} className={styles.tourSummaryImg} />
              <div className={styles.tourSummaryBody}>
                <h1 className={styles.tourTitle}>{tour.title}</h1>
                <p className={styles.tourCity}>
                  <FaMapMarkerAlt className={styles.tourCityIcon} /> {tour.city}
                </p>
                <div className={styles.tagRow}>
                  <span className={styles.tag}>📅 {tour.durationDays || 0}N{tour.durationNights || 0}Đ</span>
                  <span className={styles.tag}>🎯 {tour.difficulty === 'EASY' ? 'Dễ đi' : tour.difficulty === 'MEDIUM' ? 'Trung bình' : 'Thử thách'}</span>
                  {tour.categoryName && <span className={styles.tag}>🏷️ {tour.categoryName}</span>}
                </div>
              </div>
            </div>

            {/* Departure info */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <div className={styles.blockIcon}>🚌</div>
                <h2 className={styles.blockTitle}>Thông tin khởi hành</h2>
              </div>
              <div className={styles.blockBody}>
                <div className={styles.infoGrid}>
                  <div className={styles.infoCell}>
                    <span className={styles.infoCellLabel}>Ngày khởi hành</span>
                    <span className={styles.infoCellValue}>
                      📅 {selectedDeparture.departureDate || query.departureDate || '—'}
                    </span>
                  </div>
                  <div className={styles.infoCell}>
                    <span className={styles.infoCellLabel}>Chỗ còn lại</span>
                    <span className={styles.infoCellValue}>🪑 {selectedDeparture.availableSlots || 0} chỗ</span>
                  </div>
                  <div className={styles.infoCell}>
                    <span className={styles.infoCellLabel}>Số lượng khách</span>
                    <span className={styles.infoCellValue}>
                      <FaUsers className={styles.infoUsersIcon} />
                      {adults} người lớn, {children} trẻ em
                    </span>
                  </div>
                  <div className={styles.infoCell}>
                    <span className={styles.infoCellLabel}>Mã đợt khởi hành</span>
                    <span className={styles.infoCellValue}>#{selectedDeparture.departureId}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Policy */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <div className={styles.blockIcon}>✅</div>
                <h2 className={styles.blockTitle}>Quyền lợi & Chính sách</h2>
              </div>
              <div className={styles.blockBody}>
                <ul className={styles.policyList}>
                  <li><FaCheckCircle className={styles.policyIcon} />Xác nhận booking ngay sau khi thanh toán thành công.</li>
                  <li><FaCheckCircle className={styles.policyIcon} />Ưu tiên đổi lịch (nếu còn chỗ) trước ngày khởi hành 7 ngày.</li>
                  <li><FaCheckCircle className={styles.policyIcon} />Cung cấp thông tin hướng dẫn chi tiết trước chuyến đi.</li>
                  <li><FaCheckCircle className={styles.policyIcon} />Hỗ trợ khách hàng 24/7 trong suốt hành trình.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ══════════ RIGHT COL ══════════ */}
          <aside className={styles.rightCol}>
            <div className={styles.recoveryBanner}>
              <p className={styles.recoveryText}>
                He thong tu dong luu ban nhap dat tour de ban tiep tuc neu roi trang giua chung.
              </p>
              {recoveredDraftAt && (
                <p className={styles.recoveryMeta}>
                  Da khoi phuc ban nhap luc {new Date(recoveredDraftAt).toLocaleString('vi-VN')}.
                </p>
              )}
              {hasDraftableProgress && (
                <button type="button" className={styles.recoveryBtn} onClick={handleClearSavedDraft}>
                  Xoa ban nhap da luu
                </button>
              )}
            </div>

            {/* Price summary */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <div className={styles.blockIcon}>💰</div>
                <h2 className={styles.blockTitle}>Tổng quan thanh toán</h2>
              </div>
              <div className={styles.blockBody}>
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Giá người lớn</span>
                  <span className={styles.summaryRowValue}>{formatVnd(adultPrice)} × {adults}</span>
                </div>
                {children > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>Giá trẻ em</span>
                    <span className={styles.summaryRowValue}>{formatVnd(childPrice)} × {children}</span>
                  </div>
                )}
                <div className={styles.summaryRow}>
                  <span className={styles.summaryRowLabel}>Tổng khách</span>
                  <span className={styles.summaryRowValue}>{totalGuests} người</span>
                </div>
                {promoDiscount > 0 && (
                  <div className={styles.summaryRow}>
                    <span className={styles.summaryRowLabel}>Mã khuyến mãi ({appliedPromo?.code})</span>
                    <span className={styles.summaryRowValue} style={{ color: '#dc2626', fontWeight: 700 }}>
                      -{formatVnd(promoDiscount)}
                    </span>
                  </div>
                )}
                <div className={styles.totalRow}>
                  <span className={styles.totalLabel}>Tổng thanh toán</span>
                  <span className={styles.totalAmount}>{formatVnd(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Promotion Selector */}
            <div className={styles.block}>
              <PromotionSelector
                appliesTo="TOUR"
                orderAmount={originalAmount}
                selectedPromo={appliedPromo}
                onApply={(promo) => setAppliedPromo(promo)}
                onRemove={() => setAppliedPromo(null)}
              />
            </div>

            {/* Booking form */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <div className={styles.blockIcon}>👤</div>
                <h2 className={styles.blockTitle}>Thông tin người đặt</h2>
              </div>
              <div className={styles.blockBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và tên *</label>
                  <input
                    className={styles.input}
                    value={form.guestName}
                    onChange={(e) => setField('guestName', e.target.value)}
                    placeholder="Nhập họ và tên đầy đủ"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email *</label>
                  <input
                    className={styles.input}
                    type="email"
                    value={form.guestEmail}
                    onChange={(e) => setField('guestEmail', e.target.value)}
                    placeholder="email@example.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Số điện thoại *</label>
                  <input
                    className={styles.input}
                    value={form.guestPhone}
                    onChange={(e) => setField('guestPhone', e.target.value)}
                    placeholder="0901 234 567"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Yêu cầu đặc biệt</label>
                  <textarea
                    className={styles.textarea}
                    rows={3}
                    value={form.specialRequests}
                    onChange={(e) => setField('specialRequests', e.target.value)}
                    placeholder="Ví dụ: ăn chay, ghế ngồi ưu tiên, trợ lý di chuyển..."
                  />
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <div className={styles.block}>
              <div className={styles.blockHeader}>
                <div className={styles.blockIcon}>💳</div>
                <h2 className={styles.blockTitle}>Phương thức thanh toán</h2>
              </div>
              <div className={styles.blockBody}>
                <div className={styles.methodList}>
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`${styles.methodItem} ${!method.enabled ? styles.methodItemDisabled : ''} ${form.paymentMethod === method.id ? styles.methodItemActive : ''}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        className={styles.methodRadio}
                        checked={form.paymentMethod === method.id}
                        onChange={() => setField('paymentMethod', method.id)}
                        disabled={!method.enabled}
                      />
                      <span className={styles.methodEmoji}>{method.emoji}</span>
                      <div className={styles.methodInfo}>
                        <p className={styles.methodTitle}>{method.title}</p>
                        <p className={styles.methodSub}>{method.subtitle}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <label className={`${styles.agreeRow} ${styles.agreeRowSpaced}`}>
                  <input
                    type="checkbox"
                    className={styles.agreeCheckbox}
                    checked={form.agreeTerms}
                    onChange={(e) => setField('agreeTerms', e.target.checked)}
                  />
                  <span className={styles.agreeText}>
                    Tôi đồng ý với{' '}
                    <span className={styles.agreeLink}>điều khoản đặt tour</span>{' '}
                    và{' '}
                    <span className={styles.agreeLink}>chính sách thanh toán</span>.
                  </span>
                </label>

                <button
                  type="button"
                  className={`${styles.submitBtn} ${styles.submitBtnSpaced}`}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '⏳ Đang xử lý...' : '🎒 Xác nhận đặt tour'}
                </button>

                <p className={styles.secureNote}>
                  <FaShieldAlt /> <FaCalendarAlt className={styles.secureCalendarIcon} />
                  &nbsp;Thanh toán an toàn · Nhận mã booking ngay lập tức
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default function TourBookingPage() {
  return (
    <Suspense fallback={<div className={styles.suspenseFallback}>Đang tải...</div>}>
      <TourBookingInner />
    </Suspense>
  );
}

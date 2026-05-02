'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaCreditCard,
  FaUniversity,
  FaWallet,
  FaMobileAlt,
} from 'react-icons/fa';
import hotelApi from '@/api/hotelApi';
import bookingApi from '@/api/bookingApi';
import PromotionSelector from '@/components/Common/PromotionSelector/PromotionSelector';
import styles from './page.module.css';

const formatVnd = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const PAYMENT_METHODS = [
  {
    id: 'vnpay',
    icon: <FaCreditCard />,
    title: 'Thẻ ngân hàng (ATM / Visa / MasterCard)',
    subtitle: 'Thanh toán qua cổng VNPay — hỗ trợ thẻ nội địa & quốc tế',
    badge: 'Phổ biến',
    enabled: true,
  },
  {
    id: 'bank_transfer',
    icon: <FaUniversity />,
    title: 'Chuyển khoản ngân hàng',
    subtitle: 'Nhận thông tin CK và xác nhận thanh toán thủ công',
    badge: 'COD',
    enabled: true,
  },
];

const TEXTS = {
  titleBookingInfo: 'Chi tiết đặt phòng của bạn',
  titleRoom: 'Thông tin phòng',
  titlePaymentSummary: 'Tổng quan thanh toán',
  titleGuestInfo: 'Thông tin người đặt',
  titleExtraServices: 'Bổ sung cho kỳ nghỉ',
  titlePaymentMethods: 'Phương thức thanh toán',
  titleCardInfo: 'Thông tin thanh toán',
};

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrow = (fromDate = null) => {
  const nextDate = fromDate ? new Date(fromDate) : new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function HotelBookingInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [hotel, setHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formState, setFormState] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Việt Nam',
    assistanceOption: 'Không yêu cầu',
    specialRequests: '',
    arrivalTime: '',
    needFlight: false,
    needTaxi: false,
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    closeRooms: false,
    paymentMethod: 'vnpay',
    needInvoice: false,
    invoiceCompany: '',
    invoiceTaxCode: '',
    invoiceEmail: '',
    agreePolicy: true,
    agreeTerms: false,
  });

  const query = useMemo(() => {
    const checkIn = searchParams.get('checkIn') || getToday();
    const checkOutRaw = searchParams.get('checkOut') || getTomorrow(checkIn);
    const checkOut = new Date(checkOutRaw).getTime() > new Date(checkIn).getTime()
      ? checkOutRaw
      : getTomorrow(checkIn);

    return {
      checkIn,
      checkOut,
      adults: Number(searchParams.get('adults') || 2),
      children: Number(searchParams.get('children') || 0),
      rooms: Number(searchParams.get('rooms') || 1),
      roomTypeId: Number(searchParams.get('roomTypeId') || 0),
    };
  }, [searchParams]);

  const nights = Math.max(
    1,
    Math.ceil((new Date(query.checkOut).getTime() - new Date(query.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
  );

  useEffect(() => {
    if (!user) return;

    const name = (user.fullName || '').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.length > 1 ? parts[parts.length - 1] : '';
    const middleName = parts.length > 2 ? parts.slice(1, -1).join(' ') : '';

    setFormState((prev) => ({
      ...prev,
      firstName,
      middleName,
      lastName,
      email: user.email || '',
      phone: user.phone || '',
      cardName: name,
      invoiceEmail: user.email || '',
    }));
  }, [user]);

  useEffect(() => {
    const fetchHotelDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await hotelApi.getHotelDetail(id);
        const data = response?.data;

        if (!data) {
          setError('Không tìm thấy thông tin khách sạn.');
          return;
        }

        setHotel(data);

        const roomTypes = Array.isArray(data.roomTypes) ? data.roomTypes : [];
        const queryRoom = roomTypes.find((room) => Number(room.id) === query.roomTypeId);
        setSelectedRoom(queryRoom || roomTypes[0] || null);
      } catch (err) {
        setError(err?.message || 'Không thể tải dữ liệu đặt phòng.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchHotelDetail();
    }
  }, [id, query.roomTypeId]);

  const fullName = `${formState.firstName} ${formState.middleName} ${formState.lastName}`.replace(/\s+/g, ' ').trim();
  const roomPrice = Number(selectedRoom?.basePricePerNight || 0);
  const originalPrice = roomPrice * nights * query.rooms;
  const loyaltyDiscount = Math.round(originalPrice * 0.04);

  const [appliedPromo, setAppliedPromo] = useState(null);
  const promoDiscount = appliedPromo ? Number(appliedPromo.discountAmount || 0) : 0;
  const totalPrice = Math.max(0, originalPrice - loyaltyDiscount - promoDiscount);
  const amountDueNow = totalPrice;
  const amountPayLater = 0;
  const requiresCardForm = formState.paymentMethod === 'card_domestic';

  const paymentButtonLabelByMethod = {
    vnpay: 'Thanh toán với VNPay',
    momo: 'Tiếp tục với MoMo',
    zalopay: 'Tiếp tục với ZaloPay',
    bank_transfer: 'Xác nhận chuyển khoản',
    card_domestic: 'Thanh toán bằng thẻ',
  };

  const submitButtonLabel = paymentButtonLabelByMethod[formState.paymentMethod] || 'Xác nhận thanh toán';
  const selectedPaymentMethod = PAYMENT_METHODS.find((method) => method.id === formState.paymentMethod);

  const onFieldChange = (field, value) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const validateBeforeSubmit = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập trước khi đặt phòng.');
      const redirect = typeof window !== 'undefined'
        ? `?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}` : '';
      router.push(`/login${redirect}`);
      return false;
    }

    if (!hotel || !selectedRoom) {
      toast.error('Thiếu dữ liệu phòng để đặt.');
      return false;
    }

    if (!fullName) {
      toast.error('Vui lòng nhập họ tên đầy đủ.');
      return false;
    }

    if (!formState.email || !formState.phone) {
      toast.error('Vui lòng nhập email và số điện thoại.');
      return false;
    }

    if (!formState.paymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán.');
      return false;
    }

    if (selectedPaymentMethod && selectedPaymentMethod.enabled === false) {
      toast.error('Phương thức này đang bảo trì, vui lòng chọn phương thức khác.');
      return false;
    }

    if (!formState.agreeTerms) {
      toast.error('Bạn cần đồng ý điều khoản trước khi thanh toán.');
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validateBeforeSubmit()) return;

    try {
      setIsSubmitting(true);

      const specialParts = [
        formState.specialRequests?.trim(),
        formState.needFlight ? 'Yêu cầu hỗ trợ vé máy bay' : '',
        formState.needTaxi ? 'Yêu cầu xe đưa đón sân bay' : '',
        formState.closeRooms ? 'Muốn phòng gần nhau' : '',
        `Giờ đến dự kiến: ${formState.arrivalTime}`,
        `Phương thức thanh toán: ${formState.paymentMethod}`,
        formState.needInvoice ? 'Xuất hóa đơn VAT' : 'Không xuất hóa đơn VAT',
      ].filter(Boolean);

      const payload = {
        hotelId: Number(id),
        roomTypeId: Number(selectedRoom.id),
        checkIn: query.checkIn,
        checkOut: query.checkOut,
        adults: query.adults,
        children: query.children,
        rooms: query.rooms,
        guestName: fullName,
        guestEmail: formState.email,
        guestPhone: formState.phone,
        specialRequests: specialParts.join(' | '),
        ...(appliedPromo?.code && { promoCode: appliedPromo.code }),
      };

      // Bước 1: Tạo booking
      const response = await bookingApi.createBooking(payload);
      const booking = response?.data;

      if (!booking?.bookingCode) {
        throw new Error('Không nhận được mã booking từ hệ thống. Vui lòng thử lại.');
      }

      // Bước 2: Xử lý theo phương thức thanh toán
      if (formState.paymentMethod === 'vnpay') {
        // Gọi API tạo URL thanh toán VNPay
        const vnpayRes = await bookingApi.createVnpayPayment({
          bookingCode: booking.bookingCode,
          returnUrl: `${window.location.origin}/payments/vnpay/return`,
        });
        const paymentUrl = vnpayRes?.data?.paymentUrl;

        if (!paymentUrl) {
          throw new Error('Không nhận được URL thanh toán VNPay. Vui lòng thử lại.');
        }

        // Redirect sang cổng VNPay
        window.location.href = paymentUrl;
        return;
      }

      // Bước 2 (phương thức khác): Redirect thẳng sang trang thành công
      const successParams = new URLSearchParams({
        bookingCode: booking.bookingCode,
        method: formState.paymentMethod,
        amount: String(amountDueNow),
        status: 'success',
      });

      router.push(`/payments/success?${successParams.toString()}`);
    } catch (err) {
      toast.error(err?.message || 'Không thể hoàn tất booking. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.status}>Đang tải dữ liệu đặt phòng...</div>;
  }

  if (error || !hotel || !selectedRoom) {
    return (
      <div className={styles.statusError}>
        <p>{error || 'Không có dữ liệu phòng.'}</p>
        <button className={styles.backBtn} onClick={() => router.back()}>
          Quay lại trang chi tiết
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.breadcrumb}>
        <div className={styles.breadcrumbInner}>
          <button className={styles.backButton} onClick={() => router.back()}>
            <FaArrowLeft /> Quay lại
          </button>
          <span className={styles.breadcrumbSep}>›</span>
          <span className={styles.breadcrumbCurrent}>Xác nhận & Thanh toán khách sạn</span>
        </div>
      </div>

      <div className={styles.progressBar}>
        <div className={styles.progressInner}>
          <div className={styles.progressStep}>
            <div className={`${styles.progressStepCircle} ${styles.progressStepCircleDone}`}>✓</div>
            <span className={styles.progressStepLabel}>Chọn phòng</span>
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
          <section className={styles.leftCol}>
          <article className={styles.block}>
            <div className={styles.topAction}>
              <div>
                <strong>{fullName || user?.fullName || 'Khách chưa đăng nhập'}</strong>
                <p>{user?.email || 'Vui lòng điền thông tin liên hệ để hoàn tất đặt phòng'}</p>
              </div>
              <button type="button" onClick={() => router.push('/profile/bookings')}>
                Xem lịch sử đặt phòng
              </button>
            </div>

            <h2>{TEXTS.titleGuestInfo}</h2>
            <p className={styles.helperText}>Thông tin chính xác giúp khách sạn hỗ trợ nhận phòng nhanh hơn.</p>

            <div className={styles.inputGrid3}>
              <label>
                Tên *
                <input value={formState.firstName} onChange={(e) => onFieldChange('firstName', e.target.value)} />
              </label>
              <label>
                Tên đệm
                <input value={formState.middleName} onChange={(e) => onFieldChange('middleName', e.target.value)} />
              </label>
              <label>
                Họ *
                <input value={formState.lastName} onChange={(e) => onFieldChange('lastName', e.target.value)} />
              </label>
            </div>

            <div className={styles.inputGrid2}>
              <label>
                Email
                <input type="email" value={formState.email} onChange={(e) => onFieldChange('email', e.target.value)} />
              </label>
              <label>
                Số điện thoại
                <input value={formState.phone} onChange={(e) => onFieldChange('phone', e.target.value)} />
              </label>
            </div>

            <div className={styles.inputGrid2}>
              <label>
                Nhu cầu hỗ trợ
                <select value={formState.assistanceOption} onChange={(e) => onFieldChange('assistanceOption', e.target.value)}>
                  <option>Không yêu cầu</option>
                  <option>Cần phòng gần thang máy</option>
                  <option>Cần phòng cho người khuyết tật</option>
                </select>
              </label>
              <label>
                Quốc gia / Khu vực
                <input value={formState.country} onChange={(e) => onFieldChange('country', e.target.value)} />
              </label>
            </div>
          </article>

          <article className={styles.block}>
            <h2>{TEXTS.titleExtraServices}</h2>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formState.needFlight} onChange={(e) => onFieldChange('needFlight', e.target.checked)} />
              <span>Tôi cần hỗ trợ vé máy bay</span>
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formState.needTaxi} onChange={(e) => onFieldChange('needTaxi', e.target.checked)} />
              <span>Tôi muốn đặt xe đưa đón sân bay trước</span>
            </label>

            <label className={styles.textAreaLabel}>
              Yêu cầu đặc biệt
              <textarea
                rows={4}
                value={formState.specialRequests}
                onChange={(e) => onFieldChange('specialRequests', e.target.value)}
                placeholder="Nhập yêu cầu đặc biệt (nếu có)"
              />
            </label>

            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formState.closeRooms} onChange={(e) => onFieldChange('closeRooms', e.target.checked)} />
              <span>Tôi muốn các phòng ở gần nhau</span>
            </label>

            <label>
              Giờ đến dự kiến
              <input
                type="text"
                value={formState.arrivalTime}
                onChange={(e) => onFieldChange('arrivalTime', e.target.value)}
                placeholder="Ví dụ: Khoảng 14:30 hoặc buổi tối"
              />
            </label>
          </article>

          <article className={styles.block}>
            <h2>{TEXTS.titlePaymentMethods}</h2>
            <p className={styles.helperText}>Chọn phương thức phù hợp để tiếp tục thanh toán nhanh chóng.</p>

            <div className={styles.methodGrid}>
              {PAYMENT_METHODS.map((method) => {
                const active = formState.paymentMethod === method.id;
                const disabled = method.enabled === false;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`${styles.methodCard} ${active ? styles.methodCardActive : ''} ${disabled ? styles.methodCardDisabled : ''}`}
                    onClick={() => {
                      if (!disabled) onFieldChange('paymentMethod', method.id);
                    }}
                    disabled={disabled}
                  >
                    <span className={styles.methodIcon}>{method.icon}</span>
                    <span className={styles.methodBody}>
                      <strong>{method.title}</strong>
                      <small>{method.subtitle}</small>
                    </span>
                    <span className={styles.methodBadge}>{method.badge}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.noticeBox}>
              Số tiền thanh toán ngay theo phương thức đã chọn:
              {' '}
              <strong>{formatVnd(amountDueNow)} VND</strong>
            </div>

            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formState.needInvoice} onChange={(e) => onFieldChange('needInvoice', e.target.checked)} />
              <span>Tôi cần xuất hóa đơn VAT</span>
            </label>

            {formState.needInvoice && (
              <div className={styles.inputGrid3}>
                <label>
                  Tên công ty
                  <input value={formState.invoiceCompany} onChange={(e) => onFieldChange('invoiceCompany', e.target.value)} />
                </label>
                <label>
                  Mã số thuế
                  <input value={formState.invoiceTaxCode} onChange={(e) => onFieldChange('invoiceTaxCode', e.target.value)} />
                </label>
                <label>
                  Email nhận hóa đơn
                  <input value={formState.invoiceEmail} onChange={(e) => onFieldChange('invoiceEmail', e.target.value)} />
                </label>
              </div>
            )}
          </article>

          <article className={styles.block}>
            <h2>{requiresCardForm ? TEXTS.titleCardInfo : 'Xác nhận thanh toán'}</h2>

            {requiresCardForm ? (
              <div className={styles.cardGrid}>
                <label>
                  Tên chủ thẻ / tài khoản
                  <input value={formState.cardName} onChange={(e) => onFieldChange('cardName', e.target.value)} />
                </label>
                <label>
                  Số thẻ / số tài khoản
                  <input value={formState.cardNumber} onChange={(e) => onFieldChange('cardNumber', e.target.value)} placeholder="0000 0000 0000 0000" />
                </label>
                <label>
                  Hạn dùng
                  <input value={formState.cardExpiry} onChange={(e) => onFieldChange('cardExpiry', e.target.value)} placeholder="MM/YY" />
                </label>
                <label>
                  CVC / OTP
                  <input value={formState.cardCvc} onChange={(e) => onFieldChange('cardCvc', e.target.value)} placeholder="***" />
                </label>
              </div>
            ) : (
              <div className={styles.noticeBox}>
                Sau khi bấm nút bên dưới, hệ thống sẽ chuyển bạn tới trang thanh toán của đối tác để hoàn tất giao dịch.
              </div>
            )}

            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formState.agreePolicy} onChange={(e) => onFieldChange('agreePolicy', e.target.checked)} />
              <span>Tôi đã đọc chính sách hủy và hoàn tiền.</span>
            </label>
            <label className={styles.checkboxRow}>
              <input type="checkbox" checked={formState.agreeTerms} onChange={(e) => onFieldChange('agreeTerms', e.target.checked)} />
              <span>Tôi đồng ý điều khoản đặt phòng và cam kết thông tin là chính xác.</span>
            </label>

            <button className={styles.paymentBtn} onClick={handlePayment} disabled={isSubmitting}>
              <FaCreditCard /> {isSubmitting ? 'Đang xử lý thanh toán...' : submitButtonLabel}
            </button>
          </article>
          </section>

          <section className={styles.rightCol}>
          <article className={styles.hotelCard}>
            <div className={styles.hotelTop}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={hotel.coverImage || 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=400&q=80'}
                alt={hotel.name}
                className={styles.hotelThumb}
              />
              <div>
                <h1 className={styles.hotelName}>{hotel.name}</h1>
                <p className={styles.hotelAddress}><FaMapMarkerAlt /> {hotel.address}</p>
                <p className={styles.rating}>
                  {Number(hotel.avgRating || 0).toFixed(1)} / 10
                  {' '}
                  ({Number(hotel.reviewCount || 0).toLocaleString('vi-VN')} đánh giá)
                </p>
              </div>
            </div>

            <div className={styles.locationBlock}>
              <h3>Thông tin vị trí</h3>
              <ul>
                <li>Gần trung tâm thành phố</li>
                <li>Thuận tiện ra sân bay và ga tàu</li>
                <li>Dễ dàng kết nối điểm tham quan nổi bật</li>
                <li>Khu vực an toàn, phù hợp nghỉ dưỡng gia đình</li>
              </ul>
            </div>

            <div className={styles.amenitiesList}>
              <div><FaCheckCircle /> Bữa sáng miễn phí</div>
              <div><FaCheckCircle /> Wifi tốc độ cao</div>
              <div><FaCheckCircle /> Bãi đỗ xe</div>
              <div><FaCheckCircle /> Hồ bơi & khu thư giãn</div>
              <div><FaCheckCircle /> Hỗ trợ 24/7</div>
            </div>
          </article>

          <article className={styles.block}>
            <h2>{TEXTS.titleBookingInfo}</h2>
            <div className={styles.dateGrid}>
              <div>
                <strong>Ngày nhận phòng</strong>
                <p>{query.checkIn}</p>
              </div>
              <div>
                <strong>Ngày trả phòng</strong>
                <p>{query.checkOut}</p>
              </div>
            </div>
            <ul className={styles.metaList}>
              <li>Thời gian lưu trú: {nights} đêm</li>
              <li>Số phòng đã chọn: {query.rooms}</li>
              <li>{query.adults} người lớn</li>
              <li>{query.children} trẻ em</li>
            </ul>
          </article>

          <article className={styles.block}>
            <h2>{TEXTS.titleRoom}: <span>{selectedRoom.name}</span></h2>
            <p className={styles.roomMeta}>
              Sức chứa tối đa: {selectedRoom.capacity || query.adults} người lớn
            </p>
            <div className={styles.tagGrid}>
              <span>Diện tích tối ưu</span>
              <span>Không gian riêng tư</span>
              <span>Giường êm ái</span>
              <span>Phòng tắm riêng</span>
              <span>TV màn hình phẳng</span>
              <span>Điều hòa</span>
            </div>
          </article>

          <article className={styles.block}>
            <h2>{TEXTS.titlePaymentSummary}</h2>
            <div className={styles.summaryLine}><span>Giá phòng gốc</span><strong>{formatVnd(originalPrice)} VND</strong></div>
            <div className={styles.summaryLine}><span>Ưu đãi thành viên 4%</span><strong className={styles.discount}>-{formatVnd(loyaltyDiscount)} VND</strong></div>
            {promoDiscount > 0 && (
              <div className={styles.summaryLine}><span>Mã khuyến mãi ({appliedPromo?.code})</span><strong className={styles.discount}>-{formatVnd(promoDiscount)} VND</strong></div>
            )}
            <div className={`${styles.summaryLine} ${styles.total}`}><span>Tổng tiền phòng</span><strong>{formatVnd(totalPrice)} VND</strong></div>
            <div className={styles.summaryLine}><span>Thanh toán ngay (bắt buộc)</span><strong>{formatVnd(amountDueNow)} VND</strong></div>
            <div className={styles.summaryLine}><span>Thanh toán tại khách sạn</span><strong>{formatVnd(amountPayLater)} VND</strong></div>

            <h3 className={styles.subTitle}>Chính sách hủy</h3>
            <p className={styles.note}>Miễn phí hủy trước 24 giờ so với giờ check-in. Sau thời điểm này có thể áp dụng phí theo điều kiện phòng.</p>
            <p className={styles.note}>
              Để giữ phòng chắc chắn, đơn đặt phòng được xác nhận sau khi thanh toán đầy đủ.
            </p>
          </article>

          {/* Promotion Selector */}
          <article className={styles.block}>
            <PromotionSelector
              appliesTo="HOTEL"
              orderAmount={totalPrice}
              selectedPromo={appliedPromo}
              onApply={(promo) => setAppliedPromo(promo)}
              onRemove={() => setAppliedPromo(null)}
            />
          </article>
        </section>
        </div>
      </main>
    </div>
  );
}

export default function HotelBookingPage() {
  return (
    <Suspense
      fallback={(
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontSize: 16, color: '#666' }}>
          Đang tải thông tin đặt phòng...
        </div>
      )}
    >
      <HotelBookingInner />
    </Suspense>
  );
}

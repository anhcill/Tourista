'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  FaCalendarAlt, FaHotel, FaMapMarkerAlt, FaQrcode, FaUsers, FaTimes,
  FaEdit, FaShareAlt
} from 'react-icons/fa';
import bookingApi from '@/api/bookingApi';
import ClientChatModal from '@/components/Chat/ClientChatModal';
import ModifyBookingModal from '@/components/Bookings/ModifyBookingModal/ModifyBookingModal';
import ShareButtons from '@/components/Common/ShareButtons/ShareButtons';
import styles from './page.module.css';

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
};

const formatMoney = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const statusLabel = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  CANCELLED: 'Đã hủy',
  COMPLETED: 'Hoàn tất',
};

const statusClass = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
};

const encodeQrData = (booking) => {
  const isTourBooking = booking.bookingType === 'TOUR' || (!!booking.tourId && !booking.hotelId);

  const payload = {
    bookingCode: booking.bookingCode || '-',
    bookingType: booking.bookingType || (isTourBooking ? 'TOUR' : 'HOTEL'),
    title: isTourBooking
      ? (booking.tourTitle || 'Tour chua xac dinh')
      : (booking.hotelName || 'Khach san chua xac dinh'),
    subTitle: isTourBooking
      ? `Khoi hanh: ${formatDate(booking.departureDate)}`
      : (booking.roomTypeName || '-'),
    checkIn: formatDate(booking.checkIn),
    checkOut: formatDate(booking.checkOut),
    departureDate: formatDate(booking.departureDate),
    nights: booking.nights || 0,
    rooms: booking.rooms || 0,
    adults: booking.adults || 0,
    children: booking.children || 0,
    totalAmount: `${formatMoney(booking.totalAmount)} ${booking.currency || 'VND'}`,
    status: statusLabel[booking.status] || booking.status || '-',
    createdAt: formatDate(booking.createdAt),
  };

  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  } catch {
    return '';
  }
};

function ProfileBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatSeed, setChatSeed] = useState(null);

  // Cancel booking modal state
  const [cancelModal, setCancelModal] = useState({ isOpen: false, booking: null, reason: '', submitting: false });

  // Modify booking modal state
  const [modifyModal, setModifyModal] = useState({ isOpen: false, booking: null });

  const fromPayment = searchParams.get('from') === 'payment';
  const paymentBookingCode = searchParams.get('bookingCode') || '';
  const paymentBookingType = (searchParams.get('bookingType') || '').toUpperCase();

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await bookingApi.getBookings();
        const data = Array.isArray(response?.data) ? response.data : [];
        setBookings(data);
      } catch (err) {
        setError(err?.message || 'Không thể tải lịch sử booking.');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, []);

  const summary = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((item) => item.status === 'PENDING').length;
    const confirmed = bookings.filter((item) => item.status === 'CONFIRMED').length;

    return { total, pending, confirmed };
  }, [bookings]);

  const paidBooking = useMemo(
    () => bookings.find((item) => item.bookingCode === paymentBookingCode) || null,
    [bookings, paymentBookingCode],
  );

  const openChatWithOwner = (booking) => {
    const isTourBooking = booking.bookingType === 'TOUR' || (!!booking.tourId && !booking.hotelId);
    const partnerId =
      booking.partnerId ||
      booking.ownerId ||
      booking.operatorId ||
      booking.hostId ||
      booking.partner?.id ||
      null;

    const referenceId = isTourBooking
      ? (booking.tourId || booking.referenceId || null)
      : (booking.hotelId || booking.referenceId || null);

    setChatSeed({
      type: isTourBooking ? 'P2P_TOUR' : 'P2P_HOTEL',
      partnerId,
      referenceId,
      bookingId: booking.bookingId || booking.id || null,
      title: isTourBooking
        ? (booking.tourTitle || 'Chu tour')
        : (booking.hotelName || 'Chu khach san'),
    });
  };

  const openCancelModal = (booking) => {
    setCancelModal({ isOpen: true, booking, reason: '', submitting: false });
  };

  const handleCancelBooking = async () => {
    const { booking, reason } = cancelModal;
    if (!booking?.bookingId) return;

    try {
      setCancelModal((prev) => ({ ...prev, submitting: true }));
      await bookingApi.cancelBooking(booking.bookingId, reason.trim());

      toast.success('Hủy booking thành công!');

      // Update local state
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === booking.bookingId
            ? { ...b, status: 'CANCELLED' }
            : b,
        ),
      );
      setCancelModal({ isOpen: false, booking: null, reason: '', submitting: false });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể hủy booking. Vui lòng thử lại.';
      toast.error(msg);
      setCancelModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const canModify = (booking) => {
    return booking.status === 'CONFIRMED' || booking.status === 'PENDING';
  };

  const handleModifyConfirm = async (form) => {
    const booking = modifyModal.booking;
    if (!booking?.bookingId) return;

    try {
      await bookingApi.updateBooking(booking.bookingId, {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: form.adults,
        children: form.children,
        rooms: form.rooms,
      });

      toast.success('Booking đã được cập nhật thành công!');
      // Refresh bookings
      const response = await bookingApi.getBookings();
      const data = Array.isArray(response?.data) ? response.data : [];
      setBookings(data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Không thể cập nhật booking.';
      throw new Error(msg);
    }
  };

  const openModifyModal = (booking) => {
    setModifyModal({ isOpen: true, booking });
  };

  const canCancel = (booking) => {
    return booking.status === 'PENDING' || booking.status === 'CONFIRMED';
  };

  if (loading) {
    return <main className={styles.statusPage}>Đang tải lịch sử booking...</main>;
  }

  if (error) {
    return (
      <main className={styles.statusPage}>
        <p>{error}</p>
        <button type="button" onClick={() => router.push('/')}>Quay lại trang chủ</button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>Lịch sử booking</h1>
        <p>Quản lý toàn bộ booking khách sạn và tour của bạn. Mỗi booking có QR để quét nhanh thông tin khi check-in hoặc đối chiếu.</p>

        <div className={styles.statGrid}>
          <article>
            <strong>{summary.total}</strong>
            <span>Tổng booking</span>
          </article>
          <article>
            <strong>{summary.pending}</strong>
            <span>Đang chờ xác nhận</span>
          </article>
          <article>
            <strong>{summary.confirmed}</strong>
            <span>Đã xác nhận</span>
          </article>
        </div>
      </section>

      {fromPayment && (
        <section className={styles.flowNotice}>
          <div className={styles.flowNoticeBadge}>Bước 3/3</div>
          <div>
            <h2>Đơn của bạn đã hoàn tất thanh toán</h2>
            <p>
              {paidBooking
                ? `Booking ${paidBooking.bookingCode} đã được ghi nhận vào lịch sử. Bạn có thể kiểm tra trạng thái hoặc quét QR ngay bên dưới.`
                : `Đã chuyển từ trang thanh toán ${paymentBookingType || 'BOOKING'}. Hệ thống đang đồng bộ dữ liệu lịch sử, vui lòng kéo xuống để kiểm tra.`}
            </p>
          </div>
        </section>
      )}

      {bookings.length === 0 ? (
        <section className={styles.emptyBox}>
          <h2>Bạn chưa có booking nào</h2>
          <p>Hãy bắt đầu đặt khách sạn hoặc tour để theo dõi lịch sử tại đây.</p>
          <button type="button" onClick={() => router.push('/hotels')}>Khám phá ngay</button>
        </section>
      ) : (
        <section className={styles.list}>
          {bookings.map((booking) => {
            const isTourBooking = booking.bookingType === 'TOUR' || (!!booking.tourId && !booking.hotelId);
            const qrData = encodeQrData(booking);
            const baseOrigin = typeof window !== 'undefined' ? window.location.origin : '';
            const detailUrl = qrData && baseOrigin ? `${baseOrigin}/booking-qr?d=${encodeURIComponent(qrData)}` : '';
            const qrUrl = detailUrl
              ? `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(detailUrl)}`
              : '';
            const statusKey = statusClass[booking.status] || 'pending';
            const bookingTypeLabel = isTourBooking ? 'TOUR' : 'HOTEL';
            const title = isTourBooking
              ? (booking.tourTitle || 'Tour chưa xác định')
              : (booking.hotelName || 'Khách sạn chưa xác định');

            return (
              <article className={styles.card} key={booking.bookingId || booking.bookingCode}>
                <div className={styles.cardMain}>
                  <div className={styles.cardHead}>
                    <div>
                      <h2>{title}</h2>
                      <p>Mã booking: <strong>{booking.bookingCode || '-'}</strong></p>
                    </div>
                    <div className={styles.badgeGroup}>
                      <span className={styles.typeBadge}>{bookingTypeLabel}</span>
                      <span className={`${styles.badge} ${styles[statusKey]}`}>
                        {statusLabel[booking.status] || booking.status || 'Không xác định'}
                      </span>
                    </div>
                  </div>

                  <div className={styles.metaGrid}>
                    <div>
                      {isTourBooking ? <FaMapMarkerAlt /> : <FaHotel />}
                      <span>
                        {isTourBooking
                          ? `Mã khởi hành: ${booking.departureId || '-'}`
                          : (booking.roomTypeName || 'Chưa có thông tin phòng')}
                      </span>
                    </div>
                    <div>
                      <FaCalendarAlt />
                      <span>
                        {isTourBooking
                          ? `Khởi hành: ${formatDate(booking.departureDate)}`
                          : `${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)} (${booking.nights || 0} đêm)`}
                      </span>
                    </div>
                    <div>
                      <FaUsers />
                      <span>
                        {isTourBooking
                          ? `${booking.adults || 0} người lớn, ${booking.children || 0} trẻ em`
                          : `${booking.adults || 0} người lớn, ${booking.children || 0} trẻ em, ${booking.rooms || 0} phòng`}
                      </span>
                    </div>
                    <div><strong>{formatMoney(booking.totalAmount)} {booking.currency || 'VND'}</strong></div>
                  </div>

                  <div className={styles.actionRow}>
                    <p className={styles.createdAt}>Đặt lúc: {formatDate(booking.createdAt)}</p>
                    <div className={styles.actionButtons}>
                      {canModify(booking) && (
                        <button
                          type="button"
                          className={styles.modifyBtn}
                          onClick={() => openModifyModal(booking)}
                        >
                          <FaEdit /> Sửa đổi
                        </button>
                      )}
                      {canCancel(booking) && (
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          onClick={() => openCancelModal(booking)}
                        >
                          <FaTimes /> Hủy booking
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.chatOwnerBtn}
                        onClick={() => openChatWithOwner(booking)}
                      >
                        Chat với Chủ
                      </button>
                    </div>
                  </div>
                </div>

                <div className={styles.qrBox}>
                  <div className={styles.qrTitle}><FaQrcode /> QR booking</div>
                  {qrUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrUrl} alt={`QR booking ${booking.bookingCode || ''}`} className={styles.qrImage} />
                      <small>Quét để mở trang thông tin booking</small>
                    </>
                  ) : (
                    <small>Không tạo được QR cho booking này</small>
                  )}
                </div>

                <div className={styles.shareRow}>
                  <ShareButtons
                    title={`Booking ${booking.bookingCode} — ${title}`}
                    description={`${isTourBooking ? 'Tour' : 'Khách sạn'} · ${formatMoney(booking.totalAmount)} ${booking.currency || 'VND'}`}
                    size="sm"
                  />
                </div>
              </article>
            );
          })}
        </section>
      )}

      <ClientChatModal
        isOpen={!!chatSeed}
        onClose={() => setChatSeed(null)}
        conversationSeed={chatSeed}
      />

      {/* Modify Booking Modal */}
      {modifyModal.isOpen && modifyModal.booking && (
        <ModifyBookingModal
          booking={modifyModal.booking}
          onClose={() => setModifyModal({ isOpen: false, booking: null })}
          onConfirm={handleModifyConfirm}
        />
      )}

      {/* Cancel Booking Modal */}
      {cancelModal.isOpen && (
        <div className={styles.modalOverlay} onClick={() => setCancelModal({ isOpen: false, booking: null, reason: '', submitting: false })}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Xác nhận hủy booking</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setCancelModal({ isOpen: false, booking: null, reason: '', submitting: false })}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.modalText}>
                Bạn có chắc muốn hủy booking{' '}
                <strong>{cancelModal.booking?.bookingCode}</strong> không?
              </p>
              <p className={styles.modalWarning}>
                {cancelModal.booking?.status === 'PENDING'
                  ? 'Booking này chưa thanh toán, việc hủy sẽ không ảnh hưởng đến tài khoản của bạn.'
                  : 'Booking đã thanh toán. Nếu đã thanh toán, bạn sẽ cần liên hệ hỗ trợ để được hoàn tiền.'}
              </p>
              <label className={styles.cancelReasonLabel}>
                Lý do hủy (không bắt buộc):
                <textarea
                  className={styles.cancelReasonInput}
                  rows={3}
                  placeholder="Nhập lý do hủy booking (nếu có)..."
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                />
              </label>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtnConfirm}
                onClick={handleCancelBooking}
                disabled={cancelModal.submitting}
              >
                {cancelModal.submitting ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
              <button
                type="button"
                className={styles.cancelBtnBack}
                onClick={() => setCancelModal({ isOpen: false, booking: null, reason: '', submitting: false })}
              >
                Không hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ProfileBookingsPage() {
  return (
    <Suspense fallback={<main className={styles.statusPage}>Dang tai lich su booking...</main>}>
      <ProfileBookingsContent />
    </Suspense>
  );
}

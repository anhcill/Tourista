'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCalendarAlt, FaHotel, FaMapMarkerAlt, FaQrcode, FaUsers } from 'react-icons/fa';
import bookingApi from '@/api/bookingApi';
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

export default function ProfileBookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            const detailUrl = qrData ? `${window.location.origin}/booking-qr?d=${encodeURIComponent(qrData)}` : '';
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

                  <p className={styles.createdAt}>Đặt lúc: {formatDate(booking.createdAt)}</p>
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
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

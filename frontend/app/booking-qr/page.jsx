'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaArrowLeft, FaCheckCircle, FaHotel, FaQrcode } from 'react-icons/fa';
import styles from './page.module.css';

const decodeQrData = (raw) => {
  if (!raw) return null;

  try {
    const decoded = decodeURIComponent(escape(atob(raw)));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

function BookingQrInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const data = useMemo(() => decodeQrData(searchParams.get('d')), [searchParams]);

  if (!data) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>QR không hợp lệ</h1>
          <p>Không thể đọc dữ liệu booking từ mã QR này.</p>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push('/profile/bookings')}>
            Quay lại lịch sử booking
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.head}>
          <FaCheckCircle className={styles.okIcon} />
          <h1>Thông tin đặt phòng</h1>
          <p>Được mở từ mã QR booking của Tourista Studio.</p>
        </div>

        <div className={styles.codeBox}>
          <FaQrcode />
          <strong>{data.bookingCode || '-'}</strong>
        </div>

        <div className={styles.grid}>
          <div className={styles.item}>
            <span>Khách sạn</span>
            <strong><FaHotel /> {data.hotelName || '-'}</strong>
          </div>
          <div className={styles.item}>
            <span>Loại phòng</span>
            <strong>{data.roomTypeName || '-'}</strong>
          </div>
          <div className={styles.item}>
            <span>Nhận phòng</span>
            <strong>{data.checkIn || '-'}</strong>
          </div>
          <div className={styles.item}>
            <span>Trả phòng</span>
            <strong>{data.checkOut || '-'}</strong>
          </div>
          <div className={styles.item}>
            <span>Số đêm / Số phòng</span>
            <strong>{data.nights || 0} đêm / {data.rooms || 0} phòng</strong>
          </div>
          <div className={styles.item}>
            <span>Khách</span>
            <strong>{data.adults || 0} người lớn, {data.children || 0} trẻ em</strong>
          </div>
          <div className={styles.item}>
            <span>Tổng tiền</span>
            <strong>{data.totalAmount || '-'}</strong>
          </div>
          <div className={styles.item}>
            <span>Trạng thái</span>
            <strong>{data.status || '-'}</strong>
          </div>
        </div>

        <p className={styles.createdAt}>Ngày tạo booking: {data.createdAt || '-'}</p>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.push('/hotels')}>
            Tìm khách sạn
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push('/profile/bookings')}>
            <FaArrowLeft /> Quay lại lịch sử booking
          </button>
        </div>
      </section>
    </main>
  );
}

export default function BookingQrPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}>Đang tải dữ liệu QR...</section></main>}>
      <BookingQrInner />
    </Suspense>
  );
}

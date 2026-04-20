'use client';

import { Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaUniversity, FaWallet, FaCreditCard, FaMobileAlt } from 'react-icons/fa';
import ShareButtons from '@/components/Common/ShareButtons/ShareButtons';
import styles from './page.module.css';

const formatVnd = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

const METHOD_META = {
  card_domestic: {
    title: 'Thẻ nội địa / ATM',
    icon: <FaCreditCard />,
    note: 'Giao dịch đã được xác nhận qua kênh thẻ nội địa.',
  },
  momo: {
    title: 'Ví MoMo',
    icon: <FaWallet />,
    note: 'Thanh toán ví điện tử thành công.',
  },
  zalopay: {
    title: 'ZaloPay',
    icon: <FaMobileAlt />,
    note: 'Giao dịch ZaloPay đã được ghi nhận.',
  },
  bank_transfer: {
    title: 'Chuyển khoản ngân hàng',
    icon: <FaUniversity />,
    note: 'Đã tạo lệnh thanh toán và ghi nhận chuyển khoản thành công.',
  },
  vnpay: {
    title: 'VNPay',
    icon: <FaCreditCard />,
    note: 'Thanh toán qua cổng VNPay thành công.',
  },
};

function PaymentSuccessInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const data = useMemo(() => {
    const method = searchParams.get('method') || 'card_domestic';
    const bookingCode = searchParams.get('bookingCode') || '-';
    const amount = Number(searchParams.get('amount') || 0);
    const status = searchParams.get('status') || 'success';
    const message = searchParams.get('message') || '';
    const transactionNo = searchParams.get('transactionNo') || '';
    const bookingType = (searchParams.get('bookingType') || 'HOTEL').toUpperCase();
    const tourId = searchParams.get('tourId') || '';

    const meta = METHOD_META[method] || METHOD_META.card_domestic;

    return {
      method,
      bookingCode,
      amount,
      status,
      message,
      transactionNo,
      bookingType,
      tourId,
      meta,
    };
  }, [searchParams]);

  const continueLabel = data.bookingType === 'TOUR' ? 'Tiếp tục đặt tour' : 'Tiếp tục đặt phòng';
  const continueRoute = data.bookingType === 'TOUR' && data.tourId
    ? `/tours/${data.tourId}`
    : '/hotels';
  const historyRoute = `/profile/bookings?from=payment&bookingCode=${encodeURIComponent(data.bookingCode)}&bookingType=${encodeURIComponent(data.bookingType)}`;
  const stepOneLabel = data.bookingType === 'TOUR' ? 'Chọn tour' : 'Chọn phòng';

  const statusTitle = data.status === 'success' ? 'Thanh toán thành công' : 'Thanh toán đang xử lý';
  const statusDesc = data.message || data.meta.note;

  return (
    <main className={styles.page}>
      <div className={styles.progressBar}>
        <div className={styles.progressInner}>
          <div className={styles.progressStep}>
            <div className={`${styles.progressStepCircle} ${styles.progressStepCircleDone}`}>✓</div>
            <span className={styles.progressStepLabel}>{stepOneLabel}</span>
          </div>
          <div className={`${styles.progressLine} ${styles.progressLineDone}`} />
          <div className={styles.progressStep}>
            <div className={`${styles.progressStepCircle} ${styles.progressStepCircleDone}`}>✓</div>
            <span className={styles.progressStepLabel}>Xác nhận & Thanh toán</span>
          </div>
          <div className={`${styles.progressLine} ${styles.progressLineDone}`} />
          <div className={styles.progressStep}>
            <div className={`${styles.progressStepCircle} ${styles.progressStepCircleActive}`}>3</div>
            <span className={`${styles.progressStepLabel} ${styles.progressStepLabelActive}`}>Hoàn thành</span>
          </div>
        </div>
      </div>

      <section className={styles.card}>
        <div className={styles.head}>
          <FaCheckCircle className={styles.successIcon} />
          <h1>{statusTitle}</h1>
          <p>{statusDesc}</p>
        </div>

        <div className={styles.methodBox}>
          <span className={styles.methodIcon}>{data.meta.icon}</span>
          <div>
            <strong>Phương thức: {data.meta.title}</strong>
            <p>Mã booking: {data.bookingCode}</p>
          </div>
        </div>

        <div className={styles.detailGrid}>
          <div className={styles.detailItem}>
            <span>Tổng tiền đã xử lý</span>
            <strong>{formatVnd(data.amount)} VND</strong>
          </div>
          <div className={styles.detailItem}>
            <span>Trạng thái</span>
            <strong>{data.status === 'success' ? 'Thành công' : 'Đang xử lý'}</strong>
          </div>
          <div className={styles.detailItem}>
            <span>Mã giao dịch</span>
            <strong>{data.transactionNo || 'Đang cập nhật'}</strong>
          </div>
          <div className={styles.detailItem}>
            <span>Thời điểm ghi nhận</span>
            <strong>{new Date().toLocaleString('vi-VN')}</strong>
          </div>
        </div>

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.push(continueRoute)}>
            {continueLabel}
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push(historyRoute)}>
            Xem lịch sử booking
          </button>
        </div>

        <div className={styles.shareSection}>
          <ShareButtons
            title={`Đặt ${data.bookingType === 'TOUR' ? 'tour' : 'phòng'} ${data.bookingCode} thành công trên Tourista`}
            description={`${formatVnd(data.amount)} VND — ${data.meta.title}`}
            size="sm"
          />
        </div>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}>Đang tải kết quả thanh toán...</section></main>}>
      <PaymentSuccessInner />
    </Suspense>
  );
}

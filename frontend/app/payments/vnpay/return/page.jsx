'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';
import bookingApi from '@/api/bookingApi';
import styles from './page.module.css';

const formatVnd = (value) => new Intl.NumberFormat('vi-VN').format(Number(value || 0));

function VnpayReturnInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const callbackParams = useMemo(() => {
    const params = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }, [searchParams]);

  useEffect(() => {
    const verifyReturn = async () => {
      try {
        setLoading(true);
        setError('');

        const hasVnpayParams = Object.keys(callbackParams).some((key) => key.startsWith('vnp_'));
        if (!hasVnpayParams) {
          setError('Không nhận được dữ liệu phản hồi từ cổng thanh toán VNPay.');
          return;
        }

        const response = await bookingApi.verifyVnpayReturn(callbackParams);
        const data = response?.data || null;
        setResult(data);

        if (data) {
          const params = new URLSearchParams({
            method: 'vnpay',
            bookingCode: data.bookingCode || '',
            amount: String(data.amount || 0),
            status: data.success ? 'success' : 'pending',
            message: data.message || '',
            transactionNo: data.transactionNo || '',
          });

          router.replace(`/payments/success?${params.toString()}`);
        }
      } catch (err) {
        setError(err?.message || 'Không thể xác minh kết quả thanh toán.');
      } finally {
        setLoading(false);
      }
    };

    verifyReturn();
  }, [callbackParams, router]);

  const isSuccess = Boolean(result?.success);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        {loading && (
          <div className={styles.stateWrap}>
            <FaSpinner className={styles.spinIcon} />
            <h1>Đang xác minh và chuyển trang</h1>
            <p>Hệ thống đang kiểm tra phản hồi từ VNPay rồi chuyển sang trang kết quả chung.</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateWrap}>
            <FaTimesCircle className={styles.errorIcon} />
            <h1>Xác minh không thành công</h1>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && result && (
          <>
            <div className={styles.stateWrap}>
              {isSuccess ? <FaCheckCircle className={styles.successIcon} /> : <FaTimesCircle className={styles.errorIcon} />}
              <h1>{isSuccess ? 'Thanh toán thành công' : 'Thanh toán chưa thành công'}</h1>
              <p>{result?.message || 'Vui lòng kiểm tra lại giao dịch của bạn.'}</p>
            </div>

            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span>Mã booking</span>
                <strong>{result?.bookingCode || '-'}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Trạng thái booking</span>
                <strong>{result?.bookingStatus || '-'}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Mã phản hồi VNPay</span>
                <strong>{result?.responseCode || '-'}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Mã giao dịch VNPay</span>
                <strong>{result?.transactionNo || '-'}</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Số tiền</span>
                <strong>{formatVnd(result?.amount || 0)} VND</strong>
              </div>
              <div className={styles.detailItem}>
                <span>Chữ ký callback</span>
                <strong>{result?.validSignature ? 'Hợp lệ' : 'Không hợp lệ'}</strong>
              </div>
            </div>
          </>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.secondaryBtn} onClick={() => router.push('/hotels')}>
            Tiếp tục tìm khách sạn
          </button>
          <button type="button" className={styles.primaryBtn} onClick={() => router.push('/profile/bookings')}>
            Xem lịch sử đặt phòng
          </button>
        </div>
      </section>
    </main>
  );
}

export default function VnpayReturnPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}>Đang tải callback VNPay...</section></main>}>
      <VnpayReturnInner />
    </Suspense>
  );
}

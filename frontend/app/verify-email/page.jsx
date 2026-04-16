'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import authApi from '@/api/authApi';
import styles from './page.module.css';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Dang xac thuc email cua ban...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Lien ket xac thuc khong hop le hoac bi thieu token.');
        return;
      }

      try {
        const response = await authApi.verifyEmail(token);
        const serverMessage = response?.message || response?.data?.message;
        setStatus('success');
        setMessage(serverMessage || 'Xac thuc email thanh cong. Ban co the dang nhap ngay bay gio.');
      } catch (verifyError) {
        setStatus('error');
        setMessage(verifyError?.message || 'Khong the xac thuc email. Lien ket co the da het han.');
      }
    };

    run();
  }, [token]);

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Xac minh tai khoan</p>
        <h1 className={styles.title}>Xac thuc email</h1>

        <p className={status === 'error' ? styles.errorText : styles.infoText}>{message}</p>

        <div className={styles.actions}>
          <Link href="/login" className={styles.linkButton}>
            Dang nhap
          </Link>
          <Link href="/register" className={styles.secondaryLink}>
            Tao tai khoan moi
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className={styles.page}><section className={styles.card}>Dang tai...</section></main>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
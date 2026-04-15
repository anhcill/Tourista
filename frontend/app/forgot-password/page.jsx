'use client';

import { useState } from 'react';
import Link from 'next/link';
import authApi from '@/api/authApi';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    const safeEmail = email.trim();
    if (!safeEmail) {
      setError('Vui long nhap email da dang ky.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword(safeEmail);
      setIsSuccess(true);
    } catch (submitError) {
      setError(submitError?.message || 'Khong the gui yeu cau luc nay. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Khoi phuc tai khoan</p>
        <h1 className={styles.title}>Quen mat khau</h1>
        <p className={styles.description}>
          Nhap email cua ban. Neu tai khoan ton tai, he thong se gui huong dan dat lai mat khau.
        </p>

        {isSuccess ? (
          <div className={styles.successBox}>
            <p>Yeu cau da duoc gui. Vui long kiem tra email de tiep tuc dat lai mat khau.</p>
            <Link href="/login" className={styles.linkButton}>
              Quay lai dang nhap
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <label htmlFor="email" className={styles.label}>
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className={styles.input}
            />

            {error ? <p className={styles.error}>{error}</p> : null}

            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? 'Dang gui...' : 'Gui yeu cau'}
            </button>

            <Link href="/login" className={styles.textLink}>
              Nho mat khau? Dang nhap ngay
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
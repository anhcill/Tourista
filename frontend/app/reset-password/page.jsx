'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import authApi from '@/api/authApi';
import styles from './page.module.css';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => (searchParams.get('token') || '').trim(), [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!token) return 'Lien ket dat lai mat khau khong hop le hoac da het han.';
    if (password.length < 8) return 'Mat khau moi phai co it nhat 8 ky tu.';
    if (password !== confirmPassword) return 'Mat khau xac nhan khong khop.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await authApi.resetPassword(token, password);
      setIsSuccess(true);
    } catch (submitError) {
      setError(submitError?.message || 'Khong the dat lai mat khau. Vui long thu lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Bao mat tai khoan</p>
        <h1 className={styles.title}>Dat lai mat khau</h1>

        {!token ? (
          <div className={styles.errorBox}>
            <p>Lien ket khong hop le. Vui long tao lai yeu cau quen mat khau.</p>
            <Link href="/forgot-password" className={styles.linkButton}>
              Tao yeu cau moi
            </Link>
          </div>
        ) : isSuccess ? (
          <div className={styles.successBox}>
            <p>Ban da dat lai mat khau thanh cong. Hay dang nhap lai de tiep tuc.</p>
            <Link href="/login" className={styles.linkButton}>
              Dang nhap
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <label htmlFor="password" className={styles.label}>
              Mat khau moi
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={styles.input}
            />

            <label htmlFor="confirmPassword" className={styles.label}>
              Xac nhan mat khau
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={styles.input}
            />

            {error ? <p className={styles.error}>{error}</p> : null}

            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? 'Dang cap nhat...' : 'Cap nhat mat khau'}
            </button>

            <Link href="/login" className={styles.textLink}>
              Quay lai dang nhap
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}
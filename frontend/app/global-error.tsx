'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './fallback.module.css';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global error boundary triggered:', error);
  }, [error]);

  return (
    <html lang="vi">
      <body>
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <span className={styles.code}>FATAL</span>
            <h1 className={styles.title}>He thong dang duoc khoi phuc</h1>
            <p className={styles.description}>
              Ung dung gap loi nghiem trong ngoai du kien. Vui long thu lai sau it phut hoac quay
              ve trang chu.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={reset} className={styles.primaryBtn}>
                Khoi dong lai trang
              </button>
              <Link href="/" className={styles.secondaryBtn}>
                Ve trang chu
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import styles from './fallback.module.css';

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Unhandled route error:', error);
  }, [error]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <span className={styles.code}>500</span>
        <h1 className={styles.title}>Da co loi xay ra</h1>
        <p className={styles.description}>
          He thong vua gap su co tam thoi. Ban co the thu tai lai trang hoac quay lai trang chu de
          tiep tuc.
        </p>
        <div className={styles.actions}>
          <button type="button" onClick={reset} className={styles.primaryBtn}>
            Thu lai
          </button>
          <Link href="/" className={styles.secondaryBtn}>
            Ve trang chu
          </Link>
        </div>
      </div>
    </div>
  );
}

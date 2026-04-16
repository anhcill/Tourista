import Link from 'next/link';
import styles from './fallback.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>Khong tim thay trang</h1>
        <p className={styles.description}>
          Duong dan ban truy cap khong ton tai hoac da duoc thay doi. Ban co the quay ve trang chu
          de tiep tuc kham pha tour va khach san.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.primaryBtn}>
            Ve trang chu
          </Link>
          <Link href="/tours" className={styles.secondaryBtn}>
            Xem danh sach tour
          </Link>
        </div>
      </div>
    </div>
  );
}

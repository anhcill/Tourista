import type { Metadata } from 'next';
import Link from 'next/link';
import PartnerRouteGuard from '@/components/Partner/Auth/PartnerRouteGuard';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Partner Dashboard | Tourista Studio',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PartnerRouteGuard>
      <div className={styles.shell}>
        <aside className={styles.sidebar}>
          <div className={styles.brandBlock}>
            <h2>Tourista Studio</h2>
            <p>Partner Dashboard</p>
          </div>

          <nav className={styles.nav}>
            <a href="/partner" className={styles.navItem}>
              🏨 Khách sạn của tôi
            </a>
            <a href="/partner/tours" className={styles.navItem}>
              🚌 Tour của tôi
            </a>
            <a href="/partner/bookings" className={styles.navItem}>
              📋 Đơn đặt
            </a>
            <a href="/partner/reviews" className={styles.navItem}>
              ⭐ Review
            </a>
            <Link href="/partner/messages" className={styles.navItem}>
              💬 Tin nhắn
            </Link>
          </nav>

          <div className={styles.footerBlock}>
            <Link href="/" className={styles.backLink}>
              ← Về trang chủ
            </Link>
          </div>
        </aside>

        <div className={styles.mainColumn}>
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </PartnerRouteGuard>
  );
}

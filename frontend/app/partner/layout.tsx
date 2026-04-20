import type { Metadata } from 'next';
import PartnerRouteGuard from '@/components/Partner/Auth/PartnerRouteGuard';
import styles from './layout.module.css';

export const metadata: Metadata = {
  title: 'Partner Dashboard',
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
            <h2>Tourista</h2>
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
            <a href="/partner/messages" className={styles.navItem}>
              💬 Tin nhắn
            </a>
          </nav>

          <div className={styles.footerBlock}>
            <a href="/" className={styles.backLink}>
              ← Về trang chủ
            </a>
          </div>
        </aside>

        <div className={styles.mainColumn}>
          <main className={styles.content}>{children}</main>
        </div>
      </div>
    </PartnerRouteGuard>
  );
}

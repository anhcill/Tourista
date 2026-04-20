'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FaChartBar,
  FaUsers,
  FaHotel,
  FaPlaneDeparture,
  FaReceipt,
  FaTags,
  FaCog,
  FaStar,
  FaArrowLeft,
} from 'react-icons/fa';
import styles from './AdminSidebar.module.css';

const MENU_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: <FaChartBar /> },
  { label: 'Quan ly User', href: '/admin/users', icon: <FaUsers /> },
  { label: 'Quan ly Hotel', href: '/admin/hotels', icon: <FaHotel /> },
  { label: 'Quan ly Tour', href: '/admin/tours', icon: <FaPlaneDeparture /> },
  { label: 'Quan ly Dat cho', href: '/admin/bookings', icon: <FaReceipt /> },
  { label: 'Review Moderation', href: '/admin/reviews', icon: <FaStar /> },
  { label: 'Khuyen mai', href: '/admin/promotions', icon: <FaTags /> },
  { label: 'Cai dat', href: '/admin/settings', icon: <FaCog /> },
];

const isActiveItem = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);

export default function AdminSidebar() {
  const pathname = usePathname() || '';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <h2>Tourista Studio Admin</h2>
        <p>Quan tri he thong</p>
      </div>

      <nav className={styles.nav}>
        {MENU_ITEMS.map((item) => {
          const active = isActiveItem(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footerBlock}>
        <Link href="/" className={styles.backLink}>
          <FaArrowLeft />
          <span>Ve trang nguoi dung</span>
        </Link>
      </div>
    </aside>
  );
}

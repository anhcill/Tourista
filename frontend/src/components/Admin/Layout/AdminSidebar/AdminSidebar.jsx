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
  FaComments,
  FaFlag,
  FaLayerGroup,
} from 'react-icons/fa';
import styles from './AdminSidebar.module.css';

const MENU_ITEMS = [
  { label: 'Tổng quan', href: '/admin', icon: <FaChartBar /> },
  { label: 'Người dùng', href: '/admin/users', icon: <FaUsers /> },
  { label: 'Khách sạn', href: '/admin/hotels', icon: <FaHotel /> },
  { label: 'Chuyến đi', href: '/admin/tours', icon: <FaPlaneDeparture /> },
  { label: 'Đơn đặt chỗ', href: '/admin/bookings', icon: <FaReceipt /> },
  { label: 'Tin nhắn', href: '/admin/messages', icon: <FaComments /> },
  { label: 'Báo cáo', href: '/admin/reports', icon: <FaFlag /> },
  { label: 'Đánh giá', href: '/admin/reviews', icon: <FaStar /> },
  { label: 'Khuyến mãi', href: '/admin/promotions', icon: <FaTags /> },
  { label: 'Combo', href: '/admin/combos', icon: <FaLayerGroup /> },
  { label: 'Cài đặt Hệ thống', href: '/admin/settings', icon: <FaCog /> },
];

const isActiveItem = (pathname, href) => pathname === href || pathname.startsWith(`${href}/`);

export default function AdminSidebar() {
  const pathname = usePathname() || '';

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brandBlock}>
        <h2>Tourista Studio - Quản trị</h2>
        <p>Quản trị hệ thống</p>
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
          <span>Quay về trang người dùng</span>
        </Link>
      </div>
    </aside>
  );
}

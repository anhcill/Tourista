'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaBell, FaSearch } from 'react-icons/fa';
import styles from './AdminTopbar.module.css';

const TITLE_MAP = {
  admin: 'Tổng quan',
  users: 'Quản lý Người dùng',
  hotels: 'Quản lý Khách sạn',
  tours: 'Quản lý Chuyến đi',
  bookings: 'Quản lý Đơn đặt chỗ',
  promotions: 'Quản lý Khuyến mãi',
  reviews: 'Kiểm duyệt Đánh giá',
  settings: 'Cài đặt Hệ thống',
};

const getBreadcrumb = (pathname) => {
  const segments = (pathname || '').split('/').filter(Boolean);
  if (!segments.length) return ['Admin'];

  return segments.map((segment, index) => {
    if (segment === 'admin' && index === 0) return 'Admin';
    return TITLE_MAP[segment] || segment;
  });
};

export default function AdminTopbar() {
  const pathname = usePathname() || '/admin';
  const { user } = useSelector((state) => state.auth);

  const breadcrumb = useMemo(() => getBreadcrumb(pathname), [pathname]);
  const currentTitle = breadcrumb[breadcrumb.length - 1] || 'Admin';

  return (
    <header className={styles.topbar}>
      <div className={styles.leftBlock}>
        <p className={styles.breadcrumb}>{breadcrumb.join(' / ')}</p>
        <h1>{currentTitle}</h1>
      </div>

      <div className={styles.rightBlock}>
        <label className={styles.searchBox}>
          <FaSearch />
          <input type="text" placeholder="Tìm kiếm nhanh..." disabled />
        </label>

        <button type="button" className={styles.notifyBtn} aria-label="Thông báo">
          <FaBell />
        </button>

        <div className={styles.userMeta}>
          <strong>{user?.fullName || user?.email || 'Admin'}</strong>
          <span>{user?.email || 'admin@tourista.local'}</span>
        </div>
      </div>
    </header>
  );
}

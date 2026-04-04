'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { FaBell, FaSearch } from 'react-icons/fa';
import styles from './AdminTopbar.module.css';

const TITLE_MAP = {
  admin: 'Dashboard',
  users: 'Quan ly User',
  hotels: 'Quan ly Hotel',
  tours: 'Quan ly Tour',
  bookings: 'Quan ly Dat cho',
  promotions: 'Quan ly Khuyen mai',
  settings: 'Cai dat he thong',
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
          <input type="text" placeholder="Tim kiem nhanh..." disabled />
        </label>

        <button type="button" className={styles.notifyBtn} aria-label="Thong bao">
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

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
  combos: 'Quản lý Combo',
  reviews: 'Kiểm duyệt Đánh giá',
  settings: 'Cài đặt Hệ thống',
  // Sub-pages
  create: 'Tạo mới',
  edit: 'Chỉnh sửa',
  import: 'Import CSV',
  map: 'Bản đồ',
};

/**
 * Build breadcrumb labels from pathname.
 * Handles: /admin/hotels, /admin/hotels/create, /admin/hotels/123/edit, /admin/hotels/map
 * Also handles: /admin/tours/create, /admin/tours/123/edit
 */
const getBreadcrumb = (pathname) => {
  const segments = (pathname || '').split('/').filter(Boolean);
  if (!segments.length) return ['Admin'];

  return segments.map((segment, index) => {
    if (segment === 'admin' && index === 0) return 'Admin';

    // Check TITLE_MAP first
    const mapped = TITLE_MAP[segment];
    if (mapped) return mapped;

    // Check if it's a known sub-page keyword
    if (segment === 'create') return 'Tạo mới';
    if (segment === 'edit') return 'Chỉnh sửa';
    if (segment === 'import') return 'Import CSV';
    if (segment === 'map') return 'Bản đồ';

    // For numeric IDs in /admin/{entity}/[id]/edit routes,
    // return entity name from parent segment
    if (/^\d+$/.test(segment)) {
      // Find parent segment to determine entity type
      if (index > 1) {
        const parent = segments[index - 1];
        if (parent === 'hotels') return 'Chi tiết Khách sạn';
        if (parent === 'tours') return 'Chi tiết Tour';
        if (parent === 'users') return 'Chi tiết Người dùng';
      }
      return 'Chi tiết';
    }

    // Unknown segment - capitalize first letter
    return segment.charAt(0).toUpperCase() + segment.slice(1);
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

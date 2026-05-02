'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector, TypedUseSelectorHook } from 'react-redux';
import { clearAuthTokens } from '@/utils/authStorage';
import { STORAGE_KEYS } from '@/utils/constants';
import styles from './PartnerShell.module.css';

type RootState = {
  auth: {
    user: {
      fullName?: string;
      name?: string;
      email?: string;
      role?: string;
      roles?: unknown[];
      authorities?: unknown[];
    } | null;
    token: string | null;
    isAuthenticated: boolean;
  };
};

const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const PARTNER_ROLE_SET = new Set(['ROLE_PARTNER', 'PARTNER', 'ROLE_HOST', 'HOST', 'ROLE_ADMIN', 'ADMIN']);

const NAV_ITEMS = [
  { href: '/partner', label: 'Tổng quan', icon: '📊' },
  { href: '/partner/hotels', label: 'Khách sạn của tôi', icon: '🏨' },
  { href: '/partner/tours', label: 'Tour của tôi', icon: '🚌' },
  { href: '/partner/bookings', label: 'Đơn đặt', icon: '📋' },
  { href: '/partner/reviews', label: 'Review', icon: '⭐' },
  { href: '/partner/messages', label: 'Tin nhắn', icon: '💬' },
];

type UserType = {
  fullName?: string;
  name?: string;
  email?: string;
  role?: string;
  roles?: unknown[];
  authorities?: unknown[];
};

function getInitials(name?: string) {
  if (!name) return 'P';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
}

function getAvatarBg(name?: string) {
  if (!name) return '#0f7fb6';
  const colors = ['#0f7fb6', '#00a8a8', '#7c3aed', '#db2777', '#d97706', '#059669'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function collectRoles(user: UserType | null) {
  if (!user) return [];
  const values: string[] = [];
  if (typeof user.role === 'string') values.push(user.role);
  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => {
      if (typeof r === 'string') values.push(r);
      else if (r && typeof r === 'object') {
        const obj = r as Record<string, unknown>;
        if (typeof obj.name === 'string') values.push(obj.name);
        if (typeof obj.role === 'string') values.push(obj.role);
        if (typeof obj.authority === 'string') values.push(obj.authority);
      }
    });
  }
  if (Array.isArray(user.authorities)) {
    user.authorities.forEach((a) => {
      if (typeof a === 'string') values.push(a);
      else if (a && typeof a === 'object') {
        const obj = a as Record<string, unknown>;
        if (typeof obj.authority === 'string') values.push(obj.authority);
      }
    });
  }
  return values.map((v) => String(v || '').trim().toUpperCase()).filter(Boolean);
}

function collectRolesFromToken(token: string | null) {
  if (!token || typeof token !== 'string') return [];
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return [];
    const payload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
    const roles: string[] = [];
    if (typeof payload.role === 'string') roles.push(payload.role);
    if (Array.isArray(payload.roles)) payload.roles.forEach((v: unknown) => typeof v === 'string' && roles.push(v));
    if (Array.isArray(payload.authorities)) payload.authorities.forEach((v: unknown) => typeof v === 'string' && roles.push(v));
    return roles.map((v) => String(v || '').trim().toUpperCase()).filter(Boolean);
  } catch {
    return [];
  }
}

function hasPartnerRole(user: UserType | null, token: string | null) {
  const roles = [...collectRoles(user), ...collectRolesFromToken(token)];
  return roles.some((r) => PARTNER_ROLE_SET.has(r));
}

export default function PartnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isAuthenticated } = useAppSelector((state) => state.auth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/partner');
      return;
    }
    if (!hasPartnerRole(user, token)) {
      router.replace('/?error=not_partner');
    }
  }, [mounted, isAuthenticated, user, token, router]);

  const displayName = user?.fullName || user?.name || user?.email || 'Partner';
  const avatarBg = useMemo(() => getAvatarBg(displayName), [displayName]);
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  const isActive = (href) => {
    if (href === '/partner') return pathname === '/partner';
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    clearAuthTokens();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.USER);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
  };

  if (!mounted || !isAuthenticated || !hasPartnerRole(user, token)) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', gap: 16, color: '#475569',
      }}>
        <div style={{
          width: 36, height: 36, border: '3px solid #e2e8f0',
          borderTopColor: '#0284c7', borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <p>Đang kiểm tra quyền truy cập...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        {/* Brand */}
        <div className={styles.brandBlock}>
          <Link href="/" className={styles.brandLink}>
            <div className={styles.brandLogo}>TS</div>
            <div className={styles.brandText}>
              <h2>Tourista Studio</h2>
              <p>Partner Dashboard</p>
            </div>
          </Link>
        </div>

        {/* User info */}
        <div className={styles.userBlock}>
          <div className={styles.userAvatar} style={{ background: avatarBg }}>
            {initials}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userRole}>{user?.role || 'Partner'}</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive(item.href) ? styles.navItemActive : ''}`}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footerBlock}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navLabel}>Đăng xuất</span>
          </button>
          <Link href="/" className={styles.backLink}>
            <span className={styles.navIcon}>🏠</span>
            <span className={styles.navLabel}>Về trang chủ</span>
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.mainColumn}>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}

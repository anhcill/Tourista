'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileBottomNav.module.css';

const NAV_ITEMS = [
  {
    href: '/',
    label: 'Trang chủ',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    ),
  },
  {
    href: '/tours',
    label: 'Tours',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
        <path d="M2 12h20"/>
      </svg>
    ),
  },
  {
    href: '/hotels',
    label: 'Khách sạn',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 22V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v15"/>
        <path d="M3 12h18"/>
        <path d="M6 22V11"/>
        <path d="M18 22V11"/>
        <rect x="6" y="7" width="4" height="5" rx="1"/>
        <rect x="14" y="7" width="4" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/articles',
    label: 'Tin tức',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
        <path d="M18 14h-8"/>
        <path d="M15 18h-5"/>
        <path d="M10 6h8v4h-8V6Z"/>
      </svg>
    ),
  },
  {
    href: '/ai-travel-planner',
    label: 'AI Plan',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
        <path d="M12 2a10 10 0 0 1 10 10"/>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return (pathname || '').startsWith(href);
  };

  return (
    <nav className={styles.bottomNav} aria-label="Điều hướng di động">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${isActive(item.href) ? styles.active : ''}`}
          aria-current={isActive(item.href) ? 'page' : undefined}
        >
          <span className={styles.icon}>{item.icon}</span>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

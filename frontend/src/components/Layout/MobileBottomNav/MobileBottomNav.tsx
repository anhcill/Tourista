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
        href: '/combos',
        label: 'Combo',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 7h-3a2 2 0 0 1-2-2V2"/>
                <path d="M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2H9Z"/>
                <path d="M3 7v12a2 2 0 0 0 2 2h5"/>
                <path d="m15 15 2 2 4-4"/>
            </svg>
        ),
    },
    {
        href: '/promotions',
        label: 'Khuyến mãi',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
                <path d="M7 7h.01"/>
                <path d="m9 15 2 2 4-4"/>
            </svg>
        ),
    },
    {
        href: '/ai-travel-planner',
        label: 'AI Plan',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10H12V2z"/>
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 8v4l3 3"/>
            </svg>
        ),
    },
    {
        href: '/articles',
        label: 'Cẩm nang',
        icon: (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <path d="M8 7h8"/>
                <path d="M8 11h6"/>
            </svg>
        ),
    },
];

export default function MobileBottomNav() {
    const pathname = usePathname();

    const isActive = (href) => {
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

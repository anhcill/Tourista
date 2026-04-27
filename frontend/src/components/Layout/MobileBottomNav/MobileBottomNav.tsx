'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './MobileBottomNav.module.css';

const BusIcon = () => (
    <svg width="22" height="22" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="18" width="52" height="28" rx="8" fill="currentColor" opacity="0.9"/>
        <rect x="10" y="22" width="16" height="12" rx="4" fill="rgba(255,255,255,0.5)"/>
        <rect x="30" y="22" width="12" height="12" rx="3" fill="rgba(255,255,255,0.35)"/>
        <rect x="44" y="22" width="10" height="18" rx="3" fill="rgba(255,255,255,0.3)"/>
        <circle cx="20" cy="50" r="6" fill="#2D3748"/>
        <circle cx="44" cy="50" r="6" fill="#2D3748"/>
        <rect x="6" y="34" width="4" height="6" rx="2" fill="#FFD700" opacity="0.9"/>
        <rect x="54" y="34" width="4" height="6" rx="2" fill="#FF4444" opacity="0.8"/>
    </svg>
);

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
        href: '/bus',
        label: 'Vé xe',
        icon: <BusIcon />,
        isBus: true,
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

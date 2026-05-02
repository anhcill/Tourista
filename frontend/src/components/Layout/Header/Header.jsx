'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FaSearch, FaGlobe, FaSignOutAlt,
    FaBookmark, FaChevronDown, FaHeart,
    FaHotel, FaMapMarkedAlt,
    FaTimes, FaMapMarkerAlt, FaClock, FaUserShield, FaBookOpen, FaComments,
    FaMoon, FaSun, FaRegLightbulb, FaUser, FaTag, FaSuitcaseRolling, FaPlaneDeparture
} from 'react-icons/fa';
import { logout } from '../../../store/slices/authSlice';
import authApi from '../../../api/authApi';
import chatApi from '../../../api/chatApi';
import { getRefreshToken } from '../../../utils/authStorage';
import Button from '../../Common/Button/Button';
import useHotelAutocomplete from '../../../hooks/useHotelAutocomplete';
import { setConversations } from '../../../store/slices/chatSlice';
import CurrencyLangDropdown from './CurrencyLangDropdown';
import NotificationDropdown from './NotificationDropdown';
import SupportDropdown from './SupportDropdown';
import { useTheme } from '../../ThemeProvider/ThemeProvider';
import styles from './Header.module.css';

const RECENT_SEARCHES_KEY = 'tourista_recent_searches';
const MAX_RECENT_SEARCHES = 6;

const normalizeRecentSearches = (items) => {
    if (!Array.isArray(items)) return [];
    return items
        .map((item) => {
            if (typeof item === 'string') {
                const value = item.trim();
                return value ? { value, ts: Date.now() } : null;
            }
            if (item && typeof item === 'object') {
                const value = String(item.value || '').trim();
                if (!value) return null;
                const ts = Number(item.ts || Date.now());
                return { value, ts };
            }
            return null;
        })
        .filter(Boolean)
        .slice(0, MAX_RECENT_SEARCHES);
};

const groupRecentSearches = (items) => {
    const today = [];
    const recent = [];
    const now = new Date();
    items.forEach((item) => {
        const itemDate = new Date(item.ts || Date.now());
        const isToday =
            itemDate.getDate() === now.getDate() &&
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear();
        if (isToday) today.push(item);
        else recent.push(item);
    });
    return [
        { title: 'Hôm nay', items: today },
        { title: 'Gần đây', items: recent },
    ].filter((group) => group.items.length > 0);
};

const AnimatedBusLogo = ({ className }) => (
    <svg
        className={className}
        width="32"
        height="32"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <defs>
            <linearGradient id="busGrad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF6B35"/>
                <stop offset="50%" stopColor="#F7C59F"/>
                <stop offset="100%" stopColor="#00B4D8"/>
            </linearGradient>
            <linearGradient id="busGradDark" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FF8C5A"/>
                <stop offset="50%" stopColor="#FFB88A"/>
                <stop offset="100%" stopColor="#4DC9FF"/>
            </linearGradient>
        </defs>
        {/* Bus body */}
        <rect x="6" y="18" width="52" height="28" rx="8" fill="url(#busGrad)" className={styles.busBody}/>
        {/* Windshield */}
        <rect x="10" y="22" width="16" height="12" rx="4" fill="rgba(255,255,255,0.45)" className={styles.busWindow}/>
        {/* Rear window */}
        <rect x="30" y="22" width="12" height="12" rx="3" fill="rgba(255,255,255,0.3)" className={styles.busRearWindow}/>
        {/* Door */}
        <rect x="44" y="22" width="10" height="18" rx="3" fill="rgba(255,255,255,0.25)" className={styles.busDoor}/>
        {/* Wheels */}
        <circle cx="20" cy="50" r="7" fill="#2D3748" className={styles.wheelFront}/>
        <circle cx="20" cy="50" r="3" fill="#718096" className={styles.wheelHubFront}/>
        <circle cx="44" cy="50" r="7" fill="#2D3748" className={styles.wheelRear}/>
        <circle cx="44" cy="50" r="3" fill="#718096" className={styles.wheelHubRear}/>
        {/* Headlights */}
        <rect x="6" y="34" width="4" height="6" rx="2" fill="#FFD700" opacity="0.9"/>
        {/* Taillights */}
        <rect x="54" y="34" width="4" height="6" rx="2" fill="#FF4444" opacity="0.8"/>
        {/* Stripe decoration */}
        <rect x="6" y="38" width="52" height="3" rx="1.5" fill="rgba(255,255,255,0.2)"/>
        {/* Roof */}
        <rect x="10" y="14" width="44" height="6" rx="3" fill="rgba(0,0,0,0.12)"/>
        {/* Antenna */}
        <rect x="48" y="8" width="3" height="8" rx="1.5" fill="#718096"/>
        <circle cx="49.5" cy="8" r="2.5" fill="#FF6B35"/>
    </svg>
);

const Header = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const { totalUnread } = useSelector((state) => state.chat);
    const { theme, toggleTheme } = useTheme();
    const [hasMounted, setHasMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMobileScrolled, setIsMobileScrolled] = useState(false);
    const [isMobileScreen, setIsMobileScreen] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState([]);
    const dropdownRef = useRef(null);

    const { suggestions: apiSuggestions } = useHotelAutocomplete(searchKeyword, {
        fallbackSuggestions: [
            { value: 'Đà Nẵng', type: 'Điểm đến' },
            { value: 'Nha Trang', type: 'Điểm đến' },
            { value: 'Phú Quốc', type: 'Điểm đến' },
            { value: 'Hà Nội', type: 'Điểm đến' },
            { value: 'Hồ Chí Minh', type: 'Điểm đến' },
        ],
    });

    useEffect(() => { setHasMounted(true); }, []);

    useEffect(() => {
        const checkMobile = () => setIsMobileScreen(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handleScroll = () => {
            if (window.innerWidth <= 768) setIsMobileScrolled(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            setRecentSearches(normalizeRecentSearches(parsed));
        } catch {
            setRecentSearches([]);
        }
    }, [hasMounted]);

    // Normalize role: trim whitespace và uppercase để tránh lỗi do khác case
    const normalizedRole = String(user?.role || '').trim().toUpperCase();
    // ADMIN cũng có quyền truy cập /partner/** (theo SecurityConfig backend)
    const PARTNER_ROLES = new Set(['PARTNER', 'HOTEL_OWNER', 'HOST', 'ADMIN']);
    const isPartner = PARTNER_ROLES.has(normalizedRole);
    const showAuthenticatedMenu = hasMounted && isAuthenticated;
    const showPartnerIcon = showAuthenticatedMenu && isPartner;

    useEffect(() => {
        if (!hasMounted || !isAuthenticated) return;
        let isAlive = true;
        const pullConversations = async () => {
            try {
                const response = await chatApi.getConversations();
                const list = Array.isArray(response?.data) ? response.data : [];
                if (!isAlive) return;
                dispatch(setConversations(list));
            } catch {
                // Silent
            }
        };
        pullConversations();
        const timer = setInterval(pullConversations, 30000);
        return () => { isAlive = false; clearInterval(timer); };
    }, [dispatch, hasMounted, isAuthenticated]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setDropdownOpen(false);
        try {
            const refreshToken = getRefreshToken();
            if (refreshToken) await authApi.logout(refreshToken);
        } catch {
            // continue
        } finally {
            dispatch(logout());
            toast.success('Đã đăng xuất. Hẹn gặp lại!');
            setIsLoggingOut(false);
            router.push('/');
        }
    };

    const navigationTabs = [
        { id: 'hotel', label: 'Khách sạn', hint: 'Nghỉ dưỡng', href: '/hotels', icon: FaHotel, color: '#FF6B6B' },
        { id: 'tour', label: 'Tour du lịch', hint: 'Khám phá tự do', href: '/tours', icon: FaMapMarkedAlt, color: '#4ECDC4' },
        { id: 'bus', label: 'Vé xe khách', hint: 'Vi vu mọi ngả', href: '/bus', icon: FaPlaneDeparture, color: '#45B7D1', isBus: true },
        { id: 'ai', label: 'AI Planner', hint: 'Chuyên gia du lịch', href: '/ai-travel-planner', icon: FaRegLightbulb, color: '#96CEB4' },
        { id: 'promo', label: 'Khuyến mãi', hint: 'Ưu đãi hot', href: '/promotions', icon: FaTag, color: '#F7DC6F' },
        { id: 'combo', label: 'Combo', hint: 'Tiết kiệm hơn', href: '/combos', icon: FaSuitcaseRolling, color: '#BB8FCE' },
        { id: 'article', label: 'Cẩm nang', hint: 'Bí kíp thả ga', href: '/articles', icon: FaBookOpen, color: '#85C1E9' },
    ];

    const isTabActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

    const mixedSuggestions = useMemo(() => {
        if (!searchKeyword.trim()) return [];
        return apiSuggestions;
    }, [searchKeyword, apiSuggestions]);

    const showSearchSuggestions =
        isSearchFocused && searchKeyword.trim().length > 0 && mixedSuggestions.length > 0;
    const showRecentSearches =
        isSearchFocused && searchKeyword.trim().length === 0 && recentSearches.length > 0;

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const keyword = searchKeyword.trim();
        if (!keyword) {
            toast.info('Nhập điểm đến để bắt đầu tìm kiếm.');
            return;
        }
        saveRecentSearch(keyword);
        router.push(`/hotels/search?destination=${encodeURIComponent(keyword)}&adults=2&rooms=1`);
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
    };

    const saveRecentSearch = (keyword) => {
        const normalized = String(keyword || '').trim();
        if (!normalized) return;
        setRecentSearches((prev) => {
            const updated = [
                { value: normalized, ts: Date.now() },
                ...prev.filter((item) => item.value.toLowerCase() !== normalized.toLowerCase())
            ].slice(0, MAX_RECENT_SEARCHES);
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const selectSuggestion = (value, type = 'Điểm đến') => {
        setSearchKeyword(value);
        saveRecentSearch(value);
        if (type === 'Tour') {
            router.push(`/tours/search?city=${encodeURIComponent(value)}`);
        } else {
            router.push(`/hotels/search?destination=${encodeURIComponent(value)}&adults=2&rooms=1`);
        }
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
    };

    const selectRecentSearch = (value) => {
        setSearchKeyword(value);
        saveRecentSearch(value);
        router.push(`/hotels/search?destination=${encodeURIComponent(value)}&adults=2&rooms=1`);
        setIsSearchFocused(false);
    };

    const removeRecentSearch = (value) => {
        setRecentSearches((prev) => {
            const updated = prev.filter((item) => item.value.toLowerCase() !== String(value).toLowerCase());
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
            return updated;
        });
    };

    const clearRecentSearches = () => {
        setRecentSearches([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const handleSearchKeyDown = (e) => {
        if (!showSearchSuggestions) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev + 1) % mixedSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev <= 0 ? mixedSuggestions.length - 1 : prev - 1));
        } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            selectSuggestion(mixedSuggestions[activeSuggestionIndex].value, mixedSuggestions[activeSuggestionIndex].type);
        } else if (e.key === 'Escape') {
            setIsSearchFocused(false);
            setActiveSuggestionIndex(-1);
        }
    };

    const handleComingSoon = (e, tabLabel) => {
        if (!tabLabel) return;
        e.preventDefault();
        toast.info(`${tabLabel} đang được hoàn thiện, bạn quay lại sớm nhé.`);
    };

    const recentGroups = groupRecentSearches(recentSearches);

    const renderSuggestionIcon = (type) => {
        if (type === 'Tour') return <FaMapMarkedAlt className={styles.suggestionIcon} />;
        if (type === 'Khach san' || type === 'Khách sạn') return <FaHotel className={styles.suggestionIcon} />;
        return <FaMapMarkerAlt className={styles.suggestionIcon} />;
    };

    return (
        <header className={styles.header}>
            <div className={styles.topBar}>
                <div className="container">
                    <div className={styles.topBarInner}>

                        {/* Logo */}
                        <Link href="/" className={styles.logo}>
                            <div className={styles.logoIconWrap}>
                                <AnimatedBusLogo className={styles.logoIcon} />
                            </div>
                            <div className={styles.logoTextWrap}>
                                <span className={styles.logoText}>Tourista</span>
                                <span className={styles.logoTagline}>Studio</span>
                            </div>
                        </Link>

                        {/* Search Bar */}
                        <div className={styles.searchWrap}>
                            <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
                                <div className={styles.searchField}>
                                    <FaSearch className={styles.searchIcon} />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm điểm đến, khách sạn, tour..."
                                        className={styles.searchInput}
                                        value={searchKeyword}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onBlur={() => {
                                            setTimeout(() => {
                                                setIsSearchFocused(false);
                                                setActiveSuggestionIndex(-1);
                                            }, 150);
                                        }}
                                        onKeyDown={handleSearchKeyDown}
                                        onChange={(e) => setSearchKeyword(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className={styles.searchBtn}>
                                    <FaSearch />
                                    <span>Tìm kiếm</span>
                                </button>

                                {showSearchSuggestions && (
                                    <ul className={styles.suggestionList}>
                                        {mixedSuggestions.map((item, idx) => (
                                            <li key={`${item.type}-${item.value}`}>
                                                <button
                                                    type="button"
                                                    className={`${styles.suggestionItem} ${idx === activeSuggestionIndex ? styles.suggestionItemActive : ''}`}
                                                    onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                    onMouseDown={() => selectSuggestion(item.value, item.type)}
                                                >
                                                    <span className={styles.suggestionMainWrap}>
                                                        {renderSuggestionIcon(item.type)}
                                                        <span className={styles.suggestionMain}>{item.value}</span>
                                                    </span>
                                                    <span className={styles.suggestionType}>{item.type}</span>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}

                                {showRecentSearches && (
                                    <div className={styles.suggestionList}>
                                        <div className={styles.suggestionHeaderRow}>
                                            <div className={styles.suggestionHeader}>Tìm kiếm gần đây</div>
                                            <button type="button" className={styles.clearRecentBtn} onMouseDown={clearRecentSearches}>
                                                Xóa tất cả
                                            </button>
                                        </div>
                                        {recentGroups.map((group) => (
                                            <div key={group.title}>
                                                <div className={styles.recentGroupTitle}>{group.title}</div>
                                                <ul className={styles.recentList}>
                                                    {group.items.map((item) => (
                                                        <li key={`recent-${item.value}-${item.ts}`}>
                                                            <div className={styles.recentItemRow}>
                                                                <button
                                                                    type="button"
                                                                    className={styles.suggestionItem}
                                                                    onMouseDown={() => selectRecentSearch(item.value)}
                                                                >
                                                                    <span className={styles.suggestionMainWrap}>
                                                                        <FaClock className={styles.suggestionIcon} />
                                                                        <span className={styles.suggestionMain}>{item.value}</span>
                                                                    </span>
                                                                    <span className={styles.suggestionType}>Gần đây</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className={styles.removeRecentBtn}
                                                                    onMouseDown={() => removeRecentSearch(item.value)}
                                                                    aria-label={`Xóa ${item.value}`}
                                                                >
                                                                    <FaTimes />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </form>
                        </div>

                        {/* Actions */}
                        <div className={styles.actions}>
                            <div className={styles.utilityButtons}>
                                <button
                                    className={`${styles.iconBtn} ${styles.mobileMenuBtn}`}
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    aria-label="Menu"
                                    aria-expanded={mobileMenuOpen}
                                >
                                    {mobileMenuOpen ? <FaTimes /> : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="3" y1="6" x2="21" y2="6"/>
                                            <line x1="3" y1="12" x2="21" y2="12"/>
                                            <line x1="3" y1="18" x2="21" y2="18"/>
                                        </svg>
                                    )}
                                </button>
                                <CurrencyLangDropdown />
                                <button
                                    className={styles.iconBtn}
                                    onClick={toggleTheme}
                                    aria-label={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                                >
                                    {theme === 'dark' ? <FaSun /> : <FaMoon />}
                                </button>
                                <NotificationDropdown />
                                <SupportDropdown />
                                {showAuthenticatedMenu && isPartner && (
                                    <Link href="/partner/messages" className={styles.iconBtn} aria-label="Tin nhắn Partner">
                                        <FaComments />
                                        {totalUnread > 0 && (
                                            <span className={styles.chatBadge}>{totalUnread > 9 ? '9+' : totalUnread}</span>
                                        )}
                                    </Link>
                                )}
                            </div>

                            {showAuthenticatedMenu ? (
                                <div className={styles.userMenu} ref={dropdownRef}>
                                    <button
                                        className={styles.userButton}
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        aria-expanded={dropdownOpen}
                                    >
                                        <div className={styles.avatar}>
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                                            ) : (
                                                <span className={styles.avatarInitials}>{getInitials(user?.fullName || user?.name)}</span>
                                            )}
                                        </div>
                                        <span className={styles.userName}>{user?.fullName || user?.name || 'Tài khoản'}</span>
                                        <FaChevronDown className={`${styles.chevron} ${dropdownOpen ? styles.chevronUp : ''}`} />
                                    </button>

                                    {dropdownOpen && (
                                        <div className={styles.dropdown}>
                                            <div className={styles.dropdownHeader}>
                                                <div className={styles.dropdownAvatar}>
                                                    {user?.avatarUrl ? (
                                                        <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                                                    ) : (
                                                        <span>{getInitials(user?.fullName || user?.name)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className={styles.dropdownName}>{user?.fullName || user?.name}</div>
                                                    <div className={styles.dropdownEmail}>{user?.email}</div>
                                                </div>
                                            </div>
                                            <div className={styles.dropdownDivider} />
                                            {user?.role === 'ADMIN' && (
                                                <>
                                                    <Link href="/admin" className={styles.dropdownItem} style={{ color: '#0077b6', fontWeight: 'bold' }} onClick={() => setDropdownOpen(false)}>
                                                        <FaUserShield /> Bảng điều khiển Admin
                                                    </Link>
                                                    <div className={styles.dropdownDivider} />
                                                </>
                                            )}
                                            <Link href="/profile" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                                                <FaUser /> Hồ sơ của tôi
                                            </Link>
                                            <Link href="/profile/bookings" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                                                <FaBookmark /> Đặt chỗ của tôi
                                            </Link>
                                            <Link href="/favorites" className={styles.dropdownItem} onClick={() => setDropdownOpen(false)}>
                                                <FaHeart /> Yêu thích
                                            </Link>
                                            <div className={styles.dropdownDivider} />
                                            <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutItem}`} disabled={isLoggingOut}>
                                                <FaSignOutAlt />
                                                {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.authButtons}>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className={styles.signInBtn}>Đăng nhập</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="primary" size="sm" className={styles.registerBtn}>Đăng ký</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nav Row */}
                    <nav className={styles.navRow}>
                        <div className={styles.navTabs}>
                            {navigationTabs.map((tab) => (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`${styles.navTab} ${isTabActive(tab.href) ? styles.active : ''}`}
                                    style={isTabActive(tab.href) ? { '--tab-accent': tab.color } : {}}
                                    onClick={(e) => tab.comingSoon && handleComingSoon(e, tab.label)}
                                >
                                    {tab.isBus ? (
                                        <span className={styles.navTabIconBus}>
                                            <AnimatedBusLogo className={styles.busIconSmall} />
                                        </span>
                                    ) : (
                                        <tab.icon className={styles.navTabIcon} style={isTabActive(tab.href) ? { color: tab.color } : {}} />
                                    )}
                                    <span>{tab.label}</span>
                                    {tab.comingSoon && <span className={styles.comingSoonBadge}>Sớm</span>}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Sticky Mobile Search Bar */}
                    {isMobileScreen && (
                        <div className={`${styles.stickySearchWrap} ${isMobileScrolled ? styles.stickySearchVisible : ''}`}>
                        <form className={styles.stickySearchForm} onSubmit={(e) => {
                            e.preventDefault();
                            const kw = searchKeyword.trim() || 'Da Nang';
                            router.push(`/hotels/search?destination=${encodeURIComponent(kw)}&adults=2&rooms=1`);
                        }}>
                            <FaSearch className={styles.stickySearchIcon} />
                            <input
                                type="text"
                                placeholder="Tìm khách sạn, tour..."
                                className={styles.stickySearchInput}
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                        </form>
                        </div>
                    )}

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className={styles.mobileMenu}>
                            <div className={styles.mobileMenuHeader}>
                                {showAuthenticatedMenu ? (
                                    <div className={styles.mobileUserInfo}>
                                        <div className={styles.mobileAvatar}>
                                            {user?.avatarUrl ? (
                                                <img src={user.avatarUrl} alt="" className={styles.avatarImg} />
                                            ) : (
                                                <span className={styles.avatarInitials}>{getInitials(user?.fullName || user?.name)}</span>
                                            )}
                                        </div>
                                        <div>
                                            <div className={styles.mobileUserName}>{user?.fullName || user?.name}</div>
                                            <div className={styles.mobileUserEmail}>{user?.email}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.mobileAuthBtns}>
                                        <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="ghost" size="sm" className={styles.signInBtn}>Đăng nhập</Button>
                                        </Link>
                                        <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                            <Button variant="primary" size="sm" className={styles.registerBtn}>Đăng ký</Button>
                                        </Link>
                                    </div>
                                )}
                                <button
                                    className={styles.mobileMenuCloseBtn}
                                    onClick={() => setMobileMenuOpen(false)}
                                    aria-label="Đóng menu"
                                >
                                    <FaTimes size={18} />
                                </button>
                            </div>
                            <nav className={styles.mobileNav}>
                                {navigationTabs.map((tab) => (
                                    <Link
                                        key={tab.id}
                                        href={tab.href}
                                        className={`${styles.mobileNavItem} ${isTabActive(tab.href) ? styles.active : ''}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        <span className={styles.mobileNavIcon}>
                                            {tab.isBus ? (
                                                <AnimatedBusLogo className={styles.busIconMobile} />
                                            ) : (
                                                <tab.icon />
                                            )}
                                        </span>
                                        <span className={styles.mobileNavLabel}>{tab.label}</span>
                                        {tab.comingSoon && <span className={styles.comingSoonBadge}>Sớm</span>}
                                    </Link>
                                ))}
                            </nav>
                            {showAuthenticatedMenu && (
                                <div className={styles.mobileMenuFooter}>
                                    <Link href="/profile" className={styles.mobileMenuItem} onClick={() => setMobileMenuOpen(false)}>
                                        <FaUser /> Hồ sơ của tôi
                                    </Link>
                                    <Link href="/profile/bookings" className={styles.mobileMenuItem} onClick={() => setMobileMenuOpen(false)}>
                                        <FaBookmark /> Đặt chỗ của tôi
                                    </Link>
                                    <Link href="/favorites" className={styles.mobileMenuItem} onClick={() => setMobileMenuOpen(false)}>
                                        <FaHeart /> Yêu thích
                                    </Link>
                                    {user?.role === 'ADMIN' && (
                                        <Link href="/admin" className={styles.mobileMenuItem} onClick={() => setMobileMenuOpen(false)}>
                                            <FaUserShield /> Quản trị Admin
                                        </Link>
                                    )}
                                    <button onClick={handleLogout} className={`${styles.mobileMenuItem} ${styles.logoutItem}`}>
                                        <FaSignOutAlt /> Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

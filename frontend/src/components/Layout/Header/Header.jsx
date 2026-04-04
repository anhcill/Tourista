'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import {
    FaUser, FaSearch, FaGlobe, FaSignOutAlt,
    FaBookmark, FaChevronDown, FaHeart,
    FaHotel, FaPlaneDeparture, FaMapMarkedAlt, FaBuilding,
    FaBell, FaHeadset, FaBars, FaTimes, FaMapMarkerAlt, FaClock
} from 'react-icons/fa';
import { logout } from '../../../store/slices/authSlice';
import authApi from '../../../api/authApi';
import tourApi from '../../../api/tourApi';
import { STORAGE_KEYS } from '../../../utils/constants';
import Button from '../../Common/Button/Button';
import useHotelAutocomplete from '../../../hooks/useHotelAutocomplete';
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

        if (isToday) {
            today.push(item);
        } else {
            recent.push(item);
        }
    });

    return [
        { title: 'Hôm nay', items: today },
        { title: 'Gần đây', items: recent },
    ].filter((group) => group.items.length > 0);
};

const Header = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user } = useSelector((state) => state.auth);
    const [hasMounted, setHasMounted] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [tourSuggestions, setTourSuggestions] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const dropdownRef = useRef(null);

    const searchSuggestions = useHotelAutocomplete(searchKeyword, {
        fallbackSuggestions: [
            { value: 'Đà Nẵng', type: 'Điểm đến' },
            { value: 'Nha Trang', type: 'Điểm đến' },
            { value: 'Phú Quốc', type: 'Điểm đến' },
            { value: 'Hà Nội', type: 'Điểm đến' },
            { value: 'Hồ Chí Minh', type: 'Điểm đến' },
        ],
    });

    useEffect(() => {
        setHasMounted(true);
    }, []);

    useEffect(() => {
        let mounted = true;

        const loadTourSuggestions = async () => {
            try {
                const response = await tourApi.getTours({ page: 1, limit: 120 });
                if (!mounted) return;

                const tours = Array.isArray(response?.data)
                    ? response.data
                    : Array.isArray(response?.data?.content)
                        ? response.data.content
                        : [];

                const unique = new Map();
                tours.forEach((tour) => {
                    const title = String(tour?.title || '').trim();
                    const city = String(tour?.city || '').trim();

                    if (title) {
                        const key = `tour-${title.toLowerCase()}`;
                        if (!unique.has(key)) {
                            unique.set(key, { value: title, type: 'Tour' });
                        }
                    }

                    if (city) {
                        const key = `city-${city.toLowerCase()}`;
                        if (!unique.has(key)) {
                            unique.set(key, { value: city, type: 'Điểm đến' });
                        }
                    }
                });

                setTourSuggestions(Array.from(unique.values()));
            } catch {
                if (!mounted) return;
                setTourSuggestions([]);
            }
        };

        loadTourSuggestions();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (!hasMounted) return;
        try {
            const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
            const parsed = raw ? JSON.parse(raw) : [];
            setRecentSearches(normalizeRecentSearches(parsed));
        } catch {
            setRecentSearches([]);
        }
    }, [hasMounted]);

    const showAuthenticatedMenu = hasMounted && isAuthenticated;

    // Đóng dropdown khi click ra ngoài
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
            // Gọi API logout để invalidate refresh token ở backend
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (refreshToken) {
                await authApi.logout(refreshToken);
            }
        } catch {
            // Dù backend lỗi vẫn logout ở client
        } finally {
            dispatch(logout());
            toast.success('Đã đăng xuất. Hẹn gặp lại! 👋');
            setIsLoggingOut(false);
            router.push('/');
        }
    };

    const navigationTabs = [
        { id: 'hotel', label: 'Khách sạn', hint: 'Nghỉ dưỡng', href: '/hotels', icon: FaHotel },
        { id: 'flight', label: 'Vé máy bay', hint: 'Sắp ra mắt', href: '/flights', icon: FaPlaneDeparture, comingSoon: true },
        { id: 'tour', label: 'Tour du lịch', hint: 'Khám phá ngay', href: '/tours', icon: FaMapMarkedAlt },
        { id: 'apartment', label: 'Căn hộ', hint: 'Sắp ra mắt', href: '/apartments', icon: FaBuilding, comingSoon: true },
    ];

    const isTabActive = (href) => pathname === href || pathname.startsWith(`${href}/`);

    const activeSearchType = pathname.startsWith('/tours') ? 'TOUR' : 'HOTEL';
    const normalizeText = (value) =>
        String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .trim();

    const mixedSuggestions = useMemo(() => {
        const keyword = normalizeText(searchKeyword);
        const merged = [...searchSuggestions, ...tourSuggestions];
        const unique = new Map();

        merged.forEach((item) => {
            const value = String(item?.value || '').trim();
            const type = String(item?.type || '').trim();
            if (!value || !type) return;
            const key = `${type.toLowerCase()}-${value.toLowerCase()}`;
            if (!unique.has(key)) {
                unique.set(key, { value, type });
            }
        });

        return Array.from(unique.values())
            .filter((item) => !keyword || normalizeText(item.value).includes(keyword))
            .slice(0, 8);
    }, [searchKeyword, searchSuggestions, tourSuggestions]);

    const showSearchSuggestions =
        isSearchFocused &&
        searchKeyword.trim().length > 0 &&
        mixedSuggestions.length > 0;

    const showRecentSearches =
        isSearchFocused &&
        searchKeyword.trim().length === 0 &&
        recentSearches.length > 0;

    // Lấy chữ cái đầu từ tên người dùng để làm avatar
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
        setMobileSearchOpen(false);
        setIsSearchFocused(false);
        setActiveSuggestionIndex(-1);
    };

    const saveRecentSearch = (keyword) => {
        const normalized = String(keyword || '').trim();
        if (!normalized) return;

        setRecentSearches((prev) => {
            const updated = [{ value: normalized, ts: Date.now() }, ...prev.filter((item) => item.value.toLowerCase() !== normalized.toLowerCase())]
                .slice(0, MAX_RECENT_SEARCHES);
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
        setMobileSearchOpen(false);
    };

    const selectRecentSearch = (value) => {
        setSearchKeyword(value);
        saveRecentSearch(value);
        router.push(`/hotels/search?destination=${encodeURIComponent(value)}&adults=2&rooms=1`);
        setIsSearchFocused(false);
        setMobileSearchOpen(false);
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
        if (!showSearchSuggestions) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev + 1) % mixedSuggestions.length);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex((prev) => (prev <= 0 ? mixedSuggestions.length - 1 : prev - 1));
            return;
        }

        if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            const item = mixedSuggestions[activeSuggestionIndex];
            selectSuggestion(item.value, item.type);
            return;
        }

        if (e.key === 'Escape') {
            setIsSearchFocused(false);
            setActiveSuggestionIndex(-1);
        }
    };

    const handleComingSoon = (e, tabLabel) => {
        if (!tabLabel) return;
        e.preventDefault();
        toast.info(`${tabLabel} đang được hoàn thiện, bạn quay lại sớm nhé.`);
    };

    const showQuickHint = (message) => {
        toast.info(message);
    };

    const quickFilters = activeSearchType === 'TOUR'
        ? [
            {
                id: 'tour-weekend',
                label: 'Tour cuối tuần',
                action: () => router.push('/tours/search?durationMin=2&durationMax=3'),
            },
            {
                id: 'tour-easy',
                label: 'Mức dễ đi',
                action: () => router.push('/tours/search?difficulty=EASY'),
            },
            {
                id: 'tour-family',
                label: 'Gia đình',
                action: () => {
                    setSearchKeyword('Tour gia đình');
                    router.push('/tours');
                },
            },
        ]
        : [
            {
                id: 'hotel-dn',
                label: 'Khách sạn Đà Nẵng',
                action: () => router.push('/hotels/search?destination=Đà Nẵng&adults=2&rooms=1'),
            },
            {
                id: 'hotel-weekend',
                label: 'Cuối tuần này',
                action: () => router.push('/hotels/search?destination=Vũng Tàu&adults=2&rooms=1'),
            },
            {
                id: 'hotel-resort',
                label: 'Resort biển',
                action: () => router.push('/hotels/search?destination=Phú Quốc&adults=2&rooms=1'),
            },
        ];

    const recentGroups = groupRecentSearches(recentSearches);

    const renderSuggestionIcon = (type) => {
        if (type === 'Tour') {
            return <FaMapMarkedAlt className={styles.suggestionIcon} />;
        }
        if (type === 'Khach san' || type === 'Khách sạn') {
            return <FaHotel className={styles.suggestionIcon} />;
        }
        return <FaMapMarkerAlt className={styles.suggestionIcon} />;
    };

    return (
        <header className={styles.header}>
            <div className="container">
                <div className={styles.unifiedBar}>
                    <Link href="/" className={styles.logo}>
                        <div className={styles.logoIcon}>
                            <FaGlobe />
                        </div>
                        <div className={styles.logoTextWrap}>
                            <span className={styles.logoText}>Tourista</span>
                            <span className={styles.logoTagline}>Kế hoạch du lịch linh hoạt</span>
                        </div>
                    </Link>

                    <form className={styles.searchBar} onSubmit={handleSearchSubmit}>
                        <FaSearch className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Bạn muốn đi đâu? Khách sạn, tour, điểm đến..."
                            className={styles.searchInput}
                            value={searchKeyword}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => {
                                setTimeout(() => {
                                    setIsSearchFocused(false);
                                    setActiveSuggestionIndex(-1);
                                }, 120);
                            }}
                            onKeyDown={handleSearchKeyDown}
                            onChange={(event) => setSearchKeyword(event.target.value)}
                        />
                        <button type="submit" className={styles.searchButton}>Tìm nhanh</button>

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
                                    <button
                                        type="button"
                                        className={styles.clearRecentBtn}
                                        onMouseDown={clearRecentSearches}
                                    >
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

                    <div className={styles.actions}>
                        <div className={styles.utilityButtons}>
                            <button
                                className={styles.utilityBtn}
                                onClick={() => showQuickHint('Tiền tệ hiện tại: VND. Bạn có thể đổi ở bước thanh toán.')}
                            >
                                VND | VI
                            </button>
                            <button
                                className={styles.iconBtn}
                                onClick={() => showQuickHint('Thông báo mới sẽ xuất hiện tại đây.')}
                                aria-label="Thông báo"
                            >
                                <FaBell />
                            </button>
                            <button
                                className={styles.iconBtn}
                                onClick={() => showQuickHint('Hỗ trợ 24/7: 1900 9999')}
                                aria-label="Hỗ trợ"
                            >
                                <FaHeadset />
                            </button>
                        </div>

                        <button
                            className={styles.mobileSearchToggle}
                            onClick={() => setMobileSearchOpen((prev) => !prev)}
                            aria-label="Mở tìm kiếm"
                        >
                            {mobileSearchOpen ? <FaTimes /> : <FaBars />}
                        </button>

                        {showAuthenticatedMenu ? (
                            <div className={styles.userMenu} ref={dropdownRef}>
                                <button
                                    className={styles.userButton}
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    aria-expanded={dropdownOpen}
                                >
                                    <div className={styles.avatar}>
                                        {user?.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.fullName} className={styles.avatarImg} />
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

                                        <Link
                                            href="/profile"
                                            className={styles.dropdownItem}
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <FaUser /> Hồ sơ của tôi
                                        </Link>
                                        <Link
                                            href="/profile/bookings"
                                            className={styles.dropdownItem}
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <FaBookmark /> Đặt chỗ của tôi
                                        </Link>
                                        <Link
                                            href="/favorites"
                                            className={styles.dropdownItem}
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <FaHeart /> Yêu thích
                                        </Link>

                                        <div className={styles.dropdownDivider} />

                                        <button
                                            onClick={handleLogout}
                                            className={`${styles.dropdownItem} ${styles.logoutItem}`}
                                            disabled={isLoggingOut}
                                        >
                                            <FaSignOutAlt />
                                            {isLoggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.authButtons}>
                                <Link href="/login">
                                    <Button variant="outline" size="sm" className={styles.signInBtn}>
                                        Đăng nhập
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="primary" size="sm" className={styles.registerBtn}>
                                        Đăng ký
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>

                    <div className={styles.navRow}>
                        <nav className={styles.navTabs}>
                            {navigationTabs.map((tab) => (
                                <Link
                                    key={tab.id}
                                    href={tab.href}
                                    className={`${styles.navTab} ${isTabActive(tab.href) ? styles.active : ''}`}
                                    onClick={(event) => tab.comingSoon && handleComingSoon(event, tab.label)}
                                >
                                    <span className={styles.tabIconWrap}>
                                        <tab.icon className={styles.tabIcon} />
                                    </span>
                                    <span className={styles.tabLabel}>{tab.label}</span>
                                    {tab.comingSoon && <span className={styles.comingSoonBadge}>Sớm</span>}
                                </Link>
                            ))}
                        </nav>

                        <div className={styles.quickFilterRow}>
                            <div className={styles.quickFilterChips}>
                                {quickFilters.map((filter) => (
                                    <button
                                        key={filter.id}
                                        type="button"
                                        className={styles.quickFilterChip}
                                        onClick={filter.action}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                            <div className={styles.trustSignals}>
                                <span className={styles.trustSignal}>Hỗ trợ 24/7</span>
                                <span className={styles.trustSignal}>Xác nhận nhanh</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form
                    className={`${styles.mobileSearchPanel} ${mobileSearchOpen ? styles.mobileSearchPanelOpen : ''}`}
                    onSubmit={handleSearchSubmit}
                >
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Tìm điểm đến, khách sạn, tour..."
                        className={styles.searchInput}
                        value={searchKeyword}
                        onKeyDown={handleSearchKeyDown}
                        onChange={(event) => setSearchKeyword(event.target.value)}
                    />
                    <button type="submit" className={styles.searchButton}>Tìm</button>
                </form>
            </div>
        </header>
    );
};

export default Header;

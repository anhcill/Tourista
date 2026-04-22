'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaSpinner, FaMapMarkerAlt, FaHotel, FaUmbrellaBeach, FaTimes } from 'react-icons/fa';
import useHotelAutocomplete from '@/hooks/useHotelAutocomplete';
import styles from './HotelPageSearch.module.css';

const RECENT_SEARCHES_KEY = 'tourista_recent_searches';
const MAX_RECENT = 5;

const getRecentSearches = () => {
    try {
        const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
};

const saveRecentSearch = (value) => {
    try {
        const recent = getRecentSearches().filter(item => item !== value);
        const updated = [value, ...recent].slice(0, MAX_RECENT);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {}
};

const clearRecentSearches = () => {
    try {
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
};

const getIconForType = (type) => {
    switch (type) {
        case 'Diem den': return <FaMapMarkerAlt />;
        case 'Khach san': return <FaHotel />;
        case 'Tour': return <FaUmbrellaBeach />;
        default: return <FaSearch />;
    }
};

export default function HotelPageSearch() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState([]);
    const wrapperRef = useRef(null);

    const { suggestions, loading } = useHotelAutocomplete(query);

    useEffect(() => {
        setRecentSearches(getRecentSearches());
    }, []);

    const showDropdown = isFocused && (query.trim().length > 0 || recentSearches.length > 0);

    const itemsToShow = query.trim().length > 0
        ? suggestions
        : recentSearches.map(value => ({ value, type: 'Lich su', id: null, detail: '' }));

    const handleSearch = useCallback((valueToSearch = query) => {
        const dest = (valueToSearch || query).trim();
        if (!dest) return;

        if (dest !== query) {
            setQuery(dest);
        }

        saveRecentSearch(dest);
        setRecentSearches(getRecentSearches());

        setIsFocused(false);
        setActiveIndex(-1);
        router.push(`/hotels/search?destination=${encodeURIComponent(dest)}`);
    }, [query, router]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsFocused(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (!showDropdown) {
            if (e.key === 'Enter') handleSearch();
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setActiveIndex(prev => (prev + 1) % itemsToShow.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setActiveIndex(prev => (prev <= 0 ? itemsToShow.length - 1 : prev - 1));
                break;
            case 'Enter':
                e.preventDefault();
                if (activeIndex >= 0 && itemsToShow[activeIndex]) {
                    handleSearch(itemsToShow[activeIndex].value);
                } else {
                    handleSearch();
                }
                break;
            case 'Escape':
                setIsFocused(false);
                setActiveIndex(-1);
                break;
            case 'Tab':
                setIsFocused(false);
                setActiveIndex(-1);
                break;
        }
    };

    const handleClearRecent = (e) => {
        e.stopPropagation();
        clearRecentSearches();
        setRecentSearches([]);
    };

    return (
        <div className={styles.wrap} ref={wrapperRef}>
            <div className={styles.inner}>
                <div className={styles.iconWrap}>
                    {loading ? <FaSpinner className={styles.spinner} /> : <FaSearch className={styles.icon} />}
                </div>
                <div className={styles.inputWrap}>
                    <input
                        type="text"
                        className={styles.input}
                        placeholder="Tìm kiếm khách sạn theo tên, khu vực, điểm đến..."
                        value={query}
                        onFocus={() => setIsFocused(true)}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(-1);
                        }}
                        onKeyDown={handleKeyDown}
                        autoComplete="off"
                        spellCheck="false"
                    />

                    {showDropdown && (
                        <div className={styles.dropdown}>
                            {query.trim().length === 0 && recentSearches.length > 0 && (
                                <div className={styles.dropdownHeader}>
                                    <span>Tìm kiếm gần đây</span>
                                    <button className={styles.clearBtn} onClick={handleClearRecent}>
                                        <FaTimes /> Xóa
                                    </button>
                                </div>
                            )}

                            {query.trim().length === 0 && recentSearches.length > 0 && (
                                <ul className={styles.suggestionList}>
                                    {recentSearches.map((item, idx) => (
                                        <li key={idx}>
                                            <button
                                                className={styles.suggestionItem}
                                                onMouseDown={() => handleSearch(item)}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                            >
                                                <div className={`${styles.suggestionIcon} ${styles.iconRecent}`}>
                                                    <FaSearch />
                                                </div>
                                                <span className={styles.suggestionMain}>{item}</span>
                                                <span className={styles.suggestionBadge}>Lịch sử</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {query.trim().length > 0 && suggestions.length === 0 && !loading && (
                                <div className={styles.noResults}>
                                    <p>Không tìm thấy kết quả cho "{query}"</p>
                                    <button className={styles.searchAnyway} onMouseDown={() => handleSearch()}>
                                        Tìm kiếm "{query}"
                                    </button>
                                </div>
                            )}

                            {query.trim().length > 0 && suggestions.length > 0 && (
                                <ul className={styles.suggestionList}>
                                    {suggestions.map((item, idx) => (
                                        <li key={`${item.type}-${item.id}-${idx}`}>
                                            <button
                                                className={`${styles.suggestionItem} ${idx === activeIndex ? styles.suggestionItemActive : ''}`}
                                                onMouseDown={() => handleSearch(item.value)}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                            >
                                                <div className={styles.suggestionIcon}>
                                                    {getIconForType(item.type)}
                                                </div>
                                                <div className={styles.suggestionContent}>
                                                    <span className={styles.suggestionMain}>{item.value}</span>
                                                    {item.detail && (
                                                        <span className={styles.suggestionDetail}>{item.detail}</span>
                                                    )}
                                                </div>
                                                <span className={styles.suggestionBadge}>{item.type}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className={styles.dropdownFooter}>
                                <span>Dùng ↑↓ để chọn, Enter để tìm</span>
                            </div>
                        </div>
                    )}
                </div>
                <button className={styles.btn} onClick={() => handleSearch()}>
                    Tìm kiếm
                </button>
            </div>
        </div>
    );
}

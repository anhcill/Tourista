'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaChevronRight, FaMapMarkerAlt, FaHotel, FaUmbrellaBeach, FaClock, FaRegClock } from 'react-icons/fa';
import styles from './HeroBanner.module.css';
import useHotelAutocomplete from '@/hooks/useHotelAutocomplete';

/* ── Danh sách ảnh slideshow banner ── */
const SLIDES = [
    {
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=85',
        title: 'Điểm Đến Tiếp Theo Của Bạn Là Đâu?',
        subtitle: 'Bãi biển thiên đường đang chờ đón bạn',
    },
    {
        image: 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=1600&q=85',
        title: 'Khám Phá Vẻ Đẹp Châu Á',
        subtitle: 'Hàng nghìn khách sạn & tour du lịch ưu đãi',
    },
    {
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=85',
        title: 'Hành Trình Không Giới Hạn',
        subtitle: 'Tìm ưu đãi độc quyền ở mọi nơi trên thế giới',
    },
    {
        image: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=1600&q=85',
        title: 'Trải Nghiệm Xa Xỉ, Giá Tốt Nhất',
        subtitle: 'Resort 5 sao, nghỉ dưỡng hoàn hảo cho bạn',
    },
    {
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1600&q=85',
        title: 'Phiêu Lưu Bắt Đầu Từ Đây',
        subtitle: 'Cung đường đẹp, kỷ niệm đáng nhớ',
    },
];

const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDefaultDates = () => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return {
        checkIn: formatLocalDate(today),
        checkOut: formatLocalDate(tomorrow),
    };
};

const buildDefaultSearchData = () => {
    const defaults = getDefaultDates();
    return {
        destination: '',
        checkIn: defaults.checkIn,
        checkOut: defaults.checkOut,
        adults: 2,
        children: 0,
        rooms: 1,
    };
};

const getIconForType = (type) => {
    switch (type) {
        case 'Diem den': return <FaMapMarkerAlt />;
        case 'Khach san': return <FaHotel />;
        case 'Tour': return <FaUmbrellaBeach />;
        default: return <FaRegClock />;
    }
};

const highlightMatch = (text, query) => {
    if (!query || !query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? <mark key={i} style={{ background: '#fff3cd', color: '#b8860b', fontWeight: 700, borderRadius: '2px', padding: '0 1px' }}>{part}</mark> : part
    );
};

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

const HeroBanner = ({ compact = false }) => {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [searchData, setSearchData] = useState(buildDefaultSearchData());
    const [isDestinationFocused, setIsDestinationFocused] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const destinationSuggestions = useHotelAutocomplete(searchData.destination);

    const hasQuery = searchData.destination.trim().length > 0;
    const hasRecent = !hasQuery && recentSearches.length > 0;
    const showDestinationSuggestions = isDestinationFocused && (hasQuery && destinationSuggestions.length > 0);
    const showRecentSuggestions = isDestinationFocused && hasRecent;

    // Auto-play slideshow
    const goTo = useCallback((index) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrent(index);
        setTimeout(() => setIsAnimating(false), 700);
    }, [isAnimating]);

    const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);
    const prev = useCallback(() => goTo((current - 1 + SLIDES.length) % SLIDES.length), [current, goTo]);

    useEffect(() => {
        if (compact) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [next, compact]);

    const handleSearch = (e) => {
        e.preventDefault();

        const dest = (searchData.destination || '').trim();
        if (!dest) return;

        saveRecentSearch(dest);
        setRecentSearches(getRecentSearches());

        const defaults = getDefaultDates();
        const checkIn = searchData.checkIn || defaults.checkIn;
        let checkOut = searchData.checkOut || defaults.checkOut;

        if (new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
            const adjusted = new Date(checkIn);
            adjusted.setDate(adjusted.getDate() + 1);
            checkOut = formatLocalDate(adjusted);
        }

        const params = new URLSearchParams({
            destination: dest,
            checkIn,
            checkOut,
            adults: String(searchData.adults),
            children: String(searchData.children),
            rooms: String(searchData.rooms),
        });
        router.push(`/hotels/search?${params.toString()}`);
    };

    const selectDestinationSuggestion = (value) => {
        setSearchData(prev => ({ ...prev, destination: value }));
        setIsDestinationFocused(false);
        setActiveSuggestionIndex(-1);
    };

    const handleDestinationKeyDown = (e) => {
        if (!showDestinationSuggestions) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev + 1) % destinationSuggestions.length);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev <= 0 ? destinationSuggestions.length - 1 : prev - 1));
            return;
        }

        if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
            e.preventDefault();
            selectDestinationSuggestion(destinationSuggestions[activeSuggestionIndex].value);
            return;
        }

        if (e.key === 'Escape') {
            setIsDestinationFocused(false);
            setActiveSuggestionIndex(-1);
        }
    };

    return (
        <section className={`${styles.heroBanner} ${compact ? styles.heroBannerCompact : ''}`}>

            {/* ── Slideshow Background ── */}
            {!compact && (
                <div className={styles.slideshowWrapper}>
                    {SLIDES.map((slide, i) => (
                        <div
                            key={i}
                            className={`${styles.slide} ${i === current ? styles.slideActive : ''}`}
                            style={{ backgroundImage: `url(${slide.image})` }}
                        />
                    ))}
                    {/* Dark overlay */}
                    <div className={styles.overlay} />

                    {/* Arrow controls */}
                    <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous">
                        <FaChevronLeft />
                    </button>
                    <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next">
                        <FaChevronRight />
                    </button>

                    {/* Dot indicators */}
                    <div className={styles.dots}>
                        {SLIDES.map((_, i) => (
                            <button
                                key={i}
                                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                                onClick={() => goTo(i)}
                                aria-label={`Slide ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Content ── */}
            <div className={styles.heroContent}>
                <div className={styles.container}>
                    {!compact && (
                        <div className={styles.heroText}>
                            <div className={styles.heroEyebrow}>
                                <span className={styles.eyebrowDot} />
                                Nền tảng đặt phòng trực tuyến hàng đầu
                            </div>
                            <h1 className={styles.heroSubtitle}>
                                {SLIDES[current].title}
                            </h1>
                            <p className={styles.heroDesc}>{SLIDES[current].subtitle}</p>
                        </div>
                    )}

                    {/* Search Box */}
                    <div className={styles.searchBox}>
                        <p className={styles.searchCardTitle}>🏨 Tìm khách sạn / phòng nghỉ</p>
                        <form onSubmit={handleSearch} className={styles.searchForm}>

                            {/* Place */}
                            <div className={styles.fieldWrap}>
                                <label className={styles.fieldLabel}>Điểm đến</label>
                                <div className={styles.autocompleteWrapper}>
                                    <input
                                        type="text"
                                        placeholder="Hà Nội, Đà Nẵng, Phú Quốc..."
                                        className={styles.fieldInput}
                                        value={searchData.destination}
                                        onFocus={() => setIsDestinationFocused(true)}
                                        onBlur={() => {
                                            setTimeout(() => {
                                                setIsDestinationFocused(false);
                                                setActiveSuggestionIndex(-1);
                                            }, 150);
                                        }}
                                        onKeyDown={handleDestinationKeyDown}
                                        onChange={(e) => {
                                            setSearchData({ ...searchData, destination: e.target.value });
                                            setActiveSuggestionIndex(-1);
                                        }}
                                    />

                                    {showDestinationSuggestions && (
                                        <ul className={styles.suggestionList}>
                                            {destinationSuggestions.map((item, idx) => (
                                                <li key={`${item.type}-${item.id}-${idx}`}>
                                                    <button
                                                        type="button"
                                                        className={`${styles.suggestionItem} ${idx === activeSuggestionIndex ? styles.suggestionItemActive : ''}`}
                                                        onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                        onMouseDown={() => selectDestinationSuggestion(item.value)}
                                                    >
                                                        <span className={styles.suggestionIcon}>{getIconForType(item.type)}</span>
                                                        <div className={styles.suggestionContent}>
                                                            <span className={styles.suggestionMain}>{highlightMatch(item.value, searchData.destination)}</span>
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

                                    {showRecentSuggestions && (
                                        <>
                                            <div className={styles.suggestionsSectionTitle}>
                                                <FaClock style={{ fontSize: '10px' }} /> Tìm kiếm gần đây
                                            </div>
                                            <ul className={styles.suggestionList}>
                                                {recentSearches.map((item, idx) => (
                                                    <li key={`recent-${idx}`}>
                                                        <button
                                                            type="button"
                                                            className={`${styles.suggestionItem} ${idx === activeSuggestionIndex ? styles.suggestionItemActive : ''}`}
                                                            onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                            onMouseDown={() => selectDestinationSuggestion(item)}
                                                        >
                                                            <span className={`${styles.suggestionIcon} ${styles.iconRecent}`}><FaClock /></span>
                                                            <span className={styles.suggestionMain}>{item}</span>
                                                            <span className={styles.suggestionBadge} style={{ background: '#f0f0f0', color: '#888' }}>Lịch sử</span>
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}

                                    {isDestinationFocused && hasQuery && destinationSuggestions.length === 0 && !destinationSuggestions.loading && (
                                        <div className={styles.noSuggestions}>
                                            Không có gợi ý cho &ldquo;{searchData.destination}&rdquo;
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Check In - Check Out */}
                            <div className={styles.fieldWrap}>
                                <label className={styles.fieldLabel}>Nhận phòng — Trả phòng</label>
                                <div className={styles.dateRow}>
                                    <input type="date" className={styles.dateInput} value={searchData.checkIn} onChange={(e) => setSearchData({ ...searchData, checkIn: e.target.value })} />
                                    <span className={styles.dateSep}>—</span>
                                    <input type="date" className={styles.dateInput} value={searchData.checkOut} onChange={(e) => setSearchData({ ...searchData, checkOut: e.target.value })} />
                                </div>
                            </div>

                            {/* Passengers + Rooms */}
                            <div className={styles.fieldWrap}>
                                <label className={styles.fieldLabel}>Hành khách · Phòng</label>
                                <div className={styles.guestRow}>
                                    <select className={styles.guestSelect} value={searchData.adults} onChange={(e) => setSearchData({ ...searchData, adults: parseInt(e.target.value) })}>
                                        {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Người lớn</option>)}
                                    </select>
                                    <select className={styles.guestSelect} value={searchData.children} onChange={(e) => setSearchData({ ...searchData, children: parseInt(e.target.value) })}>
                                        {[0,1,2,3,4].map(n => <option key={n} value={n}>{n} Trẻ em</option>)}
                                    </select>
                                    <select className={styles.guestSelect} value={searchData.rooms} onChange={(e) => setSearchData({ ...searchData, rooms: parseInt(e.target.value) })}>
                                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Phòng</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Search Button */}
                            <button type="submit" className={styles.searchButton}>
                                Tìm khách sạn →
                            </button>
                        </form>
                    </div>

                    {!compact && (
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>5K+</span>
                                <span className={styles.heroStatLabel}>Khách sạn & Resort</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>100K+</span>
                                <span className={styles.heroStatLabel}>Lượt đặt phòng</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>4.9★</span>
                                <span className={styles.heroStatLabel}>Đánh giá trung bình</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNum}>24/7</span>
                                <span className={styles.heroStatLabel}>Hỗ trợ khách hàng</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default HeroBanner;

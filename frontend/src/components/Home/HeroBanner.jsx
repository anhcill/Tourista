'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaPlane, FaHotel, FaUmbrellaBeach, FaChevronDown, FaSpinner } from 'react-icons/fa';
import { IoLocationSharp } from 'react-icons/io5';
import styles from './HeroBanner.module.css';
import useHotelAutocomplete from '@/hooks/useHotelAutocomplete';

/* ── Gradient Background Slides ── */
const SLIDES = [
    {
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        title: 'Khám Phá Việt Nam',
        subtitle: 'Hành trình đáng nhớ bắt đầu từ đây',
        icon: '🌴',
    },
    {
        gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 50%, #00b4db 100%)',
        title: 'Thiên Đường Nhiệt Đới',
        subtitle: 'Bãi biển tuyệt đẹp đang chờ đón bạn',
        icon: '🏖️',
    },
    {
        gradient: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 50%, #ff6b6b 100%)',
        title: 'Phiêu Lưu Không Giới Hạn',
        subtitle: 'Trải nghiệm độc đáo, kỷ niệm trọn vẹn',
        icon: '✈️',
    },
    {
        gradient: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
        title: 'Nghỉ Dưỡng Xa Hoa',
        subtitle: 'Resort 5 sao, dịch vụ đẳng cấp',
        icon: '🏨',
    },
];

const getIconForType = (type) => {
    switch (type) {
        case 'Diem den': return <IoLocationSharp />;
        case 'Khach san': return <FaHotel />;
        case 'Tour': return <FaUmbrellaBeach />;
        default: return <FaMapMarkerAlt />;
    }
};

const POPULAR_DESTINATIONS = ['Đà Nẵng', 'Hội An', 'Phú Quốc', 'Nha Trang', 'Hà Nội', 'TP HCM', 'Sa Pa', 'Huế'];

const HeroBanner = ({ compact = false }) => {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [formData, setFormData] = useState({
        checkIn: '',
        checkOut: '',
        guests: 2,
    });
    const [isLoading, setIsLoading] = useState(false);

    const destinationSuggestions = useHotelAutocomplete(searchValue);
    const showSuggestions = isSearchFocused && searchValue.trim() && destinationSuggestions.length > 0;

    // Floating particles - use client-side only
    useEffect(() => {
        if (compact || typeof window === 'undefined') return;
        const container = document.getElementById('particles-container');
        if (!container) return;
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = styles.particle;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.animationDuration = `${15 + Math.random() * 10}s`;
            container.appendChild(particle);
        }
        return () => {
            if (container) container.innerHTML = '';
        };
    }, [compact]);

    // Auto-rotate slides
    const goTo = useCallback((index) => {
        if (isAnimating) return;
        setIsAnimating(true);
        setCurrent(index);
        setTimeout(() => setIsAnimating(false), 800);
    }, [isAnimating]);

    useEffect(() => {
        if (compact) return;
        const timer = setInterval(() => goTo((current + 1) % SLIDES.length), 6000);
        return () => clearInterval(timer);
    }, [current, goTo, compact]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchValue.trim()) return;

        setIsLoading(true);
        
        // Simulate brief loading
        await new Promise(resolve => setTimeout(resolve, 800));

        const params = new URLSearchParams({
            destination: searchValue.trim(),
            checkIn: formData.checkIn || new Date().toISOString().split('T')[0],
            checkOut: formData.checkOut || new Date(Date.now() + 86400000).toISOString().split('T')[0],
            adults: String(formData.guests),
            children: '0',
            rooms: '1',
        });

        router.push(`/hotels/search?${params.toString()}`);
        setIsLoading(false);
    };

    const selectSuggestion = (value) => {
        setSearchValue(value);
        setIsSearchFocused(false);
    };

    return (
        <section className={`${styles.heroBanner} ${compact ? styles.compact : ''}`}>
            {/* Animated gradient background */}
            {!compact && (
                <div className={styles.gradientBg}>
                    {SLIDES.map((slide, i) => (
                        <div
                            key={i}
                            className={`${styles.gradientSlide} ${i === current ? styles.active : ''}`}
                            style={{ background: slide.gradient }}
                        />
                    ))}
                    <div className={styles.gradientOverlay} />
                </div>
            )}

            {/* Floating particles */}
            {!compact && <div id="particles-container" className={styles.particles} />}

            {/* Decorative shapes */}
            {!compact && (
                <>
                    <div className={styles.shape1} />
                    <div className={styles.shape2} />
                    <div className={styles.shape3} />
                </>
            )}

            {/* Content */}
            <div className={styles.heroContent}>
                {!compact && (
                    <div className={`${styles.heroText} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
                        <div className={styles.badge}>
                            <FaPlane /> Khám phá ngay hôm nay
                        </div>
                        <h1 className={styles.heroTitle}>
                            {SLIDES[current].title}
                        </h1>
                        <p className={styles.heroSubtitle}>
                            {SLIDES[current].subtitle}
                        </p>
                        
                        {/* Slide indicators */}
                        <div className={styles.slideIndicators}>
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    className={`${styles.indicator} ${i === current ? styles.indicatorActive : ''}`}
                                    onClick={() => goTo(i)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Search Card - Glassmorphism */}
                <div className={`${styles.searchCard} ${isSearchFocused ? styles.searchCardFocused : ''}`}>
                    <div className={styles.searchTabs}>
                        <button className={`${styles.searchTab} ${styles.searchTabActive}`}>
                            <FaHotel /> Khách sạn
                        </button>
                        <button className={styles.searchTab}>
                            <FaPlane /> Vé máy bay
                        </button>
                        <button className={styles.searchTab}>
                            <FaUmbrellaBeach /> Tour
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className={styles.searchForm}>
                        {/* Destination */}
                        <div className={styles.searchField}>
                            <label className={styles.fieldLabel}>
                                <FaMapMarkerAlt /> Điểm đến
                            </label>
                            <div className={styles.autocompleteWrapper}>
                                <input
                                    type="text"
                                    placeholder="Bạn muốn đến đâu?"
                                    className={styles.fieldInput}
                                    value={searchValue}
                                    onChange={(e) => setSearchValue(e.target.value)}
                                    onFocus={() => setIsSearchFocused(true)}
                                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                                />
                                
                                {showSuggestions && (
                                    <div className={styles.suggestionsDropdown}>
                                        {destinationSuggestions.map((item, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                className={styles.suggestionItem}
                                                onClick={() => selectSuggestion(item.value)}
                                            >
                                                <span className={styles.suggestionIcon}>{getIconForType(item.type)}</span>
                                                <div className={styles.suggestionContent}>
                                                    <span className={styles.suggestionMain}>{item.value}</span>
                                                    {item.detail && <span className={styles.suggestionDetail}>{item.detail}</span>}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Date inputs */}
                        <div className={styles.dateFields}>
                            <div className={styles.searchField}>
                                <label className={styles.fieldLabel}>
                                    <FaCalendarAlt /> Check-in
                                </label>
                                <input
                                    type="date"
                                    className={styles.fieldInput}
                                    value={formData.checkIn}
                                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                                />
                            </div>
                            <div className={styles.dateDivider}>
                                <FaChevronDown />
                            </div>
                            <div className={styles.searchField}>
                                <label className={styles.fieldLabel}>
                                    <FaCalendarAlt /> Check-out
                                </label>
                                <input
                                    type="date"
                                    className={styles.fieldInput}
                                    value={formData.checkOut}
                                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Guests */}
                        <div className={styles.searchField}>
                            <label className={styles.fieldLabel}>
                                <FaUsers /> Khách
                            </label>
                            <select
                                className={styles.fieldSelect}
                                value={formData.guests}
                                onChange={(e) => setFormData({ ...formData, guests: parseInt(e.target.value) })}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                    <option key={n} value={n}>{n} {n === 1 ? 'khách' : 'khách'}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Button */}
                        <button type="submit" className={styles.searchButton} disabled={isLoading}>
                            {isLoading ? (
                                <><FaSpinner className={styles.spinner} /> Đang tìm...</>
                            ) : (
                                <><FaSearch /> Tìm kiếm</>
                            )}
                        </button>
                    </form>

                    {/* Quick destinations */}
                    {!compact && (
                        <div className={styles.quickDestinations}>
                            <span className={styles.quickLabel}>Điểm đến phổ biến:</span>
                            <div className={styles.quickChips}>
                                {POPULAR_DESTINATIONS.slice(0, 5).map((dest) => (
                                    <button
                                        key={dest}
                                        type="button"
                                        className={styles.quickChip}
                                        onClick={() => setSearchValue(dest)}
                                    >
                                        {dest}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {!compact && (
                    <div className={styles.heroStats}>
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>5K+</span>
                            <span className={styles.statLabel}>Khách sạn</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>100K+</span>
                            <span className={styles.statLabel}>Đơn đặt</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>4.9</span>
                            <span className={styles.statLabel}>Đánh giá</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <span className={styles.statNumber}>24/7</span>
                            <span className={styles.statLabel}>Hỗ trợ</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default HeroBanner;

'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaStar, FaMapMarkerAlt, FaHotel, FaSearch, FaArrowRight } from 'react-icons/fa';
import { MdExplore, MdTrendingUp, MdHistory } from 'react-icons/md';
import styles from './ExclusiveHotelSearch.module.css';
import useHotelAutocomplete from '@/hooks/useHotelAutocomplete';

const TABS = [
    { id: 'SPECIAL', label: 'Ưu đãi đặc biệt', icon: <FaStar /> },
    { id: 'LAST', label: 'Tìm kiếm gần đây', icon: <MdHistory /> },
    { id: 'TRENDING', label: 'Điểm đến thịnh hành', icon: <MdTrendingUp /> },
    { id: 'REVIEWED', label: 'Đánh giá cao nhất', icon: <MdExplore /> },
];

/* Pinned destinations on the world map — absolute positions (% of container) */
const DESTINATIONS = [
    { id: 1, name: 'Belgium', hotels: 124, rating: 4.7, x: 44, y: 22, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80' },
    { id: 2, name: 'Amsterdam', hotels: 310, rating: 4.6, x: 72, y: 20, img: 'https://images.unsplash.com/photo-1468422883756-a899bac1fa05?w=120&q=80' },
    { id: 3, name: 'New Jersey', hotels: 89, rating: 4.5, x: 22, y: 30, img: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?w=120&q=80' },
    { id: 4, name: 'Nepal', hotels: 56, rating: 4.8, x: 56, y: 40, img: 'https://images.unsplash.com/photo-1585938389612-a552f28f9ddd?w=120&q=80' },
    { id: 5, name: 'Gothenburg', hotels: 78, rating: 4.5, x: 74, y: 45, img: 'https://images.unsplash.com/photo-1509537257950-20f802b8a394?w=120&q=80' },
];

export default function ExclusiveHotelSearch() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('SPECIAL');
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const suggestions = useHotelAutocomplete(query, {
        fallbackSuggestions: DESTINATIONS.map((item) => ({ value: item.name, type: 'Diem den' })),
    });

    const showSuggestions = isFocused && query.trim().length > 0 && suggestions.length > 0;

    const handleSearch = () => {
        const destination = query.trim();
        if (!destination) return;
        router.push(`/hotels/search?destination=${encodeURIComponent(destination)}`);
    };

    const selectSuggestion = (value) => {
        setQuery(value);
        setIsFocused(false);
        setActiveSuggestionIndex(-1);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (showSuggestions && activeSuggestionIndex >= 0) {
                e.preventDefault();
                selectSuggestion(suggestions[activeSuggestionIndex].value);
                return;
            }

            e.preventDefault();
            handleSearch();
            return;
        }

        if (!showSuggestions) {
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev <= 0 ? suggestions.length - 1 : prev - 1));
            return;
        }

        if (e.key === 'Escape') {
            setIsFocused(false);
            setActiveSuggestionIndex(-1);
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <h2 className={styles.title}>Tìm Kiếm Khách Sạn Độc Quyền!</h2>

                    {/* Search bar */}
                    <div className={styles.searchBar}>
                        <FaSearch className={styles.searchIcon} />
                        <div className={styles.searchInputWrap}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Tìm kiếm khách sạn, khu vực, điểm đến..."
                                value={query}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setIsFocused(false);
                                        setActiveSuggestionIndex(-1);
                                    }, 120);
                                }}
                                onKeyDown={handleInputKeyDown}
                                onChange={e => {
                                    setQuery(e.target.value);
                                    setActiveSuggestionIndex(-1);
                                }}
                            />

                            {showSuggestions && (
                                <ul className={styles.suggestionList}>
                                    {suggestions.map((item, idx) => (
                                        <li key={`${item.type}-${item.value}`}>
                                            <button
                                                type="button"
                                                className={`${styles.suggestionItem} ${idx === activeSuggestionIndex ? styles.suggestionItemActive : ''}`}
                                                onMouseEnter={() => setActiveSuggestionIndex(idx)}
                                                onMouseDown={() => selectSuggestion(item.value)}
                                            >
                                                <span className={styles.suggestionMain}>{item.value}</span>
                                                <span className={styles.suggestionType}>{item.type}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button className={styles.searchBtn} onClick={handleSearch}>Tìm kiếm</button>
                    </div>

                    {/* Tabs */}
                    <div className={styles.tabs}>
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className={styles.tabIcon}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* World Map + Pins */}
                <div className={styles.mapWrapper}>
                    {/* Map background */}
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png"
                        alt="World map"
                        className={styles.mapBg}
                        onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1589519160732-57fc498494f8?w=1200&q=80';
                        }}
                    />
                    <div className={styles.mapOverlay} />

                    {/* Destination pins */}
                    {DESTINATIONS.map(dest => (
                        <DestinationPin key={dest.id} dest={dest} />
                    ))}
                </div>

            </div>
        </section>
    );
}

function DestinationPin({ dest }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={styles.pin}
            style={{ left: `${dest.x}%`, top: `${dest.y}%` }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Card popup */}
            {hovered && (
                <div className={styles.pinCard}>
                    <img src={dest.img} alt={dest.name} className={styles.pinCardImg} />
                    <div className={styles.pinCardBody}>
                        <h4 className={styles.pinCardName}>{dest.name}</h4>
                        <div className={styles.pinCardMeta}>
                            <span><FaHotel /> {dest.hotels} khách sạn</span>
                            <span><FaStar className={styles.pinStar} /> {dest.rating}</span>
                        </div>
                        <button className={styles.pinCardBtn}>
                            Xem ngay <FaArrowRight />
                        </button>
                    </div>
                </div>
            )}

            {/* Dot */}
            <div className={styles.pinDot} />
            {/* Location label */}
            <div className={styles.pinLabel}>
                <img src={dest.img} alt={dest.name} className={styles.pinThumb} />
                <div>
                    <p className={styles.pinName}>{dest.name}</p>
                    <p className={styles.pinCount}><FaMapMarkerAlt /> {dest.hotels} khách sạn</p>
                </div>
            </div>
        </div>
    );
}

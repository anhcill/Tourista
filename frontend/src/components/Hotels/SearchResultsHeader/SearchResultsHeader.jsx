'use client';

import { useState } from 'react';
import styles from './SearchResultsHeader.module.css';
import { FaMapMarkerAlt, FaChevronDown, FaMap, FaList } from 'react-icons/fa';

const SORT_OPTIONS = [
  'Lựa chọn hàng đầu cho gia đình',
  'Giá thấp nhất trước',
  'Đánh giá cao nhất',
  'Khoảng cách gần nhất',
  'Ưu đãi tốt nhất',
];

export default function SearchResultsHeader({ city = 'Gothenburg', count = 120, onViewChange = null }) {
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState(SORT_OPTIONS[0]);
  const [view, setView] = useState('list');

  const handleSort = (opt) => {
    setSortValue(opt);
    setSortOpen(false);
  };

  return (
    <div className={styles.header}>
      {/* Left: city + count */}
      <div className={styles.cityInfo}>
        <FaMapMarkerAlt className={styles.pinIcon} />
        <div>
          <h2 className={styles.cityName}>{city} — {count} Chỗ ở được tìm thấy</h2>
          <p className={styles.description}>
            Khám phá những khách sạn tốt nhất và chỗ nghỉ dưỡng tuyệt vời tại {city}
          </p>
        </div>
      </div>

      {/* Right: sort + view toggle */}
      <div className={styles.controls}>
        {/* View toggle */}
        <div className={styles.viewToggle}>
          <button
            className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`}
            onClick={() => { setView('list'); onViewChange?.('list'); }}
            title="Danh sách"
          >
            <FaList />
          </button>
          <button
            className={`${styles.viewBtn} ${view === 'map' ? styles.viewBtnActive : ''}`}
            onClick={() => { setView('map'); onViewChange?.('map'); }}
            title="Bản đồ"
          >
            <FaMap />
          </button>
        </div>

        {/* Sort dropdown */}
        <div className={styles.sortWrapper}>
          <span className={styles.sortLabel}>Sắp xếp theo:</span>
          <div className={styles.sortDropdown}>
            <button className={styles.sortBtn} onClick={() => setSortOpen(!sortOpen)}>
              <span>{sortValue}</span>
              <FaChevronDown size={11} />
            </button>
            {sortOpen && (
              <ul className={styles.sortMenu}>
                {SORT_OPTIONS.map((opt) => (
                  <li
                    key={opt}
                    className={`${styles.sortOption} ${sortValue === opt ? styles.sortOptionActive : ''}`}
                    onClick={() => handleSort(opt)}
                  >
                    {opt}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

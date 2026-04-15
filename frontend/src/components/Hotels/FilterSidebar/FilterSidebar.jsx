'use client';

import { useState } from 'react';
import styles from './FilterSidebar.module.css';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

const POPULAR_FILTERS = [
  { id: 'breakfast', label: 'Bao gồm bữa sáng' },
  { id: 'allInclusive', label: 'Tất cả đã bao gồm' },
  { id: 'freeCancellation', label: 'Hủy miễn phí' },
  { id: 'pool', label: 'Hồ bơi' },
  { id: 'petFriendly', label: 'Thân thiện với thú cưng' },
  { id: 'wifi', label: 'Wi-Fi miễn phí' },
];

const ROOM_FACILITIES = [
  { id: 'aircon', label: 'Điều hòa nhiệt độ' },
  { id: 'balcony', label: 'Ban công' },
  { id: 'bathtub', label: 'Bồn tắm' },
  { id: 'kitchen', label: 'Bếp / Bếp nhỏ' },
  { id: 'washingMachine', label: 'Máy giặt' },
];

const GUEST_RATINGS = [
  { id: 'any', label: 'Bất kỳ' },
  { id: 'wonderful', label: 'Tuyệt vời: 9+' },
  { id: 'veryGood', label: 'Rất tốt: 8+' },
  { id: 'good', label: 'Tốt: 7+' },
  { id: 'pleasant', label: 'Dễ chịu: 6+' },
];

const BED_TYPES = [
  { id: 'single', label: 'Giường đơn' },
  { id: 'double', label: 'Giường đôi' },
  { id: 'twin', label: 'Giường đôi riêng' },
  { id: 'king', label: 'Giường king size' },
];

const STARS = [5, 4, 3, 2, 1];

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.section}>
      <button className={styles.sectionHeader} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
}

const DEFAULT_FILTERS = {
  budget: [0, 20000000],
  popular: [],
  facilities: [],
  guestRating: 'any',
  stars: [],
  sustainability: [],
};

export default function FilterSidebar({ filters = DEFAULT_FILTERS, setFilters = () => {} }) {
  const [showAllFilters, setShowAllFilters] = useState(false);

  // Helper toggle function for arrays
  const toggleArrayItem = (array, id) => {
    if (array.includes(id)) {
      return array.filter((item) => item !== id);
    }
    return [...array, id];
  };

  const visibleFilters = showAllFilters ? POPULAR_FILTERS : POPULAR_FILTERS.slice(0, 5);

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.sidebarTitle}>Lọc theo</h3>

      {/* Budget */}
      <CollapsibleSection title="Ngân sách mỗi đêm">
        <div className={styles.budgetRow}>
          <span className={styles.budgetLabel}>Giá thấp nhất</span>
          <span className={styles.budgetLabel}>Giá cao nhất</span>
        </div>
        <div className={styles.budgetInputs}>
          <input
            type="number"
            className={styles.budgetInput}
            value={filters.budget[0]}
            min={0}
            max={filters.budget[1]}
            onChange={(e) => setFilters({ ...filters, budget: [Number(e.target.value), filters.budget[1]] })}
          />
          <span className={styles.budgetDash}>—</span>
          <input
            type="number"
            className={styles.budgetInput}
            value={filters.budget[1]}
            min={filters.budget[0]}
            max={20000000}
            onChange={(e) => setFilters({ ...filters, budget: [filters.budget[0], Number(e.target.value)] })}
          />
        </div>
        <input
          type="range"
          className={styles.rangeSlider}
          min={0}
          max={20000000}
          step={100000}
          value={filters.budget[1]}
          onChange={(e) => setFilters({ ...filters, budget: [filters.budget[0], Number(e.target.value)] })}
        />
        <div className={styles.budgetHints}>
           <span className={styles.hintValue}>0đ</span>
           <span className={styles.hintValue}>20,000,000đ+</span>
        </div>
      </CollapsibleSection>

      {/* Popular Filters */}
      <CollapsibleSection title="Bộ lọc phổ biến">
        <ul className={styles.checkList}>
          {visibleFilters.map((f) => (
            <li key={f.id}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={filters.popular.includes(f.id)}
                  onChange={() => setFilters({ ...filters, popular: toggleArrayItem(filters.popular, f.id) })}
                />
                <span className={styles.checkText}>{f.label}</span>
              </label>
            </li>
          ))}
        </ul>
        {!showAllFilters && (
          <button className={styles.showMore} onClick={() => setShowAllFilters(true)}>
            Xem thêm
          </button>
        )}
      </CollapsibleSection>

      {/* Room Facilities */}
      <CollapsibleSection title="Tiện nghi phòng">
        <ul className={styles.checkList}>
          {ROOM_FACILITIES.map((f) => (
            <li key={f.id}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={filters.facilities.includes(f.id)}
                  onChange={() => setFilters({ ...filters, facilities: toggleArrayItem(filters.facilities, f.id) })}
                />
                <span className={styles.checkText}>{f.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Guest Rating */}
      <CollapsibleSection title="Đánh giá của khách">
        <ul className={styles.checkList}>
          {GUEST_RATINGS.map((r) => (
            <li key={r.id}>
              <label className={styles.checkLabel}>
                <input
                  type="radio"
                  className={styles.checkbox}
                  name="guestRating"
                  checked={filters.guestRating === r.id}
                  onChange={() => setFilters({ ...filters, guestRating: r.id })}
                />
                <span className={styles.checkText}>{r.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Stars */}
      <CollapsibleSection title="Phân loại chỗ ở" defaultOpen={false}>
        <ul className={styles.checkList}>
          {STARS.map((s) => (
            <li key={s}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={filters.stars.includes(s)}
                  onChange={() => setFilters({ ...filters, stars: toggleArrayItem(filters.stars, s) })}
                />
                <span className={styles.starText}>
                  {'★'.repeat(s)}{'☆'.repeat(5 - s)}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Travel Sustainability */}
      <CollapsibleSection title="Du lịch bền vững" defaultOpen={false}>
        <ul className={styles.checkList}>
          {[1, 2, 3, 4, 5].map((level) => (
            <li key={level}>
              <label className={styles.checkLabel}>
                <input 
                  type="checkbox" 
                  className={styles.checkbox} 
                  checked={filters.sustainability.includes(level)}
                  onChange={() => setFilters({ ...filters, sustainability: toggleArrayItem(filters.sustainability, level) })}
                />
                <span className={styles.checkText}>Cấp độ {level}</span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </aside>
  );
}

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

export default function FilterSidebar() {
  const [budget, setBudget] = useState([0, 500]);
  const [checkedFilters, setCheckedFilters] = useState({ freeCancellation: true });
  const [checkedRooms, setCheckedRooms] = useState({});
  const [guestRating, setGuestRating] = useState('any');
  const [checkedBeds, setCheckedBeds] = useState({});
  const [checkedStars, setCheckedStars] = useState({});
  const [showAllFilters, setShowAllFilters] = useState(false);

  const toggleCheck = (state, setter, id) => {
    setter({ ...state, [id]: !state[id] });
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
            value={budget[0]}
            min={0}
            max={budget[1]}
            onChange={(e) => setBudget([Number(e.target.value), budget[1]])}
          />
          <span className={styles.budgetDash}>—</span>
          <input
            type="number"
            className={styles.budgetInput}
            value={budget[1]}
            min={budget[0]}
            max={2000}
            onChange={(e) => setBudget([budget[0], Number(e.target.value)])}
          />
        </div>
        <input
          type="range"
          className={styles.rangeSlider}
          min={0}
          max={2000}
          value={budget[1]}
          onChange={(e) => setBudget([budget[0], Number(e.target.value)])}
        />
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
                  checked={!!checkedFilters[f.id]}
                  onChange={() => toggleCheck(checkedFilters, setCheckedFilters, f.id)}
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
                  checked={!!checkedRooms[f.id]}
                  onChange={() => toggleCheck(checkedRooms, setCheckedRooms, f.id)}
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
                  checked={guestRating === r.id}
                  onChange={() => setGuestRating(r.id)}
                />
                <span className={styles.checkText}>{r.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>

      {/* Bed Type */}
      <CollapsibleSection title="Loại giường" defaultOpen={false}>
        <ul className={styles.checkList}>
          {BED_TYPES.map((b) => (
            <li key={b.id}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={!!checkedBeds[b.id]}
                  onChange={() => toggleCheck(checkedBeds, setCheckedBeds, b.id)}
                />
                <span className={styles.checkText}>{b.label}</span>
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
                  checked={!!checkedStars[s]}
                  onChange={() => toggleCheck(checkedStars, setCheckedStars, s)}
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
                <input type="checkbox" className={styles.checkbox} />
                <span className={styles.checkText}>Cấp độ {level}</span>
              </label>
            </li>
          ))}
        </ul>
      </CollapsibleSection>
    </aside>
  );
}

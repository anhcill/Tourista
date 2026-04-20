'use client';

import { useState, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt } from 'react-icons/fa';
import styles from './PriceCalendar.module.css';

const MONTHS_VI = [
  'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
  'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

const DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const formatVND = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(price || 0);

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday-based
}

function addMonths(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth() + n, 1);
  return d;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function isInRange(date, start, end) {
  if (!start || !end) return false;
  const d = new Date(date);
  return d > start && d < end;
}

function formatDateStr(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function PriceCalendar({
  basePricePerNight = 1000000,
  pricingRules = [],
  selectedCheckIn,
  selectedCheckOut,
  onSelectDates,
  minDate = new Date(),
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewDate, setViewDate] = useState(() => {
    if (selectedCheckIn) return new Date(selectedCheckIn);
    return today;
  });

  const [hoverDate, setHoverDate] = useState(null);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOffset = getFirstDayOfMonth(viewYear, viewMonth);

  const prevMonth = addMonths(viewDate, -1);
  const nextMonth = addMonths(viewDate, 1);

  // Build price map: date string -> price
  const priceMap = useMemo(() => {
    const map = {};
    // Default price
    const start = new Date(today);
    for (let i = 0; i < 365; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = formatDateStr(d);
      let price = basePricePerNight;

      // Apply pricing rules
      pricingRules.forEach((rule) => {
        const ruleDate = new Date(rule.date || rule.startDate);
        if (isSameDay(d, ruleDate)) {
          if (rule.type === 'PERCENTAGE') {
            price = Math.round(price * (1 - (rule.value || 0) / 100));
          } else if (rule.type === 'FIXED') {
            price = rule.value || price;
          } else if (rule.type === 'SEASON') {
            price = Math.round(price * (1 + (rule.adjustment || 0) / 100));
          }
        }
      });

      // Weekend pricing
      const dayOfWeek = d.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        price = Math.round(price * 1.15);
      }

      map[key] = price;
    }
    return map;
  }, [basePricePerNight, pricingRules, today]);

  const checkInDate = selectedCheckIn ? new Date(selectedCheckIn) : null;
  const checkOutDate = selectedCheckOut ? new Date(selectedCheckOut) : null;

  const cells = useMemo(() => {
    const result = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOffset; i++) {
      result.push({ type: 'empty' });
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewYear, viewMonth, day);
      const dateStr = formatDateStr(date);
      const price = priceMap[dateStr] || basePricePerNight;
      const isPast = date < today;
      const isToday = isSameDay(date, today);
      const isCheckIn = isSameDay(date, checkInDate);
      const isCheckOut = isSameDay(date, checkOutDate);
      const isRange = isInRange(date, checkInDate, checkOutDate);
      const isHover = !checkInDate && hoverDate && date > today && date <= hoverDate;

      // Calculate price tier
      const priceRatio = price / basePricePerNight;
      let priceTier = 'normal';
      if (priceRatio > 1.2) priceTier = 'high';
      else if (priceRatio > 1.05) priceTier = 'medium';
      else if (priceRatio < 0.9) priceTier = 'low';

      result.push({
        type: 'day',
        day,
        date,
        dateStr,
        price,
        isPast,
        isToday,
        isCheckIn,
        isCheckOut,
        isRange,
        isHover,
        priceTier,
      });
    }

    return result;
  }, [viewYear, viewMonth, daysInMonth, firstDayOffset, priceMap, basePricePerNight, today, checkInDate, checkOutDate, hoverDate]);

  const handleCellClick = (cell) => {
    if (cell.isPast || cell.type === 'empty') return;

    if (!checkInDate || (checkInDate && checkOutDate)) {
      // Start new selection: set check-in
      onSelectDates(cell.dateStr, null);
    } else {
      // Set check-out
      if (cell.date <= checkInDate) {
        onSelectDates(cell.dateStr, null);
      } else {
        onSelectDates(formatDateStr(checkInDate), cell.dateStr);
      }
    }
  };

  const handleCellHover = (cell) => {
    if (!checkInDate && cell.type === 'day' && !cell.isPast) {
      setHoverDate(cell.date);
    }
  };

  const handleClear = () => {
    onSelectDates(null, null);
  };

  // Summary
  const selectedNights = checkInDate && checkOutDate
    ? Math.max(1, Math.ceil((checkOutDate - checkInDate) / 86400000))
    : 0;
  const totalPrice = checkInDate && checkOutDate
    ? Array.from({ length: selectedNights }, (_, i) => {
        const d = new Date(checkInDate);
        d.setDate(d.getDate() + i);
        return priceMap[formatDateStr(d)] || basePricePerNight;
      }).reduce((sum, p) => sum + p, 0)
    : 0;

  return (
    <div className={styles.calendar}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.title}>
            <FaCalendarAlt className={styles.titleIcon} />
            <span>Lịch giá phòng</span>
          </div>
          {(checkInDate || checkOutDate) && (
            <button className={styles.clearBtn} onClick={handleClear}>Xóa</button>
          )}
        </div>

        {/* Month navigation */}
        <div className={styles.monthNav}>
          <button
            className={styles.navBtn}
            onClick={() => setViewDate(prevMonth)}
            disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
          >
            <FaChevronLeft />
          </button>
          <span className={styles.monthLabel}>
            {MONTHS_VI[viewMonth]} {viewYear}
          </span>
          <button className={styles.navBtn} onClick={() => setViewDate(nextMonth)}>
            <FaChevronRight />
          </button>
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendLow}`} />
            <span>Giá thấp</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendNormal}`} />
            <span>Bình thường</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendMedium}`} />
            <span>Cuối tuần</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendHigh}`} />
            <span>Cao mùa</span>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className={styles.dayHeaders}>
        {DAYS_VI.map((day) => (
          <span key={day} className={styles.dayHeader}>{day}</span>
        ))}
      </div>

      {/* Calendar grid */}
      <div className={styles.grid}>
        {cells.map((cell, idx) => {
          if (cell.type === 'empty') {
            return <div key={`empty-${idx}`} className={styles.emptyCell} />;
          }

          const isRangeStart = cell.isCheckIn;
          const isRangeEnd = cell.isCheckOut;
          const isInSelectedRange = cell.isRange;
          const isSingleSelected = cell.isCheckIn && !checkOutDate;

          return (
            <div
              key={cell.dateStr}
              className={[
                styles.cell,
                cell.isPast ? styles.past : '',
                cell.isToday ? styles.today : '',
                isRangeStart ? styles.rangeStart : '',
                isRangeEnd ? styles.rangeEnd : '',
                isInSelectedRange ? styles.inRange : '',
                isSingleSelected ? styles.singleSelected : '',
                cell.isHover ? styles.hoverRange : '',
                cell.priceTier !== 'normal' ? styles[`price${cell.priceTier.charAt(0).toUpperCase() + cell.priceTier.slice(1)}`] : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleCellClick(cell)}
              onMouseEnter={() => handleCellHover(cell)}
              onMouseLeave={() => setHoverDate(null)}
            >
              <span className={styles.dayNum}>{cell.day}</span>
              {!cell.isPast && (
                <span className={styles.dayPrice}>
                  {formatVND(cell.price).replace('₫', '').trim()}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {(checkInDate || checkOutDate) && (
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Check-in</span>
              <span className={styles.summaryValue}>
                {checkInDate
                  ? `${checkInDate.getDate()}/${checkInDate.getMonth() + 1}/${checkInDate.getFullYear()}`
                  : '— Chọn ngày —'}
              </span>
            </div>
            <span className={styles.summaryArrow}>→</span>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Check-out</span>
              <span className={styles.summaryValue}>
                {checkOutDate
                  ? `${checkOutDate.getDate()}/${checkOutDate.getMonth() + 1}/${checkOutDate.getFullYear()}`
                  : checkInDate ? '— Chọn ngày —' : '— Chọn ngày —'}
              </span>
            </div>
          </div>
          {selectedNights > 0 && (
            <>
              <div className={styles.summaryNights}>
                {selectedNights} đêm · {formatVND(totalPrice)}
              </div>
              <button
                className={styles.bookBtn}
                onClick={() => {
                  if (checkInDate && checkOutDate) {
                    // Navigate to booking
                    const params = new URLSearchParams({
                      checkIn: formatDateStr(checkInDate),
                      checkOut: formatDateStr(checkOutDate),
                    });
                    window.location.href = `?${params.toString()}`;
                  }
                }}
              >
                Đặt với giá này
              </button>
            </>
          )}
        </div>
      )}

      <p className={styles.hint}>
        Nhấn ngày để chọn check-in, nhấn lần nữa để chọn check-out
      </p>
    </div>
  );
}

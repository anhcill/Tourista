'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaMapMarkerAlt, FaCalendarAlt, FaUserFriends, FaSearch } from 'react-icons/fa';
import styles from './DetailTopSearchBar.module.css';

const toDateInput = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getToday = () => toDateInput(new Date());

const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateInput(d);
};

export default function DetailTopSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialState = useMemo(() => {
    return {
      destination: searchParams.get('destination') || '',
      checkIn: searchParams.get('checkIn') || getToday(),
      checkOut: searchParams.get('checkOut') || getTomorrow(),
      adults: Number(searchParams.get('adults') || 2),
      children: Number(searchParams.get('children') || 0),
      rooms: Number(searchParams.get('rooms') || 1),
    };
  }, [searchParams]);

  const [form, setForm] = useState(initialState);

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const params = new URLSearchParams({
      destination: form.destination.trim(),
      checkIn: form.checkIn || getToday(),
      checkOut: form.checkOut || getTomorrow(),
      adults: String(Math.max(1, Number(form.adults) || 1)),
      children: String(Math.max(0, Number(form.children) || 0)),
      rooms: String(Math.max(1, Number(form.rooms) || 1)),
    });

    router.push(`/hotels/search?${params.toString()}`);
  };

  return (
    <section className={styles.wrap}>
      <form className={styles.bar} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>
            <FaMapMarkerAlt />
            Điểm đến
          </label>
          <input
            className={styles.input}
            type="text"
            value={form.destination}
            onChange={(e) => update('destination', e.target.value)}
            placeholder="Nhập khách sạn hoặc thành phố"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <FaCalendarAlt />
            Nhận phòng - Trả phòng
          </label>
          <div className={styles.dateRow}>
            <input
              className={styles.input}
              type="date"
              value={form.checkIn}
              onChange={(e) => update('checkIn', e.target.value)}
            />
            <input
              className={styles.input}
              type="date"
              value={form.checkOut}
              onChange={(e) => update('checkOut', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            <FaUserFriends />
            Khách
          </label>
          <div className={styles.guestRow}>
            <input
              className={styles.smallInput}
              type="number"
              min="1"
              value={form.adults}
              onChange={(e) => update('adults', e.target.value)}
              aria-label="Người lớn"
            />
            <input
              className={styles.smallInput}
              type="number"
              min="0"
              value={form.children}
              onChange={(e) => update('children', e.target.value)}
              aria-label="Trẻ em"
            />
            <input
              className={styles.smallInput}
              type="number"
              min="1"
              value={form.rooms}
              onChange={(e) => update('rooms', e.target.value)}
              aria-label="Phòng"
            />
          </div>
        </div>

        <button className={styles.searchBtn} type="submit">
          <FaSearch />
          Tìm khách sạn
        </button>
      </form>
    </section>
  );
}

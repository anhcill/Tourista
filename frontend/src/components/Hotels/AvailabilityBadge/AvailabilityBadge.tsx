'use client';

import { useEffect, useState, useCallback } from 'react';
import { FaFire, FaClock, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import availabilityApi from '@/api/availabilityApi';
import styles from './AvailabilityBadge.module.css';

export default function AvailabilityBadge({ hotelId, checkIn, checkOut, adults, rooms, roomTypeId, compact = false }) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!hotelId) return;
    try {
      setError(false);
      const data = await availabilityApi.getRoomAvailability(hotelId, { checkIn, checkOut, adults, rooms });
      const list = Array.isArray(data) ? data : (data?.result || []);
      setAvailability(list);
    } catch {
      setError(true);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId, checkIn, checkOut, adults, rooms]);

  useEffect(() => {
    void loadAvailability();
  }, [loadAvailability]);

  // Get urgency level for a room type or overall
  const getRoomAvailability = (id) => {
    if (roomTypeId) return availability.find((r) => r.roomTypeId === roomTypeId);
    if (id) return availability.find((r) => r.roomTypeId === id);
    return null;
  };

  const getOverallAvailability = () => {
    const total = availability.reduce((sum, r) => sum + (r.availableRooms || 0), 0);
    const totalRooms = availability.reduce((sum, r) => sum + (r.totalRooms || 0), 0);
    return { availableRooms: total, totalRooms };
  };

  if (loading) return null;
  if (error || availability.length === 0) return null;

  if (compact) {
    const overall = getOverallAvailability();
    const level = getUrgencyLevel(overall.availableRooms);
    if (!level || overall.availableRooms === 0) return null;
    return (
      <span className={`${styles.badge} ${styles[`badge${level}`]}`}>
        <UrgencyIcon level={level} />
        {overall.availableRooms === 1
          ? 'Còn 1 phòng!'
          : overall.availableRooms <= 5
          ? `Còn ${overall.availableRooms} phòng`
          : null}
      </span>
    );
  }

  return (
    <div className={styles.badgeList}>
      {availability.map((room) => {
        if (!room.availableRooms || room.availableRooms <= 0) return null;
        const level = getUrgencyLevel(room.availableRooms);
        if (!level) return null;

        return (
          <div key={room.roomTypeId} className={`${styles.badgeRow} ${styles[`badgeRow${level}`]}`}>
            <UrgencyIcon level={level} />
            <span className={styles.badgeText}>
              {room.availableRooms === 1
                ? `Còn 1 phòng ${room.roomTypeName || ''}!`
                : room.availableRooms <= 3
                ? `Chỉ còn ${room.availableRooms} phòng ${room.roomTypeName || ''}`
                : room.availableRooms <= 5
                ? `Còn ${room.availableRooms} phòng`
                : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function getUrgencyLevel(availableRooms) {
  if (!availableRooms || availableRooms <= 0) return null;
  if (availableRooms <= 2) return 'HIGH';
  if (availableRooms <= 5) return 'MEDIUM';
  return null;
}

function UrgencyIcon({ level }) {
  if (level === 'HIGH') return <FaFire className={styles.iconFire} />;
  if (level === 'MEDIUM') return <FaClock className={styles.iconClock} />;
  return <FaCheckCircle className={styles.iconCheck} />;
}

// Inline badge for room cards (no list)
export function RoomAvailabilityBadge({ availableRooms, className = '' }) {
  if (!availableRooms || availableRooms <= 0) {
    return (
      <span className={`${styles.inlineBadge} ${styles.soldOut} ${className}`}>
        Hết phòng
      </span>
    );
  }

  if (availableRooms === 1) {
    return (
      <span className={`${styles.inlineBadge} ${styles.badgeHigh} ${className}`}>
        <FaFire /> Chỉ còn 1 phòng!
      </span>
    );
  }

  if (availableRooms <= 3) {
    return (
      <span className={`${styles.inlineBadge} ${styles.badgeHigh} ${className}`}>
        <FaFire /> Còn {availableRooms} phòng
      </span>
    );
  }

  if (availableRooms <= 5) {
    return (
      <span className={`${styles.inlineBadge} ${styles.badgeMedium} ${className}`}>
        <FaClock /> Còn {availableRooms} phòng
      </span>
    );
  }

  return null;
}

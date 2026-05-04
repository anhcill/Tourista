'use client';

import { useRouter } from 'next/navigation';
import styles from './TourCard.module.css';
import { FaMapMarkerAlt, FaChevronRight, FaClock, FaMountain } from 'react-icons/fa';

const DIFFICULTY_MAP = {
  EASY: { label: 'Dễ đi', color: null },
  MEDIUM: { label: 'Trung bình', color: null },
  HARD: { label: 'Thử thách', color: null },
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80';

export default function TourCard({ tour, onClick = null }) {
  const router = useRouter();

  const {
    id,
    title = 'Tour du lịch',
    location = 'Việt Nam',
    image = null,
    durationDays = 1,
    durationNights = 0,
    difficulty = 'EASY',
    rating = 0,
    reviewCount = 0,
    priceAdult = 0,
    priceChild = 0,
    nearestDepartureDate = '',
    availableSlots = 0,
  } = tour || {};

  const displayImage = image && image.trim() ? image : FALLBACK_IMAGE;

  const formatVnd = (value) =>
    Number(value || 0).toLocaleString('vi-VN') + ' đ';

  const difficultyLabel = DIFFICULTY_MAP[difficulty]?.label || 'Dễ đi';

  const goToDetail = () => {
    if (!id) return;
    router.push(`/tours/${id}`);
  };

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetail();
        }
      }}
    >
      {/* ── IMAGE ─────────────────────────────── */}
      <div className={styles.imagePart}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayImage} alt={title} className={styles.tourImage} />

        {availableSlots > 0 && availableSlots <= 5 && (
          <div className={styles.urgencyBadge}>Còn {availableSlots} chỗ!</div>
        )}
      </div>

      {/* ── CONTENT ───────────────────────────── */}
      <div className={styles.content}>
        <div className={styles.topRow}>
          <div className={styles.titleBlock}>
            <h3 className={styles.tourTitle}>{title}</h3>
            <p className={styles.locationRow}>
              <FaMapMarkerAlt className={styles.locationIcon} />
              {location}
            </p>
          </div>

          <div className={styles.ratingBox}>
            <div className={styles.ratingScore}>{Number(rating || 0).toFixed(1)}</div>
            <div className={styles.ratingInfo}>
              {reviewCount > 0
                ? `${reviewCount.toLocaleString('vi-VN')} đánh giá`
                : 'Chưa có đánh giá'}
            </div>
          </div>
        </div>

        <div className={styles.metaRow}>
          <span className={styles.metaItem}>
            <FaClock size={11} />
            {durationDays}N{durationNights}Đ
          </span>
          <span className={styles.metaItem}>
            <FaMountain size={11} />
            {difficultyLabel}
          </span>
          {nearestDepartureDate && (
            <span className={styles.metaDate}>
              🗓 Khởi hành: {nearestDepartureDate}
            </span>
          )}
        </div>

        <div className={styles.bottomRow}>
          <div className={styles.priceCol}>
            <span className={styles.priceLabel}>Giá từ</span>
            <div className={styles.priceAdult}>{formatVnd(priceAdult)}</div>
            <div className={styles.priceSub}>/ người lớn</div>
            {priceChild > 0 && (
              <div className={styles.priceChild}>
                Trẻ em: {formatVnd(priceChild)}
              </div>
            )}
          </div>

          <button
            className={styles.ctaBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) {
                onClick();
              } else {
                goToDetail();
              }
            }}
          >
            Xem lịch trình <FaChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

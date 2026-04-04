"use client";

import { useRouter } from 'next/navigation';
import styles from './HotelCard.module.css';
import { FaMapMarkerAlt, FaLeaf, FaChevronRight } from 'react-icons/fa';
import { MdBreakfastDining } from 'react-icons/md';

export default function HotelCard({ hotel, onClick }) {
  const router = useRouter();

  const {
    id,
    name = 'Radisson Blu Hotel',
    location = 'Trung tâm thành phố, Cách biển 500m',
    image = null,
    amenities = ['Bao gồm bữa sáng'],
    guests = '1 Người lớn, 2 Trẻ em',
    nights = 4,
    originalPrice = 142,
    discountPrice = 125,
    discountPercent = 12,
    rating = 8.2,
    ratingLabel = 'Rất tốt',
    reviewCount = 2259,
    sustainableLevel = 5,
    urgency = 'Chỉ còn 8 phòng với giá này!',
  } = hotel || {};

  const formatVnd = (value) => {
    const amount = Number(value || 0);
    return amount.toLocaleString('vi-VN');
  };

  const goToDetail = () => {
    if (!id) return;
    router.push(`/hotels/${id}`);
  };

  return (
    <div
      className={styles.card}
      role="button"
      tabIndex={0}
      onClick={goToDetail}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          goToDetail();
        }
      }}
    >
      {/* Image */}
      <div className={styles.imagePart}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={name} className={styles.hotelImage} />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span>🏨</span>
          </div>
        )}
        {discountPercent > 0 && (
          <div className={styles.discountBadge}>{discountPercent}% Giảm</div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.topRow}>
          <div>
            <h3 className={styles.hotelName}>{name}</h3>
            <p className={styles.hotelLocation}>
              <FaMapMarkerAlt className={styles.locationIcon} />
              {location}
            </p>
          </div>
          <div className={styles.ratingBox}>
            <div className={styles.ratingScore}>{rating}</div>
            <div className={styles.ratingInfo}>
              <span className={styles.ratingLabel}>{ratingLabel}</span>
              <span className={styles.reviewCount}>{reviewCount.toLocaleString('vi-VN')} đánh giá</span>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className={styles.amenities}>
          {amenities.map((a, i) => (
            <span key={i} className={styles.amenityChip}>
              <MdBreakfastDining size={13} />
              {a}
            </span>
          ))}
        </div>

        {/* Trip info */}
        <div className={styles.tripInfo}>
          <span className={styles.tripDetail}>{guests}</span>
          <span className={styles.tripDot}>·</span>
          <span className={styles.tripDetail}>{nights} đêm</span>
        </div>

        {/* Badges row */}
        <div className={styles.badgesRow}>
          {sustainableLevel > 0 && (
            <span className={styles.sustainBadge}>
              <FaLeaf size={11} />
              Du lịch bền vững Cấp {sustainableLevel}
            </span>
          )}
          {urgency && <span className={styles.urgency}>{urgency}</span>}
        </div>

        {/* Bottom row: price + CTA */}
        <div className={styles.bottomRow}>
          <div className={styles.priceWrapper}>
            {originalPrice > discountPrice && (
              <span className={styles.originalPrice}>{formatVnd(originalPrice)} VND</span>
            )}
            <span className={styles.price}>{formatVnd(discountPrice)} VND</span>
            <span className={styles.perNight}>/ đêm</span>
          </div>
          <div className={styles.ctaGroup}>
            <p className={styles.taxNote}>Đã bao gồm thuế và phí</p>
            <button
              className={styles.ctaBtn}
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) onClick();
              }}
            >
              Xem chỗ trống <FaChevronRight size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

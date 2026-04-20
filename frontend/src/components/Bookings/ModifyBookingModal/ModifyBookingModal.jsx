'use client';

import { useState } from 'react';
import { FaCalendarAlt, FaUsers, FaDoorOpen, FaTimes, FaEdit } from 'react-icons/fa';
import styles from './ModifyBookingModal.module.css';

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const displayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatVND = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0);

export default function ModifyBookingModal({ booking, onClose, onConfirm }) {
  const isHotel = booking?.bookingType === 'HOTEL' || booking?.hotelId;

  const [form, setForm] = useState({
    checkIn: formatDate(booking?.checkIn),
    checkOut: formatDate(booking?.checkOut),
    adults: Number(booking?.adults || 2),
    children: Number(booking?.children || 0),
    rooms: Number(booking?.rooms || 1),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getTonight = () => formatDate(new Date());
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return formatDate(d);
  };

  const nights = form.checkIn && form.checkOut
    ? Math.max(1, Math.ceil((new Date(form.checkOut) - new Date(form.checkIn)) / 86400000))
    : 1;

  const newNights = nights;
  const basePricePerNight = Number(booking?.pricePerNight || booking?.roomPrice || 500000);
  const oldTotal = Number(booking?.totalAmount || basePricePerNight * (Number(booking?.nights || 1)) * (booking?.rooms || 1));
  const newTotal = basePricePerNight * newNights * form.rooms;
  const priceDiff = newTotal - oldTotal;

  const onField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.checkIn || !form.checkOut) {
      setError('Vui lòng chọn đầy đủ ngày check-in và check-out.');
      return;
    }

    if (new Date(form.checkIn) >= new Date(form.checkOut)) {
      setError('Ngày check-out phải sau ngày check-in.');
      return;
    }

    if (form.adults < 1) {
      setError('Phải có ít nhất 1 người lớn.');
      return;
    }

    if (isHotel && form.rooms < 1) {
      setError('Phải đặt ít nhất 1 phòng.');
      return;
    }

    // Check if booking is still modifiable
    if (booking?.status === 'CANCELLED' || booking?.status === 'COMPLETED') {
      setError('Không thể sửa đổi booking đã hủy hoặc đã hoàn tất.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onConfirm(form);
      onClose();
    } catch (err) {
      setError(err?.message || 'Không thể cập nhật booking. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <FaEdit className={styles.headerIcon} />
            <div>
              <h3>Sửa đổi booking</h3>
              <p className={styles.bookingCode}>{booking?.bookingCode}</p>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Đóng">
            <FaTimes />
          </button>
        </div>

        {/* Info bar */}
        <div className={styles.infoBar}>
          <span className={styles.bookingType}>
            {isHotel ? 'Khách sạn' : 'Tour'}: <strong>{booking?.hotelName || booking?.tourTitle}</strong>
          </span>
          <span className={`${styles.statusBadge} ${styles[booking?.status?.toLowerCase()]}`}>
            {booking?.status}
          </span>
        </div>

        {/* Modification Fields */}
        <div className={styles.body}>
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <FaCalendarAlt /> Ngày {isHotel ? 'nhận/trả phòng' : 'khởi hành'}
            </h4>
            <div className={styles.dateGrid}>
              <div className={styles.dateField}>
                <label>Check-in</label>
                <input
                  type="date"
                  value={form.checkIn}
                  min={getTonight()}
                  onChange={(e) => {
                    onField('checkIn', e.target.value);
                    if (!form.checkOut || new Date(e.target.value) >= new Date(form.checkOut)) {
                      const nextDay = new Date(e.target.value);
                      nextDay.setDate(nextDay.getDate() + 1);
                      onField('checkOut', formatDate(nextDay));
                    }
                  }}
                  className={styles.input}
                />
                {form.checkIn && (
                  <span className={styles.dateDisplay}>{displayDate(form.checkIn)}</span>
                )}
              </div>
              <div className={styles.dateField}>
                <label>Check-out</label>
                <input
                  type="date"
                  value={form.checkOut}
                  min={form.checkIn || getTonight()}
                  onChange={(e) => onField('checkOut', e.target.value)}
                  className={styles.input}
                />
                {form.checkOut && (
                  <span className={styles.dateDisplay}>{displayDate(form.checkOut)}</span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>
              <FaUsers /> Số khách
            </h4>
            <div className={styles.guestGrid}>
              <div className={styles.guestField}>
                <label>Người lớn</label>
                <div className={styles.counter}>
                  <button
                    type="button"
                    onClick={() => onField('adults', Math.max(1, form.adults - 1))}
                    disabled={form.adults <= 1}
                  >−</button>
                  <span>{form.adults}</span>
                  <button
                    type="button"
                    onClick={() => onField('adults', form.adults + 1)}
                  >+</button>
                </div>
              </div>
              <div className={styles.guestField}>
                <label>Trẻ em</label>
                <div className={styles.counter}>
                  <button
                    type="button"
                    onClick={() => onField('children', Math.max(0, form.children - 1))}
                    disabled={form.children <= 0}
                  >−</button>
                  <span>{form.children}</span>
                  <button
                    type="button"
                    onClick={() => onField('children', form.children + 1)}
                  >+</button>
                </div>
              </div>
              {isHotel && (
                <div className={styles.guestField}>
                  <label>Phòng</label>
                  <div className={styles.counter}>
                    <button
                      type="button"
                      onClick={() => onField('rooms', Math.max(1, form.rooms - 1))}
                      disabled={form.rooms <= 1}
                    >−</button>
                    <span>{form.rooms}</span>
                    <button
                      type="button"
                      onClick={() => onField('rooms', form.rooms + 1)}
                    >+</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Price Summary */}
          <div className={styles.priceSummary}>
            <div className={styles.priceRow}>
              <span>Giá ban đầu</span>
              <span>{formatVND(oldTotal)}</span>
            </div>
            <div className={styles.priceRow}>
              <span>Giá mới ({newNights} đêm × {form.rooms} phòng)</span>
              <span className={styles.newPrice}>{formatVND(newTotal)}</span>
            </div>
            <div className={`${styles.priceRow} ${styles.priceDiffRow}`}>
              <span>Chênh lệch {priceDiff >= 0 ? '(Thanh toán thêm)' : '(Hoàn tiền)'}</span>
              <span className={priceDiff >= 0 ? styles.payMore : styles.refund}>
                {priceDiff >= 0 ? '+' : '−'}{formatVND(Math.abs(priceDiff))}
              </span>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <strong>Lỗi:</strong> {error}
            </div>
          )}

          <div className={styles.noticeBox}>
            <strong>Lưu ý:</strong> Việc sửa đổi ngày hoặc số khách có thể ảnh hưởng đến giá phòng.
            Nếu có chênh lệch, bạn sẽ được yêu cầu thanh toán thêm hoặc được hoàn tiền.
            Booking đã xác nhận có thể không được sửa đổi ngay lập tức.
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </button>
          <button className={styles.confirmBtn} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Đang xử lý...' : 'Xác nhận sửa đổi'}
          </button>
        </div>
      </div>
    </div>
  );
}

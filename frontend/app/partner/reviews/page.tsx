'use client';

import { useCallback, useEffect, useState } from 'react';
import { FaStar, FaRegStar, FaSyncAlt, FaReply, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import partnerApi from '@/api/partnerApi';
import styles from './page.module.css';

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const StarRating = ({ rating }) => (
  <span className={styles.stars}>
    {[1, 2, 3, 4, 5].map((n) =>
      n <= rating ? (
        <FaStar key={n} className={styles.starFilled} />
      ) : (
        <FaRegStar key={n} className={styles.starEmpty} />
      )
    )}
  </span>
);

export default function PartnerReviewsPage() {
  const [reviews, setReviews] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [replyModal, setReplyModal] = useState<{
    id: unknown;
    userName: unknown;
    targetName: unknown;
    overallRating: unknown;
    comment: unknown;
    partnerReply: unknown;
    partnerRepliedAt: unknown;
  } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError('');

      const data = await partnerApi.getPartnerReviews();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setReviews(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách review.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const openReplyModal = (review: Record<string, unknown>) => {
    setReplyModal({
      id: review.id,
      userName: review.userName,
      targetName: review.targetName,
      overallRating: review.overallRating,
      comment: review.comment,
      partnerReply: review.partnerReply,
      partnerRepliedAt: review.createdAt,
    });
    setReplyText(String(review.partnerReply || ''));
  };

  const handleSubmitReply = async () => {
    if (!replyModal || !replyText.trim()) return;
    try {
      setSubmitting(true);
      await partnerApi.replyToReview(replyModal.id, replyText.trim());
      toast.success('Đã gửi phản hồi thành công!');
      setReviews((prev) =>
        prev.map((r) =>
          r.id === replyModal.id
            ? { ...r, partnerReply: replyText.trim(), partnerRepliedAt: new Date().toISOString() }
            : r
        )
      );
      setReplyModal(null);
      setReplyText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gửi phản hồi thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const hotelReviews = reviews.filter((r) => r.targetType === 'HOTEL');
  const tourReviews = reviews.filter((r) => r.targetType === 'TOUR');

  const stats = {
    total: reviews.length,
    hotel: hotelReviews.length,
    tour: tourReviews.length,
    withReply: reviews.filter((r) => r.partnerReply).length,
    avgRating:
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + Number(r.overallRating || 0), 0) / reviews.length).toFixed(1)
        : '0.0',
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <h2>Quản lý Review</h2>
          <p>Xem và phản hồi đánh giá từ khách hàng về dịch vụ của bạn.</p>
        </div>
        <button className={styles.refreshBtn} onClick={() => void loadReviews({ silent: true })} disabled={refreshing}>
          <FaSyncAlt className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <strong>{stats.total}</strong>
          <span>Tổng review</span>
        </div>
        <div className={`${styles.statCard} ${styles.statHotel}`}>
          <strong>{stats.hotel}</strong>
          <span>Khách sạn</span>
        </div>
        <div className={`${styles.statCard} ${styles.statTour}`}>
          <strong>{stats.tour}</strong>
          <span>Tour</span>
        </div>
        <div className={`${styles.statCard} ${styles.statReplied}`}>
          <strong>{stats.withReply}</strong>
          <span>Đã phản hồi</span>
        </div>
        <div className={`${styles.statCard} ${styles.statRating}`}>
          <strong>{stats.avgRating}</strong>
          <span>Điểm TB / 10</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Đang tải reviews...</div>
      ) : error ? (
        <div className={styles.errorState}>{error}</div>
      ) : reviews.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Chưa có review nào cho dịch vụ của bạn.</p>
        </div>
      ) : (
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <article key={String(review.id)} className={styles.reviewCard}>
              <div className={styles.reviewLeft}>
                <div className={styles.reviewHeader}>
                  <div className={styles.reviewMeta}>
                    <span className={`${styles.typeBadge} ${review.targetType === 'HOTEL' ? styles.typeHotel : styles.typeTour}`}>
                      {review.targetType === 'HOTEL' ? 'Khách sạn' : 'Tour'}
                    </span>
                    <span className={styles.targetName}>{String(review.targetName)}</span>
                  </div>
                  <StarRating rating={Math.round(Number(review.overallRating) / 2)} />
                </div>
                <p className={styles.reviewComment}>{String(review.comment || 'Không có bình luận')}</p>
                <div className={styles.reviewFooter}>
                  <span className={styles.reviewAuthor}>
                    {String(review.userName || 'Khách hàng')} · {formatDate(review.createdAt)}
                  </span>
                  {review.isVerified ? (
                    <span className={styles.verifiedBadge}>
                      <FaCheckCircle size={12} /> Đã xác thực
                    </span>
                  ) : null}
                </div>

                {Boolean(review.partnerReply) ? (
                  <div className={styles.existingReply}>
                    <div className={styles.existingReplyHeader}>
                      <span className={styles.existingReplyLabel}>Phản hồi của bạn</span>
                      <span className={styles.existingReplyDate}>
                        {formatDate(review.partnerRepliedAt)}
                      </span>
                    </div>
                    <p className={styles.existingReplyText}>{String(review.partnerReply)}</p>
                  </div>
                ) : null}

                <button className={styles.replyBtn} onClick={() => openReplyModal(review)}>
                  <FaReply /> {review.partnerReply ? 'Sửa phản hồi' : 'Phản hồi'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {replyModal && (
        <div className={styles.modalOverlay} onClick={() => setReplyModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>Phản hồi Review</h3>
            <p className={styles.modalMeta}>
              Review của <strong>{String(replyModal.userName || 'Khách hàng')}</strong> về{' '}
              <strong>{String(replyModal.targetName)}</strong>
            </p>
            <StarRating rating={Math.round(Number(replyModal.overallRating) / 2)} />
            <p className={styles.modalComment}>
              {String(replyModal.comment || 'Không có bình luận')}
            </p>
            {replyModal.partnerReply ? (
              <div className={styles.modalPrevReply}>
                <strong>Phản hồi hiện tại:</strong> {String(replyModal.partnerReply)}
              </div>
            ) : null}
            <label className={styles.replyLabel}>
              Nội dung phản hồi:
              <textarea
                className={styles.replyTextarea}
                rows={4}
                placeholder="Cảm ơn khách hàng đã đánh giá. Bạn có thể giải thích, xin lỗi hoặc đưa ra hướng xử lý..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <button
                className={styles.primaryBtn}
                onClick={() => void handleSubmitReply()}
                disabled={submitting || !replyText.trim()}
              >
                {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
              <button className={styles.ghostBtn} onClick={() => setReplyModal(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

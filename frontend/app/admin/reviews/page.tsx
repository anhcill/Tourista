'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaCheck,
  FaRegStar,
  FaSearch,
  FaStar,
  FaSyncAlt,
  FaTimes,
  FaTrashAlt,
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import adminApi from '@/api/adminApi';
import styles from './page.module.css';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Từ chối' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  { value: 'HOTEL', label: 'Khách sạn' },
  { value: 'TOUR', label: 'Tour' },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

const STATUS_CLASSES: Record<string, string> = {
  PENDING: styles.statusPending,
  APPROVED: styles.statusApproved,
  REJECTED: styles.statusRejected,
};

const StarRating = ({ rating }: { rating: number }) => (
  <span className={styles.stars}>
    {[1, 2, 3, 4, 5].map((n) =>
      n <= rating ? (
        <FaStar key={n} className={styles.starFilled} />
      ) : (
        <FaRegStar key={n} className={styles.starEmpty} />
      ),
    )}
  </span>
);

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN');
};

type Review = {
  id: number;
  userId: number;
  userName: string | null;
  userAvatar: string | null;
  targetType: 'HOTEL' | 'TOUR';
  targetId: number;
  targetName: string | null;
  overallRating: number;
  comment: string | null;
  isVerified: boolean;
  isPublished: boolean;
  adminStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminReply: string | null;
  adminRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type Counts = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [updating, setUpdating] = useState(false);

  const totalPages = useMemo(() => {
    if (!counts) return 1;
    return Math.max(1, Math.ceil(counts.total / pageSize));
  }, [counts]);

  const loadReviews = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        else setRefreshing(true);
        setError('');

        const [reviewRes, countsRes] = await Promise.all([
          adminApi.getReviews({ page, size: pageSize, status: statusFilter || undefined, targetType: typeFilter || undefined }),
          adminApi.getReviewCounts(),
        ]);

        const reviewData = (reviewRes as { content?: Review[] })?.content ?? [];
        setReviews(reviewData);
        setCounts(countsRes as Counts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách reviews.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [page, statusFilter, typeFilter],
  );

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  // Reset page on filter change
  useEffect(() => {
    setPage(0);
  }, [statusFilter, typeFilter]);

  const handleApprove = async (review: Review) => {
    try {
      setUpdating(true);
      await adminApi.approveReview(review.id);
      toast.success(`Đã duyệt review #${review.id}`);

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, adminStatus: 'APPROVED' as const } : r)),
      );
      if (counts) setCounts({ ...counts, pending: Math.max(0, counts.pending - 1), approved: counts.approved + 1 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Duyệt thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReject = async (review: Review) => {
    try {
      setUpdating(true);
      await adminApi.rejectReview(review.id);
      toast.success(`Đã từ chối review #${review.id}`);

      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, adminStatus: 'REJECTED' as const } : r)),
      );
      if (counts) setCounts({ ...counts, pending: Math.max(0, counts.pending - 1), rejected: counts.rejected + 1 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Từ chối thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!window.confirm(`Xóa review #${review.id} của ${review.userName || 'user'}?`)) return;
    try {
      setUpdating(true);
      await adminApi.deleteReview(review.id);
      toast.success('Đã xóa review.');
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Xóa thất bại.');
    } finally {
      setUpdating(false);
    }
  };

  const openReplyModal = (review: Review) => {
    setSelectedReview(review);
    setReplyText(review.adminReply || '');
  };

  const submitReply = async () => {
    if (!selectedReview) return;
    try {
      setReplying(true);
      await adminApi.replyToReview(selectedReview.id, replyText.trim());
      toast.success('Đã gửi phản hồi.');
      setReviews((prev) =>
        prev.map((r) =>
          r.id === selectedReview.id
            ? { ...r, adminReply: replyText.trim(), adminRepliedAt: new Date().toISOString() }
            : r,
        ),
      );
      setSelectedReview(null);
      setReplyText('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Phản hồi thất bại.');
    } finally {
      setReplying(false);
    }
  };

  return (
    <section className={styles.page}>
      {/* Header */}
      <div className={styles.hero}>
        <div>
          <h2>Review Moderation</h2>
          <p>Kiểm duyệt đánh giá từ khách hàng về khách sạn và tour.</p>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => void loadReviews({ silent: true })}
          disabled={refreshing}
        >
          <FaSyncAlt className={refreshing ? styles.spinning : ''} />
          {refreshing ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {/* Stats */}
      {counts && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <strong>{counts.total}</strong>
            <span>Tổng reviews</span>
          </div>
          <div className={`${styles.statCard} ${styles.statPending}`}>
            <strong>{counts.pending}</strong>
            <span>Chờ duyệt</span>
          </div>
          <div className={`${styles.statCard} ${styles.statApproved}`}>
            <strong>{counts.approved}</strong>
            <span>Đã duyệt</span>
          </div>
          <div className={`${styles.statCard} ${styles.statRejected}`}>
            <strong>{counts.rejected}</strong>
            <span>Từ chối</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filterRow}>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <span className={styles.pageInfo}>
          Trang {page + 1} / {totalPages}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadingState}>Đang tải reviews...</div>
        ) : error ? (
          <div className={styles.errorState}>{error}</div>
        ) : reviews.length === 0 ? (
          <div className={styles.emptyState}>Không có review nào phù hợp bộ lọc.</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Người đánh giá</th>
                <th>Loại</th>
                <th>Dịch vụ</th>
                <th>Rating</th>
                <th>Nội dung</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className={r.adminStatus === 'PENDING' ? styles.rowPending : ''}>
                  <td>
                    <div className={styles.userCell}>
                      {r.userAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={r.userAvatar} alt="" className={styles.avatar} />
                      ) : (
                        <div className={styles.avatarFallback}>
                          {(r.userName || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong>{r.userName || 'User #' + r.userId}</strong>
                        {r.isVerified && <span className={styles.verifiedBadge}>✓ Đã xác minh</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.typeBadge} ${r.targetType === 'HOTEL' ? styles.typeHotel : styles.typeTour}`}>
                      {r.targetType === 'HOTEL' ? '🏨 Khách sạn' : '🚌 Tour'}
                    </span>
                  </td>
                  <td>
                    <strong>{r.targetName || `#${r.targetId}`}</strong>
                  </td>
                  <td>
                    <StarRating rating={r.overallRating} />
                  </td>
                  <td className={styles.commentCell}>
                    <p>{r.comment || <em className={styles.noComment}>Không có bình luận</em>}</p>
                    {r.adminReply && (
                      <p className={styles.adminReply}>
                        <strong>Phản hồi:</strong> {r.adminReply}
                      </p>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${STATUS_CLASSES[r.adminStatus] || ''}`}>
                      {STATUS_LABELS[r.adminStatus] || r.adminStatus}
                    </span>
                  </td>
                  <td className={styles.dateCell}>{formatDate(r.createdAt)}</td>
                  <td>
                    <div className={styles.actionBtns}>
                      {r.adminStatus === 'PENDING' && (
                        <>
                          <button
                            className={styles.approveBtn}
                            onClick={() => void handleApprove(r)}
                            disabled={updating}
                            title="Duyệt"
                          >
                            <FaCheck />
                          </button>
                          <button
                            className={styles.rejectBtn}
                            onClick={() => void handleReject(r)}
                            disabled={updating}
                            title="Từ chối"
                          >
                            <FaTimes />
                          </button>
                        </>
                      )}
                      <button
                        className={styles.replyBtn}
                        onClick={() => openReplyModal(r)}
                        title="Phản hồi"
                      >
                        💬
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => void handleDelete(r)}
                        disabled={updating}
                        title="Xóa"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <button
          className={styles.ghostButton}
          disabled={page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          ← Trước
        </button>
        <span>Trang {page + 1} / {totalPages}</span>
        <button
          className={styles.ghostButton}
          disabled={page >= totalPages - 1}
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
        >
          Sau →
        </button>
      </div>

      {/* Reply Modal */}
      {selectedReview && (
        <div className={styles.modalOverlay} onClick={() => setSelectedReview(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h3>Phản hồi Review #{selectedReview.id}</h3>
            <p className={styles.modalMeta}>
              <strong>{selectedReview.userName || 'User'}</strong> đánh giá{' '}
              <strong>
                {selectedReview.targetType === 'HOTEL' ? 'khách sạn' : 'tour'}{' '}
                {selectedReview.targetName || `#${selectedReview.targetId}`}
              </strong>
            </p>
            <StarRating rating={selectedReview.overallRating} />
            <p className={styles.modalComment}>
              {selectedReview.comment || <em>Không có bình luận</em>}
            </p>
            <label className={styles.replyLabel}>
              Nội dung phản hồi:
              <textarea
                className={styles.replyTextarea}
                rows={4}
                placeholder="Nhập phản hồi của bạn..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
            </label>
            <div className={styles.modalActions}>
              <button
                className={styles.primaryButton}
                onClick={() => void submitReply()}
                disabled={replying || !replyText.trim()}
              >
                {replying ? 'Đang gửi...' : 'Gửi phản hồi'}
              </button>
              <button className={styles.ghostButton} onClick={() => setSelectedReview(null)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

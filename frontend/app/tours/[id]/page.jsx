'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaChevronDown,
  FaMapMarkerAlt, FaStar, FaShieldAlt, FaUsers, FaClock,
  FaMountain, FaHeart, FaShare, FaThumbsUp,
} from 'react-icons/fa';
import ClientChatModal from '@/components/Chat/ClientChatModal';
import tourApi from '@/api/tourApi';
import styles from './page.module.css';

/* ─────────────────── Static ─────────────────── */
const TABS = ['🌟 Tổng quan', '🗺️ Lịch trình', '✅ Bao gồm & Không bao gồm', '❓ Lưu ý'];

const FAQS = [
  { q: 'Khi nào tôi nhận được xác nhận chỗ?', a: 'Hệ thống xác nhận ngay sau khi thanh toán thành công và gửi mã booking về email trong vòng 5 phút.' },
  { q: 'Có thể hủy tour không?', a: 'Bạn có thể hủy theo chính sách của từng tour. Vui lòng xem Tab "Bao gồm & Không bao gồm" để biết điều kiện hoàn tiền cụ thể.' },
  { q: 'Trẻ em tính giá như thế nào?', a: 'Giá trẻ em được áp dụng theo bảng giá tour, đã hiển thị rõ trong widget đặt tour bên phải.' },
  { q: 'Tour có hướng dẫn viên không?', a: 'Tất cả tour đều đi kèm hướng dẫn viên địa phương có kinh nghiệm. Một số tour khó có thêm trợ lý đồng hành.' },
  { q: 'Tôi có thể đổi ngày khởi hành không?', a: 'Có thể đổi trước 7 ngày nếu còn chỗ trong lịch khác. Liên hệ hotline 1900 9999 để được hỗ trợ.' },
];

const AMENITIES = [
  { icon: '🚌', label: 'Xe đưa đón theo nhóm' },
  { icon: '🛎️', label: 'Hướng dẫn viên chuyên nghiệp' },
  { icon: '🍽️', label: 'Bữa ăn theo lịch trình' },
  { icon: '🏨', label: 'Khách sạn tiêu chuẩn 3–4★' },
  { icon: '🎟️', label: 'Vé tham quan điểm đến' },
  { icon: '🧳', label: 'Hành lý ký gửi miễn phí' },
  { icon: '📸', label: 'Chụp ảnh kỷ niệm' },
  { icon: '🩺', label: 'Bảo hiểm du lịch' },
];

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=900&q=80',
  'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80',
  'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=900&q=80',
];

const formatVnd = (value) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(value || 0));

const DIFF_MAP = { EASY: '😊 Dễ đi', MEDIUM: '🧗 Trung bình', HARD: '🏔️ Thử thách' };

const buildInitials = (name) => {
  if (!name || typeof name !== 'string') {
    return 'U';
  }
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) {
    return 'U';
  }
  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }
  return `${words[0].charAt(0)}${words[words.length - 1].charAt(0)}`.toUpperCase();
};

const normalizeReview = (item, index) => {
  const name = item?.name || item?.userName || item?.guestName || 'Khách hàng';
  const rawDate = item?.date || item?.createdAt || null;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  const date = parsedDate && !Number.isNaN(parsedDate.getTime())
    ? parsedDate.toLocaleDateString('vi-VN')
    : (rawDate || '');

  return {
    id: item?.id ?? `${name}-${index}`,
    name,
    initials: item?.initials || buildInitials(name),
    rating: Number(item?.rating ?? item?.overallRating ?? 0),
    date,
    text: item?.text || item?.comment || item?.content || '',
    helpful: Number(item?.helpful ?? item?.helpfulCount ?? 0),
  };
};

const normalizeSimilarTour = (item) => ({
  id: item?.id,
  title: item?.title || 'Tour',
  city: item?.city || '',
  durationDays: Number(item?.durationDays || 1),
  durationNights: Number(item?.durationNights ?? Math.max(Number(item?.durationDays || 1) - 1, 0)),
  price: Number(item?.price ?? item?.pricePerAdult ?? 0),
  rating: Number(item?.rating ?? item?.avgRating ?? 0),
  image: item?.image || item?.coverImage || null,
});

/* ─────────────────── Star Row ─────────────────── */
function StarRow({ rating, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <FaStar key={i} size={size} color={i <= Math.round(rating) ? '#fbbf24' : '#e2e8f0'} />
      ))}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN INNER COMPONENT
   ════════════════════════════════════════════════════════════ */
function TourDetailInner() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tour, setTour] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedDepartureId, setSelectedDepartureId] = useState(null);
  const [adults, setAdults] = useState(Number(searchParams.get('adults') || 1));
  const [children, setChildren] = useState(Number(searchParams.get('children') || 0));
  const [liked, setLiked] = useState(false);
  const [helpfulMap, setHelpfulMap] = useState({});
  const [chatModalOpen, setChatModalOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        setError('');
        const [detailRes, reviewsRes, similarRes] = await Promise.allSettled([
          tourApi.getTourDetail(id),
          tourApi.getTourReviews(id, { page: 1, limit: 6 }),
          tourApi.getSimilarTours(id, { limit: 4 }),
        ]);

        const detailData = detailRes.status === 'fulfilled' ? detailRes.value?.data : null;
        setTour(detailData || null);
        if (Array.isArray(detailData?.departures) && detailData.departures.length > 0) {
          setSelectedDepartureId(detailData.departures[0].departureId);
        }

        if (!detailData) {
          setError('Không thể tải thông tin tour.');
          return;
        }

        const reviewData = reviewsRes.status === 'fulfilled' ? reviewsRes.value?.data : [];
        const reviewItems = Array.isArray(reviewData)
          ? reviewData
          : (Array.isArray(reviewData?.content) ? reviewData.content : []);
        setReviews(reviewItems.map(normalizeReview));

        const similarData = similarRes.status === 'fulfilled' ? similarRes.value?.data : [];
        const similarItems = Array.isArray(similarData)
          ? similarData
          : (Array.isArray(similarData?.content) ? similarData.content : []);
        setSimilar(
          similarItems
            .map(normalizeSimilarTour)
            .filter((item) => Number.isFinite(Number(item.id)) || typeof item.id === 'string')
            .slice(0, 4),
        );
      } catch (err) {
        setError(err?.message || 'Không thể tải thông tin tour.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchAll();
  }, [id]);

  const selectedDeparture = useMemo(() => {
    if (!tour?.departures || selectedDepartureId == null) return null;
    return tour.departures.find((dep) => Number(dep.departureId) === Number(selectedDepartureId)) || null;
  }, [tour, selectedDepartureId]);

  const adultPrice = useMemo(() => {
    if (!tour) return 0;
    if (selectedDeparture?.priceOverride != null) return Number(selectedDeparture.priceOverride);
    return Number(tour.pricePerAdult || 0);
  }, [tour, selectedDeparture]);

  const childPrice = Number(tour?.pricePerChild || 0);
  const totalGuests = Math.max(1, adults + children);
  const totalAmount = adultPrice * adults + childPrice * children;
  const rating = Number(tour?.avgRating || 0);
  const tourPartnerId =
    tour?.partnerId ||
    tour?.operatorId ||
    tour?.ownerId ||
    tour?.hostId ||
    tour?.operator?.id ||
    tour?.owner?.id ||
    tour?.partner?.id ||
    null;
  const reviewCount = Number(tour?.reviewCount || reviews.length || 0);

  const galleryImages = useMemo(() => {
    const imgs = Array.isArray(tour?.images) ? tour.images.filter(Boolean) : [];
    if (imgs.length >= 4) return imgs;
    return [...imgs, ...FALLBACK_IMAGES].slice(0, 4);
  }, [tour]);

  const handleBookNow = () => {
    if (!selectedDeparture) return;
    const params = new URLSearchParams({
      departureId: String(selectedDeparture.departureId),
      departureDate: String(selectedDeparture.departureDate || ''),
      adults: String(Math.max(1, adults)),
      children: String(Math.max(0, children)),
    });
    router.push(`/tours/${id}/book?${params.toString()}`);
  };

  /* Rating breakdown mock */
  const ratingBreakdown = useMemo(() => [
    { label: '5 sao', pct: 72 },
    { label: '4 sao', pct: 18 },
    { label: '3 sao', pct: 6 },
    { label: '2 sao', pct: 2 },
    { label: '1 sao', pct: 2 },
  ], []);

  if (loading) return <div className={styles.statusBox}>⏳ Đang tải thông tin tour...</div>;
  if (error || !tour) return (
    <div className={styles.statusBoxError}>
      <p>{error || 'Không tìm thấy tour.'}</p>
      <button onClick={() => router.back()} className={styles.backBtn}>← Quay lại</button>
    </div>
  );

  return (
    <div className={styles.page}>
      {/* ── BREADCRUMB ── */}
      <div className={styles.breadcrumbRow}>
        <button className={styles.backTopBtn} onClick={() => router.back()}>
          <FaArrowLeft /> Quay lại kết quả
        </button>
        <div className={styles.breadcrumbActions}>
          <button className={`${styles.actionBtn} ${liked ? styles.actionBtnActive : ''}`} onClick={() => setLiked(!liked)}>
            <FaHeart /> {liked ? 'Đã lưu' : 'Lưu'}
          </button>
          <button className={styles.actionBtn} onClick={() => navigator.share?.({ title: tour.title, url: window.location.href }) || navigator.clipboard?.writeText(window.location.href)}>
            <FaShare /> Chia sẻ
          </button>
        </div>
      </div>

      {/* ── TOUR TITLE STRIP ── */}
      <div className={styles.titleStrip}>
        <div className={styles.titleLeft}>
          <h1 className={styles.pageTitle}>{tour.title}</h1>
          <div className={styles.titleMeta}>
            <span className={styles.metaPill}><FaMapMarkerAlt /> {tour.city}</span>
            <span className={styles.metaPill}><FaClock /> {tour.durationDays}N{tour.durationNights}Đ</span>
            <span className={styles.metaPill}><FaMountain /> {DIFF_MAP[tour.difficulty] || 'Dễ đi'}</span>
            <span className={styles.metaPill}><FaUsers /> Tối đa {tour.maxGroupSize || 20} người</span>
          </div>
          <div className={styles.ratingInline}>
            <StarRow rating={rating} size={15} />
            <strong className={styles.ratingNum}>{rating.toFixed(1)}</strong>
            <span className={styles.ratingLabel}>({reviewCount.toLocaleString('vi-VN')} đánh giá)</span>
            {tour.categoryName && <span className={styles.categoryBadge}>{tour.categoryName}</span>}
          </div>
        </div>
      </div>

      {/* ── GALLERY ── */}
      <div className={styles.gallery}>
        <div className={styles.galleryMain}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={galleryImages[0]} alt={tour.title} />
        </div>
        <div className={styles.galleryGrid}>
          {galleryImages.slice(1).map((img, i) => (
            <div key={i} className={styles.galleryThumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`${tour.title}-${i + 2}`} />
              {i === 2 && galleryImages.length > 4 && (
                <div className={styles.morePhotos}>+{galleryImages.length - 4} ảnh</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 2 COL LAYOUT ── */}
      <div className={styles.layout}>
        {/* ══ LEFT ══ */}
        <div className={styles.leftCol}>

          {/* ── AMENITIES ── */}
          <div className={styles.amenitiesCard}>
            <h3 className={styles.sectionTitle}>Tiện ích & Dịch vụ</h3>
            <div className={styles.amenitiesGrid}>
              {AMENITIES.map((a) => (
                <div key={a.label} className={styles.amenityItem}>
                  <span className={styles.amenityIcon}>{a.icon}</span>
                  <span className={styles.amenityLabel}>{a.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── TABS ── */}
          <div className={styles.tabsCard}>
            <div className={styles.tabs}>
              {TABS.map((tab, idx) => (
                <button
                  key={tab}
                  className={`${styles.tab} ${activeTab === idx ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(idx)}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab 0: Overview */}
            {activeTab === 0 && (
              <div className={styles.tabPanel}>
                <h3 className={styles.sectionTitle}>Mô tả tour</h3>
                <p className={styles.description}>
                  {tour.description || 'Tour du lịch trải nghiệm với lịch trình tối ưu, hướng dẫn viên chuyên nghiệp và dịch vụ chu đáo từ A đến Z.'}
                </p>
                {(tour.highlights || []).length > 0 && (
                  <>
                    <h3 className={styles.sectionTitle}>Điểm nổi bật</h3>
                    <ul className={styles.listBox}>
                      {tour.highlights.map((item, idx) => (
                        <li key={idx}><FaCheckCircle /><span>{item}</span></li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Tab 1: Itinerary */}
            {activeTab === 1 && (
              <div className={styles.tabPanel}>
                <h3 className={styles.sectionTitle}>Lịch trình chi tiết từng ngày</h3>
                {(tour.itinerary || []).length === 0 ? (
                  <p className={styles.description}>Lịch trình chi tiết đang được cập nhật. Vui lòng liên hệ để biết thêm.</p>
                ) : (
                  <div className={styles.timeline}>
                    {tour.itinerary.map((day, idx) => (
                      <div key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineDot}>N{day.dayNumber}</div>
                        <div className={styles.timelineContent}>
                          <p className={styles.timelineDay}>Ngày {day.dayNumber}</p>
                          <p className={styles.timelineTitle}>{day.title}</p>
                          <p className={styles.timelineDesc}>{day.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Includes / Excludes */}
            {activeTab === 2 && (
              <div className={styles.tabPanel}>
                <div className={styles.twoColPolicy}>
                  <div>
                    <h3 className={styles.sectionTitle}>✅ Bao gồm</h3>
                    <ul className={styles.listBox}>
                      {(tour.includes || ['Xe đưa đón', 'Hướng dẫn viên', 'Vé tham quan', 'Bảo hiểm du lịch']).map((item, idx) => (
                        <li key={idx}><FaCheckCircle /><span>{item}</span></li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className={styles.sectionTitle}>❌ Không bao gồm</h3>
                    <ul className={styles.listBoxMuted}>
                      {(tour.excludes || ['Vé máy bay', 'Chi phí cá nhân', 'Đồ uống có cồn', 'Tiền tip hướng dẫn viên']).map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {/* Cancellation policy */}
                <div className={styles.cancelPolicy}>
                  <h3 className={styles.sectionTitle}>📋 Chính sách hủy tour</h3>
                  <table className={styles.policyTable}>
                    <thead>
                      <tr>
                        <th>Thời gian hủy</th>
                        <th>Phí hủy</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td>Trước 15 ngày</td><td className={styles.policyGreen}>Hoàn 100%</td></tr>
                      <tr><td>Trước 7–14 ngày</td><td className={styles.policyYellow}>Hoàn 70%</td></tr>
                      <tr><td>Trước 3–7 ngày</td><td className={styles.policyOrange}>Hoàn 50%</td></tr>
                      <tr><td>Dưới 3 ngày</td><td className={styles.policyRed}>Không hoàn tiền</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab 3: FAQ */}
            {activeTab === 3 && (
              <div className={styles.tabPanel}>
                <h3 className={styles.sectionTitle}>Câu hỏi thường gặp</h3>
                <div className={styles.faqSection}>
                  {FAQS.map((faq, i) => (
                    <div key={i} className={styles.faqItem}>
                      <button className={styles.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                        {faq.q}
                        <FaChevronDown className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ''}`} />
                      </button>
                      {openFaq === i && <p className={styles.faqA}>{faq.a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── REVIEWS ── */}
          <div className={styles.reviewsCard}>
            <div className={styles.reviewsHeader}>
              <div>
                <h3 className={styles.sectionTitle} style={{ margin: 0 }}>Đánh giá từ khách hàng</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>{reviewCount.toLocaleString('vi-VN')} đánh giá đã được xác minh</p>
              </div>
            </div>

            {/* Summary */}
            <div className={styles.reviewSummary}>
              <div className={styles.reviewScoreBig}>
                <div className={styles.bigScore}>{rating.toFixed(1)}</div>
                <StarRow rating={rating} size={18} />
                <p className={styles.bigScoreLabel}>Xuất sắc</p>
              </div>
              <div className={styles.reviewBars}>
                {ratingBreakdown.map((row) => (
                  <div key={row.label} className={styles.reviewBarRow}>
                    <span className={styles.reviewBarLabel}>{row.label}</span>
                    <div className={styles.reviewBarTrack}>
                      <div className={styles.reviewBarFill} style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className={styles.reviewBarPct}>{row.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual reviews */}
            <div className={styles.reviewList}>
              {reviews.map((rv) => (
                <div key={rv.id} className={styles.reviewCard}>
                  <div className={styles.reviewTop}>
                    <div className={styles.reviewAvatar} style={{ background: 'linear-gradient(135deg,#0077b6,#00a8a8)' }}>
                      {rv.initials || (rv.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.reviewMeta}>
                      <strong className={styles.reviewName}>{rv.name || rv.guestName || 'Khách hàng'}</strong>
                      <span className={styles.reviewDate}>{rv.date || rv.createdAt || ''}</span>
                    </div>
                    <div className={styles.reviewStars}>
                      <StarRow rating={rv.rating} size={12} />
                    </div>
                  </div>
                  {rv.tour && <p className={styles.reviewTour}>🎒 {rv.tour}</p>}
                  <p className={styles.reviewText}>{rv.text || rv.content || ''}</p>
                  <button
                    className={`${styles.helpfulBtn} ${helpfulMap[rv.id] ? styles.helpfulBtnActive : ''}`}
                    onClick={() => setHelpfulMap((m) => ({ ...m, [rv.id]: !m[rv.id] }))}
                  >
                    <FaThumbsUp size={11} />
                    Hữu ích {helpfulMap[rv.id] ? (rv.helpful || 0) + 1 : rv.helpful || 0}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── SIMILAR TOURS ── */}
          {similar.length > 0 && (
            <div className={styles.similarCard}>
              <h3 className={styles.sectionTitle}>Tour tương tự bạn có thể thích</h3>
              <div className={styles.similarGrid}>
                {similar.map((t) => (
                  <div
                    key={t.id}
                    className={styles.similarItem}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/tours/${t.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && router.push(`/tours/${t.id}`)}
                  >
                    <div className={styles.similarImgWrap}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={t.image || t.coverImage || FALLBACK_IMAGES[0]} alt={t.title} className={styles.similarImg} />
                      <div className={styles.similarOverlay} />
                      <div className={styles.similarRating}>
                        <FaStar size={10} color="#fbbf24" /> {Number(t.rating || t.avgRating || 0).toFixed(1)}
                      </div>
                    </div>
                    <div className={styles.similarBody}>
                      <p className={styles.similarTitle}>{t.title}</p>
                      <p className={styles.similarCity}><FaMapMarkerAlt size={10} /> {t.city}</p>
                      <div className={styles.similarFooter}>
                        <span className={styles.similarDur}>{t.durationDays || 1}N{t.durationNights ?? Math.max((t.durationDays || 1) - 1, 0)}Đ</span>
                        <span className={styles.similarPrice}>
                          {new Intl.NumberFormat('vi-VN').format(t.price || t.pricePerAdult || 0)}đ
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT: BOOKING WIDGET ══ */}
        <div className={styles.rightCol}>
          <div className={styles.bookingCard}>
            <div className={styles.bookingCardHeader}>
              <h2 className={styles.tourName}>{tour.title}</h2>
              <p className={styles.tourAddr}>
                <FaMapMarkerAlt className={styles.addrIcon} /> {tour.city}
              </p>
              <div className={styles.ratingRow}>
                <span className={styles.ratingScore}>
                  <FaStar className={styles.ratingScoreIcon} /> {rating.toFixed(1)}
                </span>
                <span className={styles.reviewCount}>({reviewCount.toLocaleString('vi-VN')} đánh giá)</span>
              </div>
            </div>

            <div className={styles.bookingBody}>
              <label className={styles.fieldLabel}>Lịch khởi hành</label>
              <select
                className={styles.input}
                value={selectedDepartureId || ''}
                onChange={(e) => setSelectedDepartureId(Number(e.target.value))}
              >
                {(tour.departures || []).map((dep) => (
                  <option key={dep.departureId} value={dep.departureId} disabled={Number(dep.availableSlots || 0) <= 0}>
                    {dep.departureDate} — Còn {dep.availableSlots} chỗ
                  </option>
                ))}
              </select>

              <div className={styles.guestGrid}>
                <div>
                  <label className={styles.fieldLabel}>Người lớn</label>
                  <input type="number" min={1} className={styles.input} value={adults}
                    onChange={(e) => setAdults(Math.max(1, Number(e.target.value || 1)))} />
                </div>
                <div>
                  <label className={styles.fieldLabel}>Trẻ em</label>
                  <input type="number" min={0} className={styles.input} value={children}
                    onChange={(e) => setChildren(Math.max(0, Number(e.target.value || 0)))} />
                </div>
              </div>

              {selectedDeparture && (
                <p className={styles.slotInfo}>
                  <FaCalendarAlt /> Còn {selectedDeparture.availableSlots} chỗ trong đợt này
                </p>
              )}

              <hr className={styles.divider} />

              <div className={styles.priceBlock}>
                <p className={styles.priceLabel}>Tổng thanh toán</p>
                <div className={styles.totalPrice}>{formatVnd(totalAmount)}</div>
                <p className={styles.priceNote}>
                  {formatVnd(adultPrice)} × {adults} người lớn
                  {children > 0 && ` + ${formatVnd(childPrice)} × ${children} trẻ em`}
                </p>
                <p className={styles.taxNote}>Tổng {totalGuests} khách · Đã bao gồm thuế & phí</p>
              </div>

              <button className={styles.bookNowBtn} onClick={handleBookNow} disabled={!selectedDeparture}>
                🎒 Đặt tour ngay
              </button>

              <button
                className={styles.chatOwnerBtn}
                onClick={() => setChatModalOpen(true)}
              >
                Chat với Chủ
              </button>

              <p className={styles.safeNote}>
                <FaShieldAlt /> Thanh toán an toàn · Xác nhận tức thì
              </p>

              {/* Trust cards */}
              <div className={styles.trustList}>
                <div className={styles.trustItem}><span>✅</span> Xác nhận booking ngay</div>
                <div className={styles.trustItem}><span>🔄</span> Đổi lịch linh hoạt</div>
                <div className={styles.trustItem}><span>🛡️</span> Bảo hiểm du lịch</div>
                <div className={styles.trustItem}><span>📞</span> Hỗ trợ 24/7</div>
              </div>
            </div>
          </div>

          {/* Need help */}
          <div className={styles.needHelpCard}>
            <p className={styles.needHelpTitle}>Cần tư vấn thêm?</p>
            <p className={styles.needHelpSub}>Đội ngũ chúng tôi sẵn sàng hỗ trợ 24/7</p>
            <a href="tel:19009999" className={styles.needHelpBtn}>📞 Gọi 1900 9999</a>
          </div>
        </div>
      </div>

      <ClientChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        conversationSeed={chatModalOpen ? {
          type: 'P2P_TOUR',
          partnerId: tourPartnerId,
          referenceId: tour?.id,
          title: tour?.title,
        } : null}
      />
    </div>
  );
}

export default function TourDetailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>}>
      <TourDetailInner />
    </Suspense>
  );
}

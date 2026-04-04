'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import tourApi from '@/api/tourApi';
import TourCard from '@/components/Tours/TourCard/TourCard';
import styles from './page.module.css';

/* ── Types ────────────────────────────────────────────────── */
type FeaturedTour = {
  id: number;
  title: string;
  city: string;
  coverImage: string | null;
  durationDays: number;
  durationNights: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  avgRating: number;
  reviewCount: number;
  pricePerAdult: number;
  pricePerChild: number;
  nearestDepartureDate: string | null;
  availableSlots: number;
};

type TourCardItem = {
  id: number;
  title: string;
  location: string;
  image: string | null;
  durationDays: number;
  durationNights: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  rating: number;
  reviewCount: number;
  priceAdult: number;
  priceChild: number;
  nearestDepartureDate: string;
  availableSlots: number;
};

/* ── Static data ──────────────────────────────────────────── */

/** Hero slideshow — 5 Vietnam/SEA travel photos (Unsplash) */
const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=85', // Hạ Long Bay
  'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=85', // Hội An đèn lồng
  'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1600&q=85', // Phú Quốc biển
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=85', // Sapa ruộng bậc thang
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&q=85',   // Đà Nẵng bờ biển
];

const CATEGORIES = [
  { icon: '🏖️', name: 'Biển & Đảo',           count: '48 tour', query: 'bien',    bgImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80' },
  { icon: '🏔️', name: 'Leo núi & Trekking',   count: '32 tour', query: 'sapa',    bgImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80' },
  { icon: '🏯', name: 'Văn hóa & Di sản',      count: '27 tour', query: 'hoi an',  bgImage: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80' },
  { icon: '🍜', name: 'Ẩm thực',               count: '19 tour', query: 'ha noi',  bgImage: 'https://images.unsplash.com/photo-1559058789-672da06263d8?w=800&q=80' },
  { icon: '🧗', name: 'Phiêu lưu & Mạo hiểm', count: '15 tour', query: 'da lat',  bgImage: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&q=80' },
  { icon: '💑', name: 'Honeymoon',              count: '24 tour', query: 'phu quoc', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80' },
  { icon: '👨‍👩‍👧', name: 'Gia đình',        count: '36 tour', query: 'da nang',  bgImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80' },
];

const WHY_ITEMS = [
  { icon: '✅', title: 'Đảm bảo giá tốt nhất', desc: 'Cam kết giá thấp hơn hoặc hoàn tiền 100% chênh lệch' },
  { icon: '🎯', title: 'Lịch trình chi tiết', desc: 'Từng buổi sáng/chiều/tối được lên kế hoạch rõ ràng' },
  { icon: '🛡️', title: 'Đặt chỗ an toàn', desc: 'Thanh toán bảo mật, xác nhận tức thì qua email' },
  { icon: '📞', title: 'Hỗ trợ 24/7', desc: 'Đội ngũ tư vấn sẵn sàng hỗ trợ bất cứ lúc nào' },
];

const TESTIMONIALS = [
  {
    text: 'Tour Phú Quốc 4 ngày 3 đêm thực sự tuyệt vời! Hướng dẫn viên nhiệt tình, chương trình phong phú. Sẽ quay lại đặt tour lần nữa.',
    name: 'Nguyễn Minh Anh',
    meta: 'Tour Phú Quốc • Tháng 1/2026',
    initials: 'MA',
    gradient: 'linear-gradient(135deg,#0077b6,#00a8a8)',
  },
  {
    text: 'Lần đầu đi Sapa trekking, lo lắng lắm nhưng nhờ có hướng dẫn viên nhiều kinh nghiệm nên rất an toàn và vui. Giá cả hợp lý!',
    name: 'Trần Thanh Huyền',
    meta: 'Trekking Sapa • Tháng 12/2025',
    initials: 'TH',
    gradient: 'linear-gradient(135deg,#2d6a4f,#52b788)',
  },
  {
    text: 'Đặt tour honeymoon cho 2 vợ chồng, dịch vụ cực kỳ chu đáo từ khách sạn đến ăn uống. Chuyến đi đáng nhớ nhất trong cuộc đời!',
    name: 'Lê Quốc Hùng',
    meta: 'Honeymoon Đà Lạt • Tháng 2/2026',
    initials: 'QH',
    gradient: 'linear-gradient(135deg,#c77dff,#7b2d8b)',
  },
];

/* ── Helpers ──────────────────────────────────────────────── */
const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/* ════════════════════════════════════════════════════════════
   COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function ToursLandingPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState(getToday());
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  const [featuredTours, setFeaturedTours] = useState<TourCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await tourApi.getFeaturedTours({ limit: 4 });
        const rawTours: FeaturedTour[] = Array.isArray(response?.data) ? response.data : [];
        const mapped = rawTours.map((item) => ({
          id: item.id,
          title: item.title,
          location: item.city,
          image: item.coverImage,
          durationDays: Number(item.durationDays || 1),
          durationNights: Number(item.durationNights || 0),
          difficulty: (item.difficulty || 'EASY') as 'EASY' | 'MEDIUM' | 'HARD',
          rating: Number(item.avgRating || 0),
          reviewCount: Number(item.reviewCount || 0),
          priceAdult: Number(item.pricePerAdult || 0),
          priceChild: Number(item.pricePerChild || 0),
          nearestDepartureDate: item.nearestDepartureDate || '',
          availableSlots: Number(item.availableSlots || 0),
        }));
        setFeaturedTours(mapped);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách tour.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const city = destination.trim() || 'Da Nang';
    const params = new URLSearchParams({
      city,
      departureDate,
      adults: String(Math.max(1, adults)),
      children: String(Math.max(0, children)),
    });
    router.push(`/tours/search?${params.toString()}`);
  };

  const handleCategoryClick = (query: string) => {
    const params = new URLSearchParams({ city: query, departureDate: getToday(), adults: '2', children: '0' });
    router.push(`/tours/search?${params.toString()}`);
  };

  return (
    <main className={styles.page}>
      {/* ══════════════ HERO ══════════════ */}
      <section className={styles.hero}>
        {/* Slideshow images — render first so overlay sits on top */}
        <div className={styles.heroSlideshow}>
          {HERO_SLIDES.map((src, i) => (
            <div
              key={i}
              className={styles.heroSlide}
              style={{ backgroundImage: `url(${src})` }}
            />
          ))}
        </div>
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Nền tảng đặt tour hàng đầu Việt Nam
          </div>

          <h1 className={styles.heroH1}>
            Khám phá hành trình{' '}
            <span>tiếp theo</span>{' '}
            của bạn
          </h1>

          <p className={styles.heroSub}>
            Hàng trăm tour trong nước được tuyển chọn kỹ lưỡng — từ biển đảo, leo núi đến văn hóa. Đặt ngay, nhận xác nhận tức thì.
          </p>

          {/* Search card */}
          <div className={styles.searchCard}>
            <p className={styles.searchCardTitle}>🔍 Tìm tour phù hợp với bạn</p>
            <form className={styles.searchForm} onSubmit={handleSearch}>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Điểm đến</label>
                <input
                  className={styles.input}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Đà Nẵng, Phú Quốc, Hà Nội..."
                />
              </div>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Ngày khởi hành</label>
                <input
                  className={styles.input}
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                />
              </div>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Người lớn</label>
                <input
                  className={styles.inputSmall}
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(Math.max(1, Number(e.target.value || 1)))}
                />
              </div>
              <div className={styles.fieldWrap}>
                <label className={styles.fieldLabel}>Trẻ em</label>
                <input
                  className={styles.inputSmall}
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Math.max(0, Number(e.target.value || 0)))}
                />
              </div>
              <button className={styles.submitBtn} type="submit">Tìm tour →</button>
            </form>
          </div>

          {/* Stats */}
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>200+</span>
              <span className={styles.heroStatLabel}>Tour nội địa</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>50K+</span>
              <span className={styles.heroStatLabel}>Khách đã đặt</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>4.8★</span>
              <span className={styles.heroStatLabel}>Đánh giá trung bình</span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>24/7</span>
              <span className={styles.heroStatLabel}>Hỗ trợ khách hàng</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ CATEGORIES ══════════════ */}
      <section className={styles.categoriesSection}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionEyebrow}>Danh mục tour</p>
            <h2 className={styles.sectionTitle}>
              Chọn loại hình <span className={styles.sectionTitleAccent}>yêu thích</span>
            </h2>
          </div>
          <button className={styles.viewAllBtn} onClick={() => router.push('/tours/search?city=Da Nang')}>
            Xem tất cả →
          </button>
        </div>

        <div className={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className={styles.categoryCard}
              role="button"
              tabIndex={0}
              onClick={() => handleCategoryClick(cat.query)}
              onKeyDown={(e) => e.key === 'Enter' && handleCategoryClick(cat.query)}
              style={{
                backgroundImage: `url(${cat.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className={styles.categoryOverlay} />
              <div className={styles.categoryContent}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <p className={styles.categoryName}>{cat.name}</p>
                <p className={styles.categoryCount}>{cat.count}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ FEATURED TOURS ══════════════ */}
      <section className={styles.featuredSection}>
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.sectionEyebrow}>Nổi bật</p>
              <h2 className={styles.sectionTitle}>
                Tour <span className={styles.sectionTitleAccent}>được yêu thích</span> nhất
              </h2>
            </div>
            <button
              className={styles.viewAllBtn}
              onClick={() => router.push('/tours/search?city=Da%20Nang')}
            >
              Xem tất cả →
            </button>
          </div>

          {loading && <div className={styles.statusBox}>Đang tải tour nổi bật...</div>}

          {!loading && error && (
            <div className={styles.statusBoxError}>
              <p>{error}</p>
              <button className={styles.retryBtn} onClick={() => window.location.reload()}>Thử lại</button>
            </div>
          )}

          {!loading && !error && featuredTours.length === 0 && (
            <div className={styles.statusBox}>Chưa có tour nổi bật. Hãy thử tìm kiếm theo điểm đến nhé.</div>
          )}

          {!loading && !error && featuredTours.length > 0 && (
            <div className={styles.cardList}>
              {featuredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} onClick={undefined} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════════ WHY CHOOSE ══════════════ */}
      <section className={styles.whySection}>
        <div className={styles.sectionHead}>
          <div>
            <p className={styles.sectionEyebrow}>Tại sao chọn Tourista</p>
            <h2 className={styles.sectionTitle}>
              Đặt tour <span className={styles.sectionTitleAccent}>tin cậy</span> — Trải nghiệm xứng đáng
            </h2>
          </div>
        </div>

        <div className={styles.whyGrid}>
          {WHY_ITEMS.map((item) => (
            <div key={item.title} className={styles.whyCard}>
              <div className={styles.whyIconWrap}>{item.icon}</div>
              <p className={styles.whyTitle}>{item.title}</p>
              <p className={styles.whyDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════ TESTIMONIALS ══════════════ */}
      <section className={styles.testimonialsSection}>
        <div className={styles.testimonialsInner}>
          <p className={styles.sectionEyebrow}>Khách hàng nói gì</p>
          <h2 className={styles.sectionTitle}>Hàng ngàn chuyến đi hạnh phúc</h2>

          <div className={styles.testimonialsGrid}>
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>★★★★★</div>
                <p className={styles.testimonialText}>&ldquo;{t.text}&rdquo;</p>
                <div className={styles.testimonialAuthor}>
                  <div
                    className={styles.testimonialAvatar}
                    style={{ background: t.gradient }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className={styles.testimonialName}>{t.name}</p>
                    <p className={styles.testimonialMeta}>{t.meta}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ CTA BANNER ══════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBanner}>
          <div className={styles.ctaText}>
            <h2 className={styles.ctaH2}>Sẵn sàng cho chuyến đi tiếp theo?</h2>
            <p className={styles.ctaSubtitle}>Đặt tour ngay hôm nay — Xác nhận trong vòng 30 giây</p>
          </div>
          <div className={styles.ctaBtns}>
            <button
              className={styles.ctaBtnPrimary}
              onClick={() => router.push('/tours/search?city=Da%20Nang')}
            >
              🗺️ Khám phá ngay
            </button>
            <button
              className={styles.ctaBtnOutline}
              onClick={() => router.push('/tours/search?city=Phu%20Quoc')}
            >
              Xem tour Phú Quốc
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}

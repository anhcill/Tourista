'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import tourApi from '@/api/tourApi';
import TourCard from '@/components/Tours/TourCard/TourCard';
import styles from './search.module.css';

/* ── Types ────────────────────────────────────────────────── */
type ApiTourSummary = {
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

const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'EASY', label: '😊 Dễ đi' },
  { value: 'MEDIUM', label: '🧗 Trung bình' },
  { value: 'HARD', label: '🏔️ Thử thách' },
];

const SORT_OPTIONS = [
  { value: 'RECOMMENDED', label: 'Gợi ý tốt nhất' },
  { value: 'PRICE_ASC', label: 'Giá thấp → cao' },
  { value: 'PRICE_DESC', label: 'Giá cao → thấp' },
  { value: 'RATING_DESC', label: 'Đánh giá cao nhất' },
  { value: 'DEPARTURE_ASC', label: 'Khởi hành gần nhất' },
];

const getToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

/* ════════════════════════════════════════════════════════════
   FILTER SIDEBAR — inline in search page
   ════════════════════════════════════════════════════════════ */
function FilterSection({ title, defaultOpen = true, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.filterSection}>
      <button className={styles.filterSectionHeader} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        {open
          ? <FaChevronUp className={styles.filterChevron} />
          : <FaChevronDown className={`${styles.filterChevron} ${styles.filterChevronOpen}`} />
        }
      </button>
      {open && <div className={styles.filterBody}>{children}</div>}
    </div>
  );
}

function TourFilterSidebar({
  filters,
  onChange,
  onReset,
}: {
  filters: { minPrice: number; maxPrice: number; durationMin: number; durationMax: number; difficulty: string };
  onChange: (f: typeof filters) => void;
  onReset: () => void;
}) {
  const [local, setLocal] = useState(filters);

  const patch = (p: Partial<typeof filters>) => {
    const next = { ...local, ...p };
    setLocal(next);
    onChange(next);
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h3 className={styles.sidebarTitle}>
          <span className={styles.sidebarTitleIcon}>⚙️</span> Bộ lọc
        </h3>
        <button className={styles.resetBtn} onClick={onReset}>Xóa tất cả</button>
      </div>

      <FilterSection title="💰 Giá mỗi người (VNĐ)">
        <div className={styles.priceGrid}>
          <div className={styles.priceField}>
            <span className={styles.priceFieldLabel}>Từ</span>
            <input
              type="number"
              className={styles.priceInput}
              min={0}
              value={local.minPrice}
              onChange={(e) => patch({ minPrice: Number(e.target.value) })}
              placeholder="0"
            />
          </div>
          <div className={styles.priceField}>
            <span className={styles.priceFieldLabel}>Đến</span>
            <input
              type="number"
              className={styles.priceInput}
              min={local.minPrice}
              value={local.maxPrice}
              onChange={(e) => patch({ maxPrice: Number(e.target.value) })}
              placeholder="10,000,000"
            />
          </div>
        </div>
      </FilterSection>

      <FilterSection title="📅 Thời lượng tour (ngày)">
        <div className={styles.durationRow}>
          <input
            type="number"
            className={styles.durationInput}
            min={1}
            value={local.durationMin}
            onChange={(e) => patch({ durationMin: Number(e.target.value) })}
          />
          <span className={styles.durationSep}>—</span>
          <input
            type="number"
            className={styles.durationInput}
            min={local.durationMin}
            value={local.durationMax}
            onChange={(e) => patch({ durationMax: Number(e.target.value) })}
          />
          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ngày</span>
        </div>
      </FilterSection>

      <FilterSection title="🎯 Độ khó" defaultOpen={false}>
        <div className={styles.difficultyPills}>
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.diffPill} ${local.difficulty === opt.value ? styles.diffPillActive : ''}`}
              onClick={() => patch({ difficulty: opt.value })}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN SEARCH INNER
   ════════════════════════════════════════════════════════════ */
const DEFAULT_FILTERS = { minPrice: 0, maxPrice: 10000000, durationMin: 1, durationMax: 14, difficulty: '' };

function TourSearchInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tours, setTours] = useState<TourCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localFilters, setLocalFilters] = useState(DEFAULT_FILTERS);
  const [sort, setSort] = useState('RECOMMENDED');

  /* Banner inline search state */
  const [searchCity, setSearchCity] = useState('');
  const [searchDate, setSearchDate] = useState(getToday());
  const [searchAdults, setSearchAdults] = useState(2);

  const query = useMemo(() => {
    const city = searchParams.get('city') || searchParams.get('destination') || '';
    const departureDate = searchParams.get('departureDate') || getToday();
    const adults = Number(searchParams.get('adults') || 1);
    const children = Number(searchParams.get('children') || 0);
    return { city: city.trim(), departureDate, adults, children };
  }, [searchParams]);

  /* Sync banner inputs from URL */
  useEffect(() => {
    setSearchCity(query.city);
    setSearchDate(query.departureDate);
    setSearchAdults(query.adults);
  }, [query]);

  useEffect(() => {
    const fetchTours = async () => {
      if (!query.city) {
        setLoading(false);
        setError('Vui lòng nhập điểm đến để tìm tour.');
        setTours([]);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await tourApi.searchTours({
          city: query.city,
          departureDate: query.departureDate,
          adults: query.adults,
          children: query.children,
          sort,
          minPrice: localFilters.minPrice,
          maxPrice: localFilters.maxPrice,
          durationMin: localFilters.durationMin,
          durationMax: localFilters.durationMax,
          difficulty: localFilters.difficulty || undefined,
        });
        const rawTours: ApiTourSummary[] = Array.isArray(response?.data) ? response.data : [];
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
        setTours(mapped);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách tour.';
        setError(msg);
        setTours([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTours();
  }, [query, localFilters, sort]);

  const handleBannerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    const params = new URLSearchParams({
      city: searchCity.trim(),
      departureDate: searchDate,
      adults: String(Math.max(1, searchAdults)),
      children: '0',
    });
    router.push(`/tours/search?${params.toString()}`);
  };

  return (
    <div className={styles.pageWrapper}>
      {/* ── HERO BANNER ── */}
      <div className={styles.heroBanner}>
        <div className={styles.heroBannerInner}>
          <h1 className={styles.heroBannerTitle}>
            {query.city ? `Tour tại ${query.city}` : 'Tìm kiếm tour'}
          </h1>
          <p className={styles.heroBannerSub}>
            {query.adults} người lớn · Khởi hành từ {query.departureDate}
          </p>

          <form className={styles.inlineSearch} onSubmit={handleBannerSearch}>
            <div className={styles.inlineField}>
              <FaMapMarkerAlt className={styles.inlineIcon} />
              <input
                className={styles.inlineInput}
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Điểm đến..."
              />
            </div>
            <div className={styles.inlineDivider} />
            <div className={styles.inlineField}>
              <FaCalendarAlt className={styles.inlineIcon} />
              <input
                className={styles.inlineInput}
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <div className={styles.inlineDivider} />
            <div className={styles.inlineField}>
              <FaUsers className={styles.inlineIcon} />
              <input
                className={styles.inlineInput}
                type="number"
                min={1}
                value={searchAdults}
                onChange={(e) => setSearchAdults(Math.max(1, Number(e.target.value)))}
                style={{ maxWidth: 50 }}
              />
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem' }}>người</span>
            </div>
            <button className={styles.inlineSearchBtn} type="submit">
              <FaSearch style={{ marginRight: 6 }} /> Tìm kiếm
            </button>
          </form>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className={styles.mainContent}>
        <div className={styles.resultsLayout}>
          {/* Sidebar */}
          <TourFilterSidebar
            filters={localFilters}
            onChange={setLocalFilters}
            onReset={() => setLocalFilters(DEFAULT_FILTERS)}
          />

          {/* Results */}
          <div className={styles.resultsList}>
            {/* Results header */}
            <div className={styles.resultsHeader}>
              <div className={styles.resultsInfo}>
                <p className={styles.resultsCity}>
                  {query.city ? `Tour tại ${query.city}` : 'Tất cả tour'}
                </p>
                <p className={styles.resultsCount}>
                  Tìm thấy <strong>{loading ? '...' : tours.length}</strong> tour phù hợp
                </p>
              </div>
              <div className={styles.sortRow}>
                <span className={styles.sortLabel}>Sắp xếp:</span>
                <select
                  className={styles.sortSelect}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* States */}
            {loading && (
              <div className={styles.statusBox}>
                <div className={styles.statusBoxIcon}>⏳</div>
                <p className={styles.statusBoxTitle}>Đang tải danh sách tour...</p>
                <p className={styles.statusBoxSub}>Vui lòng chờ trong giây lát</p>
              </div>
            )}

            {!loading && error && (
              <div className={styles.statusBoxError}>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={() => window.location.reload()}>Thử lại</button>
              </div>
            )}

            {!loading && !error && tours.length === 0 && (
              <div className={styles.statusBox}>
                <div className={styles.statusBoxIcon}>🔍</div>
                <p className={styles.statusBoxTitle}>Không tìm thấy tour phù hợp</p>
                <p className={styles.statusBoxSub}>Hãy thử thay đổi điểm đến hoặc điều chỉnh bộ lọc</p>
              </div>
            )}

            {!loading && !error && tours.length > 0 && (
              <div className={styles.cardList}>
                {tours.map((tour) => (
                  <TourCard key={tour.id} tour={tour} onClick={undefined} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   PAGE EXPORT
   ════════════════════════════════════════════════════════════ */
export default function TourSearchPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
        Đang tải...
      </div>
    }>
      <TourSearchInner />
    </Suspense>
  );
}

'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import HeroBanner from '@/components/Home/HeroBanner';
import FilterSidebar from '@/components/Hotels/FilterSidebar/FilterSidebar';
import SearchResultsHeader from '@/components/Hotels/SearchResultsHeader/SearchResultsHeader';
import HotelCard from '@/components/Hotels/HotelCard/HotelCard';
import hotelApi from '@/api/hotelApi';
import {
  findPriceAlertForQuery,
  removePriceAlertById,
  upsertPriceAlert,
} from '@/utils/conversionStorage';
import styles from './search.module.css';
import { FaGift } from 'react-icons/fa';

type ApiHotelSummary = {
  id: number;
  name: string;
  address: string;
  coverImage: string | null;
  minPricePerNight: number;
  avgRating: number;
  reviewCount: number;
  starRating: number;
  availableRoomTypes: number;
  availableRooms?: number;
};

type SearchHotelCardItem = {
  id: number;
  name: string;
  location: string;
  image: string | null;
  amenities: string[];
  guests: string;
  nights: number;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  rating: number;
  ratingLabel: string;
  reviewCount: number;
  sustainableLevel: number;
  urgency: string;
};

type HotelPriceAlert = {
  id: string;
  targetPrice: number;
  createdAt: string;
};

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrow = () => {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 1);
  if (Number.isNaN(nextDate.getTime())) {
    return getToday();
  }
  const year = nextDate.getFullYear();
  const month = String(nextDate.getMonth() + 1).padStart(2, '0');
  const day = String(nextDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDateInput = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const getRatingLabel = (rating: number) => {
  if (rating >= 9) return 'Tuyệt vời';
  if (rating >= 8) return 'Rất tốt';
  if (rating >= 7) return 'Tốt';
  return 'Ổn';
};

const AMENITY_KEYWORDS: Record<string, string[]> = {
  breakfast: ['bữa sáng'],
  allInclusive: ['tất cả đã bao gồm'],
  freeCancellation: ['hủy miễn phí'],
  pool: ['hồ bơi'],
  petFriendly: ['thú cưng'],
  wifi: ['wi-fi', 'wifi'],
  aircon: ['điều hòa'],
  balcony: ['ban công'],
  bathtub: ['bồn tắm'],
  kitchen: ['bếp'],
  washingMachine: ['máy giặt'],
};

const hasAmenityTag = (hotel: SearchHotelCardItem, amenityId: string) => {
  const keywords = AMENITY_KEYWORDS[amenityId] || [];
  if (keywords.length === 0) return false;

  const amenityText = hotel.amenities.join(' ').toLowerCase();
  return keywords.some((keyword) => amenityText.includes(keyword.toLowerCase()));
};

function HotelMap({ city }: { city: string }) {
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    city + ' hotels'
  )}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className={styles.mapBox}>
      <iframe
        src={mapUrl}
        width="100%"
        height="100%"
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map of hotels in ${city}`}
      />
    </div>
  );
}

function HotelSearchResultInner() {
  const searchParams = useSearchParams();
  const [hotels, setHotels] = useState<SearchHotelCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchPage, setSearchPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [activePriceAlert, setActivePriceAlert] = useState<HotelPriceAlert | null>(null);
  const [triggeredPrice, setTriggeredPrice] = useState<number | null>(null);

  const [filters, setFilters] = useState({
    budget: [0, 20000000],
    popular: [] as string[],
    facilities: [] as string[],
    guestRating: 'any',
    stars: [] as number[],
    sustainability: [] as number[],
  });

  const query = useMemo(() => {
    const city = searchParams.get('destination') || searchParams.get('city') || '';
    const rawCheckIn = searchParams.get('checkIn') || '';
    const rawCheckOut = searchParams.get('checkOut') || '';
    const checkIn = isValidDateInput(rawCheckIn) ? rawCheckIn : getToday();
    let checkOut = isValidDateInput(rawCheckOut) ? rawCheckOut : getTomorrow();
    const adults = Number(searchParams.get('adults') || 2);
    const rooms = Number(searchParams.get('rooms') || 1);

    if (new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
      const nextDate = new Date(checkIn);
      nextDate.setDate(nextDate.getDate() + 1);
      const year = nextDate.getFullYear();
      const month = String(nextDate.getMonth() + 1).padStart(2, '0');
      const day = String(nextDate.getDate()).padStart(2, '0');
      checkOut = `${year}-${month}-${day}`;
    }

    return {
      city: city.trim(),
      checkIn,
      checkOut,
      adults,
      rooms: rooms > 0 ? rooms : 1,
      children: Number(searchParams.get('children') || 0),
    };
  }, [searchParams]);

  const normalizedQuery = useMemo(
    () => ({
      city: query.city,
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      adults: query.adults,
      rooms: query.rooms,
      children: query.children,
    }),
    [query],
  );

  useEffect(() => {
    setSearchPage(0);
    setHasSearched(false);
  }, [query]);

  useEffect(() => {
    const matchedAlert = findPriceAlertForQuery(normalizedQuery);
    if (!matchedAlert) {
      setActivePriceAlert(null);
      setTargetPrice('');
      setTriggeredPrice(null);
      return;
    }

    setActivePriceAlert({
      id: String(matchedAlert.id),
      targetPrice: Number(matchedAlert.targetPrice || 0),
      createdAt: String(matchedAlert.createdAt || ''),
    });
    setTargetPrice(String(Number(matchedAlert.targetPrice || 0)));
    setTriggeredPrice(null);
  }, [normalizedQuery]);

  useEffect(() => {
    const fetchHotels = async () => {
      if (!query.city) {
        setLoading(false);
        setError('Vui lòng nhập điểm đến để tìm kiếm khách sạn.');
        setHotels([]);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await hotelApi.searchHotels({
          city: query.city,
          checkIn: query.checkIn,
          checkOut: query.checkOut,
          adults: query.adults,
          rooms: query.rooms,
          page: searchPage,
          pageSize: 8,
        });

        const payload = response?.data;
        const rawHotels: ApiHotelSummary[] = Array.isArray(payload?.hotels) ? payload.hotels : [];
        setTotalResults(payload?.total ?? 0);
        setTotalPages(payload?.totalPages ?? 0);
        const mappedHotels = rawHotels.map((item) => {
          const price = Number(item.minPricePerNight || 0);
          const originalPrice = price > 0 ? Math.round(price * 1.12) : 0;
          const rating = Number(item.avgRating || 0);
          const availableTypes = Number(item.availableRoomTypes || 0);
          const availableRooms = Number(item.availableRooms || 0);
          const amenityTags: string[] = [];

          if (availableRooms > 0) {
            amenityTags.push('Hủy miễn phí');
          }
          if (Number(item.starRating || 0) >= 4) {
            amenityTags.push('Wi-Fi miễn phí', 'Hồ bơi', 'Bữa sáng');
          }
          if (Number(item.starRating || 0) >= 3) {
            amenityTags.push('Điều hòa nhiệt độ');
          }
          if (availableTypes >= 2) {
            amenityTags.push('Bếp / Bếp nhỏ');
          }
          if (availableTypes >= 3) {
            amenityTags.push('Ban công');
          }

          return {
            id: item.id,
            name: item.name,
            location: item.address,
            image: item.coverImage,
            amenities: [
              ...amenityTags,
              ...(availableTypes > 0
                ? [
                    availableRooms > 0
                      ? `${availableRooms} phòng trống (${availableTypes} loại phòng)`
                      : `${availableTypes} loại phòng còn trống`,
                  ]
                : ['Đang hết phòng']),
            ],
            guests: `${query.adults} Người lớn${query.children ? `, ${query.children} Trẻ em` : ''}`,
            nights: Math.max(1, Math.ceil((new Date(query.checkOut).getTime() - new Date(query.checkIn).getTime()) / (1000 * 60 * 60 * 24))),
            originalPrice,
            discountPrice: price,
            discountPercent: originalPrice > price && price > 0 ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0,
            rating,
            ratingLabel: getRatingLabel(rating),
            reviewCount: Number(item.reviewCount || 0),
            sustainableLevel: Math.min(5, Math.max(0, Number(item.starRating || 0))),
            urgency: availableTypes > 0 && availableTypes <= 2 ? 'Sắp hết phòng trong mức giá này!' : '',
          };
        });

        setHotels(mappedHotels);
        setHasSearched(true);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách khách sạn. Vui lòng thử lại.';
        setError(errorMessage);
        setHotels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, [query, searchPage]);

  const displayedHotels = useMemo(() => {
    return hotels.filter((hotel) => {
      // 1. Budget
      if (hotel.discountPrice < filters.budget[0] || hotel.discountPrice > filters.budget[1]) {
        return false;
      }

      // 2. Guest Rating
      if (filters.guestRating !== 'any') {
        const minRating =
          filters.guestRating === 'wonderful' ? 9 :
          filters.guestRating === 'veryGood' ? 8 :
          filters.guestRating === 'good' ? 7 :
          filters.guestRating === 'pleasant' ? 6 : 0;
        if (hotel.rating < minRating) return false;
      }

      // 3. Stars / Classification
      if (filters.stars.length > 0) {
        // We map sustainableLevel to stars as mock data
        if (!filters.stars.includes(hotel.sustainableLevel)) return false;
      }

      // 4. Sustainability
      if (filters.sustainability.length > 0) {
        if (!filters.sustainability.includes(hotel.sustainableLevel)) return false;
      }

      // 5. Popular Filters
      if (filters.popular.length > 0) {
        for (const p of filters.popular) {
          if (!hasAmenityTag(hotel, p)) return false;
        }
      }

      // 6. Facilities
      if (filters.facilities.length > 0) {
        for (const f of filters.facilities) {
          if (!hasAmenityTag(hotel, f)) return false;
        }
      }

      return true;
    });
  }, [hotels, filters]);

  const lowestPrice = useMemo(() => {
    const prices = hotels
      .map((hotel) => Number(hotel.discountPrice || 0))
      .filter((price) => Number.isFinite(price) && price > 0);
    if (prices.length === 0) return null;
    return Math.min(...prices);
  }, [hotels]);

  const hasTriggeredAlert =
    activePriceAlert && lowestPrice != null && lowestPrice <= activePriceAlert.targetPrice;

  useEffect(() => {
    if (!activePriceAlert || lowestPrice == null) return;

    if (lowestPrice <= activePriceAlert.targetPrice && triggeredPrice !== lowestPrice) {
      setTriggeredPrice(lowestPrice);
    }
    if (lowestPrice > activePriceAlert.targetPrice && triggeredPrice != null) {
      setTriggeredPrice(null);
    }
  }, [activePriceAlert, lowestPrice, triggeredPrice]);

  const handleSavePriceAlert = () => {
    const numericTarget = Math.floor(Number(targetPrice || 0));
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      return;
    }

    const nextAlert = upsertPriceAlert({
      query: normalizedQuery,
      targetPrice: numericTarget,
    });

    setActivePriceAlert({
      id: String(nextAlert.id),
      targetPrice: Number(nextAlert.targetPrice || 0),
      createdAt: String(nextAlert.createdAt || ''),
    });
    setTargetPrice(String(numericTarget));
    setTriggeredPrice(null);
  };

  const handleRemovePriceAlert = () => {
    if (!activePriceAlert) return;
    removePriceAlertById(activePriceAlert.id);
    setActivePriceAlert(null);
    setTargetPrice('');
    setTriggeredPrice(null);
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.bannerWrapper}>
        <HeroBanner />
      </div>

      <main className={styles.mainContent}>
        {/* Map */}
        <HotelMap city={query.city || 'Điểm đến của bạn'} />

        {/* Results layout: sidebar + list */}
        <div className={styles.resultsLayout}>
          <FilterSidebar filters={filters} setFilters={setFilters} />

          <div className={styles.resultsList}>
            <SearchResultsHeader city={query.city || 'Điểm đến'} count={totalResults} />

            <section className={styles.priceAlertCard}>
              <div className={styles.priceAlertHeader}>
                <h3 className={styles.priceAlertTitle}>Price Alert</h3>
                {activePriceAlert && (
                  <span className={styles.priceAlertBadge}>Dang theo doi</span>
                )}
              </div>

              <p className={styles.priceAlertDesc}>
                Dat nguong gia de nhan thong bao khi co khach san tu muc ban mong muon.
              </p>

              <div className={styles.priceAlertControls}>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={styles.priceAlertInput}
                  aria-label="Nguong gia mong muon"
                  placeholder="Vi du: 1500000"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                />
                <button className={styles.priceAlertPrimaryBtn} onClick={handleSavePriceAlert}>
                  {activePriceAlert ? 'Cap nhat nguong' : 'Bat theo doi'}
                </button>
                {activePriceAlert && (
                  <button className={styles.priceAlertGhostBtn} onClick={handleRemovePriceAlert}>
                    Tat theo doi
                  </button>
                )}
              </div>

              {activePriceAlert && (
                <p className={styles.priceAlertMeta}>
                  Dang theo doi: gia {'<='} {activePriceAlert.targetPrice.toLocaleString('vi-VN')} VND cho
                  hanh trinh {query.city || 'khong xac dinh'} ({query.checkIn} - {query.checkOut}).
                </p>
              )}

              {hasTriggeredAlert && (
                <p className={styles.priceAlertSuccess}>
                  Da co gia phu hop! Muc thap nhat hien tai la {(lowestPrice || 0).toLocaleString('vi-VN')} VND.
                </p>
              )}
            </section>

            {loading && <div className={styles.statusBox}>Đang tải danh sách khách sạn...</div>}

            {!loading && error && (
              <div className={styles.statusBoxError}>
                <p>{error}</p>
                <button className={styles.retryBtn} onClick={() => window.location.reload()}>
                  Tải lại
                </button>
              </div>
            )}

            {!loading && !error && (
              <div className={styles.cardList}>
                {displayedHotels.length === 0 ? (
                  <div className={styles.statusBox}>Không tìm thấy khách sạn phù hợp với điều kiện tìm kiếm.</div>
                ) : (
                  displayedHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      onClick={() => {
                        const p = new URLSearchParams({
                          checkIn: query.checkIn,
                          checkOut: query.checkOut,
                          adults: String(query.adults),
                          children: String(query.children),
                          rooms: String(query.rooms),
                        });
                        window.location.href = `/hotels/${hotel.id}?${p.toString()}`;
                      }}
                    />
                  ))
                )}
              </div>
            )}

            {!loading && !error && displayedHotels.length > 0 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setSearchPage(p => Math.max(0, p - 1))}
                  disabled={searchPage === 0}
                  aria-label="Trang trước"
                >
                  ‹
                </button>

                <span className={styles.pageInfo}>
                  Trang {searchPage + 1} / {totalPages || 1} · {totalResults} khách sạn
                </span>

                <button
                  className={styles.pageBtn}
                  onClick={() => setSearchPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={searchPage >= totalPages - 1}
                  aria-label="Trang sau"
                >
                  ›
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* VIP Gifts ribbon badge */}
      <div className={styles.vipGiftsBadge}>
        <FaGift className={styles.giftIcon} />
        <span>Quà VIP</span>
      </div>
    </div>
  );
}

export default function HotelSearchResultPage() {
  return (
    <Suspense fallback={<div className={styles.statusBox}>Đang tải kết quả tìm kiếm...</div>}>
      <HotelSearchResultInner />
    </Suspense>
  );
}

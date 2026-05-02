'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import comboApi from '@/api/comboApi';

/* ── Types ── */
type Combo = {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  comboType: string;
  hotelId: number;
  hotelName: string;
  hotelImageUrl: string;
  hotelStars: number;
  tourId: number;
  tourName: string;
  tourImageUrl: string;
  tourDays: number;
  secondHotelId: number;
  secondHotelName: string;
  secondTourId: number;
  secondTourName: string;
  validFrom: string;
  validUntil: string;
  totalSlots: number;
  remainingSlots: number;
  originalPrice: number;
  comboPrice: number;
  savingsAmount: number;
  savingsPercent: number;
  isFeatured: boolean;
};

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả', emoji: '🌟' },
  { key: 'HOTEL_PLUS_TOUR', label: 'Khách sạn + Tour', emoji: '🏨' },
  { key: 'MULTI_HOTEL', label: 'Nhiều Khách sạn', emoji: '🏨🏨' },
  { key: 'MULTI_TOUR', label: 'Nhiều Tour', emoji: '🚌🚌' },
  { key: 'TOUR_BUNDLE', label: 'Gói Tour', emoji: '📦' },
  { key: 'HOTEL_AIRPORT_TRANSFER', label: 'Khách sạn + Đưa đón', emoji: '✈️' },
];

const BENEFITS = [
  { icon: '💰', title: 'Tiết kiệm đến 30%', desc: 'Giá combo luôn thấp hơn đặt riêng lẻ.', color: '#059669' },
  { icon: '📦', title: 'Trọn gói tiện lợi', desc: 'Một lần đặt, mọi thứ được sắp xếp sẵn.', color: '#0077b6' },
  { icon: '🛡️', title: 'Đảm bảo chất lượng', desc: 'Khách sạn & tour được kiểm duyệt kỹ lưỡng.', color: '#7c3aed' },
  { icon: '📞', title: 'Hỗ trợ 24/7', desc: 'Đội ngũ tư vấn sẵn sàng giải quyết mọi vấn đề.', color: '#f59e0b' },
];

const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=85',
];

const DEFAULT_HOTEL_IMG = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=700&q=80';
const DEFAULT_TOUR_IMG = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=700&q=80';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function getStars(n: number) {
  return '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));
}

function getComboTypeLabel(type: string) {
  const labels: Record<string, string> = {
    HOTEL_PLUS_TOUR: 'Khách sạn + Tour',
    MULTI_HOTEL: 'Nhiều Khách sạn',
    MULTI_TOUR: 'Nhiều Tour',
    HOTEL_AIRPORT_TRANSFER: 'Khách sạn + Đưa đón',
    TOUR_BUNDLE: 'Gói Tour',
  };
  return labels[type] || type;
}

function getComboBadge(type: string) {
  const badges: Record<string, string> = {
    HOTEL_PLUS_TOUR: '🔥 Bán chạy',
    MULTI_HOTEL: '🏨 Đa dạng',
    MULTI_TOUR: '🚌 Khám phá',
    HOTEL_AIRPORT_TRANSFER: '✈️ Tiện lợi',
    TOUR_BUNDLE: '📦 Tiết kiệm',
  };
  return badges[type] || '🌟 Combo';
}

function getHotelIncludes(combo: Combo): string[] {
  const items = ['Khách sạn cao cấp', 'Bữa sáng buffet', 'Wi-Fi miễn phí'];
  if (combo.comboType === 'HOTEL_AIRPORT_TRANSFER') items.push('Đưa đón sân bay');
  if (combo.comboType === 'HOTEL_PLUS_TOUR') items.push('Tour du lịch', 'Hướng dẫn viên');
  return items;
}

export default function CombosPage() {
  const router = useRouter();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const loadCombos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await comboApi.getCombos();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setCombos(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách combo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCombos();
  }, [loadCombos]);

  const filtered = filter === 'ALL'
    ? combos
    : combos.filter(c => c.comboType === filter);

  const featuredCombos = combos.filter(c => c.isFeatured);
  const heroImage = featuredCombos[0]?.imageUrl || HERO_SLIDES[0];

  return (
    <main className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroSlideshow}>
          {HERO_SLIDES.map((src, i) => (
            <div key={i} className={styles.heroSlide} style={{ backgroundImage: `url(${src})` }} />
          ))}
        </div>
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Combo độc quyền · Tiết kiệm thật sự
          </div>
          <h1 className={styles.heroH1}>
            Đặt Combo <span>Hotel + Tour</span>
            <br />Tiết Kiệm Đến 30% 🎒
          </h1>
          <p className={styles.heroSub}>
            Gói du lịch trọn vẹn — khách sạn cao cấp kết hợp tour đặc sắc. Một lần đặt, tất cả đã lo.
          </p>
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>✅ Bao gồm đưa đón</span>
            <span className={styles.heroPill}>✅ Bảo hiểm du lịch</span>
            <span className={styles.heroPill}>✅ Hướng dẫn viên</span>
            <span className={styles.heroPill}>✅ Hoàn tiền nếu hủy</span>
          </div>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{combos.length}+</span>
              <span className={styles.heroStatLabel}>Gói combo</span>
            </div>
            <div className={styles.heroDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>Đến 30%</span>
              <span className={styles.heroStatLabel}>Tiết kiệm</span>
            </div>
            <div className={styles.heroDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>10K+</span>
              <span className={styles.heroStatLabel}>Khách hài lòng</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW COMBO WORKS ── */}
      <div className={styles.howComboWrap}>
        <div className={styles.container}>
          <div className={styles.howComboRow}>
            <div className={styles.howComboItem}>
              <span className={styles.howComboIcon}>🏨</span>
              <div><strong>Khách sạn</strong><p>3-5★ được tuyển chọn</p></div>
            </div>
            <div className={styles.howComboPlusBig}>+</div>
            <div className={styles.howComboItem}>
              <span className={styles.howComboIcon}>🗺️</span>
              <div><strong>Tour du lịch</strong><p>Trải nghiệm địa phương</p></div>
            </div>
            <div className={styles.howComboPlusBig}>=</div>
            <div className={`${styles.howComboItem} ${styles.howComboSaving}`}>
              <span className={styles.howComboIcon}>💰</span>
              <div><strong>Tiết kiệm 30%</strong><p>So với đặt riêng lẻ</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILTER ── */}
      <div className={styles.filterWrap}>
        <div className={styles.filterInner}>
          <span className={styles.filterLabel}>Danh mục:</span>
          <div className={styles.filterTabs}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab.key}
                className={`${styles.filterTab} ${filter === tab.key ? styles.filterTabActive : ''}`}
                onClick={() => setFilter(tab.key)}
              >
                {tab.emoji} {tab.label}
                {filter === tab.key && <span className={styles.filterCount}>{filtered.length}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── COMBO CARDS ── */}
      <section className={styles.comboSection}>
        <div className={styles.container}>
          {loading && (
            <div className={styles.loadingRow}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonImg} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonLine} style={{ width: '60%' }} />
                    <div className={styles.skeletonLine} style={{ width: '80%' }} />
                    <div className={styles.skeletonLine} style={{ width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>⚠️</div>
              <h3>Không thể tải combo</h3>
              <p>{error}</p>
              <button className={styles.emptyBtn} onClick={() => void loadCombos()}>
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <h3>Chưa có combo nào</h3>
              <p>Admin chưa tạo combo nào. Hãy quay lại sau.</p>
              <button className={styles.emptyBtn} onClick={() => setFilter('ALL')}>
                Xem tất cả
              </button>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className={styles.comboGrid}>
              {filtered.map(combo => {
                const savings = (combo.originalPrice || 0) - (combo.comboPrice || 0);
                const hotelImg = combo.hotelImageUrl || combo.imageUrl || DEFAULT_HOTEL_IMG;
                const tourImg = combo.tourImageUrl || combo.imageUrl || DEFAULT_TOUR_IMG;
                const nights = combo.tourDays ? `${combo.tourDays}N${Math.max(0, (combo.tourDays - 1))}Đ` : 'Combo';

                return (
                  <div
                    key={combo.id}
                    className={styles.comboCard}
                    onMouseEnter={() => setHoveredCard(combo.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {combo.isFeatured && (
                      <div className={styles.comboBadge}>{getComboBadge(combo.comboType)}</div>
                    )}

                    <div className={styles.comboSavingsStrip}>
                      <span className={styles.savingsPct}>
                        Tiết kiệm {combo.savingsPercent ? `${combo.savingsPercent}%` : ''}
                      </span>
                      {savings > 0 && (
                        <span className={styles.savingsAmt}>-{formatCurrency(savings)}</span>
                      )}
                    </div>

                    {/* Split images */}
                    <div className={styles.comboImages}>
                      <div className={styles.comboImageHalf}>
                        <img
                          src={hotelImg}
                          alt={combo.hotelName || 'Khách sạn'}
                          className={`${styles.comboImg} ${hoveredCard === combo.id ? styles.comboImgHovered : ''}`}
                          loading="lazy"
                        />
                        <div className={styles.comboImageLabel}>🏨 {combo.hotelName || 'Khách sạn'}</div>
                      </div>
                      <div className={styles.comboImageDivider}>
                        <div className={styles.comboImageDividerLine} />
                        <div className={styles.comboPlusBadge}>+</div>
                        <div className={styles.comboImageDividerLine} />
                      </div>
                      <div className={styles.comboImageHalf}>
                        <img
                          src={tourImg}
                          alt={combo.tourName || 'Tour'}
                          className={`${styles.comboImg} ${hoveredCard === combo.id ? styles.comboImgHovered : ''}`}
                          loading="lazy"
                        />
                        <div className={styles.comboImageLabel}>🗺️ {combo.tourName || 'Tour'}</div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div className={styles.comboBody}>
                      <div className={styles.comboDestination}>
                        <span className={styles.comboDestPin}>📍</span>
                        {getComboTypeLabel(combo.comboType)} · {nights}
                      </div>
                      <h3 className={styles.comboName}>{combo.name}</h3>
                      {combo.description && (
                        <p className={styles.comboTagline}>{combo.description.slice(0, 120)}</p>
                      )}

                      {/* Services */}
                      <div className={styles.comboServices}>
                        <div className={styles.comboServiceItem}>
                          <span className={styles.comboServiceEmoji}>🏨</span>
                          <div>
                            <div className={styles.comboServiceName}>{combo.hotelName || 'Khách sạn'}</div>
                            {combo.hotelStars > 0 && (
                              <div className={styles.comboServiceStars}>{getStars(combo.hotelStars)}</div>
                            )}
                          </div>
                        </div>
                        {combo.tourName && (
                          <div className={styles.comboServiceItem}>
                            <span className={styles.comboServiceEmoji}>🗺️</span>
                            <div>
                              <div className={styles.comboServiceName}>{combo.tourName}</div>
                              {combo.tourDays && (
                                <div className={styles.comboServiceDuration}>{combo.tourDays} ngày khám phá</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Includes chips */}
                      <div className={styles.includesWrap}>
                        {getHotelIncludes(combo).slice(0, 4).map(item => (
                          <span key={item} className={styles.includeChip}>✓ {item}</span>
                        ))}
                      </div>

                      {/* Pricing */}
                      <div className={styles.comboPricing}>
                        <div className={styles.comboPricingLeft}>
                          {combo.originalPrice > 0 && (
                            <span className={styles.originalPrice}>{formatCurrency(combo.originalPrice)}</span>
                          )}
                          <span className={styles.comboPrice}>{formatCurrency(combo.comboPrice)}</span>
                          <span className={styles.perPerson}>/ người</span>
                        </div>
                        <button
                          className={styles.comboBookBtn}
                          onClick={() => router.push(`/combos/${combo.id}/book`)}
                        >
                          Đặt combo →
                        </button>
                      </div>

                      {/* Slot indicator */}
                      {combo.remainingSlots !== undefined && combo.remainingSlots !== null && (
                        <div className={styles.slotIndicator}>
                          <span className={combo.remainingSlots < 5 ? styles.slotLow : styles.slotOk}>
                            {combo.remainingSlots < 5
                              ? `⚠️ Chỉ còn ${combo.remainingSlots} slot!`
                              : `📋 Còn ${combo.remainingSlots} slot`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className={styles.benefitsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Vì sao chọn Combo?</p>
            <h2 className={styles.sectionTitle}>
              Đặt combo — <span className={styles.accent}>lợi đủ mọi bề</span>
            </h2>
          </div>
          <div className={styles.benefitsGrid}>
            {BENEFITS.map(b => (
              <div
                key={b.title}
                className={styles.benefitCard}
                style={{ '--b-color': b.color } as React.CSSProperties}
              >
                <div className={styles.benefitIcon} style={{ background: `${b.color}18` }}>
                  {b.icon}
                </div>
                <h3 className={styles.benefitTitle}>{b.title}</h3>
                <p className={styles.benefitDesc}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBanner}>
            <div className={styles.ctaFloatCircle1} />
            <div className={styles.ctaFloatCircle2} />
            <div className={styles.ctaText}>
              <h2 className={styles.ctaH2}>Sẵn sàng cho chuyến đi tuyệt vời? 🌟</h2>
              <p className={styles.ctaSub}>Đặt combo ngay hôm nay và tiết kiệm đến 30%.</p>
            </div>
            <div className={styles.ctaBtns}>
              <button className={styles.ctaBtnPrimary} onClick={() => window.location.href = '/hotels'}>
                🏨 Xem khách sạn
              </button>
              <button className={styles.ctaBtnOutline} onClick={() => window.location.href = '/tours'}>
                🗺️ Xem tour
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

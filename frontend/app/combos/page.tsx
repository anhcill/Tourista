'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

/* ── Types ── */
type Combo = {
  id: number;
  name: string;
  tagline: string;
  destination: string;
  category: 'RESORT' | 'EXPLORE' | 'FAMILY' | 'HONEYMOON';
  hotelName: string;
  hotelStars: number;
  hotelImage: string;
  tourName: string;
  tourDays: number;
  tourImage: string;
  originalPrice: number;
  comboPrice: number;
  savingsPercent: number;
  includes: string[];
  duration: string;
  highlight: string;
  badge?: string;
};

/* ── Mock Data ── */
const COMBO_DATA: Combo[] = [
  {
    id: 1,
    name: 'Phú Quốc Paradise',
    tagline: 'Nghỉ dưỡng 5★ + Tour lặn biển',
    destination: 'Phú Quốc',
    category: 'RESORT',
    hotelName: 'JW Marriott Phú Quốc',
    hotelStars: 5,
    hotelImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=700&q=80',
    tourName: 'Lặn ngắm san hô Hòn Thơm',
    tourDays: 1,
    tourImage: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=700&q=80',
    originalPrice: 12500000,
    comboPrice: 8900000,
    savingsPercent: 29,
    includes: ['3 đêm khách sạn', 'Bữa sáng buffet', 'Tour lặn biển', 'Đón sân bay', 'Bảo hiểm du lịch'],
    duration: '4N3Đ',
    highlight: 'Ngắm san hô, tắm biển, nghỉ dưỡng xa xỉ',
    badge: '🔥 Bán chạy nhất',
  },
  {
    id: 2,
    name: 'Đà Nẵng Discovery',
    tagline: 'Khách sạn biển + Tour Sơn Trà & Hội An',
    destination: 'Đà Nẵng',
    category: 'EXPLORE',
    hotelName: 'Hyatt Regency Đà Nẵng',
    hotelStars: 5,
    hotelImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=700&q=80',
    tourName: 'Sơn Trà - Hội An - Bà Nà Hills',
    tourDays: 2,
    tourImage: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=700&q=80',
    originalPrice: 9800000,
    comboPrice: 6990000,
    savingsPercent: 29,
    includes: ['2 đêm khách sạn', 'Bữa sáng', 'Tour 2 ngày', 'Xe đưa đón', 'Vé tham quan'],
    duration: '3N2Đ',
    highlight: 'Khám phá phố cổ, núi Bà Nà huyền bí',
    badge: '⭐ Phổ biến',
  },
  {
    id: 3,
    name: 'Sapa Honeymoon',
    tagline: 'Bungalow mây + Trekking ruộng bậc thang',
    destination: 'Sapa',
    category: 'HONEYMOON',
    hotelName: 'Topas Ecolodge Sapa',
    hotelStars: 4,
    hotelImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=700&q=80',
    tourName: 'Trekking bản Cát Cát & Lao Chải',
    tourDays: 2,
    tourImage: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=700&q=80',
    originalPrice: 7200000,
    comboPrice: 5100000,
    savingsPercent: 29,
    includes: ['2 đêm bungalow', 'Bữa sáng & tối', 'Trekking có hướng dẫn', 'Đón ga tàu', 'Bảo hiểm'],
    duration: '3N2Đ',
    highlight: 'Sương mù lãng mạn, ruộng bậc thang hùng vĩ',
    badge: '💕 Lý tưởng đôi',
  },
  {
    id: 4,
    name: 'Hà Nội Family Fun',
    tagline: 'Khách sạn trung tâm + Tour gia đình',
    destination: 'Hà Nội',
    category: 'FAMILY',
    hotelName: 'Sofitel Legend Métropole',
    hotelStars: 5,
    hotelImage: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=700&q=80',
    tourName: 'Hà Nội - Ninh Bình - Hạ Long 1 ngày',
    tourDays: 1,
    tourImage: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=700&q=80',
    originalPrice: 11000000,
    comboPrice: 7800000,
    savingsPercent: 29,
    includes: ['2 đêm khách sạn', 'Bữa sáng', 'Tour Hạ Long 1 ngày', 'Xe đưa đón sân bay', 'Bảo hiểm trẻ em'],
    duration: '3N2Đ',
    highlight: 'Khám phá thủ đô & vịnh kỳ quan thế giới',
  },
  {
    id: 5,
    name: 'Nha Trang Sun & Sea',
    tagline: 'Resort biển + Tour 4 đảo huyền thoại',
    destination: 'Nha Trang',
    category: 'RESORT',
    hotelName: 'Six Senses Ninh Van Bay',
    hotelStars: 5,
    hotelImage: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=700&q=80',
    tourName: 'Tour 4 đảo Nha Trang',
    tourDays: 1,
    tourImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80',
    originalPrice: 13500000,
    comboPrice: 9500000,
    savingsPercent: 30,
    includes: ['3 đêm resort 5★', 'Ăn sáng & trưa', 'Tour 4 đảo', 'Canoe kayak', 'Bảo hiểm cao cấp'],
    duration: '4N3Đ',
    highlight: 'Biển xanh, cát trắng, đảo hoang sơ tuyệt đẹp',
    badge: '✨ Premium',
  },
  {
    id: 6,
    name: 'Đà Lạt Romantic Escape',
    tagline: 'Villa thông ngàn + Tour cà phê & thác nước',
    destination: 'Đà Lạt',
    category: 'HONEYMOON',
    hotelName: 'Dalat Palace Heritage Hotel',
    hotelStars: 4,
    hotelImage: 'https://images.unsplash.com/photo-1605538032404-d7f54b22a5e7?w=700&q=80',
    tourName: 'Cáp treo Datanla - Thác Elephant',
    tourDays: 1,
    tourImage: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=700&q=80',
    originalPrice: 6800000,
    comboPrice: 4900000,
    savingsPercent: 28,
    includes: ['2 đêm villa', 'Bữa sáng', 'Tour thác nước', 'Thưởng thức cà phê Arabica', 'Đón sân bay'],
    duration: '3N2Đ',
    highlight: 'Sương khói, hoa dại, không gian lãng mạn nhất Việt Nam',
  },
];

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả', emoji: '🌟' },
  { key: 'RESORT', label: 'Nghỉ dưỡng', emoji: '🏖️' },
  { key: 'EXPLORE', label: 'Khám phá', emoji: '🗺️' },
  { key: 'FAMILY', label: 'Gia đình', emoji: '👨‍👩‍👧' },
  { key: 'HONEYMOON', label: 'Cặp đôi', emoji: '💕' },
];

const BENEFITS = [
  {
    icon: '💰',
    title: 'Tiết kiệm đến 30%',
    desc: 'Giá combo luôn thấp hơn đặt riêng lẻ. Đặt cùng nhau — trả ít hơn.',
    color: '#059669',
  },
  {
    icon: '📦',
    title: 'Trọn gói tiện lợi',
    desc: 'Một lần đặt, mọi thứ được sắp xếp: khách sạn, tour, đưa đón, bảo hiểm.',
    color: '#0077b6',
  },
  {
    icon: '🛡️',
    title: 'Đảm bảo chất lượng',
    desc: 'Tất cả khách sạn & tour trong combo đều được kiểm duyệt kỹ lưỡng.',
    color: '#7c3aed',
  },
  {
    icon: '📞',
    title: 'Hỗ trợ 24/7',
    desc: 'Đội ngũ tư vấn sẵn sàng giải quyết mọi vấn đề trong suốt chuyến đi.',
    color: '#f59e0b',
  },
];

const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1600&q=85',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85',
  'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=1600&q=85',
];

/* ── Helpers ── */
function formatCurrency(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

function getStars(n: number) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/* ════════════════════════ COMPONENT ════════════════════════ */
export default function CombosPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('ALL');
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const filtered = filter === 'ALL'
    ? COMBO_DATA
    : COMBO_DATA.filter(c => c.category === filter);

  return (
    <main className={styles.page}>

      {/* ═══════════════ HERO ═══════════════ */}
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
            Gói du lịch trọn vẹn — khách sạn cao cấp kết hợp tour đặc sắc. Một lần đặt, tất cả đã lo. Giá combo luôn thấp hơn đặt riêng lẻ.
          </p>

          {/* Value proposition pills */}
          <div className={styles.heroPills}>
            <span className={styles.heroPill}>✅ Bao gồm đưa đón</span>
            <span className={styles.heroPill}>✅ Bảo hiểm du lịch</span>
            <span className={styles.heroPill}>✅ Hướng dẫn viên</span>
            <span className={styles.heroPill}>✅ Hoàn tiền nếu hủy</span>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{COMBO_DATA.length}+</span>
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

      {/* ═══════════════ HOW COMBO WORKS ═══════════════ */}
      <div className={styles.howComboWrap}>
        <div className={styles.container}>
          <div className={styles.howComboRow}>
            <div className={styles.howComboItem}>
              <span className={styles.howComboIcon}>🏨</span>
              <div>
                <strong>Khách sạn</strong>
                <p>3-5★ được tuyển chọn</p>
              </div>
            </div>
            <div className={styles.howComboPlusBig}>+</div>
            <div className={styles.howComboItem}>
              <span className={styles.howComboIcon}>🗺️</span>
              <div>
                <strong>Tour du lịch</strong>
                <p>Trải nghiệm địa phương</p>
              </div>
            </div>
            <div className={styles.howComboPlusBig}>=</div>
            <div className={`${styles.howComboItem} ${styles.howComboSaving}`}>
              <span className={styles.howComboIcon}>💰</span>
              <div>
                <strong>Tiết kiệm 30%</strong>
                <p>So với đặt riêng lẻ</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ FILTER ═══════════════ */}
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

      {/* ═══════════════ COMBO CARDS ═══════════════ */}
      <section className={styles.comboSection}>
        <div className={styles.container}>
          {filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <h3>Chưa có combo cho danh mục này</h3>
              <button onClick={() => setFilter('ALL')} className={styles.emptyBtn}>
                Xem tất cả combo
              </button>
            </div>
          )}

          <div className={styles.comboGrid}>
            {filtered.map(combo => {
              const savings = combo.originalPrice - combo.comboPrice;
              return (
                <div
                  key={combo.id}
                  className={styles.comboCard}
                  onMouseEnter={() => setHoveredCard(combo.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  {/* Badge */}
                  {combo.badge && (
                    <div className={styles.comboBadge}>{combo.badge}</div>
                  )}

                  {/* Savings strip */}
                  <div className={styles.comboSavingsStrip}>
                    <span className={styles.savingsPct}>Tiết kiệm {combo.savingsPercent}%</span>
                    <span className={styles.savingsAmt}>-{formatCurrency(savings)}</span>
                  </div>

                  {/* Split image — Hotel + Tour */}
                  <div className={styles.comboImages}>
                    <div className={styles.comboImageHalf}>
                      <img
                        src={combo.hotelImage}
                        alt={combo.hotelName}
                        className={`${styles.comboImg} ${hoveredCard === combo.id ? styles.comboImgHovered : ''}`}
                        loading="lazy"
                      />
                      <div className={styles.comboImageLabel}>🏨 Khách sạn</div>
                    </div>
                    <div className={styles.comboImageDivider}>
                      <div className={styles.comboImageDividerLine} />
                      <div className={styles.comboPlusBadge}>+</div>
                      <div className={styles.comboImageDividerLine} />
                    </div>
                    <div className={styles.comboImageHalf}>
                      <img
                        src={combo.tourImage}
                        alt={combo.tourName}
                        className={`${styles.comboImg} ${hoveredCard === combo.id ? styles.comboImgHovered : ''}`}
                        loading="lazy"
                      />
                      <div className={styles.comboImageLabel}>🗺️ Tour</div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className={styles.comboBody}>
                    <div className={styles.comboDestination}>
                      <span className={styles.comboDestPin}>📍</span>
                      {combo.destination} · {combo.duration}
                    </div>
                    <h3 className={styles.comboName}>{combo.name}</h3>
                    <p className={styles.comboTagline}>{combo.tagline}</p>

                    {/* Hotel & Tour info */}
                    <div className={styles.comboServices}>
                      <div className={styles.comboServiceItem}>
                        <span className={styles.comboServiceEmoji}>🏨</span>
                        <div>
                          <div className={styles.comboServiceName}>{combo.hotelName}</div>
                          <div className={styles.comboServiceStars}>{getStars(combo.hotelStars)}</div>
                        </div>
                      </div>
                      <div className={styles.comboServiceItem}>
                        <span className={styles.comboServiceEmoji}>🗺️</span>
                        <div>
                          <div className={styles.comboServiceName}>{combo.tourName}</div>
                          <div className={styles.comboServiceDuration}>{combo.tourDays} ngày khám phá</div>
                        </div>
                      </div>
                    </div>

                    {/* Includes chips */}
                    <div className={styles.includesWrap}>
                      {combo.includes.slice(0, 4).map(item => (
                        <span key={item} className={styles.includeChip}>✓ {item}</span>
                      ))}
                      {combo.includes.length > 4 && (
                        <span className={styles.includeChipMore}>+{combo.includes.length - 4} nữa</span>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className={styles.comboPricing}>
                      <div className={styles.comboPricingLeft}>
                        <span className={styles.originalPrice}>{formatCurrency(combo.originalPrice)}</span>
                        <span className={styles.comboPrice}>{formatCurrency(combo.comboPrice)}</span>
                        <span className={styles.perPerson}>/ người</span>
                      </div>
                      <button
                        className={styles.comboBookBtn}
                        onClick={() => router.push(`/hotels?destination=${combo.destination}`)}
                      >
                        Đặt combo →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ BENEFITS ═══════════════ */}
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

      {/* ═══════════════ CTA ═══════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBanner}>
            <div className={styles.ctaFloatCircle1} />
            <div className={styles.ctaFloatCircle2} />
            <div className={styles.ctaText}>
              <h2 className={styles.ctaH2}>Sẵn sàng cho chuyến đi tuyệt vời? 🌟</h2>
              <p className={styles.ctaSub}>Đặt combo ngay hôm nay và tiết kiệm đến 30% so với đặt riêng lẻ.</p>
            </div>
            <div className={styles.ctaBtns}>
              <Link href="/hotels" className={styles.ctaBtnPrimary}>🏨 Xem khách sạn</Link>
              <Link href="/tours" className={styles.ctaBtnOutline}>🗺️ Xem tour</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

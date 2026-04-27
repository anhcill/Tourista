'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import promotionApi from '@/api/promotionApi';
import styles from './page.module.css';

/* ── Types ── */
type Promotion = {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  appliesTo: 'ALL' | 'HOTEL' | 'TOUR';
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

/* ── Mock fallback data (dùng khi API chưa có dữ liệu) ── */
const MOCK_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    code: 'SUMMER30',
    name: 'Hè Rực Rỡ - Giảm 30%',
    description: 'Chào hè 2026 với ưu đãi giảm 30% cho tất cả khách sạn và tour. Áp dụng cho đơn hàng từ 2 triệu đồng.',
    discountType: 'PERCENTAGE',
    discountValue: 30,
    minOrderAmount: 2000000,
    maxDiscountAmount: 1500000,
    appliesTo: 'ALL',
    validFrom: '2026-04-01T00:00:00',
    validUntil: '2026-06-30T23:59:59',
    isActive: true,
  },
  {
    id: 2,
    code: 'HOTEL500K',
    name: 'Nghỉ Dưỡng Tiết Kiệm',
    description: 'Giảm ngay 500.000đ cho đặt phòng khách sạn. Không giới hạn số lần sử dụng, tặng thêm bữa sáng miễn phí.',
    discountType: 'FIXED',
    discountValue: 500000,
    minOrderAmount: 1500000,
    maxDiscountAmount: null,
    appliesTo: 'HOTEL',
    validFrom: '2026-04-15T00:00:00',
    validUntil: '2026-05-31T23:59:59',
    isActive: true,
  },
  {
    id: 3,
    code: 'TOURPHU20',
    name: 'Tour Phú Quốc - Giảm 20%',
    description: 'Khám phá đảo ngọc Phú Quốc với ưu đãi 20% cho mọi tour. Bao gồm vận chuyển và hướng dẫn viên.',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 3000000,
    maxDiscountAmount: 2000000,
    appliesTo: 'TOUR',
    validFrom: '2026-04-20T00:00:00',
    validUntil: '2026-05-20T23:59:59',
    isActive: true,
  },
  {
    id: 4,
    code: 'NEWUSER15',
    name: 'Chào Thành Viên Mới',
    description: 'Dành tặng thành viên mới ưu đãi 15% cho lần đặt đầu tiên. Áp dụng không giới hạn loại dịch vụ.',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minOrderAmount: 500000,
    maxDiscountAmount: 800000,
    appliesTo: 'ALL',
    validFrom: '2026-01-01T00:00:00',
    validUntil: '2026-12-31T23:59:59',
    isActive: true,
  },
  {
    id: 5,
    code: 'DANANG25',
    name: 'Đà Nẵng - Thành Phố Đáng Sống',
    description: 'Ưu đãi đặc biệt 25% cho mọi dịch vụ tại Đà Nẵng. Cơ hội trải nghiệm cầu Rồng và biển Mỹ Khê.',
    discountType: 'PERCENTAGE',
    discountValue: 25,
    minOrderAmount: 2500000,
    maxDiscountAmount: 1200000,
    appliesTo: 'ALL',
    validFrom: '2026-05-01T00:00:00',
    validUntil: '2026-05-31T23:59:59',
    isActive: true,
  },
  {
    id: 6,
    code: 'COMBO200K',
    name: 'Giảm Thêm Khi Đặt Combo',
    description: 'Đặt combo Hotel + Tour được giảm thêm 200.000đ. Kết hợp với mã khác để tiết kiệm tối đa.',
    discountType: 'FIXED',
    discountValue: 200000,
    minOrderAmount: 4000000,
    maxDiscountAmount: null,
    appliesTo: 'ALL',
    validFrom: '2026-04-01T00:00:00',
    validUntil: '2026-06-15T23:59:59',
    isActive: true,
  },
];

const FILTER_TABS = [
  { key: 'ALL', label: 'Tất cả', emoji: '🎫' },
  { key: 'HOTEL', label: 'Khách sạn', emoji: '🏨' },
  { key: 'TOUR', label: 'Tour du lịch', emoji: '🗺️' },
];

const HOW_TO_STEPS = [
  { step: '01', icon: '🔍', title: 'Chọn dịch vụ', desc: 'Tìm khách sạn hoặc tour du lịch phù hợp với nhu cầu của bạn' },
  { step: '02', icon: '📋', title: 'Sao chép mã', desc: 'Click "Sao chép" để lấy mã khuyến mãi vào clipboard' },
  { step: '03', icon: '💳', title: 'Áp dụng khi thanh toán', desc: 'Dán mã vào ô nhập mã giảm giá ở trang thanh toán và tận hưởng ưu đãi!' },
];

/* ── Helpers ── */
function getTimeLeft(validUntil: string) {
  const now = new Date().getTime();
  const end = new Date(validUntil).getTime();
  const diff = end - now;
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) return `Còn ${days} ngày ${hours}h`;
  if (hours > 0) return `Còn ${hours}h ${minutes}p`;
  return `Còn ${minutes} phút`;
}

function formatDiscount(promo: Promotion) {
  if (promo.discountType === 'PERCENTAGE') {
    return `${promo.discountValue}%`;
  }
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(promo.discountValue);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getAppliesLabel(appliesTo: string) {
  if (appliesTo === 'HOTEL') return '🏨 Khách sạn';
  if (appliesTo === 'TOUR') return '🗺️ Tour';
  return '✨ Tất cả';
}

function getAppliesColor(appliesTo: string) {
  if (appliesTo === 'HOTEL') return '#0077b6';
  if (appliesTo === 'TOUR') return '#059669';
  return '#7c3aed';
}

/* ════════════════════════════ COMPONENT ════════════════════════════ */
export default function PromotionsPage() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  /* ── Fetch data ── */
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const res = await promotionApi.getActivePromotions();
        const data: Promotion[] = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setPromotions(data.length > 0 ? data : MOCK_PROMOTIONS);
      } catch {
        setPromotions(MOCK_PROMOTIONS);
      } finally {
        setLoading(false);
      }
    };
    fetchPromotions();
  }, []);

  /* ── Copy to clipboard ── */
  const handleCopy = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  }, []);

  /* ── Filter ── */
  const filtered = filter === 'ALL'
    ? promotions
    : promotions.filter(p => p.appliesTo === filter || p.appliesTo === 'ALL');

  /* ── Stats ── */
  const totalSavings = promotions.reduce((acc, p) =>
    p.discountType === 'PERCENTAGE' ? acc + p.discountValue : acc, 0);

  return (
    <main className={styles.page}>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroParticles}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className={styles.particle} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
        <div className={styles.heroInner}>
          <div className={styles.heroEyebrow}>
            <span className={styles.eyebrowDot} />
            Ưu đãi độc quyền · Cập nhật liên tục
          </div>
          <h1 className={styles.heroH1}>
            Săn Ưu Đãi <span>Siêu Hot</span>
            <br />Tiết Kiệm Tối Đa 🔥
          </h1>
          <p className={styles.heroSub}>
            Hàng chục mã giảm giá độc quyền cho khách sạn và tour du lịch. Sao chép ngay — áp dụng tức thì khi thanh toán.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>{promotions.length}+</span>
              <span className={styles.heroStatLabel}>Mã đang hoạt động</span>
            </div>
            <div className={styles.heroDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>Đến {totalSavings}%</span>
              <span className={styles.heroStatLabel}>Giảm giá tối đa</span>
            </div>
            <div className={styles.heroDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNum}>Miễn phí</span>
              <span className={styles.heroStatLabel}>Không phí ẩn</span>
            </div>
          </div>
        </div>
        {/* Floating promo badges */}
        <div className={styles.heroFloatingBadge1}>🎁 -30%</div>
        <div className={styles.heroFloatingBadge2}>🏨 -500K</div>
        <div className={styles.heroFloatingBadge3}>✈️ -25%</div>
      </section>

      {/* ═══════════════ FILTER BAR ═══════════════ */}
      <div className={styles.filterWrap}>
        <div className={styles.filterInner}>
          <span className={styles.filterLabel}>Lọc theo:</span>
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

      {/* ═══════════════ PROMO CARDS ═══════════════ */}
      <section className={styles.promoSection}>
        <div className={styles.container}>
          {loading && (
            <div className={styles.skeletonGrid}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={styles.skeletonCard}>
                  <div className={styles.skeletonTop} />
                  <div className={styles.skeletonBody}>
                    <div className={styles.skeletonLine} />
                    <div className={styles.skeletonLineShort} />
                    <div className={styles.skeletonCode} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎟️</div>
              <h3 className={styles.emptyTitle}>Chưa có mã khuyến mãi</h3>
              <p className={styles.emptyDesc}>Thử lọc theo danh mục khác hoặc quay lại sau nhé!</p>
              <button className={styles.emptyBtn} onClick={() => setFilter('ALL')}>Xem tất cả mã</button>
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className={styles.promoGrid}>
              {filtered.map((promo) => {
                const timeLeft = getTimeLeft(promo.validUntil);
                const isExpiringSoon = timeLeft && timeLeft.includes('phút');
                const isCopied = copiedCode === promo.code;
                const appliesColor = getAppliesColor(promo.appliesTo);

                return (
                  <div
                    key={promo.id}
                    className={`${styles.promoCard} ${isExpiringSoon ? styles.promoCardUrgent : ''}`}
                    style={{ '--accent': appliesColor } as React.CSSProperties}
                  >
                    {/* Top strip */}
                    <div className={styles.promoCardTop} style={{ background: appliesColor }}>
                      <span className={styles.appliesLabel}>{getAppliesLabel(promo.appliesTo)}</span>
                      {timeLeft && (
                        <span className={`${styles.timeLeft} ${isExpiringSoon ? styles.timeLeftUrgent : ''}`}>
                          ⏱ {timeLeft}
                        </span>
                      )}
                    </div>

                    {/* Discount badge */}
                    <div className={styles.discountBadge}>
                      <span className={styles.discountValue}>
                        {promo.discountType === 'PERCENTAGE' ? '-' : ''}
                        {formatDiscount(promo)}
                      </span>
                      {promo.discountType === 'PERCENTAGE' && (
                        <span className={styles.discountOff}>OFF</span>
                      )}
                    </div>

                    {/* Card body */}
                    <div className={styles.promoCardBody}>
                      <h3 className={styles.promoName}>{promo.name}</h3>
                      <p className={styles.promoDesc}>{promo.description}</p>

                      <div className={styles.promoMeta}>
                        <div className={styles.promoMetaItem}>
                          <span className={styles.promoMetaLabel}>Đơn tối thiểu</span>
                          <span className={styles.promoMetaValue}>{formatCurrency(promo.minOrderAmount)}</span>
                        </div>
                        {promo.maxDiscountAmount && (
                          <div className={styles.promoMetaItem}>
                            <span className={styles.promoMetaLabel}>Giảm tối đa</span>
                            <span className={styles.promoMetaValue}>{formatCurrency(promo.maxDiscountAmount)}</span>
                          </div>
                        )}
                      </div>

                      {/* Code box */}
                      <div className={styles.codeWrap}>
                        <div className={styles.codeDotLeft} />
                        <div className={styles.codeDotRight} />
                        <span className={styles.codeText}>{promo.code}</span>
                        <button
                          className={`${styles.copyBtn} ${isCopied ? styles.copyBtnSuccess : ''}`}
                          onClick={() => handleCopy(promo.code)}
                          aria-label={`Sao chép mã ${promo.code}`}
                        >
                          {isCopied ? '✓ Đã sao chép!' : '📋 Sao chép'}
                        </button>
                      </div>

                      {/* CTA */}
                      <button
                        className={styles.promoUseCta}
                        style={{ background: appliesColor }}
                        onClick={() => {
                          handleCopy(promo.code);
                          router.push(promo.appliesTo === 'TOUR' ? '/tours' : '/hotels');
                        }}
                      >
                        Dùng ngay →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ HOW TO USE ═══════════════ */}
      <section className={styles.howToSection}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Hướng dẫn</p>
            <h2 className={styles.sectionTitle}>
              Sử dụng mã <span className={styles.accent}>siêu dễ</span>
            </h2>
          </div>
          <div className={styles.howToGrid}>
            {HOW_TO_STEPS.map((step, i) => (
              <div key={step.step} className={styles.howToCard}>
                <div className={styles.howToStepNum}>{step.step}</div>
                <div className={styles.howToIcon}>{step.icon}</div>
                <h3 className={styles.howToTitle}>{step.title}</h3>
                <p className={styles.howToDesc}>{step.desc}</p>
                {i < HOW_TO_STEPS.length - 1 && (
                  <div className={styles.howToArrow}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={styles.ctaBanner}>
            <div className={styles.ctaText}>
              <h2 className={styles.ctaH2}>Đặt ngay — Tiết kiệm ngay! 🎉</h2>
              <p className={styles.ctaSub}>Hàng trăm khách sạn & tour đang chờ bạn với giá tốt nhất.</p>
            </div>
            <div className={styles.ctaBtns}>
              <Link href="/hotels" className={styles.ctaBtnPrimary}>🏨 Tìm khách sạn</Link>
              <Link href="/tours" className={styles.ctaBtnOutline}>🗺️ Khám phá tour</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

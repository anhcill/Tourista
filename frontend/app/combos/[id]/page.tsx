'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaArrowLeft, FaCheckCircle, FaHotel, FaPlane, FaMapMarkerAlt, FaStar, FaCalendarAlt } from 'react-icons/fa';
import comboApi from '@/api/comboApi';
import styles from './page.module.css';

type ComboType = {
  id?: number;
  name?: string;
  hotelName?: string;
  hotelImageUrl?: string;
  hotelStars?: number;
  tourName?: string;
  tourImageUrl?: string;
  tourRating?: number;
  imageUrl?: string;
  comboPrice?: number;
  originalPrice?: number;
  savingsPercent?: number;
  remainingSlots?: number;
  validUntil?: string;
  tourDays?: number;
  description?: string;
  isFeatured?: boolean;
  comboType?: string;
};

const formatVnd = (v: unknown) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(v || 0));
const getStars = (n: number) => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0));

export default function ComboDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [combo, setCombo] = useState<ComboType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await comboApi.getComboById(Number(id));
        const item = data?.data || data || null;
        setCombo(item);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không tìm thấy combo.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Đang tải chi tiết combo...</p>
        </div>
      </div>
    );
  }

  if (error || !combo) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <p>{error || 'Không tìm thấy combo này.'}</p>
          <button className={styles.backBtn} onClick={() => router.push('/combos')}>
            ← Quay lại danh sách combo
          </button>
        </div>
      </div>
    );
  }

  const images = [
    combo.hotelImageUrl || combo.imageUrl,
    combo.tourImageUrl || combo.imageUrl,
  ].filter(Boolean);

  const savings = (Number(combo.originalPrice) || 0) - (Number(combo.comboPrice) || 0);
  const nights = combo.tourDays ? `${combo.tourDays}N${Math.max(1, combo.tourDays) - 1}Đ` : 'Combo';
  const isExpired = combo.validUntil && new Date(combo.validUntil) < new Date();

  const COMBO_INCLUDES = [
    'Khách sạn cao cấp đã chọn',
    'Bữa sáng hàng ngày',
    'Tour du lịch theo lịch trình',
    'Hướng dẫn viên chuyên nghiệp',
    'Xe đưa đón nội khu',
    'Bảo hiểm du lịch',
    'Nước uống & khăn lạnh',
  ];

  return (
    <div className={styles.page}>

      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <button className={styles.backBtn} onClick={() => router.push('/combos')}>
            <FaArrowLeft /> Quay lại
          </button>
          <span className={styles.topBarTitle}>{combo.name}</span>
          {combo.isFeatured && <span className={styles.featuredBadge}>⭐ Nổi bật</span>}
        </div>
      </div>

      {/* ── Hero gallery ── */}
      <div className={styles.gallery}>
        <div className={styles.galleryMain}>
          <img
            src={images[activeImage] || combo.imageUrl || 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80'}
            alt={combo.name}
            className={styles.galleryMainImg}
          />
          {savings > 0 && (
            <div className={styles.savingsBanner}>
              💰 Tiết kiệm {formatVnd(savings)} ({combo.savingsPercent}%)
            </div>
          )}
        </div>
        <div className={styles.galleryThumbs}>
          {images.map((src, i) => (
            <button
              key={i}
              className={`${styles.thumbBtn} ${activeImage === i ? styles.thumbActive : ''}`}
              onClick={() => setActiveImage(i)}
            >
              <img src={src} alt={`Hình ${i + 1}`} />
              <div className={styles.thumbLabel}>
                {i === 0 ? '🏨 Khách sạn' : '🗺️ Tour'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className={styles.content}>

        {/* Left */}
        <div className={styles.mainCol}>
          <div className={styles.header}>
            <h1 className={styles.comboName}>{combo.name}</h1>
            {combo.description && <p className={styles.comboDesc}>{combo.description}</p>}
          </div>

          {/* Meta chips */}
          <div className={styles.metaChips}>
            {combo.comboType && (
              <span className={styles.chip}>{combo.comboType.replace(/_/g, ' ')}</span>
            )}
            {combo.tourDays && (
              <span className={styles.chip}><FaCalendarAlt /> {nights}</span>
            )}
            {combo.validUntil && (
              <span className={`${styles.chip} ${isExpired ? styles.chipExpired : ''}`}>
                {isExpired ? '❌ Đã hết hạn' : `⏰ Có hiệu lực đến ${new Date(combo.validUntil).toLocaleDateString('vi-VN')}`}
              </span>
            )}
            {combo.remainingSlots !== undefined && (
              <span className={`${styles.chip} ${combo.remainingSlots < 5 ? styles.chipLow : ''}`}>
                📋 Còn {combo.remainingSlots} slot
              </span>
            )}
          </div>

          {/* Included services */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Dịch vụ bao gồm</h2>
            <div className={styles.includesGrid}>
              {COMBO_INCLUDES.map(item => (
                <div key={item} className={styles.includeItem}>
                  <FaCheckCircle className={styles.includeIcon} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hotel info */}
          {combo.hotelName && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><FaHotel /> Khách sạn</h2>
              <div className={styles.serviceCard}>
                <img
                  src={combo.hotelImageUrl || combo.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80'}
                  alt={combo.hotelName}
                  className={styles.serviceImg}
                />
                <div className={styles.serviceInfo}>
                  <h3>{combo.hotelName}</h3>
                  {combo.hotelStars && combo.hotelStars > 0 && (
                    <p className={styles.serviceStars}>{getStars(combo.hotelStars)}</p>
                  )}
                  <p className={styles.serviceDesc}>Khách sạn cao cấp {combo.hotelStars || 4}★ — tiêu chuẩn quốc tế, tiện nghi hiện đại.</p>
                </div>
              </div>
            </div>
          )}

          {/* Tour info */}
          {combo.tourName && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}><FaPlane /> Tour du lịch</h2>
              <div className={styles.serviceCard}>
                <img
                  src={combo.tourImageUrl || combo.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80'}
                  alt={combo.tourName}
                  className={styles.serviceImg}
                />
                <div className={styles.serviceInfo}>
                  <h3>{combo.tourName}</h3>
                  {combo.tourDays && (
                    <p className={styles.serviceDuration}>
                      <FaCalendarAlt /> {combo.tourDays} ngày khám phá
                    </p>
                  )}
                  <p className={styles.serviceDesc}>Hành trình đặc sắc, hướng dẫn viên tận tâm, trải nghiệm khó quên.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right — Sticky booking panel */}
        <div className={styles.sidebarCol}>
          <div className={styles.bookingPanel}>
            <div className={styles.priceBlock}>
              {combo.originalPrice && combo.originalPrice > 0 && (
                <span className={styles.originalPrice}>{formatVnd(combo.originalPrice)}</span>
              )}
              <span className={styles.comboPrice}>{formatVnd(combo.comboPrice)}</span>
              <span className={styles.priceUnit}>/ người</span>
            </div>

            {savings > 0 && (
              <div className={styles.savingsHighlight}>
                💰 Tiết kiệm {formatVnd(savings)} ({combo.savingsPercent}%)
              </div>
            )}

            {combo.validUntil && !isExpired && (
              <p className={styles.validNote}>
                ⏰ Combo có hiệu lực đến: {new Date(combo.validUntil).toLocaleDateString('vi-VN')}
              </p>
            )}

            {combo.remainingSlots !== undefined && combo.remainingSlots < 10 && (
              <div className={styles.slotWarning}>
                ⚠️ Chỉ còn {combo.remainingSlots} slot — nhanh tay đặt ngay!
              </div>
            )}

            {isExpired ? (
              <div className={styles.expiredBanner}>Combo này đã hết hạn.</div>
            ) : (
              <button
                className={styles.bookBtn}
                onClick={() => router.push(`/combos/${id}/book`)}
              >
                Đặt combo ngay
              </button>
            )}

            <div className={styles.panelIncludes}>
              <p className={styles.panelIncludesTitle}>Bao gồm:</p>
              <ul>
                <li><FaCheckCircle color="#059669" size={13} /> Khách sạn</li>
                <li><FaCheckCircle color="#059669" size={13} /> Bữa sáng</li>
                <li><FaCheckCircle color="#059669" size={13} /> Tour du lịch</li>
                <li><FaCheckCircle color="#059669" size={13} /> Đưa đón</li>
                <li><FaCheckCircle color="#059669" size={13} /> Bảo hiểm</li>
              </ul>
            </div>

            <div className={styles.guarantees}>
              <div className={styles.guaranteeItem}>
                <span>🛡️</span> Đảm bảo hoàn tiền
              </div>
              <div className={styles.guaranteeItem}>
                <span>📞</span> Hỗ trợ 24/7
              </div>
              <div className={styles.guaranteeItem}>
                <span>✅</span> Xác nhận tức thì
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

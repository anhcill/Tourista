'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaArrowLeft, FaPlus, FaSave, FaTrashAlt } from 'react-icons/fa';
import partnerApi from '@/api/partnerApi';
import ImageUpload from '@/components/Admin/ImageUpload/ImageUpload';
import styles from './page.module.css';

const CITIES = [
  { id: 3, name: 'Đà Nẵng' },
  { id: 4, name: 'Hội An' },
  { id: 1, name: 'Hà Nội' },
  { id: 2, name: 'Hồ Chí Minh' },
  { id: 5, name: 'Huế' },
  { id: 6, name: 'Nha Trang' },
  { id: 7, name: 'Cần Thơ' },
  { id: 8, name: 'Đà Lạt' },
  { id: 9, name: 'Vũng Tàu' },
  { id: 10, name: 'Phú Quốc' },
  { id: 11, name: 'Sa Pa' },
  { id: 12, name: 'Mũi Né' },
];

const CATEGORIES = [
  { id: 1, name: 'Tham quan' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Biển đảo' },
  { id: 4, name: 'Văn hóa' },
  { id: 5, name: 'Thiên nhiên' },
  { id: 6, name: 'Gastro' },
  { id: 7, name: 'Relax' },
];

type ItineraryItem = { dayNumber: string; title: string; description: string };
type DepartureItem = { departureDate: string; availableSlots: string; priceOverride: string };

export default function PartnerTourCreatePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [cityId, setCityId] = useState('3');
  const [categoryId, setCategoryId] = useState('1');
  const [description, setDescription] = useState('');
  const [highlights, setHighlights] = useState('');
  const [includes, setIncludes] = useState('');
  const [excludes, setExcludes] = useState('');
  const [durationDays, setDurationDays] = useState('1');
  const [maxGroupSize, setMaxGroupSize] = useState('15');
  const [minGroupSize, setMinGroupSize] = useState('1');
  const [difficulty, setDifficulty] = useState('EASY');
  const [pricePerAdult, setPricePerAdult] = useState('');
  const [pricePerChild, setPricePerChild] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([
    { dayNumber: '1', title: '', description: '' },
  ]);
  const [departures, setDepartures] = useState<DepartureItem[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const addItinerary = () => {
    setItinerary((prev) => [...prev, { dayNumber: String(prev.length + 1), title: '', description: '' }]);
    setDurationDays(String(itinerary.length + 1));
  };

  const removeItinerary = (index: number) => {
    setItinerary((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((item, i) => ({ ...item, dayNumber: String(i + 1) }));
    });
  };

  const updateItinerary = (index: number, field: keyof ItineraryItem, value: string) => {
    setItinerary((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addDeparture = () => {
    setDepartures((prev) => [...prev, { departureDate: '', availableSlots: '15', priceOverride: '' }]);
  };

  const removeDeparture = (index: number) => {
    setDepartures((prev) => prev.filter((_, i) => i !== index));
  };

  const updateDeparture = (index: number, field: keyof DepartureItem, value: string) => {
    setDepartures((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const validate = () => {
    if (!title.trim()) return 'Tiêu đề tour là bắt buộc.';
    if (!cityId) return 'Chọn thành phố.';
    if (!categoryId) return 'Chọn danh mục.';
    const days = Number(durationDays);
    if (!Number.isFinite(days) || days < 1) return 'Số ngày phải >= 1.';
    const maxGrp = Number(maxGroupSize);
    if (!Number.isFinite(maxGrp) || maxGrp < 1) return 'Max group size phải >= 1.';
    const minGrp = Number(minGroupSize);
    if (!Number.isFinite(minGrp) || minGrp < 1) return 'Min group size phải >= 1.';
    if (minGrp > maxGrp) return 'Min group size không thể lớn hơn max.';
    const price = Number(pricePerAdult);
    if (!Number.isFinite(price) || price <= 0) return 'Giá người lớn phải > 0.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationMessage = validate();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    const validItinerary = itinerary
      .filter((item) => item.title.trim())
      .map((item, i) => ({
        dayNumber: Number(item.dayNumber) || (i + 1),
        title: item.title.trim(),
        description: item.description.trim(),
      }));

    const validDepartures = departures
      .filter((d) => d.departureDate.trim())
      .map((d) => ({
        departureDate: d.departureDate,
        availableSlots: Number(d.availableSlots) || 15,
        priceOverride: d.priceOverride ? Number(d.priceOverride) : null,
      }));

    const payload = {
      title: title.trim(),
      cityId: Number(cityId),
      categoryId: Number(categoryId),
      description: description.trim() || null,
      highlights: highlights.trim() || null,
      includes: includes.trim() || null,
      excludes: excludes.trim() || null,
      durationDays: Number(durationDays),
      maxGroupSize: Number(maxGroupSize),
      minGroupSize: Number(minGroupSize),
      difficulty,
      pricePerAdult: Number(pricePerAdult),
      pricePerChild: pricePerChild ? Number(pricePerChild) : 0,
      imageUrls: imageUrls || [],
      itineraryItems: validItinerary,
      departureDates: validDepartures,
    };

    try {
      setSubmitting(true);
      await partnerApi.createTour(payload);
      setSuccess('Gửi yêu cầu tạo tour thành công. Vui lòng chờ admin duyệt.');
      setTimeout(() => router.push('/partner/tours'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo tour thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBreadcrumb}>
          <button className={styles.backButton} onClick={() => router.push('/partner/tours')} type="button">
            <FaArrowLeft />
            Quay lại
          </button>
        </div>
        <h2>Tạo Tour Mới</h2>
        <p>Thông tin cơ bản của tour. Sau khi gửi, admin sẽ xem xét và duyệt.</p>
      </div>

      <article className={styles.panel}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.fullWidth}>
              <span>Tiêu đề tour *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Đà Nẵng City Highlights" />
            </label>

            <label>
              <span>Thành phố *</span>
              <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Danh mục *</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Số ngày *</span>
              <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} min={1} />
            </label>

            <label>
              <span>Độ khó</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">Dễ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HARD">Khó</option>
              </select>
            </label>

            <label>
              <span>Min group size</span>
              <input type="number" value={minGroupSize} onChange={(e) => setMinGroupSize(e.target.value)} min={1} />
            </label>

            <label>
              <span>Max group size *</span>
              <input type="number" value={maxGroupSize} onChange={(e) => setMaxGroupSize(e.target.value)} min={1} />
            </label>

            <label>
              <span>Giá người lớn (VND) *</span>
              <input type="number" value={pricePerAdult} onChange={(e) => setPricePerAdult(e.target.value)} placeholder="890000" min={0} />
            </label>

            <label>
              <span>Giá trẻ em (VND)</span>
              <input type="number" value={pricePerChild} onChange={(e) => setPricePerChild(e.target.value)} placeholder="445000" min={0} />
            </label>

            <label className={styles.fullWidth}>
              <span>Mô tả</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mô tả tour..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Điểm nổi bật</span>
              <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={2} placeholder="Điểm đến, cảnh đẹp..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Bao gồm</span>
              <textarea value={includes} onChange={(e) => setIncludes(e.target.value)} rows={2} placeholder="Bữa ăn, hướng dẫn, xe..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Không bao gồm</span>
              <textarea value={excludes} onChange={(e) => setExcludes(e.target.value)} rows={2} placeholder="Chi phí cá nhân..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Hình ảnh tour</span>
              <ImageUpload
                value={imageUrls}
                onChange={setImageUrls}
                maxImages={20}
              />
            </label>
          </div>

          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {success ? <div className={styles.successBox}>{success}</div> : null}

          <div className={styles.formActions}>
            <button type="button" className={styles.ghostButton} onClick={() => router.push('/partner/tours')}>
              <FaArrowLeft />
              Hủy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              <FaSave />
              {submitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}

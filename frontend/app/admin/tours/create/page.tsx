'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaArrowLeft, FaPlus, FaSave, FaTrashAlt } from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import styles from '../../page.module.css';

const CITIES = [
  { id: 3, name: 'Da Nang' },
  { id: 4, name: 'Hoi An' },
  { id: 1, name: 'Ha Noi' },
  { id: 2, name: 'Ho Chi Minh' },
  { id: 5, name: 'Hue' },
  { id: 6, name: 'Nha Trang' },
  { id: 7, name: 'Can Tho' },
  { id: 8, name: 'Da Lat' },
  { id: 9, name: 'Vung Tau' },
  { id: 10, name: 'Phu Quoc' },
  { id: 11, name: 'Sapa' },
  { id: 12, name: 'Mui Ne' },
];

const CATEGORIES = [
  { id: 1, name: 'Tham quan' },
  { id: 2, name: 'Adventure' },
  { id: 3, name: 'Bien dao' },
  { id: 4, name: 'Van hoa' },
  { id: 5, name: 'Thien nhien' },
  { id: 6, name: 'Gastro' },
  { id: 7, name: 'Relax' },
];

type ItineraryItem = { dayNumber: string; title: string; description: string };
type DepartureItem = { departureDate: string; availableSlots: string; priceOverride: string };

export default function AdminTourCreatePage() {
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
  const [isFeatured, setIsFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageUrls, setImageUrls] = useState('');
  const [reason, setReason] = useState('');
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
    if (!title.trim()) return 'Tieu de tour la bat buoc.';
    if (!cityId) return 'Chon thanh pho.';
    if (!categoryId) return 'Chon danh muc.';
    const days = Number(durationDays);
    if (!Number.isFinite(days) || days < 1) return 'So ngay phai >= 1.';
    const maxGrp = Number(maxGroupSize);
    if (!Number.isFinite(maxGrp) || maxGrp < 1) return 'Max group size phai >= 1.';
    const minGrp = Number(minGroupSize);
    if (!Number.isFinite(minGrp) || minGrp < 1) return 'Min group size phai >= 1.';
    if (minGrp > maxGrp) return 'Min group size khong the lon hon max.';
    const price = Number(pricePerAdult);
    if (!Number.isFinite(price) || price <= 0) return 'Gia nguoi lon phai > 0.';
    if (!reason.trim()) return 'Ly do la bat buoc.';
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

    const urls = imageUrls.split('\n').map((u) => u.trim()).filter(Boolean);

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
      isFeatured,
      isActive,
      imageUrls: urls,
      itineraryItems: validItinerary,
      departureDates: validDepartures,
      reason: reason.trim(),
    };

    try {
      setSubmitting(true);
      await adminApi.createTour(payload);
      setSuccess('Tao tour thanh cong.');
      setTimeout(() => router.push('/admin/tours'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tao tour that bai.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBreadcrumb}>
          <button className={styles.backButton} onClick={() => router.push('/admin/tours')} type="button">
            <FaArrowLeft />
            Quay lai
          </button>
        </div>
        <h2>Tao Tour Moi</h2>
        <p>Thong tin co ban cua tour</p>
      </div>

      <article className={styles.panel}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.fullWidth}>
              <span>Tieu de tour *</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Da Nang City Highlights" />
            </label>

            <label>
              <span>Thanh pho *</span>
              <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Danh muc *</span>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>So ngay *</span>
              <input type="number" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} min={1} />
            </label>

            <label>
              <span>Do kho</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="EASY">De</option>
                <option value="MEDIUM">Trung binh</option>
                <option value="HARD">Kho</option>
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
              <span>Gia nguoi lon (VND) *</span>
              <input type="number" value={pricePerAdult} onChange={(e) => setPricePerAdult(e.target.value)} placeholder="890000" min={0} />
            </label>

            <label>
              <span>Gia tre em (VND)</span>
              <input type="number" value={pricePerChild} onChange={(e) => setPricePerChild(e.target.value)} placeholder="445000" min={0} />
            </label>

            <label className={styles.fullWidth}>
              <span>Mo ta</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Mo ta tour..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Diem noi bat</span>
              <textarea value={highlights} onChange={(e) => setHighlights(e.target.value)} rows={2} placeholder="Dien tich, cay..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Bao gom</span>
              <textarea value={includes} onChange={(e) => setIncludes(e.target.value)} rows={2} placeholder="Bua an, huong dan, xe..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Khong bao gom</span>
              <textarea value={excludes} onChange={(e) => setExcludes(e.target.value)} rows={2} placeholder="Chi phi ca nhan..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Hinh anh (moi dong la 1 URL)</span>
              <textarea
                value={imageUrls}
                onChange={(e) => setImageUrls(e.target.value)}
                rows={3}
                placeholder="https://images.unsplash.com/photo-xxxx"
              />
            </label>

            <div className={`${styles.checkboxGroup} ${styles.fullWidth}`}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                <span>Tour noi bat</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Dang hoat dong</span>
              </label>
            </div>

            <label className={styles.fullWidth}>
              <span>Ly do tao *</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ly do tao tour nay" />
            </label>
          </div>

          {/* Itinerary Builder */}
          <div className={styles.sectionTitle}>
            <h3>Lich trinh tour</h3>
            <button type="button" className={styles.smallButton} onClick={addItinerary}>
              <FaPlus />
              Them ngay
            </button>
          </div>

          <div className={styles.itineraryList}>
            {itinerary.map((item, i) => (
              <div key={i} className={styles.itineraryItem}>
                <div className={styles.itineraryHeader}>
                  <span>Ngay {item.dayNumber}</span>
                  {itinerary.length > 1 && (
                    <button type="button" className={styles.removeButton} onClick={() => removeItinerary(i)}>
                      <FaTrashAlt />
                    </button>
                  )}
                </div>
                <input
                  placeholder="Tieu de ngay"
                  value={item.title}
                  onChange={(e) => updateItinerary(i, 'title', e.target.value)}
                />
                <textarea
                  placeholder="Mo ta lich trinh ngay"
                  value={item.description}
                  onChange={(e) => updateItinerary(i, 'description', e.target.value)}
                  rows={2}
                />
              </div>
            ))}
          </div>

          {/* Departures */}
          <div className={styles.sectionTitle}>
            <h3>Lich khoi hanh</h3>
            <button type="button" className={styles.smallButton} onClick={addDeparture}>
              <FaPlus />
              Them ngay khoi hanh
            </button>
          </div>

          {departures.length > 0 && (
            <div className={styles.departuresList}>
              {departures.map((dep, i) => (
                <div key={i} className={styles.departureItem}>
                  <div className={styles.departureHeader}>
                    <span>Lich #{i + 1}</span>
                    <button type="button" className={styles.removeButton} onClick={() => removeDeparture(i)}>
                      <FaTrashAlt />
                    </button>
                  </div>
                  <div className={styles.departureFields}>
                    <label>
                      <span>Ngay khoi hanh</span>
                      <input type="date" value={dep.departureDate} onChange={(e) => updateDeparture(i, 'departureDate', e.target.value)} />
                    </label>
                    <label>
                      <span>So cho</span>
                      <input type="number" value={dep.availableSlots} onChange={(e) => updateDeparture(i, 'availableSlots', e.target.value)} min={1} />
                    </label>
                    <label>
                      <span>Gia dac biet (VND)</span>
                      <input type="number" value={dep.priceOverride} onChange={(e) => updateDeparture(i, 'priceOverride', e.target.value)} placeholder="Optional" min={0} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {success ? <div className={styles.successBox}>{success}</div> : null}

          <div className={styles.formActions}>
            <button type="button" className={styles.ghostButton} onClick={() => router.push('/admin/tours')}>
              <FaArrowLeft />
              Huy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              <FaSave />
              {submitting ? 'Dang tao...' : 'Tao tour'}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}

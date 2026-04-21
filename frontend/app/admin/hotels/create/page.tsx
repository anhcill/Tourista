'use client';

import { useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaSave, FaSyncAlt } from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import styles from './page.module.css';

type HotelForm = {
  name: string;
  cityId: string;
  ownerId: string;
  address: string;
  starRating: string;
  description: string;
  latitude: string;
  longitude: string;
  checkInTime: string;
  checkOutTime: string;
  phone: string;
  email: string;
  website: string;
  isFeatured: boolean;
  isTrending: boolean;
  isActive: boolean;
  imageUrls: string;
  reason: string;
};

const CITIES = [
  { id: 1, name: 'Ha Noi' },
  { id: 2, name: 'Ho Chi Minh' },
  { id: 3, name: 'Da Nang' },
  { id: 4, name: 'Hoi An' },
  { id: 5, name: 'Hue' },
  { id: 6, name: 'Nha Trang' },
  { id: 7, name: 'Can Tho' },
  { id: 8, name: 'Da Lat' },
  { id: 9, name: 'Vung Tau' },
  { id: 10, name: 'Phu Quoc' },
  { id: 11, name: 'Sapa' },
  { id: 12, name: 'Mui Ne' },
];

const EMPTY: HotelForm = {
  name: '',
  cityId: '3',
  ownerId: '',
  address: '',
  starRating: '4',
  description: '',
  latitude: '',
  longitude: '',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  phone: '',
  email: '',
  website: '',
  isFeatured: false,
  isTrending: false,
  isActive: true,
  imageUrls: '',
  reason: '',
};

export default function AdminHotelCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<HotelForm>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Image preview
  const imageList = useMemo(() => {
    return form.imageUrls.split('\n').map((u) => u.trim()).filter(Boolean);
  }, [form.imageUrls]);

  const removeImage = (index: number) => {
    const lines = form.imageUrls.split('\n');
    lines.splice(index, 1);
    setForm((prev) => ({ ...prev, imageUrls: lines.join('\n') }));
  };

  const set = (field: keyof HotelForm, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Ten khach san la bat buoc.';
    if (!form.cityId) return 'Chon thanh pho.';
    if (!form.address.trim()) return 'Dia chi la bat buoc.';
    const stars = Number(form.starRating);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) return 'Sao tu 1 den 5.';
    if (!form.reason.trim()) return 'Ly do la bat buoc.';
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

    const imageUrls = form.imageUrls
      .split('\n')
      .map((u) => u.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      cityId: Number(form.cityId),
      ownerId: form.ownerId ? Number(form.ownerId) : null,
      address: form.address.trim(),
      starRating: Number(form.starRating),
      description: form.description.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      checkInTime: form.checkInTime || '14:00',
      checkOutTime: form.checkOutTime || '12:00',
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      website: form.website.trim() || null,
      isFeatured: form.isFeatured,
      isTrending: form.isTrending,
      isActive: form.isActive,
      imageUrls,
      reason: form.reason.trim(),
    };

    try {
      setSubmitting(true);
      await adminApi.createHotel(payload);
      setSuccess('Tao khach san thanh cong.');
      setTimeout(() => router.push('/admin/hotels'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tao khach san that bai.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBreadcrumb}>
          <button className={styles.backButton} onClick={() => router.push('/admin/hotels')} type="button">
            <FaArrowLeft />
            Quay lai
          </button>
        </div>
        <h2>Tao Khach San Moi</h2>
        <p>Thong tin co ban cua khach san</p>
      </div>

      <article className={styles.panel}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.fullWidth}>
              <span>Ten khach san *</span>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Sea Light Da Nang Hotel" />
            </label>

            <label>
              <span>Thanh pho *</span>
              <select value={form.cityId} onChange={(e) => set('cityId', e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>So sao (1-5) *</span>
              <select value={form.starRating} onChange={(e) => set('starRating', e.target.value)}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} sao</option>
                ))}
              </select>
            </label>

            <label className={styles.fullWidth}>
              <span>Dia chi *</span>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="VD: 12 Vo Nguyen Giap, Son Tra, Da Nang" />
            </label>

            <label>
              <span>So dien thoai</span>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0901234567" />
            </label>

            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@hotel.vn" />
            </label>

            <label>
              <span>Gio check-in</span>
              <input type="time" value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} />
            </label>

            <label>
              <span>Gio check-out</span>
              <input type="time" value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} />
            </label>

            <label>
              <span>Website</span>
              <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://hotel.vn" />
            </label>

            <label>
              <span>Owner ID (optional)</span>
              <input type="number" value={form.ownerId} onChange={(e) => set('ownerId', e.target.value)} placeholder="1" />
            </label>

            <label className={styles.fullWidth}>
              <span>Mo ta</span>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Mo ta khach san..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Hinh anh (moi dong la 1 URL)</span>
              <textarea
                value={form.imageUrls}
                onChange={(e) => set('imageUrls', e.target.value)}
                rows={4}
                placeholder="https://images.unsplash.com/photo-xxxx&#10;https://images.unsplash.com/photo-xxxx"
              />
            </label>

            {imageList.length > 0 && (
              <div className={`${styles.imagePreview} ${styles.fullWidth}`}>
                {imageList.map((url, i) => (
                  <div key={i} className={styles.previewItem}>
                    <img src={url} alt={`Preview ${i + 1}`} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    <button type="button" className={styles.removeImageBtn} onClick={() => removeImage(i)} title="Xoa anh">
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={`${styles.checkboxGroup} ${styles.fullWidth}`}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
                <span>Khach san noi bat</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isTrending} onChange={(e) => set('isTrending', e.target.checked)} />
                <span>Khach san xu huong</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                <span>Dang hoat dong</span>
              </label>
            </div>

            <label className={styles.fullWidth}>
              <span>Ly do tao *</span>
              <input value={form.reason} onChange={(e) => set('reason', e.target.value)} placeholder="Ly do tao khach san nay" />
            </label>
          </div>

          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {success ? <div className={styles.successBox}>{success}</div> : null}

          <div className={styles.formActions}>
            <button type="button" className={styles.ghostButton} onClick={() => router.push('/admin/hotels')}>
              <FaArrowLeft />
              Huy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              <FaSave />
              {submitting ? 'Dang tao...' : 'Tao khach san'}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}

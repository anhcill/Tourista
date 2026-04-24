'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import adminApi from '@/api/adminApi';
import ImageUpload from '@/components/Admin/ImageUpload/ImageUpload';
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
  status: string;
  imageUrls: string[];
  coverImage: string;
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

export default function AdminHotelEditPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = String(params?.id || '');

  const [form, setForm] = useState<HotelForm>({
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
    status: '',
    imageUrls: [],
    coverImage: '',
    reason: '',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadHotel = useCallback(async () => {
    if (!hotelId) return;
    try {
      setLoading(true);
      const data = await adminApi.getHotelById(hotelId);
      if (!data) return;

      setForm({
        name: data.name || '',
        cityId: data.cityId ? String(data.cityId) : '3',
        ownerId: data.ownerId ? String(data.ownerId) : '',
        address: data.address || '',
        starRating: data.starRating ? String(data.starRating) : '4',
        description: data.description || '',
        latitude: data.latitude ? String(data.latitude) : '',
        longitude: data.longitude ? String(data.longitude) : '',
        checkInTime: data.checkInTime ? data.checkInTime.slice(0, 5) : '14:00',
        checkOutTime: data.checkOutTime ? data.checkOutTime.slice(0, 5) : '12:00',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        isFeatured: data.isFeatured || false,
        isTrending: data.isTrending || false,
        isActive: data.isActive !== false,
        status: data.status || '',
        imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
        coverImage: data.coverImage || '',
        reason: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Khong the tai chi tiet hotel.');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    void loadHotel();
  }, [loadHotel]);

  const setString = (field: keyof HotelForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setBool = (field: keyof HotelForm, value: boolean) =>
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
      status: form.status || null,
      imageUrls: form.imageUrls || [],
      coverImage: form.coverImage || null,
      reason: form.reason.trim(),
    };

    try {
      setSubmitting(true);
      await adminApi.updateHotel(hotelId, payload);
      setSuccess('Cap nhat khach san thanh cong.');
      setTimeout(() => router.push('/admin/hotels'), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cap nhat khach san that bai.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <h2>Chinh Sua Khach San</h2>
          <p>Dang tai chi tiet...</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBreadcrumb}>
          <button className={styles.backButton} onClick={() => router.push('/admin/hotels')} type="button">
            <FaArrowLeft />
            Quay lai
          </button>
        </div>
        <h2>Chinh Sua Khach San</h2>
        <p>Cap nhat thong tin khach san</p>
      </div>

      <article className={styles.panel}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.fullWidth}>
              <span>Ten khach san *</span>
              <input value={form.name} onChange={(e) => setString('name', e.target.value)} placeholder="VD: Sea Light Da Nang Hotel" />
            </label>

            <label>
              <span>Thanh pho *</span>
              <select value={form.cityId} onChange={(e) => setString('cityId', e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>So sao (1-5) *</span>
              <select value={form.starRating} onChange={(e) => setString('starRating', e.target.value)}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} sao</option>
                ))}
              </select>
            </label>

            <label className={styles.fullWidth}>
              <span>Dia chi *</span>
              <input value={form.address} onChange={(e) => setString('address', e.target.value)} placeholder="VD: 12 Vo Nguyen Giap, Son Tra, Da Nang" />
            </label>

            <label>
              <span>So dien thoai</span>
              <input value={form.phone} onChange={(e) => setString('phone', e.target.value)} placeholder="0901234567" />
            </label>

            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => setString('email', e.target.value)} placeholder="contact@hotel.vn" />
            </label>

            <label>
              <span>Gio check-in</span>
              <input type="time" value={form.checkInTime} onChange={(e) => setString('checkInTime', e.target.value)} />
            </label>

            <label>
              <span>Gio check-out</span>
              <input type="time" value={form.checkOutTime} onChange={(e) => setString('checkOutTime', e.target.value)} />
            </label>

            <label>
              <span>Website</span>
              <input value={form.website} onChange={(e) => setString('website', e.target.value)} placeholder="https://hotel.vn" />
            </label>

            <label>
              <span>Owner ID (optional)</span>
              <input type="number" value={form.ownerId} onChange={(e) => setString('ownerId', e.target.value)} placeholder="1" />
            </label>

            <label className={styles.fullWidth}>
              <span>Mo ta</span>
              <textarea value={form.description} onChange={(e) => setString('description', e.target.value)} rows={4} placeholder="Mo ta khach san..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Hinh anh khach san</span>
              <ImageUpload
                value={form.imageUrls}
                onChange={(urls) => {
                  setForm((prev) => ({ ...prev, imageUrls: urls }));
                  if (!form.coverImage && urls.length > 0) {
                    setForm((prev) => ({ ...prev, coverImage: urls[0] }));
                  }
                }}
                maxImages={20}
              />
            </label>

            {form.imageUrls.length > 0 && form.coverImage && (
              <div className={`${styles.imagePreview} ${styles.fullWidth}`}>
                <div className={styles.imagePreviewHeader}>
                  <span>Anh cover hien tai:</span>
                </div>
                <div className={styles.coverPreview}>
                  <img
                    src={form.coverImage}
                    alt="Cover"
                    className={styles.coverPreviewImg}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className={styles.coverMeta}>
                    <p>Anh dau tien trong danh sach duoc dung lam anh cover.</p>
                  </div>
                </div>
              </div>
            )}

            <div className={`${styles.checkboxGroup} ${styles.fullWidth}`}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setBool('isFeatured', e.target.checked)} />
                <span>Khach san noi bat</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isTrending} onChange={(e) => setBool('isTrending', e.target.checked)} />
                <span>Khach san xu huong</span>
              </label>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setBool('isActive', e.target.checked)} />
                <span>Dang hoat dong</span>
              </label>
            </div>

            <label className={styles.fullWidth}>
              <span>Ly do cap nhat *</span>
              <input value={form.reason} onChange={(e) => setString('reason', e.target.value)} placeholder="Ly do thay doi thong tin" />
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
              {submitting ? 'Dang cap nhat...' : 'Luu thay doi'}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}

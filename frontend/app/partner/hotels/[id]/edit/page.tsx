'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import partnerApi from '@/api/partnerApi';
import ImageUpload from '@/components/Admin/ImageUpload/ImageUpload';
import styles from '../../../hotels/create/page.module.css';

type HotelForm = {
  name: string;
  cityId: string;
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
  imageUrls: string[];
};

const CITIES = [
  { id: 1, name: 'Hà Nội' },
  { id: 2, name: 'Hồ Chí Minh' },
  { id: 3, name: 'Đà Nẵng' },
  { id: 4, name: 'Hội An' },
  { id: 5, name: 'Huế' },
  { id: 6, name: 'Nha Trang' },
  { id: 7, name: 'Cần Thơ' },
  { id: 8, name: 'Đà Lạt' },
  { id: 9, name: 'Vũng Tàu' },
  { id: 10, name: 'Phú Quốc' },
  { id: 11, name: 'Sa Pa' },
  { id: 12, name: 'Mũi Né' },
];

export default function PartnerHotelEditPage() {
  const router = useRouter();
  const params = useParams();
  const hotelId = params.id as string;

  const [loadingHotel, setLoadingHotel] = useState(true);
  const [hotelError, setHotelError] = useState('');
  const [form, setForm] = useState<HotelForm>({
    name: '',
    cityId: '3',
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
    imageUrls: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!hotelId) return;
    const loadHotel = async () => {
      try {
        setLoadingHotel(true);
        setHotelError('');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await partnerApi.getHotelById(Number(hotelId));

        setForm({
          name: data.name || '',
          cityId: data.cityId ? String(data.cityId) : '3',
          address: data.address || '',
          starRating: data.starRating ? String(data.starRating) : '4',
          description: data.description || '',
          latitude: data.latitude ? String(data.latitude) : '',
          longitude: data.longitude ? String(data.longitude) : '',
          checkInTime: data.checkInTime || '14:00',
          checkOutTime: data.checkOutTime || '12:00',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          imageUrls: data.imageUrls || [],
        });
      } catch (err) {
        setHotelError(err instanceof Error ? err.message : 'Không thể tải thông tin khách sạn.');
      } finally {
        setLoadingHotel(false);
      }
    };
    loadHotel();
  }, [hotelId]);

  const set = (field: keyof HotelForm, value: string | string[]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    if (!form.name.trim()) return 'Tên khách sạn là bắt buộc.';
    if (!form.cityId) return 'Chọn thành phố.';
    if (!form.address.trim()) return 'Địa chỉ là bắt buộc.';
    const stars = Number(form.starRating);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) return 'Sao từ 1 đến 5.';
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
      imageUrls: form.imageUrls || [],
    };

    try {
      setSubmitting(true);
      await partnerApi.updateHotel(Number(hotelId), payload);
      setSuccess('Cập nhật khách sạn thành công. Vui lòng chờ admin duyệt nếu có thay đổi.');
      setTimeout(() => router.push('/partner/hotels'), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cập nhật khách sạn thất bại.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingHotel) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroBreadcrumb}>
            <button className={styles.backButton} onClick={() => router.push('/partner/hotels')} type="button">
              <FaArrowLeft /> Quay lại
            </button>
          </div>
          <h2>Đang tải...</h2>
        </div>
      </section>
    );
  }

  if (hotelError) {
    return (
      <section className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroBreadcrumb}>
            <button className={styles.backButton} onClick={() => router.push('/partner/hotels')} type="button">
              <FaArrowLeft /> Quay lại
            </button>
          </div>
          <h2>Không thể tải khách sạn</h2>
          <p style={{ color: '#b91c1c' }}>{hotelError}</p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroBreadcrumb}>
          <button className={styles.backButton} onClick={() => router.push('/partner/hotels')} type="button">
            <FaArrowLeft />
            Quay lại
          </button>
        </div>
        <h2>Chỉnh sửa Khách Sạn</h2>
        <p>Cập nhật thông tin khách sạn. Sau khi gửi, admin sẽ xem xét và duyệt.</p>
      </div>

      <article className={styles.panel}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.fullWidth}>
              <span>Tên khách sạn *</span>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="VD: Sea Light Đà Nẵng Hotel" />
            </label>

            <label>
              <span>Thành phố *</span>
              <select value={form.cityId} onChange={(e) => set('cityId', e.target.value)}>
                {CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Số sao (1-5) *</span>
              <select value={form.starRating} onChange={(e) => set('starRating', e.target.value)}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>{s} sao</option>
                ))}
              </select>
            </label>

            <label className={styles.fullWidth}>
              <span>Địa chỉ *</span>
              <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="VD: 12 Võ Nguyên Giáp, Sơn Trà, Đà Nẵng" />
            </label>

            <label>
              <span>Số điện thoại</span>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0901234567" />
            </label>

            <label>
              <span>Email</span>
              <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="contact@hotel.vn" />
            </label>

            <label>
              <span>Giờ check-in</span>
              <input type="time" value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)} />
            </label>

            <label>
              <span>Giờ check-out</span>
              <input type="time" value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)} />
            </label>

            <label>
              <span>Website</span>
              <input value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://hotel.vn" />
            </label>

            <label>
              <span>Vĩ độ (latitude)</span>
              <input type="number" step="any" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} placeholder="16.0544" />
            </label>

            <label>
              <span>Kinh độ (longitude)</span>
              <input type="number" step="any" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} placeholder="108.2022" />
            </label>

            <label className={styles.fullWidth}>
              <span>Mô tả</span>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={4} placeholder="Mô tả khách sạn..." />
            </label>

            <label className={styles.fullWidth}>
              <span>Hình ảnh khách sạn</span>
              <ImageUpload
                value={form.imageUrls}
                onChange={(urls) => setForm(prev => ({ ...prev, imageUrls: urls }))}
                maxImages={20}
              />
            </label>
          </div>

          {error ? <div className={styles.errorBox}>{error}</div> : null}
          {success ? <div className={styles.successBox}>{success}</div> : null}

          <div className={styles.formActions}>
            <button type="button" className={styles.ghostButton} onClick={() => router.push('/partner/hotels')}>
              <FaArrowLeft />
              Hủy
            </button>
            <button type="submit" className={styles.primaryButton} disabled={submitting}>
              <FaSave />
              {submitting ? 'Đang gửi...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}

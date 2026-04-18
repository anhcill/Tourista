'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaChevronLeft, FaImage, FaPaperPlane } from 'react-icons/fa';
import { toast } from 'react-toastify';
import articleApi from '@/api/articleApi';
import styles from './page.module.css';

const CATEGORIES = ['Biển & Đảo', 'Văn hoá & Di sản', 'Mẹo du lịch', 'Kinh nghiệm', 'Ẩm thực', 'Khách sạn 5★'];

type FormState = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: string;
};

export default function CreateArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState<FormState>({
    title: '',
    category: CATEGORIES[0],
    excerpt: '',
    content: '',
    coverImageUrl: '',
    status: 'PUBLISHED',
  });

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Tiêu đề bài viết là bắt buộc.');
      return;
    }
    if (!form.content.trim()) {
      setFormError('Nội dung bài viết là bắt buộc.');
      return;
    }

    try {
      setIsLoading(true);
      const response = (await articleApi.createArticle({
        title: form.title.trim(),
        excerpt: form.excerpt.trim() || null,
        content: form.content.trim(),
        coverImageUrl: form.coverImageUrl.trim() || null,
        category: form.category,
        status: form.status,
      })) as unknown as { data: { id: number } };
      void router.push('/articles');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xuất bản bài viết. Vui lòng thử lại.';
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.navTop}>
          <button className={styles.backBtn} onClick={() => router.push('/articles')}>
            <FaChevronLeft /> Trở về Cẩm nang
          </button>
        </div>

        <div className={styles.formCard}>
          <h1 className={styles.pageTitle}>Tạo bài viết mới</h1>

          {formError && (
            <div className={styles.errorBanner}>{formError}</div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tiêu đề bài viết *</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Khám phá vùng đất mới..."
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                required
                maxLength={250}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Chủ đề</label>
                <select
                  className={styles.select}
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Trạng thái</label>
                <select
                  className={styles.select}
                  value={form.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="PUBLISHED">Xuất bản ngay</option>
                  <option value="DRAFT">Lưu nháp</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Link ảnh bìa (URL)</label>
                <div className={styles.inputWithIcon}>
                  <FaImage className={styles.inputIcon} />
                  <input
                    type="url"
                    className={styles.input}
                    placeholder="https://example.com/image.jpg"
                    value={form.coverImageUrl}
                    onChange={(e) => updateField('coverImageUrl', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Tóm tắt ngắn</label>
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                placeholder="Viết một đoạn ngắn giới thiệu về chuyến đi của bạn..."
                rows={2}
                value={form.excerpt}
                onChange={(e) => updateField('excerpt', e.target.value)}
                maxLength={500}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nội dung chi tiết *</label>
              <textarea
                className={`${styles.input} ${styles.editor}`}
                placeholder="Hôm nay tôi đã đi đâu...&#10;&#10;Bạn có thể dùng HTML để định dạng, ví dụ: &lt;h2&gt;Tiêu đề&lt;/h2&gt;, &lt;p&gt;Đoạn văn&lt;/p&gt;, &lt;ul&gt;&lt;li&gt;Mục 1&lt;/li&gt;&lt;/ul&gt;"
                rows={14}
                value={form.content}
                onChange={(e) => updateField('content', e.target.value)}
                required
              />
              <span className={styles.hint}>
                Hỗ trợ HTML cơ bản: &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;img src="..."&gt;
              </span>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
                disabled={isLoading}
              >
                <FaPaperPlane />
                {isLoading ? 'Đang xuất bản...' : 'Xuất bản bài viết'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

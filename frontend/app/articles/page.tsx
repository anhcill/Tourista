'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FaBookOpen, FaClock, FaEye, FaHeart } from 'react-icons/fa';
import articleApi from '@/api/articleApi';
import styles from './page.module.css';

const CATEGORIES = [
  { label: 'Tất cả', value: '' },
  { label: 'Biển & Đảo', value: 'Biển & Đảo' },
  { label: 'Văn hoá & Di sản', value: 'Văn hoá & Di sản' },
  { label: 'Mẹo du lịch', value: 'Mẹo du lịch' },
  { label: 'Kinh nghiệm', value: 'Kinh nghiệm' },
  { label: 'Ẩm thực', value: 'Ẩm thực' },
  { label: 'Khách sạn 5★', value: 'Khách sạn 5★' },
];

type ArticleAuthor = {
  id: number;
  fullName: string;
  avatarUrl: string | null;
};

type ArticleItem = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  category: string | null;
  readTimeMinutes: number;
  views: number;
  likes: number;
  createdAt: string;
  author: ArticleAuthor | null;
};

type ArticlesPageResponse = {
  content: ArticleItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export default function ArticlesPage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const limit = 12;

  const fetchArticles = useCallback(async (pageNum: number, category: string) => {
    try {
      setLoading(true);
      setError('');
      const params: Record<string, number | string> = { page: pageNum, limit };
      if (category) params.category = category;
      const response = (await articleApi.getArticles(params)) as unknown as ArticlesPageResponse;
      setArticles(response.content || []);
      setTotalPages(response.totalPages || 1);
      setTotalElements(response.totalElements || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bài viết.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchArticles(page, activeCategory);
  }, [page, activeCategory, fetchArticles]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getFallbackImage = (index: number) => {
    const fallbacks = [
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80',
      'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80',
    ];
    return fallbacks[index % fallbacks.length];
  };

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1><FaBookOpen className={styles.heroIcon} /> Cẩm Nang Du Lịch</h1>
          <p>Chia sẻ mẹo hay, đánh giá chân thật và nguồn cảm hứng bất tận cho những điểm đến tiếp theo của bạn.</p>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.headerActions}>
          <div className={styles.filterSection}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                className={`${styles.filterBtn} ${activeCategory === cat.value ? styles.activeFilter : ''}`}
                onClick={() => handleCategoryClick(cat.value)}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <Link href="/articles/create" className={styles.createBtn}>
            + Đăng bài
          </Link>
        </div>

        {loading && (
          <div className={styles.loadingBox}>
            <div className={styles.spinner} />
            <p>Đang tải bài viết...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button className={styles.retryBtn} onClick={() => void fetchArticles(page, activeCategory)}>
              Thử lại
            </button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className={styles.emptyState}>
            <p>Chưa có bài viết nào trong chủ đề này.</p>
            <button className={styles.resetBtn} onClick={() => handleCategoryClick('')}>
              Xem tất cả
            </button>
          </div>
        )}

        {!loading && !error && articles.length > 0 && (
          <>
            <div className={styles.grid}>
              {articles.map((article, idx) => (
                <Link href={`/articles/${article.slug}`} key={article.id} className={styles.card}>
                  <div className={styles.imgWrapper}>
                    <Image
                      src={article.coverImageUrl || getFallbackImage(idx)}
                      alt={article.title}
                      className={styles.cardImg}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 350px"
                      unoptimized
                    />
                    {article.category && (
                      <span className={styles.categoryBadge}>{article.category}</span>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.metaTop}>
                      <span className={styles.date}>{formatDate(article.createdAt)}</span>
                      <span className={styles.readTime}>
                        <FaClock /> {article.readTimeMinutes} phút
                      </span>
                    </div>
                    <h2 className={styles.title}>{article.title}</h2>
                    {article.excerpt && (
                      <p className={styles.excerpt}>{article.excerpt}</p>
                    )}
                    <div className={styles.cardFooter}>
                      <div className={styles.author}>
                        <Image
                          src={article.author?.avatarUrl || `https://i.pravatar.cc/150?u=${article.author?.id}`}
                          alt={article.author?.fullName || 'Tác giả'}
                          className={styles.avatar}
                          width={36}
                          height={36}
                          unoptimized
                        />
                        <span>{article.author?.fullName || 'Tourista'}</span>
                      </div>
                      <div className={styles.stats}>
                        <span><FaEye /> {article.views}</span>
                        <span><FaHeart /> {article.likes}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Trước
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === page ? styles.activePage : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className={styles.pageBtn}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

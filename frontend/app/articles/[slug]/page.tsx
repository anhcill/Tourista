'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { FaCalendar, FaChevronLeft, FaClock, FaEye, FaHeart, FaShareAlt } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import articleApi from '@/api/articleApi';
import styles from './page.module.css';

type ArticleAuthor = {
  id: number;
  fullName: string;
  avatarUrl: string | null;
};

type ArticleCommentAuthor = {
  id: number;
  fullName: string;
  avatarUrl: string | null;
};

type ArticleComment = {
  id: number;
  articleId: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: ArticleCommentAuthor | null;
};

type ArticleDetail = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  coverImageUrl: string | null;
  category: string | null;
  readTimeMinutes: number;
  views: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
  author: ArticleAuthor | null;
};

type CommentsPage = {
  content: ArticleComment[];
  totalElements: number;
  totalPages: number;
  number: number;
};

export default function ArticleDetail({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string | null>(null);
  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const fetchArticle = useCallback(async (articleSlug: string) => {
    try {
      setLoading(true);
      setError('');
      const data = (await articleApi.getArticleBySlug(articleSlug)) as unknown as ArticleDetail;
      setArticle(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải bài viết.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchComments = useCallback(async (articleId: number) => {
    try {
      setCommentsLoading(true);
      const data = (await articleApi.getComments(articleId, { page: 1, limit: 20 })) as unknown as CommentsPage;
      setComments(data.content || []);
    } catch {
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    void fetchArticle(slug);
  }, [slug, fetchArticle]);

  useEffect(() => {
    if (article?.id) {
      void fetchComments(article.id);
    }
  }, [article?.id, fetchComments]);

  const handleLike = async () => {
    if (!article) return;
    try {
      await articleApi.toggleLike(article.id);
      setIsLiked(true);
      setArticle((prev) => prev ? { ...prev, likes: prev.likes + 1 } : prev);
    } catch {
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined' && navigator.share) {
      void navigator.share({
        title: article?.title,
        url: window.location.href,
      });
    } else if (typeof window !== 'undefined') {
      void navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !article) return;

    try {
      setSubmittingComment(true);
      const data = (await articleApi.createComment(article.id, { content: newComment.trim() })) as unknown as { data: ArticleComment };
      setComments((prev) => [data.data, ...prev]);
      setNewComment('');
    } catch {
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatCommentTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return 'Vừa xong';
      if (minutes < 60) return `${minutes} phút trước`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} giờ trước`;
      const days = Math.floor(hours / 24);
      return `${days} ngày trước`;
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải trang đọc bài viết...</div>;
  }

  if (error || !article) {
    return (
      <main className={styles.page}>
        <div className={styles.navTop}>
          <div className="container">
            <button className={styles.backBtn} onClick={() => router.push('/articles')}>
              <FaChevronLeft /> Trở về Cẩm nang
            </button>
          </div>
        </div>
        <div className={styles.errorBox}>
          <p>{error || 'Không tìm thấy bài viết.'}</p>
          <button className={styles.retryBtn} onClick={() => slug && void fetchArticle(slug)}>
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  const safeHtmlContent = article.content
    ? DOMPurify.sanitize(article.content, { USE_PROFILES: { html: true } })
    : '';

  return (
    <main className={styles.page}>
      <div className={styles.navTop}>
        <div className="container">
          <button className={styles.backBtn} onClick={() => router.push('/articles')}>
            <FaChevronLeft /> Trở về Cẩm nang
          </button>
        </div>
      </div>

      <article className={styles.article}>
        <header className={styles.header}>
          <div className="container">
            <div className={styles.headerContent}>
              {article.category && (
                <span className={styles.categoryBadge}>{article.category}</span>
              )}
              <h1 className={styles.title}>{article.title}</h1>

              <div className={styles.metaData}>
                <div className={styles.authorBadge}>
                  <Image
                    src={article.author?.avatarUrl || `https://i.pravatar.cc/150?u=${article.author?.id}`}
                    alt={article.author?.fullName || 'Tác giả'}
                    className={styles.smallAvatar}
                    width={32}
                    height={32}
                    unoptimized
                  />
                  <span>{article.author?.fullName || 'Tourista'}</span>
                </div>
                <span className={styles.metaItem}>
                  <FaCalendar /> {formatDate(article.createdAt)}
                </span>
                <span className={styles.metaItem}>
                  <FaClock /> {article.readTimeMinutes} phút
                </span>
                <span className={styles.metaItem}>
                  <FaEye /> {article.views} lượt xem
                </span>
              </div>
            </div>
          </div>
        </header>

        {article.coverImageUrl && (
          <div className={styles.heroImageWrapper}>
            <Image
              src={article.coverImageUrl}
              alt={article.title}
              className={styles.heroImage}
              fill
              sizes="(max-width: 1100px) 100vw, 1100px"
              unoptimized
              priority
            />
          </div>
        )}

        <div className={styles.contentContainer}>
          <div className={styles.contentGrid}>
            <aside className={styles.socialSidebar}>
              <div className={styles.socialSticky}>
                <button
                  className={`${styles.socialBtn} ${isLiked ? styles.socialLiked : ''}`}
                  onClick={handleLike}
                  title="Yêu thích bài viết"
                  disabled={isLiked}
                >
                  <FaHeart />
                  <span className={styles.socialCount}>{article.likes}</span>
                </button>
                <button className={styles.socialBtn} onClick={handleShare} title="Chia sẻ">
                  <FaShareAlt />
                </button>
              </div>
            </aside>

            <div className={styles.textContent}>
              {article.content?.includes('<') ? (
                <div
                  className={styles.htmlContent}
                  dangerouslySetInnerHTML={{ __html: safeHtmlContent }}
                />
              ) : (
                <div className={styles.plainContent}>
                  {(article.content || '').split('\n').map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              )}

              {article.author && (
                <div className={styles.authorBox}>
                  <Image
                    src={article.author.avatarUrl || `https://i.pravatar.cc/150?u=${article.author.id}`}
                    alt={article.author.fullName}
                    className={styles.largeAvatar}
                    width={80}
                    height={80}
                    unoptimized
                  />
                  <div className={styles.authorInfo}>
                    <h3>{article.author.fullName}</h3>
                    <span className={styles.authorRole}>Tác giả tại Tourista</span>
                    <p>Một người đam mê du lịch và thích lưu giữ lại những khoảnh khắc đẹp của cuộc sống.</p>
                  </div>
                </div>
              )}

              <div className={styles.commentsSection}>
                <h3 className={styles.commentsTitle}>Bình luận & Thảo luận ({comments.length})</h3>

                <form className={styles.commentForm} onSubmit={handleAddComment}>
                  <Image
                    src="https://i.pravatar.cc/150?u=current_user"
                    alt="Me"
                    className={styles.commentAvatar}
                    width={44}
                    height={44}
                    unoptimized
                  />
                  <div className={styles.commentInputWrapper}>
                    <input
                      type="text"
                      placeholder="Bạn nghĩ gì về bài viết này? Chat ngay..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className={styles.commentInput}
                    />
                    <button
                      type="submit"
                      className={styles.commentSubmitBtn}
                      disabled={!newComment.trim() || submittingComment}
                    >
                      {submittingComment ? 'Đang gửi...' : 'Gửi'}
                    </button>
                  </div>
                </form>

                {commentsLoading ? (
                  <div className={styles.commentsLoading}>Đang tải bình luận...</div>
                ) : (
                  <div className={styles.commentsList}>
                    {comments.map((c) => (
                      <div key={c.id} className={styles.commentBubble}>
                        <Image
                          src={c.author?.avatarUrl || `https://i.pravatar.cc/150?u=${c.author?.id}`}
                          alt={c.author?.fullName || 'Người dùng'}
                          className={styles.commentAvatar}
                          width={44}
                          height={44}
                          unoptimized
                        />
                        <div className={styles.commentContent}>
                          <div className={styles.commentHeader}>
                            <span className={styles.commentUser}>{c.author?.fullName || 'Người dùng'}</span>
                            <span className={styles.commentTime}>{formatCommentTime(c.createdAt)}</span>
                          </div>
                          <p className={styles.commentText}>{c.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

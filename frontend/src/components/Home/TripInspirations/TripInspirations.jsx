'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { FaArrowRight, FaBookOpen, FaClock, FaHeart } from 'react-icons/fa';
import { MdAutoAwesome } from 'react-icons/md';
import styles from './TripInspirations.module.css';

/* ─────────────────────────────────────────────────────────────
   Mock data — khớp bảng forum_posts (category: Kinh nghiệm du lịch)
   JOIN users, forum_categories, forum_post_likes
   ───────────────────────────────────────────────────────────── */
const HERO_ARTICLE = {
    id: 0,
    title: 'Con Đường Khó Khăn Dẫn Đến Điểm Đến Tuyệt Đẹp.',
    excerpt: 'Đọc về những chuyến phiêu lưu tuyệt vời mà chúng tôi yêu thích nhất',
    category: 'Kinh nghiệm du lịch',
    cover_image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85',
    author: { name: 'Ban Biên Tập Du Lịch', avatar: 'https://i.pravatar.cc/40?img=10' },
    read_time: 5,
    likes: 2340,
    date: '12 Mar 2026',
};

const ARTICLES = [
    {
        id: 1,
        title: '10 Bãi biển đẹp nhất Việt Nam không thể bỏ qua',
        excerpt: 'Từ Phú Quốc đến Đà Nẵng, khám phá những bờ biển xanh ngọc bích tuyệt đẹp nhất...',
        category: 'Biển & Đảo',
        cover_image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
        author: { name: 'Minh Anh', avatar: 'https://i.pravatar.cc/40?img=1' },
        read_time: 7,
        likes: 845,
        date: '10 Mar 2026',
        tag_color: '#0ea5e9',
    },
    {
        id: 2,
        title: 'Hành trình khám phá Nhật Bản mùa hoa anh đào',
        excerpt: 'Tokyo, Kyoto, Osaka — 7 ngày trải nghiệm văn hóa Nhật đích thực cùng mùa sakura...',
        category: 'Văn hoá & Di sản',
        cover_image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80',
        author: { name: 'Thu Hương', avatar: 'https://i.pravatar.cc/40?img=5' },
        read_time: 10,
        likes: 1203,
        date: '8 Mar 2026',
        tag_color: '#f43f5e',
    },
    {
        id: 3,
        title: 'Bí kíp du lịch Châu Âu tự túc với ngân sách thấp',
        excerpt: 'Làm thế nào để tiết kiệm chi phí mà vẫn tận hưởng trọn vẹn những thành phố huyền thoại...',
        category: 'Hỏi đáp & Mẹo hay',
        cover_image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
        author: { name: 'Quốc Bảo', avatar: 'https://i.pravatar.cc/40?img=3' },
        read_time: 8,
        likes: 967,
        date: '6 Mar 2026',
        tag_color: '#8b5cf6',
    },
    {
        id: 4,
        title: 'Trekking Sapa một mình — Hành trình tìm lại bản thân',
        excerpt: 'Ruộng bậc thang và những con đường mây trắng ở Sapa có thể thay đổi cách bạn nghĩ về cuộc sống...',
        category: 'Leo núi & Trekking',
        cover_image: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=600&q=80',
        author: { name: 'Lê Đạt', avatar: 'https://i.pravatar.cc/40?img=7' },
        read_time: 6,
        likes: 723,
        date: '4 Mar 2026',
        tag_color: '#10b981',
    },
    {
        id: 5,
        title: 'Top 5 resort sang chảnh nhất Đà Lạt năm 2026',
        excerpt: 'Thành phố ngàn hoa với những khu nghỉ dưỡng đẳng cấp, view núi đồi sương mờ lãng mạn...',
        category: 'Khách sạn & Resort',
        cover_image: 'https://images.unsplash.com/photo-1605538032404-d7f54b22a5e7?w=600&q=80',
        author: { name: 'Hoàng Lan', avatar: 'https://i.pravatar.cc/40?img=9' },
        read_time: 5,
        likes: 1456,
        date: '2 Mar 2026',
        tag_color: '#f59e0b',
    },
];

export default function TripInspirations() {
    return (
        <section className={styles.section}>
            <div className={styles.container}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.sectionLabel}>
                        <MdAutoAwesome className={styles.sparkIcon} />
                        <span>Cảm hứng du lịch</span>
                    </div>
                    <div className={styles.headerContent}>
                        <h2 className={styles.title}>Lấy Cảm Hứng Cho Chuyến Đi Tiếp Theo</h2>
                        <button className={styles.readAllBtn}>
                            Đọc tất cả bài viết <FaArrowRight />
                        </button>
                    </div>
                    <p className={styles.subtitle}>Đọc về những chuyến phiêu lưu tuyệt vời mà chúng tôi yêu thích nhất</p>
                </div>

                {/* Layout: hero left + 2 columns right */}
                <div className={styles.layout}>
                    {/* Hero Article */}
                    <HeroCard article={HERO_ARTICLE} />

                    {/* Article Grid */}
                    <div className={styles.articleGrid}>
                        {ARTICLES.map(a => (
                            <ArticleCard key={a.id} article={a} />
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}

/* ── Hero Card (big left) ── */
function HeroCard({ article }) {
    const [liked, setLiked] = useState(false);

    return (
        <div className={styles.heroCard}>
            <img
                src={article.cover_image}
                alt={article.title}
                className={styles.heroImage}
            />
            <div className={styles.heroOverlay} />

            {/* Top chips */}
            <div className={styles.heroTop}>
                <span className={styles.heroCategoryChip}>
                    <FaBookOpen /> {article.category}
                </span>
                <button
                    className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ''}`}
                    onClick={() => setLiked(l => !l)}
                >
                    <FaHeart />
                </button>
            </div>

            {/* Bottom content */}
            <div className={styles.heroContent}>
                <p className={styles.heroExcerpt}>{article.excerpt}</p>
                <h3 className={styles.heroTitle}>{article.title}</h3>

                <div className={styles.heroMeta}>
                    <div className={styles.heroAuthor}>
                        <img src={article.author.avatar} alt={article.author.name} className={styles.avatar} />
                        <span>{article.author.name}</span>
                    </div>
                    <div className={styles.heroStats}>
                        <span><FaClock /> {article.read_time} phút đọc</span>
                        <span><FaHeart /> {article.likes.toLocaleString()}</span>
                    </div>
                </div>

                <button className={styles.heroReadBtn}>
                    Đọc thêm <FaArrowRight />
                </button>
            </div>
        </div>
    );
}

/* ── Article Card (small) ── */
function ArticleCard({ article }) {
    const [liked, setLiked] = useState(false);

    return (
        <div className={styles.articleCard}>
            <div className={styles.articleImageWrap}>
                <img
                    src={article.cover_image}
                    alt={article.title}
                    className={styles.articleImage}
                />
                <span
                    className={styles.articleTag}
                    style={{ background: article.tag_color }}
                >
                    {article.category}
                </span>
            </div>

            <div className={styles.articleBody}>
                <h4 className={styles.articleTitle}>{article.title}</h4>
                <p className={styles.articleExcerpt}>{article.excerpt}</p>

                <div className={styles.articleMeta}>
                    <div className={styles.articleAuthor}>
                        <img src={article.author.avatar} alt={article.author.name} className={styles.smallAvatar} />
                        <span className={styles.authorName}>{article.author.name}</span>
                        <span className={styles.metaDot}>·</span>
                        <span className={styles.metaDate}>{article.date}</span>
                    </div>
                    <div className={styles.articleActions}>
                        <span className={styles.readTime}>
                            <FaClock /> {article.read_time}m
                        </span>
                        <button
                            className={`${styles.smallLikeBtn} ${liked ? styles.smallLikeBtnActive : ''}`}
                            onClick={() => setLiked(l => !l)}
                        >
                            <FaHeart /> {article.likes}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

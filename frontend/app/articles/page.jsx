'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaBookOpen, FaHeart, FaEye, FaClock } from 'react-icons/fa';
import styles from './page.module.css';

// Dữ liệu mẫu (Mock Data) giả lập bài viết
const ARTICLES = [
    {
        id: '1',
        slug: 'kham-pha-bien-xanh-phu-quoc',
        title: '10 Bãi biển đẹp nhất Việt Nam không thể bỏ qua',
        excerpt: 'Từ Phú Quốc đến Đà Nẵng, khám phá những bờ biển xanh ngọc bích tuyệt đẹp nhất đánh thức mùa hè của bạn...',
        category: 'BIỂN & ĐẢO',
        readTime: '7 phút',
        views: 845,
        likes: 234,
        image: 'https://images.unsplash.com/photo-1544644181-1484b3f8c8b1?w=800&q=80',
        author: { name: 'Minh Anh', avatar: 'https://i.pravatar.cc/150?u=a' },
        date: '10 Mar 2026'
    },
    {
        id: '2',
        slug: 'hanh-trinh-kham-pha-nhat-ban-mua-hoa-anh-dao',
        title: 'Hành trình khám phá Nhật Bản mùa hoa anh đào',
        excerpt: 'Tokyo, Kyoto, Osaka — 7 ngày trải nghiệm văn hóa Nhật đích thực cùng mùa sakura hoa nở rợp trời...',
        category: 'VĂN HOÁ & DI SẢN',
        readTime: '10 phút',
        views: 1203,
        likes: 512,
        image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
        author: { name: 'Thu Hương', avatar: 'https://i.pravatar.cc/150?u=b' },
        date: '8 Mar 2026'
    },
    {
        id: '3',
        slug: 'bi-kip-du-lich-chau-au-ngan-sach-thap',
        title: 'Bí kíp du lịch Châu Âu tự túc với ngân sách thấp',
        excerpt: 'Làm thế nào để tiết kiệm chi phí mà vẫn tận hưởng trọn vẹn những thành phố huyền thoại ở Châu Âu?',
        category: 'MẸO DU LỊCH',
        readTime: '8 phút',
        views: 967,
        likes: 189,
        image: 'https://images.unsplash.com/photo-1516483638261-f4085ee6bd0f?w=800&q=80',
        author: { name: 'Quốc Bảo', avatar: 'https://i.pravatar.cc/150?u=c' },
        date: '6 Mar 2026'
    },
    {
        id: '4',
        slug: 'leo-nui-sapa-chuyen-di-cuoc-doi',
        title: 'Trekking Sapa một mình — Hành trình tìm lại bản thân',
        excerpt: 'Ruộng bậc thang và những con đường mây trắng ở Sapa có thể thay đổi cách bạn nghĩ về cuộc sống...',
        category: 'KINH NGHIỆM',
        readTime: '5 phút',
        views: 2340,
        likes: 815,
        image: 'https://images.unsplash.com/photo-1520625692067-1065e8aeda06?w=800&q=80',
        author: { name: 'Hoàng Vũ', avatar: 'https://i.pravatar.cc/150?u=d' },
        date: '5 Mar 2026'
    },
    {
        id: '5',
        slug: 'mon-ngon-ha-noi-phai-thu',
        title: 'Bản đồ Ẩm thực Thủ Đô: Ăn gì khi đến Hà Nội?',
        excerpt: 'Từ Bún Chả Hương Liên đến Phở Thìn Lò Đúc, hãy cùng đánh thức vị giác bằng những nét tinh tuý nhất...',
        category: 'ẨM THỰC',
        readTime: '6 phút',
        views: 654,
        likes: 132,
        image: 'https://images.unsplash.com/photo-1555658636-6e4a36210b15?w=800&q=80',
        author: { name: 'Thanh Trúc', avatar: 'https://i.pravatar.cc/150?u=e' },
        date: '2 Mar 2026'
    },
    {
        id: '6',
        slug: 'thien-duong-bali-khach-san-doc-la',
        title: 'Sống trong rừng nhiệt đới tại những Resort Bali',
        excerpt: 'Đánh giá Top 5 khu nghỉ dưỡng biệt lập hoà mình vào thiên nhiên đáng trải nghiệm nhất...',
        category: 'KHÁCH SẠN 5★',
        readTime: '12 phút',
        views: 1543,
        likes: 672,
        image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?w=800&q=80',
        author: { name: 'Tuấn Cảnh', avatar: 'https://i.pravatar.cc/150?u=f' },
        date: '28 Feb 2026'
    }
];

const CATEGORIES = ['Tất cả', 'Biển & Đảo', 'Văn hoá & Di sản', 'Mẹo du lịch', 'Kinh nghiệm', 'Ẩm thực', 'Khách sạn 5★'];

export default function ArticlesPage() {
    const [activeTab, setActiveTab] = useState('Tất cả');
    const [articles, setArticles] = useState([]);

    React.useEffect(() => {
        const storedArticles = localStorage.getItem('tourista_articles');
        if (storedArticles) {
            setArticles(JSON.parse(storedArticles));
        } else {
            localStorage.setItem('tourista_articles', JSON.stringify(ARTICLES));
            setArticles(ARTICLES);
        }
    }, []);

    const filteredArticles = activeTab === 'Tất cả' 
        ? articles 
        : articles.filter(a => a.category.toLowerCase() === activeTab.toLowerCase());

    return (
        <main className={styles.page}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroOverlay}></div>
                <div className={styles.heroContent}>
                    <h1><FaBookOpen className={styles.heroIcon}/> Cẩm Nang Du Lịch</h1>
                    <p>Chia sẻ mẹo hay, đánh giá chân thật và nguồn cảm hứng bất tận cho những điểm đến tiếp theo của bạn.</p>
                </div>
            </section>

            <div className={styles.container}>
                {/* Filters and Actions */}
                <div className={styles.headerActions}>
                    <div className={styles.filterSection}>
                        {CATEGORIES.map(cat => (
                            <button 
                                key={cat} 
                                className={`${styles.filterBtn} ${activeTab === cat ? styles.activeFilter : ''}`}
                                onClick={() => setActiveTab(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <Link href="/articles/create" className={styles.createBtn}>
                        + Đăng bài
                    </Link>
                </div>

                {/* Articles Grid */}
                <div className={styles.grid}>
                    {filteredArticles.map((article) => (
                        <Link href={`/articles/${article.slug}`} key={article.id} className={styles.card}>
                            <div className={styles.imgWrapper}>
                                <img src={article.image} alt={article.title} className={styles.cardImg} loading="lazy" decoding="async" />
                                <span className={styles.categoryBadge}>{article.category}</span>
                            </div>
                            <div className={styles.cardBody}>
                                <div className={styles.metaTop}>
                                    <span className={styles.date}>{article.date}</span>
                                    <span className={styles.readTime}><FaClock /> {article.readTime}</span>
                                </div>
                                <h2 className={styles.title}>{article.title}</h2>
                                <p className={styles.excerpt}>{article.excerpt}</p>
                                <div className={styles.cardFooter}>
                                    <div className={styles.author}>
                                        <img src={article.author.avatar} alt="Avatar" className={styles.avatar} />
                                        <span>{article.author.name}</span>
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
                
                {filteredArticles.length === 0 && (
                    <div className={styles.emptyState}>
                        <p>Chưa có bài viết nào trong chủ đề này.</p>
                        <button onClick={() => setActiveTab('Tất cả')} className={styles.resetBtn}>Xem tất cả</button>
                    </div>
                )}
                
                {/* Pagination (Mock) */}
                {filteredArticles.length > 0 && (
                    <div className={styles.pagination}>
                        <button className={`${styles.pageBtn} ${styles.activePage}`}>1</button>
                        <button className={styles.pageBtn}>2</button>
                        <button className={styles.pageBtn}>Sau {'>'}</button>
                    </div>
                )}
            </div>
        </main>
    );
}

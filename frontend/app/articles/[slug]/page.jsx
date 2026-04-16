'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { FaChevronLeft, FaHeart, FaShareAlt, FaClock, FaCalendar, FaEye } from 'react-icons/fa';
import DOMPurify from 'dompurify';
import styles from './page.module.css';

// Dữ liệu mẫu (sẽ được thay thế khi có Backend)
const ARTICLE_DATA = {
    title: '10 Bãi biển đẹp nhất Việt Nam không thể bỏ qua',
    category: 'BIỂN & ĐẢO',
    date: '10 Tháng 3, 2026',
    readTime: '7 phút',
    views: 845,
    likes: 234,
    image: 'https://images.unsplash.com/photo-1544644181-1484b3f8c8b1?w=1600&q=80',
    content: `
        <p>Biển xanh, cát trắng, nắng vàng luôn là những thứ ma thuật gọi mời du khách mỗi khi hè về. Việt Nam, với hơn 3000 km bờ biển trải dài dọc theo đất nước, tự hào sở hữu những bãi biển lọt top đẹp nhất hành tinh.</p>
        
        <h2>1. Bãi Sao (Phú Quốc)</h2>
        <p>Khi nhắc tới Phú Quốc, Bãi Sao luôn là cái tên được xướng lên đầu tiên. Bờ cát ở đây không mang màu vàng đậm như biển Nha Trang, mà trắng mịn như kem và uốn lượn hình vành trăng khuyết.</p>
        <img src="https://images.unsplash.com/photo-1544644181-1484b3f8c8b1?w=1000&q=80" alt="Bãi Sao Phú Quốc" />
        
        <h2>2. Bãi Mỹ Khê (Đà Nẵng)</h2>
        <p>Được tạp chí kinh tế hàng đầu của Mỹ Forbes bình chọn là một trong 6 bãi biển quyến rũ nhất hành tinh, Mỹ Khê luôn là sự lựa chọn số 1 của du khách trong và ngoài nước.</p>
        
        <h3>Lời khuyên khi đi biển</h3>
        <ul>
            <li>Nên thoa kem chống nắng trước khi lội nước 30 phút.</li>
            <li>Đừng quên mang túi chống nước cho điện thoại.</li>
            <li>Theo dõi dòng chảy xa bờ (rip current) để tránh nguy hiểm.</li>
        </ul>
        <p>Hãy tự mình trải nghiệm và chia sẻ những khoảnh khắc tuyệt vời này nhé!</p>
    `,
    author: {
        name: 'Minh Anh',
        role: 'Travel Blogger tại Tourista',
        avatar: 'https://i.pravatar.cc/150?u=a',
        bio: 'Đam mê khám phá các hòn đảo biệt lập và ghi lạy những thước phim đẹp nhất về Mẹ Thiên Nhiên.'
    }
};

export default function ArticleDetail({ params }) {
    const { slug } = React.use(params);
    const router = useRouter();
    const [article, setArticle] = useState(null);
    const [isLiked, setIsLiked] = useState(false);
    
    // Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    
    useEffect(() => {
        // Lấy article từ localStorage
        const storedDetails = JSON.parse(localStorage.getItem('tourista_article_details') || '{}');
        const storedArticles = JSON.parse(localStorage.getItem('tourista_articles') || '[]');
        
        // Tìm article theo slug, ưu tiên lấy từ details (sau này có bài custom), hoặc tìm trong danh sách tổng
        let foundArticle = storedDetails[slug] || storedArticles.find(a => a.slug === slug);
        
        // Nếu không có trong storage nào, xài dummy data tạm nếu đúng slug cũ (Mock)
        if (!foundArticle) {
            foundArticle = ARTICLE_DATA; 
        }

        // Chuẩn hóa shape để tránh crash khi dữ liệu từ localStorage thiếu field.
        const normalizedArticle = {
            ...ARTICLE_DATA,
            ...(foundArticle || {}),
            content:
                typeof foundArticle?.content === 'string' && foundArticle.content.trim()
                    ? foundArticle.content
                    : ARTICLE_DATA.content,
            author: {
                ...ARTICLE_DATA.author,
                ...(foundArticle?.author || {}),
            },
        };

        // Lấy comments cho bài viết này
        const allComments = JSON.parse(localStorage.getItem('tourista_comments') || '{}');
        const fallbackComments = [
            { id: 1, user: 'Anh Đức', avatar: 'https://i.pravatar.cc/150?u=12', text: 'Bài viết rất hay, cảm ơn bạn đã chia sẻ!', time: '2 giờ trước' },
            { id: 2, user: 'Hoài Trang', avatar: 'https://i.pravatar.cc/150?u=44', text: 'Tuyệt vời quá, mình sắp đi chỗ này, lưu lại ngay!', time: '5 giờ trước' }
        ];
        const initialComments = allComments[slug] || fallbackComments;

        setTimeout(() => {
            setArticle(normalizedArticle);
            setComments(initialComments);
        }, 300);
    }, [slug]);

    const handleAddComment = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        const commentObj = {
            id: Date.now(),
            user: 'Bạn (Hiện tại)',
            avatar: 'https://i.pravatar.cc/150?u=current_user',
            text: newComment,
            time: 'Vừa xong'
        };

        const updatedComments = [commentObj, ...comments];
        setComments(updatedComments);
        setNewComment('');

        // Cập nhật lên LocalStorage
        const allComments = JSON.parse(localStorage.getItem('tourista_comments') || '{}');
        allComments[slug] = updatedComments;
        localStorage.setItem('tourista_comments', JSON.stringify(allComments));
    };

    if (!article) return <div className={styles.loading}>Đang tải trang đọc bài viết...</div>;

    const articleContent = typeof article.content === 'string' ? article.content : '';
    const safeHtmlContent = DOMPurify.sanitize(articleContent, {
        USE_PROFILES: { html: true },
    });

    return (
        <main className={styles.page}>
            {/* Nav Back */}
            <div className={styles.navTop}>
                <div className="container">
                    <button className={styles.backBtn} onClick={() => router.push('/articles')}>
                        <FaChevronLeft /> Trở về Cẩm nang
                    </button>
                </div>
            </div>

            {/* Header Hero */}
            <article className={styles.article}>
                <header className={styles.header}>
                    <div className="container">
                        <div className={styles.headerContent}>
                            <span className={styles.categoryBadge}>{article.category}</span>
                            <h1 className={styles.title}>{article.title}</h1>
                            
                            <div className={styles.metaData}>
                                <div className={styles.authorBadge}>
                                    <Image src={article.author.avatar} alt="Avatar" className={styles.smallAvatar} width={32} height={32} unoptimized />
                                    <span>{article.author.name}</span>
                                </div>
                                <span className={styles.metaItem}><FaCalendar /> {article.date}</span>
                                <span className={styles.metaItem}><FaClock /> {article.readTime}</span>
                                <span className={styles.metaItem}><FaEye /> {article.views} Lượt xem</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className={styles.heroImageWrapper}>
                    <Image
                        src={article.image}
                        alt={article.title}
                        className={styles.heroImage}
                        fill
                        sizes="(max-width: 1100px) 100vw, 1100px"
                        unoptimized
                    />
                </div>

                {/* Main Content Area */}
                <div className={styles.contentContainer}>
                    <div className={styles.contentGrid}>
                        {/* Side Actions (Like / Share) */}
                        <aside className={styles.socialSidebar}>
                            <div className={styles.socialSticky}>
                                <button 
                                    className={`${styles.socialBtn} ${isLiked ? styles.socialLiked : ''}`}
                                    onClick={() => setIsLiked(!isLiked)}
                                    title="Yêu thích bài viết"
                                >
                                    <FaHeart />
                                    <span className={styles.socialCount}>{isLiked ? article.likes + 1 : article.likes}</span>
                                </button>
                                <button className={styles.socialBtn} title="Chia sẻ">
                                    <FaShareAlt />
                                </button>
                            </div>
                        </aside>

                        {/* Article Text Content */}
                        <div className={styles.textContent}>
                            {/* Cho phép hiển thị cả markdown cơ bản hoặc plain text, giả lập HTML */}
                            {articleContent.includes('<p>') ? (
                                <div 
                                    className={styles.htmlContent} 
                                    dangerouslySetInnerHTML={{ __html: safeHtmlContent }} 
                                />
                            ) : (
                                <div className={styles.plainContent}>
                                    {articleContent.split('\n').map((para, idx) => (
                                        <p key={idx}>{para}</p>
                                    ))}
                                </div>
                            )}
                            
                            {/* Author Box */}
                            <div className={styles.authorBox}>
                                <Image src={article.author.avatar} alt={article.author.name} className={styles.largeAvatar} width={80} height={80} unoptimized />
                                <div className={styles.authorInfo}>
                                    <h3>{article.author.name}</h3>
                                    <span className={styles.authorRole}>{article.author.role || 'Thành viên Tourista'}</span>
                                    <p>{article.author.bio || 'Một người đam mê du lịch và thích lưu giữ lại những khoảnh khắc đẹp của cuộc sống.'}</p>
                                </div>
                            </div>

                            {/* Chat / Comments Section (New Feature) */}
                            <div className={styles.commentsSection}>
                                <h3 className={styles.commentsTitle}>Bình luận & Thảo luận ({comments.length})</h3>
                                
                                <form className={styles.commentForm} onSubmit={handleAddComment}>
                                    <Image src="https://i.pravatar.cc/150?u=current_user" alt="Me" className={styles.commentAvatar} width={44} height={44} unoptimized />
                                    <div className={styles.commentInputWrapper}>
                                        <input 
                                            type="text" 
                                            placeholder="Bạn nghĩ gì về bài viết này? Chat ngay..." 
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className={styles.commentInput}
                                        />
                                        <button type="submit" className={styles.commentSubmitBtn} disabled={!newComment.trim()}>Gửi</button>
                                    </div>
                                </form>

                                <div className={styles.commentsList}>
                                    {comments.map(c => (
                                        <div key={c.id} className={styles.commentBubble}>
                                            <Image src={c.avatar} alt={c.user} className={styles.commentAvatar} width={44} height={44} unoptimized />
                                            <div className={styles.commentContent}>
                                                <div className={styles.commentHeader}>
                                                    <span className={styles.commentUser}>{c.user}</span>
                                                    <span className={styles.commentTime}>{c.time}</span>
                                                </div>
                                                <p className={styles.commentText}>{c.text}</p>
                                                <div className={styles.commentActions}>
                                                    <button>Thích</button>
                                                    <button>Phản hồi</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </article>
        </main>
    );
}

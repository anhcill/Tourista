'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaChevronLeft, FaImage, FaPaperPlane } from 'react-icons/fa';
import styles from './page.module.css';

const CATEGORIES = ['Biển & Đảo', 'Văn hoá & Di sản', 'Mẹo du lịch', 'Kinh nghiệm', 'Ẩm thực', 'Khách sạn 5★'];

export default function CreateArticlePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Tạo slug từ title
        const createSlug = (str) => {
            return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        };

        const newArticle = {
            id: Date.now().toString(),
            slug: createSlug(title) + '-' + Date.now().toString().slice(-4),
            title,
            excerpt: excerpt || title,
            content,
            category,
            readTime: Math.max(1, Math.ceil(content.split(' ').length / 200)) + ' phút',
            views: 0,
            likes: 0,
            image: imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80', // Default image
            author: { name: 'Bạn (Người dùng hiện tại)', avatar: 'https://i.pravatar.cc/150?u=current_user' },
            date: new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' })
        };

        // Lấy articles từ localStorage
        const storedArticles = JSON.parse(localStorage.getItem('tourista_articles') || '[]');
        
        // Thêm bài mới lên đầu
        const updatedArticles = [newArticle, ...storedArticles];
        localStorage.setItem('tourista_articles', JSON.stringify(updatedArticles));

        // Lưu content chi tiết (Mock backend)
        const storedDetails = JSON.parse(localStorage.getItem('tourista_article_details') || '{}');
        storedDetails[newArticle.slug] = newArticle;
        localStorage.setItem('tourista_article_details', JSON.stringify(storedDetails));

        setTimeout(() => {
            setIsLoading(false);
            router.push('/articles');
        }, 1000); // Giả lập network request
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
                    
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label>Tiêu đề bài viết</label>
                            <input 
                                type="text" 
                                placeholder="Khám phá vùng đất mới..." 
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required 
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label>Chủ đề</label>
                                <select 
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    {CATEGORIES.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Link ảnh bìa (URL)</label>
                                <div className={styles.inputWithIcon}>
                                    <FaImage className={styles.inputIcon} />
                                    <input 
                                        type="url" 
                                        placeholder="https://example.com/image.jpg" 
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label>Tóm tắt ngắn</label>
                            <textarea 
                                placeholder="Viết một đoạn ngắn giới thiệu về chuyến đi của bạn..." 
                                rows="2"
                                value={excerpt}
                                onChange={(e) => setExcerpt(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Nội dung chi tiết (Mô phỏng trình soạn thảo)</label>
                            <textarea 
                                className={styles.editor}
                                placeholder="Hôm nay tôi đã đi đâu..." 
                                rows="12"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formActions}>
                            <button 
                                type="submit" 
                                className={`${styles.submitBtn} ${isLoading ? styles.loading : ''}`}
                                disabled={isLoading || !title || !content}
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

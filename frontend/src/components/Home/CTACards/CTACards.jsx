'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaArrowRight, FaBell, FaEnvelope } from 'react-icons/fa';
import { MdHotel, MdPublic } from 'react-icons/md';
import styles from './CTACards.module.css';

const CTA_CARDS = [
    {
        id: 1,
        title: 'Đặt Khách Sạn, Theo Đội Bóng Của Bạn',
        desc: 'Tìm chỗ ở lý tưởng gần các sự kiện thể thao và âm nhạc lớn nhất năm.',
        cover: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=700&q=80',
        icon: <MdHotel />,
        btnText: 'Đặt ngay',
        color: '#667eea',
        targetUrl: '/hotels/search?destination=Da%20Nang&checkIn=2026-04-02&checkOut=2026-04-03&adults=2&children=0&rooms=1',
    },
    {
        id: 2,
        title: 'Đăng Ký Nhận Bản Tin',
        desc: 'Nhận ưu đãi độc quyền và cập nhật điểm đến mới nhất qua email mỗi tuần.',
        cover: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80',
        icon: <FaEnvelope />,
        btnText: 'Đăng ký ngay',
        color: '#10b981',
        hasInput: true,
    },
    {
        id: 3,
        title: 'Đánh Giá Dịch Vụ Khách Sạn Toàn Cầu',
        desc: 'Chia sẻ trải nghiệm của bạn và giúp cộng đồng tìm được chỗ ở tốt nhất.',
        cover: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=700&q=80',
        icon: <FaBell />,
        btnText: 'Viết đánh giá',
        color: '#f59e0b',
        targetUrl: '/profile/bookings',
    },
    {
        id: 4,
        title: 'Cập Nhật Tin Tức Du Lịch Mới Nhất',
        desc: 'Cập nhật xu hướng du lịch, điểm đến mới và các sự kiện văn hóa nổi bật.',
        cover: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=700&q=80',
        icon: <MdPublic />,
        btnText: 'Khám phá ngay',
        color: '#8b5cf6',
        targetUrl: '/tours',
    },
];

export default function CTACards() {
    const router = useRouter();
    const [email, setEmail] = useState('');

    const handleNewsletterSubmit = () => {
        if (!email.trim() || !email.includes('@')) {
            toast.error('Vui lòng nhập email hợp lệ.');
            return;
        }

        toast.success('Đăng ký nhận bản tin thành công.');
        setEmail('');
    };

    const handleCardAction = (card) => {
        if (card.hasInput) {
            handleNewsletterSubmit();
            return;
        }

        if (card.targetUrl) {
            router.push(card.targetUrl);
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {CTA_CARDS.map(card => (
                        <CTACard
                            key={card.id}
                            card={card}
                            email={email}
                            setEmail={setEmail}
                            onAction={handleCardAction}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTACard({ card, email, setEmail, onAction }) {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className={styles.card}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <div className={styles.imageWrap}>
                <img
                    src={card.cover}
                    alt={card.title}
                    className={`${styles.image} ${hovered ? styles.imageZoom : ''}`}
                />
                <div className={styles.imageMask} />

                {/* Icon chip */}
                <div className={styles.iconChip} style={{ background: card.color }}>
                    {card.icon}
                </div>
            </div>

            <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDesc}>{card.desc}</p>

                {card.hasInput ? (
                    <div className={styles.subscribeRow}>
                        <input
                            type="email"
                            className={styles.emailInput}
                            placeholder="your@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        <button
                            type="button"
                            className={styles.subscribeBtn}
                            style={{ background: card.color }}
                            onClick={() => onAction?.(card)}
                        >
                            <FaArrowRight />
                        </button>
                    </div>
                ) : (
                    <button
                        className={styles.ctaBtn}
                        type="button"
                        onClick={() => onAction?.(card)}
                        style={hovered ? { background: card.color, borderColor: card.color, color: 'white' } : {}}
                    >
                        {card.btnText} <FaArrowRight />
                    </button>
                )}
            </div>
        </div>
    );
}

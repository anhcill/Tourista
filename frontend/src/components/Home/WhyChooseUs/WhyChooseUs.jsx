'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { FaArrowRight, FaCheckCircle } from 'react-icons/fa';
import { MdPool, MdStar, MdSecurity, MdSupportAgent } from 'react-icons/md';
import styles from './WhyChooseUs.module.css';

const FEATURES = [
    {
        icon: <MdPool />,
        title: 'Chỗ ở đẳng cấp',
        desc: 'Hàng nghìn khách sạn và khu resort được kiểm duyệt chất lượng từ 2★ đến 5★',
        color: '#667eea',
    },
    {
        icon: <MdStar />,
        title: 'Giá tốt nhất',
        desc: 'Cam kết giá tốt nhất thị trường — đặt trước tiết kiệm đến 40%',
        color: '#f59e0b',
    },
    {
        icon: <MdSecurity />,
        title: 'Thanh toán bảo mật',
        desc: 'Hệ thống mã hóa SSL, hỗ trợ MoMo, VNPay, ZaloPay và thẻ quốc tế',
        color: '#10b981',
    },
    {
        icon: <MdSupportAgent />,
        title: 'Hỗ trợ 24/7',
        desc: 'Đội ngũ hỗ trợ khách hàng sẵn sàng giải đáp mọi thắc mắc bất cứ lúc nào',
        color: '#f43f5e',
    },
];

export default function WhyChooseUs() {
    return (
        <section className={styles.section}>
            {/* Background image */}
            <div className={styles.bgImageWrap}>
                <img loading="lazy" decoding="async"
                    src="https://images.unsplash.com/photo-1540541338537-1220059a5b57?w=1600&q=85"
                    alt="Luxury pool resort"
                    className={styles.bgImage}
                />
                <div className={styles.bgOverlay} />
            </div>

            {/* Content */}
            <div className={styles.container}>
                <div className={styles.inner}>

                    {/* Text block */}
                    <div className={styles.textBlock}>
                        <p className={styles.eyebrow}>Tại sao chọn Tourista?</p>
                        <h2 className={styles.title}>Tại Sao Chọn Chúng Tôi?</h2>
                        <p className={styles.desc}>
                            Tourista mang đến trải nghiệm đặt phòng khách sạn và tour du lịch
                            hoàn hảo nhất — nhanh chóng, an toàn và tiết kiệm.
                        </p>

                        <ul className={styles.checklist}>
                            <li><FaCheckCircle className={styles.checkIcon} /> Hơn 10.000+ khách sạn trên toàn cầu</li>
                            <li><FaCheckCircle className={styles.checkIcon} /> Hủy phòng miễn phí trong 24 giờ</li>
                            <li><FaCheckCircle className={styles.checkIcon} /> Đánh giá thực từ người đã ở</li>
                        </ul>

                        <button className={styles.exploreBtn}>
                            Khám phá thêm <FaArrowRight />
                        </button>
                    </div>

                    {/* Feature cards */}
                    <div className={styles.featuresGrid}>
                        {FEATURES.map((f, i) => (
                            <div key={i} className={styles.featureCard}>
                                <div className={styles.featureIcon} style={{ color: f.color, background: `${f.color}18` }}>
                                    {f.icon}
                                </div>
                                <div>
                                    <h4 className={styles.featureTitle}>{f.title}</h4>
                                    <p className={styles.featureDesc}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </section>
    );
}

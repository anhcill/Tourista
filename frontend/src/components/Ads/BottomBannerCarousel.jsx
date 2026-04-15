'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './BottomBannerCarousel.module.css';

const slides = [
    {
        id: 1,
        imageSrc: "/images/promos/promo_carousel_summer_1775812972774.png",
        title: "Summer Vibes",
        subtitle: "Đón hè thả ga - Giảm tới 30% khi đặt Resort biển",
        link: "/hotels",
        btnText: "Khám phá ngay"
    },
    {
        id: 2,
        imageSrc: "/images/promos/promo_carousel_family_1775813000045.png",
        title: "Family Holidays",
        subtitle: "Tạo kỷ niệm khó quên cùng gia đình chỉ từ 2,990,000đ",
        link: "/tours",
        btnText: "Xem các Tour Gia đình"
    },
    {
        id: 3,
        imageSrc: "/images/promos/promo_carousel_cruise_1775813017697.png",
        title: "Luxury Cruise",
        subtitle: "Trải nghiệm Đẳng cấp trên Du Thuyền 5 sao - Mua 1 Tặng 1",
        link: "/tours",
        btnText: "Đặt chỗ Du thuyền"
    }
];

const BottomBannerCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto slide
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
        }, 5000); // 5s đổi ảnh
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    };

    return (
        <section className={styles.carouselSection}>
            <div className="container">
                <div className={styles.carouselWrapper}>
                    <div 
                        className={styles.slidesContainer}
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                        {slides.map((slide) => (
                            <div key={slide.id} className={styles.slide}>
                                <div className={styles.imageWrapper}>
                                    <Image 
                                        src={slide.imageSrc}
                                        alt={slide.title}
                                        fill
                                        className={styles.slideImage}
                                        sizes="(max-width: 1200px) 100vw, 1200px"
                                        priority={slide.id === 1}
                                    />
                                    <div className={styles.overlay}>
                                        <div className={styles.content}>
                                            <h3 className={styles.title}>{slide.title}</h3>
                                            <p className={styles.subtitle}>{slide.subtitle}</p>
                                            <Link href={slide.link} className={styles.btn}>
                                                {slide.btnText}
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Navigation Buttons */}
                    <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={prevSlide}>
                        <FaChevronLeft />
                    </button>
                    <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={nextSlide}>
                        <FaChevronRight />
                    </button>

                    {/* Dots */}
                    <div className={styles.dots}>
                        {slides.map((_, idx) => (
                            <button 
                                key={idx}
                                className={`${styles.dot} ${currentSlide === idx ? styles.activeDot : ''}`}
                                onClick={() => setCurrentSlide(idx)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default BottomBannerCarousel;

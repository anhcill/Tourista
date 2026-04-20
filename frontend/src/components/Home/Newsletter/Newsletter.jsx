'use client';

import React, { useState } from 'react';
import { FaPaperPlane, FaEnvelope } from 'react-icons/fa';
import styles from './Newsletter.module.css';

export default function Newsletter() {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email) return;

        setIsSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            alert(`Cảm ơn bạn! Đã đăng ký nhận tin thành công với email: ${email}`);
            setEmail('');
            setIsSubmitting(false);
        }, 800);
    };

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                <div className={styles.banner}>
                    <div className={styles.contentWrapper}>
                        <FaPaperPlane className={styles.icon} />
                        <h2 className={styles.title}>Chuẩn bị cho chuyến đi tiếp theo?</h2>
                        <p className={styles.subtitle}>
                            Đăng ký nhận bản tin từ Tourista Studio để không bỏ lỡ các deal khách sạn và tour du lịch độc quyền với giá tốt nhất, gửi trực tiếp vào hộp thư của bạn.
                        </p>
                        
                        <form className={styles.form} onSubmit={handleSubmit}>
                            <div className={styles.inputWrapper}>
                                <FaEnvelope className={styles.mailIcon} />
                                <input 
                                    type="email" 
                                    placeholder="Nhập địa chỉ email của bạn" 
                                    className={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button 
                                type="submit" 
                                className={styles.submitBtn}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Đăng ký ngay'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}

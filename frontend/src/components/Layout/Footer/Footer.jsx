'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCcVisa, FaCcMastercard, FaCcPaypal } from 'react-icons/fa';
import { SOCIAL_LINKS, CONTACT_INFO } from '../../../utils/constants';
import styles from './Footer.module.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.footerContent}>
                    {/* About Section */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Về Tourista</h3>
                        <p className={styles.description}>
                            Nền tảng đặt phòng khách sạn và tour du lịch hàng đầu,
                            mang đến trải nghiệm du lịch tuyệt vời cho bạn.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href={SOCIAL_LINKS.FACEBOOK} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                                <FaFacebook />
                            </a>
                            <a href={SOCIAL_LINKS.TWITTER} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                                <FaTwitter />
                            </a>
                            <a href={SOCIAL_LINKS.INSTAGRAM} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                                <FaInstagram />
                            </a>
                            <a href={SOCIAL_LINKS.YOUTUBE} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                                <FaYoutube />
                            </a>
                            <a href={SOCIAL_LINKS.TIKTOK} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                                <FaTiktok />
                            </a>
                            <a href={SOCIAL_LINKS.LINKEDIN} className={styles.socialLink} target="_blank" rel="noopener noreferrer">
                                <FaLinkedin />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Liên kết nhanh</h3>
                        <ul className={styles.linkList}>
                            <li><Link href="/" className={styles.link}>Trang chủ</Link></li>
                            <li><Link href="/hotels" className={styles.link}>Khách sạn</Link></li>
                            <li><Link href="/tours" className={styles.link}>Tours</Link></li>
                            <li><Link href="/about" className={styles.link}>Về chúng tôi</Link></li>
                            <li><Link href="/contact" className={styles.link}>Liên hệ</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Hỗ trợ</h3>
                        <ul className={styles.linkList}>
                            <li><Link href="/faq" className={styles.link}>Câu hỏi thường gặp</Link></li>
                            <li><Link href="/terms" className={styles.link}>Điều khoản sử dụng</Link></li>
                            <li><Link href="/privacy" className={styles.link}>Chính sách bảo mật</Link></li>
                            <li><Link href="/refund" className={styles.link}>Chính sách hoàn tiền</Link></li>
                            <li><Link href="/help" className={styles.link}>Trung tâm trợ giúp</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Liên hệ</h3>
                        <ul className={styles.contactList}>
                            <li className={styles.contactItem}>
                                <FaMapMarkerAlt className={styles.contactIcon} />
                                <span>{CONTACT_INFO.ADDRESS}</span>
                            </li>
                            <li className={styles.contactItem}>
                                <FaPhone className={styles.contactIcon} />
                                <span>{CONTACT_INFO.PHONE}</span>
                            </li>
                            <li className={styles.contactItem}>
                                <FaEnvelope className={styles.contactIcon} />
                                <span>{CONTACT_INFO.EMAIL}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter Subscription */}
                <div className={styles.newsletter}>
                    <h3 className={styles.newsletterTitle}>Đăng ký nhận tin</h3>
                    <p className={styles.newsletterText}>
                        Nhận thông tin ưu đãi và cập nhật mới nhất từ chúng tôi
                    </p>
                    <form className={styles.newsletterForm} onSubmit={(e) => e.preventDefault()}>
                        <div className={styles.inputWrapper}>
                            <FaEnvelope className={styles.inputIcon} />
                            <input
                                type="email"
                                placeholder="Enter Your Email"
                                className={styles.newsletterInput}
                                required
                            />
                        </div>
                        <button type="submit" className={styles.subscribeBtn}>
                            Subscribe
                        </button>
                    </form>
                </div>

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © {currentYear} Tourista. All rights reserved.
                    </p>
                    <div className={styles.paymentMethods}>
                        <span className={styles.paymentText}>Chúng tôi chấp nhận:</span>
                        <div className={styles.paymentIcons}>
                            <FaCcVisa className={styles.paymentIcon} />
                            <FaCcMastercard className={styles.paymentIcon} />
                            <FaCcPaypal className={styles.paymentIcon} />
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

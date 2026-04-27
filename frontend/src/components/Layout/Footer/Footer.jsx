'use client';

import React from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaYoutube, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCcVisa, FaCcMastercard, FaCcPaypal } from 'react-icons/fa';
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
                        <h3 className={styles.sectionTitle}>Về Tourista Studio</h3>
                        <p className={styles.description}>
                            Nền tảng đặt phòng khách sạn và tour du lịch hàng đầu tại Việt Nam.
                            Hỗ trợ 24/7 qua hotline <a href="tel:0815913408" style={{ color: '#60a5fa' }}>0815 913 408</a>.
                        </p>
                        <div className={styles.socialLinks}>
                            <a href={SOCIAL_LINKS.FACEBOOK} className={styles.socialLink} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <FaFacebook />
                            </a>
                            <a href={SOCIAL_LINKS.INSTAGRAM} className={styles.socialLink} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <FaInstagram />
                            </a>
                            <a href={SOCIAL_LINKS.YOUTUBE} className={styles.socialLink} target="_blank" rel="noopener noreferrer" aria-label="Youtube">
                                <FaYoutube />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Dịch vụ</h3>
                        <ul className={styles.linkList}>
                            <li><Link href="/hotels" className={styles.link}>Khách sạn</Link></li>
                            <li><Link href="/tours" className={styles.link}>Tours du lịch</Link></li>
                            <li><Link href="/ai-travel-planner" className={styles.link}>Lập kế hoạch AI</Link></li>
                            <li><Link href="/articles" className={styles.link}>Bài viết du lịch</Link></li>
                            <li><Link href="/partner" className={styles.link}>Partner Dashboard</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className={styles.footerSection}>
                        <h3 className={styles.sectionTitle}>Hỗ trợ &amp; Pháp lý</h3>
                        <ul className={styles.linkList}>
                            <li><Link href="/support" className={styles.link}>Liên hệ hỗ trợ</Link></li>
                            <li><Link href="/faq" className={styles.link}>Câu hỏi thường gặp</Link></li>
                            <li><Link href="/terms" className={styles.link}>Điều khoản sử dụng</Link></li>
                            <li><Link href="/privacy" className={styles.link}>Chính sách bảo mật</Link></li>
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
                                <span style={{ fontWeight: 'bold', marginRight: '4px', color: '#0f7fb6' }}>Zalo:</span>
                                <a href={CONTACT_INFO.ZALO} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {CONTACT_INFO.PHONE}
                                </a>
                            </li>
                            <li className={styles.contactItem}>
                                <FaEnvelope className={styles.contactIcon} />
                                <span>{CONTACT_INFO.EMAIL}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Newsletter has been moved to its own module above Footer */}

                {/* Bottom Bar */}
                <div className={styles.bottomBar}>
                    <p className={styles.copyright}>
                        © {currentYear} Tourista Studio. All rights reserved.
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

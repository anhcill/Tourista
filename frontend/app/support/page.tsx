'use client';

import Head from 'next/head';
import Link from 'next/link';
import { FaPhone, FaEnvelope, FaClock, FaMapMarkerAlt, FaComments, FaHeadset, FaPaperPlane } from 'react-icons/fa';
import styles from './page.module.css';

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Liên hệ & Hỗ trợ | Tourista</title>
      </Head>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <FaHeadset className={styles.heroIcon} />
          <h1>Trung tâm Hỗ trợ Khách hàng</h1>
          <p>Đội ngũ Tourista luôn sẵn sàng hỗ trợ bạn 24/7</p>
        </div>
      </section>

      <div className={styles.container}>
        {/* Quick contact cards */}
        <div className={styles.quickGrid}>
          <div className={styles.quickCard}>
            <div className={styles.quickIcon} style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FaPhone />
            </div>
            <h3>Hotline</h3>
            <a href="tel:0815913408" className={styles.quickValue}>0815 913 408</a>
            <span className={styles.quickNote}>Gọi trực tiếp 24/7</span>
          </div>

          <div className={styles.quickCard}>
            <div className={styles.quickIcon} style={{ background: '#f0fdf4', color: '#16a34a' }}>
              <FaEnvelope />
            </div>
            <h3>Email</h3>
            <a href="mailto:ducanhle28072003@gmail.com" className={styles.quickValue}>ducanhle28072003@gmail.com</a>
            <span className={styles.quickNote}>Phản hồi trong 24 giờ</span>
          </div>

          <div className={styles.quickCard}>
            <div className={styles.quickIcon} style={{ background: '#fff7ed', color: '#ea580c' }}>
              <FaComments />
            </div>
            <h3>Live Chat</h3>
            <button className={styles.quickValue} onClick={() => {
              const chatBtn = document.getElementById('tourista-chat-btn');
              chatBtn?.click();
            }}>Bắt đầu chat</button>
            <span className={styles.quickNote}>Từ 8:00 - 22:00 hàng ngày</span>
          </div>

          <div className={styles.quickCard}>
            <div className={styles.quickIcon} style={{ background: '#fdf4ff', color: '#9333ea' }}>
              <FaMapMarkerAlt />
            </div>
            <h3>Văn phòng</h3>
            <span className={styles.quickValue}>Hà Nội, Việt Nam</span>
            <span className={styles.quickNote}>Thứ 2 - Thứ 6, 8:00 - 17:30</span>
          </div>
        </div>

        {/* Contact form */}
        <div className={styles.formSection}>
          <h2>Gửi yêu cầu hỗ trợ</h2>
          <p className={styles.formSubtitle}>Điền thông tin bên dưới, chúng tôi sẽ liên hệ lại trong thời gian sớm nhất</p>

          <form className={styles.form} onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const data = new FormData(form);
            const name = data.get('name') as string;
            const email = data.get('email') as string;
            const subject = data.get('subject') as string;
            const message = data.get('message') as string;

            const mailto = `mailto:ducanhle28072003@gmail.com?subject=${encodeURIComponent('[Tourista Support] ' + subject)}&body=${encodeURIComponent(`Họ tên: ${name}\nEmail: ${email}\n\nNội dung:\n${message}`)}`;
            window.location.href = mailto;
          }}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Họ và tên *</label>
                <input type="text" id="name" name="name" placeholder="Nhập họ và tên của bạn" required />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email *</label>
                <input type="email" id="email" name="email" placeholder="Nhập địa chỉ email" required />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="subject">Chủ đề *</label>
              <select id="subject" name="subject" required defaultValue="">
                <option value="" disabled>-- Chọn chủ đề --</option>
                <option value="Hỗ trợ đặt phòng khách sạn">Hỗ trợ đặt phòng khách sạn</option>
                <option value="Hỗ trợ đặt tour du lịch">Hỗ trợ đặt tour du lịch</option>
                <option value="Khiếu nại dịch vụ">Khiếu nại dịch vụ</option>
                <option value="Hợp tác kinh doanh">Hợp tác kinh doanh (Partner)</option>
                <option value="Báo lỗi hệ thống">Báo lỗi hệ thống</option>
                <option value="Góp ý / Đề xuất">Góp ý / Đề xuất</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="message">Nội dung *</label>
              <textarea id="message" name="message" rows={6} placeholder="Mô tả chi tiết vấn đề của bạn..." required />
            </div>

            <button type="submit" className={styles.submitBtn}>
              <FaPaperPlane />
              Gửi yêu cầu hỗ trợ
            </button>
          </form>
        </div>

        {/* FAQ preview */}
        <div className={styles.faqPreview}>
          <h2>Câu hỏi thường gặp</h2>
          <div className={styles.faqList}>
            {[
              { q: 'Làm sao để đặt phòng khách sạn?', a: 'Chọn khách sạn, chọn ngày nhận/trả phòng, điền thông tin và thanh toán. Bạn sẽ nhận email xác nhận ngay lập tức.' },
              { q: 'Tôi có thể hủy phòng không?', a: 'Có, tùy thuộc vào chính sách hủy của từng khách sạn. Thông thường hủy miễn phí trước 24-48 giờ so với ngày nhận phòng.' },
              { q: 'Phương thức thanh toán nào được chấp nhận?', a: 'Chúng tôi chấp nhận thanh toán qua VNPay (ATM/Visa/Mastercard), ví điện tử và chuyển khoản ngân hàng.' },
              { q: 'Làm sao để trở thành đối tác của Tourista?', a: 'Đăng nhập, vào mục "Partner Dashboard" để đăng ký quản lý khách sạn hoặc tour du lịch của bạn.' },
              { q: 'Mã khuyến mãi có thể sử dụng bao nhiêu lần?', a: 'Mỗi mã khuyến mãi có giới hạn sử dụng khác nhau. Vui lòng xem chi tiết tại thông báo của từng chương trình.' },
            ].map((faq, i) => (
              <details key={i} className={styles.faqItem}>
                <summary>{faq.q}</summary>
                <p>{faq.a}</p>
              </details>
            ))}
          </div>
          <Link href="/faq" className={styles.viewAllFaq}>
            Xem tất cả câu hỏi thường gặp →
          </Link>
        </div>

        {/* Working hours */}
        <div className={styles.workingHours}>
          <FaClock className={styles.workingIcon} />
          <div>
            <h3>Giờ làm việc</h3>
            <p>Hotline & Chat: <strong>24/7</strong> — Luôn có nhân viên trực hỗ trợ</p>
            <p>Văn phòng: <strong>Thứ 2 - Thứ 6</strong>, 8:00 - 17:30 (GMT+7)</p>
            <p>Email: Phản hồi trong <strong>24 giờ</strong> làm việc</p>
          </div>
        </div>
      </div>
    </>
  );
}

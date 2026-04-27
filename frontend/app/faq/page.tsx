'use client';

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FaQuestionCircle, FaHotel, FaSuitcaseRolling, FaCreditCard, FaUserShield, FaComments, FaExchangeAlt } from 'react-icons/fa';
import styles from './page.module.css';

const FAQ_CATEGORIES = [
  {
    id: 'booking',
    icon: <FaHotel />,
    label: 'Đặt phòng & Tour',
    items: [
      {
        q: 'Làm sao để đặt phòng khách sạn trên Tourista?',
        a: 'Bạn chọn khách sạn mong muốn → chọn ngày nhận/trả phòng và số lượng khách → điền thông tin liên hệ → chọn phương thức thanh toán → xác nhận. Bạn sẽ nhận email và SMS xác nhận ngay lập tức sau khi thanh toán thành công.',
      },
      {
        q: 'Tôi có thể đặt tour du lịch không?',
        a: 'Có. Tourista cung cấp hàng nghìn tour du lịch trong nước và quốc tế. Bạn chọn tour, ngày khởi hành, số lượng khách, điền thông tin và thanh toán để hoàn tất đặt tour.',
      },
      {
        q: 'Làm sao biết phòng còn trống hay không?',
        a: 'Hệ thống của Tourista cập nhật tình trạng phòng theo thời gian thực. Khi bạn chọn ngày, các phòng không còn trống sẽ tự động bị ẩn. Nếu ngày bạn chọn hết phòng, hệ thống sẽ thông báo ngay.',
      },
      {
        q: 'Tôi có thể đặt nhiều phòng cùng lúc không?',
        a: 'Có. Bạn có thể đặt nhiều phòng tại các khách sạn khác nhau trong cùng một đơn hàng. Mỗi đặt phòng sẽ được xử lý riêng biệt.',
      },
      {
        q: 'Xác nhận đặt phòng được gửi qua kênh nào?',
        a: 'Sau khi thanh toán thành công, bạn sẽ nhận được email xác nhận kèm mã đặt phòng (booking code). Bạn chỉ cần đến khách sạn và đưa mã này hoặc đọc số điện thoại đăng ký là được nhận phòng.',
      },
    ],
  },
  {
    id: 'payment',
    icon: <FaCreditCard />,
    label: 'Thanh toán',
    items: [
      {
        q: 'Tourista hỗ trợ những phương thức thanh toán nào?',
        a: 'Chúng tôi chấp nhận: Thẻ ATM nội địa (qua VNPay), Thẻ Visa/Mastercard, Ví điện tử (VNPay, ZaloPay, MoMo), Chuyển khoản ngân hàng. Tất cả thanh toán đều được bảo mật qua cổng thanh toán VNPay.',
      },
      {
        q: 'Thanh toán qua Tourista có an toàn không?',
        a: 'Hoàn toàn an toàn. Chúng tôi sử dụng cổng thanh toán VNPay được cấp phép bởi Ngân hàng Nhà nước Việt Nam. Thông tin thẻ của bạn được mã hóa và không lưu trữ trên hệ thống Tourista.',
      },
      {
        q: 'Tôi có thể thanh toán bằng ngoại tệ không?',
        a: 'Hiện tại Tourista chỉ hỗ trợ thanh toán bằng VND (Đồng Việt Nam). Nếu bạn dùng thẻ quốc tế, tỷ giá sẽ được quy đổi tự động theo tỷ giá của ngân hàng phát hành thẻ.',
      },
      {
        q: 'Mã khuyến mãi được sử dụng như thế nào?',
        a: 'Tại trang thanh toán, bạn nhập mã khuyến mãi vào ô "Mã giảm giá" và nhấn "Áp dụng". Nếu mã hợp lệ, số tiền giảm sẽ được trừ ngay vào tổng thanh toán. Mỗi mã có giới hạn sử dụng và thời hạn khác nhau.',
      },
      {
        q: 'Tôi đã thanh toán nhưng đơn hàng bị lỗi, phải làm sao?',
        a: 'Đừng lo lắng. Trong trường hợp này, hệ thống sẽ tự động hoàn tiền trong vòng 5-10 phút đối với thanh toán online. Nếu sau 30 phút bạn chưa nhận được tiền hoàn, vui lòng gọi hotline 0815 913 408 để được hỗ trợ.',
      },
    ],
  },
  {
    id: 'cancel',
    icon: <FaExchangeAlt />,
    label: 'Hủy & Thay đổi',
    items: [
      {
        q: 'Làm sao để hủy đặt phòng?',
        a: 'Bạn đăng nhập → vào "Đơn đặt của tôi" → chọn đơn cần hủy → nhấn "Hủy đặt phòng" và xác nhận. Lưu ý: phí hủy (nếu có) phụ thuộc vào chính sách của từng khách sạn và thời điểm hủy.',
      },
      {
        q: 'Chính sách hủy phòng như thế nào?',
        a: 'Mỗi khách sạn có chính sách riêng. Thông thường: Hủy trước 48 giờ: Miễn phí hoàn tiền 100%. Hủy trong 24-48 giờ: Có thể mất phí 1 đêm. Hủy trong 24 giờ hoặc không đến: Có thể mất toàn bộ tiền đặt cọc. Chi tiết chính sách được hiển thị rõ ràng tại trang khách sạn.',
      },
      {
        q: 'Tôi muốn thay đổi ngày nhận phòng, làm thế nào?',
        a: 'Bạn có thể thay đổi ngày nhận phòng trong phần "Quản lý đặt phòng" trước ngày nhận phòng. Nếu cần thay đổi sang khách sạn khác, vui lòng hủy đơn cũ và đặt lại. Mọi thay đổi vui lòng liên hệ hotline 0815 913 408.',
      },
      {
        q: 'Thời gian hoàn tiền sau khi hủy là bao lâu?',
        a: 'Với thanh toán online (VNPay, Visa), hoàn tiền thường trong 5-15 phút. Với chuyển khoản ngân hàng, hoàn tiền trong 3-5 ngày làm việc tùy ngân hàng.',
      },
    ],
  },
  {
    id: 'partner',
    icon: <FaSuitcaseRolling />,
    label: 'Partner & Đối tác',
    items: [
      {
        q: 'Làm sao để trở thành đối tác của Tourista?',
        a: 'Đăng ký tài khoản trên Tourista → Đăng nhập → Truy cập "Partner Dashboard" → Đăng ký quản lý khách sạn hoặc tour du lịch của bạn. Đội ngũ Tourista sẽ xét duyệt trong 24-48 giờ.',
      },
      {
        q: 'Tôi là chủ khách sạn, Tourista thu phí bao nhiêu?',
        a: 'Tourista hỗ trợ đối tác hoàn toàn miễn phí đăng ký và quản lý. Phí hoa hồng chỉ được tính khi có giao dịch thành công thực sự, với mức phí cạnh tranh trên thị trường.',
      },
      {
        q: 'Làm sao quản lý đặt phòng từ khách?',
        a: 'Sau khi đăng ký Partner, bạn vào "Partner Dashboard" để xem và quản lý tất cả đặt phòng, xác nhận hoặc hủy đơn, xem thống kê doanh thu theo ngày/tháng.',
      },
      {
        q: 'Khách sạn của tôi có được hiển thị rộng rãi không?',
        a: 'Có. Khách sạn của đối tác sẽ hiển thị trên trang tìm kiếm của Tourista với đầy đủ hình ảnh, đánh giá và thông tin. Đối tác có thể chủ động cập nhật giá, phòng trống và ưu đãi đặc biệt.',
      },
    ],
  },
  {
    id: 'account',
    icon: <FaUserShield />,
    label: 'Tài khoản & Bảo mật',
    items: [
      {
        q: 'Tôi quên mật khẩu, làm sao lấy lại?',
        a: 'Tại trang đăng nhập, nhấn "Quên mật khẩu" → nhập email đã đăng ký → kiểm tra hộp thư (kể cả spam) để lấy liên kết đặt lại mật khẩu. Liên kết có hiệu lực trong 1 giờ.',
      },
      {
        q: 'Làm sao thay đổi thông tin tài khoản?',
        a: 'Đăng nhập → vào "Hồ sơ của tôi" → cập nhật thông tin cá nhân, email, số điện thoại. Lưu ý: email là tên đăng nhập, nếu thay đổi email bạn cần xác minh email mới.',
      },
      {
        q: 'Tài khoản của tôi có bị khóa không?',
        a: 'Tài khoản có thể bị tạm khóa nếu: đăng nhập sai mật khẩu nhiều lần (tự động mở khóa sau 30 phút), vi phạm điều khoản sử dụng, hoặc bị báo cáo lạm dụng. Liên hệ hotline để được hỗ trợ mở khóa.',
      },
      {
        q: 'Tourista có bảo mật thông tin cá nhân của tôi không?',
        a: 'Có. Thông tin cá nhân của bạn được bảo vệ theo Chính sách bảo mật của Tourista. Chúng tôi cam kết không chia sẻ thông tin cho bên thứ ba khi chưa có sự đồng ý của bạn, trừ khi được yêu cầu bởi cơ quan có thẩm quyền.',
      },
    ],
  },
  {
    id: 'service',
    icon: <FaComments />,
    label: 'Dịch vụ & Hỗ trợ',
    items: [
      {
        q: 'Tôi cần hỗ trợ gấp, liên hệ bằng cách nào?',
        a: 'Gọi hotline 0815 913 408 (24/7) để được hỗ trợ ngay. Bạn cũng có thể chat trực tiếp với đội ngũ hỗ trợ trên website từ 8:00 - 22:00 hàng ngày.',
      },
      {
        q: 'Khách sạn không như hình ảnh, tôi phải làm gì?',
        a: 'Bạn liên hệ ngay hotline 0815 913 408 hoặc gửi email đến ducanhle28072003@gmail.com kèm hình ảnh thực tế. Chúng tôi sẽ liên hệ với khách sạn để xác minh và hỗ trợ bạn đổi phòng hoặc hoàn tiền nếu cần.',
      },
      {
        q: 'Tôi có thể gửi khiếu nại về dịch vụ không?',
        a: 'Có. Mọi khiếu nại đều được tiếp nhận qua hotline, email hoặc trang Hỗ trợ khách hàng. Đội ngũ Tourista cam kết phản hồi trong vòng 24 giờ và giải quyết thỏa đáng.',
      },
      {
        q: 'Tourista có ứng dụng di động không?',
        a: 'Hiện tại Tourista tối ưu trên cả máy tính và điện thoại qua trình duyệt web. Giao diện tự động thích ứng với màn hình nhỏ để bạn đặt phòng và tour dễ dàng mọi lúc mọi nơi.',
      },
    ],
  },
];

export default function FaqPage() {
  const [activeCategory, setActiveCategory] = useState('booking');
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const active = FAQ_CATEGORIES.find((c) => c.id === activeCategory) || FAQ_CATEGORIES[0];

  return (
    <>
      <Head>
        <title>Câu hỏi thường gặp (FAQ) | Tourista</title>
        <meta name="description" content="Tìm câu trả lời nhanh cho các câu hỏi thường gặp về đặt phòng, thanh toán, hủy phòng và dịch vụ trên Tourista." />
      </Head>

      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <FaQuestionCircle className={styles.heroIcon} />
          <h1>Câu hỏi thường gặp</h1>
          <p>Tìm câu trả lời nhanh cho mọi thắc mắc của bạn về dịch vụ Tourista</p>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.layout}>
          {/* Sidebar categories */}
          <aside className={styles.sidebar}>
            <h3>Danh mục</h3>
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.catBtn} ${activeCategory === cat.id ? styles.catBtnActive : ''}`}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setOpenItems(new Set());
                }}
              >
                <span className={styles.catIcon}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}

            <div className={styles.sidebarContact}>
              <p>Bạn không tìm thấy câu trả lời?</p>
              <Link href="/support" className={styles.sidebarContactBtn}>Liên hệ hỗ trợ</Link>
            </div>
          </aside>

          {/* FAQ content */}
          <main className={styles.content}>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryIcon}>{active.icon}</span>
              <h2>{active.label}</h2>
              <span className={styles.countBadge}>{active.items.length} câu hỏi</span>
            </div>

            <div className={styles.faqList}>
              {active.items.map((item, i) => {
                const itemId = `${active.id}-${i}`;
                const isOpen = openItems.has(itemId);
                return (
                  <div key={i} className={`${styles.faqItem} ${isOpen ? styles.faqItemOpen : ''}`}>
                    <button
                      className={styles.faqQuestion}
                      onClick={() => toggleItem(itemId)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className={styles.faqToggle}>{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className={styles.faqAnswer}>
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <div className={styles.cta}>
              <p>Bạn vẫn cần hỗ trợ thêm?</p>
              <div className={styles.ctaActions}>
                <Link href="/support" className={styles.ctaPrimary}>Liên hệ hỗ trợ</Link>
                <a href="tel:0815913408" className={styles.ctaSecondary}>Gọi 0815 913 408</a>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

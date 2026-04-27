'use client';

import Head from 'next/head';
import Link from 'next/link';
import styles from '../terms/page.module.css';

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Chính sách bảo mật | Tourista</title>
        <meta name="description" content="Chính sách bảo mật thông tin cá nhân của Tourista. Cam kết bảo vệ dữ liệu của bạn." />
      </Head>

      <section className={styles.hero} style={{ backgroundImage: "url('https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=1600&q=80')" }}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1>Chính sách bảo mật</h1>
          <p>Cập nhật lần cuối: 27 tháng 4 năm 2026</p>
        </div>
      </section>

      <div className={styles.container}>
        <aside className={styles.toc}>
          <h3>Mục lục</h3>
          <nav>
            <a href="#p1">1. Thu thập thông tin</a>
            <a href="#p2">2. Sử dụng thông tin</a>
            <a href="#p3">3. Chia sẻ thông tin</a>
            <a href="#p4">4. Bảo mật dữ liệu</a>
            <a href="#p5">5. Cookies &amp; Công nghệ</a>
            <a href="#p6">6. Quyền của người dùng</a>
            <a href="#p7">7. Dữ liệu của trẻ em</a>
            <a href="#p8">8. Liên kết bên thứ ba</a>
            <a href="#p9">9. Thay đổi chính sách</a>
            <a href="#p10">10. Liên hệ</a>
          </nav>
          <div className={styles.tocContact}>
            <p>Thắc mắc về bảo mật?</p>
            <Link href="/support">Liên hệ hỗ trợ</Link>
          </div>
        </aside>

        <main className={styles.content}>
          <section id="p1" className={styles.section}>
            <h2>1. Thu thập thông tin cá nhân</h2>
            <p>
              Tourista thu thập thông tin cá nhân mà bạn chủ động cung cấp khi sử dụng dịch vụ, bao gồm nhưng không giới hạn ở:
            </p>
            <ul>
              <li><strong>Thông tin đăng ký:</strong> Họ và tên, địa chỉ email, số điện thoại, mật khẩu (được mã hóa)</li>
              <li><strong>Thông tin thanh toán:</strong> Thông tin thẻ thanh toán không được lưu trữ trên hệ thống Tourista — xử lý bởi VNPay</li>
              <li><strong>Thông tin đặt phòng/tour:</strong> Ngày nhận/trả phòng, số lượng khách, tên khách lưu trú, yêu cầu đặc biệt</li>
              <li><strong>Thông tin xác minh:</strong> Email xác minh, số điện thoại xác minh (OTP)</li>
              <li><strong>Dữ liệu đăng nhập:</strong> Địa chỉ IP, loại trình duyệt, hệ điều hành, thời gian đăng nhập</li>
              <li><strong>Dữ liệu đối tác:</strong> Đối với đối tác (Partner): thông tin doanh nghiệp, giấy phép kinh doanh, thông tin tài khoản ngân hàng</li>
            </ul>
            <p>
              Chúng tôi cũng thu thập dữ liệu tự động thông qua cookies và công nghệ theo dõi khi bạn truy cập nền tảng Tourista.
            </p>
          </section>

          <section id="p2" className={styles.section}>
            <h2>2. Mục đích sử dụng thông tin</h2>
            <p>Thông tin cá nhân của bạn được sử dụng cho các mục đích sau:</p>
            <ul>
              <li>Xử lý và quản lý đặt phòng, đặt tour du lịch</li>
              <li>Xác minh tài khoản và bảo mật đăng nhập</li>
              <li>Gửi email/SMS xác nhận đặt phòng, nhắc lịch, thông báo thay đổi</li>
              <li>Hỗ trợ khách hàng và giải quyết khiếu nại</li>
              <li>Cải thiện chất lượng dịch vụ và trải nghiệm người dùng</li>
              <li>Gửi thông tin khuyến mãi, ưu đãi (chỉ khi bạn đồng ý nhận marketing)</li>
              <li>Tuân thủ nghĩa vụ pháp lý và quy định của pháp luật Việt Nam</li>
              <li>Phát hiện và ngăn chặn gian lận, lạm dụng</li>
            </ul>
          </section>

          <section id="p3" className={styles.section}>
            <h2>3. Chia sẻ thông tin với bên thứ ba</h2>
            <p>Tourista cam kết không bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp sau:</p>
            <ul>
              <li>
                <strong>Với nhà cung cấp dịch vụ (khách sạn/tour):</strong> Thông tin đặt phòng cần thiết (tên, số điện thoại, email, ngày nhận/trả phòng) được chia sẻ để họ chuẩn bị dịch vụ cho bạn.
              </li>
              <li>
                <strong>Với cổng thanh toán VNPay:</strong> Thông tin thanh toán được chuyển trực tiếp qua cổng VNPay. Tourista không lưu trữ số thẻ, CVV hay mật khẩu thanh toán.
              </li>
              <li>
                <strong>Với nhà cung cấp dịch vụ bên thứ ba:</strong> Google (đăng nhập OAuth2), dịch vụ email (gửi email xác nhận), dịch vụ lưu trữ đám mây (Cloudinary — lưu trữ hình ảnh).
              </li>
              <li>
                <strong>Theo yêu cầu pháp lý:</strong> Chia sẻ khi được cơ quan có thẩm quyền yêu cầu bằng văn bản theo quy định của pháp luật.
              </li>
            </ul>
          </section>

          <section id="p4" className={styles.section}>
            <h2>4. Bảo mật dữ liệu</h2>
            <p>Tourista áp dụng các biện pháp bảo mật kỹ thuật và tổ chức phù hợp để bảo vệ dữ liệu của bạn:</p>
            <ul>
              <li><strong>Mã hóa dữ liệu:</strong> Sử dụng HTTPS/SSL cho mọi kết nối giữa trình duyệt và máy chủ</li>
              <li><strong>Mã hóa mật khẩu:</strong> Mật khẩu được lưu dưới dạng băm (hash) — không thể đọc được dù bị rò rỉ database</li>
              <li><strong>JWT Token:</strong> Xác thực người dùng bằng JWT có thời hạn, không lưu mật khẩu phía client</li>
              <li><strong>Kiểm soát truy cập:</strong> Phân quyền rõ ràng trên backend, chỉ người dùng được ủy quyền mới truy cập dữ liệu tương ứng</li>
              <li><strong>Backup dữ liệu:</strong> Sao lưu định kỳ theo chính sách của nhà cung cấp hạ tầng (Railway)</li>
            </ul>
            <p>
              Không một hệ thống nào đạt mức bảo mật tuyệt đối 100%. Tourista cam kết thông báo cho bạn trong vòng 72 giờ nếu phát hiện bất kỳ sự cố bảo mật nào ảnh hưởng đến dữ liệu cá nhân của bạn.
            </p>
          </section>

          <section id="p5" className={styles.section}>
            <h2>5. Cookies và công nghệ theo dõi</h2>
            <p>
              Tourista sử dụng cookies và công nghệ tương tự để cải thiện trải nghiệm người dùng:
            </p>
            <ul>
              <li><strong>Cookies cần thiết:</strong> Xác thực đăng nhập, giỏ hàng, lưu trữ tùy chọn người dùng — không thể tắt được</li>
              <li><strong>Cookies phân tích:</strong> Google Analytics để hiểu cách người dùng sử dụng nền tảng (ẩn danh, không thu thập thông tin cá nhân)</li>
              <li><strong>Cookies marketing:</strong> Theo dõi hiệu quả quảng cáo và cá nhân hóa nội dung (chỉ khi bạn đồng ý)</li>
            </ul>
            <p>
              Bạn có thể tắt cookies trong cài đặt trình duyệt. Lưu ý: tắt cookies có thể ảnh hưởng đến một số chức năng của nền tảng.
            </p>
          </section>

          <section id="p6" className={styles.section}>
            <h2>6. Quyền của người dùng</h2>
            <p>Bạn có các quyền sau đối với dữ liệu cá nhân của mình:</p>
            <ul>
              <li><strong>Truy cập:</strong> Yêu cầu xem toàn bộ dữ liệu cá nhân mà Tourista lưu trữ về bạn</li>
              <li><strong>Chỉnh sửa:</strong> Cập nhật, sửa đổi thông tin cá nhân bất kỳ lúc nào trong phần "Hồ sơ của tôi"</li>
              <li><strong>Xóa:</strong> Yêu cầu xóa tài khoản và toàn bộ dữ liệu cá nhân liên quan. Lưu ý: một số dữ liệu có thể được giữ lại theo yêu cầu pháp lý</li>
              <li><strong>Hạn chế xử lý:</strong> Yêu cầu hạn chế việc sử dụng dữ liệu trong một số trường hợp</li>
              <li><strong>Phản đối:</strong> Phản đối việc sử dụng dữ liệu cho mục đích marketing trực tiếp</li>
              <li><strong>Di chuyển dữ liệu:</strong> Yêu cầu xuất dữ liệu của bạn dưới dạng phổ biến (JSON/CSV)</li>
              <li><strong>Khiếu nại:</strong> Nếu bạn cho rằng quyền lợi bị xâm phạm, có quyền khiếu nại đến Cục An ninh mạng và Phòng chống tội phạm công nghệ cao, Bộ Công an Việt Nam</li>
            </ul>
            <p>
              Để thực hiện các quyền trên, vui lòng liên hệ <a href="mailto:ducanhle28072003@gmail.com" style={{ color: '#2563eb', fontWeight: 600 }}>ducanhle28072003@gmail.com</a> hoặc gọi hotline <a href="tel:0815913408" style={{ color: '#2563eb', fontWeight: 600 }}>0815 913 408</a>.
            </p>
          </section>

          <section id="p7" className={styles.section}>
            <h2>7. Dữ liệu của trẻ em</h2>
            <p>
              Tourista không cố ý thu thập thông tin cá nhân của trẻ em dưới 16 tuổi mà không có sự đồng ý của cha mẹ hoặc người giám hộ hợp pháp. Nếu phát hiện dữ liệu của trẻ em được thu thập mà không có sự cho phép, chúng tôi sẽ xóa ngay lập tức.
            </p>
            <p>
              Phụ huynh hoặc người giám hộ muốn yêu cầu xóa dữ liệu của trẻ em có thể liên hệ qua email hoặc hotline.
            </p>
          </section>

          <section id="p8" className={styles.section}>
            <h2>8. Liên kết bên thứ ba</h2>
            <p>
              Nền tảng Tourista có thể chứa liên kết đến website của bên thứ ba (khách sạn, công ty lữ hành, mạng xã hội). Chính sách bảo mật này chỉ áp dụng cho nền tảng Tourista. Chúng tôi không chịu trách nhiệm về cách thức thu thập hoặc sử dụng dữ liệu của các trang web bên thứ ba. Bạn nên đọc chính sách bảo mật của từng trang web trước khi cung cấp thông tin cá nhân.
            </p>
          </section>

          <section id="p9" className={styles.section}>
            <h2>9. Thay đổi chính sách bảo mật</h2>
            <p>
              Tourista có thể cập nhật Chính sách bảo mật này theo thời gian. Khi có thay đổi quan trọng ảnh hưởng đến quyền lợi của bạn, chúng tôi sẽ:
            </p>
            <ul>
              <li>Thông báo qua email đăng ký ít nhất 7 ngày trước khi có hiệu lực</li>
              <li>Hiển thị thông báo nổi bật trên nền tảng</li>
              <li>Cập nhật ngày "Cập nhật lần cuối" ở đầu trang này</li>
            </ul>
          </section>

          <section id="p10" className={styles.section}>
            <h2>10. Liên hệ về bảo mật</h2>
            <p>Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào liên quan đến Chính sách bảo mật này, vui lòng liên hệ:</p>
            <div className={styles.section}>
              <div className={styles.contactBox}>
                <p><strong>Tourista — Bộ phận Bảo mật dữ liệu</strong></p>
                <p>Hotline: <a href="tel:0815913408">0815 913 408</a> (24/7)</p>
                <p>Email: <a href="mailto:ducanhle28072003@gmail.com">ducanhle28072003@gmail.com</a></p>
                <p>Địa chỉ: Hà Nội, Việt Nam</p>
              </div>
            </div>
            <p>
              Chúng tôi cam kết phản hồi mọi yêu cầu liên quan đến bảo mật trong vòng <strong>72 giờ</strong>.
            </p>
          </section>
        </main>
      </div>
    </>
  );
}

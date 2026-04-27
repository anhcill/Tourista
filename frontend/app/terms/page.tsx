'use client';

import Head from 'next/head';
import Link from 'next/link';
import styles from './page.module.css';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Điều khoản sử dụng | Tourista</title>
        <meta name="description" content="Điều khoản và điều kiện sử dụng dịch vụ của Tourista. Vui lòng đọc kỹ trước khi sử dụng." />
      </Head>

      <section className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h1>Điều khoản sử dụng</h1>
          <p>Cập nhật lần cuối: 27 tháng 4 năm 2026</p>
        </div>
      </section>

      <div className={styles.container}>
        <aside className={styles.toc}>
          <h3>Mục lục</h3>
          <nav>
            <a href="#chap1">1. Chấp nhận điều khoản</a>
            <a href="#chap2">2. Dịch vụ của Tourista</a>
            <a href="#chap3">3. Tài khoản người dùng</a>
            <a href="#chap4">4. Đặt phòng & Thanh toán</a>
            <a href="#chap5">5. Chính sách hủy</a>
            <a href="#chap6">6. Quyền của đối tác (Partner)</a>
            <a href="#chap7">7. Quyền sở hữu trí tuệ</a>
            <a href="#chap8">8. Giới hạn trách nhiệm</a>
            <a href="#chap9">9. Bồi thường</a>
            <a href="#chap10">10. Sửa đổi điều khoản</a>
            <a href="#chap11">11. Luật áp dụng</a>
            <a href="#chap12">12. Liên hệ</a>
          </nav>
          <div className={styles.tocContact}>
            <p>Thắc mắc về điều khoản?</p>
            <Link href="/support">Liên hệ hỗ trợ</Link>
          </div>
        </aside>

        <main className={styles.content}>
          <section id="chap1" className={styles.section}>
            <h2>1. Chấp nhận điều khoản</h2>
            <p>
              Bằng việc truy cập, đăng ký và sử dụng nền tảng Tourista (bao gồm website, ứng dụng di động và các dịch vụ liên quan), bạn xác nhận rằng đã đọc, hiểu và đồng ý bị ràng buộc bởi các Điều khoản sử dụng này ("Điều khoản"). Nếu bạn không đồng ý với bất kỳ phần nào của Điều khoản, vui lòng không sử dụng dịch vụ của Tourista.
            </p>
            <p>
              Đối với người dưới 18 tuổi, bạn cần có sự cho phép của cha mẹ hoặc người giám hộ hợp pháp để sử dụng dịch vụ.
            </p>
          </section>

          <section id="chap2" className={styles.section}>
            <h2>2. Dịch vụ của Tourista</h2>
            <p>
              Tourista là nền tảng trực tuyến kết nối người dùng với các nhà cung cấp dịch vụ lưu trú (khách sạn, homestay, villa) và dịch vụ du lịch (tour du lịch). Tourista đóng vai trò trung gian — không phải là nhà cung cấp trực tiếp các dịch vụ này.
            </p>
            <p> Các dịch vụ chính bao gồm:</p>
            <ul>
              <li>Tìm kiếm, so sánh và đặt phòng khách sạn, homestay, villa</li>
              <li>Tìm kiếm và đặt tour du lịch trong nước và quốc tế</li>
              <li>Thanh toán trực tuyến qua cổng VNPay</li>
              <li>Quản lý đặt phòng, đặt tour cho người dùng</li>
              <li>Nền tảng quản lý cho đối tác (Partner Dashboard)</li>
              <li>Hỗ trợ khách hàng 24/7 qua hotline và chat</li>
            </ul>
            <p>
              Tourista bảo lưu quyền thay đổi, tạm ngưng hoặc ngừng cung cấp bất kỳ phần nào của dịch vụ mà không cần thông báo trước.
            </p>
          </section>

          <section id="chap3" className={styles.section}>
            <h2>3. Tài khoản người dùng</h2>
            <p>
              Khi đăng ký tài khoản trên Tourista, bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật. Bạn chịu trách nhiệm bảo mật thông tin đăng nhập (email, mật khẩu) và mọi hoạt động xảy ra dưới tài khoản của mình.
            </p>
            <p>Bạn đồng ý không:</p>
            <ul>
              <li>Cho phép người khác sử dụng tài khoản của bạn</li>
              <li>Tạo nhiều tài khoản để lạm dụng chương trình khuyến mãi</li>
              <li>Sử dụng tài khoản để thực hiện hành vi bất hợp pháp hoặc vi phạm pháp luật</li>
              <li>Can thiệp, tấn công hoặc xâm nhập trái phép vào hệ thống Tourista</li>
            </ul>
            <p>
              Tourista có quyền tạm khóa hoặc xóa tài khoản vi phạm mà không cần bồi thường.
            </p>
          </section>

          <section id="chap4" className={styles.section}>
            <h2>4. Đặt phòng &amp; Thanh toán</h2>
            <p>
              Khi bạn hoàn tất đặt phòng hoặc đặt tour, một hợp đồng được hình thành trực tiếp giữa bạn và nhà cung cấp dịch vụ (khách sạn hoặc công ty lữ hành). Tourista chỉ đóng vai trò nền tảng trung gian.
            </p>
            <p>
              <strong>Cam kết giá:</strong> Giá hiển thị trên Tourista là giá cuối cùng bao gồm thuế và phí, trừ khi có ghi chú khác. Tourista cam kết không thu thêm phí ngoài giá được hiển thị tại thời điểm đặt.
            </p>
            <p>
              <strong>Thanh toán:</strong> Bạn thanh toán qua cổng VNPay được tích hợp trên nền tảng. Thông tin thanh toán được xử lý bởi VNPay — Tourista không lưu trữ thông tin thẻ của bạn.
            </p>
            <p>
              <strong>Xác nhận:</strong> Sau khi thanh toán thành công, bạn sẽ nhận email xác nhận kèm mã đặt phòng/mã booking. Vui lòng giữ mã này để nhận phòng hoặc làm thủ tục tại điểm đến.
            </p>
          </section>

          <section id="chap5" className={styles.section}>
            <h2>5. Chính sách hủy</h2>
            <p>
              Chính sách hủy áp dụng theo quy định của từng nhà cung cấp dịch vụ. Thông tin chi tiết về phí hủy được hiển thị rõ ràng tại trang sản phẩm trước khi bạn xác nhận đặt.
            </p>
            <p>Hướng dẫn chung:</p>
            <ul>
              <li><strong>Hủy miễn phí:</strong> Hủy trước thời gian cho phép (thường 24-48 giờ) để được hoàn tiền 100%</li>
              <li><strong>Phí hủy:</strong> Hủy sau thời gian cho phép sẽ chịu phí theo quy định của khách sạn/tour</li>
              <li><strong>Không đến (No-show):</strong> Không nhận phòng đúng ngày mà không báo trước sẽ không được hoàn tiền</li>
              <li><strong>Hoàn tiền:</strong> Thường trong 5-15 phút đối với thanh toán online; 3-5 ngày làm việc đối với chuyển khoản ngân hàng</li>
            </ul>
            <p>
              Mọi tranh chấp liên quan đến hủy đặt phòng được giải quyết theo quy định tại Mục 11.
            </p>
          </section>

          <section id="chap6" className={styles.section}>
            <h2>6. Quyền của đối tác (Partner)</h2>
            <p>
              Các đối tác (chủ khách sạn, công ty lữ hành) đăng ký qua Partner Dashboard chịu sự điều chỉnh bổ sung sau:
            </p>
            <ul>
              <li>Đối tác chịu trách nhiệm đăng tải thông tin chính xác, hình ảnh thật về dịch vụ của mình</li>
              <li>Đối tác cam kết tuân thủ pháp luật Việt Nam về kinh doanh lưu trú và lữ hành</li>
              <li>Đối tác không được phép đăng thông tin sai lệch, lừa đảo hoặc xâm phạm quyền sở hữu trí tuệ</li>
              <li>Tourista có quyền gỡ bỏ hoặc tạm ngưng hiển thị dịch vụ vi phạm mà không cần báo trước</li>
              <li>Phí hoa hồng (nếu có) được thông báo rõ ràng trong quá trình đăng ký</li>
            </ul>
          </section>

          <section id="chap7" className={styles.section}>
            <h2>7. Quyền sở hữu trí tuệ</h2>
            <p>
              Toàn bộ nội dung trên nền tảng Tourista (logo, thương hiệu, văn bản, hình ảnh, phần mềm, cơ sở dữ liệu) là tài sản của Tourista hoặc được cấp phép hợp lệ. Bạn không được sao chép, phân phối, tạo sản phẩm phái sinh hoặc sử dụng cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản của Tourista.
            </p>
            <p>
              Đối tác đăng tải hình ảnh và nội dung lên Tourista đảm bảo rằng mình có quyền hợp pháp để làm như vậy và không vi phạm quyền của bên thứ ba.
            </p>
          </section>

          <section id="chap8" className={styles.section}>
            <h2>8. Giới hạn trách nhiệm</h2>
            <p>
              Tourista là nền tảng trung gian. Tourista không kiểm soát và không chịu trách nhiệm pháp lý trực tiếp đối với:
            </p>
            <ul>
              <li>Chất lượng thực tế của dịch vụ do đối tác cung cấp</li>
              <li>Hành vi, sai sót hoặc thiếu sót của đối tác hoặc người dùng</li>
              <li>Thiệt hại phát sinh từ việc sử dụng dịch vụ của bên thứ ba được giới thiệu qua Tourista</li>
              <li>Sự cố kỹ thuật nằm ngoài tầm kiểm soát của Tourista (thiên tai, mất điện, lỗi nhà mạng)</li>
            </ul>
            <p>
              Trong mọi trường hợp, trách nhiệm của Tourista đối với bạn không vượt quá số tiền bạn đã thanh toán cho giao dịch gây tranh chấp.
            </p>
          </section>

          <section id="chap9" className={styles.section}>
            <h2>9. Bồi thường</h2>
            <p>
              Bạn đồng ý bồi thường, bảo vệ và giữ cho Tourista, công ty mẹ, chi nhánh, giám đốc, nhân viên và đối tác không bị tổn hại trước mọi khiếu nại, tố tụng, yêu cầu bồi thường, thiệt hại (bao gồm phí luật sư hợp lý) phát sinh từ:
            </p>
            <ul>
              <li>Việc bạn vi phạm Điều khoản này</li>
              <li>Việc bạn vi phạm quyền của bên thứ ba</li>
              <li>Việc bạn sử dụng dịch vụ Tourista vào mục đích bất hợp pháp</li>
            </ul>
          </section>

          <section id="chap10" className={styles.section}>
            <h2>10. Sửa đổi điều khoản</h2>
            <p>
              Tourista có quyền cập nhật, sửa đổi Điều khoản sử dụng này bất cứ lúc nào. Khi có thay đổi quan trọng, chúng tôi sẽ thông báo qua email đăng ký hoặc thông báo nổi bật trên website ít nhất 7 ngày trước khi có hiệu lực.
            </p>
            <p>
              Việc bạn tiếp tục sử dụng dịch vụ sau khi Điều khoản sửa đổi có hiệu lực đồng nghĩa với việc bạn chấp nhận các thay đổi đó.
            </p>
          </section>

          <section id="chap11" className={styles.section}>
            <h2>11. Luật áp dụng &amp; Giải quyết tranh chấp</h2>
            <p>
              Điều khoản này được điều chỉnh và giải thích theo pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
            </p>
            <p>
              Mọi tranh chấp phát sinh từ hoặc liên quan đến việc sử dụng dịch vụ Tourista sẽ được giải quyết theo thứ tự ưu tiên:
            </p>
            <ol>
              <li><strong>Thương lượng, hòa giải</strong> — Hai bên cố gắng giải quyết qua đàm phán trong vòng 30 ngày</li>
              <li><strong>Hòa giải viên</strong> — Nếu thương lượng thất bại, hai bên có thể yêu cầu hòa giải tại Trung tâm Hòa giải thương mại Việt Nam</li>
              <li><strong>Tòa án có thẩm quyền</strong> — Nếu hòa giải không thành công, tranh chấp sẽ được giải quyết tại Tòa án nhân dân có thẩm quyền tại Hà Nội, Việt Nam</li>
            </ol>
          </section>

          <section id="chap12" className={styles.section}>
            <h2>12. Liên hệ</h2>
            <p>Nếu bạn có câu hỏi hoặc thắc mắc về Điều khoản sử dụng này, vui lòng liên hệ:</p>
            <div className={styles.contactBox}>
              <p><strong>Tourista</strong></p>
              <p>Hotline: <a href="tel:0815913408">0815 913 408</a> (24/7)</p>
              <p>Email: <a href="mailto:ducanhle28072003@gmail.com">ducanhle28072003@gmail.com</a></p>
              <p>Địa chỉ: Hà Nội, Việt Nam</p>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

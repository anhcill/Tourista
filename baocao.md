# LỜI MỞ ĐẦU

## 1. Tính cấp thiết của đề tài
Bước vào kỷ nguyên số hóa với sự bùng nổ của mạng Internet, việc chuyển đổi số và ứng dụng công nghệ thông tin vào quy trình vận hành đang dần trở thành tiêu chuẩn bắt buộc đối với mọi ngành nghề. Đặc biệt trong nhóm ngành dịch vụ lưu trú và khách sạn, thói quen của người tiêu dùng đã có sự dịch chuyển mạnh mẽ từ các phương thức truyền thống sang các nền tảng trực tuyến. Thực tế cho thấy, một hệ thống website đặt phòng ra đời không chỉ tối ưu hóa trải nghiệm của du khách bằng sự tiện lợi, nhanh chóng, mà còn đóng vai trò như một bộ máy đắc lực giúp các doanh nghiệp nâng cao năng lực quản trị, vận hành và cạnh tranh hiệu quả trên thị trường.

Xuất phát từ những đánh giá về tình hình thực tiễn đó, cùng với niềm đam mê công nghệ và mong muốn vận dụng những kiến thức chuyên môn đã tích lũy trên giảng đường, em quyết định lựa chọn đề tài: **“Xây dựng trang web quản lý và đặt phòng khách sạn”**. Thông qua dự án này, em hướng tới việc phát triển một nền tảng quản trị lưu trú hiện đại, trực quan, thân thiện với người dùng, đồng thời giải quyết hiệu quả những bài toán cơ bản trong khâu quản lý, vận hành phòng nghỉ tại các cơ sở kinh doanh.

## 1.2. Mục tiêu nghiên cứu và đối tượng, phạm vi

### 1.2.1. Mục tiêu chiến lược
Dự án được xây dựng không chỉ nhằm đáp ứng các yêu cầu học thuật mà còn hướng tới việc giải quyết những bài toán thực tiễn của doanh nghiệp qua ba trụ cột chiến lược:
*   **Tối ưu hóa trải nghiệm đặt chỗ:** Xây dựng một giao diện (UI) hiện đại và trải nghiệm người dùng (UX) liền mạch. Khách hàng có thể dễ dàng tiếp cận danh sách phòng, sử dụng các bộ lọc đa dạng (giá cả, tiện ích, vị trí) để tra cứu. Quy trình đặt phòng được thiết kế tối giản hoá, kết hợp với các công cụ tương tác thông minh nhằm làm giảm tỷ lệ thoát trang và gia tăng sự hài lòng ở mức cao nhất.
*   **Quản lý dòng tiền thông minh:** Tích hợp sâu các tính năng kế toán nội bộ thông qua bảng điều khiển (Admin Dashboard). Hệ thống tự động ghi nhận, phân loại các giao dịch theo trạng thái và xuất ra các biểu đồ báo cáo tài chính trực quan. Điều này giúp các nhà quản trị dễ dàng theo dõi dòng tiền, nắm bắt doanh thu theo các mốc thời gian thực mà không cần xử lý số liệu thủ công cồng kềnh.
*   **Quản trị và khai thác dữ liệu khách hàng:** Kiến trúc hệ thống được xây dựng nền tảng cơ sở dữ liệu tập trung, lưu trữ an toàn hồ sơ và lịch sử giao dịch. Đóng vai trò như một hệ thống CRM thu nhỏ, nền tảng hỗ trợ doanh nghiệp thấu hiểu tệp khách hàng của mình, từ đó dễ dàng thực hiện các chiến dịch chăm sóc sau bán (Ví dụ: Chat trực tiếp hỗ trợ khách hàng) và tiếp thị lại hiệu quả hơn.

### 1.2.2. Đối tượng và phạm vi triển khai
*   **Đối tượng hướng đến:**
    *   **Về phía người dùng:** Khách du lịch nội địa và quốc tế mong muốn một công cụ tìm kiếm chuẩn xác, đặt chỗ an toàn và tiện lợi trên môi trường Internet.
    *   **Về phía doanh nghiệp (Khách hàng mục tiêu):** Trọng tâm phục vụ là các công ty lữ hành vừa và nhỏ (SMEs), các chủ nhà nghỉ, homestay hay khách sạn độc lập. Đây là đới đối tượng rất khát khao chuyển đổi số nhưng lại thường gặp khó khăn với rào cản chi phí khi tiếp cận các phần mềm phức tạp trên thị trường.
*   **Phạm vi triển khai và tính năng liên kết:**
    *   **Phạm vi hệ thống:** Triển khai một ứng dụng nền nền tảng Web App hoàn chỉnh có tính tương thích cao trên mọi thiết bị. Giới hạn các nghiệp vụ chính bao gồm: Tìm kiếm phòng/Tour, tiến hành Booking, theo dõi trạng thái, và toàn bộ chức năng Quản trị hệ thống (CRUD) cơ bản.
    *   **Tích hợp liên kết khách sạn:** Hệ thống thiết lập mạng lưới kết nối giữa cung và cầu. Cho phép đa dạng hóa nguồn cung thông qua việc liên kết các đơn vị khách sạn độc lập tự đăng tải và khai báo phòng trống (inventory). Từ đó, các công ty lữ hành dễ dàng cập nhật thông tin phòng, kết hợp thành các gói combo lưu trú thuận lợi, thúc đẩy doanh số chéo cho tất cả các đối tác tham gia trên nền tảng.

## 1.4. Phân tích hệ thống yêu cầu chi tiết

### 1.4.1. Đặc tả yêu cầu chức năng (Functional Requirements)
Hệ thống Tourista được thiết kế với hai phân hệ chính nhằm phục vụ hai nhóm đối tượng riêng biệt: người dùng cuối (khách du lịch) và người quản trị (ban quản lý khách sạn/lữ hành).

*   **Phân hệ người dùng (Khách hàng):**
    *   **Tìm kiếm và Lọc thông minh (Search & Filter):** Cốt lõi của phân hệ này là cho phép người dùng tra cứu khách sạn/tour du lịch theo các tiêu chí như địa điểm, khoảng giá, ngày nhận/trả phòng và các tiện ích đi kèm (như hồ bơi, bữa sáng miễn phí). Kết quả tìm kiếm được trả về nhanh chóng với giao diện bản đồ và danh sách trực quan.
    *   **Giỏ hàng và Quản lý Booking (Cart & Booking Flow):** Người dùng có thể cân nhắc, lưu trữ trạng thái chuyến đi và tiến hành quá trình Checkout (đặt chỗ). Quy trình thanh toán được xây dựng qua các bước rõ ràng từ: điền thông tin cá nhân khách lưu trú, lựa chọn phương thức giao dịch đến việc tự động gửi thông báo xác nhận thành công (Invoice/Email Confirmation).
    *   **Tương tác thông minh:** Tích hợp hệ thống Chat thời gian thực giúp khách du lịch tương tác trực tiếp với chủ nhà (Host Chat) hoặc Chatbot AI thông minh để giải đáp thắc mắc, hỗ trợ khâu ra quyết định.

*   **Phân hệ quản lý nội bộ (Admin / Host):**
    *   **Bảng điều khiển trung tâm (Dashboard):** Hiển thị tổng quan các chỉ số kinh doanh quan trọng (KPIs) thông qua hệ thống biểu đồ và thẻ thống kê (StatCards) theo thời gian thực như: tổng doanh thu, số lượng đơn đặt phòng mới, tỷ lệ lấp đầy phòng, và phân tích lượng người truy cập.
    *   **Thống kê và Quản lý doanh thu:** Chức năng báo cáo tài chính chuyên sâu cho phép rà soát dòng tiền theo ngày, tháng, hoặc theo từng phân khúc dịch vụ. Nền tảng tự động đối soát dữ liệu giúp người quản lý dễ dàng nắm bắt biểu đồ sinh lời và quản trị rủi ro công nợ.
    *   **Quản lý nội dung và Vận hành (CMS):** Cung cấp bộ công cụ CRUD (Tạo, Đọc, Cập nhật, Xóa) mạnh mẽ để vận hành nền tảng: quản lý danh sách phòng/tour (điều chỉnh giá cả, tình trạng phòng), quản lý thông tin khách hàng, cấu hình các chương trình khuyến mãi (khu vực Marketing), và biên tập các bài viết thuộc mục "Cẩm nang du lịch".

### 1.4.2. Đặc tả yêu cầu phi chức năng (Non-functional Requirements)
Bên cạnh các tính năng hệ thống cốt lõi, để ứng dụng vận hành chuyên nghiệp và an toàn trên môi trường Internet thực tế, dự án đặt ra các tiêu chuẩn khắt khe về mặt kỹ thuật:

*   **Tính bảo mật dữ liệu khách hàng (Security & Privacy):** An toàn thông tin là tiêu chuẩn bắt buộc. Hệ thống áp dụng các cơ chế mã hóa mật khẩu mạnh mẽ, phân quyền chặt chẽ bằng Token (JWT/Cookie an toàn) đối với giới hạn truy cập API. Các thông tin nhạy cảm của cá nhân và lịch sử giao dịch được bảo vệ tối đa nhằm chống lại các rủi ro tấn công mạng phổ biến như SQL Injection hay XSS. Đảm bảo tính riêng tư dữ liệu cho cả đối tác lữ hành và khách du lịch.
*   **Hiệu năng xử lý lượng truy cập lớn (Performance & Scalability):** Hệ thống được xây dựng nền tảng Back-end chịu tải tốt, đảm bảo thời gian tải trang (Page Load Time) nhanh (mục tiêu dưới 3 giây) nhằm mang lại trải nghiệm mượt mà. Đặc biệt, kiến trúc luồng dữ liệu cần được tối ưu hoá (ví dụ: qua Load Balancing hoặc Caching) để duy trì hoạt động ổn định và xử lý hàng ngàn truy cập đồng thời trong thời điểm Lễ, Tết hoặc Mùa du lịch cao điểm, ngăn chặn tuyệt đối tình trạng nghẽn cổ chai.
*   **Khả năng tương thích thiết bị di động (Responsive Design):** Nắm bắt xu hướng "Mobile-First", toàn bộ giao diện người dùng phải có khả năng đáp ứng linh hoạt trên đa dạng loại thiết bị. Hệ thống tự động thay đổi và sắp xếp cấu trúc hiển thị sao cho tương thích hoàn hảo từ màn hình điện thoại thông minh (Smartphones), máy tính bảng (Tablets) cho đến màn hình PC lớn mà không làm vỡ bố cục, mất chữ hay gây bất tiện cho các thao tác chạm/vuốt cảm ứng.

## 3. Bố cục của báo cáo
Nội dung báo cáo được trình bày có hệ thống và logic, được chia thành 4 chương chính như sau:
*   **Chương 1: Tổng quan về đề tài trang web đặt phòng khách sạn** - Trình bày bối cảnh, lý do chọn đề tài, tình hình nghiên cứu cũng như mục tiêu hướng đến của dự án.
*   **Chương 2: Cơ sở lý thuyết** - Cung cấp cái nhìn tổng quan về các kiến thức nền tảng, các công nghệ và công cụ lập trình được sử dụng để phát triển hệ thống (Front-end, Back-end, Hệ quản trị cơ sở dữ liệu,...).
*   **Chương 3: Phân tích và thiết kế website** - Đi sâu vào phân tích yêu cầu hệ thống, biểu đồ Use Case, thiết kế cơ sở dữ liệu, kiến trúc hệ thống và phác thảo giao diện (UI/UX).
*   **Chương 4: Kết quả tiến hành và thảo luận** - Trình bày các kết quả đã đạt được, hình ảnh thực tế của hệ thống chức năng, đánh giá ưu nhược điểm cùng với định hướng phát triển, nâng cấp ứng dụng trong tương lai.

Thông qua việc thực hiện báo cáo khóa luận này, em hi vọng có thể củng cố vững chắc các kiến thức chuyên môn, bước đầu cọ xát với quy trình phát triển một sản phẩm phần mềm hoàn chỉnh. Qua đó, thể hiện mong muốn được đóng góp một phần công sức nhỏ bé vào sự tiến bộ của ứng dụng công nghệ thông tin trong lĩnh vực quản trị khách sạn và du lịch.

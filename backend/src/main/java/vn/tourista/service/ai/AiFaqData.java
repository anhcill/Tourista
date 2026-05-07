package vn.tourista.service.ai;

import org.springframework.stereotype.Component;

import java.util.List;

/**
 * FAQ Data - chứa tất cả FAQ rules
 * Dễ dàng thêm/sửa/xóa FAQ mà không cần sửa logic
 */
@Component
public class AiFaqData {

    private static final String DEFAULT_ANSWER = """
            🤔 Mình chưa hiểu rõ yêu cầu của bạn.
            
            Bạn có thể thử:
            • 🔍 **Tra cứu booking:** gửi mã TRS-YYYYMMDD-XXXXX
            • 🗺️ **Gợi ý tour:** nhắn ngân sách + số người
            • 🏨 **Tìm khách sạn:** nhắn địa điểm + ngân sách
            """;

    public String getDefaultAnswer() {
        return DEFAULT_ANSWER;
    }

    public List<AiFaqService.FaqRule> getRules() {
        return List.of(
                // Chính sách hủy
                new AiFaqService.FaqRule(
                        List.of("huy", "hoan tien", "refund", "hủy", "hoàn tiền", "cancel"),
                        """
                                📋 **Chính sách hủy & hoàn tiền:**
                                
                                • Hủy trước 7 ngày: Hoàn 100% tiền cọc
                                • Hủy trước 3-6 ngày: Hoàn 50% tổng tiền
                                • Hủy trong 3 ngày: Có thể phát sinh phí theo điều kiện đối tác
                                
                                Vào **Tài khoản > Lịch sử Booking** để thao tác nhanh."""),
                
                // Thanh toán
                new AiFaqService.FaqRule(
                        List.of("thanh toan", "payment", "vnpay", "chuyen khoan", "trả tiền"),
                        """
                                💳 **Thanh toán trên Tourista Studio:**
                                
                                • **VNPay:** ATM nội địa, Visa/Mastercard, QR
                                • **Chuyển khoản:** có hướng dẫn qua email sau khi đặt
                                
                                Nếu thanh toán lỗi, gửi mã booking cho **support@tourista.vn** để được xử lý nhanh."""),
                
                // Tra cứu booking
                new AiFaqService.FaqRule(
                        List.of("tra cuu", "xem booking", "xem lich su", "lich su dat cho", "lich su booking"),
                        "🔍 **Tra cứu booking:**\n\nGửi mã đặt cho mình theo định dạng **TRS-YYYYMMDD-XXXXX** để xem chi tiết lịch trình."),
                
                // Liên hệ
                new AiFaqService.FaqRule(
                        List.of("lien he", "hotline", "email", "ho tro", "support", "hỗ trợ"),
                        """
                                📞 **Liên hệ hỗ trợ Tourista Studio:**
                                
                                • **Hotline:** 1900 xxxx (7:00 - 22:00)
                                • **Email:** support@tourista.vn
                                • **Chat** với chủ tour/khách sạn tại trang chi tiết dịch vụ."""),
                
                // Chào hỏi
                new AiFaqService.FaqRule(
                        List.of("chao", "hello", "hi", "xin chao", "xin chào", "hey"),
                        "👋 Chào bạn! Mình là trợ lý Tourista Studio.\n\nMình có thể giúp bạn tra cứu booking, gợi ý tour, tìm khách sạn và giải đáp thắc mắc về chính sách nhé!"),
                
                // Gợi ý tour - phải là whole word "tour" hoặc cụm dài hơn
                new AiFaqService.FaqRule(
                        List.of("goi y tour", "goi i tour", "suggest tour", "de xuat tour", "di tour", "dat tour"),
                        """
                                🗺️ **Mình có thể gợi ý tour cho bạn!**
                                
                                Bạn cho mình biết:
                                • **Ngân sách** (ví dụ: 8 triệu)
                                • **Số người** (ví dụ: 2 người)
                                • **Địa điểm** (ví dụ: Đà Nẵng)
                                
                                Hoặc nhắn đơn giản: **"gợi ý tour 8tr cho 2 người"** nhé!"""),
                
                // Tìm khách sạn
                new AiFaqService.FaqRule(
                        List.of("khach san", "tim khach san", "dat khach san", "book khach san"),
                        """
                                🏨 **Mình giúp bạn tìm khách sạn!**
                                
                                Bạn cho mình biết:
                                • **Địa điểm** (ví dụ: Đà Nẵng)
                                • **Ngân sách/đêm** (ví dụ: dưới 1 triệu)
                                • **Số sao** (ví dụ: 4 sao)
                                
                                Hoặc nhắn đơn giản: **"tìm khách sạn Đà Nẵng dưới 1 triệu"** nhé!"""),
                
                // Ẩm thực
                new AiFaqService.FaqRule(
                        List.of("an uong", "am thuc", "mon ngon", "dac san", "nha hang", "an gi"),
                        "🍜 **Về ẩm thực:**\n\nMỗi điểm đến có món ăn đặc trưng riêng. Bạn muốn hỏi về ẩm thực ở đâu?\n\nVD: **Đà Nẵng có món gì ngon?**")
        );
    }
}

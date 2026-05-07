import { NextRequest, NextResponse } from 'next/server';

const FAQ_RESPONSES: Record<string, string> = {
  'chào': '👋 Xin chào! Rất vui được hỗ trợ bạn! Bạn cần tìm gì hôm nay?',
  'hello': "👋 Hello! I'm here to help you! What are you looking for today?",
  'hi': '👋 Hi there! How can I assist you?',
  'tour': '🎯 Bạn muốn tìm tour? Mình gợi ý một số điểm đến hot:\n\n• **Đà Nẵng** - Thành phố biển nổi tiếng\n• **Phú Quốc** - Đảo ngọc thiên đường\n• **Nha Trang** - Bãi biển đẹp, resort sang trọng\n• **Hội An** - Phố cổ UNESCO lung linh\n\nBạn muốn tìm tour ở đâu?',
  'khách sạn': '🏨 Mình giới thiệu bạn vào trang **Khách sạn** để tìm nơi lưu trú phù hợp nhé!\n\nMột số gợi ý:\n• **Khách sạn 5 sao** - Sang trọng, view đẹp\n• **Khách sạn 3-4 sao** - Tiết kiệm, tiện nghi tốt\n• **Homestay** - Trải nghiệm địa phương',
  'hủy': '❌ **Chính sách hủy tour:**\n\n• Hủy trước **7 ngày** → hoàn **80%**\n• Hủy trước **3-7 ngày** → hoàn **50%**\n• Hủy dưới **3 ngày** → **không hoàn**\n\nĐể hủy tour, bạn gửi email đến **hotro@tourista.vn** kèm mã booking nhé!',
  'hoàn tiền': '💰 **Chính sách hoàn tiền:**\n\n• Hủy trước **7 ngày** → hoàn **80%**\n• Hủy trước **3-7 ngày** → hoàn **50%**\n• Hủy dưới **3 ngày** → **không hoàn**\n\nThời gian hoàn tiền: **5-10 ngày làm việc** sau khi xác nhận hủy.',
  'thanh toán': '💳 Tourista hỗ trợ thanh toán qua:\n\n• **VNPay** - Thẻ ATM, Visa, Mastercard\n• **Chuyển khoản** ngân hàng\n• **MoMo** - Ví điện tử\n• **ZaloPay** - Ví điện tử\n\nThanh toán an toàn, bảo mật 100%!',
  'booking': '🔍 Để tra cứu booking:\n\n1. **Đăng nhập** tài khoản\n2. Vào **Tài khoản > Lịch sử Booking**\n3. Nhập **mã booking** (format: TRS-YYYYMMDD-XXXXXX)\n\nMã booking có trong email xác nhận sau khi đặt thành công.',
  'liên hệ': '📞 **Liên hệ hỗ trợ:**\n\n• **Hotline:** 1900 1234\n  (8h00 - 22h00, 7 ngày/tuần)\n\n• **Email:** hotro@tourista.vn\n  (Phản hồi trong 24h)\n\n• **Địa chỉ:** Tầng 12, Tòa nhà ABC Tower, 123 Nguyễn Huệ, Quận 1, TP.HCM',
  'giá': '💰 **Về giá tour:**\n\nGiá tour dao động tùy điểm đến và loại tour:\n\n• **Tour tiết kiệm:** 500K - 2 triệu\n• **Tour trung bình:** 2 - 5 triệu\n• **Tour cao cấp:** 5 - 15+ triệu\n\nGiá đã bao gồm: vận chuyển, ăn uống, lưu trú, hướng dẫn viên.',
  'trẻ em': '👶 **Chính sách trẻ em:**\n\n• Trẻ dưới 2 tuổi: Miễn phí (ngồi cùng bố mẹ)\n• Trẻ 2-5 tuổi: Giảm 50% giá tour\n• Trẻ 6-11 tuổi: Giảm 30% giá tour\n• Trẻ từ 12 tuổi trở lên: Tính như người lớn\n\nLưu ý: Mỗi tour có chính sách riêng, vui lòng kiểm tra chi tiết.',
  'đà nẵng': '🌊 **Đà Nẵng** - Thành phố biển nổi tiếng!\n\n**Điểm tham quan:**\n• Bãi biển Mỹ Khê\n• Cầu Rồng\n• Ngũ Hành Sơn\n• Bán đảo Sơn Trà\n• Hội An (cách 30km)\n\n**Tour gợi ý:** Tour 3N2Đ Đà Nẵng - Hội An - Bà Nà',
  'phú quốc': '🏝️ **Phú Quốc** - Đảo ngọc thiên đường!\n\n**Điểm tham quan:**\n• Vinpearl Safari\n• Vinwonders\n• Bãi Sao\n• Grand World\n• Hòn Thơm\n\n**Tour gợi ý:** Tour 4N3Đ Phú Quốc - Thiên đường biển đảo',
  'nha trang': '🌊 **Nha Trang** - Bãi biển đẹp, resort sang trọng!\n\n**Điểm tham quan:**\n• Vinpearl Land\n• Tháp Bà Ponagar\n• Hòn Miễu\n• Đảo Tre\n• Trần Phú Beach\n\n**Tour gợi ý:** Tour 3N2Đ Nha Trang - Khám phá biển xanh',
};

function getBotResponse(message: string): string {
  const lower = message.toLowerCase();
  
  // Check FAQ responses
  for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
    if (lower.includes(keyword)) {
      return response;
    }
  }
  
  // Pattern matching
  if (lower.match(/tìm.*tour|tour.*đi|muốn.*đi|go.*tour/)) {
    return '🎯 Bạn muốn tìm tour du lịch? Hãy cho mình biết thêm:\n\n• **Điểm đến** bạn muốn?\n• **Ngân sách** bao nhiêu?\n• **Số người** đi cùng?\n\nVí dụ: "Tìm tour Đà Nẵng 5 triệu cho 2 người"';
  }
  
  if (lower.match(/khách sạn|hotel|resort|homestay|nơi.*ở|lưu trú/)) {
    return '🏨 Bạn cần tìm khách sạn?\n\nVào trang **Khách sạn** và tìm theo:\n• Địa điểm\n• Mức giá\n• Số sao\n\nMình gợi ý: Đà Nẵng, Nha Trang, Phú Quốc có nhiều khách sạn đẹp nhé!';
  }
  
  if (lower.match(/TRS-\w+|mã.*đặt|booking.*code|mã.*booking/)) {
    return '🔍 Mình thấy bạn đang hỏi về mã booking!\n\n**Format mã booking:** `TRS-YYYYMMDD-XXXXXX`\n\nĐể tra cứu, bạn cần:\n1. Đăng nhập tài khoản\n2. Vào **Tài khoản > Lịch sử Booking**\n3. Nhập mã booking';
  }
  
  // Default response
  return '🤖 Mình đã ghi nhận câu hỏi của bạn!\n\nMình có thể hỗ trợ bạn về:\n• 🗺️ **Tìm tour** du lịch\n• 🏨 **Tìm khách sạn**\n• 🔍 **Tra cứu booking**\n• ❓ **Chính sách hủy/hoàn tiền**\n• 💳 **Thanh toán**\n\nBạn hỏi cụ thể hơn nhé! Hoặc liên hệ hotline **1900 1234** để được hỗ trợ nhanh hơn.';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Message is required' },
        { status: 400 }
      );
    }
    
    const response = getBotResponse(message.trim());
    
    return NextResponse.json({
      success: true,
      data: {
        content: response,
        timestamp: new Date().toISOString(),
      }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

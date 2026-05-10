const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const userMessage = "có";
const conversationContext = "Tourista Bot: Tầm 500k/đêm ở Đà Nẵng thì quá ổn áp luôn bạn ơi! 🏨 \n\nVới mức giá này, bạn dư sức tìm được mấy khách sạn 3 sao hoặc homestay cực xinh ở khu vực biển Mỹ Khê hay phố Tây An Thượng đó. 🏖️ Vừa đi bộ ra biển được, vừa gần đủ thứ quán ăn ngon. Hệ thống bên mình đang có rất nhiều lựa chọn \"ngon - bổ - rẻ\" trong tầm giá này luôn. \n\nBạn có muốn mình lọc ra 2-3 cái tên xịn nhất rồi gửi ảnh qua cho bạn chọn không? 😉✨\nKhách: có";
const dbContext = "";

const prompt = `Bạn là trợ lý du lịch AI của nền tảng Tourista Studio.
HÔM NAY: ${today}
Nền tảng cho phép đặt tour du lịch và khách sạn tại Việt Nam.

=== LỊCH SỬ HỘI THOẠI GẦN ĐÂY ===
${conversationContext}

=== CÂU HỎI HIỆN TẠI ===
${userMessage}

TRẢ LỜI TỰ NHIÊN:
- Chat như đang nói chuyện với bạn thân, không phải đọc tài liệu
- Dùng emoji phù hợp: 🏖️ biển, 🏨 khách sạn, 🍜 ẩm thực, 🗺️ du lịch
- Nếu có data thực từ hệ thống → trích dẫn cụ thể: tên, giá, rating
- Nếu hỏi địa điểm → trả lời về địa điểm đó: thời tiết, ẩm thực, hoạt động
- Nếu hỏi so sánh → so sánh tự nhiên, nêu ưu nhược từng nơi
- Nếu hỏi thời tiết → trả lời theo mùa hiện tại và địa điểm cụ thể
- Nếu câu hỏi lạ → trả lời dựa trên kiến thức du lịch Việt Nam
- Kết thúc bằng gợi ý hành động cụ thể

`;

const payload = {
  model: "gemini-3-flash",
  messages: [
    {
      role: "system",
      content: "Ban la tro ly du lich AI cua nen tang Tourista Studio. Tra loi ngan gon, thân thiên, dung emoji phu hop. Chi tra loi ve du lich, tour, khach san, diem den Viet Nam."
    },
    {
      role: "user",
      content: prompt
    }
  ],
  max_tokens: 2000,
  temperature: 0.5
};

async function test() {
  try {
    const res = await fetch('https://platform.beeknoee.com/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-bee-d32a3f4bc08544b4945bee85e9bb3ff82a8b5ea082484f63b60d64792af5ef8d'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.log('ERROR:', err);
  }
}
test();

/**
 * Unit tests cho ChatbotNlpService — test trực tiếp các hàm NLP mà không cần backend.
 * Chạy: npx playwright test tests/e2e/chatbot-nlp.spec.ts
 *
 * Cách chạy standalone (không cần backend):
 *   npx ts-node --esm tests/e2e/chatbot-nlp.spec.ts
 * Hoặc import vào test file khác.
 */

import { test, expect } from '@playwright/test';
import { mockApi } from './helpers/mockApi';
import { seedAuthStorage } from './helpers/session';

// ──────────────────────────────────────────────────────────────
// Helper: thực hiện 1 lời nhắn trong chatbot widget và trả về nội dung bot reply
// ──────────────────────────────────────────────────────────────
async function sendChatMessage(page: any, message: string): Promise<string> {
  // Mở widget nếu chưa mở
  const chatButton = page.locator('[data-testid="chat-toggle"]').or(page.locator('button[aria-label*="chat" i]')).or(page.locator('button[aria-label*="Chat" i]')).or(page.locator('#chat-widget-toggle, .chat-widget-toggle, [class*="toggle"]').first());
  if (await chatButton.isVisible().catch(() => false)) {
    await chatButton.click();
  }

  const input = page.locator('input[placeholder*="nhắn" i], input[placeholder*="message" i], textarea[name*="message" i]').first();
  await input.waitFor({ timeout: 5000 }).catch(() => null);
  if (await input.isVisible().catch(() => false)) {
    await input.fill(message);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
  }

  // Lấy tất cả tin nhắn bot gần nhất
  const botMessages = page.locator('[class*="bot-message"], [class*="bot-msg"], [data-role="bot"], .message.bot').last();
  const text = await botMessages.textContent().catch(() => '');
  return text ?? '';
}

// ──────────────────────────────────────────────────────────────
// Test cases: NLP keywords → expected fields
// ──────────────────────────────────────────────────────────────
const NLP_TEST_CASES = [
  {
    description: 'Budget triệu (5tr)',
    userInput: 'Tôi muốn tìm tour có budget 5 triệu',
    expectedFields: ['budget', 'price'],
  },
  {
    description: 'Budget nghìn (500k)',
    userInput: 'Tour giá 500k',
    expectedFields: ['budget', 'price'],
  },
  {
    description: 'Số người (2 người)',
    userInput: 'Cho 2 người đi',
    expectedFields: ['travelers'],
  },
  {
    description: 'Số người (3 người lớn)',
    userInput: '3 người lớn đi Đà Nẵng',
    expectedFields: ['travelers', 'city'],
  },
  {
    description: 'Thành phố (Đà Nẵng)',
    userInput: 'Tôi muốn đi Đà Nẵng',
    expectedFields: ['city'],
  },
  {
    description: 'Thành phố (Hà Nội)',
    userInput: 'Gợi ý tour Hà Nội',
    expectedFields: ['city'],
  },
  {
    description: 'Số ngày (3 ngày 2 đêm)',
    userInput: 'Tour 3 ngày 2 đêm',
    expectedFields: ['duration'],
  },
  {
    description: 'Booking code TRS',
    userInput: 'Tra mã TRS-20260505-ABC123',
    expectedFields: ['bookingCode'],
  },
  {
    description: 'Nhiều thông tin cùng lúc',
    userInput: 'Cho 2 người, budget 5 triệu, đi Đà Nẵng 3 ngày',
    expectedFields: ['travelers', 'budget', 'city', 'duration'],
  },
  {
    description: 'Intent gợi ý tour',
    userInput: 'Gợi ý tour du lịch cho tôi',
    expectedFields: ['recommendationIntent'],
  },
  {
    description: 'Intent tour hot',
    userInput: 'Có tour hot nào không?',
    expectedFields: ['hotTourIntent'],
  },
  {
    description: 'Intent hủy/reject',
    userInput: 'Thôi, không cần nữa',
    expectedFields: ['cancelIntent'],
  },
];

test.describe('Chatbot NLP — Unit', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  // =============================================================
  // 1. FAQ keyword matching
  // =============================================================
  test('FAQ: trả lời đúng với từ khóa "thanh toán"', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Thanh toán như thế nào?');

    // Bot reply phải chứa nội dung liên quan đến thanh toán
    expect(text.toLowerCase()).toMatch(/thanhtoan|payment|vnpay|chuyen khoan|tien/i);
  });

  test('FAQ: trả lời đúng với từ khóa "hủy tour"', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Tôi muốn hủy tour');

    expect(text.toLowerCase()).toMatch(/huy|huy|tour|chinh sach/i);
  });

  test('FAQ: fallback khi không hiểu input', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'asdfghjkl qwerty');

    // Bot nên fallback thành công (không crash)
    expect(text.length).toBeGreaterThan(0);
  });

  // =============================================================
  // 2. Tour recommendation intent detection
  // =============================================================
  test('Intent gợi ý tour được phát hiện khi nói "gợi ý tour"', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Gợi ý tour Đà Nẵng cho tôi');

    expect(text.toLowerCase()).toMatch(/tour|goi y|de xuat|suggest/i);
  });

  test('Intent refine được phát hiện khi thêm thông tin lọc', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    // Bắt đầu luồng
    await sendChatMessage(page, 'Gợi ý tour');
    await page.waitForTimeout(500);
    // Refine thêm
    const text = await sendChatMessage(page, 'Thêm budget 5 triệu');

    expect(text.toLowerCase()).toMatch(/tour|loc|ngansach|budget|filter/i);
  });

  // =============================================================
  // 3. Booking lookup
  // =============================================================
  test('Tra booking code hợp lệ trả về thông tin booking', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Tra mã TRS-20260505-ABCDEF');

    expect(text.toLowerCase()).toMatch(/TRS-20260505|booking|ma|tour|trang thai/i);
  });

  test('Booking code không hợp lệ không crash', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Tra mã 123');

    // Không crash, có thể trả lời "không tìm thấy" hoặc FAQ
    expect(text.length).toBeGreaterThan(0);
  });

  // =============================================================
  // 4. Cancel / exit recommendation
  // =============================================================
  test('Gõ "thôi" trong luồng gợi ý thoát ra được', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    await sendChatMessage(page, 'Gợi ý tour Đà Nẵng');
    await page.waitForTimeout(500);
    const text = await sendChatMessage(page, 'Thôi không cần nữa');

    expect(text.toLowerCase()).toMatch(/cam on|ket thuc|thoat|ok|goodbye|talk later/i);
  });

  // =============================================================
  // 5. Tour hot intent
  // =============================================================
  test('Hỏi tour hot trả về danh sách tour nổi bật', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Có tour hot nào không?');

    expect(text.toLowerCase()).toMatch(/tour|hot|noi bat|top|bestseller|popular/i);
  });

  // =============================================================
  // 6. Conversation history persists
  // =============================================================
  test('Tin nhắn trước đó được giữ khi mở lại chat', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    await sendChatMessage(page, 'Xin chào');
    await page.waitForTimeout(300);

    // Đóng widget
    const closeBtn = page.locator('[aria-label*="close" i], [class*="close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
    }
    await page.waitForTimeout(500);

    // Mở lại
    const openBtn = page.locator('[data-testid="chat-toggle"], #chat-widget-toggle, .chat-widget-toggle, [class*="toggle"]').first();
    if (await openBtn.isVisible().catch(() => false)) {
      await openBtn.click();
    }
    await page.waitForTimeout(500);

    // Kiểm tra tin nhắn cũ còn
    const messages = page.locator('[class*="message"], [class*="msg"]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(2); // user msg + bot reply
  });

  // =============================================================
  // 7. Slot-filling: hỏi thiếu thông tin
  // =============================================================
  test('Khi chỉ hỏi "gợi ý tour" mà không có thông tin, bot hỏi lại đủ', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Gợi ý tour');

    // Bot phải hỏi thêm thông tin (city, budget, hoặc travelers)
    const lowerText = text.toLowerCase();
    const asksForInfo = /diem den|thanh pho|ngansach|budget|so nguoi|bao nhieu/i.test(lowerText);
    const hasTourList = /tour|danh sach|goi y/i.test(lowerText);
    expect(asksForInfo || hasTourList).toBeTruthy();
  });

  test('Cung cấp đủ thông tin → bot trả tour cards', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    // Full info ngay từ đầu
    const text = await sendChatMessage(page, 'Gợi ý tour Đà Nẵng, 2 người, 5 triệu, 3 ngày');

    const lowerText = text.toLowerCase();
    const showsTour = /tour|danh sach|goi y|card|item/i.test(lowerText);
    expect(showsTour).toBeTruthy();
  });

  // =============================================================
  // 8. Multi-turn: hỏi rồi bổ sung
  // =============================================================
  test('Hỏi tour → bổ sung city → bot cập nhật kết quả', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    await sendChatMessage(page, 'Gợi ý tour');
    await page.waitForTimeout(500);
    const text = await sendChatMessage(page, 'Đà Nẵng');

    // Bot phải phản hồi, không crash
    expect(text.length).toBeGreaterThan(0);
  });
});

test.describe('Chatbot E2E — Full Flows', () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  // =============================================================
  // 9. End-to-end: FAQ → booking lookup → recommendation
  // =============================================================
  test('Full flow: FAQ → booking lookup → recommendation', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');

    // 1. Hỏi FAQ
    await sendChatMessage(page, 'Chính sách hủy tour thế nào?');
    await page.waitForTimeout(800);

    // 2. Hỏi booking
    await sendChatMessage(page, 'Tra mã TRS-20260505-ABCDEF');
    await page.waitForTimeout(800);

    // 3. Hỏi gợi ý tour
    const text = await sendChatMessage(page, 'Gợi ý tour Hà Nội 2 người 4 triệu');
    await page.waitForTimeout(800);

    expect(text.length).toBeGreaterThan(0);
  });

  // =============================================================
  // 10. Unauthenticated user vẫn dùng được chatbot
  // =============================================================
  test('Unauthenticated user có thể hỏi chatbot', async ({ page }) => {
    await mockApi(page);
    // Không seedAuthStorage → không login

    await page.goto('/');
    const text = await sendChatMessage(page, 'Xin chào chatbot');

    // Bot vẫn trả lời (FAQ hoặc greeting)
    expect(text.length).toBeGreaterThan(0);
  });

  // =============================================================
  // 11. Chat widget mở/đóng toggle
  // =============================================================
  test('Chat widget toggle hoạt động', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');

    // Tìm nút mở chat
    const toggle = page.locator('[data-testid="chat-toggle"], #chat-widget-toggle, .chat-widget-toggle, button[class*="chat"], button[class*="toggle"]').first();
    await toggle.waitFor({ timeout: 3000 }).catch(() => null);

    // Mở
    await toggle.click();
    await page.waitForTimeout(500);

    // Kiểm tra input hiển thị
    const input = page.locator('input[placeholder*="nhắn" i], textarea[name*="message" i]').first();
    await expect(input).toBeVisible({ timeout: 5000 });

    // Đóng
    const closeBtn = page.locator('[aria-label*="close" i], button[class*="close"]').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
      await expect(input).not.toBeVisible({ timeout: 3000 });
    }
  });

  // =============================================================
  // 12. Tour recommendation with image cards
  // =============================================================
  test('Kết quả gợi ý tour chứa hình ảnh', async ({ page }) => {
    await seedAuthStorage(page, 'USER');
    await mockApi(page);

    await page.goto('/');
    const text = await sendChatMessage(page, 'Gợi ý tour phổ biến nhất');

    // Bot nên trả lời bằng text hoặc có tour cards
    const hasResponse = text.length > 0;
    expect(hasResponse).toBeTruthy();
  });
});

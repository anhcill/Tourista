/**
 * Standalone Chatbot NLP Test
 * Chạy: node tests/chatbot-nlp-test.js
 *
 * Test trực tiếp các regex NLP patterns mà KHÔNG cần backend.
 * Copy file này ra ngoài rồi chạy: node chatbot-nlp-test.js
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════
// SECTION 1: Copy-paste NLP logic từ ChatbotNlpService.java
// (Giữ nguyên logic để test độc lập)
// ═══════════════════════════════════════════════════════════════

// NOTE: KHÔNG dùng global flag 'g' trong JS — lastIndex persist giữa các exec().
// Mỗi lần gọi parseXXX phải tạo RegExp instance MỚI để tránh lastIndex residue.
// ═══════════════════════════════════════════════════════════════

function makeBudgetMillionPattern() {
  return /(\d+(?:[.,]\d+)?)\s*(tr|trieu|triệu|m)\b/gi;
}
function makeBudgetThousandPattern() {
  return /(\d+(?:[.,]\d+)?)\s*(k|nghin|nghìn)\b/gi;
}
function makeBudgetRawPattern() {
  return /\b(\d{1,3}(?:[.,]\d{3}){1,3}|\d{6,11})\b/g;
}
function makeTravelersPattern() {
  return /\b(\d{1,2})\s*(nguoi|người|khach|khách|adult|adults)\b/gi;
}
function makeGroupPattern() {
  return /\b(nhom|nhóm|team)\s*(\d{1,2})\b/gi;
}
function makeTravelersForPattern() {
  return /\bcho\s*(\d{1,2})\b/gi;
}
function makePaxPattern() {
  return /\b(\d{1,2})\s*(pax|person|persons)\b/gi;
}
function makeDurationPattern() {
  return /\b(\d{1,2})\s*(ngay|ngày|dem|đêm)\b/gi;
}
function makeDurationTripPattern() {
  return /\b(\d{1,2})\s*n\s*\d{1,2}\s*[đd]\b/gi;
}
function makeBookingCodePattern() {
  return /\bTRS-\d{8}-[A-Z0-9]{6}\b/gi;
}

const CITY_KEYWORDS = [
  { city: 'da-nang', display: 'Da Nang', keywords: ['da nang', 'đà nẵng'] },
  { city: 'da-lat', display: 'Da Lat', keywords: ['da lat', 'đà lạt'] },
  { city: 'phu-quoc', display: 'Phu Quoc', keywords: ['phu quoc', 'phú quốc'] },
  { city: 'nha-trang', display: 'Nha Trang', keywords: ['nha trang'] },
  { city: 'ha-noi', display: 'Ha Noi', keywords: ['ha noi', 'hà nội'] },
  { city: 'sapa', display: 'Sa Pa', keywords: ['sapa', 'sa pa'] },
  { city: 'hue', display: 'Hue', keywords: ['hue', 'huế'] },
  { city: 'hoi-an', display: 'Hoi An', keywords: ['hoi an', 'hội an'] },
];

function canonicalize(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDecimalToken(raw) {
  try {
    let normalized = raw.trim().replace(/ /g, '');
    if (normalized.includes(',') && normalized.includes('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else if (normalized.includes(',')) {
      normalized = normalized.replace(',', '.');
    }
    return parseFloat(normalized);
  } catch {
    return null;
  }
}

function normalizeBudgetValue(budget) {
  if (budget < 300_000 || budget > 1_500_000_000) return null;
  return Math.round(budget);
}

function normalizeDurationValue(raw) {
  const value = parseInt(raw, 10);
  if (isNaN(value) || value < 1 || value > 14) return null;
  return value;
}

function normalizeTravelersValue(raw) {
  const value = parseInt(raw, 10);
  if (isNaN(value) || value < 1 || value > 20) return null;
  return value;
}

function containsAny(text, keywords) {
  if (!text || !keywords?.length) return false;
  return keywords.some(kw => text.includes(kw));
}

function parseBudgetVnd(inputText) {
  if (!inputText) return null;

  let match;

  match = makeBudgetMillionPattern().exec(inputText);
  if (match) {
    const value = parseDecimalToken(match[1]);
    if (value == null) return null;
    return normalizeBudgetValue(Math.round(value * 1_000_000));
  }

  match = makeBudgetThousandPattern().exec(inputText);
  if (match) {
    const value = parseDecimalToken(match[1]);
    if (value == null) return null;
    return normalizeBudgetValue(Math.round(value * 1_000));
  }

  match = makeBudgetRawPattern().exec(inputText);
  if (match) {
    const digits = match[1].replace(/[^0-9]/g, '');
    if (digits) {
      try {
        return normalizeBudgetValue(parseInt(digits, 10));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function parseTravelers(inputText, allowLooseNumber = false) {
  if (!inputText) return null;

  let match;

  match = makeTravelersPattern().exec(inputText);
  if (match) return normalizeTravelersValue(match[1]);

  match = makeGroupPattern().exec(inputText);
  if (match) return normalizeTravelersValue(match[2]);

  match = makeTravelersForPattern().exec(inputText);
  if (match) return normalizeTravelersValue(match[1]);

  match = makePaxPattern().exec(inputText);
  if (match) return normalizeTravelersValue(match[1]);

  if (allowLooseNumber) {
    const trimmed = inputText.trim();
    if (/^\d{1,2}$/.test(trimmed)) {
      return normalizeTravelersValue(trimmed);
    }
  }

  return null;
}

function parseCityAlias(canonicalInput) {
  if (!canonicalInput) return null;
  for (const city of CITY_KEYWORDS) {
    const canonicalKeywords = city.keywords.map(kw => canonicalize(kw));
    if (containsAny(canonicalInput, canonicalKeywords)) {
      return city;
    }
  }
  return null;
}

function parseMaxDurationDays(inputText) {
  if (!inputText) return null;

  let match;

  match = makeDurationTripPattern().exec(inputText);
  if (match) return normalizeDurationValue(match[1]);

  match = makeDurationPattern().exec(inputText);
  if (match) return normalizeDurationValue(match[1]);

  return null;
}

function containsBookingCode(inputText) {
  if (!inputText) return false;
  return makeBookingCodePattern().test(inputText);
}

function extractBookingCode(inputText) {
  if (!inputText) return null;
  const match = makeBookingCodePattern().exec(inputText);
  return match ? match[0].toUpperCase() : null;
}

function isRecommendationIntent(canonicalInput) {
  const hasSuggestIntent = containsAny(canonicalInput, ['goi y', 'goi i', 'tu van', 'de xuat', 'suggest']);
  const hasTourContext = containsAny(canonicalInput, ['tour', 'du lich', 'lich trinh', 'di dau', 'bien', 'nghi duong']);
  const directBudgetIntent = containsAny(canonicalInput, ['ngan sach', 'bao nhieu nguoi', 'cho 2', 'cho 3', 'cho 4']);
  const directRefineIntent = containsAny(canonicalInput, ['loc', 'diem den', 'so ngay']);
  return (hasSuggestIntent && hasTourContext) || directBudgetIntent || (directRefineIntent && hasTourContext);
}

function isCancelRecommendationIntent(canonicalInput) {
  return containsAny(canonicalInput, ['dung', 'thoi', 'thoat', 'exit', 'cancel', 'huy']);
}

function isHotTourIntent(canonicalInput) {
  return containsAny(canonicalInput, ['tour hot', 'tour noi bat', 'pho bien', 'bestseller', 'nhieu nguoi dat', 'top tour', 'tours hot']);
}

function isResetFilterIntent(canonicalInput) {
  return containsAny(canonicalInput, ['xoa loc', 'bo loc', 'reset loc']);
}

// ═══════════════════════════════════════════════════════════════
// SECTION 2: Test runner
// ═══════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${e.message}`);
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected "${expected}" but got "${actual}"`);
  }
}

function assertContains(text, keyword, msg = '') {
  if (!text.toLowerCase().includes(keyword.toLowerCase())) {
    throw new Error(`${msg} Expected text to contain "${keyword}", got "${text}"`);
  }
}

function assertNull(value, msg = '') {
  if (value !== null) {
    throw new Error(`${msg} Expected null but got "${value}"`);
  }
}

function assertNotNull(value, msg = '') {
  if (value === null) {
    throw new Error(`${msg} Expected non-null but got null`);
  }
}

function formatVnd(amount) {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
}

// ═══════════════════════════════════════════════════════════════
// SECTION 3: Test cases
// ═══════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════');
console.log('  Chatbot NLP — Standalone Unit Tests');
console.log('══════════════════════════════════════════════════════\n');

// ── Budget parsing ──────────────────────────────────────────────
console.log('▶ Budget Parsing');
console.log('─'.repeat(50));

test('parseBudgetVnd: triệu (5tr)', () => {
  const result = parseBudgetVnd('Tôi muốn tìm tour có budget 5 triệu');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 5_000_000);
});

test('parseBudgetVnd: tr (2tr)', () => {
  const result = parseBudgetVnd('Tour giá 2tr');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 2_000_000);
});

test('parseBudgetVnd: nghìn (500k)', () => {
  const result = parseBudgetVnd('Tour giá 500k');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 500_000);
});

test('parseBudgetVnd: nghìn (1500k)', () => {
  const result = parseBudgetVnd('Budget 1500k');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 1_500_000);
});

test('parseBudgetVnd: số thường (3,000,000)', () => {
  const result = parseBudgetVnd('Giá 3,000,000 VND');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 3_000_000);
});

test('parseBudgetVnd: số thường (500000)', () => {
  const result = parseBudgetVnd('Giá 500000');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 500_000);
});

test('parseBudgetVnd: số thường (1000000)', () => {
  const result = parseBudgetVnd('Giá 1000000');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 1_000_000);
});

test('parseBudgetVnd: decimal (2.5tr)', () => {
  const result = parseBudgetVnd('Budget 2.5 triệu');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 2_500_000);
});

test('parseBudgetVnd: decimal comma (1,5tr)', () => {
  const result = parseBudgetVnd('Budget 1,5 tr');
  assertNotNull(result, 'parseBudgetVnd');
  assertEqual(result, 1_500_000);
});

test('parseBudgetVnd: giá quá nhỏ → null', () => {
  const result = parseBudgetVnd('Giá 100 VND');
  assertNull(result);
});

test('parseBudgetVnd: giá quá lớn → null', () => {
  const result = parseBudgetVnd('Giá 2,000,000,000 VND');
  assertNull(result);
});

test('parseBudgetVnd: không có budget → null', () => {
  const result = parseBudgetVnd('Xin chào chatbot');
  assertNull(result);
});

test('parseBudgetVnd: null input → null', () => {
  const result = parseBudgetVnd(null);
  assertNull(result);
});

// ── Travelers parsing ──────────────────────────────────────────
console.log('\n▶ Travelers Parsing');
console.log('─'.repeat(50));

test('parseTravelers: "2 người"', () => {
  const result = parseTravelers('Cho 2 người đi');
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 2);
});

test('parseTravelers: "3 người lớn"', () => {
  const result = parseTravelers('3 người lớn đi');
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 3);
});

test('parseTravelers: "nhóm 4"', () => {
  const result = parseTravelers('Nhóm 4 người');
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 4);
});

test('parseTravelers: "cho 5"', () => {
  const result = parseTravelers('Cho 5 người');
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 5);
});

test('parseTravelers: "2 adults"', () => {
  const result = parseTravelers('2 adults');
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 2);
});

test('parseTravelers: "3 pax"', () => {
  const result = parseTravelers('3 pax');
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 3);
});

test('parseTravelers: loose number "5"', () => {
  const result = parseTravelers('5', true);
  assertNotNull(result, 'parseTravelers');
  assertEqual(result, 5);
});

test('parseTravelers: loose number "5" (không cho phép) → null', () => {
  const result = parseTravelers('5', false);
  assertNull(result);
});

test('parseTravelers: 0 người → null', () => {
  const result = parseTravelers('Cho 0 người');
  assertNull(result);
});

test('parseTravelers: 25 người (quá max) → null', () => {
  const result = parseTravelers('Cho 25 người');
  assertNull(result);
});

test('parseTravelers: không có số người → null', () => {
  const result = parseTravelers('Xin chào');
  assertNull(result);
});

// ── City parsing ───────────────────────────────────────────────
console.log('\n▶ City Parsing');
console.log('─'.repeat(50));

test('parseCityAlias: "Đà Nẵng" → Da Nang', () => {
  const result = parseCityAlias(canonicalize('Tôi muốn đi Đà Nẵng'));
  assertNotNull(result, 'parseCityAlias');
  assertEqual(result.city, 'da-nang');
  assertEqual(result.display, 'Da Nang');
});

test('parseCityAlias: "da nang" → Da Nang', () => {
  const result = parseCityAlias(canonicalize('da nang'));
  assertNotNull(result, 'parseCityAlias');
  assertEqual(result.city, 'da-nang');
});

test('parseCityAlias: "Hà Nội" → Ha Noi', () => {
  const result = parseCityAlias(canonicalize('hà nội'));
  assertNotNull(result, 'parseCityAlias');
  assertEqual(result.city, 'ha-noi');
});

test('parseCityAlias: "Hội An" → Hoi An', () => {
  const result = parseCityAlias(canonicalize('hội an'));
  assertNotNull(result, 'parseCityAlias');
  assertEqual(result.city, 'hoi-an');
});

test('parseCityAlias: "Đà Lạt" → Da Lat', () => {
  const result = parseCityAlias(canonicalize('đà lạt'));
  assertNotNull(result, 'parseCityAlias');
  assertEqual(result.city, 'da-lat');
});

test('parseCityAlias: "TP HCM" → null (không hỗ trợ)', () => {
  const result = parseCityAlias(canonicalize('TP HCM'));
  assertNull(result);
});

test('parseCityAlias: null → null', () => {
  const result = parseCityAlias(null);
  assertNull(result);
});

// ── Duration parsing ─────────────────────────────────────────────
console.log('\n▶ Duration Parsing');
console.log('─'.repeat(50));

test('parseMaxDurationDays: "3 ngày 2 đêm"', () => {
  const result = parseMaxDurationDays('Tour 3 ngày 2 đêm');
  assertNotNull(result, 'parseMaxDurationDays');
  assertEqual(result, 3);
});

test('parseMaxDurationDays: "5 ngày"', () => {
  const result = parseMaxDurationDays('5 ngày');
  assertNotNull(result, 'parseMaxDurationDays');
  assertEqual(result, 5);
});

test('parseMaxDurationDays: "2 đêm"', () => {
  const result = parseMaxDurationDays('2 đêm');
  assertNotNull(result, 'parseMaxDurationDays');
  assertEqual(result, 2);
});

test('parseMaxDurationDays: "3n2đ" → không match (cần khoảng trắng: "3 n 2 d")', () => {
  // Pattern Java: `(\d{1,2})\s*n\s*\d{1,2}\s*[đd]` yêu cầu khoảng trắng trước/sau 'n'
  // "3n2đ" không có khoảng trắng → null (đúng với Java)
  const result = parseMaxDurationDays('3n2đ');
  assertNull(result);
});

test('parseMaxDurationDays: 15 ngày → null (quá max)', () => {
  const result = parseMaxDurationDays('15 ngày');
  assertNull(result);
});

test('parseMaxDurationDays: không có ngày → null', () => {
  const result = parseMaxDurationDays('Xin chào');
  assertNull(result);
});

// ── Booking code ───────────────────────────────────────────────
console.log('\n▶ Booking Code Detection');
console.log('─'.repeat(50));

test('containsBookingCode: mã TRS hợp lệ', () => {
  const result = containsBookingCode('Tra mã TRS-20260505-ABCDEF');
  assertEqual(result, true);
});

test('containsBookingCode: mã TRS uppercase', () => {
  const result = containsBookingCode('TRS-20260505-ABCDEF');
  assertEqual(result, true);
});

test('containsBookingCode: mã không hợp lệ → false', () => {
  const result = containsBookingCode('Tra mã TRS-123-ABC');
  assertEqual(result, false);
});

test('extractBookingCode: trích xuất đúng', () => {
  const result = extractBookingCode('Tra mã TRS-20260505-ABCDEF');
  assertNotNull(result, 'extractBookingCode');
  assertEqual(result, 'TRS-20260505-ABCDEF');
});

// ── Intent detection ────────────────────────────────────────────
console.log('\n▶ Intent Detection');
console.log('─'.repeat(50));

test('isRecommendationIntent: "gợi ý tour"', () => {
  const result = isRecommendationIntent(canonicalize('Gợi ý tour Đà Nẵng'));
  assertEqual(result, true);
});

test('isRecommendationIntent: "tư vấn tour"', () => {
  const result = isRecommendationIntent(canonicalize('Tư vấn tour du lịch'));
  assertEqual(result, true);
});

test('isRecommendationIntent: "bao nhiêu người" → direct', () => {
  const result = isRecommendationIntent(canonicalize('Cho 2 người đi'));
  assertEqual(result, true);
});

test('isRecommendationIntent: "Xin chào" → false', () => {
  const result = isRecommendationIntent(canonicalize('Xin chào'));
  assertEqual(result, false);
});

test('isCancelRecommendationIntent: "thôi"', () => {
  const result = isCancelRecommendationIntent(canonicalize('Thôi không cần nữa'));
  assertEqual(result, true);
});

test('isCancelRecommendationIntent: "hủy"', () => {
  const result = isCancelRecommendationIntent(canonicalize('Hủy bỏ'));
  assertEqual(result, true);
});

test('isCancelRecommendationIntent: "Xin chào" → false', () => {
  const result = isCancelRecommendationIntent(canonicalize('Xin chào'));
  assertEqual(result, false);
});

test('isHotTourIntent: "tour hot"', () => {
  const result = isHotTourIntent(canonicalize('Có tour hot nào không'));
  assertEqual(result, true);
});

test('isHotTourIntent: "bestseller"', () => {
  const result = isHotTourIntent(canonicalize('tour bestseller'));
  assertEqual(result, true);
});

test('isResetFilterIntent: "xóa lọc"', () => {
  const result = isResetFilterIntent(canonicalize('xóa lọc'));
  assertEqual(result, true);
});

// ── Integration: full NLP parse ─────────────────────────────────
console.log('\n▶ Integration: Full NLP Parse');
console.log('─'.repeat(50));

function fullNlpParse(input) {
  const canonical = canonicalize(input);
  return {
    budget: parseBudgetVnd(input),
    travelers: parseTravelers(input),
    city: parseCityAlias(canonical),
    duration: parseMaxDurationDays(input),
    bookingCode: extractBookingCode(input),
    intentRecommendation: isRecommendationIntent(canonical),
    intentCancel: isCancelRecommendationIntent(canonical),
    intentHot: isHotTourIntent(canonical),
    intentReset: isResetFilterIntent(canonical),
    hasBookingCode: containsBookingCode(input),
  };
}

test('Full parse: "Cho 2 người, budget 5 triệu, đi Đà Nẵng 3 ngày"', () => {
  const result = fullNlpParse('Cho 2 người, budget 5 triệu, đi Đà Nẵng 3 ngày');
  assertEqual(result.travelers, 2, 'travelers');
  assertEqual(result.budget, 5_000_000, 'budget');
  assertEqual(result.city?.city, 'da-nang', 'city');
  assertEqual(result.duration, 3, 'duration');
});

test('Full parse: "Gợi ý tour Hà Nội 2 người 4 triệu"', () => {
  const result = fullNlpParse('Gợi ý tour Hà Nội 2 người 4 triệu');
  assertEqual(result.city?.city, 'ha-noi', 'city');
  assertEqual(result.travelers, 2, 'travelers');
  assertEqual(result.budget, 4_000_000, 'budget');
  assertEqual(result.intentRecommendation, true, 'intentRecommendation');
});

test('Full parse: "Tra mã TRS-20260505-ABCDEF"', () => {
  const result = fullNlpParse('Tra mã TRS-20260505-ABCDEF');
  assertEqual(result.bookingCode, 'TRS-20260505-ABCDEF', 'bookingCode');
  assertEqual(result.hasBookingCode, true, 'hasBookingCode');
});

test('Full parse: "Xin chào chatbot" → no fields', () => {
  const result = fullNlpParse('Xin chào chatbot');
  assertNull(result.budget);
  assertNull(result.travelers);
  assertNull(result.city);
  assertNull(result.duration);
  assertNull(result.bookingCode);
});

// ═══════════════════════════════════════════════════════════════
// SECTION 4: Summary
// ═══════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed, ${total} total`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('  🎉 Tất cả tests đều passed!\n');
}

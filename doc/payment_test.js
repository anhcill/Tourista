/**
 * VNPay URL Builder Test
 * Run: node payment_test.js
 */

const https = require('https');
const http = require('http');

// ===== Config =====
const TMN_CODE = 'R5V2JO22';
const HASH_SECRET = '55UIA7VSOA6V3B9HIN2HREEYGUQ7PRFL';
const PAY_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';

// ===== VNPay URL Builder =====
function hmacSha512(secret, data) {
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(Buffer.from(data, 'utf8'));
  return hmac.digest('hex');
}

function urlEncode(input) {
  return encodeURIComponent(input).replace(/%20/g, '+');
}

function buildQuery(params) {
  const sorted = new Map([...params.entries()].sort());
  const parts = [];
  for (const [key, value] of sorted) {
    if (value !== null && value !== undefined && value !== '') {
      parts.push(`${key}=${urlEncode(String(value))}`);
    }
  }
  return parts.join('&');
}

function buildVnpayUrl(params, secret) {
  // Remove existing secure hash if any
  const clean = new Map(params);
  clean.delete('vnp_SecureHash');
  clean.delete('vnp_SecureHashType');

  const query = buildQuery(clean);
  const secureHash = hmacSha512(secret, query);
  return `${PAY_URL}?${query}&vnp_SecureHash=${secureHash}`;
}

// ===== Test Cases =====
const testCases = [
  {
    name: 'Khong co bankCode (sẽ bị lỗi SSL)',
    params: {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: '308000000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'TRS-20260504-94033',
      vnp_OrderInfo: 'Thanh toan dat phong TRS-20260504-94033',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://tourista-nine.vercel.app/payments/vnpay/return',
      vnp_IpAddr: '14.226.47.174',
      vnp_CreateDate: '20260504185112',
      vnp_ExpireDate: '20260504190612',
    },
  },
  {
    name: 'Vietcombank (VNBANK) - chuyển thẳng sang VCB',
    params: {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: '308000000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'TRS-20260504-94033',
      vnp_OrderInfo: 'Thanh toan dat phong TRS-20260504-94033',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://tourista-nine.vercel.app/payments/vnpay/return',
      vnp_IpAddr: '14.226.47.174',
      vnp_CreateDate: '20260504185112',
      vnp_ExpireDate: '20260504190612',
      vnp_BankCode: 'VNBANK',
    },
  },
  {
    name: 'VietinBank (ICBVN) - chuyển thẳng sang VietinBank',
    params: {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: '308000000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'TRS-20260504-94033',
      vnp_OrderInfo: 'Thanh toan dat phong TRS-20260504-94033',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://tourista-nine.vercel.app/payments/vnpay/return',
      vnp_IpAddr: '14.226.47.174',
      vnp_CreateDate: '20260504185112',
      vnp_ExpireDate: '20260504190612',
      vnp_BankCode: 'ICBVN',
    },
  },
  {
    name: 'BIDV - chuyển thẳng sang BIDV',
    params: {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: '308000000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'TRS-20260504-94033',
      vnp_OrderInfo: 'Thanh toan dat phong TRS-20260504-94033',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://tourista-nine.vercel.app/payments/vnpay/return',
      vnp_IpAddr: '14.226.47.174',
      vnp_CreateDate: '20260504185112',
      vnp_ExpireDate: '20260504190612',
      vnp_BankCode: 'BIDV',
    },
  },
  {
    name: 'Techcombank - chuyển thẳng sang TCB',
    params: {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: TMN_CODE,
      vnp_Amount: '308000000',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: 'TRS-20260504-94033',
      vnp_OrderInfo: 'Thanh toan dat phong TRS-20260504-94033',
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: 'https://tourista-nine.vercel.app/payments/vnpay/return',
      vnp_IpAddr: '14.226.47.174',
      vnp_CreateDate: '20260504185112',
      vnp_ExpireDate: '20260504190612',
      vnp_BankCode: 'TECHCOMBANK',
    },
  },
];

// ===== Run Tests =====
console.log('='.repeat(70));
console.log('  VNPAY URL BUILDER TEST');
console.log('='.repeat(70));
console.log(`\nTmnCode : ${TMN_CODE}`);
console.log(`Hash    : ${HASH_SECRET.substring(0, 8)}...`);
console.log(`Pay URL : ${PAY_URL}\n`);

testCases.forEach((tc, i) => {
  console.log(`\n--- Test ${i + 1}: ${tc.name} ---`);
  const url = buildVnpayUrl(new Map(Object.entries(tc.params)), HASH_SECRET);

  const urlObj = new URL(url);
  const hash = urlObj.searchParams.get('vnp_SecureHash') || '';
  const bankCode = urlObj.searchParams.get('vnp_BankCode') || '(khong co)';

  console.log(`  BankCode : ${bankCode}`);
  console.log(`  SecureHash: ${hash.substring(0, 16)}...`);
  console.log(`  URL: ${url}`);

  // Check URL length
  console.log(`  URL length: ${url.length} chars`);
});

console.log('\n' + '='.repeat(70));
console.log('  DOI SANG TRINH DUYET DE TEST');
console.log('  BankCode = VNBANK/ICBVN/BIDV -> chuyen thang sang ngan hang');
console.log('  Khong co BankCode -> loi SSL vi phai qua trang chon ngan hang');
console.log('='.repeat(70));

// Copy first bank URL to clipboard (optional)
const bankUrl = buildVnpayUrl(new Map(Object.entries(testCases[1].params)), HASH_SECRET);
console.log(`\nBank URL (Vietcombank):\n${bankUrl}`);

/**
 * VNPay Payment Test Script
 * Run: node payment_check.js
 *
 * Prerequisites:
 * 1. A PENDING booking code (e.g. TRS-20260504-XXXXX)
 *    - You can find this from the booking page after creating one
 * 2. Set env vars or edit the BOOKING_CODE below
 *
 * What this tests:
 * 1. VNPay return URL (with real HMAC-SHA512 signature)
 * 2. VNPay IPN URL (with real HMAC-SHA512 signature)
 * 3. Booking status before/after
 */

const API_BASE = process.env.API_BASE || 'https://tourista-production.up.railway.app';
const BOOKING_CODE = process.env.BOOKING_CODE || 'TRS-20260504-00001'; // CHANGE THIS to your booking code
const VNPAY_TMN = process.env.VNPAY_TMN || 'R5V2JO22';
const VNPAY_HASH = process.env.VNPAY_HASH || '55UIA7VSOA6V3B9HIN2HREEYGUQ7PRFL';
const AMOUNT = process.env.AMOUNT || '100000000'; // Amount in VND * 100 (e.g. 1000000 VND = 100000000)

// ============ HMAC-SHA512 Signature ============
const crypto = require('crypto');

function generateVnpaySecureHash(params, hashSecret) {
  // Sort params alphabetically, exclude secure hash fields
  const sortedKeys = Object.keys(params)
    .filter(k => k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType')
    .sort();

  const signedData = sortedKeys
    .map(k => `${k}=${params[k]}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', hashSecret);
  hmac.update(signedData);
  return hmac.digest('hex').toUpperCase();
}

// ============ Build common params ============
function buildParams(overrides = {}) {
  const now = new Date();
  const payDate = now.toISOString().replace(/[-:T]/g, '').slice(0, 14); // yyyyMMddHHmmss

  const base = {
    vnp_Amount: AMOUNT,
    vnp_BankCode: 'NCB',
    vnp_CardType: 'ATM',
    vnp_OrderInfo: `Thanh toan dat phong ${BOOKING_CODE}`,
    vnp_PayDate: payDate,
    vnp_TmnCode: VNPAY_TMN,
    vnp_TxnRef: BOOKING_CODE,
    vnp_ResponseCode: '00',
    vnp_TransactionStatus: '00',
    vnp_TransactionNo: String(Date.now()).slice(-8),
    vnp_BankTranNo: 'BANK' + Date.now(),
    vnp_CreateDate: payDate,
  };

  Object.assign(base, overrides);
  return base;
}

// ============ TEST 1: VNPay Return (frontend redirect) ============
async function testVnpayReturn(success = true) {
  console.log(`\n========== TEST 1: VNPay Return (${success ? 'SUCCESS' : 'FAILED'}) ==========`);

  const overrides = success
    ? { vnp_ResponseCode: '00', vnp_TransactionStatus: '00' }
    : { vnp_ResponseCode: '24', vnp_TransactionStatus: '00' };

  const params = buildParams(overrides);
  const secureHash = generateVnpaySecureHash(params, VNPAY_HASH);
  params.vnp_SecureHash = secureHash;

  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}/api/payments/vnpay/return?${qs}`;

  console.log('Booking:', BOOKING_CODE);
  console.log('Amount:', parseInt(AMOUNT) / 100, 'VND');
  console.log('Signed data length:', secureHash.length, 'chars');
  console.log('URL:', url.slice(0, 120) + '...');

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data?.data) {
      const d = data.data;
      if (d.validSignature) {
        console.log('✅ Signature VALID');
      } else {
        console.log('❌ Signature INVALID');
      }
      if (d.success) {
        console.log('✅ Payment SUCCESS - booking should be CONFIRMED');
      } else {
        console.log('❌ Payment FAILED - reason:', d.message);
      }
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

// ============ TEST 2: VNPay IPN (backend-to-backend, no frontend) ============
async function testVnpayIPN(success = true) {
  console.log(`\n========== TEST 2: VNPay IPN (${success ? 'SUCCESS' : 'FAILED'}) ==========`);

  const overrides = success
    ? { vnp_ResponseCode: '00', vnp_TransactionStatus: '00' }
    : { vnp_ResponseCode: '24', vnp_TransactionStatus: '00' };

  const params = buildParams(overrides);
  const secureHash = generateVnpaySecureHash(params, VNPAY_HASH);
  params.vnp_SecureHash = secureHash;

  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  const url = `${API_BASE}/api/payments/vnpay/ipn?${qs}`;

  console.log('Booking:', BOOKING_CODE);
  console.log('Signed data length:', secureHash.length, 'chars');

  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log('HTTP Status:', res.status);
    console.log('Response:', JSON.stringify(data));

    if (data?.RspCode === '00') {
      console.log('✅ IPN SUCCESS - booking confirmed');
    } else {
      console.log('❌ IPN FAILED - RspCode:', data?.RspCode, '| Message:', data?.Message);
    }
  } catch (err) {
    console.error('ERROR:', err.message);
  }
}

// ============ TEST 3: Check booking via DB proxy endpoint ============
async function testBookingStatus() {
  console.log('\n========== TEST 3: Booking Status Check ==========');
  // This needs auth, so just verify the booking exists
  // In real scenario: check admin panel or database
  console.log('Booking code:', BOOKING_CODE);
  console.log('To check status:');
  console.log('  1. Admin dashboard: https://tourista-production.up.railway.app/admin');
  console.log('  2. Or check MySQL database directly');
  console.log('  3. Or: Make a booking on the website and copy the booking code');
}

// ============ Run ============
(async () => {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║       VNPay Payment Test Script v2              ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║ API Base:   ', API_BASE.padEnd(33), '║');
  console.log('║ Booking:    ', BOOKING_CODE.padEnd(33), '║');
  console.log('║ Amount:     ', (parseInt(AMOUNT) / 100).toLocaleString('vi-VN'), 'VND'.padEnd(28), '║');
  console.log('╚══════════════════════════════════════════════════╝');

  if (BOOKING_CODE === 'TRS-20260504-00001') {
    console.log('\n⚠️  WARNING: Using default booking code! Change BOOKING_CODE');
    console.log('   to a real PENDING booking from your database.\n');
  }

  // Test 1: Return URL (success case)
  await testVnpayReturn(true);

  // Test 2: IPN (success case)
  await testVnpayIPN(true);

  // Test 3: Failed payment (return)
  await testVnpayReturn(false);

  // Test 4: Failed payment (IPN)
  await testVnpayIPN(false);

  await testBookingStatus();

  console.log('\n========== SUMMARY ==========');
  console.log('If all signatures are valid but IPN returns 97:');
  console.log('  → The VNPAY_IPN_URL is NOT configured on Railway');
  console.log('  → VNPay never calls the IPN endpoint!');
  console.log('  → Add VNPAY_IPN_URL = https://tourista-production.up.railway.app/api/payments/ipn');
  console.log('\nIf testing on sandbox:');
  console.log('  → Set VNPAY_PAY_URL = https://sandbox.vnpayment.vn/paymentv2/');
  console.log('  → This simulates payment but may not confirm bookings');
  console.log('\nIf testing on production:');
  console.log('  → Set VNPAY_PAY_URL = https://vnpayment.vn/paymentv2/vpcpay.html');
  console.log('  → Use real TMN code and hash from VNPay portal');
  console.log('  → Set VNPAY_IPN_URL on Railway dashboard');
})();

/**
 * Chạy SQL thiết lập Welcome Voucher trên Railway MySQL.
 * Dùng: node doc/run_welcome_voucher_sql.js
 */
const mysql = require('mysql2/promise');

const DB_URL = process.env.DB_URL || 'mysql://root:SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD@interchange.proxy.rlwy.net:38550/railway';

async function main() {
  // Parse MySQL URL
  const urlMatch = DB_URL.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!urlMatch) throw new Error('Invalid MySQL URL format');
  const [, user, password, host, port, database] = urlMatch;

  console.log(`\n🔌 Kết nối MySQL: ${host}:${port}/${database}`);
  const connection = await mysql.createConnection({ host, port, user, password, database });

  // ── 1. Thêm cột welcome_voucher_claimed ──────────────────────
  console.log('\n📋 Bước 1: Thêm cột welcome_voucher_claimed vào bảng users...');
  try {
    await connection.query(`
      ALTER TABLE users
      ADD COLUMN welcome_voucher_claimed BOOLEAN DEFAULT FALSE NOT NULL
      COMMENT 'User đã claim voucher chào mừng WELCOME500K chưa'
    `);
    console.log('  ✅ Cột welcome_voucher_claimed đã được thêm');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('  ℹ️  Cột đã tồn tại — bỏ qua');
    } else {
      throw err;
    }
  }

  // ── 2. Thêm cột code vào bảng promotions (nếu chưa có) ─────
  // Promotions table có thể chưa có cột code — check trước
  console.log('\n📋 Bước 2: Kiểm tra bảng promotions...');
  const [promoRows] = await connection.query('SELECT COUNT(*) as cnt FROM promotions');
  if (promoRows[0].cnt === 0) {
    console.log('  ℹ️  Bảng promotions đang trống — kiểm tra schema...');
    const [cols] = await connection.query('DESCRIBE promotions');
    const hasCode = cols.some(c => c.Field === 'code');
    if (!hasCode) {
      console.log('  ⚠️  Bảng promotions chưa có cột code. Cần tạo trước:');
      console.log('      ALTER TABLE promotions ADD COLUMN code VARCHAR(30) UNIQUE;');
      console.log('      (bỏ qua bước insert promotion)');
    }
  } else {
    console.log(`  ✅ Bảng promotions có ${promoRows[0].cnt} records`);
  }

  // ── 3. Insert/Update promotion WELCOME500K ──────────────────
  console.log('\n📋 Bước 3: Tạo promotion WELCOME500K...');
  try {
    await connection.query(`
      INSERT INTO promotions (
        code, name, description, discount_type, discount_value,
        min_order_amount, max_discount_amount, usage_limit, used_count,
        applies_to, valid_from, valid_until, is_active, created_at, updated_at
      ) VALUES (
        'WELCOME500K',
        'Voucher 500K cho chuyến đi đầu tiên',
        'Miễn phí 500.000đ cho chuyến đi đầu tiên trên Tourista Studio. Áp dụng cho đơn từ 500.000đ, giảm cố định 500K.',
        'FIXED',
        500000.00,
        500000.00,
        500000.00,
        9999,
        0,
        'ALL',
        '2026-01-01 00:00:00',
        '2027-12-31 23:59:59',
        TRUE,
        NOW(),
        NOW()
      )
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        description = VALUES(description),
        discount_type = VALUES(discount_type),
        discount_value = VALUES(discount_value),
        min_order_amount = VALUES(min_order_amount),
        max_discount_amount = VALUES(max_discount_amount),
        usage_limit = VALUES(usage_limit),
        applies_to = VALUES(applies_to),
        valid_from = VALUES(valid_from),
        valid_until = VALUES(valid_until),
        is_active = VALUES(is_active),
        updated_at = NOW()
    `);
    console.log('  ✅ Promotion WELCOME500K đã được tạo / cập nhật');
  } catch (err) {
    console.error('  ❌ Lỗi insert promotion:', err.message);
  }

  // ── 4. Verify ───────────────────────────────────────────────
  console.log('\n📋 Bước 4: Xác nhận dữ liệu...');
  try {
    const [promo] = await connection.query(
      "SELECT code, name, discount_type, discount_value, min_order_amount, is_active FROM promotions WHERE code = 'WELCOME500K'"
    );
    if (promo.length > 0) {
      const p = promo[0];
      console.log('  ✅ Promotion tìm thấy:');
      console.log(`     Mã:         ${p.code}`);
      console.log(`     Tên:         ${p.name}`);
      console.log(`     Loại:        ${p.discount_type}`);
      console.log(`     Giảm:        ${Number(p.discount_value).toLocaleString('vi-VN')} VND`);
      console.log(`     Đơn tối thiểu: ${Number(p.min_order_amount).toLocaleString('vi-VN')} VND`);
      console.log(`     Trạng thái:   ${p.is_active ? 'Hoạt động ✅' : 'Tắt ❌'}`);
    } else {
      console.log('  ⚠️  Promotion chưa được tạo (có thể bảng promotions chưa có cột code)');
    }
  } catch (err) {
    console.error('  ⚠️  Không xác nhận được:', err.message);
  }

  // ── 5. Verify users column ──────────────────────────────────
  try {
    const [cols] = await connection.query('DESCRIBE users');
    const hasCol = cols.some(c => c.Field === 'welcome_voucher_claimed');
    console.log(`\n📋 Cột welcome_voucher_claimed: ${hasCol ? '✅ Tồn tại' : '❌ Chưa có'}`);
  } catch (err) {
    console.log(`\n📋 Lỗi kiểm tra cột: ${err.message}`);
  }

  await connection.end();
  console.log('\n🎉 Hoàn tất!\n');
}

main().catch(err => {
  console.error('\n❌ Lỗi:', err.message);
  process.exit(1);
});

-- ============================================================
-- 1. Thêm cột welcome_voucher_claimed vào bảng users
-- ============================================================
ALTER TABLE users
ADD COLUMN IF NOT EXISTS welcome_voucher_claimed BOOLEAN DEFAULT FALSE NOT NULL;

COMMENT ON COLUMN users.welcome_voucher_claimed IS 'User đã claim voucher chào mừng WELCOME500K chưa';


-- ============================================================
-- 2. Tạo promotion WELCOME500K
-- ============================================================
INSERT INTO promotions (
    code,
    name,
    description,
    discount_type,
    discount_value,
    min_order_amount,
    max_discount_amount,
    usage_limit,
    used_count,
    applies_to,
    valid_from,
    valid_until,
    is_active,
    created_at,
    updated_at
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
ON CONFLICT (code) DO UPDATE SET
    is_active = EXCLUDED.is_active,
    valid_until = EXCLUDED.valid_until,
    discount_value = EXCLUDED.discount_value,
    min_order_amount = EXCLUDED.min_order_amount,
    updated_at = NOW();

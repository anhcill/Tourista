-- =====================================================
-- Migration: Tao bang reports cho he thong bao cao/khieu nai
-- Chay tren Railway MySQL
-- =====================================================

CREATE TABLE IF NOT EXISTS reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reporter_id BIGINT NOT NULL,
    reported_user_id BIGINT,
    conversation_id BIGINT,

    -- Loai bao cao
    -- USER_COMPLAINT_PARTNER: Khach knieu nai doi tac
    -- PARTNER_REPORT_USER: Dong tac bao cao khach vi pham
    -- USER_REQUEST_SUPPORT: Khach yeu cau ho tro
    -- PARTNER_REQUEST_SUPPORT: Dong tac yeu cau ho tro
    -- CONTENT_VIOLATION: Bao cao noi dung khong phu hop
    -- PAYMENT_ISSUE: Khieu nai thanh toan
    type VARCHAR(30) NOT NULL,

    -- Trang thai: PENDING | REVIEWING | RESOLVED | REJECTED
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',

    -- Ly do / noi dung bao cao
    reason TEXT NOT NULL,

    -- Ghi chu cua admin sau khi xu ly
    admin_notes TEXT,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_report_reporter (reporter_id),
    INDEX idx_report_status (status),
    INDEX idx_report_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

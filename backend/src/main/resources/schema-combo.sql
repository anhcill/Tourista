-- =========================================================
-- Combo Packages table
-- Tourista Studio
-- =========================================================
CREATE TABLE IF NOT EXISTS combo_packages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),

    -- Combo type: HOTEL_PLUS_TOUR | MULTI_HOTEL | MULTI_TOUR | HOTEL_AIRPORT_TRANSFER | TOUR_BUNDLE
    combo_type VARCHAR(30) NOT NULL DEFAULT 'HOTEL_PLUS_TOUR',

    -- Primary items
    hotel_id BIGINT,
    tour_id BIGINT,

    -- Secondary items (for MULTI_HOTEL, MULTI_TOUR, TOUR_BUNDLE)
    second_hotel_id BIGINT,
    second_tour_id BIGINT,

    -- Validity period
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,

    -- Slot management
    total_slots INT NOT NULL DEFAULT 50,
    remaining_slots INT NOT NULL DEFAULT 50,

    -- Pricing
    original_price DECIMAL(14, 2) NOT NULL,
    combo_price DECIMAL(14, 2) NOT NULL,
    savings_amount DECIMAL(14, 2),
    savings_percent INT,

    -- Flags
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_combo_active_dates (is_active, valid_from, valid_until),
    INDEX idx_combo_type (combo_type),
    INDEX idx_combo_featured (is_featured, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Booking Combos table (individual combo bookings)
-- =========================================================
CREATE TABLE IF NOT EXISTS booking_combos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    combo_package_id BIGINT UNSIGNED NOT NULL,

    -- Guest info
    guest_name VARCHAR(100) NOT NULL,
    guest_email VARCHAR(100) NOT NULL,
    guest_phone VARCHAR(20),

    -- Booking details
    booking_date DATE NOT NULL,
    guest_count INT NOT NULL DEFAULT 1,
    nights INT NOT NULL DEFAULT 1,

    -- Pricing
    total_amount DECIMAL(14, 2) NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(30),

    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT fk_booking_combo_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_combo_package FOREIGN KEY (combo_package_id)
        REFERENCES combo_packages(id) ON DELETE RESTRICT,

    INDEX idx_booking_combo_package (combo_package_id),
    INDEX idx_booking_combo_status (payment_status),
    INDEX idx_booking_combo_date (booking_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================
-- Audit log extension: COMBO actions
-- (already handled by audit_logs table, just ensure it covers COMBO)
-- =========================================================

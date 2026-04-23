-- ============================================================
-- HƯỚNG DẪN IMPORT THỦ CÔNG QUA phpmyadmin
-- ============================================================

-- 1. Chạy BƯỚC 1-2 TRONG SQL (tạo bảng staging + thêm cities)
-- ============================================================

USE tourista;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET SQL_SAFE_UPDATES = 0;

-- Thêm cities thiếu
INSERT IGNORE INTO cities (country_id, name_vi, name_en, slug, is_popular) VALUES
(1, 'Đà Lạt',    'Da Lat',    'da-lat',    TRUE),
(1, 'Vũng Tàu',  'Vung Tau',  'vung-tau',  TRUE),
(1, 'Huế',        'Hue',       'hue',        TRUE);

-- Tạo bảng staging
DROP TABLE IF EXISTS stg_hotels_reviews_csv;
CREATE TABLE stg_hotels_reviews_csv (
    row_no           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    url_hotel        VARCHAR(800),
    location_raw     VARCHAR(200),
    hotel_source_id BIGINT,
    hotel_name       VARCHAR(255),
    hotel_description TEXT,
    hotel_address    VARCHAR(500),
    user_source_id  BIGINT,
    user_name       VARCHAR(150),
    rating_raw      DECIMAL(4,2),
    PRIMARY KEY (row_no),
    INDEX idx_stg_hotel_source_id (hotel_source_id),
    INDEX idx_stg_user_source_id  (user_source_id)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- 2. IMPORT CSV THỦ CÔNG QUA phpmyadmin UI
-- ============================================================
-- Trong phpMyAdmin:
-- - Chọn database "tourista"
-- - Chọn bảng "stg_hotels_reviews_csv"
-- - Click tab "Import"
-- - Chọn file: C:\xampp\htdocs\Tourista\data\hotels_users_ratings.csv
-- - Format: CSV
-- - "Columns separated with": ,
-- - "Columns enclosed with": "
-- - "Lines terminated with": auto
-- - BỎ TICK "First row as column names" (vì đã có AUTO_INCREMENT)
-- - Click "Go"

-- ============================================================
-- 3. SAU KHI IMPORT CSV XONG - CHẠY PHẦN CÒN LẠI
-- ============================================================

-- Chuẩn hóa dữ liệu
UPDATE stg_hotels_reviews_csv SET
    location_raw = NULLIF(TRIM(location_raw), ''),
    hotel_name = NULLIF(TRIM(hotel_name), ''),
    hotel_description = NULLIF(TRIM(hotel_description), ''),
    hotel_address = NULLIF(TRIM(hotel_address), ''),
    user_name = NULLIF(TRIM(user_name), ''),
    url_hotel = NULLIF(TRIM(url_hotel), '')
WHERE row_no > 0;

UPDATE stg_hotels_reviews_csv
SET rating_raw = LEAST(5, GREATEST(1, COALESCE(rating_raw, 0)))
WHERE row_no > 0 AND rating_raw IS NOT NULL;

START TRANSACTION;

-- Tạo bảng mapping
CREATE TABLE IF NOT EXISTS import_hotel_source_map (
    source_hotel_id BIGINT NOT NULL,
    hotel_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_hotel_id),
    KEY idx_ihsm_hotel_id (hotel_id)
) ENGINE=InnoDB;

-- Tạo virtual users
INSERT INTO users (
    email, password_hash, full_name, role_id,
    status, is_email_verified, failed_attempts,
    auth_provider, provider_id, created_at, updated_at
)
SELECT
    CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local') AS email,
    NULL AS password_hash,
    COALESCE(s.user_name, CONCAT('User ', s.user_source_id)) AS full_name,
    r.id AS role_id,
    'ACTIVE' AS status,
    TRUE AS is_email_verified,
    0 AS failed_attempts,
    'LOCAL' AS auth_provider,
    CONCAT('CSV:', CAST(s.user_source_id AS CHAR)) AS provider_id,
    NOW(), NOW()
FROM (
    SELECT DISTINCT user_source_id, user_name
    FROM stg_hotels_reviews_csv WHERE user_source_id IS NOT NULL
) s
JOIN roles r ON r.name = 'USER'
LEFT JOIN users u ON u.email = CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local')
WHERE u.id IS NULL;

-- Insert hotels
INSERT INTO hotels (
    city_id, name, slug, description, address,
    star_rating, avg_rating, review_count,
    check_in_time, check_out_time,
    website, is_featured, is_trending, is_active,
    created_at, updated_at
)
SELECT
    c.id AS city_id,
    LEFT(s.hotel_name, 200) AS name,
    LEFT(CONCAT(
        LOWER(REGEXP_REPLACE(COALESCE(s.hotel_name, 'hotel'), '[^a-zA-Z0-9]+', '-')),
        '-', CAST(s.hotel_source_id AS CHAR)
    ), 220) AS slug,
    LEFT(COALESCE(s.hotel_description, 'Khach san duoc import tu CSV.'), 255) AS description,
    LEFT(COALESCE(s.hotel_address, CONCAT('Dia chi dang cap nhat - ', COALESCE(s.location_raw, 'Viet Nam'))), 255) AS address,
    3 AS star_rating, 0.00 AS avg_rating, 0 AS review_count,
    '14:00:00' AS check_in_time, '12:00:00' AS check_out_time,
    LEFT(NULLIF(s.url_hotel, ''), 255) AS website,
    FALSE AS is_featured, FALSE AS is_trending, TRUE AS is_active,
    NOW(), NOW()
FROM (
    SELECT hotel_source_id,
        MAX(hotel_name) AS hotel_name,
        MAX(hotel_description) AS hotel_description,
        MAX(hotel_address) AS hotel_address,
        MAX(location_raw) AS location_raw,
        MAX(url_hotel) AS url_hotel
    FROM stg_hotels_reviews_csv
    WHERE hotel_source_id IS NOT NULL AND hotel_name IS NOT NULL
    GROUP BY hotel_source_id
) s
JOIN cities c ON LOWER(c.name_vi) = LOWER(s.location_raw) OR LOWER(c.name_en) = LOWER(s.location_raw)
LEFT JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
WHERE m.source_hotel_id IS NULL;

-- Map hotels
INSERT IGNORE INTO import_hotel_source_map (source_hotel_id, hotel_id)
SELECT s.hotel_source_id, h.id
FROM (
    SELECT hotel_source_id,
        CONCAT(
            LOWER(REGEXP_REPLACE(COALESCE(MAX(hotel_name), 'hotel'), '[^a-zA-Z0-9]+', '-')),
            '-', CAST(hotel_source_id AS CHAR)
        ) AS expected_slug
    FROM stg_hotels_reviews_csv
    WHERE hotel_source_id IS NOT NULL AND hotel_name IS NOT NULL
    GROUP BY hotel_source_id
) s
JOIN hotels h ON h.slug = s.expected_slug;

-- Insert reviews
INSERT INTO reviews (
    user_id, booking_id, target_type, target_id,
    overall_rating, title, comment,
    is_verified, is_published, created_at, updated_at
)
SELECT
    u.id AS user_id, NULL AS booking_id, 'HOTEL' AS target_type, m.hotel_id AS target_id,
    CAST(ROUND(COALESCE(s.rating_raw, 1), 0) AS UNSIGNED) AS overall_rating,
    NULL AS title,
    CONCAT('Danh gia import: ', COALESCE(SUBSTRING(s.hotel_description, 1, 500), 'Trai nghiem tot.')) AS comment,
    FALSE AS is_verified, TRUE AS is_published, NOW(), NOW()
FROM stg_hotels_reviews_csv s
JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
JOIN users u ON u.email = CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local')
LEFT JOIN reviews r ON r.user_id = u.id AND r.target_type = 'HOTEL' AND r.target_id = m.hotel_id
WHERE s.rating_raw BETWEEN 1 AND 5 AND r.id IS NULL;

-- Thêm cover images
INSERT IGNORE INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order, created_at)
SELECT
    h.id,
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80' AS url,
    h.name AS alt_text, TRUE AS is_cover, 0 AS sort_order, NOW() AS created_at
FROM hotels h
LEFT JOIN hotel_images hi ON hi.hotel_id = h.id AND hi.is_cover = TRUE
WHERE hi.id IS NULL;

COMMIT;

-- Thống kê kết quả
SELECT 'hotels' AS metric, COUNT(*) AS value FROM hotels
UNION ALL SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL SELECT 'virtual_users', COUNT(*) FROM users WHERE email LIKE 'csvu_%@import.local';

SET SQL_SAFE_UPDATES = 1;

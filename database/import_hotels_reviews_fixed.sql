-- ============================================================
-- TOURISTA - Import Hotels + Reviews từ CSV (PHIÊN BẢN ĐÃ SỬA LỖI)
-- ============================================================
--
-- HƯỚNG DẪN CHẠY (dùng phpMyAdmin - không cần LOAD DATA):
-- ─────────────────────────────────────────────────────────
-- Bước 1: Chạy file add_missing_cities.sql trước
-- Bước 2: Vào phpMyAdmin → Database "tourista"
-- Bước 3: Chạy từ dòng 14 đến 120 (tạo bảng staging)
-- Bước 4: Import CSV vào bảng stg_hotels_reviews_csv:
--           → Chọn bảng stg_hotels_reviews_csv → tab "Import"
--           → Chọn file CSV, format = CSV, "Tên cột trong hàng đầu tiên": BỎ TÍCH
--           → MÁP CỘT THEO THỨ TỰ (bỏ qua cột row_no - tự tăng)
-- Bước 5: Chạy phần còn lại (từ dòng 125 trở đi)
-- ─────────────────────────────────────────────────────────
--
-- Cột CSV: URL Hotel, Location, HotelID, Name Hotel, Descriptions, Address, UserID, User, Rating
-- Map vào : url_hotel, location_raw, hotel_source_id, hotel_name, hotel_description,
--           hotel_address, user_source_id, user_name, rating_raw
-- ============================================================

USE tourista;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET SQL_SAFE_UPDATES = 0;

-- ============================================================
-- BƯỚC 1: Tạo bảng staging (xoá cũ nếu tồn tại)
-- ============================================================
DROP TABLE IF EXISTS stg_hotels_reviews_csv;
CREATE TABLE stg_hotels_reviews_csv (
    row_no           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    url_hotel        VARCHAR(800),
    location_raw     VARCHAR(200),
    hotel_source_id  BIGINT,
    hotel_name       VARCHAR(255),
    hotel_description TEXT,
    hotel_address    VARCHAR(500),
    user_source_id   BIGINT,
    user_name        VARCHAR(150),
    rating_raw       DECIMAL(4,2),
    PRIMARY KEY (row_no),
    INDEX idx_stg_hotel_source_id (hotel_source_id),
    INDEX idx_stg_user_source_id  (user_source_id),
    INDEX idx_stg_location        (location_raw(100))
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================================
-- BƯỚC 2: <<< DỪNG LẠI ĐÂY - IMPORT CSV VÀO stg_hotels_reviews_csv >>>
-- Dùng phpMyAdmin → Chọn bảng stg_hotels_reviews_csv → Import
-- Chọn định dạng: CSV
-- Bỏ tích "Hàng đầu tiên là tên cột" (cột đã đúng thứ tự)
-- Sau khi import xong → tiếp tục chạy từ BƯỚC 3 trở đi
-- ============================================================

-- (Hoặc nếu dùng MySQL CLI với local-infile được bật, bỏ comment dòng dưới:)
-- LOAD DATA LOCAL INFILE 'C:/Users/ducan/Downloads/hotels_users_ratings.csv'
-- INTO TABLE stg_hotels_reviews_csv
-- CHARACTER SET utf8mb4
-- FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
-- LINES TERMINATED BY '\r\n'          -- <<< Windows cần \r\n
-- IGNORE 1 LINES                       -- <<< bỏ dòng header
-- (`url_hotel`,`location_raw`,`hotel_source_id`,`hotel_name`,`hotel_description`,
--  `hotel_address`,`user_source_id`,`user_name`,`rating_raw`);

-- ============================================================
-- BƯỚC 3: Kiểm tra dữ liệu staging (chạy để verify)
-- ============================================================
SELECT COUNT(*) AS total_rows FROM stg_hotels_reviews_csv;
SELECT * FROM stg_hotels_reviews_csv LIMIT 5;

-- ============================================================
-- BƯỚC 4: Chuẩn hóa dữ liệu staging
-- ============================================================
UPDATE stg_hotels_reviews_csv
SET
    location_raw      = NULLIF(TRIM(location_raw), ''),
    hotel_name        = NULLIF(TRIM(hotel_name), ''),
    hotel_description = NULLIF(TRIM(hotel_description), ''),
    hotel_address     = NULLIF(TRIM(hotel_address), ''),
    user_name         = NULLIF(TRIM(user_name), ''),
    url_hotel         = NULLIF(TRIM(url_hotel), '')
WHERE row_no > 0;

-- Rating phải nằm trong [1, 5]
UPDATE stg_hotels_reviews_csv
SET rating_raw = LEAST(5, GREATEST(1, COALESCE(rating_raw, 0)))
WHERE row_no > 0 AND rating_raw IS NOT NULL;

-- ============================================================
-- KIỂM TRA: Xem có location nào không map được với cities không
-- (Nếu ra kết quả → cần thêm city hoặc sửa tên)
-- ============================================================
SELECT DISTINCT location_raw, COUNT(*) AS so_dong
FROM stg_hotels_reviews_csv s
LEFT JOIN cities c
    ON LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
    OR LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
WHERE s.location_raw IS NOT NULL AND c.id IS NULL
GROUP BY s.location_raw;

-- ============================================================
-- Sau khi xem kết quả kiểm tra ở trên, nếu ổn thì TIẾP TỤC:
-- ============================================================

START TRANSACTION;

-- ============================================================
-- BƯỚC 5: Đảm bảo role USER tồn tại
-- ============================================================
INSERT INTO roles (name, description)
SELECT 'USER', 'Nguoi dung thong thuong'
WHERE NOT EXISTS (
    SELECT 1 FROM roles
    WHERE name COLLATE utf8mb4_unicode_ci = 'USER'
);

-- ============================================================
-- BƯỚC 6: Tạo bảng mapping (idempotent)
-- ============================================================
CREATE TABLE IF NOT EXISTS import_hotel_source_map (
    source_hotel_id BIGINT       NOT NULL,
    hotel_id        BIGINT UNSIGNED NOT NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_hotel_id),
    KEY idx_ihsm_hotel_id (hotel_id),
    CONSTRAINT fk_ihsm_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- BƯỚC 7: Tạo user ảo từ CSV
-- ============================================================
INSERT INTO users (
    email, password_hash, full_name, role_id,
    status, is_email_verified, failed_attempts,
    auth_provider, provider_id,
    created_at, updated_at
)
SELECT
    CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local') AS email,
    NULL  AS password_hash,
    COALESCE(s.user_name, CONCAT('User ', s.user_source_id))         AS full_name,
    r.id  AS role_id,
    'ACTIVE' AS status,
    TRUE  AS is_email_verified,
    0     AS failed_attempts,   -- << fix lỗi 1364: cột NOT NULL không có DEFAULT
    'LOCAL' AS auth_provider,
    CONCAT('CSV:', CAST(s.user_source_id AS CHAR)) AS provider_id,
    NOW(), NOW()
FROM (
    SELECT DISTINCT user_source_id, user_name
    FROM stg_hotels_reviews_csv
    WHERE user_source_id IS NOT NULL
) s
JOIN roles r ON r.name = 'USER'
LEFT JOIN users u
    ON u.email COLLATE utf8mb4_unicode_ci
     = CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local')
WHERE u.id IS NULL;

-- ============================================================
-- BƯỚC 8: Insert hotels mới (theo city match)
-- ============================================================
INSERT INTO hotels (
    city_id, name, slug, description, address,
    star_rating, avg_rating, review_count,
    check_in_time, check_out_time,
    phone, email, website,
    is_featured, is_trending, is_active,
    created_at, updated_at
)
SELECT
    c.id AS city_id,
    LEFT(s.hotel_name, 200)                                                         AS name,
    -- slug = ten-khach-san-slugified-sourceId (cắt tối đa 220 ký tự)
    LEFT(CONCAT(
        LOWER(REGEXP_REPLACE(COALESCE(s.hotel_name, 'hotel'), '[^a-zA-Z0-9]+', '-')),
        '-', CAST(s.hotel_source_id AS CHAR)
    ), 220)                                                                          AS slug,
    LEFT(COALESCE(s.hotel_description, 'Khach san duoc import tu CSV.'), 255)       AS description,
    LEFT(COALESCE(s.hotel_address,
        CONCAT('Dia chi dang cap nhat - ', COALESCE(s.location_raw, 'Viet Nam'))
    ), 255)                                                                          AS address,
    3    AS star_rating,
    0.00 AS avg_rating,
    0    AS review_count,
    '14:00:00' AS check_in_time,
    '12:00:00' AS check_out_time,
    NULL AS phone,
    NULL AS email,
    LEFT(NULLIF(s.url_hotel, ''), 255)                                               AS website,
    FALSE AS is_featured,
    FALSE AS is_trending,
    TRUE  AS is_active,
    NOW(), NOW()
FROM (
    SELECT
        hotel_source_id,
        MAX(hotel_name)        AS hotel_name,
        MAX(hotel_description) AS hotel_description,
        MAX(hotel_address)     AS hotel_address,
        MAX(location_raw)      AS location_raw,
        MAX(url_hotel)         AS url_hotel
    FROM stg_hotels_reviews_csv
    WHERE hotel_source_id IS NOT NULL
      AND hotel_name IS NOT NULL
    GROUP BY hotel_source_id
) s
JOIN cities c
    ON  LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
    OR  LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
LEFT JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
WHERE m.source_hotel_id IS NULL;

-- ============================================================
-- BƯỚC 9: Ghi map source_id → hotel_id
-- ============================================================
INSERT IGNORE INTO import_hotel_source_map (source_hotel_id, hotel_id)
SELECT
    s.hotel_source_id,
    h.id
FROM (
    SELECT
        hotel_source_id,
        LEFT(CONCAT(
            LOWER(REGEXP_REPLACE(COALESCE(MAX(hotel_name), 'hotel'), '[^a-zA-Z0-9]+', '-')),
            '-', CAST(hotel_source_id AS CHAR)
        ), 220) AS expected_slug
    FROM stg_hotels_reviews_csv
    WHERE hotel_source_id IS NOT NULL AND hotel_name IS NOT NULL
    GROUP BY hotel_source_id
) s
JOIN hotels h ON h.slug = s.expected_slug
LEFT JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
WHERE m.source_hotel_id IS NULL;

-- ============================================================
-- BƯỚC 10: Insert reviews
-- ============================================================
INSERT INTO reviews (
    user_id, booking_id, target_type, target_id,
    overall_rating, title, comment,
    is_verified, is_published,
    admin_reply, admin_replied_at,
    created_at, updated_at
)
SELECT
    u.id   AS user_id,
    NULL   AS booking_id,
    'HOTEL' AS target_type,
    m.hotel_id AS target_id,
    -- Rating từ CSV là 1-5, dùng trực tiếp
    CAST(ROUND(COALESCE(s.rating_raw, 1), 0) AS UNSIGNED) AS overall_rating,
    NULL   AS title,
    CONCAT('Danh gia import: ',
        COALESCE(SUBSTRING(s.hotel_description, 1, 500), 'Trai nghiem tot.')
    ) AS comment,
    FALSE AS is_verified,
    TRUE  AS is_published,
    NULL AS admin_reply,
    NULL AS admin_replied_at,
    NOW(), NOW()
FROM stg_hotels_reviews_csv s
JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
JOIN users u
    ON u.email COLLATE utf8mb4_unicode_ci
     = CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local')
LEFT JOIN reviews r
    ON  r.user_id      = u.id
    AND r.target_type  = 'HOTEL'
    AND r.target_id    = m.hotel_id
    AND r.overall_rating = CAST(ROUND(COALESCE(s.rating_raw, 1), 0) AS UNSIGNED)
WHERE s.rating_raw BETWEEN 1 AND 5
  AND r.id IS NULL;

-- ============================================================
-- BƯỚC 11: Thêm ảnh cover cho hotel chưa có
-- ============================================================
CREATE TABLE IF NOT EXISTS import_city_image_pool (
    city_key  VARCHAR(120) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    PRIMARY KEY (city_key, image_url)
) ENGINE=InnoDB;

INSERT IGNORE INTO import_city_image_pool (city_key, image_url) VALUES
('ha noi',          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'),
('hanoi',           'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80'),
('ho chi minh',     'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80'),
('hcm',             'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80'),
('da nang',         'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80'),
('nha trang',       'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80'),
('phu quoc',        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80'),
('da lat',          'https://images.unsplash.com/photo-1502784444185-1f263f7f4e1e?w=1200&q=80'),
('dalat',           'https://images.unsplash.com/photo-1502784444185-1f263f7f4e1e?w=1200&q=80'),
('hoi an',          'https://images.unsplash.com/photo-1518544866330-4e48b2ca6e44?w=1200&q=80'),
('hue',             'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200&q=80'),
('vung tau',        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80'),
('ha long',         'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80'),
('sapa',            'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1200&q=80'),
('can tho',         'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80'),
('quy nhon',        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80'),
('phan thiet',      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80');

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order, created_at)
SELECT
    h.id,
    COALESCE(
        p.image_url,
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80'
    ) AS url,
    h.name AS alt_text,
    TRUE   AS is_cover,
    0      AS sort_order,
    NOW()  AS created_at
FROM hotels h
LEFT JOIN cities c ON c.id = h.city_id
LEFT JOIN import_city_image_pool p
    ON  LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(p.city_key COLLATE utf8mb4_unicode_ci)
    OR  LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(p.city_key COLLATE utf8mb4_unicode_ci)
LEFT JOIN hotel_images hi ON hi.hotel_id = h.id AND hi.is_cover = TRUE
WHERE hi.id IS NULL;

COMMIT;

-- ============================================================
-- BƯỚC 12: Thống kê kết quả sau import
-- ============================================================
SELECT 'hotels_total'       AS metric, COUNT(*) AS value FROM hotels
UNION ALL
SELECT 'reviews_total',       COUNT(*) FROM reviews
UNION ALL
SELECT 'virtual_users',       COUNT(*) FROM users WHERE email LIKE 'csvu_%@import.local'
UNION ALL
SELECT 'hotels_with_cover',   COUNT(*) FROM hotel_images WHERE is_cover = TRUE
UNION ALL
SELECT 'hotels_no_cover',     COUNT(*)
    FROM hotels h
    LEFT JOIN hotel_images hi ON hi.hotel_id = h.id AND hi.is_cover = TRUE
    WHERE hi.id IS NULL;

-- Các location chưa map được city (nên = 0 dòng sau khi thêm city đủ)
SELECT DISTINCT location_raw AS 'Location chua map duoc'
FROM stg_hotels_reviews_csv s
LEFT JOIN cities c
    ON  LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
    OR  LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
WHERE s.location_raw IS NOT NULL AND c.id IS NULL
LIMIT 50;

SET SQL_SAFE_UPDATES = 1;

-- ============================================================
-- TOURISTA - Import Hotels + Reviews from 1 CSV (large dataset)
-- Purpose:
--   1) Import hotel + rating data from a single CSV into staging
--   2) Create virtual users from UserID/User columns
--   3) Upsert hotels
--   4) Insert reviews (rating 1-5)
--   5) Auto-assign cover images by location (demo-safe placeholders)
--
-- Expected CSV headers:
--   URL Hotel, Location, HotelID, Name Hotel, Descriptions, Address, UserID, User, Rating
-- ============================================================

USE tourista;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET collation_connection = 'utf8mb4_unicode_ci';
SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;

-- ------------------------------------------------------------
-- 0) Ensure USER role exists (id may vary across environments)
-- ------------------------------------------------------------
INSERT INTO roles (name, description)
SELECT 'USER', 'Nguoi dung thong thuong'
WHERE NOT EXISTS (
    SELECT 1
    FROM roles
    WHERE name COLLATE utf8mb4_unicode_ci = 'USER' COLLATE utf8mb4_unicode_ci
);

-- ------------------------------------------------------------
-- 1) Staging table (raw CSV)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS stg_hotels_reviews_csv;
CREATE TABLE stg_hotels_reviews_csv (
    row_no BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    url_hotel VARCHAR(800),
    location_raw VARCHAR(200),
    hotel_source_id BIGINT,
    hotel_name VARCHAR(255),
    hotel_description TEXT,
    hotel_address VARCHAR(500),
    user_source_id BIGINT,
    user_name VARCHAR(150),
    rating_raw DECIMAL(4,2),
    PRIMARY KEY (row_no),
    INDEX idx_stg_hotel_source_id (hotel_source_id),
    INDEX idx_stg_user_source_id (user_source_id),
    INDEX idx_stg_location (location_raw)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2) LOAD CSV into staging
-- ------------------------------------------------------------
-- Option A: Use MySQL CLI / Workbench (recommended for large files)
-- Replace file path below with your real CSV path.
LOAD DATA LOCAL INFILE 'C:/Users/ducan/Downloads/archive (1)/hotels_users_ratings.csv'
INTO TABLE stg_hotels_reviews_csv
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(`url_hotel`,`location_raw`,`hotel_source_id`,`hotel_name`,`hotel_description`,`hotel_address`,`user_source_id`,`user_name`,`rating_raw`);

-- Option B: If using phpMyAdmin import UI, import directly into stg_hotels_reviews_csv
-- with matching column order and skip the LOAD DATA statement.

-- ------------------------------------------------------------
-- 3) Normalize quick fixes in staging
-- ------------------------------------------------------------
UPDATE stg_hotels_reviews_csv
SET
    location_raw = NULLIF(TRIM(location_raw), ''),
    hotel_name = NULLIF(TRIM(hotel_name), ''),
    hotel_description = NULLIF(TRIM(hotel_description), ''),
    hotel_address = NULLIF(TRIM(hotel_address), ''),
    user_name = NULLIF(TRIM(user_name), '')
WHERE row_no > 0;

-- Rating is expected 1-5 from your file; clamp for safety
UPDATE stg_hotels_reviews_csv
SET rating_raw = LEAST(5, GREATEST(1, COALESCE(rating_raw, 0)))
WHERE row_no > 0
    AND rating_raw IS NOT NULL;

-- ------------------------------------------------------------
-- 4) Source mapping table for idempotent hotel linkage
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_hotel_source_map (
    source_hotel_id BIGINT NOT NULL,
    hotel_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (source_hotel_id),
    KEY idx_ihsm_hotel_id (hotel_id),
    CONSTRAINT fk_ihsm_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5) Create virtual users from CSV user columns
-- ------------------------------------------------------------
INSERT INTO users (
    email,
    password_hash,
    full_name,
    role_id,
    status,
    is_email_verified,
    auth_provider,
    provider_id,
    created_at,
    updated_at
)
SELECT
    CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local') AS email,
    NULL AS password_hash,
    COALESCE(s.user_name, CONCAT('User ', s.user_source_id)) AS full_name,
    r.id AS role_id,
    'ACTIVE' AS status,
    TRUE AS is_email_verified,
    'LOCAL' AS auth_provider,
    CONCAT('CSV:', CAST(s.user_source_id AS CHAR)) AS provider_id,
    NOW(),
    NOW()
FROM (
    SELECT DISTINCT user_source_id, user_name
    FROM stg_hotels_reviews_csv
    WHERE user_source_id IS NOT NULL
) s
JOIN roles r ON r.name = 'USER'
LEFT JOIN users u
    ON u.email COLLATE utf8mb4_unicode_ci = CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local') COLLATE utf8mb4_unicode_ci
WHERE u.id IS NULL;

-- ------------------------------------------------------------
-- 6) Insert hotels from CSV (only new source_hotel_id)
-- ------------------------------------------------------------
INSERT INTO hotels (
    city_id,
    name,
    slug,
    description,
    address,
    star_rating,
    avg_rating,
    review_count,
    check_in_time,
    check_out_time,
    phone,
    email,
    website,
    is_featured,
    is_trending,
    is_active,
    created_at,
    updated_at
)
SELECT
    c.id AS city_id,
    s.hotel_name AS name,
    CONCAT(
        LOWER(REGEXP_REPLACE(COALESCE(s.hotel_name, 'hotel'), '[^a-zA-Z0-9]+', '-')),
        '-',
        CAST(s.hotel_source_id AS CHAR)
    ) AS slug,
    COALESCE(s.hotel_description, 'Khach san duoc import tu CSV.') AS description,
    COALESCE(s.hotel_address, CONCAT('Dia chi dang cap nhat - ', COALESCE(s.location_raw, 'Viet Nam'))) AS address,
    3 AS star_rating,
    0 AS avg_rating,
    0 AS review_count,
    '14:00:00' AS check_in_time,
    '12:00:00' AS check_out_time,
    NULL AS phone,
    NULL AS email,
    NULLIF(s.url_hotel, '') AS website,
    FALSE AS is_featured,
    FALSE AS is_trending,
    TRUE AS is_active,
    NOW(),
    NOW()
FROM (
    SELECT
        hotel_source_id,
        MAX(hotel_name) AS hotel_name,
        MAX(hotel_description) AS hotel_description,
        MAX(hotel_address) AS hotel_address,
        MAX(location_raw) AS location_raw,
        MAX(url_hotel) AS url_hotel
    FROM stg_hotels_reviews_csv
    WHERE hotel_source_id IS NOT NULL
      AND hotel_name IS NOT NULL
    GROUP BY hotel_source_id
) s
JOIN cities c
    ON LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
    OR LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
LEFT JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
WHERE m.source_hotel_id IS NULL;

-- Map newly inserted hotels by slug convention
INSERT INTO import_hotel_source_map (source_hotel_id, hotel_id)
SELECT
    s.hotel_source_id,
    h.id
FROM (
    SELECT
        hotel_source_id,
        CONCAT(
            LOWER(REGEXP_REPLACE(COALESCE(MAX(hotel_name), 'hotel'), '[^a-zA-Z0-9]+', '-')),
            '-',
            CAST(hotel_source_id AS CHAR)
        ) AS expected_slug
    FROM stg_hotels_reviews_csv
    WHERE hotel_source_id IS NOT NULL
      AND hotel_name IS NOT NULL
    GROUP BY hotel_source_id
) s
JOIN hotels h ON h.slug = s.expected_slug
LEFT JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
WHERE m.source_hotel_id IS NULL;

-- ------------------------------------------------------------
-- 7) Insert reviews (idempotent by user+target+comment+rating)
-- ------------------------------------------------------------
INSERT INTO reviews (
    user_id,
    booking_id,
    target_type,
    target_id,
    overall_rating,
    title,
    comment,
    is_verified,
    is_published,
    admin_reply,
    admin_replied_at,
    created_at,
    updated_at
)
SELECT
    u.id AS user_id,
    NULL AS booking_id,
    'HOTEL' AS target_type,
    m.hotel_id AS target_id,
    CAST(ROUND(COALESCE(s.rating_raw, 0), 0) AS UNSIGNED) AS overall_rating,
    NULL AS title,
    CONCAT('Danh gia import: ', COALESCE(s.hotel_description, 'Trai nghiem tot.')) AS comment,
    FALSE AS is_verified,
    TRUE AS is_published,
    NULL AS admin_reply,
    NULL AS admin_replied_at,
    NOW() AS created_at,
    NOW() AS updated_at
FROM stg_hotels_reviews_csv s
JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
JOIN users u
    ON u.email COLLATE utf8mb4_unicode_ci = CONCAT('csvu_', CAST(s.user_source_id AS CHAR), '@import.local') COLLATE utf8mb4_unicode_ci
LEFT JOIN reviews r
  ON r.user_id = u.id
 AND r.target_type = 'HOTEL'
 AND r.target_id = m.hotel_id
 AND r.overall_rating = CAST(ROUND(COALESCE(s.rating_raw, 0), 0) AS UNSIGNED)
 AND r.comment = CONCAT('Danh gia import: ', COALESCE(s.hotel_description, 'Trai nghiem tot.'))
WHERE s.rating_raw BETWEEN 1 AND 5
  AND r.id IS NULL;

-- ------------------------------------------------------------
-- 8) Assign cover image if hotel has none (by location pool)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_city_image_pool (
    city_key VARCHAR(120) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    PRIMARY KEY (city_key, image_url)
) ENGINE=InnoDB;

INSERT IGNORE INTO import_city_image_pool (city_key, image_url) VALUES
('ha noi', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80'),
('ho chi minh', 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80'),
('da nang', 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80'),
('nha trang', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80'),
('phu quoc', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80'),
('da lat', 'https://images.unsplash.com/photo-1502784444185-1f263f7f4e1e?w=1200&q=80'),
('hoi an', 'https://images.unsplash.com/photo-1518544866330-4e48b2ca6e44?w=1200&q=80'),
('hue', 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200&q=80'),
('vung tau', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80');

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order, created_at)
SELECT
    h.id,
    COALESCE(p.image_url, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80') AS url,
    h.name AS alt_text,
    TRUE AS is_cover,
    0 AS sort_order,
    NOW() AS created_at
FROM hotels h
LEFT JOIN cities c ON c.id = h.city_id
LEFT JOIN import_city_image_pool p
    ON LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(p.city_key COLLATE utf8mb4_unicode_ci)
    OR LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(p.city_key COLLATE utf8mb4_unicode_ci)
LEFT JOIN hotel_images hi ON hi.hotel_id = h.id AND hi.is_cover = TRUE
WHERE hi.id IS NULL;

COMMIT;

-- ------------------------------------------------------------
-- 9) Post-import checks
-- ------------------------------------------------------------
SELECT 'hotels_total' AS metric, COUNT(*) AS value FROM hotels
UNION ALL
SELECT 'reviews_total', COUNT(*) FROM reviews
UNION ALL
SELECT 'virtual_users_total', COUNT(*) FROM users WHERE email LIKE 'csvu_%@import.local'
UNION ALL
SELECT 'hotels_without_cover', COUNT(*)
FROM hotels h
LEFT JOIN hotel_images hi ON hi.hotel_id = h.id AND hi.is_cover = TRUE
WHERE hi.id IS NULL;

-- Rows that could not map to city
SELECT DISTINCT location_raw
FROM stg_hotels_reviews_csv s
LEFT JOIN cities c
    ON LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
    OR LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
WHERE s.location_raw IS NOT NULL
  AND c.id IS NULL
LIMIT 100;

SET SQL_SAFE_UPDATES = 1;

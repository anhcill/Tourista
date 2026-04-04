-- ============================================================
-- DEBUG: Thử 3 cách load CSV — chạy từng cái, kiểm tra COUNT(*)
-- ============================================================
USE tourista;

-- ============================================================
-- CÁCH 1: Line ending = \n (Unix style)
-- ============================================================
TRUNCATE TABLE stg_hotels_reviews_csv;

LOAD DATA LOCAL INFILE 'C:/Users/ducan/Downloads/archive (1)/hotels_users_ratings.csv'
INTO TABLE stg_hotels_reviews_csv
CHARACTER SET utf8mb4
FIELDS TERMINATED BY ','
       OPTIONALLY ENCLOSED BY '"'
LINES  TERMINATED BY '\n'
IGNORE 1 LINES
(url_hotel, location_raw, hotel_source_id, hotel_name,
 hotel_description, hotel_address, user_source_id, user_name, rating_raw);

SHOW WARNINGS;
SELECT COUNT(*) AS cach1_ket_qua FROM stg_hotels_reviews_csv;

-- ─ Nếu COUNT > 0 thì DỪNG, dùng Cách 1. Nếu vẫn 0 thì thử Cách 2 ─

-- ============================================================
-- CÁCH 2: Line ending = \r\n (Windows style)
-- ============================================================
-- TRUNCATE TABLE stg_hotels_reviews_csv;
--
-- LOAD DATA LOCAL INFILE 'C:/Users/ducan/Downloads/archive (1)/hotels_users_ratings.csv'
-- INTO TABLE stg_hotels_reviews_csv
-- CHARACTER SET utf8mb4
-- FIELDS TERMINATED BY ','
--        OPTIONALLY ENCLOSED BY '"'
-- LINES  TERMINATED BY '\r\n'
-- IGNORE 1 LINES
-- (url_hotel, location_raw, hotel_source_id, hotel_name,
--  hotel_description, hotel_address, user_source_id, user_name, rating_raw);
--
-- SHOW WARNINGS;
-- SELECT COUNT(*) AS cach2_ket_qua FROM stg_hotels_reviews_csv;

-- ============================================================
-- CÁCH 3: Không chỉ định line ending (MySQL tự detect)
-- ============================================================
-- TRUNCATE TABLE stg_hotels_reviews_csv;
--
-- LOAD DATA LOCAL INFILE 'C:/Users/ducan/Downloads/archive (1)/hotels_users_ratings.csv'
-- INTO TABLE stg_hotels_reviews_csv
-- CHARACTER SET utf8mb4
-- FIELDS TERMINATED BY ','
--        OPTIONALLY ENCLOSED BY '"'
-- IGNORE 1 LINES
-- (url_hotel, location_raw, hotel_source_id, hotel_name,
--  hotel_description, hotel_address, user_source_id, user_name, rating_raw);
--
-- SHOW WARNINGS;
-- SELECT COUNT(*) AS cach3_ket_qua FROM stg_hotels_reviews_csv;

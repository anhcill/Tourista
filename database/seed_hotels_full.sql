-- ============================================================
-- TOURISTA - Full Hotel Seed Data
-- File nay tao them nhieu khach san de test tim kiem/autocomplete
-- Chay trong phpMyAdmin voi database: tourista
-- ============================================================

USE tourista;

START TRANSACTION;

-- ============================================================
-- 1) Ensure countries, cities, amenities
-- ============================================================

INSERT IGNORE INTO countries (code, name_vi, name_en) VALUES
('VN', 'Viet Nam', 'Vietnam');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Ha Noi', 'Hanoi', 'ha-noi', 'Thu do Viet Nam', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'ha-noi');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Da Nang', 'Da Nang', 'da-nang', 'Thanh pho bien mien Trung', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'da-nang');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Nha Trang', 'Nha Trang', 'nha-trang', 'Thanh pho bien dep', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'nha-trang');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Phu Quoc', 'Phu Quoc', 'phu-quoc', 'Dao ngoc Phu Quoc', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'phu-quoc');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Ho Chi Minh', 'Ho Chi Minh City', 'ho-chi-minh', 'Thanh pho nang dong', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'ho-chi-minh');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Da Lat', 'Da Lat', 'da-lat', 'Thanh pho ngan hoa', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'da-lat');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Hoi An', 'Hoi An', 'hoi-an', 'Pho co ben song', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'hoi-an');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Hue', 'Hue', 'hue', 'Co do Hue', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'hue');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Vung Tau', 'Vung Tau', 'vung-tau', 'Thanh pho bien gan TP.HCM', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'vung-tau');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Ha Long', 'Ha Long', 'ha-long', 'Ky quan vinh Ha Long', TRUE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'ha-long');

INSERT IGNORE INTO amenities (code, name_vi, name_en, category) VALUES
('wifi', 'Wi-Fi mien phi', 'Free Wi-Fi', 'HOTEL'),
('parking', 'Bai do xe', 'Parking', 'HOTEL'),
('pool', 'Ho boi', 'Swimming Pool', 'HOTEL'),
('gym', 'Phong gym', 'Gym', 'HOTEL'),
('spa', 'Spa', 'Spa', 'HOTEL'),
('restaurant', 'Nha hang', 'Restaurant', 'HOTEL'),
('bar', 'Bar', 'Bar', 'HOTEL'),
('breakfast', 'An sang', 'Breakfast', 'HOTEL'),
('air_conditioning', 'Dieu hoa', 'Air Conditioning', 'HOTEL');

-- ============================================================
-- 2) Hotels (20 records)
-- ============================================================

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Sofitel Legend Metropole Hanoi', 'sofitel-legend-metropole-hanoi', 'Khach san 5 sao trung tam Ha Noi', '15 Ngo Quyen, Hoan Kiem, Ha Noi', 5, 9.20, 3240, '14:00:00', '12:00:00', TRUE, FALSE, TRUE
FROM cities c WHERE c.slug = 'ha-noi' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'sofitel-legend-metropole-hanoi');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'JW Marriott Hotel Hanoi', 'jw-marriott-hotel-hanoi', 'Khach san cao cap khu My Dinh', 'Do Duc Duc, Nam Tu Liem, Ha Noi', 5, 8.90, 1876, '15:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'ha-noi' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'jw-marriott-hotel-hanoi');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Lotte Hotel Hanoi', 'lotte-hotel-hanoi', 'Khach san sang trong tren cao', '54 Lieu Giai, Ba Dinh, Ha Noi', 5, 8.75, 1422, '14:00:00', '12:00:00', FALSE, TRUE, TRUE
FROM cities c WHERE c.slug = 'ha-noi' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'lotte-hotel-hanoi');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Furama Resort Danang', 'furama-resort-danang', 'Resort 5 sao sat bien My Khe', '68 Ho Xuan Huong, Da Nang', 5, 9.10, 2103, '14:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'da-nang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'furama-resort-danang');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Hyatt Regency Danang Resort', 'hyatt-regency-danang', 'Resort view bien Non Nuoc', 'Truong Sa, Ngu Hanh Son, Da Nang', 5, 9.30, 1562, '14:00:00', '12:00:00', FALSE, TRUE, TRUE
FROM cities c WHERE c.slug = 'da-nang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'hyatt-regency-danang');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Novotel Danang Premier Han River', 'novotel-danang-premier-han-river', 'Khach san ben song Han', '36 Bach Dang, Hai Chau, Da Nang', 5, 8.55, 1191, '14:00:00', '12:00:00', FALSE, FALSE, TRUE
FROM cities c WHERE c.slug = 'da-nang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'novotel-danang-premier-han-river');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Vinpearl Resort Nha Trang', 'vinpearl-resort-nha-trang', 'Resort nghi duong tren dao Hon Tre', 'Hon Tre, Nha Trang', 5, 8.80, 4521, '14:00:00', '12:00:00', TRUE, FALSE, TRUE
FROM cities c WHERE c.slug = 'nha-trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'vinpearl-resort-nha-trang');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'InterContinental Nha Trang', 'intercontinental-nha-trang', 'Khach san trung tam duong Tran Phu', '32-34 Tran Phu, Nha Trang', 5, 9.05, 2334, '14:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'nha-trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'intercontinental-nha-trang');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Sheraton Nha Trang Hotel & Spa', 'sheraton-nha-trang', 'Khach san mat bien co spa', '26-28 Tran Phu, Nha Trang', 5, 8.70, 1608, '14:00:00', '12:00:00', FALSE, TRUE, TRUE
FROM cities c WHERE c.slug = 'nha-trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'sheraton-nha-trang');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'InterContinental Phu Quoc Long Beach Resort', 'intercontinental-phu-quoc-long-beach', 'Resort sang trong Bai Truong', 'Bai Truong, Phu Quoc', 5, 9.40, 2876, '15:00:00', '11:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'phu-quoc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'intercontinental-phu-quoc-long-beach');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Premier Village Phu Quoc Resort', 'premier-village-phu-quoc-resort', 'Resort biet lap 2 mat bien', 'Mui Ong Doi, An Thoi, Phu Quoc', 5, 9.10, 1310, '15:00:00', '12:00:00', TRUE, FALSE, TRUE
FROM cities c WHERE c.slug = 'phu-quoc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'premier-village-phu-quoc-resort');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Movenpick Resort Waverly Phu Quoc', 'movenpick-resort-phu-quoc', 'Resort phu hop gia dinh', 'Ong Lang, Cua Duong, Phu Quoc', 5, 8.65, 1022, '14:00:00', '12:00:00', FALSE, TRUE, TRUE
FROM cities c WHERE c.slug = 'phu-quoc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'movenpick-resort-phu-quoc');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'The Reverie Saigon', 'the-reverie-saigon', 'Khach san sieu sang quan 1', '22-36 Nguyen Hue, Quan 1, TP.HCM', 5, 9.35, 1984, '14:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'ho-chi-minh' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'the-reverie-saigon');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Hotel Nikko Saigon', 'hotel-nikko-saigon', 'Khach san 5 sao khu quan 1 mo rong', '235 Nguyen Van Cu, Quan 1, TP.HCM', 5, 8.85, 1760, '14:00:00', '12:00:00', FALSE, TRUE, TRUE
FROM cities c WHERE c.slug = 'ho-chi-minh' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'hotel-nikko-saigon');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Fusion Original Saigon Centre', 'fusion-original-saigon-centre', 'Khach san tre trung tai trung tam', '65 Le Loi, Quan 1, TP.HCM', 4, 8.60, 845, '14:00:00', '12:00:00', FALSE, FALSE, TRUE
FROM cities c WHERE c.slug = 'ho-chi-minh' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'fusion-original-saigon-centre');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Dalat Palace Heritage Hotel', 'dalat-palace-heritage-hotel', 'Khach san co dien ben ho Xuan Huong', '2 Tran Phu, Da Lat', 5, 8.95, 980, '14:00:00', '12:00:00', TRUE, FALSE, TRUE
FROM cities c WHERE c.slug = 'da-lat' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'dalat-palace-heritage-hotel');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Ana Mandara Villas Dalat Resort & Spa', 'ana-mandara-villas-dalat', 'Khu nghi duong villa giua rung thong', 'Le Lai, Da Lat', 5, 9.00, 1244, '14:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'da-lat' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'ana-mandara-villas-dalat');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'La Siesta Hoi An Resort & Spa', 'la-siesta-hoi-an-resort', 'Resort gan pho co Hoi An', '132 Hung Vuong, Hoi An', 5, 9.25, 1111, '14:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'hoi-an' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'la-siesta-hoi-an-resort');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Azerai La Residence Hue', 'azerai-la-residence-hue', 'Khach san ben song Huong', '5 Le Loi, Hue', 5, 9.15, 920, '14:00:00', '12:00:00', TRUE, FALSE, TRUE
FROM cities c WHERE c.slug = 'hue' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'azerai-la-residence-hue');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'The Imperial Hotel Vung Tau', 'the-imperial-hotel-vung-tau', 'Khach san gan bai sau Vung Tau', '159 Thuy Van, Vung Tau', 5, 8.45, 1668, '14:00:00', '12:00:00', FALSE, TRUE, TRUE
FROM cities c WHERE c.slug = 'vung-tau' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'the-imperial-hotel-vung-tau');

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active)
SELECT c.id, 'Wyndham Legend Halong', 'wyndham-legend-halong', 'Khach san nhin ra Vinh Ha Long', '12 Ha Long, Bai Chay, Ha Long', 5, 8.78, 1502, '14:00:00', '12:00:00', TRUE, TRUE, TRUE
FROM cities c WHERE c.slug = 'ha-long' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'wyndham-legend-halong');

-- ============================================================
-- 3) Cover images (insert only if no cover image exists)
-- ============================================================

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'sofitel-legend-metropole-hanoi'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'jw-marriott-hotel-hanoi'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'lotte-hotel-hanoi'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'furama-resort-danang'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'hyatt-regency-danang'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'novotel-danang-premier-han-river'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'vinpearl-resort-nha-trang'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'intercontinental-nha-trang'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'sheraton-nha-trang'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'intercontinental-phu-quoc-long-beach'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'premier-village-phu-quoc-resort'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'movenpick-resort-phu-quoc'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'the-reverie-saigon'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1560067174-8941cd8e2765?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'hotel-nikko-saigon'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'fusion-original-saigon-centre'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'dalat-palace-heritage-hotel'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'ana-mandara-villas-dalat'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'la-siesta-hoi-an-resort'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'azerai-la-residence-hue'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'the-imperial-hotel-vung-tau'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order)
SELECT h.id, 'https://images.unsplash.com/photo-1501117716987-c8e1ecb2109d?w=1200&q=80', h.name, TRUE, 0
FROM hotels h
WHERE h.slug = 'wyndham-legend-halong'
  AND NOT EXISTS (SELECT 1 FROM hotel_images i WHERE i.hotel_id = h.id AND i.is_cover = TRUE);

-- ============================================================
-- 4) Room types (1 per hotel, insert if hotel has no room type)
-- ============================================================

INSERT INTO room_types (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active)
SELECT h.id, 'Deluxe Room', CONCAT('Deluxe Room tai ', h.name), 2, 1, 'King', 36.00,
       CASE
           WHEN h.star_rating >= 5 THEN 3200000
           WHEN h.star_rating = 4 THEN 2200000
           ELSE 1500000
       END,
       25,
       TRUE
FROM hotels h
WHERE NOT EXISTS (
    SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id
);

-- ============================================================
-- 5) Hotel amenities for all hotels created above
-- ============================================================

INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id)
SELECT h.id, a.id
FROM hotels h
JOIN amenities a ON a.code IN ('wifi', 'breakfast', 'restaurant', 'air_conditioning')
WHERE h.slug IN (
    'sofitel-legend-metropole-hanoi',
    'jw-marriott-hotel-hanoi',
    'lotte-hotel-hanoi',
    'furama-resort-danang',
    'hyatt-regency-danang',
    'novotel-danang-premier-han-river',
    'vinpearl-resort-nha-trang',
    'intercontinental-nha-trang',
    'sheraton-nha-trang',
    'intercontinental-phu-quoc-long-beach',
    'premier-village-phu-quoc-resort',
    'movenpick-resort-phu-quoc',
    'the-reverie-saigon',
    'hotel-nikko-saigon',
    'fusion-original-saigon-centre',
    'dalat-palace-heritage-hotel',
    'ana-mandara-villas-dalat',
    'la-siesta-hoi-an-resort',
    'azerai-la-residence-hue',
    'the-imperial-hotel-vung-tau',
    'wyndham-legend-halong'
);

COMMIT;

SELECT COUNT(*) AS total_hotels_after_seed FROM hotels;
SELECT 'seed_hotels_full.sql completed' AS result;

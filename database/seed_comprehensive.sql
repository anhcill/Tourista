-- ============================================================
-- TOURISTA - Comprehensive Seed Data
-- Seeds hotels and tours across multiple cities
-- Run: mysql -h interchange.proxy.rlwy.net -P 38550 -u root -p railway < database/seed_comprehensive.sql
-- Or import via phpMyAdmin / Adminer
-- ============================================================

USE railway;

START TRANSACTION;

-- ============================================================
-- CITIES: Ensure all major Vietnamese tourist cities exist
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

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Can Tho', 'Can Tho', 'can-tho', 'Thanh pho Dong Bang Song Cuu Long', FALSE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'can-tho');

INSERT INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
SELECT c.id, 'Sapa', 'Sapa', 'sapa', 'Thi tran ngam mua o vung cao nguyen', FALSE
FROM countries c
WHERE c.code = 'VN'
  AND NOT EXISTS (SELECT 1 FROM cities x WHERE x.slug = 'sapa');

-- ============================================================
-- AMENITIES: Hotel amenities
-- ============================================================

INSERT IGNORE INTO amenities (code, name_vi, name_en, category) VALUES
('wifi', 'Wi-Fi mien phi', 'Free Wi-Fi', 'HOTEL'),
('parking', 'Bai do xe mien phi', 'Free Parking', 'HOTEL'),
('pool', 'Ho boi', 'Swimming Pool', 'HOTEL'),
('gym', 'Phong gym', 'Gym / Fitness', 'HOTEL'),
('spa', 'Spa & Massage', 'Spa', 'HOTEL'),
('restaurant', 'Nha hang', 'Restaurant', 'HOTEL'),
('bar', 'Bar / Lounge', 'Bar', 'HOTEL'),
('breakfast', 'An sang buffet', 'Breakfast', 'HOTEL'),
('air_conditioning', 'Dieu hoa khong khi', 'Air Conditioning', 'HOTEL'),
('room_service', 'Phuc vu phong', 'Room Service', 'HOTEL'),
('airport_shuttle', 'Dich vu dua don san bay', 'Airport Shuttle', 'HOTEL'),
('pet_friendly', 'Cho phep pets', 'Pet Friendly', 'HOTEL'),
('kids_club', 'Khu choi tre em', 'Kids Club', 'HOTEL'),
('beach_access', 'Ra bai bien', 'Beach Access', 'HOTEL'),
('concierge', 'Le tan 24/7', 'Concierge', 'HOTEL');

INSERT IGNORE INTO amenities (code, name_vi, name_en, category) VALUES
('guide', 'Huong dan vien chuyen nghiep', 'Professional Guide', 'TOUR'),
('meal', 'Bua an', 'Meals Included', 'TOUR'),
('transport', 'Xe du lich', 'Transport', 'TOUR'),
('insurance', 'Bao hiem du lich', 'Travel Insurance', 'TOUR'),
('equipment', 'Trang thiet bi', 'Equipment', 'TOUR'),
('entrance', 'Ve tham quan', 'Entrance Fees', 'TOUR'),
('boat', 'Tau thuyen', 'Boat Trip', 'TOUR'),
('snorkel', 'Diving / Snorkeling', 'Diving / Snorkeling', 'TOUR');

-- ============================================================
-- TOUR CATEGORIES: Ensure all categories exist
-- ============================================================

INSERT IGNORE INTO tour_categories (name_vi, name_en, slug, description, icon) VALUES
('Van hoa & Di san', 'Culture & Heritage', 'culture-heritage', 'Khám phá di sản văn hóa, lịch sử và các công trình kiến trúc nổi tiếng.', 'fa-landmark'),
('Thien nhien & Adventure', 'Nature & Adventure', 'nature-adventure', 'Trải nghiệm phiêu lưu, leo núi, trekking và khám phá thiên nhiên hoang dã.', 'fa-mountain'),
('Bien & Dao', 'Beach & Island', 'beach-island', 'Nghỉ dưỡng biển đảo, tắm nắng và các môn thể thao dưới nước.', 'fa-umbrella-beach'),
('Am thuc', 'Food & Culinary', 'food-culinary', 'Hành trình khám phá ẩm thực địa phương đặc sắc.', 'fa-utensils'),
('Gia dinh', 'Family', 'family', 'Các tour phù hợp cho gia đình có con nhỏ.', 'fa-users'),
('Lang nghe', 'Workshop & Experience', 'workshop', 'Học hỏi nghề truyền thống, làm đồ thủ công.', 'fa-palette'),
('Nghi duong', 'Relaxation & Wellness', 'relaxation', 'Nghỉ dưỡng, wellness, yoga retreat.', 'fa-spa'),
('Sinh Thai', 'Eco & Nature', 'eco-tour', 'Du lịch sinh thái, bảo tồn thiên nhiên.', 'fa-leaf');

-- ============================================================
-- HOTELS: 5-star and 4-star hotels across cities
-- ============================================================

-- HA NOI
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Sofitel Legend Metropole Hanoi', 'sofitel-legend-metropole-hanoi', 'Khach san 5 sao trung tam Ha Noi voi lich su hon 120 nam. Trai nghiem lai lich su trong khong gian sang trong.', '15 Ngo Quyen, Hoan Kiem, Ha Noi', 21.0285, 105.8566, 5, 9.20, 3240, '14:00:00', '12:00:00', '+84-24-3826-6919', 'hanoi@sofitel.com', 'https://sofitel.accor.com', TRUE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ha-noi' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'sofitel-legend-metropole-hanoi');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'JW Marriott Hotel Hanoi', 'jw-marriott-hotel-hanoi', 'Khach san cao cap khu My Dinh, noi tiep theo cua chuoi Marriott hau can.', 'Do Duc Duc, Nam Tu Liem, Ha Noi', 21.0285, 105.7856, 5, 8.90, 1876, '15:00:00', '12:00:00', '+84-24-3833-9888', 'hanoi@jwmarriott.com', 'https://jw-marriott.marriott.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ha-noi' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'jw-marriott-hotel-hanoi');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Lotte Hotel Hanoi', 'lotte-hotel-hanoi', 'Khach san sang trong tren cao voi tam nhin rong khắp thanh pho.', '54 Lieu Giai, Ba Dinh, Ha Noi', 21.0365, 105.8226, 5, 8.75, 1422, '14:00:00', '12:00:00', '+84-24-3733-1000', 'hanoi@lotte.net', 'https://lottehotel.com', FALSE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ha-noi' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'lotte-hotel-hanoi');

-- DA NANG
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Furama Resort Danang', 'furama-resort-danang', 'Resort 5 sao sat bien My Khe voi chuan quoc te.', '68 Ho Xuan Huong, Da Nang', 16.0544, 108.2027, 5, 9.10, 2103, '14:00:00', '12:00:00', '+84-236-384-7888', 'info@furamavietnam.com', 'https://furamavietnam.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'da-nang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'furama-resort-danang');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Hyatt Regency Danang Resort', 'hyatt-regency-danang', 'Resort view bien Non Nuoc voi 5 tru khong.', 'Truong Sa, Ngu Hanh Son, Da Nang', 16.0315, 108.2281, 5, 9.30, 1562, '14:00:00', '12:00:00', '+84-236-395-1234', 'danang.regency@hyatt.com', 'https://hyatt.com', FALSE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'da-nang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'hyatt-regency-danang');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Novotel Danang Premier Han River', 'novotel-danang-premier-han-river', 'Khach san 5 sao ben song Han voi tam nhin thanh pho tuyen mat.', '36 Bach Dang, Hai Chau, Da Nang', 16.0678, 108.2209, 5, 8.55, 1191, '14:00:00', '12:00:00', '+84-236-392-9999', 'info@novoteldanang.com', 'https://novotel.accor.com', FALSE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'da-nang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'novotel-danang-premier-han-river');

-- NHA TRANG
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Vinpearl Resort Nha Trang', 'vinpearl-resort-nha-trang', 'Resort nghi duong tren dao Hon Tre voi he thong vuon troi choi.',
'Hon Tre, Nha Trang', 12.2451, 109.1942, 5, 8.80, 4521, '14:00:00', '12:00:00', '+84-258-359-8888', 'info@vinpearl.com', 'https://vinpearl.com', TRUE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'nha-trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'vinpearl-resort-nha-trang');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'InterContinental Nha Trang', 'intercontinental-nha-trang', 'Khach san trung tam duong Tran Phu voi spa va skypool.',
'32-34 Tran Phu, Nha Trang', 12.2176, 109.1942, 5, 9.05, 2334, '14:00:00', '12:00:00', '+84-258-388-7777', 'nhatrang@ihg.com', 'https://ihg.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'nha-trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'intercontinental-nha-trang');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Sheraton Nha Trang Hotel & Spa', 'sheraton-nha-trang', 'Khach san mat bien co spa va nha hang chuyen nghiep.',
'26-28 Tran Phu, Nha Trang', 12.2168, 109.1960, 5, 8.70, 1608, '14:00:00', '12:00:00', '+84-258-388-5555', 'nhatrang@sheraton.com', 'https://sheraton.marriott.com', FALSE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'nha-trang' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'sheraton-nha-trang');

-- PHU QUOC
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'InterContinental Phu Quoc Long Beach Resort', 'intercontinental-phu-quoc-long-beach', 'Resort sang trong Bai Truong voi 12 nha hang va bar.',
'Bai Truong, Phu Quoc', 10.2105, 103.9667, 5, 9.40, 2876, '15:00:00', '11:00:00', '+84-297-697-8888', 'phuquoc@ihg.com', 'https://ihg.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'phu-quoc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'intercontinental-phu-quoc-long-beach');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Premier Village Phu Quoc Resort', 'premier-village-phu-quoc-resort', 'Resort biet lap 2 mat bien voi villa rieng.',
'Mui Ong Doi, An Thoi, Phu Quoc', 10.1982, 103.9421, 5, 9.10, 1310, '15:00:00', '12:00:00', '+84-297-627-8888', 'info@premiervillage-phuquoc.com', 'https://accor.com', TRUE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'phu-quoc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'premier-village-phu-quoc-resort');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Movenpick Resort Waverly Phu Quoc', 'movenpick-resort-phu-quoc', 'Resort phu hop gia dinh voi bai bien rieng.',
'Ong Lang, Cua Duong, Phu Quoc', 10.2210, 103.9515, 5, 8.65, 1022, '14:00:00', '12:00:00', '+84-297-698-8888', 'info.phuquoc@movenpick.com', 'https://movenpick.com', FALSE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'phu-quoc' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'movenpick-resort-phu-quoc');

-- HO CHI MINH
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'The Reverie Saigon', 'the-reverie-saigon', 'Khach san sieu sang quan 1 voi noi that thiet ke Italy.',
'22-36 Nguyen Hue, Quan 1, TP.HCM', 10.7765, 106.7017, 5, 9.35, 1984, '14:00:00', '12:00:00', '+84-28-3823-8888', 'info@thereveriesaigon.com', 'https://thereveriesaigon.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ho-chi-minh' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'the-reverie-saigon');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Hotel Nikko Saigon', 'hotel-nikko-saigon', 'Khach san 5 sao khu quan 1 mo rong voi spa va buffet.',
'235 Nguyen Van Cu, Quan 1, TP.HCM', 10.7635, 106.6930, 5, 8.85, 1760, '14:00:00', '12:00:00', '+84-28-3838-6868', 'info@hotelnikkosaigon.com', 'https://hotelnikkosaigon.com', FALSE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ho-chi-minh' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'hotel-nikko-saigon');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Fusion Original Saigon Centre', 'fusion-original-saigon-centre', 'Khach san tre trung tai trung tam voi yoga va spa.',
'65 Le Loi, Quan 1, TP.HCM', 10.7725, 106.6980, 4, 8.60, 845, '14:00:00', '12:00:00', '+84-28-3829-8888', 'info@fusion-suites-saigon-centre.com', 'https://fusionhotels.com', FALSE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ho-chi-minh' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'fusion-original-saigon-centre');

-- DA LAT
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Dalat Palace Heritage Hotel', 'dalat-palace-heritage-hotel', 'Khach san co dien ben ho Xuan Huong, khu nghi duong hoang gia.',
'2 Tran Phu, Da Lat', 11.9356, 108.4417, 5, 8.95, 980, '14:00:00', '12:00:00', '+84-263-835-222', 'info@dalatpalace.vn', 'https://dalatpalace.vn', TRUE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'da-lat' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'dalat-palace-heritage-hotel');

INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Ana Mandara Villas Dalat Resort & Spa', 'ana-mandara-villas-dalat', 'Khu nghi duong villa giua rung thong voi 17 biet thự.',
'Le Lai, Da Lat', 11.9470, 108.4447, 5, 9.00, 1244, '14:00:00', '12:00:00', '+84-263-555-588', 'info@anamandara-resort.com', 'https://anamandara-resort.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'da-lat' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'ana-mandara-villas-dalat');

-- HOI AN
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'La Siesta Hoi An Resort & Spa', 'la-siesta-hoi-an-resort', 'Resort gan pho co Hoi An voi phong cach Viet-Nam.',
'132 Hung Vuong, Hoi An', 15.8801, 108.3380, 5, 9.25, 1111, '14:00:00', '12:00:00', '+84-235-391-8888', 'info@lasuestahotels.com', 'https://lasuestahotels.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'hoi-an' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'la-siesta-hoi-an-resort');

-- HUE
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Azerai La Residence Hue', 'azerai-la-residence-hue', 'Khach san thanh lich ben song Huong voi kien truc Phap.',
'5 Le Loi, Hue', 16.4677, 107.5823, 5, 9.15, 920, '14:00:00', '12:00:00', '+84-234-383-6750', 'info@azerai.com', 'https://azerai.com', TRUE, FALSE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'hue' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'azerai-la-residence-hue');

-- VUNG TAU
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'The Imperial Hotel Vung Tau', 'the-imperial-hotel-vung-tau', 'Khach san gan bai sau Vung Tau voi ho boi lon.',
'159 Thuy Van, Vung Tau', 10.3425, 107.0847, 5, 8.45, 1668, '14:00:00', '12:00:00', '+84-254-358-8888', 'info@imperialvungtau.com', 'https://imperialhotelvungtau.com', FALSE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'vung-tau' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'the-imperial-hotel-vung-tau');

-- HA LONG
INSERT INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, phone, email, website, is_featured, is_trending, is_active, admin_status)
SELECT c.id, 'Wyndham Legend Halong', 'wyndham-legend-halong', 'Khach san nhin ra Vinh Ha Long voi ho boi infinity.',
'12 Ha Long, Bai Chay, Ha Long', 20.9580, 107.0467, 5, 8.78, 1502, '14:00:00', '12:00:00', '+84-203-382-8888', 'info@wyndhamhalong.com', 'https://wyndhamhalong.com', TRUE, TRUE, TRUE, 'APPROVED'
FROM cities c WHERE c.slug = 'ha-long' AND NOT EXISTS (SELECT 1 FROM hotels h WHERE h.slug = 'wyndham-legend-halong');

-- ============================================================
-- HOTEL IMAGES: Cover images for each hotel
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
-- ROOM TYPES: Standard + Deluxe for each hotel
-- ============================================================

INSERT INTO room_types (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active)
SELECT h.id, 'Standard Room', CONCAT('Standard Room tai ', h.name), 2, 1, 'Double', 28.00,
       CASE WHEN h.star_rating >= 5 THEN 1800000 ELSE 1200000 END,
       15, TRUE
FROM hotels h
WHERE NOT EXISTS (SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id AND rt.name = 'Standard Room');

INSERT INTO room_types (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active)
SELECT h.id, 'Deluxe Room', CONCAT('Deluxe Room tai ', h.name), 2, 1, 'King', 38.00,
       CASE WHEN h.star_rating >= 5 THEN 2800000 ELSE 1800000 END,
       20, TRUE
FROM hotels h
WHERE NOT EXISTS (SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id AND rt.name = 'Deluxe Room');

INSERT INTO room_types (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active)
SELECT h.id, 'Suite', CONCAT('Suite sang trong tai ', h.name), 3, 1, 'King', 65.00,
       CASE WHEN h.star_rating >= 5 THEN 5500000 ELSE 3500000 END,
       8, TRUE
FROM hotels h
WHERE h.star_rating >= 5
  AND NOT EXISTS (SELECT 1 FROM room_types rt WHERE rt.hotel_id = h.id AND rt.name = 'Suite');

-- ============================================================
-- HOTEL AMENITIES: Standard amenities for all hotels
-- ============================================================

INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id)
SELECT h.id, a.id
FROM hotels h
JOIN amenities a ON a.code IN ('wifi', 'breakfast', 'restaurant', 'air_conditioning', 'pool', 'parking', 'gym', 'spa', 'room_service', 'concierge')
WHERE h.slug IN (
    'sofitel-legend-metropole-hanoi','jw-marriott-hotel-hanoi','lotte-hotel-hanoi',
    'furama-resort-danang','hyatt-regency-danang','novotel-danang-premier-han-river',
    'vinpearl-resort-nha-trang','intercontinental-nha-trang','sheraton-nha-trang',
    'intercontinental-phu-quoc-long-beach','premier-village-phu-quoc-resort','movenpick-resort-phu-quoc',
    'the-reverie-saigon','hotel-nikko-saigon','fusion-original-saigon-centre',
    'dalat-palace-heritage-hotel','ana-mandara-villas-dalat',
    'la-siesta-hoi-an-resort','azerai-la-residence-hue',
    'the-imperial-hotel-vung-tau','wyndham-legend-halong'
);

-- ============================================================
-- TOURS: Multi-city tour seed data
-- ============================================================

-- DA NANG TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Da Nang - Ba Na Hills day trip', 'da-nang-ba-na-hills-day-trip',
'Explore Ba Na Hills, Golden Bridge, French Village, and mountain cable car in one full day from Da Nang.',
'["Golden Bridge check-in", "Ba Na cable car", "French Village", "Le Jardin d''Amour"]',
'["Round-trip transfer", "English speaking guide", "Buffet lunch", "Travel insurance"]',
'["Personal expenses", "VAT invoice", "Tips"]',
1, 0, 25, 1, 'EASY', 1290000, 990000, 4.80, 186, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Da Nang - Son Tra - Marble Mountain - Hoi An', 'da-nang-son-tra-marble-mountain-hoi-an',
'City combo route for first-time visitors: Son Tra Peninsula, Marble Mountain, and Hoi An Ancient Town by evening.',
'["Linh Ung pagoda", "Marble Mountain caves", "Hoi An lantern street", "Night market"]',
'["Transport", "Guide", "Hoi An entry ticket", "Dinner set menu"]',
'["Personal shopping", "Optional boat ticket", "VAT invoice"]',
1, 0, 20, 1, 'EASY', 990000, 790000, 4.70, 142, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Da Nang - Cu Lao Cham island snorkeling', 'da-nang-cu-lao-cham-snorkeling',
'High-speed boat to Cu Lao Cham with snorkeling spots and fresh seafood lunch.',
'["Speedboat round-trip", "Snorkeling", "Coral reef spot", "Island seafood lunch"]',
'["Boat transfer", "Guide", "Snorkeling gear", "Lunch"]',
'["Sea-walking package", "Personal drinks", "VAT invoice"]',
1, 0, 18, 1, 'MEDIUM', 1150000, 920000, 4.60, 97, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Da Nang food tour by night', 'da-nang-food-tour-by-night',
'Street food discovery route with local dishes and hidden lanes in central Da Nang.',
'["Local food stops", "Night city route", "Han river viewpoint", "Small group experience"]',
'["Food tasting", "Guide", "Water", "Hotel pickup in center"]',
'["Personal orders", "Extra drinks", "VAT invoice"]',
1, 0, 12, 1, 'EASY', 690000, 550000, 4.50, 76, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-nang'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night');

-- HA NOI TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Ha Noi city tour - Old Quarter & Ho Chi Minh complex', 'ha-noi-city-tour-old-quarter',
'Explore the heart of Hanoi: Old Quarter, Ho Chi Minh Mausoleum, One Pillar Pagoda, and Temple of Literature.',
'["Old Quarter walking", "Ho Chi Minh complex", "One Pillar Pagoda", "Temple of Literature"]',
'["Transport", "English guide", "Lunch", "All entrance fees"]',
'["Personal expenses", "Tips", "VAT invoice"]',
1, 0, 20, 1, 'EASY', 850000, 650000, 4.75, 210, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Ha Noi - Ninh Binh day trip: Trang An & Hoa Lu', 'ha-noi-ninh-binh-trang-an',
'Visit Trang An Grottoes by boat, ancient Hoa Lu capital, and Bai Dinh pagoda in one day.',
'["Trang An boat ride", "Hoa Lu ancient capital", "Bai Dinh pagoda", "Vietnamese lunch"]',
'["Transport from Hanoi", "Guide", "Lunch", "Boat fee"]',
'["Personal expenses", "Tips", "VAT invoice"]',
1, 0, 18, 1, 'MEDIUM', 1150000, 890000, 4.85, 178, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Ha Noi street food walking tour', 'ha-noi-street-food-tour',
'Night food walk through Hanois Old Quarter with local guide. Taste pho, banh cuon, cha ca and more.',
'["Pho bo Ha Noi", "Banh cuon", "Cha ca La Vong", "Egg coffee"]',
'["Guide", "Food tasting (10+ dishes)", "Water"]',
'["Alcoholic drinks", "Personal shopping", "VAT invoice"]',
1, 0, 10, 1, 'EASY', 750000, 0, 4.90, 305, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-noi'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-noi-street-food-tour');

-- NHA TRANG TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Nha Trang - Con Se Tre island hopping', 'nha-trang-con-se-tre-island-hopping',
'Visit 4 islands around Nha Trang: Mun Island, Mot Island, Tranh Island, and fishing village.',
'["Snorkeling at Mun Island", "Glass-bottom boat", "Seafood lunch", "Water sports"]',
'["Speedboat", "Guide", "Lunch", "Snorkeling gear"]',
'["Water sports fee", "Personal expenses", "VAT invoice"]',
1, 0, 25, 1, 'EASY', 990000, 790000, 4.65, 134, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Nha Trang snorkeling & diving day trip', 'nha-trang-snorkeling-diving',
'Explore coral reefs and marine life at Hon Mun with professional diving instructors.',
'["2 snorkeling spots", "Coral garden", "Marine life", "Underwater photos"]',
'["Transport", "Guide", "Lunch", "Gear rental"]',
'["Underwater camera", "Personal expenses", "VAT invoice"]',
1, 0, 15, 1, 'MEDIUM', 1350000, 1050000, 4.70, 88, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'nha-trang'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving');

-- HO CHI MINH TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Ho Chi Minh - Cu Chi tunnels half day', 'hcm-cu-chi-tunnels-half-day',
'Explore the famous Cu Chi underground tunnel network used during the Vietnam War.',
'["Cu Chi tunnels", "Booby trap exhibition", "Gun firing range", "Cassava snack"]',
'["Transport", "Guide", "Entrance fee", "Water"]',
'["Gun firing fee", "Personal expenses", "VAT invoice"]',
1, 0, 20, 1, 'EASY', 750000, 550000, 4.60, 245, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Mekong Delta 2 days 1 night from HCM', 'mekong-delta-2-days-1-night',
'Explore the waterways of Mekong Delta: Ben Tre, Can Tho floating market, and local villages.',
'["Coconut candy workshop", "Rowing boat", "Floating market", "Homestay experience"]',
'["Transport", "Guide", "Meals", "Homestay accommodation"]',
'["Personal expenses", "Tips", "VAT invoice"]',
2, 1, 15, 1, 'EASY', 1890000, 1490000, 4.75, 167, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Ho Chi Minh street food tour by night', 'hcm-street-food-tour-by-night',
'Discover Saigons vibrant food scene: from banh mi to broken rice, all on foot with a local.',
'["Banh mi thit", "Com tam", "Bun thit nuong", "Fresh fruit shake"]',
'["Guide", "Food tasting (8 dishes)", "Water", "Walking"]',
'["Alcoholic drinks", "Personal orders", "VAT invoice"]',
1, 0, 12, 1, 'EASY', 650000, 0, 4.80, 198, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ho-chi-minh'
WHERE tc.slug = 'food-culinary'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night');

-- PHU QUOC TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Phu Quoc - 3 islands snorkeling tour', 'phu-quoc-3-islands-snorkeling',
'Visit Hon Gamala, Hon May Rut, and Hon Thom with snorkeling and sunset fishing.',
'["Snorkeling at 3 spots", "Hon Thom cable car", "Sunset fishing", "Seafood lunch"]',
'["Speedboat", "Guide", "Lunch", "Gear"]',
'["Cable car fee", "Personal expenses", "VAT invoice"]',
1, 0, 20, 1, 'EASY', 1100000, 880000, 4.70, 112, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'phu-quoc'
WHERE tc.slug = 'beach-island'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Phu Quoc island exploration day trip', 'phu-quoc-island-exploration',
'Explore Phu Quoc by motorbike: Vinpearl Safari, Pepper Farm, Fish Sauce Factory, and Beach.',
'["Vinpearl Safari", "Pepper farm", "Fish sauce factory", "Beach time"]',
'["Transport", "Guide", "Lunch", "Safari entrance"]',
'["Personal expenses", "Tips", "VAT invoice"]',
1, 0, 15, 1, 'EASY', 1350000, 1050000, 4.55, 78, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'phu-quoc'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'phu-quoc-island-exploration');

-- HA LONG TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Ha Long Bay 2 days 1 night on cruise', 'ha-long-bay-2d1n-cruise',
'Overnight cruise on Ha Long Bay with kayaking, cave exploration, and sunset party.',
'["Ha Long Bay cruise", "Sung Sot cave", "Kayaking", "Sunset party", "Squid fishing"]',
'["Cruise cabin", "Meals", "Kayak", "Guide"]',
'["Drinks", "Personal expenses", "Tips", "VAT invoice"]',
2, 1, 30, 1, 'EASY', 2500000, 1900000, 4.90, 320, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'ha-long'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise');

-- DA LAT TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Da Lat city tour - Valley, Pagoda & Waterfall', 'da-lat-city-tour-valley-pagoda',
'Explore Da Lat highlights: Valley, Crazy House, Linh Phuoc Pagoda, and Datanla Waterfall.',
'["Valley viewpoint", "Crazy House", "Linh Phuoc Pagoda", "Datanla waterfall"]',
'["Transport", "Guide", "Entrance fees", "Lunch"]',
'["Personal expenses", "Tips", "VAT invoice"]',
1, 0, 18, 1, 'EASY', 850000, 650000, 4.70, 145, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-lat'
WHERE tc.slug = 'nature-adventure'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Da Lat coffee & tea workshop experience', 'da-lat-coffee-tea-workshop',
'Learn about Da Lat coffee and tea production with hands-on workshop and tasting.',
'["Coffee picking", "Roasting demo", "French bread making", "Tea tasting"]',
'["Transport", "Workshop", "Tasting session", "Lunch"]',
'["Personal shopping", "Tips", "VAT invoice"]',
1, 0, 12, 1, 'EASY', 950000, 750000, 4.85, 92, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'da-lat'
WHERE tc.slug = 'workshop'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop');

-- HUE TOURS
INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Hue imperial citadel full day tour', 'hue-imperial-citadel-full-day',
'Explore Hue Imperial City, Thien Mu Pagoda, Tu Duc Tomb, and Khai Dinh Tomb in one day.',
'["Imperial citadel", "Thien Mu pagoda", "Tu Duc tomb", "Khai Dinh tomb"]',
'["Transport", "Guide", "Lunch", "All entrance fees"]',
'["Personal expenses", "Tips", "VAT invoice"]',
1, 0, 18, 1, 'EASY', 1050000, 820000, 4.75, 168, TRUE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hue'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day');

INSERT INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active)
SELECT tc.id, c.id, NULL, 'Hue - DMZ day trip (Vinh Moc tunnels)', 'hue-dmz-day-trip',
'Visit the Demilitarized Zone: Vinh Moc tunnels, Khe Sanh base, and Hai Van Pass.',
'["Vinh Moc tunnels", "Khe Sanh base", "Hai Van Pass", "Ben Hai River"]',
'["Transport", "Guide", "Lunch"]',
'["Personal expenses", "Tips", "VAT invoice"]',
1, 0, 15, 1, 'MEDIUM', 1250000, 990000, 4.65, 95, FALSE, TRUE
FROM tour_categories tc JOIN cities c ON c.slug = 'hue'
WHERE tc.slug = 'culture-heritage'
  AND NOT EXISTS (SELECT 1 FROM tours t WHERE t.slug = 'hue-dmz-day-trip');

-- ============================================================
-- TOUR IMAGES: Cover images
-- ============================================================

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1600&q=80', 'Ba Na Hills', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=1600&q=80', 'Hoi An at night', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80', 'Cu Lao Cham sea', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80', 'Da Nang food tour', TRUE, 1
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1600&q=80', 'Old Quarter Hanoi', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1509002236388-990aab93d798?w=1600&q=80', 'Trang An boats', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1583394964284-8dd09d3f6e9e?w=1600&q=80', 'Hanoi pho', TRUE, 1
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559599238-308793637427?w=1600&q=80', 'Nha Trang islands', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1600&q=80', 'Nha Trang diving', TRUE, 1
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1600&q=80', 'Cu Chi tunnels', TRUE, 1
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=1600&q=80', 'Mekong Delta', TRUE, 1
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=1600&q=80', 'Saigon street food', TRUE, 1
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80', 'Phu Quoc islands', TRUE, 1
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=1600&q=80', 'Phu Quoc exploration', TRUE, 1
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?w=1600&q=80', 'Ha Long Bay', TRUE, 1
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=80', 'Da Lat landscape', TRUE, 1
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80', 'Da Lat coffee', TRUE, 1
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1600&q=80', 'Hue Imperial City', TRUE, 1
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

INSERT INTO tour_images (tour_id, url, alt_text, is_cover, sort_order)
SELECT t.id, 'https://images.unsplash.com/photo-1584976781699-48db8c1c8744?w=1600&q=80', 'Hue DMZ', TRUE, 1
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_images ti WHERE ti.tour_id = t.id AND ti.is_cover = TRUE);

-- ============================================================
-- TOUR ITINERARY: Day-by-day itinerary for each tour
-- ============================================================

-- Da Nang tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Depart from Da Nang center', 'Morning pickup, route briefing, and start of activities.'
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Son Tra - Marble Mountain - Hoi An', 'Visit Son Tra in morning, continue to Marble Mountain, end at Hoi An by evening.'
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Speedboat and snorkeling session', 'Transfer to island by speedboat, snorkeling at coral spots, and lunch before return.'
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Night food route in city center', 'Walk through local lanes and enjoy signature dishes with cultural context from the guide.'
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Ha Noi tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Hanoi Old Quarter walking', 'Morning walk through Old Quarter narrow streets, exploring local markets and street food.'
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Hoa Lu ancient capital', 'Visit the ancient capital of Hoa Lu, the first capital of Vietnam in the 10th century.'
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Trang An boat ride', 'Explore the Trang An Grottoes by small rowing boat through caves and temples.'
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Pho and Old Quarter food stops', 'Start with early morning pho, walk through hidden alleys, taste banh cuon and egg coffee.'
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Nha Trang tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Island hopping by speedboat', 'Visit 4 islands: Mun Island for snorkeling, Mot Island for swimming, Tranh Island for relaxation.'
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Snorkeling and diving at Hon Mun', 'Two snorkeling spots with professional instructors. Underwater photos and coral garden.'
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- HCM tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Cu Chi tunnels exploration', 'Morning visit to Cu Chi tunnels, learn about guerrilla warfare and crawl through sections of the tunnel.'
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ben Tre - Coconut candy workshop', 'Morning: visit coconut candy workshop, rowing boat through canals, visit local family.'
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Can Tho floating market', 'Morning visit to Cai Rang floating market, sample tropical fruits, return to HCM by afternoon.'
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Saigon evening food walk', 'Evening walk through District 1, taste banh mi, com tam, bun thit nuong and fresh fruit shakes.'
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Phu Quoc tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, '3 islands by speedboat', 'Visit Hon Gamala for snorkeling, Hon May Rut for swimming, Hon Thom for sunset fishing.'
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Phu Quoc by motorbike', 'Full day motorbike tour: Vinpearl Safari, Pepper Farm, Fish Sauce Factory, and Bai Sao beach.'
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Ha Long tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Ha Long Bay cruise boarding', 'Morning departure from Hanoi. Board cruise, welcome lunch, visit Sung Sot cave, kayak at Luon Cave.'
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 2, 'Tai Chi and kayaking', 'Morning tai chi on sundeck, kayak at Ti Top island, brunch, return to Hanoi by noon.'
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 2);

-- Da Lat tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Da Lat highlights tour', 'Visit Valley viewpoint, Crazy House architecture, Linh Phuoc Pagoda, and Datanla waterfall.'
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Coffee and tea workshop', 'Hands-on coffee picking, roasting demonstration, French bread making, and tea tasting session.'
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- Hue tours
INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'Hue Imperial City and tombs', 'Full day: Imperial citadel in morning, Thien Mu pagoda at noon, Tu Duc and Khai Dinh tombs in afternoon.'
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

INSERT INTO tour_itinerary (tour_id, day_number, title, description)
SELECT t.id, 1, 'DMZ historical route', 'Visit Vinh Moc tunnels, Khe Sanh base, Hai Van Pass, and Ben Hai River with historical commentary.'
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_itinerary i WHERE i.tour_id = t.id AND i.day_number = 1);

-- ============================================================
-- TOUR DEPARTURES: 2 upcoming departures per tour
-- ============================================================

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 18, NULL
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 16, 1250000
FROM tours t WHERE t.slug = 'da-nang-ba-na-hills-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 14, NULL
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-nang-son-tra-marble-mountain-hoi-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 11 DAY), 8, 1090000
FROM tours t WHERE t.slug = 'da-nang-cu-lao-cham-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 11 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-nang-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 15, NULL
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 13, NULL
FROM tours t WHERE t.slug = 'ha-noi-city-tour-old-quarter'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 12, NULL
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 12 DAY), 10, 1100000
FROM tours t WHERE t.slug = 'ha-noi-ninh-binh-trang-an'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 12 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 8, NULL
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 7, NULL
FROM tours t WHERE t.slug = 'ha-noi-street-food-tour'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 18, NULL
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 15, NULL
FROM tours t WHERE t.slug = 'nha-trang-con-se-tre-island-hopping'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 10, NULL
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 8, 1300000
FROM tours t WHERE t.slug = 'nha-trang-snorkeling-diving'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 15, NULL
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 12, NULL
FROM tours t WHERE t.slug = 'hcm-cu-chi-tunnels-half-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 10, NULL
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 8 DAY), 8, 1850000
FROM tours t WHERE t.slug = 'mekong-delta-2-days-1-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 8 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 1 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 1 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 8, NULL
FROM tours t WHERE t.slug = 'hcm-street-food-tour-by-night'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 14, NULL
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 12, NULL
FROM tours t WHERE t.slug = 'phu-quoc-3-islands-snorkeling'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 10, NULL
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 11 DAY), 8, 1300000
FROM tours t WHERE t.slug = 'phu-quoc-island-exploration'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 11 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 20, NULL
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 18, 2450000
FROM tours t WHERE t.slug = 'ha-long-bay-2d1n-cruise'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 2 DAY), 12, NULL
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 2 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 6 DAY), 10, NULL
FROM tours t WHERE t.slug = 'da-lat-city-tour-valley-pagoda'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 6 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 3 DAY), 8, NULL
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 3 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 7 DAY), 6, 920000
FROM tours t WHERE t.slug = 'da-lat-coffee-tea-workshop'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 7 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 4 DAY), 12, NULL
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 4 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 9 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hue-imperial-citadel-full-day'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 9 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 5 DAY), 10, NULL
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 5 DAY));

INSERT INTO tour_departures (tour_id, departure_date, available_slots, price_override)
SELECT t.id, DATE_ADD(CURDATE(), INTERVAL 10 DAY), 8, 1200000
FROM tours t WHERE t.slug = 'hue-dmz-day-trip'
  AND NOT EXISTS (SELECT 1 FROM tour_departures d WHERE d.tour_id = t.id AND d.departure_date = DATE_ADD(CURDATE(), INTERVAL 10 DAY));

COMMIT;

-- Verify counts
SELECT CONCAT('Hotels: ', COUNT(*)) AS result FROM hotels;
SELECT CONCAT('Hotel images: ', COUNT(*)) AS result FROM hotel_images;
SELECT CONCAT('Room types: ', COUNT(*)) AS result FROM room_types;
SELECT CONCAT('Tours: ', COUNT(*)) AS result FROM tours;
SELECT CONCAT('Tour images: ', COUNT(*)) AS result FROM tour_images;
SELECT CONCAT('Tour itinerary items: ', COUNT(*)) AS result FROM tour_itinerary;
SELECT CONCAT('Tour departures: ', COUNT(*)) AS result FROM tour_departures;
SELECT CONCAT('Amenities: ', COUNT(*)) AS result FROM amenities;

-- ============================================================
-- TOURISTA — Seed Data: Hotels, Room Types & Images
-- Chạy file này trong phpMyAdmin (database: tourista)
-- ============================================================

USE tourista;

-- ============================================================
-- HOTELS (6 khách sạn mẫu ở các thành phố Việt Nam)
-- ============================================================

INSERT INTO hotels (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active) VALUES
-- Hà Nội (city_id = 1)
(1, 'Sofitel Legend Metropole Hanoi', 'sofitel-legend-metropole-hanoi',
 'Khách sạn huyền thoại 5 sao nằm ngay trung tâm Hà Nội, gần Hồ Hoàn Kiếm. Mang đậm nét kiến trúc Pháp cổ điển kết hợp xa hoa hiện đại.',
 '15 Ngô Quyền, Hoàn Kiếm, Hà Nội', 5, 9.20, 3240, '14:00:00', '12:00:00', TRUE, FALSE, TRUE),

(1, 'JW Marriott Hotel Hanoi', 'jw-marriott-hotel-hanoi',
 'Khách sạn 5 sao sang trọng với kiến trúc ấn tượng, hồ bơi vô cực ngoài trời và spa đẳng cấp, cách sân bay Nội Bài 15 phút.',
 'Đỗ Đức Dục, Mễ Trì, Nam Từ Liêm, Hà Nội', 5, 8.90, 1876, '15:00:00', '12:00:00', TRUE, TRUE, TRUE),

-- Đà Nẵng (city_id = 3)
(3, 'Furama Resort Danang', 'furama-resort-danang',
 'Resort 5 sao đẳng cấp quốc tế nằm trên Bãi biển Mỹ Khê xanh mướt với phòng thể thao, spa và nhà hàng ẩm thực đa dạng.',
 '68 Hồ Xuân Hương, Mỹ An, Ngũ Hành Sơn, Đà Nẵng', 5, 9.10, 2103, '14:00:00', '12:00:00', TRUE, TRUE, TRUE),

(3, 'Hyatt Regency Danang Resort', 'hyatt-regency-danang',
 'Resort nghỉ dưỡng 5 sao nằm cạnh bãi biển Non Nước. Tận hưởng 3 hồ bơi, spa cao cấp và nhà hàng nhìn ra biển.',
 'Trường Sa, Hoà Hải, Ngũ Hành Sơn, Đà Nẵng', 5, 9.30, 1562, '14:00:00', '12:00:00', FALSE, TRUE, TRUE),

-- Nha Trang (city_id = 5)
(5, 'Vinpearl Resort & Spa Nha Trang Bay', 'vinpearl-resort-nha-trang-bay',
 'Khu nghỉ dưỡng 5 sao trên đảo Hòn Tre, nổi tiếng với công viên nước và khu vui chơi khổng lồ. Có cáp treo nối đất liền dài nhất thế giới.',
 'Đảo Hòn Tre, Vĩnh Nguyên, Nha Trang', 5, 8.80, 4521, '14:00:00', '12:00:00', TRUE, FALSE, TRUE),

-- Phú Quốc (city_id = 6)
(6, 'InterContinental Phu Quoc Long Beach Resort', 'intercontinental-phu-quoc',
 'Resort 5 sao sang trọng trên bãi biển Bãi Trường dài 3km với kiến trúc độc đáo kết hợp văn hoá Đông Dương và thiên nhiên nhiệt đới.',
 'Bãi Trường, Dương Tơ, Phú Quốc', 5, 9.40, 2876, '15:00:00', '11:00:00', TRUE, TRUE, TRUE);

-- ============================================================
-- HOTEL IMAGES (ảnh bìa cho mỗi khách sạn)
-- ============================================================

INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order) VALUES
(1, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80', 'Sofitel Metropole Hanoi', TRUE, 0),
(2, 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80', 'JW Marriott Hanoi', TRUE, 0),
(3, 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80', 'Furama Danang', TRUE, 0),
(4, 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80', 'Hyatt Regency Danang', TRUE, 0),
(5, 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80', 'Vinpearl Nha Trang', TRUE, 0),
(6, 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80', 'InterContinental Phu Quoc', TRUE, 0);

-- ============================================================
-- ROOM TYPES (2-3 loại phòng cho mỗi khách sạn)
-- ============================================================

INSERT INTO room_types (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active) VALUES

-- Sofitel Metropole (hotel_id = 1)
(1, 'Superior Room', 'Phòng Superior sang trọng với tầm nhìn ra vườn, nội thất cổ điển Pháp.', 2, 1, 'Queen', 28.00, 2500000.00, 40, TRUE),
(1, 'Deluxe Room', 'Phòng Deluxe rộng rãi với ban công riêng và thiết bị hiện đại.', 2, 1, 'King', 35.00, 3800000.00, 25, TRUE),
(1, 'Premium Suite', 'Suite cao cấp với phòng khách riêng biệt và bồn tắm đặt nổi.', 2, 2, 'King', 65.00, 7500000.00, 10, TRUE),

-- JW Marriott Hanoi (hotel_id = 2)
(2, 'Deluxe City View', 'Phòng Deluxe tầm nhìn thành phố, nội thất hiện đại sang trọng.', 2, 1, 'King', 40.00, 3200000.00, 50, TRUE),
(2, 'Executive Room', 'Phòng Executive với quyền tiếp cận tầng Executive Lounge.', 2, 1, 'King', 45.00, 4500000.00, 20, TRUE),

-- Furama Danang (hotel_id = 3)
(3, 'Deluxe Ocean View', 'Phòng Deluxe hướng biển với ban công riêng nhìn ra Bãi biển Mỹ Khê.', 2, 1, 'King', 42.00, 2800000.00, 60, TRUE),
(3, 'Pool Villa', 'Villa riêng với hồ bơi tư nhân và vườn nhiệt đới.', 3, 2, 'King', 120.00, 8500000.00, 15, TRUE),

-- Hyatt Regency Danang (hotel_id = 4)
(4, 'Park View Room', 'Phòng tầm nhìn ra công viên và núi Ngũ Hành Sơn.', 2, 1, 'Twin', 38.00, 2600000.00, 45, TRUE),
(4, 'Ocean Front Suite', 'Suite hướng biển với phòng khách riêng và tầm nhìn toàn cảnh.', 2, 2, 'King', 80.00, 6200000.00, 12, TRUE),

-- Vinpearl Nha Trang (hotel_id = 5)
(5, 'Superior Garden View', 'Phòng Superior với tầm nhìn ra vườn nhiệt đới.', 2, 1, 'Double', 32.00, 1984000.00, 80, TRUE),
(5, 'Deluxe Sea View', 'Phòng Deluxe với tầm nhìn trực tiếp ra vịnh Nha Trang.', 2, 2, 'King', 40.00, 2800000.00, 50, TRUE),

-- InterContinental Phu Quoc (hotel_id = 6)
(6, 'Coral Room', 'Phòng Coral sang trọng với tầm nhìn ra bãi biển Bãi Trường.', 2, 1, 'King', 45.00, 4225000.00, 55, TRUE),
(6, 'Beach Front Villa', 'Villa mặt tiền biển với hồ bơi riêng và butler service 24/7.', 3, 2, 'King', 180.00, 15000000.00, 8, TRUE);

-- ============================================================
-- HOTEL AMENITIES
-- amenity ids: wifi=1, parking=2, pool=3, gym=4, spa=5, restaurant=6, bar=7, breakfast=8
-- ============================================================

INSERT INTO hotel_amenities (hotel_id, amenity_id) VALUES
(1,11),(1,12),(1,15),(1,16),(1,17),(1,18),
(2,11),(2,12),(2,13),(2,14),(2,15),(2,16),(2,17),
(3,11),(3,12),(3,13),(3,14),(3,15),(3,16),(3,18),
(4,11),(4,12),(4,13),(4,14),(4,15),(4,16),
(5,11),(5,12),(5,13),(5,14),(5,15),(5,16),(5,17),(5,18),
(6,11),(6,12),(6,13),(6,14),(6,15),(6,16),(6,17),(6,18);

SELECT 'Seed data hotels đã được chèn thành công!' AS result;

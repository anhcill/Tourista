<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$now = date('Y-m-d H:i:s');

// ============ CITIES ============
$cities = [
    [1, 'Ha Noi', 'Hanoi', 'ha-noi', 'Thu do Viet Nam', 1],
    [2, 'Da Nang', 'Da Nang', 'da-nang', 'Thanh pho bien mien Trung', 1],
    [3, 'Ho Chi Minh', 'Ho Chi Minh City', 'ho-chi-minh', 'Thanh pho nang dong', 1],
    [4, 'Nha Trang', 'Nha Trang', 'nha-trang', 'Thanh pho bien dep', 1],
    [5, 'Phu Quoc', 'Phu Quoc', 'phu-quoc', 'Dao ngoc Phu Quoc', 1],
    [6, 'Da Lat', 'Da Lat', 'da-lat', 'Thanh pho ngan hoa', 1],
    [7, 'Hoi An', 'Hoi An', 'hoi-an', 'Pho co ben song Hoai', 1],
    [8, 'Vung Tau', 'Vung Tau', 'vung-tau', 'Thanh pho bien gan Sai Gon', 0],
    [9, 'Can Tho', 'Can Tho', 'can-tho', 'Thanh pho Nam Bo', 0],
    [10, 'Hue', 'Hue', 'hue', 'Co dinh Hue', 0],
    [11, 'Sapa', 'Sapa', 'sapa', 'Thanh pho troi moc', 0],
    [12, 'Mui Ne', 'Mui Ne', 'mui-ne', 'Bai bien Mui Ne', 0],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO cities (id, name_vi, name_en, slug, description, is_popular) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($cities as $c) {
    $stmt->execute([$c[0], $c[1], $c[2], $c[3], $c[4], $c[5]]);
}
echo "Cities: " . $pdo->query("SELECT COUNT(*) FROM cities")->fetchColumn() . "\n";

// ============ TOUR CATEGORIES ============
$categories = [
    [1, 'Bien', 'Beach', 'beach', 'beach'],
    [2, 'Dao', 'Island', 'island', 'island'],
    [3, 'Nui', 'Mountain', 'mountain', 'mountain'],
    [4, 'Tham hiem', 'Adventure', 'adventure', 'adventure'],
    [5, 'Van hoa', 'Cultural', 'cultural', 'cultural'],
    [6, 'Am thuc', 'Food & Drink', 'food', 'food'],
    [7, 'Nghi duong', 'Resort', 'resort', 'resort'],
    [8, 'Thien nhien', 'Nature', 'nature', 'nature'],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO tour_categories (id, name_vi, name_en, slug, icon) VALUES (?, ?, ?, ?, ?)");
foreach ($categories as $cat) {
    $stmt->execute([$cat[0], $cat[1], $cat[2], $cat[3], $cat[4]]);
}
echo "Categories: " . $pdo->query("SELECT COUNT(*) FROM tour_categories")->fetchColumn() . "\n";

// ============ TOURS ============
$tours = [
    [1, 2, 1, 'Tour Ba Na Hills 1 Ngay - Khám Phá Châu Âu Giữa Lòng Đà Nẵng', 'ba-na-hills-1-ngay', 'Trải nghiệm cáp treo lên đỉnh Ba Na Hills, khám phá Thế Giới Kỳ Diệu, làng Pháp và núi Chúa.', 1500000, 750000],
    [2, 2, 1, 'Tour Đà Nẵng - Hội An 2 Ngày 1 Đêm', 'da-nang-hoi-an-2-ngay', 'Khám phá Đà Nẵng và Hội An cổ kính trong 2 ngày nghỉ ngơi tuyệt vời.', 2500000, 1250000],
    [3, 2, 1, 'Tour Bà Nà Hills - Đà Nẵng City 2N1Đ', 'ba-na-da-nang-2n1d', 'Kết hợp khám phá Ba Na Hills nổi tiếng và thành phố Đà Nẵng.', 3000000, 1500000],
    [4, 2, 1, 'Tour Đà Nẵng - Hội An - Ba Na 3N2Đ', 'da-nang-hoi-an-ba-na-3n2d', 'Combo trọn vẹn Đà Nẵng, Hội An và Ba Na Hills trong 3 ngày.', 4200000, 2100000],
    [5, 2, 1, 'Tour Mỹ Khê Beach - Biển Đẹp Nhất Đà Nẵng', 'my-khe-beach', 'Thư giãn tại bãi biển Mỹ Khê được Forbes bình chọn đẹp nhất Việt Nam.', 500000, 250000],
    [6, 2, 3, 'Tour Ngũ Hành Sơn - Đà Nẵng', 'ngu-hanh-son', 'Khám phá 5 ngọn núi đá nổi tiếng và làng đá Non Nước.', 300000, 150000],
    [7, 1, 3, 'Tour Hà Nội - Sapa 3N2Đ - Đường Quân Xá Đẹp', 'ha-noi-sapa-3n2d', 'Hành trình trekking Sapa qua bản làng người Hmong, Fansipan và ruộng bậc thang.', 4500000, 2250000],
    [8, 1, 5, 'Tour Hà Nội Cổ - Khám Phá 36 Phố Phường', 'ha-noi-co-36-pho-phuong', 'Đi bộ khám phá khu phố cổ Hà Nội, hồ Gươm, Văn Miếu, Chùa Trấn Quốc.', 200000, 100000],
    [9, 1, 6, 'Tour Ẩm Thực Hà Nội Về Đêm', 'am-thuc-ha-noi-ve-dem', 'Trải nghiệm ẩm thực đường phố Hà Nội: phở, bún chả, nem cua bể.', 600000, 300000],
    [10, 3, 7, 'Tour Mekong Delta - Cần Thơ 2N1Đ', 'mekong-delta-can-tho', 'Khám phá vùng đồng bằng sông Cửu Long, chợ nổi Cái Răng.', 2200000, 1100000],
    [11, 3, 2, 'Tour Côn Đảo - Hòn Hèo Biển Đảo', 'con-dao-hon-heo', 'Đắm mình trong làn nước biển trong xanh tại Côn Đảo.', 5500000, 2750000],
    [12, 3, 8, 'Tour Củ Chi - Địa Đạo Củ Chi', 'cu-chi-dia-dao', 'Khám phá hệ thống địa đạo Củ Chi lịch sử.', 400000, 200000],
    [13, 4, 1, 'Tour Nha Trang - Vinpearl Land 1 Ngày', 'nha-trang-vinpearl', 'Giải trí tại Vinpearl Land Nha Trang - công viên chủ đề lớn nhất miền Trung.', 1200000, 600000],
    [14, 4, 1, 'Tour 4 Đảo Nha Trang - Lặn Biển Ngắm San Hô', '4-dao-nha-trang', 'Khám phá 4 đảo đẹp nhất Nha Trang, lặn ngắm san hô.', 800000, 400000],
    [15, 6, 3, 'Tour Đà Lạt - Thác Datanla - Đồi Cù', 'da-lat-thac-datanla', 'Khám phá thác nước Datanla, thung lũng Tình Yêu và Đồi Cù.', 600000, 300000],
    [16, 6, 6, 'Tour Đà Lạt - Trải Nghiệm Cà Phê Cốc Cốc', 'da-lat-cafe', 'Thưởng thức cà phê Mèo, cà phê cốc cốc nổi tiếng Đà Lạt.', 400000, 200000],
    [17, 5, 2, 'Tour Phú Quốc - Grand World 1 Ngày', 'phu-quoc-grand-world', 'Khám phá Grand World Phú Quốc - phức hợp giải trí đẳng cấp.', 1500000, 750000],
    [18, 5, 1, 'Tour Phú Quốc - Bãi Sao - Lặn Ngắm San Hô', 'phu-quoc-bai-sao', 'Thư giãn tại bãi Sao hoang sơ và lặn ngắm san hô tuyệt đẹp.', 900000, 450000],
    [19, 10, 5, 'Tour Huế - Cố Đô 1 Ngày', 'hue-co-do', 'Khám phá kinh thành Huế, lăng tẩm các vua Nguyễn và chùa Thiên Mu.', 800000, 400000],
    [20, 7, 5, 'Tour Hội An - Phố Cổ Lung Tung', 'hoi-an-pho-co', 'Đi bộ khám phá phố cổ Hội An, thảo lantern, ẩm thực đường phố.', 400000, 200000],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO tours (id, city_id, category_id, title, slug, description, price_per_adult, price_per_child, duration_days, duration_nights, max_group_size, min_group_size, difficulty, is_active, is_featured, review_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 20, 2, 'EASY', 1, 0, 0, ?, ?)");
foreach ($tours as $t) {
    $stmt->execute([$t[0], $t[1], $t[2], $t[3], $t[4], $t[5], $t[6], $t[7], $now, $now]);
}
echo "Tours: " . $pdo->query("SELECT COUNT(*) FROM tours")->fetchColumn() . "\n";

// ============ HOTELS ============
$hotels = [
    [1, 2, 'Sunrise Hotel', 'sunrise-hotel', 'Khách sạn 5 sao view biển Mỹ Khê', '78 Ho Xuan Huong', 16.0544, 108.2022, 5, 300000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [2, 2, 'Danang Beach Resort', 'danang-beach-resort', 'Khu nghỉ dưỡng biển cao cấp', '45 Vo Nguyen Giap', 16.0544, 108.2022, 4, 250000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [3, 2, 'Grand Mercure Danang', 'grand-mercure-danang', 'Khách sạn sang trọng tại trung tâm', '08 Tran Phu', 16.0544, 108.2022, 5, 500000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [4, 2, 'Minh Toan Hotel', 'minh-toan-hotel', 'Khách sạn 3 sao tiện nghi', '12 Nguyen Van Linh', 16.0544, 108.2022, 3, 180000, '14:00', '12:00', 0, 0, 'PENDING'],
    [5, 2, 'Sandy Beach Hotel Danang', 'sandy-beach-hotel', 'Khách sạn gần bãi biển', '56 Vo Nguyen Giap', 16.0544, 108.2022, 4, 220000, '14:00', '12:00', 1, 0, 'APPROVED'],
    [6, 2, 'Aria Grand Hotel & Spa', 'aria-grand-hotel', 'Khách sạn & spa cao cấp', '23 Tran Quang Khai', 16.0544, 108.2022, 4, 280000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [7, 1, 'Hanoi Grand Hotel', 'hanoi-grand-hotel', 'Khách sạn 5 sao ngay hồ Gươm', '24 Pho Hue', 21.0285, 105.8542, 5, 450000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [8, 1, 'Old Quarter Hostel', 'old-quarter-hostel', 'Hostel tại khu phố cổ tiện lợi', '36 Hang Bac', 21.0341, 105.8493, 2, 120000, '14:00', '12:00', 0, 0, 'APPROVED'],
    [9, 1, 'Hanoi Pearl Hotel', 'hanoi-pearl-hotel', 'Khách sạn 4 sao gần hồ Hoàn Kiếm', '10 Cau Go', 21.0285, 105.8542, 4, 350000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [10, 3, 'Caravelle Hotel Saigon', 'caravelle-hotel', 'Khách sạn huyền thoại quận 1', '19 Lam Son Square', 10.7795, 106.6989, 5, 600000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [11, 3, 'Liberty Central Hotel', 'liberty-central-hotel', 'Khách sạn trung tâm quận 1', '32 Dong Khoi', 10.7795, 106.6989, 4, 320000, '14:00', '12:00', 1, 0, 'APPROVED'],
    [12, 3, 'Budget Inn District 3', 'budget-inn-d3', 'Khách sạn bình dân quận 3', '78 Nguyen Dinh Chieu', 10.7865, 106.6872, 2, 150000, '14:00', '12:00', 0, 0, 'PENDING'],
    [13, 4, 'Vinpearl Resort Nha Trang', 'vinpearl-resort', 'Resort 5 sao trên đảo Hòn Tre', 'Hon Tre Island', 12.2388, 109.1964, 5, 800000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [14, 4, 'Nha Trang Beach Hotel', 'nha-trang-beach-hotel', 'Khách sạn view biển đẹp', '62 Tran Phu', 12.2388, 109.1964, 4, 380000, '14:00', '12:00', 1, 0, 'APPROVED'],
    [15, 4, 'Yasaka Nha Trang Hotel', 'yasaka-hotel', 'Khách sạn 4 sao Nha Trang', '18 Tran Phu', 12.2388, 109.1964, 4, 290000, '14:00', '12:00', 1, 0, 'APPROVED'],
    [16, 5, 'Vinpearl Phu Quoc Resort', 'vinpearl-phu-quoc', 'Resort cao cấp Phú Quốc', 'Bai Dai', 10.1522, 103.9553, 5, 900000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [17, 5, 'Salinda Resort Phu Quoc', 'salinda-resort', 'Khu nghỉ dưỡng bãi biển', 'Cua Can', 10.1522, 103.9553, 5, 750000, '14:00', '12:00', 1, 0, 'APPROVED'],
    [18, 6, 'Dalat Palace Hotel', 'dalat-palace-hotel', 'Khách sạn cổ điển sang trọng', '12 Tran Phu', 11.9394, 108.4373, 5, 550000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [19, 6, 'Saphir Dalat Hotel', 'saphir-hotel', 'Khách sạn 4 sao Đà Lạt', '4 Phan Boi Chau', 11.9394, 108.4373, 4, 280000, '14:00', '12:00', 1, 0, 'APPROVED'],
    [20, 7, 'Anantara Hoi An Resort', 'anantara-hoi-an', 'Resort 5 sao bên sông Hoài', '1 Pham Hong Thai', 15.8881, 108.3384, 5, 650000, '14:00', '12:00', 1, 1, 'APPROVED'],
    [21, 7, 'Hoi An Beach Resort', 'hoi-an-beach-resort', 'Khu nghỉ dưỡng gần biển Cửa Đại', '45 Cua Dai', 15.8881, 108.3384, 4, 420000, '14:00', '12:00', 1, 0, 'APPROVED'],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO hotels (id, city_id, name, slug, description, address, latitude, longitude, star_rating, price_per_night, check_in_time, check_out_time, is_featured, is_active, is_trending, review_count, created_at, updated_at, admin_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)");
foreach ($hotels as $h) {
    $stmt->execute([$h[0], $h[1], $h[2], $h[3], $h[4], $h[5], $h[6], $h[7], $h[8], $h[9], $h[10], $h[11], $h[12], $h[13], 0, $now, $now, $h[14]]);
}
echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";

// ============ ROOM TYPES ============
$rooms = [
    [1, 1, 'Standard Room', 'Phong Standard view thuong', 2, 0, 'Queen Bed', 25, 300000, 10, 1],
    [2, 1, 'Deluxe Ocean View', 'Phong Deluxe view bien', 2, 0, 'King Bed', 35, 450000, 5, 1],
    [3, 1, 'Suite Sea View', 'Phong Suite view bien tuyet dep', 3, 0, 'King Bed', 50, 700000, 3, 1],
    [4, 3, 'Superior Room', 'Phong Superior tien nghi', 2, 0, 'Queen Bed', 30, 500000, 8, 1],
    [5, 3, 'Premium Room', 'Phong Premium rong rai', 2, 0, 'King Bed', 40, 650000, 5, 1],
    [6, 7, 'Classic Room', 'Phong Classic thong thoang', 2, 0, 'Queen Bed', 28, 450000, 10, 1],
    [7, 7, 'Executive Suite', 'Phong Executive Suite cao cap', 3, 0, 'King Bed', 55, 800000, 3, 1],
    [8, 10, 'Deluxe Room', 'Phong Deluxe sang trong', 2, 0, 'King Bed', 35, 600000, 8, 1],
    [9, 10, 'Premium Suite', 'Phong Premium Suite view thanh pho', 3, 0, 'King Bed', 60, 1000000, 4, 1],
    [10, 13, 'Beach Villa', 'Biet thuc view bien', 4, 0, 'King Bed', 80, 1500000, 5, 1],
    [11, 13, 'Standard Room', 'Phong Standard tien nghi', 2, 0, 'Queen Bed', 30, 800000, 15, 1],
    [12, 16, 'Beach Villa', 'Biet thuc bai bien', 4, 0, 'King Bed', 85, 1800000, 4, 1],
    [13, 20, 'Superior Room', 'Phong Superior phong cach', 2, 0, 'Queen Bed', 32, 650000, 8, 1],
    [14, 20, 'Suite River View', 'Phong Suite view song', 3, 0, 'King Bed', 50, 950000, 4, 1],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO room_types (id, hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($rooms as $r) {
    $stmt->execute([$r[0], $r[1], $r[2], $r[3], $r[4], $r[5], $r[6], $r[7], $r[8], $r[9], $r[10], $now, $now]);
}
echo "Room types: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";

// ============ TOUR DEPARTURES ============
$departures = [
    [1, 1, '2026-05-01', 20],
    [2, 1, '2026-05-10', 8],
    [3, 2, '2026-05-03', 20],
    [4, 2, '2026-05-17', 12],
    [5, 4, '2026-05-05', 22],
    [6, 7, '2026-05-08', 18],
    [7, 10, '2026-05-02', 20],
    [8, 13, '2026-05-04', 10],
    [9, 14, '2026-05-06', 25],
    [10, 15, '2026-05-07', 15],
    [11, 16, '2026-05-09', 12],
    [12, 17, '2026-05-11', 10],
    [13, 18, '2026-05-12', 20],
    [14, 19, '2026-05-13', 15],
    [15, 20, '2026-05-14', 18],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO tour_departures (id, tour_id, departure_date, available_slots) VALUES (?, ?, ?, ?)");
foreach ($departures as $d) {
    $stmt->execute([$d[0], $d[1], $d[2], $d[3]]);
}
echo "Tour departures: " . $pdo->query("SELECT COUNT(*) FROM tour_departures")->fetchColumn() . "\n";

// ============ AMENITIES ============
$amenities = [
    [1, 'wifi', 'WiFi', 'WiFi', 'wifi', 'BOTH'],
    [2, 'pool', 'Bể bơi', 'Pool', 'pool', 'HOTEL'],
    [3, 'restaurant', 'Nhà hàng', 'Restaurant', 'utensils', 'HOTEL'],
    [4, 'spa', 'Spa', 'Spa', 'spa', 'HOTEL'],
    [5, 'gym', 'Gym', 'Gym', 'dumbbell', 'HOTEL'],
    [6, 'parking', 'Bãi đỗ xe', 'Parking', 'car', 'HOTEL'],
    [7, 'bar', 'Bar', 'Bar', 'wine', 'HOTEL'],
    [8, 'laundry', 'Giặt ủi', 'Laundry', 'shirt', 'HOTEL'],
    [9, 'ac', 'Điều hòa', 'Air Conditioning', 'snowflake', 'HOTEL'],
    [10, 'breakfast', 'Ăn sáng', 'Breakfast', 'coffee', 'HOTEL'],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO amenities (id, code, name_vi, name_en, icon, category) VALUES (?, ?, ?, ?, ?, ?)");
foreach ($amenities as $a) {
    $stmt->execute([$a[0], $a[1], $a[2], $a[3], $a[4], $a[5]]);
}
echo "Amenities: " . $pdo->query("SELECT COUNT(*) FROM amenities")->fetchColumn() . "\n";

// ============ HOTEL AMENITIES ============
$ha_stmt = $pdo->prepare("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) VALUES (?, ?)");
foreach ([1,2,3,5,6,7,8,9,10] as $aid) $ha_stmt->execute([1, $aid]);
foreach ([1,2,3,6,7,10] as $aid) $ha_stmt->execute([2, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([3, $aid]);
foreach ([1,3,6,9] as $aid) $ha_stmt->execute([4, $aid]);
foreach ([1,2,3,6,7,10] as $aid) $ha_stmt->execute([5, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([6, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([7, $aid]);
foreach ([1,3,6,9] as $aid) $ha_stmt->execute([8, $aid]);
foreach ([1,2,3,4,5,6,7,9,10] as $aid) $ha_stmt->execute([9, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([10, $aid]);
foreach ([1,2,3,5,6,7,10] as $aid) $ha_stmt->execute([11, $aid]);
foreach ([1,3,6,9] as $aid) $ha_stmt->execute([12, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([13, $aid]);
foreach ([1,2,3,6,7,10] as $aid) $ha_stmt->execute([14, $aid]);
foreach ([1,2,3,4,5,6,7,9,10] as $aid) $ha_stmt->execute([15, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([16, $aid]);
foreach ([1,2,3,4,5,6,7,9,10] as $aid) $ha_stmt->execute([17, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([18, $aid]);
foreach ([1,2,3,5,6,7,9,10] as $aid) $ha_stmt->execute([19, $aid]);
foreach ([1,2,3,4,5,6,7,8,9,10] as $aid) $ha_stmt->execute([20, $aid]);
foreach ([1,2,3,4,5,6,7,9,10] as $aid) $ha_stmt->execute([21, $aid]);
echo "Hotel amenities linked.\n";

echo "\n=== DONE ===\n";

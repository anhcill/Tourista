<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$now = date('Y-m-d H:i:s');

// ============ HOTELS (no price_per_night column) ============
$hotels = [
    [1, 2, 'Sunrise Hotel', 'sunrise-hotel', 'Khách sạn 5 sao view biển Mỹ Khê', '78 Ho Xuan Huong', 16.0544, 108.2022, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [2, 2, 'Danang Beach Resort', 'danang-beach-resort', 'Khu nghỉ dưỡng biển cao cấp', '45 Vo Nguyen Giap', 16.0544, 108.2022, 4, '14:00', '12:00', 1, 1, 'APPROVED'],
    [3, 2, 'Grand Mercure Danang', 'grand-mercure-danang', 'Khách sạn sang trọng tại trung tâm', '08 Tran Phu', 16.0544, 108.2022, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [4, 2, 'Minh Toan Hotel', 'minh-toan-hotel', 'Khách sạn 3 sao tiện nghi', '12 Nguyen Van Linh', 16.0544, 108.2022, 3, '14:00', '12:00', 0, 0, 'PENDING'],
    [5, 2, 'Sandy Beach Hotel Danang', 'sandy-beach-hotel', 'Khách sạn gần bãi biển', '56 Vo Nguyen Giap', 16.0544, 108.2022, 4, '14:00', '12:00', 1, 0, 'APPROVED'],
    [6, 2, 'Aria Grand Hotel & Spa', 'aria-grand-hotel', 'Khách sạn & spa cao cấp', '23 Tran Quang Khai', 16.0544, 108.2022, 4, '14:00', '12:00', 1, 1, 'APPROVED'],
    [7, 1, 'Hanoi Grand Hotel', 'hanoi-grand-hotel', 'Khách sạn 5 sao ngay hồ Gươm', '24 Pho Hue', 21.0285, 105.8542, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [8, 1, 'Old Quarter Hostel', 'old-quarter-hostel', 'Hostel tại khu phố cổ tiện lợi', '36 Hang Bac', 21.0341, 105.8493, 2, '14:00', '12:00', 0, 0, 'APPROVED'],
    [9, 1, 'Hanoi Pearl Hotel', 'hanoi-pearl-hotel', 'Khách sạn 4 sao gần hồ Hoàn Kiếm', '10 Cau Go', 21.0285, 105.8542, 4, '14:00', '12:00', 1, 1, 'APPROVED'],
    [10, 3, 'Caravelle Hotel Saigon', 'caravelle-hotel', 'Khách sạn huyền thoại quận 1', '19 Lam Son Square', 10.7795, 106.6989, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [11, 3, 'Liberty Central Hotel', 'liberty-central-hotel', 'Khách sạn trung tâm quận 1', '32 Dong Khoi', 10.7795, 106.6989, 4, '14:00', '12:00', 1, 0, 'APPROVED'],
    [12, 3, 'Budget Inn District 3', 'budget-inn-d3', 'Khách sạn bình dân quận 3', '78 Nguyen Dinh Chieu', 10.7865, 106.6872, 2, '14:00', '12:00', 0, 0, 'PENDING'],
    [13, 4, 'Vinpearl Resort Nha Trang', 'vinpearl-resort', 'Resort 5 sao trên đảo Hòn Tre', 'Hon Tre Island', 12.2388, 109.1964, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [14, 4, 'Nha Trang Beach Hotel', 'nha-trang-beach-hotel', 'Khách sạn view biển đẹp', '62 Tran Phu', 12.2388, 109.1964, 4, '14:00', '12:00', 1, 0, 'APPROVED'],
    [15, 4, 'Yasaka Nha Trang Hotel', 'yasaka-hotel', 'Khách sạn 4 sao Nha Trang', '18 Tran Phu', 12.2388, 109.1964, 4, '14:00', '12:00', 1, 0, 'APPROVED'],
    [16, 5, 'Vinpearl Phu Quoc Resort', 'vinpearl-phu-quoc', 'Resort cao cấp Phú Quốc', 'Bai Dai', 10.1522, 103.9553, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [17, 5, 'Salinda Resort Phu Quoc', 'salinda-resort', 'Khu nghỉ dưỡng bãi biển', 'Cua Can', 10.1522, 103.9553, 5, '14:00', '12:00', 1, 0, 'APPROVED'],
    [18, 6, 'Dalat Palace Hotel', 'dalat-palace-hotel', 'Khách sạn cổ điển sang trọng', '12 Tran Phu', 11.9394, 108.4373, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [19, 6, 'Saphir Dalat Hotel', 'saphir-hotel', 'Khách sạn 4 sao Đà Lạt', '4 Phan Boi Chau', 11.9394, 108.4373, 4, '14:00', '12:00', 1, 0, 'APPROVED'],
    [20, 7, 'Anantara Hoi An Resort', 'anantara-hoi-an', 'Resort 5 sao bên sông Hoài', '1 Pham Hong Thai', 15.8881, 108.3384, 5, '14:00', '12:00', 1, 1, 'APPROVED'],
    [21, 7, 'Hoi An Beach Resort', 'hoi-an-beach-resort', 'Khu nghỉ dưỡng gần biển Cửa Đại', '45 Cua Dai', 15.8881, 108.3384, 4, '14:00', '12:00', 1, 0, 'APPROVED'],
];

$stmt = $pdo->prepare("INSERT IGNORE INTO hotels (id, city_id, name, slug, description, address, latitude, longitude, star_rating, check_in_time, check_out_time, is_featured, is_active, is_trending, review_count, created_at, updated_at, admin_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)");
foreach ($hotels as $h) {
    $stmt->execute([$h[0], $h[1], $h[2], $h[3], $h[4], $h[5], $h[6], $h[7], $h[8], $h[9], $h[10], $h[11], $h[12], 0, $now, $now, $h[13]]);
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

echo "\n=== FINAL COUNTS ===\n";
echo "Cities: " . $pdo->query("SELECT COUNT(*) FROM cities")->fetchColumn() . "\n";
echo "Tour categories: " . $pdo->query("SELECT COUNT(*) FROM tour_categories")->fetchColumn() . "\n";
echo "Tours: " . $pdo->query("SELECT COUNT(*) FROM tours")->fetchColumn() . "\n";
echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";
echo "Room types: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";
echo "Tour departures: " . $pdo->query("SELECT COUNT(*) FROM tour_departures")->fetchColumn() . "\n";
echo "Amenities: " . $pdo->query("SELECT COUNT(*) FROM amenities")->fetchColumn() . "\n";
echo "\nDONE!\n";

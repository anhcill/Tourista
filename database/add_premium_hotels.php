<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
echo "Starting...\n";

// STEP 1: Amenities already added in previous run, skip
echo "Step 1: Amenities check...\n";

// STEP 2: Get amenity IDs
$aIds = [];
$codes = ['wifi','parking','pool','gym','spa','restaurant','bar','breakfast','air_conditioning','room_service','airport_shuttle','pet_friendly','kids_club','beach_access','concierge'];
foreach ($codes as $code) {
    $aIds[$code] = $pdo->query("SELECT id FROM amenities WHERE code='$code'")->fetchColumn();
}
echo "Got amenity IDs.\n";

// STEP 2: Bulk amenities for 3-star
echo "Step 2a: Adding amenities to 3-star hotels...\n";
$pdo->exec("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) SELECT id, {$aIds['wifi']} FROM hotels WHERE star_rating = 3");
$pdo->exec("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) SELECT id, {$aIds['breakfast']} FROM hotels WHERE star_rating = 3");
$pdo->exec("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) SELECT id, {$aIds['air_conditioning']} FROM hotels WHERE star_rating = 3");
$pdo->exec("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) SELECT id, {$aIds['parking']} FROM hotels WHERE star_rating = 3");
echo "3-star amenities done.\n";

// 4-star
echo "Step 2b: Adding amenities to 4-star hotels...\n";
foreach (['wifi','breakfast','air_conditioning','parking','restaurant','pool','gym','room_service'] as $code) {
    $pdo->exec("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) SELECT id, {$aIds[$code]} FROM hotels WHERE star_rating = 4");
}
echo "4-star amenities done.\n";

// 5-star
echo "Step 2c: Adding amenities to 5-star hotels...\n";
foreach ($codes as $code) {
    $pdo->exec("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) SELECT id, {$aIds[$code]} FROM hotels WHERE star_rating >= 5");
}
echo "5-star amenities done.\n";

// STEP 3: Add premium hotels
echo "Step 3: Adding premium featured hotels...\n";
$premiumHotels = [
    ['Sofitel Legend Metropole Hanoi', 'sofitel-legend-metropole-hanoi', 'Khach san 5 sao trung tam Ha Noi voi lich su hon 120 nam. Trai nghiem lai lich su trong khong gian sang trong.', '15 Ngo Quyen, Hoan Kiem, Ha Noi', 21.0285, 105.8566, 5, 9.20, 3240, 'ha-noi'],
    ['JW Marriott Hotel Hanoi', 'jw-marriott-hotel-hanoi', 'Khach san cao cap khu My Dinh, noi tiep theo cua chuoi Marriott hau can.', 'Do Duc Duc, Nam Tu Liem, Ha Noi', 21.0285, 105.7856, 5, 8.90, 1876, 'ha-noi'],
    ['Lotte Hotel Hanoi', 'lotte-hotel-hanoi', 'Khach san sang trong tren cao voi tam nhin rong khap thanh pho.', '54 Lieu Giai, Ba Dinh, Ha Noi', 21.0365, 105.8226, 5, 8.75, 1422, 'ha-noi'],
    ['Hotel de l\'Opera Hanoi', 'hotel-de-lopera-hanoi', 'Khach san boutique 5 sao gan Opera House, phong cach Phap.', '56 Ma May, Hoan Kiem, Ha Noi', 21.0345, 105.8526, 5, 9.10, 890, 'ha-noi'],
    ['Furama Resort Danang', 'furama-resort-danang', 'Resort 5 sao sat bien My Khe voi chuan quoc te.', '68 Ho Xuan Huong, Da Nang', 16.0544, 108.2027, 5, 9.10, 2103, 'da-nang'],
    ['Hyatt Regency Danang Resort', 'hyatt-regency-danang', 'Resort view bien Non Nuoc voi 5 tru khong.', 'Truong Sa, Ngu Hanh Son, Da Nang', 16.0315, 108.2281, 5, 9.30, 1562, 'da-nang'],
    ['Novotel Danang Premier Han River', 'novotel-danang-premier-han-river', 'Khach san 5 sao ben song Han voi tam nhin thanh pho tuyen mat.', '36 Bach Dang, Hai Chau, Da Nang', 16.0678, 108.2209, 5, 8.55, 1191, 'da-nang'],
    ['Pullman Danang Beach Resort', 'pullman-danang-beach-resort', 'Resort 5 sao tai bai bien My Khe, thiet ke hien dai.', '3 Vo Nguyen Giap, Da Nang', 16.0544, 108.2057, 5, 9.05, 1234, 'da-nang'],
    ['Vinpearl Resort Nha Trang', 'vinpearl-resort-nha-trang', 'Resort nghi duong tren dao Hon Tre voi he thong vuon troi choi.', 'Hon Tre, Nha Trang', 12.2451, 109.1942, 5, 8.80, 4521, 'nha-trang'],
    ['InterContinental Nha Trang', 'intercontinental-nha-trang', 'Khach san trung tam duong Tran Phu voi spa va skypool.', '32-34 Tran Phu, Nha Trang', 12.2176, 109.1942, 5, 9.05, 2334, 'nha-trang'],
    ['Sheraton Nha Trang Hotel & Spa', 'sheraton-nha-trang', 'Khach san mat bien co spa va nha hang chuyen nghiep.', '26-28 Tran Phu, Nha Trang', 12.2168, 109.1960, 5, 8.70, 1608, 'nha-trang'],
    ['InterContinental Phu Quoc Long Beach Resort', 'intercontinental-phu-quoc-long-beach', 'Resort sang trong Bai Truong voi 12 nha hang va bar.', 'Bai Truong, Phu Quoc', 10.2105, 103.9667, 5, 9.40, 2876, 'phu-quoc'],
    ['Premier Village Phu Quoc Resort', 'premier-village-phu-quoc-resort', 'Resort biet lap 2 mat bien voi villa rieng.', 'Mui Ong Doi, An Thoi, Phu Quoc', 10.1982, 103.9421, 5, 9.10, 1310, 'phu-quoc'],
    ['Movenpick Resort Waverly Phu Quoc', 'movenpick-resort-phu-quoc', 'Resort phu hop gia dinh voi bai bien rieng.', 'Ong Lang, Cua Duong, Phu Quoc', 10.2210, 103.9515, 5, 8.65, 1022, 'phu-quoc'],
    ['The Reverie Saigon', 'the-reverie-saigon', 'Khach san sieu sang quan 1 voi noi that thiet ke Italy.', '22-36 Nguyen Hue, Quan 1, TP.HCM', 10.7765, 106.7017, 5, 9.35, 1984, 'ho-chi-minh'],
    ['Hotel Nikko Saigon', 'hotel-nikko-saigon', 'Khach san 5 sao khu quan 1 mo rong voi spa va buffet.', '235 Nguyen Van Cu, Quan 1, TP.HCM', 10.7635, 106.6930, 5, 8.85, 1760, 'ho-chi-minh'],
    ['Fusion Original Saigon Centre', 'fusion-original-saigon-centre', 'Khach san tre trung tai trung tam voi yoga va spa.', '65 Le Loi, Quan 1, TP.HCM', 10.7725, 106.6980, 4, 8.60, 845, 'ho-chi-minh'],
    ['Park Hyatt Saigon', 'park-hyatt-saigon', 'Khach san 5 sao lich sam tai quan 1.', '2 Lam Son Square, Quan 1, TP.HCM', 10.7795, 106.7027, 5, 9.15, 1567, 'ho-chi-minh'],
    ['Dalat Palace Heritage Hotel', 'dalat-palace-heritage-hotel', 'Khach san co dien ben ho Xuan Huong, khu nghi duong hoang gia.', '2 Tran Phu, Da Lat', 11.9356, 108.4417, 5, 8.95, 980, 'da-lat'],
    ['Ana Mandara Villas Dalat Resort & Spa', 'ana-mandara-villas-dalat', 'Khu nghi duong villa giua rung thong voi 17 biet thu.', 'Le Lai, Da Lat', 11.9470, 108.4447, 5, 9.00, 1244, 'da-lat'],
    ['La Siesta Hoi An Resort & Spa', 'la-siesta-hoi-an-resort', 'Resort gan pho co Hoi An voi phong cach Viet-Nam.', '132 Hung Vuong, Hoi An', 15.8801, 108.3380, 5, 9.25, 1111, 'hoi-an'],
    ['Anantara Hoi An Resort', 'anantara-hoi-an-resort', 'Resort 5 sao ben song Hoai voi tam nhin pho co.', '1 Pham Hong Thai, Hoi An', 15.8795, 108.3350, 5, 9.15, 890, 'hoi-an'],
    ['Azerai La Residence Hue', 'azerai-la-residence-hue', 'Khach san thanh lich ben song Huong voi kien truc Phap.', '5 Le Loi, Hue', 16.4677, 107.5823, 5, 9.15, 920, 'hue'],
    ['Pilgrimage Village Hue Resort & Spa', 'pilgrimage-village-hue', 'Resort nghi duong 5 sao gan Dai Noi Hue.', '130 Nguyen Van Troi, Hue', 16.4655, 107.5800, 5, 9.00, 765, 'hue'],
    ['The Imperial Hotel Vung Tau', 'the-imperial-hotel-vung-tau', 'Khach san gan bai sau Vung Tau voi ho boi lon.', '159 Thuy Van, Vung Tau', 10.3425, 107.0847, 5, 8.45, 1668, 'vung-tau'],
    ['White House Hotel Vung Tau', 'white-house-hotel-vung-tau', 'Khach san 4 sao mat bien tai bai Sau.', '28 Thuy Van, Vung Tau', 10.3455, 107.0857, 4, 8.30, 890, 'vung-tau'],
    ['Wyndham Legend Halong', 'wyndham-legend-halong', 'Khach san nhin ra Vinh Ha Long voi ho boi infinity.', '12 Ha Long, Bai Chay, Ha Long', 20.9580, 107.0467, 5, 8.78, 1502, 'ha-long'],
    ['Novotel Ha Long Bay', 'novotel-halong-bay', 'Khach san 5 sao ben vinh Ha Long voi view tuyen mat.', '160 Ha Long, Bai Chay, Ha Long', 20.9530, 107.0437, 5, 8.60, 1123, 'ha-long'],
    ['Sao Mai Hotel Can Tho', 'sao-mai-hotel-can-tho', 'Khach san 4 sao gan cho noi Cai Rang.', '111 Nguyen Van Linh, Can Tho', 10.0345, 105.7877, 4, 8.40, 678, 'can-tho'],
    ['Ninh Kieu Riverside Hotel', 'ninh-kieu-riverside-hotel', 'Khach san 4 sao ben song Hau, tam nhin cau Can Tho.', '9 Nguyen Canh Chan, Can Tho', 10.0325, 105.7857, 4, 8.25, 543, 'can-tho'],
    ['Topas Ecolodge Sapa', 'topas-ecolodge-sapa', 'Eco lodge tren doi nui voi view ruong bac thang.', 'Thanh Kim, Sapa', 22.3356, 103.8456, 4, 9.20, 456, 'sa-pa'],
    ['Sapa Jade Hill Resort', 'sapa-jade-hill-resort', 'Resort 4 sao nhin tam nhin toan canh Sapa.', 'Khu Jade Hill, Sapa', 22.3386, 103.8436, 4, 8.85, 678, 'sa-pa'],
];

$hotelIds = [];
foreach ($premiumHotels as $h) {
    list($name, $slug, $desc, $addr, $lat, $lng, $stars, $rating, $reviews, $citySlug) = $h;
    $cityId = $pdo->query("SELECT id FROM cities WHERE slug='$citySlug' LIMIT 1")->fetchColumn();
    if (!$cityId) { echo "SKIP $slug\n"; continue; }
    try {
        $pdo->prepare("INSERT IGNORE INTO hotels (city_id, name, slug, description, address, latitude, longitude, star_rating, avg_rating, review_count, check_in_time, check_out_time, is_featured, is_trending, is_active, admin_status) SELECT ?,?,?,?,?,?,?,?,?,?,'14:00:00','12:00:00',1,1,1,'APPROVED' FROM cities WHERE id=?")
            ->execute([$cityId, $name, $slug, $desc, $addr, $lat, $lng, $stars, $rating, $reviews, $cityId]);
        $id = $pdo->lastInsertId();
        if ($id) { $hotelIds[$slug] = $id; echo "  Hotel: $name (ID: $id)\n"; }
    } catch (Exception $e) {}
}

// STEP 4: Images
echo "Step 4: Adding hotel images...\n";
$images = [
    'sofitel-legend-metropole-hanoi' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    'jw-marriott-hotel-hanoi' => 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=80',
    'lotte-hotel-hanoi' => 'https://images.unsplash.com/photo-1549294413-26f195200c16?w=1200&q=80',
    'hotel-de-lopera-hanoi' => 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
    'furama-resort-danang' => 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=80',
    'hyatt-regency-danang' => 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80',
    'novotel-danang-premier-han-river' => 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=1200&q=80',
    'pullman-danang-beach-resort' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
    'vinpearl-resort-nha-trang' => 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=80',
    'intercontinental-nha-trang' => 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80',
    'sheraton-nha-trang' => 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
    'intercontinental-phu-quoc-long-beach' => 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
    'premier-village-phu-quoc-resort' => 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=1200&q=80',
    'movenpick-resort-phu-quoc' => 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1200&q=80',
    'the-reverie-saigon' => 'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=1200&q=80',
    'hotel-nikko-saigon' => 'https://images.unsplash.com/photo-1560067174-8941cd8e2765?w=1200&q=80',
    'fusion-original-saigon-centre' => 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80',
    'park-hyatt-saigon' => 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
    'dalat-palace-heritage-hotel' => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80',
    'ana-mandara-villas-dalat' => 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1200&q=80',
    'la-siesta-hoi-an-resort' => 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
    'anantara-hoi-an-resort' => 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=1200&q=80',
    'azerai-la-residence-hue' => 'https://images.unsplash.com/photo-1561501900-3701fa6a0864?w=1200&q=80',
    'pilgrimage-village-hue' => 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=1200&q=80',
    'the-imperial-hotel-vung-tau' => 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?w=1200&q=80',
    'white-house-hotel-vung-tau' => 'https://images.unsplash.com/photo-1501117716987-c8e1ecb2109d?w=1200&q=80',
    'wyndham-legend-halong' => 'https://images.unsplash.com/photo-1501117716987-c8e1ecb2109d?w=1200&q=80',
    'novotel-halong-bay' => 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1200&q=80',
    'sao-mai-hotel-can-tho' => 'https://images.unsplash.com/photo-1560067174-8941cd8e2765?w=1200&q=80',
    'ninh-kieu-riverside-hotel' => 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=1200&q=80',
    'topas-ecolodge-sapa' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    'sapa-jade-hill-resort' => 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
];
$insertImg = $pdo->prepare("INSERT IGNORE INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order) VALUES (?,?,?,1,0)");
foreach ($images as $slug => $url) {
    if (!isset($hotelIds[$slug])) continue;
    $insertImg->execute([$hotelIds[$slug], $url, $slug]);
}
echo "Images added.\n";

// STEP 5: Room types
echo "Step 5: Adding room types...\n";
$insertRoom = $pdo->prepare("INSERT IGNORE INTO room_types (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active) VALUES (?,?,?,?,?,?,?,?,?,1)");
foreach ($hotelIds as $slug => $hotelId) {
    $stars = $pdo->query("SELECT star_rating FROM hotels WHERE id=$hotelId")->fetchColumn();
    $price5 = $stars >= 5 ? 2800000 : 1800000;
    $price4 = $stars >= 5 ? 4200000 : 2800000;
    $priceSuite = $stars >= 5 ? 7500000 : 4500000;
    $insertRoom->execute([$hotelId, 'Standard Room', 'Standard Room', 2, 1, 'Double', 28, $price5, 15]);
    $insertRoom->execute([$hotelId, 'Deluxe Room', 'Deluxe Room voi tam nhin dep', 2, 1, 'King', 38, $price4, 20]);
    if ($stars >= 5) $insertRoom->execute([$hotelId, 'Suite', 'Suite sang trong', 3, 1, 'King', 65, $priceSuite, 8]);
}
echo "Room types added.\n";

// STEP 6: Amenities for premium hotels
echo "Step 6: Adding amenities for premium hotels...\n";
$allAids = array_column($pdo->query("SELECT id FROM amenities WHERE category='HOTEL'")->fetchAll(PDO::FETCH_ASSOC), 'id');
$insertHA = $pdo->prepare("INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id) VALUES (?,?)");
foreach ($hotelIds as $hotelId) {
    foreach ($allAids as $aid) {
        try { $insertHA->execute([$hotelId, $aid]); } catch (Exception $e) {}
    }
}
echo "Premium hotel amenities added.\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\n=== FINAL HOTEL COUNTS ===\n";
echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";
echo "Featured hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_featured = 1")->fetchColumn() . "\n";
echo "Hotel images: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";
echo "Room types: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";
echo "Hotel amenities: " . $pdo->query("SELECT COUNT(*) FROM hotel_amenities")->fetchColumn() . "\n";
echo "\nALL DONE!\n";

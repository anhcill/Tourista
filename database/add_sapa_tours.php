<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

$now = date('Y-m-d H:i:s');

// Add Sapa city
$pdo->exec("INSERT IGNORE INTO cities (country_id, name_vi, name_en, slug, description, is_popular)
    SELECT c.id, 'Sapa', 'Sapa', 'sapa', 'Thi tran ngam mua o vung cao nguyen', FALSE
    FROM countries c WHERE c.code = 'VN'");
echo "Sapa city added.\n";

// Get IDs
$sapaId = $pdo->query("SELECT id FROM cities WHERE slug='sapa'")->fetchColumn();
$catIds = [];
foreach (['nature-adventure','family','culture-heritage'] as $slug) {
    $catIds[$slug] = $pdo->query("SELECT id FROM tour_categories WHERE slug='$slug'")->fetchColumn();
}
echo "Sapa ID: $sapaId\n";

// Sapa tours
$sapaTours = [
    ['Sapa trekking - Mu Cang Chai rice terraces 2 days', 'sapa-mu-cang-chai-rice-terraces',
     'Trekking qua ruong bac thang Mu Cang Chai noi tieng va lang ban Hmong, Dao.',
     'Ruong bac thang Mu Cang Chai, Lang ban Hmong, Trekking, Hoang gia tra',
     'Xe limousine, Khach san, Bua sang, Guide',
     'Bua trua, Chi phi ca nhan, VAT',
     2, 1, 10, 1, 'HARD', 2200000, 1700000, 4.85, 158, 1, $catIds['nature-adventure']],
    ['Sapa - Fansipan summit cable car adventure', 'sapa-fansipan-cable-car',
     'Len dinh Fansipan - noc nha Dong Duong bang cap treo hien dai va leo bac thang cuoi cung.',
     'Cap treo Fansipan, Dinh Fansipan 3143m, Chua vang, Viewpoint',
     'Cap treo, Guide, Ve tham quan, Bua trua',
     'Chi phi ca nhan, Tips, VAT',
     1, 0, 15, 1, 'MEDIUM', 1850000, 1450000, 4.80, 210, 1, $catIds['nature-adventure']],
    ['Sapa - Cat Cat & Ta Phin village homestay experience', 'sapa-cat-cat-ta-phin-homestay',
     'O homestay tai ban Cat Cat va Ta Phin, hoc det vai va thuong thuc am thuc nui rung.',
     'Ban Cat Cat, Ban Ta Phin, Homestay, Hoc det vai',
     'Xe, Homestay, Bua an, Guide',
     'Mua dac sac, Chi phi ca nhan, VAT',
     2, 1, 10, 1, 'EASY', 1650000, 1250000, 4.75, 95, 0, $catIds['family']],
    ['Sapa - Tea hill & ethnic minority market tour', 'sapa-tea-hill-ethnic-market',
     'Tham doi che Sapa va cho phien cua dong bao dan toc Hmong, Dao moi cuoi tuan.',
     'Doi che Sapa, Cho phien, Thac Bac, Thung lung Muong Hoa',
     'Xe, Guide, Bua trua, Ve tham quan',
     'Mua dac sac, Chi phi ca nhan, VAT',
     1, 0, 12, 1, 'EASY', 950000, 750000, 4.70, 72, 0, $catIds['culture-heritage']],
];

$insertTour = $pdo->prepare("
    INSERT IGNORE INTO tours (category_id, city_id, operator_id, title, slug, description, highlights, includes, excludes, duration_days, duration_nights, max_group_size, min_group_size, difficulty, price_per_adult, price_per_child, avg_rating, review_count, is_featured, is_active, created_at, updated_at)
    VALUES (?,?,NULL,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
");

$tourIdBySlug = [];
foreach ($sapaTours as $t) {
    list($title, $slug, $desc, $highlights, $includes, $excludes, $durDays, $durNights, $maxGs, $minGs, $diff, $priceA, $priceC, $rating, $reviews, $featured, $catId) = $t;
    $insertTour->execute([
        $catId, $sapaId, $title, $slug, $desc, $highlights, $includes, $excludes,
        $durDays, $durNights, $maxGs, $minGs, $diff, $priceA, $priceC,
        $rating, $reviews, $featured, 1, $now, $now
    ]);
    $id = $pdo->lastInsertId();
    if ($id) {
        $tourIdBySlug[$slug] = $id;
        echo "Tour: $slug (ID: $id)\n";
    }
}

// Images
$sapaImages = [
    'sapa-mu-cang-chai-rice-terraces' => 'https://images.unsplash.com/photo-1596659868923-d1e0e5d5a0a9?w=1600&q=80',
    'sapa-fansipan-cable-car' => 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80',
    'sapa-cat-cat-ta-phin-homestay' => 'https://images.unsplash.com/photo-1551703599-1df74b0141d5?w=1600&q=80',
    'sapa-tea-hill-ethnic-market' => 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80',
];
$insertImg = $pdo->prepare("INSERT IGNORE INTO tour_images (tour_id, url, alt_text, is_cover, sort_order) VALUES (?,?,?,1,1)");
foreach ($sapaImages as $slug => $url) {
    if (!isset($tourIdBySlug[$slug])) continue;
    $insertImg->execute([$tourIdBySlug[$slug], $url, $slug]);
    echo "Image: $slug\n";
}

// Itinerary
$sapaItineraries = [
    'sapa-mu-cang-chai-rice-terraces' => [
        [1, 'Limousine to Sapa & Village walk', 'Xe limousine tu Ha Noi den Sapa, di bo tham ban lang Hmong va Dao.'],
        [2, 'Mu Cang Chai rice terraces trek', 'Trekking qua ruong bac thang Mu Cang Chai, tham ban nguoi Hmong va Dao, ve Ha Noi.'],
    ],
    'sapa-fansipan-cable-car' => [
        [1, 'Fansipan cable car summit', 'Cap treo len dinh Fansipan, leo bac thang cuoi cung, chua vang va view dinh nui.'],
    ],
    'sapa-cat-cat-ta-phin-homestay' => [
        [1, 'Cat Cat & Ta Phin village', 'Tham ban Cat Cat va Ta Phin, hoc det vai, o homestay va thuong thuc am thuc nui rung.'],
        [2, 'Ta Phin cave & hot spring', 'Tham hang Ta Phin, tam suoi nuoc nong va ve Sapa.'],
    ],
    'sapa-tea-hill-ethnic-market' => [
        [1, 'Tea hill & ethnic market', 'Tham doi che Sapa, thac Bac, thung lung Muong Hoa va cho phien cuoi tuan.'],
    ],
];
$maxItinId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_itinerary")->fetchColumn();
$insertItin = $pdo->prepare("INSERT IGNORE INTO tour_itinerary (id, tour_id, day_number, title, description) VALUES (?,?,?,?,?)");
foreach ($sapaItineraries as $slug => $items) {
    if (!isset($tourIdBySlug[$slug])) continue;
    foreach ($items as $item) {
        $maxItinId++;
        $insertItin->execute([$maxItinId, $tourIdBySlug[$slug], $item[0], $item[1], $item[2]]);
    }
}
echo "Itinerary done.\n";

// Departures
$sapaDepartures = [
    'sapa-mu-cang-chai-rice-terraces' => [[7, 6, null], [14, 5, 2150000]],
    'sapa-fansipan-cable-car' => [[3, 10, null], [8, 8, 1800000]],
    'sapa-cat-cat-ta-phin-homestay' => [[5, 6, null], [12, 5, null]],
    'sapa-tea-hill-ethnic-market' => [[4, 8, null], [10, 6, null]],
];
$maxDepId = (int)$pdo->query("SELECT COALESCE(MAX(id), 0) FROM tour_departures")->fetchColumn();
$insertDep = $pdo->prepare("INSERT IGNORE INTO tour_departures (id, tour_id, departure_date, available_slots, price_override) VALUES (?,?,?,?,?)");
foreach ($sapaDepartures as $slug => $items) {
    if (!isset($tourIdBySlug[$slug])) continue;
    foreach ($items as $dep) {
        $maxDepId++;
        $depDate = date('Y-m-d', strtotime("+{$dep[0]} days"));
        $insertDep->execute([$maxDepId, $tourIdBySlug[$slug], $depDate, $dep[1], $dep[2]]);
    }
}
echo "Departures done.\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Final counts
$counts = $pdo->query("
    SELECT 'Tours' as item, COUNT(*) as cnt FROM tours WHERE is_active = TRUE
    UNION ALL SELECT 'Tour Images', COUNT(*) FROM tour_images
    UNION ALL SELECT 'Itinerary Items', COUNT(*) FROM tour_itinerary
    UNION ALL SELECT 'Tour Departures', COUNT(*) FROM tour_departures
")->fetchAll(PDO::FETCH_ASSOC);

echo "\n=== FINAL COUNTS ===\n";
foreach ($counts as $row) {
    echo $row['item'] . ': ' . $row['cnt'] . "\n";
}
echo "\nALL DONE!\n";

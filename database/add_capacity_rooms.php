<?php
/**
 * Add room types for different adult capacities
 */
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->exec("SET SESSION wait_timeout = 28800");

echo "========================================\n";
echo "  ADD ROOM TYPES FOR MORE ADULTS\n";
echo "========================================\n\n";

// Check current distribution
echo "📊 Current room types by capacity:\n";
$current = $pdo->query("
    SELECT max_adults, COUNT(*) as cnt FROM room_types
    WHERE is_active = TRUE GROUP BY max_adults ORDER BY max_adults
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($current as $r) {
    echo "  👤 $r[max_adults] người: $r[cnt] phòng\n";
}
echo "\n";

// For each hotel, add room types for different adult capacities
echo "[1] Getting hotels...\n";
$hotels = $pdo->query("
    SELECT h.id, h.name, h.star_rating, c.slug
    FROM hotels h
    JOIN cities c ON h.city_id = c.id
    WHERE h.is_active = TRUE
")->fetchAll(PDO::FETCH_ASSOC);
echo "Got " . count($hotels) . " hotels\n\n";

// Config
$basePrices = [2 => 450000, 3 => 600000, 4 => 750000, 5 => 900000, 6 => 1050000];
$starMult = [1 => 0.6, 2 => 0.75, 3 => 1.0, 4 => 1.3, 5 => 1.7];
$cityMult = [
    'ha-noi' => 1.3, 'ho-chi-minh' => 1.35, 'da-nang' => 1.2,
    'nha-trang' => 1.1, 'phu-quoc' => 1.25, 'da-lat' => 0.95,
    'hoi-an' => 1.1, 'hue' => 0.9, 'vung-tau' => 0.95, 'sa-pa' => 1.0,
];

// Room type names by capacity
$roomNames = [
    3 => ['Triple Room', 'Family Room', '3-Bed Room', 'Twin Deluxe'],
    4 => ['Quad Room', 'Family Suite', '4-Bed Room'],
    5 => ['Quintuple Room', 'Large Family Room'],
    6 => ['6-Bed Dorm', 'Group Room'],
];

// City multipliers (higher tier cities)
$cityTier = [
    'ho-chi-minh' => 2, 'ha-noi' => 2, 'da-nang' => 2,
    'nha-trang' => 1, 'phu-quoc' => 1, 'da-lat' => 1,
    'hoi-an' => 1, 'hue' => 0, 'vung-tau' => 0, 'sa-pa' => 0,
];

$insertCount = 0;
$batchSize = 200;
$batch = [];

foreach ($hotels as $h) {
    $starM = $starMult[$h['star_rating']] ?? 1.0;
    $cityM = $cityMult[$h['slug']] ?? 1.0;
    $cityT = $cityTier[$h['slug']] ?? 0;

    // Determine which capacities to add based on city tier
    $capacities = [3]; // Everyone gets 3-bed
    if ($cityT >= 1) $capacities[] = 4; // Major cities get 4-bed
    if ($cityT >= 2) $capacities[] = 5; // Top cities get 5-bed

    // 30% chance to add 6-bed for top cities
    if ($cityT >= 2 && mt_rand(1, 100) <= 30) {
        $capacities[] = 6;
    }

    foreach ($capacities as $cap) {
        $basePrice = $basePrices[$cap];
        $price = round($basePrice * $starM * $cityM * (0.85 + mt_rand(0, 300) / 1000) / 1000) * 1000;
        $price = max(300000, $price);

        $roomName = $roomNames[$cap][array_rand($roomNames[$cap])];
        $totalRooms = mt_rand(2, 8);

        $batch[] = "({$h['id']}, '$roomName', $cap, 0, $price, $totalRooms, 1, NOW(), NOW())";

        if (count($batch) >= $batchSize) {
            $sql = "INSERT INTO room_types (hotel_id, name, max_adults, max_children, base_price_per_night, total_rooms, is_active, created_at, updated_at) VALUES " . implode(',', $batch);
            $pdo->exec($sql);
            $insertCount += count($batch);
            echo ".";
            $batch = [];
        }
    }
}

// Insert remaining
if (!empty($batch)) {
    $sql = "INSERT INTO room_types (hotel_id, name, max_adults, max_children, base_price_per_night, total_rooms, is_active, created_at, updated_at) VALUES " . implode(',', $batch);
    $pdo->exec($sql);
    $insertCount += count($batch);
    echo ".";
}

echo "\n\n✅ Added $insertCount new room types\n\n";

// Verify
echo "📊 Updated room types by capacity:\n";
$updated = $pdo->query("
    SELECT max_adults, COUNT(*) as cnt FROM room_types
    WHERE is_active = TRUE GROUP BY max_adults ORDER BY max_adults
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($updated as $r) {
    echo "  👤 $r[max_adults] người: $r[cnt] phòng\n";
}

// Sample prices by capacity
echo "\n📋 HÀ NỘI - Giá theo số người:\n";
echo str_repeat('-', 60) . "\n";

$stats = $pdo->query("
    SELECT rt.max_adults,
           MIN(rt.base_price_per_night) as mn,
           MAX(rt.base_price_per_night) as mx,
           ROUND(AVG(rt.base_price_per_night)) as avg
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    JOIN cities c ON h.city_id = c.id
    WHERE c.slug = 'ha-noi' AND rt.is_active = TRUE
    GROUP BY rt.max_adults ORDER BY rt.max_adults
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($stats as $s) {
    echo sprintf("  👤 %d người: %s - %s VND (avg: %s)\n",
        $s['max_adults'],
        number_format($s['mn']), number_format($s['mx']), number_format($s['avg'])
    );
}

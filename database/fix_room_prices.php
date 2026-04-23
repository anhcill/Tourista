<?php
/**
 * Fix room prices - SIMPLE BATCH
 */
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$pdo->exec("SET SESSION wait_timeout = 28800");

echo "========================================\n";
echo "  FIX ROOM PRICES\n";
echo "========================================\n\n";

// Pre-compute prices and save to temp table
echo "[1] Creating price lookup...\n";
$pdo->exec("DROP TABLE IF EXISTS temp_room_prices");
$pdo->exec("CREATE TEMPORARY TABLE temp_room_prices (
    room_type_id BIGINT UNSIGNED PRIMARY KEY,
    new_price BIGINT UNSIGNED
)");

// Config
$basePrices = [2 => 450000, 3 => 600000, 4 => 750000, 5 => 900000, 6 => 1050000];
$starMult = [1 => 0.6, 2 => 0.75, 3 => 1.0, 4 => 1.3, 5 => 1.7];
$cityMult = [
    'ha-noi' => 1.3, 'ho-chi-minh' => 1.35, 'da-nang' => 1.2,
    'nha-trang' => 1.1, 'phu-quoc' => 1.25, 'da-lat' => 0.95,
    'hoi-an' => 1.1, 'hue' => 0.9, 'vung-tau' => 0.95, 'sa-pa' => 1.0,
];

$stmt = $pdo->query("
    SELECT rt.id, rt.hotel_id, rt.name, rt.max_adults,
           h.star_rating, c.slug
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    JOIN cities c ON h.city_id = c.id
    WHERE rt.is_active = TRUE
");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$insertSql = "INSERT INTO temp_room_prices (room_type_id, new_price) VALUES ";
$values = [];
$params = [];

foreach ($rows as $r) {
    $base = $basePrices[$r['max_adults']] ?? ($basePrices[2] * $r['max_adults'] / 2);
    $starM = $starMult[$r['star_rating']] ?? 1.0;
    $cityM = $cityMult[$r['slug']] ?? 1.0;

    $roomM = 1.0;
    if (stripos($r['name'], 'Suite') !== false) $roomM = 1.8;
    elseif (stripos($r['name'], 'Deluxe') !== false) $roomM = 1.45;
    elseif (stripos($r['name'], 'Superior') !== false) $roomM = 1.2;
    elseif (stripos($r['name'], 'Premium') !== false) $roomM = 1.6;
    elseif (stripos($r['name'], 'Family') !== false) $roomM = 1.3;

    $variation = 0.6 + (mt_rand(0, 800) / 1000); // 0.6 to 1.4 (40% variation each way)
    $price = round($base * $starM * $cityM * $roomM * $variation / 1000) * 1000;
    $price = max(300000, $price);

    $values[] = "(?, ?)";
    $params[] = $r['id'];
    $params[] = $price;
}

$stmt = $pdo->prepare($insertSql . implode(',', $values));
$stmt->execute($params);
echo "Created " . count($values) . " price entries\n\n";

echo "[2] Updating room_types...\n";
$updated = $pdo->exec("
    UPDATE room_types rt
    JOIN temp_room_prices trp ON rt.id = trp.room_type_id
    SET rt.base_price_per_night = trp.new_price
");
echo "Updated: $updated rows\n";

echo "[3] Skipping hotel price range update (columns not needed)...\n";

echo "\n========================================\n";
echo "  ✅ DONE\n";
echo "========================================\n\n";

echo "📋 HÀ NỘI - Sample:\n";
$samples = $pdo->query("
    SELECT h.name, h.star_rating, rt.name as rn, rt.max_adults, rt.base_price_per_night as price
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    JOIN cities c ON h.city_id = c.id
    WHERE c.slug = 'ha-noi'
    ORDER BY rt.max_adults, price LIMIT 15
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($samples as $r) {
    echo sprintf("%-22s | %d⭐ | %-10s | 👤%-d | %s\n",
        substr($r['name'], 0, 22), $r['star_rating'],
        substr($r['rn'], 0, 10), $r['max_adults'],
        number_format($r['price'])
    );
}

echo "\n📊 GIÁ THEO NGƯỜI:\n";
$stats = $pdo->query("
    SELECT rt.max_adults, COUNT(*) as cnt, MIN(rt.base_price_per_night) as mn, MAX(rt.base_price_per_night) as mx
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    JOIN cities c ON h.city_id = c.id
    WHERE c.slug = 'ha-noi' AND rt.is_active = TRUE
    GROUP BY rt.max_adults ORDER BY rt.max_adults
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($stats as $s) {
    echo sprintf("  👤 %d người: %s - %s VND (%d phòng)\n",
        $s['max_adults'], number_format($s['mn']), number_format($s['mx']), $s['cnt']
    );
}

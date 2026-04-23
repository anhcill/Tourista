<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "📊 TẤT CẢ CÁC THÀNH PHỐ - GIÁ THEO NGƯỜI:\n";
echo str_repeat('=', 75) . "\n\n";

$stats = $pdo->query("
    SELECT c.name_vi as city, c.slug,
           rt.max_adults,
           COUNT(*) as cnt,
           MIN(rt.base_price_per_night) as mn,
           MAX(rt.base_price_per_night) as mx,
           ROUND(AVG(rt.base_price_per_night)) as avg
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    JOIN cities c ON h.city_id = c.id
    WHERE rt.is_active = TRUE
    GROUP BY c.id, c.slug, c.name_vi, rt.max_adults
    ORDER BY c.name_vi, rt.max_adults
")->fetchAll(PDO::FETCH_ASSOC);

// Group by city
$cities = [];
foreach ($stats as $s) {
    $cities[$s['city']][] = $s;
}

foreach ($cities as $city => $rows) {
    echo "🏙️ $city\n";
    printf("  %-8s %8s %15s %15s %15s\n", "Người", "Phòng", "Min", "Max", "Avg");
    echo "  " . str_repeat('-', 55) . "\n";
    foreach ($rows as $r) {
        printf("  %-8d %8d %15s %15s %15s\n",
            $r['max_adults'], $r['cnt'],
            number_format($r['mn']), number_format($r['mx']), number_format($r['avg'])
        );
    }
    echo "\n";
}

// Show variety within same city/capacity
echo "📋 HÀ NỘI - Giá phòng 3 người (variety check):\n";
echo str_repeat('-', 75) . "\n";

$samples = $pdo->query("
    SELECT h.name, h.star_rating, rt.name as rn, rt.base_price_per_night as price
    FROM room_types rt
    JOIN hotels h ON rt.hotel_id = h.id
    JOIN cities c ON h.city_id = c.id
    WHERE c.slug = 'ha-noi' AND rt.max_adults = 3 AND rt.is_active = TRUE
    ORDER BY price
    LIMIT 15
")->fetchAll(PDO::FETCH_ASSOC);

foreach ($samples as $r) {
    echo sprintf("  %-25s | %d⭐ | %-12s | %s VND\n",
        substr($r['name'], 0, 25), $r['star_rating'],
        substr($r['rn'], 0, 12), number_format($r['price'])
    );
}

<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Check current hotel data
echo "=== CURRENT HOTEL DATA ===\n";
$hotels = $pdo->query("SELECT h.id, h.name, c.name_vi as city, h.star_rating, h.avg_rating, h.is_featured, h.is_active
    FROM hotels h JOIN cities c ON h.city_id = c.id ORDER BY c.name_vi, h.star_rating DESC")->fetchAll(PDO::FETCH_ASSOC);
echo "Total hotels: " . count($hotels) . "\n\n";
foreach ($hotels as $h) {
    echo "{$h['id']}. {$h['name']} | {$h['city']} | {$h['star_rating']}* | Rating: {$h['avg_rating']} | Featured: " . ($h['is_featured'] ? 'YES' : 'no') . "\n";
}

echo "\n=== HOTEL IMAGES ===\n";
echo "Total: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";

echo "\n=== ROOM TYPES ===\n";
$rooms = $pdo->query("SELECT rt.name, h.name as hotel, rt.max_adults, rt.base_price_per_night
    FROM room_types rt JOIN hotels h ON rt.hotel_id = h.id LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
echo "Sample room types:\n";
foreach ($rooms as $r) {
    echo "  {$r['hotel']} - {$r['name']} | Max: {$r['max_adults']} adults | Price: " . number_format($r['base_price_per_night']) . " VND\n";
}
echo "Total: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";

echo "\n=== HOTEL AMENITIES ===\n";
echo "Total: " . $pdo->query("SELECT COUNT(*) FROM hotel_amenities")->fetchColumn() . "\n";

echo "\n=== CITIES ===\n";
$cities = $pdo->query("SELECT name_vi, slug, is_popular FROM cities ORDER BY is_popular DESC, name_vi")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cities as $c) {
    echo "{$c['name_vi']} ({$c['slug']}) - Popular: " . ($c['is_popular'] ? 'YES' : 'no') . "\n";
}

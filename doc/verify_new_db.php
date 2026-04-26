<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== CHECK CRITICAL TABLES ===\n\n";

$criticalTables = [
    'users', 'roles', 'hotels', 'hotel_images', 'room_types',
    'tours', 'tour_images', 'cities', 'reviews',
    'conversations', 'chat_messages', 'conversation_sessions',
    'bookings', 'booking_hotel_details', 'booking_tour_details',
    'users', 'sessions', 'amenities', 'tour_itineraries',
    'article_categories', 'articles', 'promotions', 'pricing_rules'
];

$existingTables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

foreach ($criticalTables as $table) {
    $exists = in_array($table, $existingTables);
    echo ($exists ? "  [OK] " : "  [MISSING] ") . $table . "\n";
}

echo "\n=== FULL TABLE LIST ===\n";
foreach ($existingTables as $t) {
    $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "  $t ($count rows)\n";
}

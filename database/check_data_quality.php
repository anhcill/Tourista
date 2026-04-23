<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

echo "=== Hotel Flags ===\n";
echo "Total active hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1")->fetchColumn() . "\n";
echo "is_featured=1: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
echo "is_trending=1: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn() . "\n";
echo "both featured+trending: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1 AND is_trending=1")->fetchColumn() . "\n";

echo "\n=== Tour Flags ===\n";
echo "Total active tours: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1")->fetchColumn() . "\n";
echo "is_featured=1: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
echo "is_trending=1: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1 AND is_trending=1")->fetchColumn() . "\n";

echo "\n=== Promotions (active) ===\n";
echo "Total active: " . $pdo->query("SELECT COUNT(*) FROM promotions WHERE is_active=1")->fetchColumn() . "\n";
echo "Applies to ALL: " . $pdo->query("SELECT COUNT(*) FROM promotions WHERE is_active=1 AND applies_to='ALL'")->fetchColumn() . "\n";
echo "Applies to HOTEL: " . $pdo->query("SELECT COUNT(*) FROM promotions WHERE is_active=1 AND applies_to='HOTEL'")->fetchColumn() . "\n";
echo "Applies to TOUR: " . $pdo->query("SELECT COUNT(*) FROM promotions WHERE is_active=1 AND applies_to='TOUR'")->fetchColumn() . "\n";

$promos = $pdo->query("SELECT id, name, code, discount_type, discount_value, applies_to, valid_from, valid_until FROM promotions WHERE is_active=1 ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($promos as $p) {
    echo "  ID=$p[id] | $p[name] | $p[discount_type] $p[discount_value] | $p[applies_to]\n";
}

echo "\n=== Hotel room types ===\n";
echo "Total room types: " . $pdo->query("SELECT COUNT(*) FROM room_types WHERE is_active=1")->fetchColumn() . "\n";
echo "Hotels with rooms: " . $pdo->query("SELECT COUNT(DISTINCT hotel_id) FROM room_types WHERE is_active=1")->fetchColumn() . "\n";
echo "Hotels WITHOUT rooms: " . $pdo->query("SELECT COUNT(DISTINCT h.id) FROM hotels h LEFT JOIN room_types rt ON rt.hotel_id=h.id AND rt.is_active=1 WHERE h.is_active=1 AND rt.id IS NULL")->fetchColumn() . "\n";

echo "\n=== Hotel images ===\n";
echo "Total images: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";
echo "Hotels WITH images: " . $pdo->query("SELECT COUNT(DISTINCT hotel_id) FROM hotel_images")->fetchColumn() . "\n";
echo "Hotels WITHOUT images: " . $pdo->query("SELECT COUNT(DISTINCT h.id) FROM hotels h LEFT JOIN hotel_images hi ON hi.hotel_id=h.id WHERE h.is_active=1 AND hi.id IS NULL")->fetchColumn() . "\n";

<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
echo "Step 6: Bulk amenities for premium hotels (IDs 6147-6178)...\n";

$aIds = [];
$codes = ['wifi','parking','pool','gym','spa','restaurant','bar','breakfast','air_conditioning','room_service','airport_shuttle','pet_friendly','kids_club','beach_access','concierge'];
foreach ($codes as $code) {
    $aIds[$code] = $pdo->query("SELECT id FROM amenities WHERE code='$code'")->fetchColumn();
}

// Bulk insert amenities for premium hotels using INSERT IGNORE...SELECT
foreach ($codes as $code) {
    $aid = $aIds[$code];
    $sql = "INSERT IGNORE INTO hotel_amenities (hotel_id, amenity_id)
        SELECT id, $aid FROM hotels WHERE id BETWEEN 6147 AND 6178";
    $pdo->exec($sql);
    $count = $pdo->query("SELECT ROW_COUNT()")->fetchColumn();
    echo "  $code: $count rows\n";
}

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

echo "\n=== FINAL HOTEL COUNTS ===\n";
echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";
echo "Featured hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_featured = 1")->fetchColumn() . "\n";
echo "Hotel images: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";
echo "Room types: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";
echo "Hotel amenities: " . $pdo->query("SELECT COUNT(*) FROM hotel_amenities")->fetchColumn() . "\n";
echo "Amenities table: " . $pdo->query("SELECT COUNT(*) FROM amenities")->fetchColumn() . "\n";
echo "\nALL DONE!\n";

<?php
/**
 * Investigate tables that failed AUTO_INCREMENT
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

$failedTables = [
    'booking_hotel_details',
    'booking_tour_details',
    'users',
    'hotels',
    'room_types',
    'tours',
    'tour_departures',
    'tour_categories',
    'reviews',
    'review_images',
    'favorites',
    'promotions',
    'tour_images',
    'hotel_images',
    'email_verification_tokens',
    'login_attempts',
    'audit_logs',
    'roles',
    'cities',
    'amenities',
];

foreach ($failedTables as $table) {
    echo "=== {$table} ===\n";

    // Column info
    $stmt = $pdo->prepare("SHOW FULL COLUMNS FROM `{$table}`");
    $stmt->execute();
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $col) {
        echo "  Column: {$col['Field']} | Type: {$col['Type']} | Null: {$col['Null']} | Key: {$col['Key']} | Extra: {$col['Extra']}\n";
    }

    // Index info
    echo "  Indexes: ";
    $stmt2 = $pdo->prepare("SHOW INDEX FROM `{$table}`");
    $stmt2->execute();
    $indexes = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    $idxNames = array_unique(array_column($indexes, 'Key_name'));
    echo implode(', ', $idxNames) . "\n";

    echo "\n";
}

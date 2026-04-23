<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Xoa du lieu trong bang...\n\n";

$tables = [
    'reviews',
    'hotel_images',
    'hotels',
    'users',
    'stg_hotels_reviews_csv',
    'import_hotel_source_map',
];

foreach ($tables as $table) {
    try {
        $pdo->exec("TRUNCATE TABLE $table");
        echo "✓ Da xoa: $table\n";
    } catch (Exception $e) {
        echo "✗ Loi: $table - " . $e->getMessage() . "\n";
    }
}

echo "\n✅ Xong!\n";

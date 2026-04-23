<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Xoa du lieu...\n\n";

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
        $pdo->exec("DROP TABLE IF EXISTS $table");
        echo "✓ Da xoa: $table\n";
    } catch (Exception $e) {
        echo "✗ Loi xoa $table: " . $e->getMessage() . "\n";
    }
}

echo "\nKiem tra lai:\n";
$check = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
echo "Users: $check\n";
$check = $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn();
echo "Hotels: $check\n";
$check = $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
echo "Reviews: $check\n";

echo "\n✅ Xong!\n";

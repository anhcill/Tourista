<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== PRE-IMPORT CHECK ===\n\n";

// 1. CSV file
echo "[1] CSV File:\n";
$csvFiles = [
    __DIR__ . '/../data/hotels_users_ratings.csv',
    __DIR__ . '/data/hotels_users_ratings.csv',
    'C:/Users/ducan/Downloads/archive (1)/hotels_users_ratings.csv',
];
$csvFound = false;
foreach ($csvFiles as $f) {
    if (file_exists($f)) {
        $lines = count(file($f));
        echo "  FOUND: $f ($lines lines)\n";
        $csvFound = true;
        $csvPath = $f;
        break;
    }
}
if (!$csvFound) echo "  NOT FOUND in any expected location\n";

// 2. Cities
echo "\n[2] Cities:\n";
$cities = $pdo->query("SELECT id, name_vi, name_en, slug FROM cities ORDER BY id")->fetchAll();
echo "  Total: " . count($cities) . " cities\n";
foreach ($cities as $c) echo "  {$c['id']}: {$c['name_vi']} / {$c['name_en']}\n";

// 3. Roles
echo "\n[3] Roles:\n";
$roles = $pdo->query("SELECT id, name FROM roles ORDER BY id")->fetchAll();
foreach ($roles as $r) echo "  {$r['id']}: {$r['name']}\n";

// 4. Current data counts
echo "\n[4] Current row counts:\n";
foreach (['users', 'hotels', 'reviews', 'hotel_images', 'stg_hotels_reviews_csv'] as $t) {
    try {
        $cnt = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "  $t: $cnt\n";
    } catch (Exception $e) {
        echo "  $t: TABLE NOT EXISTS\n";
    }
}

// 5. Check staging table structure
echo "\n[5] stg_hotels_reviews_csv structure:\n";
try {
    $cols = $pdo->query("DESCRIBE stg_hotels_reviews_csv")->fetchAll();
    foreach ($cols as $c) echo "  {$c['Field']} | {$c['Type']}\n";
} catch (Exception $e) {
    echo "  Table does not exist - needs to be created\n";
}

echo "\nDone.\n";

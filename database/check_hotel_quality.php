<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD'
);

echo "=== Hotel table schema ===\n";
$cols = $pdo->query("SHOW COLUMNS FROM hotels")->fetchAll(PDO::FETCH_NUM);
foreach ($cols as $r) printf("%-25s | %s\n", $r[0], $r[1]);

echo "\n=== Sample hotel data ===\n";
$h = $pdo->query("SELECT * FROM hotels WHERE city_id = 1 LIMIT 1")->fetch(PDO::FETCH_ASSOC);
foreach ($h as $k => $v) {
    if (strlen($v) > 50) $v = substr($v, 0, 50) . "...";
    printf("%-25s: %s\n", $k, $v);
}

echo "\n=== Room types schema ===\n";
$cols = $pdo->query("SHOW COLUMNS FROM room_types")->fetchAll(PDO::FETCH_NUM);
foreach ($cols as $r) printf("%-25s | %s\n", $r[0], $r[1]);

echo "\n=== Room types count ===\n";
echo "Count: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";

echo "\n=== Hotel images ===\n";
echo "Total images: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";
$sample = $pdo->query("SELECT hotel_id, url FROM hotel_images LIMIT 5")->fetchAll();
foreach ($sample as $r) echo "  Hotel {$r[0]}: {$r[1]}\n";

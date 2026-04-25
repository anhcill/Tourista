<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "========================================\n";
echo "  VERIFY DB MOI\n";
echo "========================================\n\n";

$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "Tong bang: " . count($tables) . "\n\n";

$keyTables = ['users', 'hotels', 'reviews', 'hotel_images', 'cities', 'tours', 'roles'];
foreach ($keyTables as $t) {
    $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    $fks = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='$t' AND REFERENCED_TABLE_NAME IS NOT NULL")->fetchColumn();
    echo "  $t: $count rows, $fks FKs\n";
}

echo "\n✅ Ket noi DB moi: OK!\n";
echo "========================================\n";

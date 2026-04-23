<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== USERS ===\n";
$cols = $pdo->query('DESCRIBE users')->fetchAll();
foreach ($cols as $c) echo sprintf("  %-30s | %-40s | Null=%-3s | Default=%-15s | Key=%-3s | Extra=%s\n", $c['Field'], $c['Type'], $c['Null'], $c['Default'], $c['Key'], $c['Extra']);

echo "\n=== HOTELS ===\n";
$cols = $pdo->query('DESCRIBE hotels')->fetchAll();
foreach ($cols as $c) echo sprintf("  %-30s | %-40s | Null=%-3s | Default=%-15s | Key=%-3s | Extra=%s\n", $c['Field'], $c['Type'], $c['Null'], $c['Default'], $c['Key'], $c['Extra']);

echo "\n=== REVIEWS ===\n";
$cols = $pdo->query('DESCRIBE reviews')->fetchAll();
foreach ($cols as $c) echo sprintf("  %-30s | %-40s | Null=%-3s | Default=%-15s | Key=%-3s | Extra=%s\n", $c['Field'], $c['Type'], $c['Null'], $c['Default'], $c['Key'], $c['Extra']);

echo "\n=== HOTEL_IMAGES ===\n";
$cols = $pdo->query('DESCRIBE hotel_images')->fetchAll();
foreach ($cols as $c) echo sprintf("  %-30s | %-40s | Null=%-3s | Default=%-15s | Key=%-3s | Extra=%s\n", $c['Field'], $c['Type'], $c['Null'], $c['Default'], $c['Key'], $c['Extra']);

echo "\n=== FOREIGN KEYS ===\n";
$fkCheck = [
    'hotels' => ['city_id' => 'cities(id)', 'owner_id' => 'users(id)'],
    'reviews' => ['user_id' => 'users(id)', 'hotel_id' => 'hotels(id)'],
    'hotel_images' => ['hotel_id' => 'hotels(id)'],
];
foreach ($fkCheck as $tbl => $refs) {
    $fks = $pdo->query("
        SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'railway' AND TABLE_NAME = '$tbl' AND REFERENCED_TABLE_NAME IS NOT NULL
    ")->fetchAll(PDO::FETCH_ASSOC);
    echo "$tbl:\n";
    foreach ($refs as $col => $expected) {
        $found = false;
        foreach ($fks as $fk) {
            if ($fk['COLUMN_NAME'] == $col) {
                $ref = "{$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})";
                echo "  " . ($ref == $expected ? "OK" : "MISMATCH") . " $col -> $ref (expected: $expected)\n";
                $found = true;
                break;
            }
        }
        if (!$found) echo "  MISSING FK: $col -> $expected\n";
    }
}

echo "\n=== ROW COUNTS ===\n";
foreach (['users', 'hotels', 'reviews', 'hotel_images'] as $t) {
    $cnt = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo "  $t: $cnt rows\n";
}

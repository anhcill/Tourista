<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== CHECK FK on hotel_amenities ===\n\n";

$stmt = $pdo->query("
    SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'railway'
      AND TABLE_NAME = 'hotel_amenities'
      AND REFERENCED_TABLE_NAME IS NOT NULL
");
$fkRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($fkRows)) {
    echo "No FK constraints found on hotel_amenities.\n";
} else {
    foreach ($fkRows as $fk) {
        echo "FK: {$fk['CONSTRAINT_NAME']}\n";
        echo "  {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}.{$fk['REFERENCED_COLUMN_NAME']}\n";
    }
}

echo "\n=== Clean orphan hotel_amenities ===\n";
$stmt = $pdo->query("
    SELECT COUNT(*) as cnt
    FROM hotel_amenities ha
    LEFT JOIN amenities a ON a.id = ha.amenity_id
    WHERE a.id IS NULL
");
$orphanCount = $stmt->fetchColumn();
echo "Orphan entries before: $orphanCount\n";

if ($orphanCount > 0) {
    $pdo->exec("DELETE ha FROM hotel_amenities ha LEFT JOIN amenities a ON a.id = ha.amenity_id WHERE a.id IS NULL");
    echo "Deleted orphan entries.\n";

    $stmt = $pdo->query("
        SELECT COUNT(*) as cnt
        FROM hotel_amenities ha
        LEFT JOIN amenities a ON a.id = ha.amenity_id
        WHERE a.id IS NULL
    ");
    echo "Orphan entries after: " . $stmt->fetchColumn() . "\n";
}

echo "\nDone.\n";

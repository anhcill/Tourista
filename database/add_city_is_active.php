<?php
/**
 * Fix: Add is_active column to cities table on Railway
 * Run: php database/add_city_is_active.php
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "========================================\n";
echo "  ADD is_active TO cities TABLE\n";
echo "========================================\n\n";

// Check if column already exists
$columns = $pdo->query("SHOW COLUMNS FROM cities LIKE 'is_active'")->fetchAll();
if (count($columns) > 0) {
    echo "Column 'is_active' already exists in cities table.\n";
} else {
    echo "Adding 'is_active' column to cities...\n";
    $pdo->exec("ALTER TABLE cities ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER is_popular");
    echo "  Added is_active TINYINT(1) NOT NULL DEFAULT 1\n";
}

// Verify current cities
echo "\nCities status:\n";
$rows = $pdo->query("SELECT id, name_vi, name_en, is_active FROM cities ORDER BY id")->fetchAll(PDO::FETCH_NUM);
printf("%-4s %-20s %-20s %s\n", "ID", "Name (VI)", "Name (EN)", "Active");
echo str_repeat('-', 55) . "\n";
foreach ($rows as $r) {
    printf("%-4s %-20s %-20s %s\n", $r[0], substr($r[1],0,20), substr($r[2],0,20), $r[3] ? 'YES' : 'NO');
}
echo "\nDone!\n";

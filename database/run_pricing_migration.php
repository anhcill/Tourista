<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
echo "Connected to Railway DB.\n\n";

$sqlFile = __DIR__ . '/migration_create_pricing_rules.sql';
$sql = file_get_contents($sqlFile);
echo "Running migration: $sqlFile\n\n";

try {
    $pdo->exec($sql);
    echo "SUCCESS: pricing_rules table created or already exists.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\nVerifying table...\n";
try {
    $cols = $pdo->query("DESCRIBE pricing_rules")->fetchAll();
    echo "Columns:\n";
    foreach ($cols as $col) {
        echo "  - {$col['Field']} {$col['Type']}\n";
    }
} catch (PDOException $e) {
    echo "Could not describe table: " . $e->getMessage() . "\n";
}

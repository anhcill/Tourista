<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "conversations.id:\n";
$stmt = $pdo->query("DESCRIBE conversations");
foreach ($stmt->fetchAll() as $col) {
    if ($col['Field'] === 'id') {
        echo "  Type: " . $col['Type'] . "\n";
        echo "  Extra: " . $col['Extra'] . "\n";
    }
}

echo "\nFKs to conversations:\n";
$stmt = $pdo->query("SELECT TABLE_NAME, CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = 'railway' AND REFERENCED_TABLE_NAME = 'conversations'");
foreach ($stmt->fetchAll() as $fk) {
    echo "  - " . $fk['TABLE_NAME'] . "." . $fk['CONSTRAINT_NAME'] . "\n";
}

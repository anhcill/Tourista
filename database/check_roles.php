<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "Roles table structure:\n";
$cols = $pdo->query("DESCRIBE roles")->fetchAll();
foreach ($cols as $c) echo "  {$c['Field']}: {$c['Type']}\n";

echo "\nCurrent roles:\n";
$rows = $pdo->query("SELECT * FROM roles")->fetchAll();
if (empty($rows)) echo "  (empty)\n";
foreach ($rows as $r) print_r($r);

<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec("SET NAMES utf8mb4");

echo "Checking Vietnamese encoding in hotels table...\n\n";

$stmt = $pdo->query("SELECT id, name, address FROM hotels LIMIT 5");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "ID: " . $row['id'] . "\n";
    echo "Name: " . $row['name'] . "\n";
    echo "Address: " . $row['address'] . "\n";
    echo "---\n";
}

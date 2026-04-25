<?php
// Check if Railway backend is using Railway DB or local DB
// by checking a known Railway DB value

$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== Railway Database vs Local Database Check ===\n\n";

// Railway DB has 6473 users and admin@tourista.vn
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

    $railwayUsers = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "Railway DB: $railwayUsers users\n";

    $railwayAdmin = $pdo->query("SELECT email FROM users WHERE email = 'admin@tourista.vn'")->fetchColumn();
    echo "Railway DB admin: $railwayAdmin\n";

    echo "\nIf frontend shows 0, backend is NOT using Railway DB.\n";
    echo "Backend is likely using LOCAL MySQL database.\n";

} catch (PDOException $e) {
    echo "Railway DB connection failed: " . $e->getMessage() . "\n";
}

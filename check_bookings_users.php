<?php
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

$pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

echo "=== All Bookings with User Info ===\n";
$rows = $pdo->query("SELECT b.booking_code, b.status, b.total_amount, u.full_name, u.email 
    FROM bookings b 
    JOIN users u ON u.id = b.user_id 
    ORDER BY b.created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "- {$r['booking_code']} | {$r['status']} | " . number_format($r['total_amount']) . " | {$r['full_name']} | {$r['email']}\n";
}

echo "\n=== Check User Sessions/Tokens ===\n";
echo "(Check if there are duplicate tokens or session issues)\n";

echo "\n=== Total Users: ";
$cnt = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
echo "$cnt\n";

echo "\n=== Recent Users (last 10) ===\n";
$rows = $pdo->query("SELECT id, full_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "- ID:{$r['id']} | {$r['full_name']} | {$r['email']} | {$r['created_at']}\n";
}

<?php
// Kết nối Railway database
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== Database Railway Direct Query ===\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check tables exist
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . "\n\n";

    // Main stats
    echo "1. Total Users: ";
    $result = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "$result\n";

    echo "2. Total Hotels (active): ";
    $result = $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active = TRUE")->fetchColumn();
    echo "$result\n";

    echo "3. Total Tours (active): ";
    $result = $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active = TRUE")->fetchColumn();
    echo "$result\n";

    echo "4. Total Bookings: ";
    $result = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
    echo "$result\n";

    echo "5. Total Reviews: ";
    $result = $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
    echo "$result\n";

    echo "6. Total Revenue (COMPLETED bookings): ";
    $result = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'COMPLETED'")->fetchColumn();
    echo number_format($result) . " VND\n";

    echo "\n7. Recent bookings:\n";
    $bookings = $pdo->query("SELECT booking_code, status, total_amount, created_at FROM bookings ORDER BY created_at DESC LIMIT 5");
    foreach ($bookings as $b) {
        echo "   - {$b['booking_code']}: {$b['status']} | " . number_format($b['total_amount']) . " VND | {$b['created_at']}\n";
    }

    echo "\n8. Admin user check:\n";
    $admin = $pdo->query("SELECT id, email, role_id FROM users WHERE email LIKE '%admin%' LIMIT 5");
    foreach ($admin as $a) {
        echo "   - ID:{$a['id']} | Email:{$a['email']} | Role:{$a['role_id']}\n";
    }

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

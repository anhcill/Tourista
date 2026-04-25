<?php
// Check bookings in Railway DB
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db   = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== Kết nối Railway DB ===\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
    ]);
    echo "Kết nối OK!\n\n";

    // Count bookings
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM bookings");
    $row = $stmt->fetch();
    echo "Tổng bookings: " . $row['total'] . "\n\n";

    // Sample bookings
    $stmt2 = $pdo->query("SELECT id, booking_code, status, total_amount, guest_name, created_at FROM bookings ORDER BY created_at DESC LIMIT 10");
    $bookings = $stmt2->fetchAll();

    if (empty($bookings)) {
        echo "KHÔNG CÓ bookings nào trong database!\n";
    } else {
        echo "Danh sách bookings (10 mới nhất):\n";
        foreach ($bookings as $b) {
            echo "- ID: {$b['id']}, Code: {$b['booking_code']}, Status: {$b['status']}, Amount: {$b['total_amount']}, Guest: {$b['guest_name']}, Created: {$b['created_at']}\n";
        }
    }

    // Also check booking_hotel_details
    echo "\n=== Booking Hotel Details ===\n";
    $stmt3 = $pdo->query("SELECT COUNT(*) as total FROM booking_hotel_details");
    $hd = $stmt3->fetch();
    echo "Tổng hotel details: " . $hd['total'] . "\n";

    // Check booking_tour_details
    echo "\n=== Booking Tour Details ===\n";
    $stmt4 = $pdo->query("SELECT COUNT(*) as total FROM booking_tour_details");
    $td = $stmt4->fetch();
    echo "Tổng tour details: " . $td['total'] . "\n";

} catch (PDOException $e) {
    echo "Lỗi: " . $e->getMessage() . "\n";
}

<?php
// Kết nối Railway database và chạy query tương tự StatisticsService
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

echo "=== StatisticsService SQL Tests ===\n\n";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

    // 1. Total Users
    $sql = "SELECT COUNT(*) FROM users";
    echo "1. Total Users: " . $pdo->query($sql)->fetchColumn() . "\n";

    // 2. Total Hotels (active)
    $sql = "SELECT COUNT(*) FROM hotels WHERE is_active = TRUE";
    echo "2. Total Hotels (active): " . $pdo->query($sql)->fetchColumn() . "\n";

    // 3. Total Tours (active)
    $sql = "SELECT COUNT(*) FROM tours WHERE is_active = TRUE";
    echo "3. Total Tours (active): " . $pdo->query($sql)->fetchColumn() . "\n";

    // 4. Total Bookings
    $sql = "SELECT COUNT(*) FROM bookings";
    echo "4. Total Bookings: " . $pdo->query($sql)->fetchColumn() . "\n";

    // 5. Total Reviews
    $sql = "SELECT COUNT(*) FROM reviews";
    echo "5. Total Reviews: " . $pdo->query($sql)->fetchColumn() . "\n";

    // 6. Pending Reviews
    $sql = "SELECT COUNT(*) FROM reviews WHERE admin_status = 'PENDING'";
    echo "6. Pending Reviews: " . $pdo->query($sql)->fetchColumn() . "\n";

    // 7. Pending Hotels
    $sql = "SELECT COUNT(*) FROM hotels WHERE admin_status = 'PENDING'";
    echo "7. Pending Hotels: " . $pdo->query($sql)->fetchColumn() . "\n";

    // 8. Pending Tours
    $sql = "SELECT COUNT(*) FROM tours WHERE admin_status = 'PENDING'";
    echo "8. Pending Tours: " . $pdo->query($sql)->fetchColumn() . "\n";

    // 9. Total Revenue
    $sql = "SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'COMPLETED'";
    echo "9. Total Revenue (COMPLETED): " . number_format($pdo->query($sql)->fetchColumn()) . " VND\n";

    // 10. Monthly Revenue
    $sql = "SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'COMPLETED' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')";
    echo "10. Monthly Revenue: " . number_format($pdo->query($sql)->fetchColumn()) . " VND\n";

    echo "\n=== All values above are from Railway DB ===\n";
    echo "Database has correct data. Backend should return these values.\n";

} catch (PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

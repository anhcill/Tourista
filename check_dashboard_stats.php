<?php
// Check dashboard stats queries in Railway DB
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db   = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_TIMEOUT => 10,
    ]);
    echo "=== Dashboard Stats Check ===\n\n";

    // 1. Total Users
    $r = $pdo->query("SELECT COUNT(*) as cnt FROM users")->fetch();
    echo "Total Users: {$r['cnt']}\n";

    // 2. Total Hotels (active)
    $r = $pdo->query("SELECT COUNT(*) as cnt FROM hotels WHERE is_active = TRUE")->fetch();
    echo "Total Hotels (active): {$r['cnt']}\n";

    // Check admin_status column
    $cols = $pdo->query("DESCRIBE hotels")->fetchAll();
    $hasAdminStatus = false;
    foreach ($cols as $col) {
        if ($col['Field'] === 'admin_status') {
            $hasAdminStatus = true;
            break;
        }
    }
    echo "Hotels has admin_status column: " . ($hasAdminStatus ? "YES" : "NO") . "\n";

    // Pending hotels
    if ($hasAdminStatus) {
        $r = $pdo->query("SELECT COUNT(*) as cnt FROM hotels WHERE admin_status = 'PENDING'")->fetch();
        echo "Pending Hotels: {$r['cnt']}\n";
    } else {
        echo "Pending Hotels: N/A (column missing)\n";
    }

    // 3. Total Tours (active)
    $r = $pdo->query("SELECT COUNT(*) as cnt FROM tours WHERE is_active = TRUE")->fetch();
    echo "Total Tours (active): {$r['cnt']}\n";

    // Check admin_status for tours
    $tourCols = $pdo->query("DESCRIBE tours")->fetchAll();
    $hasTourAdminStatus = false;
    foreach ($tourCols as $col) {
        if ($col['Field'] === 'admin_status') {
            $hasTourAdminStatus = true;
            break;
        }
    }
    echo "Tours has admin_status column: " . ($hasTourAdminStatus ? "YES" : "NO") . "\n";

    if ($hasTourAdminStatus) {
        $r = $pdo->query("SELECT COUNT(*) as cnt FROM tours WHERE admin_status = 'PENDING'")->fetch();
        echo "Pending Tours: {$r['cnt']}\n";
    } else {
        echo "Pending Tours: N/A (column missing)\n";
    }

    // 4. Total Bookings
    $r = $pdo->query("SELECT COUNT(*) as cnt FROM bookings")->fetch();
    echo "Total Bookings: {$r['cnt']}\n";

    // 5. Total Reviews
    $r = $pdo->query("SELECT COUNT(*) as cnt FROM reviews")->fetch();
    echo "Total Reviews: {$r['cnt']}\n";

    // Check reviews columns
    $reviewCols = $pdo->query("DESCRIBE reviews")->fetchAll();
    $hasReviewAdminStatus = false;
    foreach ($reviewCols as $col) {
        if ($col['Field'] === 'admin_status') {
            $hasReviewAdminStatus = true;
            break;
        }
    }
    echo "Reviews has admin_status column: " . ($hasReviewAdminStatus ? "YES" : "NO") . "\n";

    if ($hasReviewAdminStatus) {
        $r = $pdo->query("SELECT COUNT(*) as cnt FROM reviews WHERE admin_status = 'PENDING'")->fetch();
        echo "Pending Reviews: {$r['cnt']}\n";
    } else {
        echo "Pending Reviews: N/A (column missing)\n";
    }

    // 6. Total Revenue (COMPLETED bookings)
    $r = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'COMPLETED'")->fetch();
    echo "Total Revenue (COMPLETED): {$r['rev']}\n";

    // Monthly Revenue
    $r = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'COMPLETED' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')")->fetch();
    echo "Monthly Revenue: {$r['rev']}\n";

    // 7. Revenue by Month
    echo "\n=== Revenue by Month (COMPLETED) ===\n";
    $rows = $pdo->query("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as bookings, COALESCE(SUM(total_amount), 0) as revenue FROM bookings WHERE status = 'COMPLETED' AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC")->fetchAll();
    foreach ($rows as $row) {
        echo "- {$row['month']}: {$row['bookings']} bookings, revenue: {$row['revenue']}\n";
    }
    if (empty($rows)) echo "(no data)\n";

    // 8. Bookings by Month
    echo "\n=== Bookings by Month ===\n";
    $rows = $pdo->query("SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total, SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed, SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled, SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending FROM bookings WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY month ORDER BY month ASC")->fetchAll();
    foreach ($rows as $row) {
        echo "- {$row['month']}: total={$row['total']}, completed={$row['completed']}, cancelled={$row['cancelled']}, pending={$row['pending']}\n";
    }
    if (empty($rows)) echo "(no data)\n";

    // 9. Recent Bookings
    echo "\n=== Recent Bookings ===\n";
    $rows = $pdo->query("SELECT b.id, b.booking_code, b.status, b.total_amount, b.created_at, u.full_name as user_name FROM bookings b LEFT JOIN users u ON u.id = b.user_id ORDER BY b.created_at DESC LIMIT 5")->fetchAll();
    foreach ($rows as $row) {
        echo "- {$row['booking_code']} | {$row['status']} | {$row['total_amount']} | {$row['user_name']} | {$row['created_at']}\n";
    }
    if (empty($rows)) echo "(no data)\n";

    // 10. Top Destinations
    echo "\n=== Top Destinations ===\n";
    $rows = $pdo->query("SELECT c.name_vi, COUNT(DISTINCT t.id) as tour_count FROM cities c LEFT JOIN tours t ON t.city_id = c.id AND t.is_active = TRUE GROUP BY c.id, c.name_vi ORDER BY tour_count DESC LIMIT 10")->fetchAll();
    foreach ($rows as $row) {
        echo "- {$row['name_vi']}: {$row['tour_count']} tours\n";
    }
    if (empty($rows)) echo "(no data)\n";

    // Check bookings column names
    echo "\n=== Bookings Table Columns ===\n";
    $cols = $pdo->query("DESCRIBE bookings")->fetchAll();
    foreach ($cols as $col) {
        echo "- {$col['Field']}: {$col['Type']}\n";
    }

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

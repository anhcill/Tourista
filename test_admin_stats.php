<?php
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

$pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);

echo "=== Testing StatisticsService queries ===\n\n";

// Simulate StatisticsService queries
echo "1. Total Users:\n";
$sql = "SELECT COUNT(*) as cnt FROM users";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "2. Total Hotels (active):\n";
$sql = "SELECT COUNT(*) as cnt FROM hotels WHERE is_active = TRUE";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "3. Total Tours (active):\n";
$sql = "SELECT COUNT(*) as cnt FROM tours WHERE is_active = TRUE";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "4. Total Bookings:\n";
$sql = "SELECT COUNT(*) as cnt FROM bookings";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "5. Total Reviews:\n";
$sql = "SELECT COUNT(*) as cnt FROM reviews";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "6. Pending Reviews:\n";
$sql = "SELECT COUNT(*) as cnt FROM reviews WHERE admin_status = 'PENDING'";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "7. Pending Hotels:\n";
$sql = "SELECT COUNT(*) as cnt FROM hotels WHERE admin_status = 'PENDING'";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "8. Pending Tours:\n";
$sql = "SELECT COUNT(*) as cnt FROM tours WHERE admin_status = 'PENDING'";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['cnt']}\n\n";

echo "9. Total Revenue (COMPLETED):\n";
$sql = "SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'COMPLETED'";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['rev']}\n\n";

echo "10. Monthly Revenue:\n";
$sql = "SELECT COALESCE(SUM(total_amount), 0) as rev FROM bookings WHERE status = 'COMPLETED' AND created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
echo "   Result: {$r['rev']}\n\n";

echo "=== Checking Admin User ===\n";
$sql = "SELECT id, email, role_id FROM users WHERE email = 'admin@tourista.vn'";
$r = $pdo->query($sql)->fetch(PDO::FETCH_ASSOC);
if ($r) {
    echo "Admin user found: ID={$r['id']}, Email={$r['email']}, Role_ID={$r['role_id']}\n";
    
    // Check roles table
    echo "\nChecking roles table:\n";
    $roles = $pdo->query("SELECT id, name FROM roles")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($roles as $role) {
        echo "  Role ID:{$role['id']} = {$role['name']}\n";
    }
} else {
    echo "Admin user NOT found!\n";
}

echo "\n=== Checking if Railway app is running ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://tourista-backend.up.railway.app/api/home/stats");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "GET /api/home/stats => HTTP $httpCode\n";
if ($httpCode == 200) {
    $data = json_decode($response, true);
    echo "Response: " . json_encode($data, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "Response: $response\n";
}

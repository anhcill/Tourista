<?php
// Test API endpoint với admin token
$backendUrl = 'https://tourista-backend.up.railway.app';

// 1. Test health endpoint
echo "=== Test Backend Health ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/actuator/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "GET /actuator/health => HTTP $httpCode\n";
echo substr($response, 0, 500) . "\n\n";

// 2. Test home stats (public)
echo "=== Test Public Home Stats ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/home/stats');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "GET /api/home/stats => HTTP $httpCode\n";
$data = json_decode($response, true);
if ($httpCode == 200) {
    echo "Response keys: " . implode(', ', array_keys($data['data'] ?? [])) . "\n";
    echo "totalUsers: " . ($data['data']['totalUsers'] ?? 'N/A') . "\n";
    echo "totalHotels: " . ($data['data']['totalHotels'] ?? 'N/A') . "\n";
    echo "totalTours: " . ($data['data']['totalTours'] ?? 'N/A') . "\n";
} else {
    echo "Response: " . substr($response, 0, 300) . "\n";
}
echo "\n";

// 3. Test admin statistics (need admin token - check if endpoint exists)
echo "=== Test Admin Statistics ===\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/admin/statistics/dashboard');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer test_token']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "GET /api/admin/statistics/dashboard => HTTP $httpCode\n";
echo "Response: " . substr($response, 0, 500) . "\n";

// 4. Check database directly
echo "\n=== Database Direct Query ===\n";
$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$db = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass);
    $stats = [];
    
    $stats['totalUsers'] = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $stats['totalHotels'] = $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active = TRUE")->fetchColumn();
    $stats['totalTours'] = $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active = TRUE")->fetchColumn();
    $stats['totalBookings'] = $pdo->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
    $stats['totalReviews'] = $pdo->query("SELECT COUNT(*) FROM reviews")->fetchColumn();
    $stats['totalRevenue'] = $pdo->query("SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'COMPLETED'")->fetchColumn();
    
    echo "Direct DB query:\n";
    foreach ($stats as $key => $value) {
        echo "  $key: $value\n";
    }
} catch (PDOException $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}

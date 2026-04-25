<?php
// Backend đang chạy ở strong-beauty-production.up.railway.app
// Test endpoint đúng

$backendUrl = 'https://strong-beauty-production.up.railway.app';

echo "=== Test Backend (strong-beauty-production) ===\n\n";

// 1. Test /api/home/stats (public)
echo "1. GET /api/home/stats\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/home/stats');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP $httpCode\n";
$data = json_decode($response, true);
if ($httpCode == 200 && isset($data['data'])) {
    echo "   ✓ SUCCESS\n";
    echo "   Data: " . json_encode($data['data'], JSON_PRETTY_PRINT) . "\n";
} else {
    echo "   Response: " . substr($response, 0, 500) . "\n";
}

// 2. Test /api/home/dashboard-stats (public)
echo "\n2. GET /api/home/dashboard-stats\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/home/dashboard-stats');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP $httpCode\n";
$data = json_decode($response, true);
if ($httpCode == 200 && isset($data['data'])) {
    echo "   ✓ SUCCESS\n";
    echo "   Data keys: " . implode(', ', array_keys($data['data'])) . "\n";
    echo "   totalUsers: " . ($data['data']['totalUsers'] ?? 'N/A') . "\n";
    echo "   totalHotels: " . ($data['data']['totalHotels'] ?? 'N/A') . "\n";
    echo "   totalTours: " . ($data['data']['totalTours'] ?? 'N/A') . "\n";
} else {
    echo "   Response: " . substr($response, 0, 500) . "\n";
}

// 3. Check frontend env
echo "\n=== Checking Frontend API Config ===\n";
echo "Frontend uses: NEXT_PUBLIC_API_URL env variable\n";
echo "Expected value: https://strong-beauty-production.up.railway.app\n";
echo "Current fallback: http://localhost:8080/api\n";

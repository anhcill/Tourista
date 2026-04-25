<?php
$backendUrl = 'https://tourista-backend.up.railway.app';

echo "=== Test Backend Endpoints ===\n\n";

// Test home stats (public endpoint)
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
    echo "   Data keys: " . implode(', ', array_keys($data['data'])) . "\n";
    echo "   totalUsers: " . ($data['data']['totalUsers'] ?? 'N/A') . "\n";
    echo "   totalHotels: " . ($data['data']['totalHotels'] ?? 'N/A') . "\n";
    echo "   totalTours: " . ($data['data']['totalTours'] ?? 'N/A') . "\n";
} else {
    echo "   Response: " . substr($response, 0, 200) . "\n";
}

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
    echo "   Data: " . json_encode($data['data'], JSON_PRETTY_PRINT) . "\n";
} else {
    echo "   Response: " . substr($response, 0, 200) . "\n";
}

echo "\n3. GET /api/admin/statistics/dashboard (with mock token)\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/admin/statistics/dashboard');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP $httpCode\n";
$data = json_decode($response, true);
if ($httpCode == 200 && isset($data['data'])) {
    echo "   Stats: " . json_encode($data['data'], JSON_PRETTY_PRINT) . "\n";
} else {
    echo "   Response: " . substr($response, 0, 300) . "\n";
}

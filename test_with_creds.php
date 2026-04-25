<?php
$backendUrl = 'https://strong-beauty-production.up.railway.app';

echo "=== Test Admin Dashboard with credentials ===\n\n";

// 1. Login
echo "1. Login...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@tourista.vn',
    'password' => 'Admin@12345'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);
$token = $data['data']['token'] ?? null;

if ($token) {
    echo "   ✓ Login success!\n\n";

    // 2. Get Dashboard Stats
    echo "2. GET /api/admin/statistics/dashboard\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/admin/statistics/dashboard');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "   HTTP $httpCode\n";
    $stats = json_decode($response, true);

    if ($httpCode == 200 && isset($stats['data'])) {
        echo "\n   ✓ Dashboard Data:\n";
        echo json_encode($stats['data'], JSON_PRETTY_PRINT);
    } else {
        echo "   Response: " . substr($response, 0, 500) . "\n";
    }
} else {
    echo "   ✗ Login failed\n";
    echo "   Response: " . substr($response, 0, 300) . "\n";
}

<?php
// Lấy admin token trước
$loginUrl = 'https://strong-beauty-production.up.railway.app/api/auth/login';

echo "=== Test Admin Dashboard ===\n\n";

// 1. Login để lấy token
echo "1. Login as admin\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $loginUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@tourista.vn',
    'password' => 'admin123'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$loginData = json_decode($response, true);
$token = $loginData['data']['token'] ?? null;

if ($token) {
    echo "   ✓ Login success, token: " . substr($token, 0, 50) . "...\n\n";

    // 2. Gọi dashboard stats
    echo "2. GET /api/admin/statistics/dashboard\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://strong-beauty-production.up.railway.app/api/admin/statistics/dashboard');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "   HTTP $httpCode\n";
    $data = json_decode($response, true);
    if ($httpCode == 200 && isset($data['data'])) {
        echo "   ✓ SUCCESS\n";
        echo "   Response data:\n";
        echo "   " . json_encode($data['data'], JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "   Response: " . substr($response, 0, 500) . "\n";
    }
} else {
    echo "   ✗ Login failed\n";
    echo "   Response: " . substr($response, 0, 500) . "\n";
}

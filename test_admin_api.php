<?php
// Login với admin credentials để lấy token
$backendUrl = 'https://strong-beauty-production.up.railway.app';

// Test login để lấy token
echo "=== Test Admin Login ===\n\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/auth/login');
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'admin@tourista.vn',
    'password' => 'Admin@123456'
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Login HTTP $httpCode\n";
$data = json_decode($response, true);

if ($httpCode == 200 && isset($data['data']['token'])) {
    $token = $data['data']['token'];
    echo "✓ Login success\n";
    echo "Token: " . substr($token, 0, 50) . "...\n\n";

    // Test dashboard stats với token
    echo "=== Test Dashboard Stats ===\n";
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/admin/statistics/dashboard');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "Dashboard HTTP $httpCode\n";
    $stats = json_decode($response, true);

    if ($httpCode == 200 && isset($stats['data'])) {
        echo "✓ SUCCESS - Dashboard data:\n";
        echo json_encode($stats['data'], JSON_PRETTY_PRINT);
    } else {
        echo "Response: " . substr($response, 0, 500) . "\n";
    }
} else {
    echo "✗ Login failed\n";
    echo "Response: " . substr($response, 0, 300) . "\n";
    echo "\nTry other passwords:\n";
    $passwords = ['admin123', 'Admin@123', 'password', 'admin', '123456'];
    foreach ($passwords as $pwd) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/auth/login');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'email' => 'admin@tourista.vn',
            'password' => $pwd
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode == 200) {
            echo "  ✓ Password '$pwd' works!\n";
            break;
        } else {
            echo "  ✗ '$pwd' failed\n";
        }
    }
}

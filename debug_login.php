<?php
$backendUrl = 'https://strong-beauty-production.up.railway.app';

echo "=== Debug Login Issue ===\n\n";

// Try different login formats
$tests = [
    ['email' => 'admin@tourista.vn', 'password' => 'Admin@12345'],
    ['email' => 'admin@tourista.vn', 'password' => 'Admin@12345', 'grant_type' => 'password'],
    ['username' => 'admin@tourista.vn', 'password' => 'Admin@12345'],
];

foreach ($tests as $i => $data) {
    echo "Test " . ($i+1) . ": " . json_encode($data) . "\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $backendUrl . '/api/auth/login');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "   HTTP $httpCode: " . substr($response, 0, 200) . "\n\n";
}

// Try to access a public endpoint
echo "=== Test Public Endpoints ===\n";
$publicEndpoints = [
    '/api/home/stats',
    '/api/hotels',
    '/api/tours',
    '/api/cities',
];

foreach ($publicEndpoints as $endpoint) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $backendUrl . $endpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "$endpoint => HTTP $httpCode\n";
    if ($httpCode == 200) {
        $data = json_decode($response, true);
        echo "   ✓ Data keys: " . implode(', ', array_keys($data['data'] ?? ['N/A'])) . "\n";
    }
}

<?php
// Test cả 2 backend
echo "=== Test Both Backend Sources ===\n\n";

$backends = [
    'Localhost' => 'http://localhost:8080',
    'Railway' => 'https://strong-beauty-production.up.railway.app'
];

foreach ($backends as $name => $url) {
    echo "--- $name ($url) ---\n";

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url . '/api/home/stats');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode == 200) {
        $data = json_decode($response, true);
        echo "  ✓ HTTP 200\n";
        if (isset($data['data'])) {
            echo "  totalUsers: " . ($data['data']['totalUsers'] ?? 'N/A') . "\n";
            echo "  totalHotels: " . ($data['data']['totalHotels'] ?? 'N/A') . "\n";
            echo "  totalTours: " . ($data['data']['totalTours'] ?? 'N/A') . "\n";
        }
    } else {
        echo "  ✗ HTTP $httpCode: " . substr($response, 0, 100) . "\n";
    }
    echo "\n";
}

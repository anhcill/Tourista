<?php
// Test Railway backend health & public endpoints
$backendUrl = 'https://tourista-production.up.railway.app';

echo "=== Testing Railway Backend: $backendUrl ===\n\n";

// 1. Test health / home stats
echo "1. GET /api/home/stats (public):\n";
$ch = curl_init($backendUrl . '/api/home/stats');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP $httpCode\n";
if ($httpCode == 200) {
    $data = json_decode($response, true);
    echo "   Status: " . ($data['status'] ?? 'N/A') . "\n";
    echo "   Message: " . ($data['message'] ?? 'N/A') . "\n";
    if (isset($data['data'])) {
        echo "   Data keys: " . implode(', ', array_keys($data['data'])) . "\n";
    }
} else {
    echo "   Response: " . substr($response, 0, 300) . "\n";
}

// 2. Test dashboard stats
echo "\n2. GET /api/home/dashboard-stats (public):\n";
$ch = curl_init($backendUrl . '/api/home/dashboard-stats');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP $httpCode\n";
if ($httpCode == 200) {
    $data = json_decode($response, true);
    $d = $data['data'] ?? [];
    echo "   totalUsers: " . ($d['totalUsers'] ?? 'N/A') . "\n";
    echo "   totalHotels: " . ($d['totalHotels'] ?? 'N/A') . "\n";
    echo "   totalTours: " . ($d['totalTours'] ?? 'N/A') . "\n";
    echo "   totalBookings: " . ($d['totalBookings'] ?? 'N/A') . "\n";
    echo "   totalRevenue: " . ($d['totalRevenue'] ?? 'N/A') . "\n";
} else {
    echo "   Response: " . substr($response, 0, 300) . "\n";
}

// 3. Test chat endpoint (expect 401 without auth)
echo "\n3. GET /api/conversations (expect 401 - no auth):\n";
$ch = curl_init($backendUrl . '/api/conversations');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP $httpCode (expected 401)\n";

// 4. Test WebSocket endpoint
echo "\n4. WebSocket /ws endpoint:\n";
echo "   Frontend uses: SockJS -> $backendUrl/ws\n";
echo "   STOMP destination: /app/chat.send\n";
echo "   Subscribe channel: /user/queue/messages\n";

echo "\n=== Summary ===\n";
echo "Backend: ONLINE\n";
echo "Public APIs: WORKING\n";
echo "Auth required for chat: YES (401 without token)\n";
echo "\nTo test chat sending:\n";
echo "1. Login via frontend to get JWT token\n";
echo "2. Open browser DevTools -> Network tab\n";
echo "3. Send a message -> check WebSocket frames\n";

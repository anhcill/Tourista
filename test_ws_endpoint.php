<?php
/**
 * Test WebSocket endpoint accessibility
 */

$backendUrl = 'https://tourista-production.up.railway.app';

echo "=== Test WebSocket Endpoint ===\n\n";

// Test 1: SockJS info endpoint (HTTP GET)
echo "1. GET /ws/info:\n";
$ch = curl_init($backendUrl . '/ws/info');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP Code: $httpCode\n";
echo "   Response: " . substr($result, 0, 200) . "\n\n";

// Test 2: WebSocket upgrade
echo "2. WebSocket Upgrade to /ws:\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $backendUrl . '/ws');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
    'Sec-WebSocket-Version: 13'
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "   HTTP Code: $httpCode\n";
echo "   (101 = Switching Protocols = WebSocket OK)\n\n";

// Test 3: Check if /ws is blocked by security (should return 403 or 405 if security blocked)
echo "3. Check CORS headers on /ws:\n";
$ch = curl_init($backendUrl . '/ws');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Origin: https://tourista-nine.vercel.app',
    'Access-Control-Request-Method: GET'
]);
$result = curl_exec($ch);
curl_close($ch);

// Parse headers
$parts = explode("\r\n\r\n", $result);
$headerStr = $parts[0] ?? '';
$headers = [];
foreach (explode("\r\n", $headerStr) as $line) {
    if (strpos($line, ':') !== false) {
        [$k, $v] = explode(':', $line, 2);
        $headers[strtolower(trim($k))] = trim($v);
    }
}
echo "   HTTP Code: " . (isset($headers['http_code']) ? $headers['http_code'] : 'N/A') . "\n";
echo "   Access-Control-Allow-Origin: " . ($headers['access-control-allow-origin'] ?? 'NONE') . "\n";
echo "   Access-Control-Allow-Methods: " . ($headers['access-control-allow-methods'] ?? 'NONE') . "\n\n";

echo "=== DONE ===\n";

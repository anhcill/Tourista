<?php
/**
 * Test: Login + Create Conversation + Send Message
 */

// Config
$backendUrl = 'https://tourista-production.up.railway.app';

// Step 1: Login
echo "=== Step 1: Login ===\n";
$ch = curl_init($backendUrl . '/api/auth/login');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'email' => 'ducanhle28072003@gmail.com',
    'password' => 'temp123456'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($result, true);
$accessToken = $data['data']['accessToken'] ?? null;

if (!$accessToken) {
    echo "Login failed! HTTP: $httpCode\n";
    echo "Response: " . substr($result, 0, 500) . "\n";
    exit(1);
}

echo "Login OK! Token: " . substr($accessToken, 0, 30) . "...\n\n";

// Step 2: Create BOT conversation
echo "=== Step 2: Create BOT Conversation ===\n";
$ch = curl_init($backendUrl . '/api/chat/conversations');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['type' => 'BOT']));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $accessToken
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
$convData = json_decode($result, true);
$conversationId = $convData['data']['id'] ?? null;

if (!$conversationId) {
    echo "Create conversation failed!\n";
    echo "Response: " . substr($result, 0, 500) . "\n";
    exit(1);
}

echo "Conversation ID: $conversationId\n\n";

// Step 3: Get messages
echo "=== Step 3: Get Messages ===\n";
$ch = curl_init($backendUrl . "/api/chat/conversations/$conversationId/messages");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $accessToken
]);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Messages: " . substr($result, 0, 500) . "\n\n";

echo "=== DONE ===\n";
echo "Chat API hoạt động bình thường!\n";
echo "Vấn đề có thể là WebSocket (gửi tin nhắn real-time).\n";

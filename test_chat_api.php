<?php
// Test chat API
$backendUrl = 'https://tourista-production.up.railway.app';

echo "Testing Chat API...\n\n";

// Get conversations
echo "1. GET /api/conversations:\n";
$ch = curl_init($backendUrl . '/api/conversations');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
// Note: Need auth token
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "  HTTP Code: $httpCode\n";
echo "  Response: " . substr($result, 0, 500) . "\n\n";

// Test if chat endpoint exists
echo "2. POST /api/chat/send (without auth - expect 401):\n";
$ch = curl_init($backendUrl . '/api/chat/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['message' => 'test']));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$result = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "  HTTP Code: $httpCode\n";
echo "  Response: " . substr($result, 0, 500) . "\n";
